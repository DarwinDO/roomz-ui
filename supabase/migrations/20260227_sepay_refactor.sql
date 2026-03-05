-- Phase 4: SePay Payment Integration
-- Rename Stripe fields to generic payment fields + Create payment_orders table
-- 1A: Rename Stripe-specific columns to generic ones
ALTER TABLE subscriptions
    RENAME COLUMN stripe_customer_id TO payment_provider_customer_id;
ALTER TABLE subscriptions
    RENAME COLUMN stripe_subscription_id TO payment_provider_transaction_id;
-- Add payment provider column
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'sepay';
-- Add payment amount tracking
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
-- 1B: Create payment_orders table
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_code TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'rommz_plus',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly')),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'paid',
            'expired',
            'cancelled',
            'manual_review'
        )
    ),
    payment_provider TEXT NOT NULL DEFAULT 'sepay',
    provider_transaction_id TEXT,
    qr_data TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Index for webhook matching
CREATE INDEX IF NOT EXISTS idx_payment_orders_code ON payment_orders(order_code);
-- Index for user's orders
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
-- 1C: Create manual_reviews table
CREATE TABLE IF NOT EXISTS manual_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE
    SET NULL,
        order_code TEXT,
        transaction_id TEXT,
        amount INTEGER,
        reason TEXT NOT NULL,
        raw_payload JSONB,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (
            status IN (
                'pending',
                'resolved_premium',
                'resolved_refund',
                'dismissed'
            )
        ),
        resolved_by UUID,
        resolved_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- 1D: RLS Policies
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_reviews ENABLE ROW LEVEL SECURITY;
-- payment_orders policies
DROP POLICY IF EXISTS "Users can read own orders" ON payment_orders;
CREATE POLICY "Users can read own orders" ON payment_orders FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages orders" ON payment_orders;
CREATE POLICY "Service role manages orders" ON payment_orders FOR ALL USING (auth.role() = 'service_role');
-- manual_reviews policies (admin only)
DROP POLICY IF EXISTS "Service role manages reviews" ON manual_reviews;
CREATE POLICY "Service role manages reviews" ON manual_reviews FOR ALL USING (auth.role() = 'service_role');