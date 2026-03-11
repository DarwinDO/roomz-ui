-- Fix ambiguous distance_km reference inside geo-enabled search_rooms
-- Date: 2026-03-10

CREATE OR REPLACE FUNCTION public.search_rooms(
    p_search_query text DEFAULT NULL::text,
    p_district text DEFAULT NULL::text,
    p_min_price numeric DEFAULT NULL::numeric,
    p_max_price numeric DEFAULT NULL::numeric,
    p_room_types text[] DEFAULT NULL::text[],
    p_is_verified boolean DEFAULT NULL::boolean,
    p_pet_allowed boolean DEFAULT NULL::boolean,
    p_furnished boolean DEFAULT NULL::boolean,
    p_amenities text[] DEFAULT NULL::text[],
    p_lat numeric DEFAULT NULL::numeric,
    p_lng numeric DEFAULT NULL::numeric,
    p_radius_km numeric DEFAULT NULL::numeric,
    p_sort_by text DEFAULT 'newest'::text,
    p_page integer DEFAULT 1,
    p_page_size integer DEFAULT 12
)
RETURNS TABLE(
    id uuid,
    landlord_id uuid,
    title text,
    description text,
    room_type text,
    address text,
    district text,
    city text,
    latitude numeric,
    longitude numeric,
    price_per_month numeric,
    deposit_amount numeric,
    area_sqm numeric,
    bedroom_count integer,
    bathroom_count integer,
    max_occupants integer,
    furnished boolean,
    pet_allowed boolean,
    gender_restriction text,
    is_available boolean,
    is_verified boolean,
    has_360_photos boolean,
    view_count integer,
    favorite_count integer,
    status text,
    min_lease_term integer,
    available_from date,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    deleted_at timestamp without time zone,
    landlord_name text,
    landlord_avatar text,
    landlord_email text,
    landlord_phone text,
    landlord_trust_score numeric,
    total_count bigint,
    search_rank real,
    primary_image_url text,
    distance_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_page int := GREATEST(COALESCE(p_page, 1), 1);
    v_page_size int := GREATEST(COALESCE(p_page_size, 12), 1);
    v_offset int;
BEGIN
    v_offset := (v_page - 1) * v_page_size;

    RETURN QUERY
    WITH base AS (
        SELECT
            r.id,
            r.landlord_id,
            r.title::text,
            r.description::text,
            r.room_type::text,
            r.address::text,
            r.district::text,
            r.city::text,
            r.latitude,
            r.longitude,
            r.price_per_month,
            r.deposit_amount,
            r.area_sqm,
            r.bedroom_count,
            r.bathroom_count,
            r.max_occupants,
            r.furnished,
            r.pet_allowed,
            r.gender_restriction::text,
            r.is_available,
            r.is_verified,
            r.has_360_photos,
            r.view_count,
            r.favorite_count,
            r.status::text,
            r.min_lease_term,
            r.available_from,
            r.created_at,
            r.updated_at,
            r.deleted_at,
            u.full_name::text AS landlord_name,
            u.avatar_url::text AS landlord_avatar,
            u.email::text AS landlord_email,
            NULL::text AS landlord_phone,
            u.trust_score AS landlord_trust_score,
            CASE
                WHEN p_search_query IS NOT NULL THEN
                    ts_rank(
                        to_tsvector('english', r.title || ' ' || COALESCE(r.description, '') || ' ' || COALESCE(r.address, '') || ' ' || COALESCE(r.district, '') || ' ' || COALESCE(r.city, '')),
                        plainto_tsquery('english', p_search_query)
                    )
                ELSE 0.0
            END::real AS search_rank,
            img.image_url::text AS primary_image_url,
            CASE
                WHEN p_lat IS NOT NULL
                    AND p_lng IS NOT NULL
                    AND r.latitude IS NOT NULL
                    AND r.longitude IS NOT NULL
                THEN public.calculate_distance_km(p_lat, p_lng, r.latitude, r.longitude)
                ELSE NULL
            END AS distance_km
        FROM public.rooms r
        LEFT JOIN public.room_amenities ra ON ra.room_id = r.id
        LEFT JOIN public.users u ON u.id = r.landlord_id
        LEFT JOIN LATERAL (
            SELECT ri.image_url
            FROM public.room_images ri
            WHERE ri.room_id = r.id
            ORDER BY ri.is_primary DESC NULLS LAST, ri.display_order ASC NULLS LAST
            LIMIT 1
        ) img ON true
        WHERE r.status = 'active'
          AND r.is_available = true
          AND r.deleted_at IS NULL
          AND (
            p_search_query IS NULL
            OR to_tsvector(
                'english',
                r.title || ' ' || COALESCE(r.description, '') || ' ' || COALESCE(r.address, '') || ' ' || COALESCE(r.district, '') || ' ' || COALESCE(r.city, '')
            ) @@ plainto_tsquery('english', p_search_query)
            OR r.title ILIKE '%' || p_search_query || '%'
            OR r.address ILIKE '%' || p_search_query || '%'
            OR r.district ILIKE '%' || p_search_query || '%'
            OR r.city ILIKE '%' || p_search_query || '%'
          )
          AND (p_district IS NULL OR r.district = p_district)
          AND (p_min_price IS NULL OR r.price_per_month >= p_min_price)
          AND (p_max_price IS NULL OR r.price_per_month <= p_max_price)
          AND (p_room_types IS NULL OR r.room_type::text = ANY(p_room_types))
          AND (p_is_verified IS NULL OR r.is_verified = p_is_verified)
          AND (p_pet_allowed IS NULL OR r.pet_allowed = p_pet_allowed)
          AND (p_furnished IS NULL OR r.furnished = p_furnished)
          AND (
            p_amenities IS NULL
            OR (
                (NOT 'wifi' = ANY(p_amenities) OR ra.wifi = true)
                AND (NOT 'air_conditioning' = ANY(p_amenities) OR ra.air_conditioning = true)
                AND (NOT 'parking' = ANY(p_amenities) OR ra.parking = true)
                AND (NOT 'kitchen' = ANY(p_amenities) OR ra.kitchen = true)
                AND (NOT 'washing_machine' = ANY(p_amenities) OR ra.washing_machine = true)
                AND (NOT 'refrigerator' = ANY(p_amenities) OR ra.refrigerator = true)
                AND (NOT 'heater' = ANY(p_amenities) OR ra.heater = true)
                AND (NOT 'tv' = ANY(p_amenities) OR ra.tv = true)
                AND (NOT 'security_camera' = ANY(p_amenities) OR ra.security_camera = true)
                AND (NOT 'security_guard' = ANY(p_amenities) OR ra.security_guard = true)
                AND (NOT 'fingerprint_lock' = ANY(p_amenities) OR ra.fingerprint_lock = true)
                AND (NOT 'elevator' = ANY(p_amenities) OR ra.elevator = true)
                AND (NOT 'balcony' = ANY(p_amenities) OR ra.balcony = true)
                AND (NOT 'gym' = ANY(p_amenities) OR ra.gym = true)
                AND (NOT 'swimming_pool' = ANY(p_amenities) OR ra.swimming_pool = true)
            )
          )
    ), filtered AS (
        SELECT base.*
        FROM base
        WHERE (
            p_radius_km IS NULL
            OR p_lat IS NULL
            OR p_lng IS NULL
            OR (base.distance_km IS NOT NULL AND base.distance_km <= p_radius_km)
            OR (
                base.distance_km IS NULL
                AND (p_search_query IS NOT NULL OR p_district IS NOT NULL)
            )
        )
    )
    SELECT
        filtered.id,
        filtered.landlord_id,
        filtered.title,
        filtered.description,
        filtered.room_type,
        filtered.address,
        filtered.district,
        filtered.city,
        filtered.latitude,
        filtered.longitude,
        filtered.price_per_month,
        filtered.deposit_amount,
        filtered.area_sqm,
        filtered.bedroom_count,
        filtered.bathroom_count,
        filtered.max_occupants,
        filtered.furnished,
        filtered.pet_allowed,
        filtered.gender_restriction,
        filtered.is_available,
        filtered.is_verified,
        filtered.has_360_photos,
        filtered.view_count,
        filtered.favorite_count,
        filtered.status,
        filtered.min_lease_term,
        filtered.available_from,
        filtered.created_at,
        filtered.updated_at,
        filtered.deleted_at,
        filtered.landlord_name,
        filtered.landlord_avatar,
        filtered.landlord_email,
        filtered.landlord_phone,
        filtered.landlord_trust_score,
        COUNT(*) OVER() AS total_count,
        filtered.search_rank,
        filtered.primary_image_url,
        filtered.distance_km
    FROM filtered
    ORDER BY
        CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL THEN filtered.distance_km END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'price_asc' THEN filtered.price_per_month END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'price_desc' THEN filtered.price_per_month END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'most_viewed' THEN filtered.view_count END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'newest' OR p_sort_by IS NULL THEN filtered.created_at END DESC NULLS LAST
    LIMIT v_page_size
    OFFSET v_offset;
END;
$function$;
