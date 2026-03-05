-- Premium Subscription Phase 1 Migration
-- Creates subscription management tables, app configs, and phone view tracking
-- ============================================
-- Table: subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'rommz_plus')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'cancelled', 'expired', 'past_due')
    ),
    promo_applied BOOLEAN DEFAULT false,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_method TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);
-- ============================================
-- Table: app_configs
-- ============================================
CREATE TABLE IF NOT EXISTS app_configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Insert default promo config
INSERT INTO app_configs (key, value, description)
VALUES (
        'promo_slot_limit',
        '500',
        'Số slot Early Bird giảm 50%'
    ),
    (
        'promo_active',
        'true',
        'Promo có đang active không'
    ) ON CONFLICT (key) DO NOTHING;
-- ============================================
-- Table: phone_number_views
-- ============================================
CREATE TABLE IF NOT EXISTS phone_number_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now()
);
-- Index for efficient daily view counting
CREATE INDEX IF NOT EXISTS idx_phone_views_user_date ON phone_number_views (user_id, viewed_at);
-- ============================================
-- View: promo_status
-- ============================================
CREATE OR REPLACE VIEW promo_status AS
SELECT (
        SELECT value::int
        FROM app_configs
        WHERE key = 'promo_slot_limit'
    ) as total_slots,
    (
        SELECT count(*)
        FROM subscriptions
        WHERE promo_applied = true
    ) as claimed_slots;
-- ============================================
-- Function: get_room_contact
-- Returns phone number with masking logic based on user subscription
-- ============================================
CREATE OR REPLACE FUNCTION get_room_contact(p_room_id UUID) RETURNS TABLE(phone TEXT, is_masked BOOLEAN) SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id UUID;
v_is_premium BOOLEAN;
v_daily_views INT;
v_phone TEXT;
v_daily_limit INT := 3;
v_premium_limit INT := 100;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Check if user has premium subscription
SELECT EXISTS(
        SELECT 1
        FROM subscriptions
        WHERE user_id = v_user_id
            AND plan = 'rommz_plus'
            AND status = 'active'
            AND (
                current_period_end IS NULL
                OR current_period_end > now()
            )
    ) INTO v_is_premium;
-- Count daily views
SELECT count(*) INTO v_daily_views
FROM phone_number_views
WHERE user_id = v_user_id
    AND viewed_at >= CURRENT_DATE;
-- Get phone from room owner
SELECT u.phone INTO v_phone
FROM rooms r
    JOIN users u ON r.landlord_id = u.id
WHERE r.id = p_room_id;
IF v_phone IS NULL THEN RETURN QUERY
SELECT ''::TEXT,
    true;
RETURN;
END IF;
-- Apply limit logic
IF (
    v_is_premium
    AND v_daily_views >= v_premium_limit
)
OR (
    NOT v_is_premium
    AND v_daily_views >= v_daily_limit
) THEN RETURN QUERY
SELECT substring(
        v_phone
        from 1 for 3
    ) || '***' || substring(
        v_phone
        from length(v_phone) -2 for 3
    ),
    true;
RETURN;
END IF;
-- Record the view and return unmasked phone
INSERT INTO phone_number_views (user_id, room_id)
VALUES (v_user_id, p_room_id);
RETURN QUERY
SELECT v_phone,
    false;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- RLS Policies: subscriptions
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription" ON subscriptions FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');
-- ============================================
-- RLS Policies: app_configs
-- ============================================
ALTER TABLE app_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read app_configs" ON app_configs;
CREATE POLICY "Anyone can read app_configs" ON app_configs FOR
SELECT USING (true);
-- ============================================
-- RLS Policies: phone_number_views
-- ============================================
ALTER TABLE phone_number_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own phone views" ON phone_number_views;
CREATE POLICY "Users can read own phone views" ON phone_number_views FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own phone views" ON phone_number_views;
CREATE POLICY "Users can insert own phone views" ON phone_number_views FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- ============================================
-- Grants
-- ============================================
GRANT SELECT ON promo_status TO authenticated,
    anon;