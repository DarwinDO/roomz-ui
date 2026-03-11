-- ============================================
-- Align service lead workflow with application state
-- and prevent duplicate active checkout orders.
-- Date: 2026-03-10
-- ============================================

-- Normalize legacy service lead statuses before tightening the constraint.
UPDATE public.service_leads
SET status = 'assigned'
WHERE status = 'partner_contacted';

UPDATE public.service_leads
SET status = 'completed'
WHERE status = 'rated';

ALTER TABLE public.service_leads
    DROP CONSTRAINT IF EXISTS service_leads_status_check;

ALTER TABLE public.service_leads
    ADD CONSTRAINT service_leads_status_check
    CHECK (status = ANY (ARRAY[
        'submitted'::text,
        'assigned'::text,
        'confirmed'::text,
        'completed'::text,
        'cancelled'::text,
        'rejected'::text
    ]));

ALTER TABLE public.payment_orders
    ALTER COLUMN plan SET DEFAULT 'rommz_plus';

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
        WHEN p_billing_cycle = 'quarterly' THEN 119000
        ELSE 49000
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
      AND (plan <> p_plan OR billing_cycle <> p_billing_cycle);

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
        UPDATE public.payment_orders
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE user_id = v_user_id
          AND plan = p_plan
          AND billing_cycle = p_billing_cycle
          AND status = 'pending'
          AND expires_at > NOW()
          AND id <> v_existing_order.id;

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
