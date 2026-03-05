-- Task 2: Add INSERT and UPDATE RLS Policies for payment_orders
-- Date: 2026-03-05
-- Issue: Users cannot create or update payment orders from client
-- ============================================
-- INSERT Policy: Allow users to create their own orders
-- ============================================
DROP POLICY IF EXISTS "Users can insert own orders" ON payment_orders;
CREATE POLICY "Users can insert own orders" ON payment_orders FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- ============================================
-- UPDATE Policy: Allow users to update their own orders (e.g., cancel)
-- ============================================
DROP POLICY IF EXISTS "Users can update own orders" ON payment_orders;
CREATE POLICY "Users can update own orders" ON payment_orders FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ============================================
-- Verification Query (run after migration):
-- SELECT * FROM pg_policies WHERE tablename = 'payment_orders';
-- ============================================