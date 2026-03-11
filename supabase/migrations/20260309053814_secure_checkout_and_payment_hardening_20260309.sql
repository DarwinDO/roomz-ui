-- Phase 5: Premium checkout hardening
-- 1) Move order amount/plan calculation server-side
-- 2) Remove unsafe client write policies on payment_orders
-- 3) Fix renewal period propagation in process_payment_order

-- ============================================
-- Remove unsafe direct client write policies
-- ============================================
DROP POLICY IF EXISTS "Users can insert own orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can update own orders" ON payment_orders;

-- ============================================
-- Strengthen payment_orders constraints
-- ============================================
ALTER TABLE payment_orders
    DROP CONSTRAINT IF EXISTS payment_orders_plan_check;

ALTER TABLE payment_orders
    ADD CONSTRAINT payment_orders_plan_check CHECK (plan IN ('rommz_plus'));

ALTER TABLE payment_orders
    DROP CONSTRAINT IF EXISTS payment_orders_amount_positive_check;

ALTER TABLE payment_orders
    ADD CONSTRAINT payment_orders_amount_positive_check CHECK (amount > 0);

-- ============================================
-- RPC: secure checkout order creation
-- Computes amount and promo eligibility on server
-- ============================================
CREATE OR REPLACE FUNCTION create_checkout_order(
    p_plan TEXT DEFAULT 'rommz_plus',
    p_billing_cycle TEXT DEFAULT 'monthly',
    p_request_promo BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_order_code TEXT;
    v_amount INTEGER;
    v_base_amount INTEGER;
    v_expires_at TIMESTAMPTZ := NOW() + INTERVAL '20 minutes';
    v_total_slots INTEGER := 500;
    v_claimed_slots INTEGER := 0;
    v_promo_applied BOOLEAN := FALSE;
    v_attempts INTEGER := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_plan <> 'rommz_plus' THEN
        RAISE EXCEPTION 'Unsupported plan: %', p_plan;
    END IF;

    IF p_billing_cycle NOT IN ('monthly', 'quarterly') THEN
        RAISE EXCEPTION 'Unsupported billing cycle: %', p_billing_cycle;
    END IF;

    v_base_amount := CASE
        WHEN p_billing_cycle = 'quarterly' THEN 119000
        ELSE 49000
    END;

    v_amount := v_base_amount;

    IF p_request_promo THEN
        PERFORM pg_advisory_lock(4242);
        BEGIN
            SELECT COALESCE(
                (SELECT value::INTEGER FROM app_configs WHERE key = 'promo_total_slots'),
                (SELECT value::INTEGER FROM app_configs WHERE key = 'promo_slot_limit'),
                500
            ) INTO v_total_slots;

            SELECT COUNT(*) INTO v_claimed_slots
            FROM payment_orders
            WHERE status IN ('pending', 'paid')
              AND amount < CASE
                  WHEN billing_cycle = 'quarterly' THEN 119000
                  ELSE 49000
              END;

            IF v_claimed_slots < v_total_slots THEN
                v_amount := (v_base_amount * 50) / 100;
                v_promo_applied := TRUE;
            END IF;

            PERFORM pg_advisory_unlock(4242);
        EXCEPTION
            WHEN OTHERS THEN
                PERFORM pg_advisory_unlock(4242);
                RAISE;
        END;
    END IF;

    LOOP
        v_attempts := v_attempts + 1;
        v_order_code := 'ROMMZ'
            || TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS')
            || LPAD((FLOOR(RANDOM() * 1000))::INT::TEXT, 3, '0');

        BEGIN
            INSERT INTO payment_orders (
                user_id,
                order_code,
                plan,
                billing_cycle,
                amount,
                status,
                payment_provider,
                expires_at,
                created_at,
                updated_at
            )
            VALUES (
                v_user_id,
                v_order_code,
                p_plan,
                p_billing_cycle,
                v_amount,
                'pending',
                'sepay',
                v_expires_at,
                NOW(),
                NOW()
            );
            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                IF v_attempts >= 5 THEN
                    RAISE EXCEPTION 'Could not generate unique order code';
                END IF;
        END;
    END LOOP;

    RETURN JSONB_BUILD_OBJECT(
        'order_code', v_order_code,
        'amount', v_amount,
        'expires_at', v_expires_at,
        'promo_applied', v_promo_applied
    );
END;
$$;

REVOKE ALL ON FUNCTION create_checkout_order(TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_checkout_order(TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

COMMENT ON FUNCTION create_checkout_order(TEXT, TEXT, BOOLEAN) IS
'Creates payment order server-side with validated plan, secure amount calculation, and atomic promo eligibility check.';

-- ============================================
-- Recreate process_payment_order with renewal fixes
-- ============================================
CREATE OR REPLACE FUNCTION process_payment_order(
        p_order_code TEXT,
        p_amount NUMERIC,
        p_transaction_id TEXT,
        p_payload JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_order RECORD;
    v_subscription RECORD;
    v_period_end TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_new_period_start TIMESTAMP WITH TIME ZONE;
    v_is_promo BOOLEAN;
BEGIN
    SELECT * INTO v_order
    FROM payment_orders
    WHERE order_code = p_order_code
    FOR UPDATE NOWAIT;

    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', FALSE,
            'error', 'Order not found',
            'order_code', p_order_code
        );
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

        RETURN JSONB_BUILD_OBJECT(
            'success', FALSE,
            'error', 'Order expired',
            'order_id', v_order.id
        );
    END IF;

    IF p_amount <> v_order.amount THEN
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
        v_period_end := v_now + INTERVAL '3 months';
    ELSE
        v_period_end := v_now + INTERVAL '1 month';
    END IF;

    v_is_promo := v_order.amount < CASE
        WHEN v_order.billing_cycle = 'quarterly' THEN 119000
        ELSE 49000
    END;

    UPDATE payment_orders
    SET status = 'paid',
        paid_at = v_now,
        provider_transaction_id = p_transaction_id,
        updated_at = v_now
    WHERE id = v_order.id;

    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id = v_order.user_id
      AND status = 'active'
    FOR UPDATE;

    IF FOUND THEN
        v_new_period_start := GREATEST(COALESCE(v_subscription.current_period_end, v_now), v_now);

        v_period_end := v_new_period_start + CASE
            WHEN v_order.billing_cycle = 'quarterly' THEN INTERVAL '3 months'
            ELSE INTERVAL '1 month'
        END;

        UPDATE subscriptions
        SET plan = v_order.plan,
            status = 'active',
            promo_applied = COALESCE(v_subscription.promo_applied, FALSE) OR v_is_promo,
            current_period_start = v_new_period_start,
            current_period_end = v_period_end,
            payment_provider = 'sepay',
            payment_provider_transaction_id = p_transaction_id,
            amount_paid = COALESCE(amount_paid, 0) + p_amount,
            updated_at = v_now
        WHERE id = v_subscription.id;
    ELSE
        UPDATE subscriptions
        SET status = 'expired',
            updated_at = v_now
        WHERE user_id = v_order.user_id
          AND status = 'active';

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

    UPDATE users
    SET is_premium = TRUE,
        premium_until = v_period_end,
        updated_at = v_now
    WHERE id = v_order.user_id;

    RETURN JSONB_BUILD_OBJECT(
        'success', TRUE,
        'order_id', v_order.id,
        'user_id', v_order.user_id,
        'amount', p_amount,
        'subscription_end', v_period_end,
        'is_promo', v_is_promo,
        'extended', v_subscription IS NOT NULL
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
        RETURN JSONB_BUILD_OBJECT(
            'success', FALSE,
            'error', SQLERRM,
            'order_code', p_order_code
        );
END;
$$;

REVOKE ALL ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) TO service_role;

COMMENT ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) IS
'Atomically processes payment orders with locking, exact amount validation, and correct subscription renewal period propagation.';
