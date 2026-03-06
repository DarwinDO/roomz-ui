-- =====================================================
-- Notification Triggers: Codify existing + add new
-- =====================================================
-- This migration codifies notification triggers that were
-- created manually in the database but had no migration file.
-- It also adds new notification triggers for verification_requests.
-- =====================================================
-- =====================================================
-- 1. BOOKING: Notify landlord on new booking request
--    (Already exists in DB, codifying here)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_landlord_on_new_booking() RETURNS TRIGGER AS $$
DECLARE v_room_title TEXT;
v_renter_name TEXT;
BEGIN
SELECT COALESCE(title, 'Phòng') INTO v_room_title
FROM public.rooms
WHERE id = NEW.room_id;
SELECT COALESCE(full_name, 'Người dùng') INTO v_renter_name
FROM public.users
WHERE id = NEW.renter_id;
INSERT INTO public.notifications (user_id, type, title, content, link)
VALUES (
        NEW.landlord_id,
        'booking_request',
        '📅 Yêu cầu đặt phòng mới',
        v_renter_name || ' muốn đặt xem phòng "' || v_room_title || '"',
        '/landlord/bookings/' || NEW.id
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS notify_landlord_on_booking ON public.bookings;
CREATE TRIGGER notify_landlord_on_booking
AFTER
INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_landlord_on_new_booking();
-- =====================================================
-- 2. BOOKING: Notify renter on booking status change
--    (Already exists in DB, codifying here)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_renter_on_booking_status_change() RETURNS TRIGGER AS $$
DECLARE v_room_title TEXT;
v_status_text TEXT;
BEGIN -- Skip if status didn't actually change
IF OLD.status IS NOT DISTINCT
FROM NEW.status THEN RETURN NEW;
END IF;
SELECT COALESCE(title, 'Phòng') INTO v_room_title
FROM public.rooms
WHERE id = NEW.room_id;
v_status_text := CASE
    NEW.status::TEXT
    WHEN 'confirmed' THEN 'đã được xác nhận ✅'
    WHEN 'rejected' THEN 'đã bị từ chối ❌'
    WHEN 'cancelled' THEN 'đã bị hủy ❌'
    WHEN 'completed' THEN 'đã hoàn thành 🎉'
    WHEN 'pending' THEN 'đang chờ xác nhận ⏳'
    ELSE NEW.status::TEXT
END;
INSERT INTO public.notifications (user_id, type, title, content, link)
VALUES (
        NEW.renter_id,
        'booking_status',
        '📋 Cập nhật đặt phòng',
        'Yêu cầu xem phòng "' || v_room_title || '" ' || v_status_text,
        '/bookings/' || NEW.id
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS notify_renter_on_booking_update ON public.bookings;
CREATE TRIGGER notify_renter_on_booking_update
AFTER
UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_renter_on_booking_status_change();
-- =====================================================
-- 3. ROOM: Notify landlord on room rejection
--    (Already exists in DB, codifying here)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_landlord_on_room_rejection() RETURNS TRIGGER AS $$
DECLARE v_reason TEXT;
BEGIN -- Only trigger when room is rejected/deactivated
IF NOT (
    (
        OLD.status = 'pending'
        AND NEW.status = 'inactive'
    )
    OR (
        OLD.is_verified = true
        AND NEW.is_verified = false
    )
) THEN RETURN NEW;
END IF;
v_reason := COALESCE(
    NEW.rejection_reason,
    'Không đáp ứng tiêu chuẩn của nền tảng. Vui lòng kiểm tra và cập nhật thông tin.'
);
INSERT INTO public.notifications (user_id, type, title, content, link)
VALUES (
        NEW.landlord_id,
        'system',
        '❌ Phòng bị từ chối',
        'Phòng "' || COALESCE(NEW.title, 'N/A') || '" không được duyệt. Lý do: ' || v_reason,
        '/landlord/rooms/' || NEW.id || '/edit'
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS notify_landlord_on_room_status ON public.rooms;
CREATE TRIGGER notify_landlord_on_room_status
AFTER
UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.notify_landlord_on_room_rejection();
-- =====================================================
-- 4. USER: Notify user on account rejection/suspension
--    (Already exists in DB, codifying here)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_user_on_account_rejection() RETURNS TRIGGER AS $$
DECLARE v_reason TEXT;
BEGIN -- Skip if account_status didn't change
IF OLD.account_status IS NOT DISTINCT
FROM NEW.account_status THEN RETURN NEW;
END IF;
-- Only notify on rejection or suspension
IF NEW.account_status NOT IN ('rejected', 'suspended') THEN RETURN NEW;
END IF;
v_reason := COALESCE(
    NEW.rejection_reason,
    'Thông tin không hợp lệ hoặc cần bổ sung. Vui lòng cập nhật hồ sơ.'
);
INSERT INTO public.notifications (user_id, type, title, content, link)
VALUES (
        NEW.id,
        'verification',
        '⚠️ Xác thực tài khoản chưa thành công',
        'Tài khoản của bạn cần được xác minh lại. Lý do: ' || v_reason,
        '/profile/verification'
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS notify_user_on_account_status ON public.users;
CREATE TRIGGER notify_user_on_account_status
AFTER
UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_account_rejection();
-- =====================================================
-- 5. VERIFICATION: Notify user on verification result
--    (NEW - not in DB yet)
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_on_verification_result() RETURNS TRIGGER AS $$
DECLARE v_title TEXT;
v_content TEXT;
BEGIN -- Skip if status didn't change
IF OLD.status IS NOT DISTINCT
FROM NEW.status THEN RETURN NEW;
END IF;
-- Only notify on approved or rejected
IF NEW.status = 'approved' THEN v_title := '✅ Xác thực thành công';
v_content := 'Tài khoản của bạn đã được xác thực thành công. Bạn giờ có thể sử dụng đầy đủ tính năng.';
ELSIF NEW.status = 'rejected' THEN v_title := '❌ Yêu cầu xác thực bị từ chối';
v_content := 'Yêu cầu xác thực của bạn không được chấp nhận. Lý do: ' || COALESCE(
    NEW.rejection_reason,
    'Vui lòng kiểm tra và gửi lại.'
);
ELSE RETURN NEW;
END IF;
INSERT INTO public.notifications (user_id, type, title, content, link)
VALUES (
        NEW.user_id,
        'verification',
        v_title,
        v_content,
        '/profile/verification'
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS notify_on_verification_result ON public.verification_requests;
CREATE TRIGGER notify_on_verification_result
AFTER
UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION public.notify_on_verification_result();
-- =====================================================
-- 6. CLEANUP: Remove duplicate RLS policies
-- =====================================================
-- "Users view own notifications" duplicates "Users read own notifications"
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
-- "Users update own notifications" duplicates "Users can update own notifications"  
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
-- =====================================================
-- Done! All notification triggers codified.
-- =====================================================
SELECT 'Notification triggers migration complete!' as result;