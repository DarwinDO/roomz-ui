-- ============================================
-- ROMMZ - Storage RLS Policies & Realtime Setup
-- ============================================
-- 
-- LƯU Ý QUAN TRỌNG:
-- Storage policies KHÔNG THỂ tạo qua SQL Editor!
-- Phải tạo qua Supabase Dashboard > Storage > Policies
--
-- ============================================
-- ============================================
-- HƯỚNG DẪN TẠO STORAGE POLICIES QUA DASHBOARD
-- ============================================
--
-- =============== BUCKET: verifications ===============
-- 1. Vào Dashboard > Storage > Policies
-- 2. Chọn bucket "verifications"
-- 3. Tạo 4 policies sau:
--
-- POLICY 1 - INSERT:
--   Name: Users can upload verification files
--   Operation: INSERT
--   Roles: authenticated
--   WITH CHECK: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 2 - SELECT:
--   Name: Users can view own verification files
--   Operation: SELECT
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 3 - UPDATE:
--   Name: Users can update own verification files
--   Operation: UPDATE
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 4 - DELETE:
--   Name: Users can delete own verification files
--   Operation: DELETE
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text
--
-- =============== BUCKET: room-images ===============
-- 1. Chọn bucket "room-images"
-- 2. Tạo 4 policies sau:
--
-- POLICY 1 - INSERT:
--   Name: Users can upload room images
--   Operation: INSERT
--   Roles: authenticated
--   WITH CHECK: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 2 - SELECT (Public bucket - everyone can view):
--   Name: Anyone can view room images
--   Operation: SELECT
--   Roles: public (hoặc bỏ trống)
--   USING: true
--
-- POLICY 3 - UPDATE:
--   Name: Users can update own room images
--   Operation: UPDATE
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text
--
-- POLICY 4 - DELETE:
--   Name: Users can delete own room images
--   Operation: DELETE
--   Roles: authenticated
--   USING: (storage.foldername(name))[1] = (auth.uid())::text
--
-- ============================================
-- ============================================
-- PHẦN NÀY CÓ THỂ CHẠY QUA SQL EDITOR
-- ============================================
-- Enable Realtime cho messages table
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE messages;
RAISE NOTICE 'OK: Đã thêm messages vào realtime publication';
EXCEPTION
WHEN duplicate_object THEN RAISE NOTICE 'INFO: Table messages đã có trong realtime publication';
END $$;
-- ============================================
-- KIỂM TRA BUCKET TỒN TẠI
-- ============================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM storage.buckets
  WHERE id = 'verifications'
) THEN RAISE NOTICE '⚠️ CẢNH BÁO: Bucket "verifications" chưa tồn tại!';
RAISE NOTICE '   Vui lòng tạo trong Dashboard > Storage > New Bucket';
ELSE RAISE NOTICE '✓ OK: Bucket "verifications" đã tồn tại';
END IF;
END $$;
-- ============================================
-- KIỂM TRA STORAGE POLICIES
-- ============================================
DO $$
DECLARE policy_count INTEGER;
BEGIN
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%verification%';
IF policy_count = 0 THEN RAISE NOTICE '⚠️ CẢNH BÁO: Chưa có Storage policies cho verifications!';
RAISE NOTICE '   Vui lòng tạo qua Dashboard > Storage > Policies';
ELSE RAISE NOTICE '✓ OK: Đã có % Storage policies',
policy_count;
END IF;
END $$;
SELECT 'Hoàn tất! Nhớ tạo Storage policies qua Dashboard nếu chưa có.' as result;