-- Add is_premium to get_roommate_matches RPC output (from users.is_premium cache)
-- OUT parameters changed: must DROP before recreate (PostgreSQL 42P13)

DROP FUNCTION IF EXISTS public.get_roommate_matches(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_roommate_matches(
    p_user_id uuid,
    p_limit integer DEFAULT 20
)
RETURNS TABLE(
    matched_user_id uuid,
    compatibility_score integer,
    full_name text,
    avatar_url text,
    is_premium boolean,
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
        COALESCE(u.is_premium, false),
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

GRANT EXECUTE ON FUNCTION public.get_roommate_matches(uuid, integer) TO authenticated;
