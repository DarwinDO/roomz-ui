BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.demo_uuid(p_seed text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    substr(md5(p_seed), 1, 8) || '-' ||
    substr(md5(p_seed), 9, 4) || '-' ||
    '4' || substr(md5(p_seed), 14, 3) || '-' ||
    'a' || substr(md5(p_seed), 18, 3) || '-' ||
    substr(md5(p_seed), 21, 12)
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_email_local(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    both '.'
    FROM regexp_replace(
      lower(extensions.unaccent(COALESCE(p_value, ''))),
      '[^a-z0-9]+',
      '.',
      'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION pg_temp.demo_avatar_url(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT format(
    'https://api.dicebear.com/9.x/personas/svg?seed=%s',
    replace(extensions.unaccent(COALESCE(p_value, '')), ' ', '%20')
  );
$$;

CREATE TEMP TABLE pg_temp.demo_landlord_profiles AS
WITH base AS (
  SELECT
    gs AS idx,
    pg_temp.demo_uuid(format('demo-user-landlord-%s', lpad(gs::text, 2, '0'))) AS user_id,
    CASE
      WHEN gs <= 6 THEN 'Thành phố Hà Nội'
      WHEN gs <= 12 THEN 'Thành phố Hồ Chí Minh'
      WHEN gs <= 18 THEN 'Thành phố Đà Nẵng'
      ELSE 'Thành phố Cần Thơ'
    END AS city,
    CASE WHEN gs % 3 = 0 THEN 'female' ELSE 'male' END AS persona_gender
  FROM generate_series(1, 24) AS gs
),
identities AS (
  SELECT
    b.idx,
    b.user_id,
    b.city,
    b.persona_gender,
    concat_ws(
      ' ',
      (ARRAY['Nguyễn','Trần','Lê','Phạm','Hoàng','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Trịnh'])[1 + (((b.idx - 1) * 5) % 16)],
      CASE
        WHEN b.persona_gender = 'female'
          THEN (ARRAY['Thu','Ngọc','Thanh','Bảo','Quỳnh','Minh','Mỹ','Diệu','Tú','Lan'])[1 + (((b.idx - 1) * 3 + ((b.idx - 1) / 12)) % 10)]
        ELSE (ARRAY['Minh','Quốc','Thanh','Công','Hữu','Đức','Gia','Anh','Văn','Nhật'])[1 + (((b.idx - 1) * 3 + ((b.idx - 1) / 12)) % 10)]
      END,
      CASE
        WHEN b.persona_gender = 'female'
          THEN (ARRAY['Anh','Hạnh','Hương','Lan','Linh','Mai','Nga','Oanh','Thảo','Trang','Vy','Yến'])[1 + (((b.idx - 1) * 7 + ((b.idx - 1) / 8)) % 12)]
        ELSE (ARRAY['Hải','Hùng','Khánh','Nam','Phong','Quang','Sơn','Thành','Tiến','Trung','Tuấn','Vinh'])[1 + (((b.idx - 1) * 7 + ((b.idx - 1) / 8)) % 12)]
      END
    ) AS full_name
  FROM base AS b
)
SELECT
  idx,
  user_id,
  full_name,
  format('%s.l%s@example.com', pg_temp.demo_email_local(full_name), lpad(idx::text, 2, '0')) AS email,
  format(
    '0%s%s',
    (ARRAY['88','86','90','93','96','97','98','82','83','84','85','81'])[1 + ((idx - 1) % 12)],
    lpad(((idx * 27183) % 10000000)::text, 7, '0')
  ) AS phone,
  pg_temp.demo_avatar_url(full_name) AS avatar_url,
  CASE
    WHEN persona_gender = 'female'
      THEN format('Chủ nhà thân thiện đang trực tiếp quản lý phòng cho thuê tại %s, hỗ trợ xem phòng linh hoạt trong tuần.', city)
    ELSE format('Chủ nhà đã xác minh, đang quản lý phòng cho thuê tại %s và phản hồi khá nhanh.', city)
  END AS bio
FROM identities;

CREATE TEMP TABLE pg_temp.demo_student_profiles AS
WITH base AS (
  SELECT
    gs AS idx,
    pg_temp.demo_uuid(format('demo-user-student-%s', lpad(gs::text, 3, '0'))) AS user_id,
    CASE
      WHEN gs <= 45 THEN 'Thành phố Hà Nội'
      WHEN gs <= 80 THEN 'Thành phố Hồ Chí Minh'
      WHEN gs <= 92 THEN 'Thành phố Đà Nẵng'
      ELSE 'Thành phố Cần Thơ'
    END AS city,
    CASE WHEN gs % 2 = 0 THEN 'male' ELSE 'female' END AS gender,
    CASE
      WHEN gs % 9 = 0 THEN CASE WHEN gs % 2 = 0 THEN 'female' ELSE 'male' END
      WHEN gs % 7 = 0 THEN CASE WHEN gs % 2 = 0 THEN 'male' ELSE 'female' END
      ELSE 'any'
    END AS preferred_gender,
    CASE ((gs - 1) % 5) + 1
      WHEN 1 THEN 'student'
      WHEN 2 THEN 'student'
      WHEN 3 THEN 'worker'
      WHEN 4 THEN 'worker'
      ELSE 'freelancer'
    END AS occupation,
    CASE
      WHEN gs <= 45 THEN 'Đại học Bách khoa Hà Nội'
      WHEN gs <= 80 THEN 'Đại học Quốc gia TP.HCM'
      WHEN gs <= 92 THEN 'Đại học Đà Nẵng'
      ELSE 'Đại học Cần Thơ'
    END AS university,
    CASE ((gs - 1) % 5) + 1
      WHEN 1 THEN 'Công nghệ thông tin'
      WHEN 2 THEN 'Marketing'
      WHEN 3 THEN 'Quản trị kinh doanh'
      WHEN 4 THEN 'Tài chính'
      ELSE 'Thiết kế'
    END AS major
  FROM generate_series(1, 100) AS gs
),
identities AS (
  SELECT
    b.idx,
    b.user_id,
    b.city,
    b.gender,
    b.preferred_gender,
    b.occupation,
    b.university,
    b.major,
    concat_ws(
      ' ',
      (ARRAY['Nguyễn','Trần','Lê','Phạm','Hoàng','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Trịnh'])[1 + (((b.idx - 1) * 5) % 16)],
      CASE
        WHEN b.gender = 'female'
          THEN (ARRAY['Ngọc','Khánh','Mai','Bảo','Thanh','Phương','Quỳnh','Ánh','Tú','Diệu'])[1 + (((b.idx - 1) * 3 + ((b.idx - 1) / 16)) % 10)]
        ELSE (ARRAY['Gia','Minh','Quốc','Thanh','Anh','Đức','Nhật','Hữu','Tuấn','Thiên'])[1 + (((b.idx - 1) * 3 + ((b.idx - 1) / 16)) % 10)]
      END,
      CASE
        WHEN b.gender = 'female'
          THEN (ARRAY['An','Chi','Giang','Linh','Mai','My','Nhi','Ngân','Phương','Quỳnh','Thảo','Trang','Trâm','Uyên','Vy','Yến'])[1 + (((b.idx - 1) * 7 + ((b.idx - 1) / 10)) % 16)]
        ELSE (ARRAY['An','Bảo','Duy','Huy','Khang','Khoa','Long','Minh','Nam','Phúc','Quân','Tùng','Vũ','Đạt','Khôi','Hải'])[1 + (((b.idx - 1) * 7 + ((b.idx - 1) / 10)) % 16)]
      END
    ) AS full_name
  FROM base AS b
)
SELECT
  idx,
  user_id,
  full_name,
  format('%s.s%s@example.com', pg_temp.demo_email_local(full_name), lpad(idx::text, 3, '0')) AS email,
  format(
    '0%s%s',
    (ARRAY['32','33','34','35','36','37','38','39','70','76','77','78','79','81','82','83','84','85','86','88','89','90','91','93','94','96','97','98'])[1 + ((idx - 1) % 28)],
    lpad(((idx * 28411) % 10000000)::text, 7, '0')
  ) AS phone,
  pg_temp.demo_avatar_url(full_name) AS avatar_url,
  CASE occupation
    WHEN 'student'
      THEN format('Sinh viên %s tại %s, đang ưu tiên tìm chỗ ở sạch sẽ và yên tĩnh tại %s.', major, university, city)
    WHEN 'worker'
      THEN format('Đang học và đi làm thêm, ưu tiên nơi ở gọn gàng, an toàn và thuận tiện di chuyển tại %s.', city)
    ELSE format('Lịch sinh hoạt linh hoạt, cần chỗ ở ngăn nắp và dễ kết nối khu trung tâm ở %s.', city)
  END AS bio
FROM identities;

UPDATE public.users AS u
SET
  full_name = p.full_name,
  email = p.email,
  phone = p.phone,
  avatar_url = p.avatar_url,
  bio = p.bio,
  updated_at = now(),
  preferences = coalesce(u.preferences, '{}'::jsonb) || jsonb_build_object(
    'seed_group', 'staging_demo',
    'seed_profile_style', 'vn_realistic',
    'seed_profile_version', '20260413'
  )
FROM pg_temp.demo_landlord_profiles AS p
WHERE u.id = p.user_id
  AND u.role = 'landlord'
  AND coalesce(u.preferences->>'seed_group', '') = 'staging_demo';

UPDATE public.users AS u
SET
  full_name = p.full_name,
  email = p.email,
  phone = p.phone,
  avatar_url = p.avatar_url,
  bio = p.bio,
  updated_at = now(),
  preferences = coalesce(u.preferences, '{}'::jsonb) || jsonb_build_object(
    'seed_group', 'staging_demo',
    'seed_profile_style', 'vn_realistic',
    'seed_profile_version', '20260413'
  )
FROM pg_temp.demo_student_profiles AS p
WHERE u.id = p.user_id
  AND u.role = 'student'
  AND coalesce(u.preferences->>'seed_group', '') = 'staging_demo';

UPDATE public.users
SET
  full_name = 'Trần Minh Quân',
  email = 'tran.minh.quan.admin@example.com',
  phone = '0919000001',
  avatar_url = pg_temp.demo_avatar_url('Trần Minh Quân'),
  bio = 'Điều phối dữ liệu mô phỏng và vận hành môi trường staging của RommZ.',
  updated_at = now(),
  preferences = coalesce(preferences, '{}'::jsonb) || jsonb_build_object(
    'seed_group', 'staging_demo',
    'seed_profile_style', 'vn_realistic',
    'seed_profile_version', '20260413'
  )
WHERE id = pg_temp.demo_uuid('demo-user-admin')
  AND role = 'admin'
  AND coalesce(preferences->>'seed_group', '') = 'staging_demo';

COMMIT;
