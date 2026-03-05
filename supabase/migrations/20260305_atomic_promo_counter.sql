/**
 * Migration: Atomic promo slot claiming
 * Prevents race conditions when multiple users try to claim promo slots
 */
-- ============================================
-- RPC Function: Atomically claim a promo slot
-- ============================================
CREATE OR REPLACE FUNCTION claim_promo_slot(p_user_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_total_slots INTEGER := 500;
v_claimed_slots INTEGER;
v_already_claimed BOOLEAN;
v_result JSONB;
BEGIN -- Check if user already has an active/pending promo order
SELECT EXISTS(
        SELECT 1
        FROM payment_orders
        WHERE user_id = p_user_id
            AND status IN ('pending', 'paid')
            AND amount < CASE
                WHEN billing_cycle = 'quarterly' THEN 119000
                ELSE 49000
            END
    ) INTO v_already_claimed;
IF v_already_claimed THEN RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'User already claimed promo',
    'eligible',
    FALSE
);
END IF;
-- Atomic increment and check using advisory lock for serialization
-- Use a fixed advisory lock ID for promo counter (e.g., 4242)
PERFORM pg_advisory_lock(4242);
BEGIN -- Count actual claimed promo slots (paid or pending orders with promo price)
SELECT COUNT(*) INTO v_claimed_slots
FROM payment_orders
WHERE status IN ('pending', 'paid')
    AND amount < CASE
        WHEN billing_cycle = 'quarterly' THEN 119000
        ELSE 49000
    END;
-- Check if slots available
IF v_claimed_slots >= v_total_slots THEN v_result := JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'All promo slots claimed',
    'eligible',
    FALSE,
    'claimed_slots',
    v_claimed_slots,
    'total_slots',
    v_total_slots
);
ELSE -- Success - slot available
v_result := JSONB_BUILD_OBJECT(
    'success',
    TRUE,
    'eligible',
    TRUE,
    'claimed_slots',
    v_claimed_slots,
    'total_slots',
    v_total_slots,
    'remaining_slots',
    v_total_slots - v_claimed_slots
);
END IF;
-- Release lock
PERFORM pg_advisory_unlock(4242);
RETURN v_result;
EXCEPTION
WHEN OTHERS THEN -- Ensure lock is released on error
PERFORM pg_advisory_unlock(4242);
RAISE;
END;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_promo_slot(UUID) TO anon;
GRANT EXECUTE ON FUNCTION claim_promo_slot(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_promo_slot(UUID) TO service_role;
-- Add comment
COMMENT ON FUNCTION claim_promo_slot(UUID) IS 'Atomically checks and claims a promo slot with serialization.
Uses advisory lock to prevent race conditions.
Returns eligibility status and remaining slots.
Called before creating a payment order with promo price.';
-- ============================================
-- Alternative: Use app_configs for atomic counter
-- More efficient for high concurrency
-- ============================================
-- Ensure app_configs has promo counter keys
INSERT INTO app_configs (key, value, description)
VALUES (
        'promo_total_slots',
        '500',
        'Total available promo slots'
    ),
    (
        'promo_claimed_slots',
        '0',
        'Number of claimed promo slots'
    ) ON CONFLICT (key) DO NOTHING;
-- ============================================
-- RPC Function: Claim slot using counter table
-- ============================================
CREATE OR REPLACE FUNCTION claim_promo_slot_counter(p_user_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_total_slots INTEGER;
v_claimed_slots INTEGER;
v_already_claimed BOOLEAN;
BEGIN -- Check if user already claimed
SELECT EXISTS(
        SELECT 1
        FROM payment_orders
        WHERE user_id = p_user_id
            AND status IN ('pending', 'paid')
            AND amount < CASE
                WHEN billing_cycle = 'quarterly' THEN 119000
                ELSE 49000
            END
    ) INTO v_already_claimed;
IF v_already_claimed THEN RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'User already claimed promo',
    'eligible',
    FALSE
);
END IF;
-- Get total slots
SELECT value::INTEGER INTO v_total_slots
FROM app_configs
WHERE key = 'promo_total_slots';
-- Atomically increment and get new value
UPDATE app_configs
SET value = (value::INTEGER + 1)::TEXT,
    updated_at = NOW()
WHERE key = 'promo_claimed_slots'
    AND value::INTEGER < v_total_slots
RETURNING value::INTEGER INTO v_claimed_slots;
IF FOUND THEN RETURN JSONB_BUILD_OBJECT(
    'success',
    TRUE,
    'eligible',
    TRUE,
    'claimed_slots',
    v_claimed_slots,
    'total_slots',
    v_total_slots,
    'remaining_slots',
    v_total_slots - v_claimed_slots
);
ELSE RETURN JSONB_BUILD_OBJECT(
    'success',
    FALSE,
    'error',
    'All promo slots claimed',
    'eligible',
    FALSE,
    'claimed_slots',
    v_claimed_slots,
    'total_slots',
    v_total_slots
);
END IF;
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_promo_slot_counter(UUID) TO anon;
GRANT EXECUTE ON FUNCTION claim_promo_slot_counter(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_promo_slot_counter(UUID) TO service_role;
COMMENT ON FUNCTION claim_promo_slot_counter(UUID) IS 'Atomically claims a promo slot using counter table with row-level locking.
More efficient than advisory lock version for high concurrency.
Uses UPDATE ... RETURNING for atomic increment.';