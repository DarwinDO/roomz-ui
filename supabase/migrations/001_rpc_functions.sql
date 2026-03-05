-- ============================================
-- ROMMZ - Supabase RPC Functions Migration
-- ============================================
-- Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================
-- ============================================
-- 1. FAVORITE COUNT FUNCTIONS
-- ============================================
-- Increment favorite count for a room
CREATE OR REPLACE FUNCTION increment_favorite_count(room_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE rooms
SET favorite_count = COALESCE(favorite_count, 0) + 1,
  updated_at = NOW()
WHERE id = room_id;
END;
$$;
-- Decrement favorite count for a room
CREATE OR REPLACE FUNCTION decrement_favorite_count(room_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE rooms
SET favorite_count = GREATEST(COALESCE(favorite_count, 0) - 1, 0),
  updated_at = NOW()
WHERE id = room_id;
END;
$$;
-- ============================================
-- 2. VIEW COUNT FUNCTION
-- ============================================
-- Increment view count for a room
CREATE OR REPLACE FUNCTION increment_view_count(room_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE rooms
SET view_count = COALESCE(view_count, 0) + 1
WHERE id = room_id;
END;
$$;
-- ============================================
-- 3. GRANT EXECUTE PERMISSIONS
-- ============================================
-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION increment_favorite_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_favorite_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO authenticated;
-- Allow anonymous users to increment view count (for non-logged in visitors)
GRANT EXECUTE ON FUNCTION increment_view_count(UUID) TO anon;
-- ============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================
-- Enable RLS on favorites table if not already enabled
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
-- Policy: Users can view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR
SELECT USING (auth.uid()::text = user_id::text);
-- Policy: Users can insert their own favorites
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites" ON favorites FOR
INSERT WITH CHECK (auth.uid()::text = user_id::text);
-- Policy: Users can delete their own favorites
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid()::text = user_id::text);
-- ============================================
-- 5. ROOMS TABLE RLS POLICIES
-- ============================================
-- Enable RLS on rooms table if not already enabled
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
-- Policy: Anyone can view active rooms
DROP POLICY IF EXISTS "Anyone can view active rooms" ON rooms;
CREATE POLICY "Anyone can view active rooms" ON rooms FOR
SELECT USING (
    status = 'active'
    AND deleted_at IS NULL
  );
-- Policy: Landlords can manage their own rooms
DROP POLICY IF EXISTS "Landlords can manage own rooms" ON rooms;
CREATE POLICY "Landlords can manage own rooms" ON rooms FOR ALL USING (auth.uid()::text = landlord_id::text);
-- ============================================
-- 6. USERS TABLE RLS POLICIES
-- ============================================
-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Policy: Users can view basic info of other users (for landlord display)
DROP POLICY IF EXISTS "Users can view public user info" ON users;
CREATE POLICY "Users can view public user info" ON users FOR
SELECT USING (true);
-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR
UPDATE USING (auth.uid()::text = id::text);
-- ============================================
-- 7. BOOKINGS TABLE RLS POLICIES
-- ============================================
-- Enable RLS on bookings table if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- Policy: Tenants can view their own bookings
DROP POLICY IF EXISTS "Tenants can view own bookings" ON bookings;
CREATE POLICY "Tenants can view own bookings" ON bookings FOR
SELECT USING (auth.uid()::text = tenant_id::text);
-- Policy: Landlords can view bookings for their rooms
DROP POLICY IF EXISTS "Landlords can view room bookings" ON bookings;
CREATE POLICY "Landlords can view room bookings" ON bookings FOR
SELECT USING (auth.uid()::text = landlord_id::text);
-- Policy: Authenticated users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR
INSERT WITH CHECK (auth.uid()::text = tenant_id::text);
-- Policy: Landlords can update booking status
DROP POLICY IF EXISTS "Landlords can update bookings" ON bookings;
CREATE POLICY "Landlords can update bookings" ON bookings FOR
UPDATE USING (auth.uid()::text = landlord_id::text);
-- Policy: Tenants can cancel their own bookings
DROP POLICY IF EXISTS "Tenants can cancel bookings" ON bookings;
CREATE POLICY "Tenants can cancel bookings" ON bookings FOR
UPDATE USING (auth.uid()::text = tenant_id::text);
-- ============================================
-- 8. MESSAGES TABLE RLS POLICIES
-- ============================================
-- Enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Policy: Users can view messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages FOR
SELECT USING (
    auth.uid()::text = sender_id::text
    OR auth.uid()::text = receiver_id::text
  );
-- Policy: Users can send messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR
INSERT WITH CHECK (auth.uid()::text = sender_id::text);
-- Policy: Users can update their own messages (mark as read)
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages FOR
UPDATE USING (
    auth.uid()::text = sender_id::text
    OR auth.uid()::text = receiver_id::text
  );
-- ============================================
-- 9. REALTIME PUBLICATION FOR MESSAGES
-- ============================================
-- Enable realtime for messages table
-- Note: May fail if already added, which is OK
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE messages;
EXCEPTION
WHEN duplicate_object THEN NULL;
-- Already added, ignore
END $$;
-- ============================================
-- 10. STORAGE POLICIES (PHẢI TẠO QUA DASHBOARD)
-- ============================================
-- 
-- LƯU Ý: Storage policies KHÔNG THỂ tạo qua SQL Editor!
-- Phải vào Dashboard > Storage > Policies để tạo.
--
-- Xem file 002_storage_policies.sql để biết chi tiết.
--
-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see this, all migrations completed successfully!
SELECT 'RommZ RPC Functions và RLS Policies đã tạo thành công! Nhớ tạo Storage policies qua Dashboard.' as result;