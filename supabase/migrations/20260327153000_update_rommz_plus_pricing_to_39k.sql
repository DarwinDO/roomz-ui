-- ============================================
-- Update RommZ+ pricing to 39k monthly / 99k quarterly
-- Date: 2026-03-27
-- ============================================

-- Cancel old pending orders so the new checkout flow does not reuse 49k / 119k drafts.
UPDATE public.payment_orders
SET status = 'cancelled',
    updated_at = NOW()
WHERE plan = 'rommz_plus'
  AND status = 'pending'
  AND amount IN (49000, 119000);

CREATE OR REPLACE FUNCTION public.create_checkout_order(
    p_plan text DEFAULT 'rommz_plus'::text,
    p_billing_cycle text DEFAULT 'monthly'::text,
    p_request_promo boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_existing_order RECORD;
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
        WHEN p_billing_cycle = 'quarterly' THEN 99000
        ELSE 39000
    END;

    PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_plan || ':' || p_billing_cycle));

    UPDATE public.payment_orders
    SET status = 'expired',
        updated_at = NOW()
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND expires_at <= NOW();

    UPDATE public.payment_orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND expires_at > NOW()
      AND (
        plan <> p_plan
        OR billing_cycle <> p_billing_cycle
        OR amount NOT IN (v_base_amount, (v_base_amount * 50) / 100)
      );

    SELECT id, order_code, amount, expires_at
    INTO v_existing_order
    FROM public.payment_orders
    WHERE user_id = v_user_id
      AND plan = p_plan
      AND billing_cycle = p_billing_cycle
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'order_code', v_existing_order.order_code,
            'amount', v_existing_order.amount,
            'expires_at', v_existing_order.expires_at,
            'promo_applied', v_existing_order.amount < v_base_amount
        );
    END IF;

    v_amount := v_base_amount;

    IF p_request_promo THEN
        PERFORM pg_advisory_lock(4242);
        BEGIN
            SELECT COALESCE(
                (SELECT value::INTEGER FROM public.app_configs WHERE key = 'promo_total_slots'),
                (SELECT value::INTEGER FROM public.app_configs WHERE key = 'promo_slot_limit'),
                500
            ) INTO v_total_slots;

            SELECT COUNT(*) INTO v_claimed_slots
            FROM public.payment_orders
            WHERE status IN ('pending', 'paid')
              AND amount < CASE
                  WHEN billing_cycle = 'quarterly' THEN 99000
                  ELSE 39000
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
            INSERT INTO public.payment_orders (
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
$function$;

REVOKE ALL ON FUNCTION public.create_checkout_order(text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_checkout_order(text, text, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION claim_promo_slot(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_slots INTEGER := 500;
    v_claimed_slots INTEGER;
    v_already_claimed BOOLEAN;
    v_result JSONB;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM payment_orders
        WHERE user_id = p_user_id
          AND status IN ('pending', 'paid')
          AND amount < CASE
              WHEN billing_cycle = 'quarterly' THEN 99000
              ELSE 39000
          END
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', 'User already claimed promo', 'eligible', FALSE);
    END IF;

    PERFORM pg_advisory_lock(4242);
    BEGIN
        SELECT COUNT(*) INTO v_claimed_slots
        FROM payment_orders
        WHERE status IN ('pending', 'paid')
          AND amount < CASE
              WHEN billing_cycle = 'quarterly' THEN 99000
              ELSE 39000
          END;

        IF v_claimed_slots >= v_total_slots THEN
            v_result := JSONB_BUILD_OBJECT(
                'success', FALSE,
                'error', 'All promo slots claimed',
                'eligible', FALSE,
                'claimed_slots', v_claimed_slots,
                'total_slots', v_total_slots
            );
        ELSE
            v_result := JSONB_BUILD_OBJECT(
                'success', TRUE,
                'eligible', TRUE,
                'claimed_slots', v_claimed_slots,
                'total_slots', v_total_slots,
                'remaining_slots', v_total_slots - v_claimed_slots
            );
        END IF;

        PERFORM pg_advisory_unlock(4242);
        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM pg_advisory_unlock(4242);
            RAISE;
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_promo_slot(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION claim_promo_slot_counter(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_slots INTEGER;
    v_claimed_slots INTEGER;
    v_already_claimed BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM payment_orders
        WHERE user_id = p_user_id
          AND status IN ('pending', 'paid')
          AND amount < CASE
              WHEN billing_cycle = 'quarterly' THEN 99000
              ELSE 39000
          END
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', 'User already claimed promo', 'eligible', FALSE);
    END IF;

    SELECT value::INTEGER INTO v_total_slots
    FROM app_configs
    WHERE key = 'promo_total_slots';

    UPDATE app_configs
    SET value = (value::INTEGER + 1)::TEXT,
        updated_at = NOW()
    WHERE key = 'promo_claimed_slots'
      AND value::INTEGER < v_total_slots
    RETURNING value::INTEGER INTO v_claimed_slots;

    IF FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', TRUE,
            'eligible', TRUE,
            'claimed_slots', v_claimed_slots,
            'total_slots', v_total_slots,
            'remaining_slots', v_total_slots - v_claimed_slots
        );
    END IF;

    RETURN JSONB_BUILD_OBJECT(
        'success', FALSE,
        'error', 'All promo slots claimed',
        'eligible', FALSE,
        'claimed_slots', v_claimed_slots,
        'total_slots', v_total_slots
    );
END;
$$;

GRANT EXECUTE ON FUNCTION claim_promo_slot_counter(UUID) TO anon, authenticated, service_role;

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
BEGIN
    SELECT * INTO v_order
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
        v_period_end := v_now + INTERVAL '3 months';
    ELSE
        v_period_end := v_now + INTERVAL '1 month';
    END IF;

    v_is_promo := v_order.amount < CASE
        WHEN v_order.billing_cycle = 'quarterly' THEN 99000
        ELSE 39000
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
    ELSE
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
        RETURN JSONB_BUILD_OBJECT('success', FALSE, 'error', SQLERRM, 'order_code', p_order_code);
END;
$$;

GRANT EXECUTE ON FUNCTION process_payment_order(TEXT, NUMERIC, TEXT, JSONB) TO service_role;
