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

DROP TABLE IF EXISTS pg_temp.demo_landlords;

CREATE TEMP TABLE pg_temp.demo_landlords AS
WITH base AS (
  SELECT
    gs AS idx,
    pg_temp.demo_uuid(format('demo-user-landlord-%s', lpad(gs::text, 2, '0'))) AS id,
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
    b.id,
    b.city,
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
  id,
  format('%s.l%s@example.com', pg_temp.demo_email_local(full_name), lpad(idx::text, 2, '0')) AS email,
  full_name,
  format(
    '0%s%s',
    (ARRAY['88','86','90','93','96','97','98','82','83','84','85','81'])[1 + ((idx - 1) % 12)],
    lpad(((idx * 27183) % 10000000)::text, 7, '0')
  ) AS phone,
  pg_temp.demo_avatar_url(full_name) AS avatar_url,
  format(
    '%s tại %s, phản hồi nhanh và ưu tiên khách ở gọn gàng.',
    CASE WHEN persona_gender = 'female' THEN 'Chủ nhà thân thiện đang trực tiếp quản lý phòng cho thuê' ELSE 'Chủ nhà đã xác minh, đang quản lý phòng cho thuê' END,
    city
  ) AS bio,
  city
FROM identities
JOIN base USING (idx, id, city);

DROP TABLE IF EXISTS pg_temp.demo_students;

CREATE TEMP TABLE pg_temp.demo_students AS
WITH base AS (
  SELECT
    gs AS idx,
    pg_temp.demo_uuid(format('demo-user-student-%s', lpad(gs::text, 3, '0'))) AS id,
    ((gs - 1) % 5) + 1 AS persona,
    CASE
      WHEN gs <= 45 THEN 'Thành phố Hà Nội'
      WHEN gs <= 80 THEN 'Thành phố Hồ Chí Minh'
      WHEN gs <= 92 THEN 'Thành phố Đà Nẵng'
      ELSE 'Thành phố Cần Thơ'
    END AS city,
    CASE
      WHEN gs <= 45 THEN (ARRAY['Quận Ba Đình','Quận Cầu Giấy','Quận Đống Đa','Quận Hai Bà Trưng','Quận Hoàng Mai','Quận Nam Từ Liêm'])[1 + ((gs - 1) % 6)]
      WHEN gs <= 80 THEN (ARRAY['Quận 1','Quận 3','Quận Bình Thạnh','Quận Gò Vấp','Thành phố Thủ Đức','Quận Tân Bình'])[1 + ((gs - 46) % 6)]
      WHEN gs <= 92 THEN (ARRAY['Quận Hải Châu','Quận Thanh Khê','Quận Sơn Trà','Quận Ngũ Hành Sơn'])[1 + ((gs - 81) % 4)]
      ELSE (ARRAY['Quận Ninh Kiều','Quận Cái Răng','Quận Bình Thủy'])[1 + ((gs - 93) % 3)]
    END AS district,
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
    b.id,
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
  base.idx,
  base.id,
  format('%s.s%s@example.com', pg_temp.demo_email_local(identities.full_name), lpad(base.idx::text, 3, '0')) AS email,
  identities.full_name,
  format(
    '0%s%s',
    (ARRAY['32','33','34','35','36','37','38','39','70','76','77','78','79','81','82','83','84','85','86','88','89','90','91','93','94','96','97','98'])[1 + ((base.idx - 1) % 28)],
    lpad(((base.idx * 28411) % 10000000)::text, 7, '0')
  ) AS phone,
  base.persona,
  base.city,
  base.district,
  base.gender,
  base.preferred_gender,
  base.occupation,
  base.university,
  base.major,
  pg_temp.demo_avatar_url(identities.full_name) AS avatar_url,
  CASE base.occupation
    WHEN 'student'
      THEN format('Sinh viên %s tại %s, đang ưu tiên tìm chỗ ở sạch sẽ và yên tĩnh tại %s.', base.major, base.university, base.city)
    WHEN 'worker'
      THEN format('Đang học và đi làm thêm, ưu tiên nơi ở gọn gàng, an toàn và thuận tiện di chuyển tại %s.', base.city)
    ELSE format('Lịch sinh hoạt linh hoạt, cần chỗ ở ngăn nắp và dễ kết nối khu trung tâm ở %s.', base.city)
  END AS bio
FROM base
JOIN identities USING (idx, id);

INSERT INTO public.users (id, email, password_hash, full_name, phone, avatar_url, role, account_status, email_verified, phone_verified, trust_score, is_premium, premium_until, bio, created_at, updated_at, last_seen, preferences)
VALUES (pg_temp.demo_uuid('demo-user-admin'), 'tran.minh.quan.admin@example.com', '', 'Trần Minh Quân', '0919000001', pg_temp.demo_avatar_url('Trần Minh Quân'), 'admin'::public.user_role, 'active'::public.account_status, true, true, 99, true, now() + interval '180 days', 'Điều phối dữ liệu mô phỏng và vận hành môi trường staging của RommZ.', now() - interval '180 days', now(), now() - interval '10 minutes', jsonb_build_object('seed_group', 'staging_demo', 'kind', 'admin', 'seed_profile_style', 'vn_realistic', 'seed_profile_version', '20260413'))
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status,
  email_verified = EXCLUDED.email_verified,
  phone_verified = EXCLUDED.phone_verified,
  trust_score = EXCLUDED.trust_score,
  is_premium = EXCLUDED.is_premium,
  premium_until = EXCLUDED.premium_until,
  bio = EXCLUDED.bio,
  updated_at = EXCLUDED.updated_at,
  last_seen = EXCLUDED.last_seen,
  preferences = EXCLUDED.preferences;

INSERT INTO public.users (id, email, password_hash, full_name, phone, avatar_url, role, account_status, email_verified, phone_verified, trust_score, bio, created_at, updated_at, last_seen, preferences)
SELECT id, email, '', full_name, phone, avatar_url, 'landlord'::public.user_role, 'active'::public.account_status, true, true, 78 + (idx % 15), bio, now() - ((40 + idx) || ' days')::interval, now(), now() - ((idx % 48) || ' hours')::interval, jsonb_build_object('seed_group', 'staging_demo', 'kind', 'landlord', 'city', city, 'seed_profile_style', 'vn_realistic', 'seed_profile_version', '20260413')
FROM pg_temp.demo_landlords
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status,
  email_verified = EXCLUDED.email_verified,
  phone_verified = EXCLUDED.phone_verified,
  trust_score = EXCLUDED.trust_score,
  bio = EXCLUDED.bio,
  updated_at = EXCLUDED.updated_at,
  last_seen = EXCLUDED.last_seen,
  preferences = EXCLUDED.preferences;

INSERT INTO public.users (id, email, password_hash, full_name, phone, avatar_url, university, major, gender, role, account_status, email_verified, phone_verified, trust_score, is_premium, premium_until, bio, created_at, updated_at, last_seen, preferences)
SELECT id, email, '', full_name, phone, avatar_url, university, major, gender::public.user_gender, 'student'::public.user_role, 'active'::public.account_status, true, true, 62 + (idx % 25), idx % 11 = 0, CASE WHEN idx % 11 = 0 THEN now() + interval '45 days' ELSE NULL END, bio, now() - ((10 + (idx % 90)) || ' days')::interval, now(), now() - ((idx % 72) || ' hours')::interval, jsonb_build_object('seed_group', 'staging_demo', 'kind', 'student', 'city', city, 'persona', persona, 'seed_profile_style', 'vn_realistic', 'seed_profile_version', '20260413')
FROM pg_temp.demo_students
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url,
  university = EXCLUDED.university,
  major = EXCLUDED.major,
  gender = EXCLUDED.gender,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status,
  email_verified = EXCLUDED.email_verified,
  phone_verified = EXCLUDED.phone_verified,
  trust_score = EXCLUDED.trust_score,
  is_premium = EXCLUDED.is_premium,
  premium_until = EXCLUDED.premium_until,
  bio = EXCLUDED.bio,
  updated_at = EXCLUDED.updated_at,
  last_seen = EXCLUDED.last_seen,
  preferences = EXCLUDED.preferences;

INSERT INTO public.subscriptions (
  id,
  user_id,
  plan,
  status,
  promo_applied,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  payment_provider,
  amount_paid,
  payment_method,
  created_at,
  updated_at
)
VALUES (
  pg_temp.demo_uuid('demo-subscription-admin'),
  pg_temp.demo_uuid('demo-user-admin'),
  'rommz_plus',
  'active',
  false,
  now() - interval '15 days',
  now() + interval '180 days',
  false,
  'seed',
  39000,
  'seed',
  now() - interval '15 days',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (
  id,
  user_id,
  plan,
  status,
  promo_applied,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  payment_provider,
  amount_paid,
  payment_method,
  created_at,
  updated_at
)
SELECT
  pg_temp.demo_uuid(format('demo-subscription-student-%s', lpad(idx::text, 3, '0'))),
  id,
  'rommz_plus',
  'active',
  false,
  now() - interval '10 days',
  now() + interval '45 days',
  false,
  'seed',
  39000,
  'seed',
  now() - interval '10 days',
  now()
FROM pg_temp.demo_students
WHERE idx % 11 = 0
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE pg_temp.demo_partners AS
SELECT
  gs AS idx,
  pg_temp.demo_uuid(format('demo-partner-%s', lpad(gs::text, 2, '0'))) AS id,
  CASE ((gs - 1) / 10) WHEN 0 THEN 'moving' WHEN 1 THEN 'cleaning' WHEN 2 THEN 'utilities' WHEN 3 THEN 'furniture' WHEN 4 THEN 'real_estate' ELSE 'other' END AS category,
  CASE WHEN gs <= 18 THEN 'Thành phố Hà Nội' WHEN gs <= 36 THEN 'Thành phố Hồ Chí Minh' WHEN gs <= 48 THEN 'Thành phố Đà Nẵng' ELSE 'Thành phố Cần Thơ' END AS city,
  CASE WHEN gs <= 18 THEN (ARRAY['Quận Ba Đình','Quận Cầu Giấy','Quận Đống Đa','Quận Hai Bà Trưng','Quận Hoàng Mai','Quận Nam Từ Liêm'])[1 + ((gs - 1) % 6)] WHEN gs <= 36 THEN (ARRAY['Quận 1','Quận 3','Quận Bình Thạnh','Quận Gò Vấp','Thành phố Thủ Đức','Quận Tân Bình'])[1 + ((gs - 19) % 6)] WHEN gs <= 48 THEN (ARRAY['Quận Hải Châu','Quận Thanh Khê','Quận Sơn Trà','Quận Ngũ Hành Sơn'])[1 + ((gs - 37) % 4)] ELSE (ARRAY['Quận Ninh Kiều','Quận Cái Răng','Quận Bình Thủy'])[1 + ((gs - 49) % 3)] END AS district,
  CASE WHEN gs % 19 = 0 THEN 'inactive' WHEN gs % 13 = 0 THEN 'inactive' WHEN gs % 7 = 0 THEN 'inactive' ELSE 'active' END AS status
FROM generate_series(1, 60) AS gs;

INSERT INTO public.partners (id, user_id, name, category, specialization, discount, rating, review_count, status, image_url, contact_info, views, description, address, phone, email, hours, latitude, longitude, created_at, updated_at)
SELECT id, NULL, format('%s %s', CASE category WHEN 'moving' THEN 'MoveFast' WHEN 'cleaning' THEN 'CleanDay' WHEN 'utilities' THEN 'UtilityCare' WHEN 'furniture' THEN 'HomeSetup' WHEN 'real_estate' THEN 'StayReady' ELSE 'CampusSupport' END, lpad(idx::text, 2, '0')), category, CASE category WHEN 'moving' THEN 'Chuyen tro, boc xep' WHEN 'cleaning' THEN 'Don dep phong' WHEN 'utilities' THEN 'Dien nuoc, internet' WHEN 'furniture' THEN 'Lap dat noi that' WHEN 'real_estate' THEN 'Tu van thue phong' ELSE 'Ho tro sinh vien' END, CASE category WHEN 'moving' THEN 'Giam 12% cho sinh vien' WHEN 'cleaning' THEN 'Tang them 1 gio ve sinh' WHEN 'utilities' THEN 'Mien phi kiem tra ban dau' WHEN 'furniture' THEN 'Giam 8% cho combo' WHEN 'real_estate' THEN 'Mien phi tu van lan dau' ELSE 'Uu dai linh hoat' END, CASE WHEN status = 'active' THEN round((4.2 + ((idx % 6) * 0.1))::numeric, 1) ELSE 3.8 END, 15 + (idx * 3), status, format('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80&sig=%s', 700 + idx), jsonb_build_object('phone', format('08%08s', 71000000 + idx), 'email', format('partner%s@rommz.local', lpad(idx::text, 2, '0')), 'city', city), 20 + (idx * 4), format('Doi tac demo cho %s tai %s.', category, city), format('%s, %s, %s', 40 + idx, district, city), format('08%08s', 72000000 + idx), format('partner%s@rommz.local', lpad(idx::text, 2, '0')), CASE WHEN category IN ('moving','cleaning') THEN '07:00 - 21:00' ELSE '08:00 - 19:00' END, CASE city WHEN 'Thành phố Hà Nội' THEN round((21.0285 + (((idx % 5) - 2) * 0.007))::numeric, 6) WHEN 'Thành phố Hồ Chí Minh' THEN round((10.7769 + (((idx % 5) - 2) * 0.006))::numeric, 6) WHEN 'Thành phố Đà Nẵng' THEN round((16.0544 + (((idx % 5) - 2) * 0.006))::numeric, 6) ELSE round((10.0452 + (((idx % 5) - 2) * 0.006))::numeric, 6) END, CASE city WHEN 'Thành phố Hà Nội' THEN round((105.8542 + (((idx % 7) - 3) * 0.006))::numeric, 6) WHEN 'Thành phố Hồ Chí Minh' THEN round((106.7009 + (((idx % 7) - 3) * 0.006))::numeric, 6) WHEN 'Thành phố Đà Nẵng' THEN round((108.2022 + (((idx % 7) - 3) * 0.006))::numeric, 6) ELSE round((105.7469 + (((idx % 7) - 3) * 0.006))::numeric, 6) END, now() - ((20 + idx) || ' days')::interval, now()
FROM pg_temp.demo_partners
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deals (id, partner_id, title, discount_value, description, valid_until, is_active, created_at, updated_at, is_premium_only)
SELECT pg_temp.demo_uuid(format('demo-deal-%s', lpad(gs::text, 2, '0'))), pg_temp.demo_uuid(format('demo-partner-%s', lpad(gs::text, 2, '0'))), format('Uu dai demo %s', lpad(gs::text, 2, '0')), CASE gs % 4 WHEN 0 THEN '15%' WHEN 1 THEN '200.000d' WHEN 2 THEN '10%' ELSE 'Mien phi khao sat' END, 'Voucher demo cho Local Passport va trang doi tac.', now() + ((30 + gs) || ' days')::interval, true, now() - ((10 + gs) || ' days')::interval, now(), gs % 5 = 0
FROM generate_series(1, 24) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.location_catalog (
  id,
  name,
  normalized_name,
  location_type,
  city,
  district,
  address,
  latitude,
  longitude,
  source_name,
  source_url,
  source_domain,
  external_id,
  tags,
  metadata,
  status,
  created_at,
  updated_at
)
SELECT
  pg_temp.demo_uuid(seed.external_id),
  seed.name,
  public.normalize_location_name(seed.name),
  seed.location_type,
  seed.city,
  seed.district,
  seed.address,
  seed.latitude,
  seed.longitude,
  'staging_demo_seed',
  'https://roomz.local/seeds/location-catalog',
  'roomz.local',
  seed.external_id,
  seed.tags,
  jsonb_build_object('seed_group', 'staging_demo'),
  'active',
  now() - interval '14 days',
  now()
FROM (
  VALUES
    ('demo-location-hn-bach-khoa', 'Đại học Bách khoa Hà Nội', 'university', 'Thành phố Hà Nội', 'Quận Hai Bà Trưng', '1 Đại Cồ Việt, Quận Hai Bà Trưng, Thành phố Hà Nội', 21.0056, 105.8431, ARRAY['engineering', 'student']::text[]),
    ('demo-location-hn-ngoai-thuong', 'Đại học Ngoại thương', 'university', 'Thành phố Hà Nội', 'Quận Đống Đa', '91 Chùa Láng, Quận Đống Đa, Thành phố Hà Nội', 21.0226, 105.8072, ARRAY['economics', 'student']::text[]),
    ('demo-location-hn-my-dinh', 'Bến xe Mỹ Đình', 'station', 'Thành phố Hà Nội', 'Quận Nam Từ Liêm', '20 Phạm Hùng, Quận Nam Từ Liêm, Thành phố Hà Nội', 21.0288, 105.7805, ARRAY['bus', 'transit']::text[]),
    ('demo-location-hn-ho-guom', 'Hồ Gươm', 'landmark', 'Thành phố Hà Nội', 'Quận Hoàn Kiếm', 'Phố Đinh Tiên Hoàng, Quận Hoàn Kiếm, Thành phố Hà Nội', 21.0287, 105.8524, ARRAY['landmark', 'city_center']::text[]),
    ('demo-location-hn-cau-giay', 'Khu vực Cầu Giấy', 'district', 'Thành phố Hà Nội', 'Quận Cầu Giấy', 'Quận Cầu Giấy, Thành phố Hà Nội', 21.0368, 105.7903, ARRAY['district', 'student_hub']::text[]),
    ('demo-location-hcm-ute', 'Đại học Sư phạm Kỹ thuật', 'university', 'Thành phố Hồ Chí Minh', 'Thành phố Thủ Đức', '1 Võ Văn Ngân, Thành phố Thủ Đức, Thành phố Hồ Chí Minh', 10.8508, 106.7718, ARRAY['engineering', 'student']::text[]),
    ('demo-location-hcm-hutech', 'HUTECH', 'university', 'Thành phố Hồ Chí Minh', 'Quận Bình Thạnh', '475A Điện Biên Phủ, Quận Bình Thạnh, Thành phố Hồ Chí Minh', 10.8018, 106.7148, ARRAY['student', 'campus']::text[]),
    ('demo-location-hcm-ben-thanh', 'Chợ Bến Thành', 'landmark', 'Thành phố Hồ Chí Minh', 'Quận 1', 'Lê Lợi, Quận 1, Thành phố Hồ Chí Minh', 10.7725, 106.6980, ARRAY['landmark', 'city_center']::text[]),
    ('demo-location-hcm-mien-dong', 'Bến xe Miền Đông', 'station', 'Thành phố Hồ Chí Minh', 'Quận Bình Thạnh', '292 Đinh Bộ Lĩnh, Quận Bình Thạnh, Thành phố Hồ Chí Minh', 10.8166, 106.7100, ARRAY['bus', 'transit']::text[]),
    ('demo-location-hcm-thu-duc', 'Khu vực Thủ Đức', 'district', 'Thành phố Hồ Chí Minh', 'Thành phố Thủ Đức', 'Thành phố Thủ Đức, Thành phố Hồ Chí Minh', 10.8498, 106.7710, ARRAY['district', 'student_hub']::text[]),
    ('demo-location-dn-dhbk', 'Đại học Bách khoa Đà Nẵng', 'university', 'Thành phố Đà Nẵng', 'Quận Liên Chiểu', '54 Nguyễn Lương Bằng, Quận Liên Chiểu, Thành phố Đà Nẵng', 16.0739, 108.1498, ARRAY['engineering', 'student']::text[]),
    ('demo-location-dn-dhkt', 'Đại học Kinh tế Đà Nẵng', 'university', 'Thành phố Đà Nẵng', 'Quận Ngũ Hành Sơn', '71 Ngũ Hành Sơn, Quận Ngũ Hành Sơn, Thành phố Đà Nẵng', 16.0365, 108.2496, ARRAY['economics', 'student']::text[]),
    ('demo-location-dn-san-bay', 'Sân bay Đà Nẵng', 'station', 'Thành phố Đà Nẵng', 'Quận Hải Châu', 'Duy Tân, Quận Hải Châu, Thành phố Đà Nẵng', 16.0439, 108.1995, ARRAY['airport', 'transit']::text[]),
    ('demo-location-dn-cau-rong', 'Cầu Rồng', 'landmark', 'Thành phố Đà Nẵng', 'Quận Hải Châu', 'Cầu Rồng, Quận Hải Châu, Thành phố Đà Nẵng', 16.0616, 108.2275, ARRAY['landmark', 'tourism']::text[]),
    ('demo-location-dn-hai-chau', 'Khu vực Hải Châu', 'district', 'Thành phố Đà Nẵng', 'Quận Hải Châu', 'Quận Hải Châu, Thành phố Đà Nẵng', 16.0544, 108.2022, ARRAY['district', 'city_center']::text[]),
    ('demo-location-ct-dhct', 'Đại học Cần Thơ', 'university', 'Thành phố Cần Thơ', 'Quận Ninh Kiều', 'Khu II, Quận Ninh Kiều, Thành phố Cần Thơ', 10.0295, 105.7708, ARRAY['student', 'campus']::text[]),
    ('demo-location-ct-ben-ninh-kieu', 'Bến Ninh Kiều', 'landmark', 'Thành phố Cần Thơ', 'Quận Ninh Kiều', 'Hai Bà Trưng, Quận Ninh Kiều, Thành phố Cần Thơ', 10.0344, 105.7871, ARRAY['landmark', 'city_center']::text[]),
    ('demo-location-ct-cang', 'Bến xe trung tâm Cần Thơ', 'station', 'Thành phố Cần Thơ', 'Quận Cái Răng', '91B, Quận Cái Răng, Thành phố Cần Thơ', 10.0130, 105.7552, ARRAY['bus', 'transit']::text[]),
    ('demo-location-ct-ninh-kieu', 'Khu vực Ninh Kiều', 'district', 'Thành phố Cần Thơ', 'Quận Ninh Kiều', 'Quận Ninh Kiều, Thành phố Cần Thơ', 10.0302, 105.7681, ARRAY['district', 'city_center']::text[])
) AS seed(external_id, name, location_type, city, district, address, latitude, longitude, tags)
ON CONFLICT (location_type, normalized_name, city, district)
DO UPDATE SET
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  tags = EXCLUDED.tags,
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  source_domain = EXCLUDED.source_domain,
  external_id = EXCLUDED.external_id,
  updated_at = now();

CREATE TEMP TABLE pg_temp.demo_rooms AS
SELECT gs AS idx, pg_temp.demo_uuid(format('demo-room-%s', lpad(gs::text, 3, '0'))) AS id, pg_temp.demo_uuid(format('demo-user-landlord-%s', lpad((((gs - 1) % 24) + 1)::text, 2, '0'))) AS landlord_id, CASE WHEN gs <= 120 THEN 'Thành phố Hà Nội' WHEN gs <= 240 THEN 'Thành phố Hồ Chí Minh' WHEN gs <= 280 THEN 'Thành phố Đà Nẵng' ELSE 'Thành phố Cần Thơ' END AS city, CASE WHEN gs <= 120 THEN (ARRAY['Quận Ba Đình','Quận Cầu Giấy','Quận Đống Đa','Quận Hai Bà Trưng','Quận Hoàng Mai','Quận Nam Từ Liêm'])[1 + ((gs - 1) % 6)] WHEN gs <= 240 THEN (ARRAY['Quận 1','Quận 3','Quận Bình Thạnh','Quận Gò Vấp','Thành phố Thủ Đức','Quận Tân Bình'])[1 + ((gs - 121) % 6)] WHEN gs <= 280 THEN (ARRAY['Quận Hải Châu','Quận Thanh Khê','Quận Sơn Trà','Quận Ngũ Hành Sơn'])[1 + ((gs - 241) % 4)] ELSE (ARRAY['Quận Ninh Kiều','Quận Cái Răng','Quận Bình Thủy'])[1 + ((gs - 281) % 3)] END AS district, CASE ((gs - 1) % 4) WHEN 0 THEN 'private' WHEN 1 THEN 'shared' WHEN 2 THEN 'studio' ELSE 'entire' END AS room_type, CASE WHEN gs % 37 = 0 THEN 'rejected' WHEN gs % 20 = 0 THEN 'inactive' WHEN gs % 13 = 0 THEN 'rented' WHEN gs % 7 = 0 THEN 'pending' ELSE 'active' END AS status
FROM generate_series(1, 300) AS gs;

INSERT INTO public.rooms (id, landlord_id, title, description, room_type, address, district, city, latitude, longitude, price_per_month, deposit_amount, utilities_included, electricity_cost, water_cost, area_sqm, bedroom_count, bathroom_count, max_occupants, furnished, furniture_details, pet_allowed, smoking_allowed, gender_restriction, available_from, is_available, is_verified, has_360_photos, verification_date, view_count, favorite_count, status, created_at, updated_at, min_lease_term, rejection_reason)
SELECT id, landlord_id, CASE room_type WHEN 'private' THEN format('Phong rieng sang thoang %s', lpad(idx::text, 3, '0')) WHEN 'shared' THEN format('Phong o ghep gia tot %s', lpad(idx::text, 3, '0')) WHEN 'studio' THEN format('Studio tien nghi %s', lpad(idx::text, 3, '0')) ELSE format('Nha nguyen can nhom ban %s', lpad(idx::text, 3, '0')) END, format('Du lieu demo tai %s, %s.', district, city), room_type::public.room_type, format('%s %s, %s, %s', 90 + idx, CASE city WHEN 'Thành phố Hà Nội' THEN 'Pho Tran Cung' WHEN 'Thành phố Hồ Chí Minh' THEN 'Duong Nguyen Gia Tri' WHEN 'Thành phố Đà Nẵng' THEN 'Duong Nguyen Van Linh' ELSE 'Duong 30/4' END, district, city), district, city, CASE city WHEN 'Thành phố Hà Nội' THEN round((21.0285 + (((idx % 7) - 3) * 0.0045))::numeric, 6) WHEN 'Thành phố Hồ Chí Minh' THEN round((10.7769 + (((idx % 7) - 3) * 0.0045))::numeric, 6) WHEN 'Thành phố Đà Nẵng' THEN round((16.0544 + (((idx % 7) - 3) * 0.0045))::numeric, 6) ELSE round((10.0452 + (((idx % 7) - 3) * 0.0045))::numeric, 6) END, CASE city WHEN 'Thành phố Hà Nội' THEN round((105.8542 + (((idx % 5) - 2) * 0.0060))::numeric, 6) WHEN 'Thành phố Hồ Chí Minh' THEN round((106.7009 + (((idx % 5) - 2) * 0.0060))::numeric, 6) WHEN 'Thành phố Đà Nẵng' THEN round((108.2022 + (((idx % 5) - 2) * 0.0060))::numeric, 6) ELSE round((105.7469 + (((idx % 5) - 2) * 0.0060))::numeric, 6) END, CASE city WHEN 'Thành phố Hà Nội' THEN 2700000 WHEN 'Thành phố Hồ Chí Minh' THEN 3200000 WHEN 'Thành phố Đà Nẵng' THEN 2300000 ELSE 2100000 END + CASE room_type WHEN 'shared' THEN 0 WHEN 'private' THEN 700000 WHEN 'studio' THEN 1800000 ELSE 3600000 END + CASE WHEN idx % 3 <> 0 THEN 350000 ELSE 0 END + ((idx % 9) * 90000), 2000000, idx % 4 = 0, '4.000d / kWh', '100.000d / nguoi', CASE room_type WHEN 'shared' THEN 18 + (idx % 6) WHEN 'private' THEN 22 + (idx % 8) WHEN 'studio' THEN 28 + (idx % 10) ELSE 55 + (idx % 18) END, CASE WHEN room_type = 'entire' THEN 2 ELSE 1 END, CASE WHEN room_type = 'entire' THEN 2 ELSE 1 END, CASE room_type WHEN 'shared' THEN 2 WHEN 'private' THEN 2 WHEN 'studio' THEN 2 ELSE 4 END, idx % 3 <> 0, CASE WHEN idx % 3 <> 0 THEN jsonb_build_object('bed', 1, 'desk', 1, 'wardrobe', 1, 'aircon', true) ELSE NULL END, idx % 9 = 0, idx % 8 = 0, CASE WHEN idx % 17 = 0 THEN 'female_only' WHEN idx % 19 = 0 THEN 'male_only' ELSE 'none' END::public.gender_restriction, CURRENT_DATE + ((idx % 35) - 6), status IN ('active', 'pending'), status = 'active' AND idx % 3 <> 1, idx % 10 = 0, CASE WHEN status = 'active' AND idx % 3 <> 1 THEN now() - ((idx % 20) || ' days')::interval ELSE NULL END, 40 + (idx * 3), 0, status::public.room_status, now() - ((50 + idx) || ' days')::interval, now(), CASE WHEN room_type = 'entire' THEN 3 ELSE 1 END, CASE WHEN status = 'rejected' THEN 'Thong tin xac minh chua day du.' ELSE NULL END
FROM pg_temp.demo_rooms
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.room_amenities (id, room_id, wifi, air_conditioning, heater, parking, kitchen, refrigerator, microwave, washing_machine, dryer, tv, security_camera, security_guard, fingerprint_lock, elevator, balcony, gym, swimming_pool, created_at, updated_at)
SELECT pg_temp.demo_uuid(format('demo-room-amenity-%s', lpad(idx::text, 3, '0'))), id, true, idx % 3 <> 0, city = 'Thành phố Hà Nội' AND idx % 5 = 0, idx % 4 <> 0, room_type <> 'shared' OR idx % 2 = 0, room_type <> 'shared', room_type IN ('studio', 'entire'), idx % 3 <> 0, idx % 8 = 0, room_type IN ('studio', 'entire'), true, idx % 7 = 0, idx % 6 = 0, room_type IN ('studio', 'entire'), idx % 2 = 0, idx % 11 = 0, idx % 17 = 0, now() - ((20 + idx) || ' days')::interval, now()
FROM pg_temp.demo_rooms
ON CONFLICT (room_id) DO NOTHING;

INSERT INTO public.room_images (id, room_id, image_url, image_type, display_order, is_primary, caption, created_at)
SELECT pg_temp.demo_uuid(format('demo-room-image-%s-%s', lpad(r.idx::text, 3, '0'), img.idx)), r.id, format('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80&sig=%s', (r.idx * 10) + img.idx), 'photo'::public.image_type, img.idx - 1, img.idx = 1, CASE img.idx WHEN 1 THEN 'Goc nhin chinh' ELSE 'Khong gian phu' END, now() - ((10 + r.idx + img.idx) || ' days')::interval
FROM pg_temp.demo_rooms AS r
CROSS JOIN (VALUES (1), (2)) AS img(idx)
ON CONFLICT (id) DO NOTHING;

CREATE TEMP TABLE pg_temp.demo_roommates AS
SELECT s.idx, pg_temp.demo_uuid(format('demo-roommate-profile-%s', lpad(s.idx::text, 3, '0'))) AS id, s.id AS user_id, CASE WHEN s.idx <= 70 THEN 'looking' WHEN s.idx <= 85 THEN 'paused' ELSE 'found' END AS status, s.city, CASE WHEN s.idx % 12 = 0 THEN NULL ELSE s.district END AS district, CASE s.persona WHEN 1 THEN 4 WHEN 2 THEN 8 WHEN 3 THEN 10 WHEN 4 THEN 6 ELSE 12 END AS search_radius_km, s.idx % 4 = 0 AS university_based, CASE WHEN s.idx % 10 = 0 THEN NULL WHEN s.city = 'Thành phố Hà Nội' THEN 2500000 + (s.persona * 250000) WHEN s.city = 'Thành phố Hồ Chí Minh' THEN 3000000 + (s.persona * 300000) WHEN s.city = 'Thành phố Đà Nẵng' THEN 2200000 + (s.persona * 220000) ELSE 1800000 + (s.persona * 180000) END AS budget_min, CASE WHEN s.idx % 10 = 0 THEN NULL WHEN s.city = 'Thành phố Hà Nội' THEN 4300000 + (s.persona * 250000) WHEN s.city = 'Thành phố Hồ Chí Minh' THEN 5000000 + (s.persona * 300000) WHEN s.city = 'Thành phố Đà Nẵng' THEN 3900000 + (s.persona * 220000) ELSE 3300000 + (s.persona * 180000) END AS budget_max, CASE WHEN s.idx % 15 = 0 THEN NULL ELSE CURRENT_DATE + (5 + (s.idx % 65)) END AS move_in_date, CASE s.persona WHEN 1 THEN ARRAY['private','shared'] WHEN 2 THEN ARRAY['shared','private'] WHEN 3 THEN ARRAY['studio','private'] WHEN 4 THEN ARRAY['private','studio'] ELSE ARRAY['studio','entire'] END AS room_type_preference, CASE WHEN s.idx % 18 = 0 THEN NULL ELSE 18 + (s.idx % 9) END AS age, s.gender, s.preferred_gender, s.occupation, CASE s.persona WHEN 1 THEN 'Uu tien khong gian yen tinh.' WHEN 2 THEN 'Than thien va san sang ket noi.' WHEN 3 THEN 'Thoai mai voi nhip song nang dong.' WHEN 4 THEN 'Gon gang va lich sinh hoat on dinh.' ELSE 'Ton trong rieng tu va linh hoat.' END AS bio, CASE WHEN s.idx % 14 = 0 THEN ARRAY[]::text[] WHEN s.persona = 1 THEN ARRAY['doc sach','ca phe','chay bo'] WHEN s.persona = 2 THEN ARRAY['du lich','chup anh','am nhac'] WHEN s.persona = 3 THEN ARRAY['gym','bong da','xem phim'] WHEN s.persona = 4 THEN ARRAY['nau an','thien','don dep'] ELSE ARRAY['thiet ke','board game','quan moi'] END AS hobbies, CASE WHEN s.idx % 4 = 0 THEN ARRAY['vietnamese','english'] WHEN s.idx % 9 = 0 THEN ARRAY['vietnamese','korean'] ELSE ARRAY['vietnamese'] END AS languages, s.persona FROM pg_temp.demo_students AS s;

INSERT INTO public.roommate_profiles (id, user_id, status, city, district, search_radius_km, university_based, budget_min, budget_max, move_in_date, room_type_preference, age, gender, preferred_gender, occupation, bio, hobbies, languages, created_at, updated_at)
SELECT id, user_id, status::public.roommate_profile_status, city, district, search_radius_km, university_based, budget_min, budget_max, move_in_date, room_type_preference, age, gender, preferred_gender, occupation, bio, hobbies, languages, now() - ((8 + idx) || ' days')::interval, now()
FROM pg_temp.demo_roommates
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.compatibility_answers (id, user_id, question_id, answer_value, created_at, updated_at)
SELECT pg_temp.demo_uuid(format('demo-compatibility-%s-%s', lpad(r.idx::text, 3, '0'), q.question_id)), r.user_id, q.question_id, CASE q.question_id WHEN 1 THEN CASE r.persona WHEN 1 THEN 'early' WHEN 2 THEN 'flexible' WHEN 3 THEN 'late' WHEN 4 THEN 'early' ELSE 'flexible' END WHEN 2 THEN CASE r.persona WHEN 1 THEN 'rarely' WHEN 2 THEN 'sometimes' WHEN 3 THEN 'sometimes' WHEN 4 THEN 'rarely' ELSE 'sometimes' END WHEN 3 THEN CASE r.persona WHEN 1 THEN 'quiet' WHEN 2 THEN 'moderate' WHEN 3 THEN 'noisy' WHEN 4 THEN 'quiet' ELSE 'moderate' END WHEN 4 THEN CASE r.persona WHEN 1 THEN 'home' WHEN 2 THEN 'out' WHEN 3 THEN 'out' WHEN 4 THEN 'mix' ELSE 'mix' END ELSE CASE r.persona WHEN 1 THEN 'organized' WHEN 2 THEN 'moderate' WHEN 3 THEN 'relaxed' WHEN 4 THEN 'organized' ELSE 'relaxed' END END, now() - ((5 + r.idx) || ' days')::interval, now()
FROM pg_temp.demo_roommates AS r
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS q(question_id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.roommate_requests (id, sender_id, receiver_id, status, message, created_at, responded_at, expires_at)
SELECT pg_temp.demo_uuid(format('demo-roommate-request-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad((((gs + 8) % 100) + 1)::text, 3, '0'))), CASE WHEN gs % 9 = 0 THEN 'expired' WHEN gs % 7 = 0 THEN 'cancelled' WHEN gs % 5 = 0 THEN 'declined' WHEN gs % 3 = 0 THEN 'accepted' ELSE 'pending' END::public.roommate_request_status, 'Chao ban, minh thay ho so kha phu hop nen muon ket noi.', now() - ((gs + 2) || ' days')::interval, CASE WHEN gs % 3 = 0 OR gs % 5 = 0 OR gs % 7 = 0 THEN now() - ((gs % 4) || ' days')::interval ELSE NULL END, now() + ((7 - (gs % 3)) || ' days')::interval
FROM generate_series(1, 60) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_leads (id, user_id, partner_id, service_type, status, details, preferred_date, estimated_price, user_rating, user_review, created_at, updated_at, admin_notes, rejection_reason, assigned_at, assigned_by)
SELECT pg_temp.demo_uuid(format('demo-service-lead-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad((((gs - 1) % 90) + 1)::text, 3, '0'))), pg_temp.demo_uuid(format('demo-partner-%s', lpad((CASE ((gs - 1) % 4) WHEN 0 THEN 1 + ((gs - 1) % 10) WHEN 1 THEN 11 + ((gs - 1) % 10) WHEN 2 THEN 31 + ((gs - 1) % 10) ELSE 21 + ((gs - 1) % 10) END)::text, 2, '0'))), CASE ((gs - 1) % 4) WHEN 0 THEN 'moving' WHEN 1 THEN 'cleaning' WHEN 2 THEN 'setup' ELSE 'support' END, CASE WHEN gs % 11 = 0 THEN 'rejected' WHEN gs % 9 = 0 THEN 'cancelled' WHEN gs % 5 = 0 THEN 'completed' WHEN gs % 4 = 0 THEN 'confirmed' WHEN gs % 3 = 0 THEN 'assigned' ELSE 'submitted' END, CASE ((gs - 1) % 4) WHEN 0 THEN jsonb_build_object('pickup_address', format('P%s, Quận Cầu Giấy', gs), 'destination_address', format('D%s, Quận Bình Thạnh', gs), 'items', jsonb_build_array('2 vali', '1 ban hoc')) WHEN 1 THEN jsonb_build_object('address', format('%s, Quận 3', 20 + gs), 'cleaning_type', CASE WHEN gs % 3 = 0 THEN 'deep' WHEN gs % 3 = 1 THEN 'move_in' ELSE 'basic' END, 'num_rooms', 1 + (gs % 3)) WHEN 2 THEN jsonb_build_object('address', format('%s, Quận Hải Châu', 30 + gs), 'setup_type', CASE WHEN gs % 2 = 0 THEN 'furniture' ELSE 'full' END, 'items', jsonb_build_array('giuong', 'ban hoc', 'rem cua')) ELSE jsonb_build_object('category', CASE WHEN gs % 2 = 0 THEN 'internet' ELSE 'dien_nuoc' END, 'address', format('%s, Quận Ninh Kiều', 40 + gs), 'notes', 'Ho tro trong ngay') END, CURRENT_DATE + (2 + (gs % 28)), CASE ((gs - 1) % 4) WHEN 0 THEN 650000 + ((gs % 5) * 180000) WHEN 1 THEN 320000 + ((gs % 4) * 120000) WHEN 2 THEN 540000 + ((gs % 4) * 160000) ELSE 280000 + ((gs % 3) * 90000) END, CASE WHEN gs % 5 = 0 THEN 4 + (gs % 2) ELSE NULL END, CASE WHEN gs % 5 = 0 THEN 'Phan hoi demo sau khi hoan tat.' ELSE NULL END, now() - ((gs % 45) || ' days')::interval, now(), CASE WHEN gs % 11 = 0 THEN 'Lead bi tu choi do thieu thong tin.' WHEN gs % 5 = 0 THEN 'Khach da xac nhan hai long.' WHEN gs % 4 = 0 THEN 'Doi tac da chot lich.' WHEN gs % 3 = 0 THEN 'Da gan doi tac phu hop.' ELSE 'Lead demo moi.' END, CASE WHEN gs % 11 = 0 THEN 'Thong tin yeu cau chua du de tiep nhan.' ELSE NULL END, CASE WHEN gs % 3 = 0 OR gs % 4 = 0 OR gs % 5 = 0 THEN now() - ((gs % 18) || ' days')::interval ELSE NULL END, CASE WHEN gs % 3 = 0 OR gs % 4 = 0 OR gs % 5 = 0 THEN pg_temp.demo_uuid('demo-user-admin') ELSE NULL END
FROM generate_series(1, 150) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.favorites (id, user_id, room_id, created_at)
SELECT pg_temp.demo_uuid(format('demo-favorite-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad((((gs - 1) % 80) + 1)::text, 3, '0'))), pg_temp.demo_uuid(format('demo-room-%s', lpad(((((gs - 1) * 7) % 300) + 1)::text, 3, '0'))), now() - ((gs % 20) || ' days')::interval
FROM generate_series(1, 120) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.bookings (id, room_id, renter_id, landlord_id, booking_date, status, note, created_at, updated_at)
SELECT pg_temp.demo_uuid(format('demo-booking-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-room-%s', lpad(((((gs - 1) * 3) % 180) + 1)::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad((((gs - 1) % 70) + 1)::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-landlord-%s', lpad((((((gs - 1) * 3) % 180) % 24) + 1)::text, 2, '0'))), now() + (((gs % 9) - 3) || ' days')::interval, CASE WHEN gs % 4 = 0 THEN 'completed' WHEN gs % 4 = 1 THEN 'pending' WHEN gs % 4 = 2 THEN 'confirmed' ELSE 'cancelled' END::public.booking_status, 'Lich xem phong demo.', now() - ((gs % 12) || ' days')::interval, now()
FROM generate_series(1, 40) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (id, reviewer_id, room_id, rating, comment, created_at, updated_at)
SELECT pg_temp.demo_uuid(format('demo-room-review-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-room-%s', lpad(((((gs - 1) * 5) % 220) + 1)::text, 3, '0'))), 3 + (gs % 3), 'Danh gia demo cho trang chi tiet phong.', now() - ((gs % 40) || ' days')::interval, now()
FROM generate_series(1, 40) AS gs
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reviews (id, reviewer_id, partner_id, rating, comment, created_at, updated_at)
SELECT pg_temp.demo_uuid(format('demo-partner-review-%s', lpad(gs::text, 3, '0'))), pg_temp.demo_uuid(format('demo-user-student-%s', lpad((40 + gs)::text, 3, '0'))), pg_temp.demo_uuid(format('demo-partner-%s', lpad(gs::text, 2, '0'))), 4 + (gs % 2), 'Danh gia demo cho trang doi tac.', now() - ((gs % 25) || ' days')::interval, now()
FROM generate_series(1, 20) AS gs
ON CONFLICT (id) DO NOTHING;

UPDATE public.rooms AS rooms
SET favorite_count = favorite_stats.favorite_count
FROM (
  SELECT room_id, COUNT(*)::integer AS favorite_count
  FROM public.favorites
  WHERE id IN (
    SELECT pg_temp.demo_uuid(format('demo-favorite-%s', lpad(gs::text, 3, '0')))
    FROM generate_series(1, 120) AS gs
  )
  GROUP BY room_id
) AS favorite_stats
WHERE rooms.id = favorite_stats.room_id;

UPDATE public.partners AS partners
SET
  review_count = review_stats.review_count,
  rating = review_stats.avg_rating
FROM (
  SELECT partner_id, COUNT(*)::integer AS review_count, ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM public.reviews
  WHERE partner_id IS NOT NULL
    AND id IN (
      SELECT pg_temp.demo_uuid(format('demo-partner-review-%s', lpad(gs::text, 3, '0')))
      FROM generate_series(1, 20) AS gs
    )
  GROUP BY partner_id
) AS review_stats
WHERE partners.id = review_stats.partner_id;

COMMIT;

