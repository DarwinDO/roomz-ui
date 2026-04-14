CREATE OR REPLACE FUNCTION process_payment_order(
    p_order_code TEXT,
    p_amount NUMERIC,
    p_transaction_id TEXT,
    p_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_subscription RECORD;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_new_period_start TIMESTAMP WITH TIME ZONE;
    v_is_promo BOOLEAN;
    v_extension_interval INTERVAL;
    v_has_active_subscription BOOLEAN := FALSE;
BEGIN
    SELECT *
    INTO v_order
    FROM payment_orders
    WHERE order_code = p_order_code
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', 'Order not found', 'order_code', p_order_code);
    END IF;

    IF v_order.status = 'paid' THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', TRUE,
            'message', 'Order already processed',
            'order_id', v_order.id,
            'already_paid', TRUE
        );
    END IF;

    IF v_order.expires_at < v_now THEN
        UPDATE payment_orders
        SET status = 'expired',
            updated_at = v_now
        WHERE id = v_order.id;

        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', 'Order expired', 'order_id', v_order.id);
    END IF;

    IF p_amount < v_order.amount THEN
        UPDATE payment_orders
        SET status = 'manual_review',
            provider_transaction_id = p_transaction_id,
            updated_at = v_now
        WHERE id = v_order.id;

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
            'success', FALSE,
            'error', 'Amount mismatch - manual review required',
            'order_id', v_order.id,
            'expected_amount', v_order.amount,
            'received_amount', p_amount
        );
    END IF;

    IF v_order.billing_cycle = 'quarterly' THEN
        v_extension_interval := INTERVAL '3 months';
    ELSE
        v_extension_interval := INTERVAL '1 month';
    END IF;

    v_is_promo := v_order.amount < CASE
        WHEN v_order.billing_cycle = 'quarterly' THEN 99000
        ELSE 39000
    END;

    SELECT *
    INTO v_subscription
    FROM subscriptions
    WHERE user_id = v_order.user_id
    FOR UPDATE;

    IF FOUND THEN
        v_has_active_subscription :=
            v_subscription.status = 'active'
            AND (v_subscription.current_period_end IS NULL OR v_subscription.current_period_end > v_now);

        IF v_has_active_subscription THEN
            v_new_period_start := GREATEST(COALESCE(v_subscription.current_period_end, v_now), v_now);
        ELSE
            v_new_period_start := v_now;
        END IF;

        v_period_end := v_new_period_start + v_extension_interval;

        UPDATE subscriptions
        SET plan = v_order.plan,
            status = 'active',
            promo_applied = COALESCE(v_subscription.promo_applied, FALSE) OR v_is_promo,
            current_period_start = v_new_period_start,
            current_period_end = v_period_end,
            cancel_at_period_end = FALSE,
            payment_provider = 'sepay',
            payment_provider_transaction_id = p_transaction_id,
            amount_paid = COALESCE(v_subscription.amount_paid, 0) + p_amount,
            updated_at = v_now
        WHERE id = v_subscription.id;
    ELSE
        v_new_period_start := v_now;
        v_period_end := v_new_period_start + v_extension_interval;

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
            v_new_period_start,
            v_period_end,
            FALSE,
            'sepay',
            p_transaction_id,
            p_amount,
            v_now,
            v_now
        );
    END IF;

    UPDATE payment_orders
    SET status = 'paid',
        paid_at = v_now,
        provider_transaction_id = p_transaction_id,
        updated_at = v_now
    WHERE id = v_order.id;

    RETURN JSONB_BUILD_OBJECT(
        'success', TRUE,
        'order_id', v_order.id,
        'user_id', v_order.user_id,
        'amount', p_amount,
        'subscription_end', v_period_end,
        'is_promo', v_is_promo,
        'extended', v_has_active_subscription
    );
EXCEPTION
    WHEN lock_not_available THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', FALSE,
            'error', 'Order is being processed by another request',
            'order_code', p_order_code,
            'retry_after', 2
        );
    WHEN OTHERS THEN
        RAISE WARNING 'Payment processing error: %', SQLERRM;
        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', SQLERRM, 'order_code', p_order_code);
END;
$$;

COMMENT ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) IS
'Atomically processes a payment order while reusing the single subscription row per user.
Prevents duplicate key errors on subscriptions.user_id and keeps users premium cache synced from subscriptions triggers.';
