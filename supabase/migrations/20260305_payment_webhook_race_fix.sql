/**
 * Migration: Fix webhook race condition with atomic payment processing
 * Uses SELECT FOR UPDATE to prevent concurrent processing of the same order
 */
-- ============================================
-- RPC Function: Lock and process payment order
-- ============================================
CREATE OR REPLACE FUNCTION process_payment_order(
        p_order_code TEXT,
        p_amount NUMERIC,
        p_transaction_id TEXT,
        p_payload JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_order RECORD;
v_subscription RECORD;
v_result JSONB;
v_period_end TIMESTAMP WITH TIME ZONE;
v_now TIMESTAMP WITH TIME ZONE := NOW();
v_new_period_start TIMESTAMP WITH TIME ZONE;
v_is_promo BOOLEAN;
BEGIN -- Lock the order row to prevent concurrent processing
SELECT * INTO v_order
FROM payment_orders
WHERE order_code = p_order_code FOR
UPDATE NOWAIT;
-- Fail immediately if locked, don't wait
-- Order not found
IF NOT FOUND THEN RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'Order not found',
    'order_code',
    p_order_code
);
END IF;
-- Already paid - idempotency check
IF v_order.status = 'paid' THEN RETURN JSONB_BUILD_OBJECT(
    'success',
    TRUE,
    'message',
    'Order already processed',
    'order_id',
    v_order.id,
    'already_paid',
    TRUE
);
END IF;
-- Check if expired
IF v_order.expires_at < v_now THEN
UPDATE payment_orders
SET status = 'expired',
    updated_at = v_now
WHERE id = v_order.id;
RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'Order expired',
    'order_id',
    v_order.id
);
END IF;
-- Amount mismatch - requires manual review
IF p_amount < v_order.amount THEN -- Update order to manual_review
UPDATE payment_orders
SET status = 'manual_review',
    provider_transaction_id = p_transaction_id,
    updated_at = v_now
WHERE id = v_order.id;
-- Create manual review record
INSERT INTO manual_reviews (
        user_id,
        order_code,
        transaction_id,
        amount,
        reason,
        raw_payload,
        status,
        created_at
    )
VALUES (
        v_order.user_id,
        p_order_code,
        p_transaction_id,
        p_amount,
        'Amount mismatch: expected ' || v_order.amount || ', got ' || p_amount,
        p_payload,
        'pending',
        v_now
    );
RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'Amount mismatch - manual review required',
    'order_id',
    v_order.id,
    'expected_amount',
    v_order.amount,
    'received_amount',
    p_amount
);
END IF;
-- Calculate subscription period
IF v_order.billing_cycle = 'quarterly' THEN v_period_end := v_now + INTERVAL '3 months';
ELSE v_period_end := v_now + INTERVAL '1 month';
END IF;
-- Check if promo was applied (amount less than standard price)
-- Standard prices: monthly = 49000, quarterly = 119000
v_is_promo := v_order.amount < CASE
    WHEN v_order.billing_cycle = 'quarterly' THEN 119000 -- 3 months at ~39k/month
    ELSE 49000 -- 1 month
END;
-- Update order to paid
UPDATE payment_orders
SET status = 'paid',
    paid_at = v_now,
    provider_transaction_id = p_transaction_id,
    updated_at = v_now
WHERE id = v_order.id;
-- Check for existing subscription
SELECT * INTO v_subscription
FROM subscriptions
WHERE user_id = v_order.user_id
    AND status = 'active' FOR
UPDATE;
-- Lock subscription row too
IF FOUND THEN -- Extend existing subscription
v_new_period_start := GREATEST(v_subscription.current_period_end, v_now);
UPDATE subscriptions
SET current_period_start = v_new_period_start,
    current_period_end = v_new_period_start + CASE
        WHEN v_order.billing_cycle = 'quarterly' THEN INTERVAL '3 months'
        ELSE INTERVAL '1 month'
    END,
    payment_provider = 'sepay',
    payment_provider_transaction_id = p_transaction_id,
    amount_paid = COALESCE(amount_paid, 0) + p_amount,
    updated_at = v_now
WHERE id = v_subscription.id;
ELSE -- Create new subscription
INSERT INTO subscriptions (
        user_id,
        plan,
        status,
        promo_applied,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        payment_provider,
        payment_provider_transaction_id,
        amount_paid,
        created_at,
        updated_at
    )
VALUES (
        v_order.user_id,
        v_order.plan,
        'active',
        v_is_promo,
        v_now,
        v_period_end,
        FALSE,
        'sepay',
        p_transaction_id,
        p_amount,
        v_now,
        v_now
    );
END IF;
-- Update user's premium status
UPDATE users
SET is_premium = TRUE,
    premium_until = v_period_end,
    updated_at = v_now
WHERE id = v_order.user_id;
-- Return success result
RETURN JSONB_BUILD_OBJECT(
    'success',
    TRUE,
    'order_id',
    v_order.id,
    'user_id',
    v_order.user_id,
    'amount',
    p_amount,
    'subscription_end',
    v_period_end,
    'is_promo',
    v_is_promo,
    'extended',
    v_subscription IS NOT NULL
);
EXCEPTION
WHEN lock_not_available THEN -- Another process is handling this order
RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'Order is being processed by another request',
    'order_code',
    p_order_code,
    'retry_after',
    2
);
WHEN OTHERS THEN -- Log error and return failure
RAISE WARNING 'Payment processing error: %',
SQLERRM;
RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    SQLERRM,
    'order_code',
    p_order_code
);
END;
$$;
-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) TO service_role;
-- Add comment for documentation
COMMENT ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) IS 'Atomically processes a payment order with row locking to prevent race conditions.
Called by the SePay webhook handler.
Parameters:
  - p_order_code: The ROOMZ order code
  - p_amount: The received payment amount
  - p_transaction_id: The provider transaction reference
  - p_payload: Optional full webhook payload for audit
Returns JSONB with success status and details.';