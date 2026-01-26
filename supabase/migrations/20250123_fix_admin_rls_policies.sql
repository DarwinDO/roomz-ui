-- =====================================================
-- FIX: Admin RLS Policies for Room Approval Flow
-- =====================================================
-- Problem: Admin gets 403 Forbidden when trying to
-- approve/reject rooms because RLS policies don't
-- allow UPDATE for admin role
-- =====================================================

-- 1. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(
      -- Check JWT claims first (from custom hook)
      (current_setting('request.jwt.claims', true)::json->>'role') = 'admin',
      -- Fallback to users table
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
$$;

-- 2. Allow admin to SELECT all rooms (for listing)
DROP POLICY IF EXISTS "Admins can view all rooms" ON public.rooms;
CREATE POLICY "Admins can view all rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (public.is_admin());

-- 3. Allow admin to UPDATE rooms (for approve/reject)
DROP POLICY IF EXISTS "Admins can update all rooms" ON public.rooms;
CREATE POLICY "Admins can update all rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Allow admin to DELETE rooms
DROP POLICY IF EXISTS "Admins can delete all rooms" ON public.rooms;
CREATE POLICY "Admins can delete all rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (public.is_admin());

-- 5. Allow admin to SELECT all users (for user management)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.is_admin());

-- 6. Allow admin to UPDATE users (for role/status changes)
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
