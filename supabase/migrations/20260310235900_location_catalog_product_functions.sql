-- =============================================================================
-- Product-facing functions for location catalog suggestions and nearby places
-- Created: 2026-03-10
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_location_catalog(
    p_query TEXT,
    p_city TEXT DEFAULT NULL,
    p_types TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    location_type TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    tags TEXT[],
    source_name TEXT,
    source_url TEXT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    WITH params AS (
        SELECT
            public.normalize_location_name(p_query) AS normalized_query,
            GREATEST(COALESCE(p_limit, 6), 1) AS safe_limit
    )
    SELECT
        lc.id,
        lc.name,
        lc.location_type,
        lc.city,
        lc.district,
        lc.address,
        lc.latitude,
        lc.longitude,
        lc.tags,
        lc.source_name,
        lc.source_url
    FROM public.location_catalog AS lc
    CROSS JOIN params
    WHERE lc.status = 'active'
      AND params.normalized_query IS NOT NULL
      AND (
            p_city IS NULL
            OR COALESCE(lc.city, '') = p_city
      )
      AND (
            p_types IS NULL
            OR lc.location_type = ANY (p_types)
      )
      AND (
            lc.normalized_name LIKE '%' || params.normalized_query || '%'
            OR COALESCE(public.normalize_location_name(lc.district), '') LIKE '%' || params.normalized_query || '%'
            OR COALESCE(public.normalize_location_name(lc.city), '') LIKE '%' || params.normalized_query || '%'
            OR EXISTS (
                SELECT 1
                FROM unnest(COALESCE(lc.tags, '{}'::TEXT[])) AS tag
                WHERE public.normalize_location_name(tag) LIKE '%' || params.normalized_query || '%'
            )
      )
    ORDER BY
        CASE
            WHEN lc.normalized_name = params.normalized_query THEN 0
            WHEN lc.normalized_name LIKE params.normalized_query || '%' THEN 1
            WHEN COALESCE(public.normalize_location_name(lc.district), '') LIKE params.normalized_query || '%' THEN 2
            WHEN COALESCE(public.normalize_location_name(lc.city), '') LIKE params.normalized_query || '%' THEN 3
            ELSE 4
        END,
        lc.updated_at DESC,
        lc.name ASC
    LIMIT (SELECT safe_limit FROM params);
$$;

CREATE OR REPLACE FUNCTION public.get_nearby_locations(
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_radius_km NUMERIC DEFAULT 5,
    p_limit INTEGER DEFAULT 6,
    p_types TEXT[] DEFAULT NULL,
    p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    location_type TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    tags TEXT[],
    source_name TEXT,
    source_url TEXT,
    distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    WITH params AS (
        SELECT
            GREATEST(COALESCE(p_limit, 6), 1) AS safe_limit,
            COALESCE(p_radius_km, 5) AS safe_radius
    ),
    scoped AS (
        SELECT
            lc.id,
            lc.name,
            lc.location_type,
            lc.city,
            lc.district,
            lc.address,
            lc.latitude,
            lc.longitude,
            lc.tags,
            lc.source_name,
            lc.source_url,
            public.calculate_distance_km(p_lat, p_lng, lc.latitude, lc.longitude) AS distance_km
        FROM public.location_catalog AS lc
        WHERE lc.status = 'active'
          AND lc.latitude IS NOT NULL
          AND lc.longitude IS NOT NULL
          AND (
                p_city IS NULL
                OR COALESCE(lc.city, '') = p_city
          )
          AND (
                p_types IS NULL
                OR lc.location_type = ANY (p_types)
          )
    )
    SELECT
        scoped.id,
        scoped.name,
        scoped.location_type,
        scoped.city,
        scoped.district,
        scoped.address,
        scoped.latitude,
        scoped.longitude,
        scoped.tags,
        scoped.source_name,
        scoped.source_url,
        scoped.distance_km
    FROM scoped
    CROSS JOIN params
    WHERE scoped.distance_km <= params.safe_radius
    ORDER BY scoped.distance_km ASC, scoped.name ASC
    LIMIT (SELECT safe_limit FROM params);
$$;

CREATE OR REPLACE FUNCTION public.get_featured_locations(
    p_city TEXT DEFAULT NULL,
    p_types TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    location_type TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    tags TEXT[],
    source_name TEXT,
    source_url TEXT
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
    WITH params AS (
        SELECT GREATEST(COALESCE(p_limit, 6), 1) AS safe_limit
    )
    SELECT
        lc.id,
        lc.name,
        lc.location_type,
        lc.city,
        lc.district,
        lc.address,
        lc.latitude,
        lc.longitude,
        lc.tags,
        lc.source_name,
        lc.source_url
    FROM public.location_catalog AS lc
    CROSS JOIN params
    WHERE lc.status = 'active'
      AND (
            p_city IS NULL
            OR COALESCE(lc.city, '') = p_city
      )
      AND (
            p_types IS NULL
            OR lc.location_type = ANY (p_types)
      )
    ORDER BY
        CASE lc.location_type
            WHEN 'university' THEN 0
            WHEN 'station' THEN 1
            WHEN 'landmark' THEN 2
            WHEN 'district' THEN 3
            ELSE 4
        END,
        lc.updated_at DESC,
        lc.name ASC
    LIMIT (SELECT safe_limit FROM params);
$$;

GRANT EXECUTE ON FUNCTION public.search_location_catalog(TEXT, TEXT, TEXT[], INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.search_location_catalog(TEXT, TEXT, TEXT[], INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_nearby_locations(NUMERIC, NUMERIC, NUMERIC, INTEGER, TEXT[], TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_nearby_locations(NUMERIC, NUMERIC, NUMERIC, INTEGER, TEXT[], TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_featured_locations(TEXT, TEXT[], INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_featured_locations(TEXT, TEXT[], INTEGER) TO authenticated;
