-- Improve roommate matching: remove hard same-city filter,
-- add location/move-in/confidence-aware scoring, and expose scope metadata.

DROP FUNCTION IF EXISTS public.get_roommate_matches(uuid, integer);
DROP FUNCTION IF EXISTS public.calculate_compatibility_score(uuid, uuid);

CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(
    p_user1_id uuid,
    p_user2_id uuid
)
RETURNS TABLE(
    total_score integer,
    sleep_score integer,
    cleanliness_score integer,
    noise_score integer,
    guest_score integer,
    weekend_score integer,
    budget_score integer,
    hobby_score integer,
    age_score integer,
    move_in_score integer,
    location_score integer,
    confidence_score integer
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_u1_profile public.roommate_profiles%ROWTYPE;
    v_u2_profile public.roommate_profiles%ROWTYPE;
    v_sleep integer;
    v_cleanliness integer;
    v_noise integer;
    v_guest integer;
    v_weekend integer;
    v_budget integer;
    v_hobby integer;
    v_age integer;
    v_move_in integer;
    v_location integer;
    v_weighted_sum numeric := 0;
    v_weight_total numeric := 0;
    v_base_score numeric := 0;
    v_common_hobbies integer := 0;
    v_total_hobbies integer := 0;
    v_age_diff integer;
    v_move_in_diff integer;
    v_overlap_amount numeric;
    v_total_range numeric;
    v_radius integer;
    v_same_city boolean := false;
    v_same_district boolean := false;
BEGIN
    SELECT * INTO v_u1_profile FROM public.roommate_profiles WHERE user_id = p_user1_id;
    SELECT * INTO v_u2_profile FROM public.roommate_profiles WHERE user_id = p_user2_id;

    IF v_u1_profile IS NULL OR v_u2_profile IS NULL THEN
        total_score := 0;
        sleep_score := 0;
        cleanliness_score := 0;
        noise_score := 0;
        guest_score := 0;
        weekend_score := 0;
        budget_score := 0;
        hobby_score := 0;
        age_score := 0;
        move_in_score := 0;
        location_score := 0;
        confidence_score := 0;
        RETURN NEXT;
        RETURN;
    END IF;

    SELECT ROUND(100 - (ABS(public.map_quiz_value(a.answer_value) - public.map_quiz_value(b.answer_value)) * 25))::integer
    INTO v_sleep
    FROM public.compatibility_answers a
    JOIN public.compatibility_answers b
      ON a.question_id = b.question_id
    WHERE a.user_id = p_user1_id
      AND b.user_id = p_user2_id
      AND a.question_id = 1;

    SELECT ROUND(100 - (ABS(public.map_quiz_value(a.answer_value) - public.map_quiz_value(b.answer_value)) * 25))::integer
    INTO v_cleanliness
    FROM public.compatibility_answers a
    JOIN public.compatibility_answers b
      ON a.question_id = b.question_id
    WHERE a.user_id = p_user1_id
      AND b.user_id = p_user2_id
      AND a.question_id = 5;

    SELECT ROUND(100 - (ABS(public.map_quiz_value(a.answer_value) - public.map_quiz_value(b.answer_value)) * 25))::integer
    INTO v_noise
    FROM public.compatibility_answers a
    JOIN public.compatibility_answers b
      ON a.question_id = b.question_id
    WHERE a.user_id = p_user1_id
      AND b.user_id = p_user2_id
      AND a.question_id = 3;

    SELECT ROUND(100 - (ABS(public.map_quiz_value(a.answer_value) - public.map_quiz_value(b.answer_value)) * 25))::integer
    INTO v_guest
    FROM public.compatibility_answers a
    JOIN public.compatibility_answers b
      ON a.question_id = b.question_id
    WHERE a.user_id = p_user1_id
      AND b.user_id = p_user2_id
      AND a.question_id = 2;

    SELECT ROUND(100 - (ABS(public.map_quiz_value(a.answer_value) - public.map_quiz_value(b.answer_value)) * 25))::integer
    INTO v_weekend
    FROM public.compatibility_answers a
    JOIN public.compatibility_answers b
      ON a.question_id = b.question_id
    WHERE a.user_id = p_user1_id
      AND b.user_id = p_user2_id
      AND a.question_id = 4;

    IF v_u1_profile.budget_min IS NOT NULL
       AND v_u1_profile.budget_max IS NOT NULL
       AND v_u2_profile.budget_min IS NOT NULL
       AND v_u2_profile.budget_max IS NOT NULL THEN
        v_overlap_amount := LEAST(v_u1_profile.budget_max, v_u2_profile.budget_max)
                          - GREATEST(v_u1_profile.budget_min, v_u2_profile.budget_min);
        v_total_range := GREATEST(v_u1_profile.budget_max, v_u2_profile.budget_max)
                       - LEAST(v_u1_profile.budget_min, v_u2_profile.budget_min);

        IF v_overlap_amount <= 0 THEN
            v_budget := 20;
        ELSIF v_total_range = 0 THEN
            v_budget := 100;
        ELSE
            v_budget := GREATEST(20, LEAST(100, ROUND((v_overlap_amount / v_total_range) * 100)))::integer;
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_common_hobbies
    FROM (
        SELECT DISTINCT hobby
        FROM UNNEST(COALESCE(v_u1_profile.hobbies, ARRAY[]::text[])) AS hobby
        INTERSECT
        SELECT DISTINCT hobby
        FROM UNNEST(COALESCE(v_u2_profile.hobbies, ARRAY[]::text[])) AS hobby
    ) common_hobbies;

    SELECT COUNT(*) INTO v_total_hobbies
    FROM (
        SELECT DISTINCT hobby
        FROM UNNEST(COALESCE(v_u1_profile.hobbies, ARRAY[]::text[])) AS hobby
        UNION
        SELECT DISTINCT hobby
        FROM UNNEST(COALESCE(v_u2_profile.hobbies, ARRAY[]::text[])) AS hobby
    ) all_hobbies;

    IF v_total_hobbies > 0 THEN
        v_hobby := ROUND((v_common_hobbies::numeric / v_total_hobbies::numeric) * 100)::integer;
    END IF;

    IF v_u1_profile.age IS NOT NULL AND v_u2_profile.age IS NOT NULL THEN
        v_age_diff := ABS(v_u1_profile.age - v_u2_profile.age);
        v_age := CASE
            WHEN v_age_diff <= 2 THEN 100
            WHEN v_age_diff <= 5 THEN 80
            WHEN v_age_diff <= 8 THEN 65
            ELSE 40
        END;
    END IF;

    IF v_u1_profile.move_in_date IS NOT NULL AND v_u2_profile.move_in_date IS NOT NULL THEN
        v_move_in_diff := ABS(v_u1_profile.move_in_date - v_u2_profile.move_in_date);
        v_move_in := CASE
            WHEN v_move_in_diff <= 7 THEN 100
            WHEN v_move_in_diff <= 30 THEN 85
            WHEN v_move_in_diff <= 60 THEN 65
            WHEN v_move_in_diff <= 90 THEN 45
            ELSE 25
        END;
    END IF;

    IF NULLIF(COALESCE(v_u1_profile.city, ''), '') IS NOT NULL
       AND NULLIF(COALESCE(v_u2_profile.city, ''), '') IS NOT NULL THEN
        v_radius := GREATEST(1, LEAST(COALESCE(v_u1_profile.search_radius_km, 5), 20));
        v_same_city := v_u1_profile.city = v_u2_profile.city;
        v_same_district := v_same_city
            AND NULLIF(COALESCE(v_u1_profile.district, ''), '') IS NOT NULL
            AND NULLIF(COALESCE(v_u2_profile.district, ''), '') IS NOT NULL
            AND v_u1_profile.district = v_u2_profile.district;

        IF v_same_district THEN
            v_location := 100;
        ELSIF v_same_city THEN
            v_location := LEAST(95, 70 + v_radius);
        ELSE
            v_location := LEAST(60, 15 + (v_radius * 2));
        END IF;
    END IF;

    IF v_sleep IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_sleep * 8);
        v_weight_total := v_weight_total + 8;
    END IF;
    IF v_cleanliness IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_cleanliness * 8);
        v_weight_total := v_weight_total + 8;
    END IF;
    IF v_noise IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_noise * 8);
        v_weight_total := v_weight_total + 8;
    END IF;
    IF v_guest IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_guest * 8);
        v_weight_total := v_weight_total + 8;
    END IF;
    IF v_weekend IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_weekend * 8);
        v_weight_total := v_weight_total + 8;
    END IF;
    IF v_budget IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_budget * 20);
        v_weight_total := v_weight_total + 20;
    END IF;
    IF v_location IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_location * 15);
        v_weight_total := v_weight_total + 15;
    END IF;
    IF v_move_in IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_move_in * 10);
        v_weight_total := v_weight_total + 10;
    END IF;
    IF v_hobby IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_hobby * 10);
        v_weight_total := v_weight_total + 10;
    END IF;
    IF v_age IS NOT NULL THEN
        v_weighted_sum := v_weighted_sum + (v_age * 5);
        v_weight_total := v_weight_total + 5;
    END IF;

    confidence_score := ROUND(v_weight_total)::integer;

    IF v_weight_total > 0 THEN
        v_base_score := v_weighted_sum / v_weight_total;
        total_score := GREATEST(
            0,
            LEAST(
                100,
                ROUND(v_base_score * (0.70 + ((confidence_score / 100.0) * 0.30)))::integer
            )
        );
    ELSE
        total_score := 0;
    END IF;

    sleep_score := COALESCE(v_sleep, 0);
    cleanliness_score := COALESCE(v_cleanliness, 0);
    noise_score := COALESCE(v_noise, 0);
    guest_score := COALESCE(v_guest, 0);
    weekend_score := COALESCE(v_weekend, 0);
    budget_score := COALESCE(v_budget, 0);
    hobby_score := COALESCE(v_hobby, 0);
    age_score := COALESCE(v_age, 0);
    move_in_score := COALESCE(v_move_in, 0);
    location_score := COALESCE(v_location, 0);

    RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_roommate_matches(
    p_user_id uuid,
    p_limit integer DEFAULT 20
)
RETURNS TABLE(
    matched_user_id uuid,
    compatibility_score integer,
    full_name text,
    avatar_url text,
    bio text,
    university text,
    major text,
    city text,
    district text,
    age integer,
    gender text,
    occupation text,
    hobbies text[],
    sleep_score integer,
    cleanliness_score integer,
    noise_score integer,
    guest_score integer,
    weekend_score integer,
    budget_score integer,
    hobby_score integer,
    age_score integer,
    move_in_score integer,
    location_score integer,
    confidence_score integer,
    match_scope text,
    last_seen timestamp with time zone
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_profile RECORD;
BEGIN
    SELECT * INTO v_user_profile
    FROM public.roommate_profiles
    WHERE user_id = p_user_id;

    IF v_user_profile IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        rp.user_id,
        scores.total_score,
        u.full_name::text,
        u.avatar_url::text,
        rp.bio::text,
        u.university::text,
        u.major::text,
        rp.city::text,
        NULLIF(rp.district, '')::text,
        rp.age,
        rp.gender::text,
        rp.occupation::text,
        COALESCE(rp.hobbies, ARRAY[]::text[]),
        scores.sleep_score,
        scores.cleanliness_score,
        scores.noise_score,
        scores.guest_score,
        scores.weekend_score,
        scores.budget_score,
        scores.hobby_score,
        scores.age_score,
        scores.move_in_score,
        scores.location_score,
        scores.confidence_score,
        CASE
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city
                 AND NULLIF(COALESCE(v_user_profile.district, ''), '') IS NOT NULL
                 AND NULLIF(COALESCE(rp.district, ''), '') IS NOT NULL
                 AND v_user_profile.district = rp.district THEN 'same_district'
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city THEN 'same_city'
            ELSE 'outside_priority_area'
        END::text,
        u.last_seen
    FROM public.roommate_profiles rp
    JOIN public.users u ON u.id = rp.user_id
    CROSS JOIN LATERAL (
        SELECT *
        FROM public.calculate_compatibility_score(p_user_id, rp.user_id)
    ) AS scores
    WHERE rp.user_id != p_user_id
      AND rp.status = 'looking'
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
    ORDER BY
        CASE
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city
                 AND NULLIF(COALESCE(v_user_profile.district, ''), '') IS NOT NULL
                 AND NULLIF(COALESCE(rp.district, ''), '') IS NOT NULL
                 AND v_user_profile.district = rp.district THEN 2
            WHEN NULLIF(COALESCE(v_user_profile.city, ''), '') IS NOT NULL
                 AND v_user_profile.city = rp.city THEN 1
            ELSE 0
        END DESC,
        scores.total_score DESC,
        scores.confidence_score DESC,
        u.last_seen DESC NULLS LAST
    LIMIT p_limit;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.calculate_compatibility_score(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_roommate_matches(uuid, integer) TO authenticated;
