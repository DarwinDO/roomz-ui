-- =====================================================
-- Push Notifications: Tokens + Add data column to notifications
-- =====================================================
-- Table: user_push_tokens (Expo Push Token storage)
-- Add: data JSONB column to existing notifications table
-- Edge Function: send-push-notification (triggered by DB webhook)
-- =====================================================
-- =====================================================
-- 1. user_push_tokens (NEW TABLE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, device_id)
);
-- Comment for documentation
COMMENT ON TABLE public.user_push_tokens IS 'Expo Push Token per user per device';
-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
-- =====================================================
-- RLS for user_push_tokens
-- =====================================================
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
-- Users can manage their own push tokens
DROP POLICY IF EXISTS "Users manage own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users manage own push tokens" ON public.user_push_tokens FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Grant permissions
GRANT ALL ON public.user_push_tokens TO authenticated;
-- =====================================================
-- 2. Add data column to existing notifications table
-- =====================================================
-- Add JSONB column for storing push notification payload data
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'data'
) THEN
ALTER TABLE public.notifications
ADD COLUMN data JSONB DEFAULT '{}';
END IF;
END $$;
-- =====================================================
-- RLS for notifications (ensure policies exist)
-- =====================================================
-- Users can read their own notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR
UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Admin can view all notifications (for admin dashboard)
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;
CREATE POLICY "Admins view all notifications" ON public.notifications FOR
SELECT TO authenticated USING (public.is_admin());
-- Service role can insert notifications (Edge Function uses service_role key)
DROP POLICY IF EXISTS "Service role insert notifications" ON public.notifications;
CREATE POLICY "Service role insert notifications" ON public.notifications FOR
INSERT TO service_role WITH CHECK (true);
-- Service role can update notifications
DROP POLICY IF EXISTS "Service role update notifications" ON public.notifications;
CREATE POLICY "Service role update notifications" ON public.notifications FOR
UPDATE TO service_role WITH CHECK (true);
-- Grant permissions
GRANT SELECT,
    UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
SELECT 'Push Notifications migration complete!' as result;