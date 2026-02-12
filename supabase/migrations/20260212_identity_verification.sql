-- =====================================================
-- Identity Verification: CCCD Upload + Admin Review
-- =====================================================
-- Table: verification_requests
-- Storage Bucket: identity_documents (private)
-- Trigger: auto-sync id_card_verified on users table
-- =====================================================

-- 1. Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type text NOT NULL DEFAULT 'cccd',
    front_image_path text NOT NULL,
    back_image_path text NOT NULL,
    status text NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_by uuid REFERENCES public.users(id),
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz
);

-- 2. Partial unique index: only 1 pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_per_user 
ON public.verification_requests(user_id) 
WHERE status = 'pending';

-- 3. Index for admin listing by status
CREATE INDEX IF NOT EXISTS idx_verification_status 
ON public.verification_requests(status);

-- 4. Trigger: auto-sync id_card_verified on users table
CREATE OR REPLACE FUNCTION public.update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE public.users 
        SET id_card_verified = true 
        WHERE id = NEW.user_id;
    ELSIF NEW.status = 'rejected' THEN
        UPDATE public.users 
        SET id_card_verified = false 
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_status_change ON public.verification_requests;
CREATE TRIGGER on_verification_status_change
AFTER UPDATE OF status ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_user_verification_status();

-- =====================================================
-- 5. RLS Policies for verification_requests
-- =====================================================
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
DROP POLICY IF EXISTS "Users can create verification requests" ON public.verification_requests;
CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all requests
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admin can update requests (approve/reject)
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =====================================================
-- 6. Storage Bucket: identity_documents (private)
-- =====================================================
-- NOTE: Bucket creation must be done via Dashboard or API
-- Below are the RLS instructions for the storage bucket:
--
-- Bucket: identity_documents (Private, NOT public)
-- File path format: {user_id}/front_{timestamp}.jpg
--                   {user_id}/back_{timestamp}.jpg
--
-- POLICY 1 - INSERT:
--   Name: Users can upload identity documents
--   Operation: INSERT
--   Roles: authenticated
--   WITH CHECK: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 2 - SELECT (Owner + Admin):
--   Name: Users and admins can view identity documents
--   Operation: SELECT
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text 
--          OR public.is_admin()
--
-- POLICY 3 - DELETE (Admin only):
--   Name: Admins can delete identity documents
--   Operation: DELETE
--   Roles: authenticated
--   USING: public.is_admin()

-- Grant permissions
GRANT ALL ON public.verification_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_verification_status() TO authenticated;

SELECT 'Identity Verification migration complete!' as result;
