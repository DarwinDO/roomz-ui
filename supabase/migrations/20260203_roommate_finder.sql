-- ============================================
-- Roommate Finder Feature - Database Migration
-- Version: 20260203_roommate_finder.sql
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

-- Tạo enum cho roommate profile status
CREATE TYPE roommate_profile_status AS ENUM ('looking', 'paused', 'found');

-- Tạo enum cho roommate request status
CREATE TYPE roommate_request_status AS ENUM (
  'pending', 
  'accepted', 
  'declined', 
  'cancelled',
  'expired'
);

-- Thêm roommate_request vào notification_type enum (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'roommate_request' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
    ) THEN
        ALTER TYPE notification_type ADD VALUE 'roommate_request';
    END IF;
END$$;

-- ============================================
-- 2. ROOMMATE PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS roommate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Visibility Status (3 trạng thái)
    status roommate_profile_status DEFAULT 'looking',
    
    -- Location Preferences (REQUIRED - Location-first flow)
    city TEXT NOT NULL,
    district TEXT,
    search_radius_km INTEGER DEFAULT 5 CHECK (search_radius_km >= 1 AND search_radius_km <= 50),
    university_based BOOLEAN DEFAULT false,
    
    -- Room preferences
    budget_min INTEGER CHECK (budget_min >= 0),
    budget_max INTEGER CHECK (budget_max >= 0),
    move_in_date DATE,
    room_type_preference TEXT[] DEFAULT '{}',
    
    -- Personal info
    age INTEGER CHECK (age >= 16 AND age <= 100),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    preferred_gender TEXT DEFAULT 'any' CHECK (preferred_gender IN ('male', 'female', 'any')),
    occupation TEXT CHECK (occupation IN ('student', 'worker', 'freelancer', 'other')),
    
    -- Bio & Interests
    bio TEXT,
    hobbies TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{vietnamese}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT roommate_profiles_user_unique UNIQUE(user_id),
    CONSTRAINT roommate_profiles_budget_check CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

-- Indexes cho query performance
CREATE INDEX IF NOT EXISTS idx_roommate_profiles_location 
ON roommate_profiles(city, district);

CREATE INDEX IF NOT EXISTS idx_roommate_profiles_status_looking 
ON roommate_profiles(status) WHERE status = 'looking';

CREATE INDEX IF NOT EXISTS idx_roommate_profiles_user 
ON roommate_profiles(user_id);

-- ============================================
-- 3. ROOMMATE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS roommate_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status roommate_request_status DEFAULT 'pending',
    message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- 🔒 CONSTRAINT: Không tự request cho mình
    CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

-- 🔒 CONSTRAINT: Chống spam - 1 cặp chỉ 1 pending request
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_request 
ON roommate_requests (sender_id, receiver_id) 
WHERE status = 'pending';

-- Indexes cho query performance
CREATE INDEX IF NOT EXISTS idx_roommate_requests_receiver 
ON roommate_requests(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_roommate_requests_sender 
ON roommate_requests(sender_id, status);

CREATE INDEX IF NOT EXISTS idx_roommate_requests_status_pending 
ON roommate_requests(status) WHERE status = 'pending';

-- ============================================
-- 4. RLS POLICIES - ROOMMATE PROFILES
-- ============================================

ALTER TABLE roommate_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read profiles that are 'looking' or their own
CREATE POLICY "Users can read looking profiles" ON roommate_profiles
  FOR SELECT USING (status = 'looking' OR user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON roommate_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON roommate_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON roommate_profiles
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 5. RLS POLICIES - ROOMMATE REQUESTS (SECURITY REVIEWED)
-- ============================================

ALTER TABLE roommate_requests ENABLE ROW LEVEL SECURITY;

-- 1. View: Cả sender và receiver đều xem được
CREATE POLICY "Users can view their requests" ON roommate_requests
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- 2. Insert: Chỉ sender tạo được
CREATE POLICY "Users can send requests" ON roommate_requests
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 3. Sender Cancel (CHỈ khi pending)
CREATE POLICY "Senders can cancel their requests" ON roommate_requests
  FOR UPDATE
  USING (
    sender_id = auth.uid() 
    AND status = 'pending'
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND status = 'cancelled'
  );

-- 4. Receiver Respond (CHỈ khi pending)
CREATE POLICY "Receivers can respond to requests" ON roommate_requests
  FOR UPDATE
  USING (
    receiver_id = auth.uid() 
    AND status = 'pending'
  )
  WITH CHECK (
    receiver_id = auth.uid()
    AND status IN ('accepted', 'declined')
  );

-- 5. Delete pending requests
CREATE POLICY "Senders can delete pending requests" ON roommate_requests
  FOR DELETE 
  USING (sender_id = auth.uid() AND status = 'pending');

-- ============================================
-- 6. TRIGGER: Auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_roommate_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roommate_profile_updated_at
    BEFORE UPDATE ON roommate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_roommate_profile_updated_at();

-- ============================================
-- 7. TRIGGER: Auto-set responded_at
-- ============================================

CREATE OR REPLACE FUNCTION set_roommate_request_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('accepted', 'declined', 'cancelled') AND OLD.status = 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roommate_request_responded_at
    BEFORE UPDATE ON roommate_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_roommate_request_responded_at();

-- ============================================
-- 8. FUNCTION: Calculate Compatibility Score
-- ============================================

CREATE OR REPLACE FUNCTION calculate_compatibility_score(
    p_user1_id UUID, 
    p_user2_id UUID
) RETURNS TABLE (
    total_score INTEGER,
    sleep_score INTEGER,
    cleanliness_score INTEGER,
    noise_score INTEGER,
    guest_score INTEGER,
    weekend_score INTEGER,
    budget_score INTEGER
) AS $$
DECLARE
    v_u1_prefs RECORD;
    v_u2_prefs RECORD;
    v_u1_profile RECORD;
    v_u2_profile RECORD;
    v_sleep INTEGER := 50;
    v_cleanliness INTEGER := 50;
    v_noise INTEGER := 50;
    v_guest INTEGER := 50;
    v_weekend INTEGER := 50;
    v_budget INTEGER := 50;
BEGIN
    -- Get user preferences
    SELECT * INTO v_u1_prefs FROM user_preferences WHERE user_id = p_user1_id;
    SELECT * INTO v_u2_prefs FROM user_preferences WHERE user_id = p_user2_id;
    SELECT * INTO v_u1_profile FROM roommate_profiles WHERE user_id = p_user1_id;
    SELECT * INTO v_u2_profile FROM roommate_profiles WHERE user_id = p_user2_id;
    
    -- Calculate sleep_schedule score (weight: 25%)
    IF v_u1_prefs.sleep_schedule IS NOT NULL AND v_u2_prefs.sleep_schedule IS NOT NULL THEN
        v_sleep := CASE 
            WHEN v_u1_prefs.sleep_schedule = v_u2_prefs.sleep_schedule THEN 100
            WHEN v_u1_prefs.sleep_schedule = 'flexible' OR v_u2_prefs.sleep_schedule = 'flexible' THEN 70
            ELSE 30
        END;
    END IF;
    
    -- Calculate cleanliness score (weight: 20%)
    IF v_u1_prefs.cleanliness IS NOT NULL AND v_u2_prefs.cleanliness IS NOT NULL THEN
        v_cleanliness := CASE 
            WHEN v_u1_prefs.cleanliness = v_u2_prefs.cleanliness THEN 100
            WHEN (v_u1_prefs.cleanliness = 'moderate') OR (v_u2_prefs.cleanliness = 'moderate') THEN 60
            ELSE 20
        END;
    END IF;
    
    -- Calculate noise_tolerance score (weight: 20%)
    IF v_u1_prefs.noise_tolerance IS NOT NULL AND v_u2_prefs.noise_tolerance IS NOT NULL THEN
        v_noise := CASE 
            WHEN v_u1_prefs.noise_tolerance = v_u2_prefs.noise_tolerance THEN 100
            WHEN v_u1_prefs.noise_tolerance = 'moderate' OR v_u2_prefs.noise_tolerance = 'moderate' THEN 60
            ELSE 20
        END;
    END IF;
    
    -- Calculate guest_frequency score (weight: 15%)
    IF v_u1_prefs.guest_frequency IS NOT NULL AND v_u2_prefs.guest_frequency IS NOT NULL THEN
        v_guest := CASE 
            WHEN v_u1_prefs.guest_frequency = v_u2_prefs.guest_frequency THEN 100
            WHEN v_u1_prefs.guest_frequency = 'sometimes' OR v_u2_prefs.guest_frequency = 'sometimes' THEN 60
            ELSE 30
        END;
    END IF;
    
    -- Calculate weekend_activity score (weight: 10%)
    IF v_u1_prefs.weekend_activity IS NOT NULL AND v_u2_prefs.weekend_activity IS NOT NULL THEN
        v_weekend := CASE 
            WHEN v_u1_prefs.weekend_activity = v_u2_prefs.weekend_activity THEN 100
            WHEN v_u1_prefs.weekend_activity = 'mix' OR v_u2_prefs.weekend_activity = 'mix' THEN 70
            ELSE 40
        END;
    END IF;
    
    -- Calculate budget overlap score (weight: 10%)
    IF v_u1_profile.budget_min IS NOT NULL AND v_u1_profile.budget_max IS NOT NULL
       AND v_u2_profile.budget_min IS NOT NULL AND v_u2_profile.budget_max IS NOT NULL THEN
        v_budget := CASE
            WHEN v_u1_profile.budget_max >= v_u2_profile.budget_min 
             AND v_u2_profile.budget_max >= v_u1_profile.budget_min THEN 100
            ELSE 30
        END;
    END IF;
    
    -- Return scores
    total_score := (
        v_sleep * 25 +
        v_cleanliness * 20 +
        v_noise * 20 +
        v_guest * 15 +
        v_weekend * 10 +
        v_budget * 10
    ) / 100;
    
    sleep_score := v_sleep;
    cleanliness_score := v_cleanliness;
    noise_score := v_noise;
    guest_score := v_guest;
    weekend_score := v_weekend;
    budget_score := v_budget;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FUNCTION: Get Roommate Matches
-- ============================================

CREATE OR REPLACE FUNCTION get_roommate_matches(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    matched_user_id UUID,
    compatibility_score INTEGER,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    university TEXT,
    major TEXT,
    city TEXT,
    district TEXT,
    age INTEGER,
    gender TEXT,
    occupation TEXT,
    hobbies TEXT[],
    sleep_score INTEGER,
    cleanliness_score INTEGER,
    noise_score INTEGER,
    guest_score INTEGER,
    weekend_score INTEGER,
    budget_score INTEGER
) AS $$
DECLARE
    v_user_profile RECORD;
BEGIN
    -- Get current user's profile
    SELECT * INTO v_user_profile FROM roommate_profiles WHERE user_id = p_user_id;
    
    IF v_user_profile IS NULL THEN
        RAISE EXCEPTION 'User does not have a roommate profile';
    END IF;
    
    RETURN QUERY
    SELECT 
        rp.user_id AS matched_user_id,
        (calculate_compatibility_score(p_user_id, rp.user_id)).total_score AS compatibility_score,
        u.full_name,
        u.avatar_url,
        rp.bio,
        u.university,
        u.major,
        rp.city,
        rp.district,
        rp.age,
        rp.gender,
        rp.occupation,
        rp.hobbies,
        (calculate_compatibility_score(p_user_id, rp.user_id)).sleep_score,
        (calculate_compatibility_score(p_user_id, rp.user_id)).cleanliness_score,
        (calculate_compatibility_score(p_user_id, rp.user_id)).noise_score,
        (calculate_compatibility_score(p_user_id, rp.user_id)).guest_score,
        (calculate_compatibility_score(p_user_id, rp.user_id)).weekend_score,
        (calculate_compatibility_score(p_user_id, rp.user_id)).budget_score
    FROM roommate_profiles rp
    JOIN users u ON u.id = rp.user_id
    WHERE rp.user_id != p_user_id
      AND rp.status = 'looking'
      -- Location filter: same city
      AND rp.city = v_user_profile.city
      -- Gender preference filter
      AND (
          v_user_profile.preferred_gender = 'any' 
          OR rp.gender = v_user_profile.preferred_gender
          OR rp.gender IS NULL
      )
      AND (
          rp.preferred_gender = 'any'
          OR v_user_profile.gender = rp.preferred_gender
          OR v_user_profile.gender IS NULL
      )
    ORDER BY (calculate_compatibility_score(p_user_id, rp.user_id)).total_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. NOTIFICATION TRIGGER (Optional)
-- ============================================

CREATE OR REPLACE FUNCTION notify_roommate_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        link
    ) VALUES (
        NEW.receiver_id,
        'roommate_request',
        'Yêu cầu kết nối mới',
        'Có người muốn làm bạn cùng phòng với bạn!',
        '/roommates/requests'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_roommate_request
    AFTER INSERT ON roommate_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_roommate_request();

-- ============================================
-- Done!
-- ============================================
