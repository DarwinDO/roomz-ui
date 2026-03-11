-- ============================================
-- Fix H-02: Prevent landlord phone leakage in search_rooms
-- Date: 2026-03-10
-- ============================================

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
    primary_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_offset int;
    v_total bigint;
BEGIN
    v_offset := (p_page - 1) * p_page_size;

    SELECT COUNT(*) INTO v_total
    FROM public.rooms r
    LEFT JOIN public.room_amenities ra ON ra.room_id = r.id
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
      );

    RETURN QUERY
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
        u.full_name::text,
        u.avatar_url::text,
        u.email::text,
        NULL::text AS landlord_phone,
        u.trust_score,
        v_total,
        CASE
            WHEN p_search_query IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', r.title || ' ' || COALESCE(r.description, '')),
                    plainto_tsquery('english', p_search_query)
                )
            ELSE 0.0
        END::real,
        img.image_url::text
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
    ORDER BY
        CASE WHEN p_sort_by = 'price_asc' THEN r.price_per_month END ASC NULLS LAST,
        CASE WHEN p_sort_by = 'price_desc' THEN r.price_per_month END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'most_viewed' THEN r.view_count END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'newest' OR p_sort_by IS NULL THEN r.created_at END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_rooms(
    text,
    text,
    numeric,
    numeric,
    text[],
    boolean,
    boolean,
    boolean,
    text[],
    text,
    integer,
    integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.search_rooms(
    text,
    text,
    numeric,
    numeric,
    text[],
    boolean,
    boolean,
    boolean,
    text[],
    text,
    integer,
    integer
) TO anon;
