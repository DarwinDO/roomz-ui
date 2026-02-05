-- Helper to map string answers to numeric values (1-5 scale)
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
    -- Scores per factor (1-100)
    v_sleep INTEGER := 50;
    v_cleanliness INTEGER := 50;
    v_noise INTEGER := 50;
    v_guest INTEGER := 50;
    v_weekend INTEGER := 50;
    v_budget INTEGER := 50;
    
    -- Helper variable for max difference (5-point scale: max diff = 4)
    v_max_diff NUMERIC := 4.0;
BEGIN
    -- 1. QUIZ-BASED SCORES (Sum of Differences)
    -- ID 1: Sleep
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_sleep
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 1 AND b.question_id = 1;
    
    -- ID 5: Cleanliness
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_cleanliness
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 5 AND b.question_id = 5;
    
    -- ID 3: Noise
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_noise
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 3 AND b.question_id = 3;
    
    -- ID 2: Guest
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_guest
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 2 AND b.question_id = 2;
    
    -- ID 4: Weekend
    SELECT 100 - (ABS(map_quiz_value(a.answer_value) - map_quiz_value(b.answer_value)) * (100 / v_max_diff)) INTO v_weekend
    FROM compatibility_answers a, compatibility_answers b
    WHERE a.user_id = p_user1_id AND b.user_id = p_user2_id AND a.question_id = 4 AND b.question_id = 4;

    -- 2. BUDGET SCORE (Direct comparison)
    SELECT 
        CASE 
            WHEN (rp1.budget_max >= rp2.budget_min AND rp2.budget_max >= rp1.budget_min) THEN 100
            ELSE 30
        END INTO v_budget
    FROM roommate_profiles rp1, roommate_profiles rp2
    WHERE rp1.user_id = p_user1_id AND rp2.user_id = p_user2_id;

    -- 3. FINAL AGGREGATION
    total_score := (
        COALESCE(v_sleep, 50) * 0.25 +
        COALESCE(v_cleanliness, 50) * 0.20 +
        COALESCE(v_noise, 50) * 0.20 +
        COALESCE(v_guest, 50) * 0.15 +
        COALESCE(v_weekend, 50) * 0.10 +
        COALESCE(v_budget, 50) * 0.10
    );
    
    sleep_score := COALESCE(v_sleep, 50);
    cleanliness_score := COALESCE(v_cleanliness, 50);
    noise_score := COALESCE(v_noise, 50);
    guest_score := COALESCE(v_guest, 50);
    weekend_score := COALESCE(v_weekend, 50);
    budget_score := COALESCE(v_budget, 50);
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update get_roommate_matches with explicit type casts
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
        scores.budget_score
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
