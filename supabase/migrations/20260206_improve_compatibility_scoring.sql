-- ============================================
-- Roommate Compatibility Algorithm V2.0
-- Improvements: Gradient Budget, Hobby Bonus, Age Proximity, Last Seen
-- Version: 20260206_improve_compatibility_scoring.sql
-- ============================================

-- 1. Thêm cột last_seen vào users (Nếu chưa có)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- 2. Helper function: Map quiz answers to numeric scale (keep existing)
CREATE OR REPLACE FUNCTION map_quiz_value(p_val TEXT) RETURNS INTEGER AS $$
BEGIN
    RETURN CASE 
        WHEN p_val IN ('early', 'rarely', 'quiet', 'home', 'organized') THEN 1
        WHEN p_val IN ('flexible', 'sometimes', 'moderate', 'mix') THEN 3
        WHEN p_val IN ('late', 'frequently', 'noisy', 'out', 'relaxed') THEN 5
        ELSE 3
    END;
END;
$$ LANGUAGE plpgsql;

-- 3. Improved Compatibility Score Function (V2.0)
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
    budget_score INTEGER,
    hobby_score INTEGER,
    age_score INTEGER
) AS $$
DECLARE
    -- Profile records
    v_u1_profile RECORD;
    v_u2_profile RECORD;
    
    -- Score variables (individual factors)
    v_sleep INTEGER := 50;
    v_cleanliness INTEGER := 50;
    v_noise INTEGER := 50;
    v_guest INTEGER := 50;
    v_weekend INTEGER := 50;
    v_budget INTEGER := 50;
    v_hobby INTEGER := 0;
    v_age INTEGER := 50;
    
    -- Helper variables
    v_max_diff NUMERIC := 4.0;
    v_overlap_amount NUMERIC;
    v_total_range NUMERIC;
    v_common_hobbies INTEGER;
    v_total_hobbies INTEGER;
    v_age_diff INTEGER;
BEGIN
    -- Get profiles
    SELECT * INTO v_u1_profile FROM roommate_profiles WHERE user_id = p_user1_id;
    SELECT * INTO v_u2_profile FROM roommate_profiles WHERE user_id = p_user2_id;
    
    -- Early return if no profiles
    IF v_u1_profile IS NULL OR v_u2_profile IS NULL THEN
        total_score := 0;
        sleep_score := 0; cleanliness_score := 0; noise_score := 0;
        guest_score := 0; weekend_score := 0; budget_score := 0;
        hobby_score := 0; age_score := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    ---------------------------------------------------------
    -- 1. QUIZ-BASED SCORES (from compatibility_answers table)
    -- Using existing map_quiz_value function
    ---------------------------------------------------------
    
    -- ID 1: Sleep (Weight: 22%)
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_sleep
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 1 AND b.question_id = 1;
    
    -- ID 5: Cleanliness (Weight: 18%)
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_cleanliness
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 5 AND b.question_id = 5;
    
    -- ID 3: Noise (Weight: 18%)
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_noise
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 3 AND b.question_id = 3;
    
    -- ID 2: Guest (Weight: 12%)
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_guest
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 2 AND b.question_id = 2;
    
    -- ID 4: Weekend (Weight: 8%)
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_weekend
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 4 AND b.question_id = 4;

    ---------------------------------------------------------
    -- 2. BUDGET SCORE - Gradient (Weight: 7%)
    -- Changed from binary (100/30) to percentage-based overlap
    ---------------------------------------------------------
    IF v_u1_profile.budget_min IS NOT NULL AND v_u1_profile.budget_max IS NOT NULL
       AND v_u2_profile.budget_min IS NOT NULL AND v_u2_profile.budget_max IS NOT NULL THEN
        
        v_overlap_amount := LEAST(v_u1_profile.budget_max, v_u2_profile.budget_max) 
                          - GREATEST(v_u1_profile.budget_min, v_u2_profile.budget_min);
        v_total_range := GREATEST(v_u1_profile.budget_max, v_u2_profile.budget_max) 
                       - LEAST(v_u1_profile.budget_min, v_u2_profile.budget_min);
        
        IF v_overlap_amount <= 0 THEN
            v_budget := 20;  -- No overlap = 20%
        ELSIF v_total_range = 0 THEN
            v_budget := 100; -- Same exact range = 100%
        ELSE
            v_budget := LEAST(100, (v_overlap_amount / v_total_range * 100))::INTEGER;
        END IF;
    END IF;

    ---------------------------------------------------------
    -- 3. HOBBY SCORE - Bonus for shared interests (Weight: 10%)
    -- NEW: Based on array intersection of hobbies
    ---------------------------------------------------------
    SELECT COUNT(*) INTO v_common_hobbies
    FROM (
        SELECT unnest(v_u1_profile.hobbies)
        INTERSECT
        SELECT unnest(v_u2_profile.hobbies)
    ) t;
    
    v_total_hobbies := GREATEST(
        COALESCE(array_length(v_u1_profile.hobbies, 1), 0),
        COALESCE(array_length(v_u2_profile.hobbies, 1), 0)
    );
    
    IF v_total_hobbies > 0 THEN
        v_hobby := (COALESCE(v_common_hobbies, 0)::NUMERIC / v_total_hobbies::NUMERIC * 100)::INTEGER;
    ELSE
        v_hobby := 0;
    END IF;

    ---------------------------------------------------------
    -- 4. AGE SCORE - Proximity bonus (Weight: 5%)
    -- NEW: Closer ages = higher compatibility
    ---------------------------------------------------------
    IF v_u1_profile.age IS NOT NULL AND v_u2_profile.age IS NOT NULL THEN
        v_age_diff := ABS(v_u1_profile.age - v_u2_profile.age);
        
        v_age := CASE
            WHEN v_age_diff <= 2 THEN 100   -- Same age ±2
            WHEN v_age_diff <= 5 THEN 80    -- 3-5 years
            WHEN v_age_diff <= 10 THEN 60   -- 6-10 years
            ELSE 40                          -- >10 years
        END;
    END IF;

    ---------------------------------------------------------
    -- 5. FINAL WEIGHTED AGGREGATION (V2.0)
    -- New weights: Sleep 22%, Clean 18%, Noise 18%, Guest 12%, 
    --              Weekend 8%, Budget 7%, Hobby 10%, Age 5%
    ---------------------------------------------------------
    total_score := (
        COALESCE(v_sleep, 50) * 0.22 +
        COALESCE(v_cleanliness, 50) * 0.18 +
        COALESCE(v_noise, 50) * 0.18 +
        COALESCE(v_guest, 50) * 0.12 +
        COALESCE(v_weekend, 50) * 0.08 +
        COALESCE(v_budget, 50) * 0.07 +
        COALESCE(v_hobby, 0) * 0.10 +
        COALESCE(v_age, 50) * 0.05
    )::INTEGER;
    
    -- Return all individual scores for transparency
    sleep_score := COALESCE(v_sleep, 50);
    cleanliness_score := COALESCE(v_cleanliness, 50);
    noise_score := COALESCE(v_noise, 50);
    guest_score := COALESCE(v_guest, 50);
    weekend_score := COALESCE(v_weekend, 50);
    budget_score := COALESCE(v_budget, 50);
    hobby_score := COALESCE(v_hobby, 0);
    age_score := COALESCE(v_age, 50);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Update get_roommate_matches to include new score fields
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
    budget_score INTEGER,
    hobby_score INTEGER,
    age_score INTEGER,
    last_seen TIMESTAMPTZ
) AS $$
DECLARE
    v_user_profile RECORD;
BEGIN
    SELECT * INTO v_user_profile FROM roommate_profiles WHERE user_id = p_user_id;
    IF v_user_profile IS NULL THEN RETURN; END IF;
    
    RETURN QUERY
    SELECT 
        rp.user_id,
        scores.total_score,
        u.full_name::TEXT,
        u.avatar_url::TEXT,
        rp.bio::TEXT,
        u.university::TEXT,
        u.major::TEXT,
        rp.city::TEXT,
        rp.district::TEXT,
        rp.age,
        rp.gender::TEXT,
        rp.occupation::TEXT,
        rp.hobbies,
        scores.sleep_score,
        scores.cleanliness_score,
        scores.noise_score,
        scores.guest_score,
        scores.weekend_score,
        scores.budget_score,
        scores.hobby_score,
        scores.age_score,
        u.last_seen
    FROM roommate_profiles rp
    JOIN users u ON u.id = rp.user_id
    CROSS JOIN LATERAL (
        SELECT * FROM calculate_compatibility_score(p_user_id, rp.user_id)
    ) AS scores
    WHERE rp.user_id != p_user_id
      AND rp.status = 'looking'
      AND (v_user_profile.city IS NULL OR rp.city = v_user_profile.city)
      AND (v_user_profile.preferred_gender = 'any' OR rp.gender = v_user_profile.preferred_gender OR rp.gender IS NULL)
      AND (rp.preferred_gender = 'any' OR v_user_profile.gender = rp.preferred_gender OR v_user_profile.gender IS NULL)
    ORDER BY scores.total_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Done! Algorithm V2.0 with:
-- ✅ Gradient Budget Score (was binary 100/30)
-- ✅ Hobby Bonus (+10% weight for shared interests)
-- ✅ Age Proximity (+5% weight for age matching)
-- ✅ last_seen column for activity tracking
-- ============================================
