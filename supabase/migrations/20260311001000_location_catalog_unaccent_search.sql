-- =============================================================================
-- Accent-insensitive search helpers for location catalog
-- Created: 2026-03-10
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.normalize_location_search_text(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'extensions'
AS $$
    SELECT NULLIF(
        regexp_replace(
            lower(extensions.unaccent(COALESCE(p_value, ''))),
            '\s+',
            ' ',
            'g'
        ),
        ''
    );
$$;

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
SET search_path TO 'public', 'extensions'
AS $$
    WITH params AS (
        SELECT
            public.normalize_location_search_text(p_query) AS normalized_query,
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
            public.normalize_location_search_text(lc.name) LIKE '%' || params.normalized_query || '%'
            OR COALESCE(public.normalize_location_search_text(lc.district), '') LIKE '%' || params.normalized_query || '%'
            OR COALESCE(public.normalize_location_search_text(lc.city), '') LIKE '%' || params.normalized_query || '%'
            OR EXISTS (
                SELECT 1
                FROM unnest(COALESCE(lc.tags, '{}'::TEXT[])) AS tag
                WHERE public.normalize_location_search_text(tag) LIKE '%' || params.normalized_query || '%'
            )
      )
    ORDER BY
        CASE
            WHEN public.normalize_location_search_text(lc.name) = params.normalized_query THEN 0
            WHEN public.normalize_location_search_text(lc.name) LIKE params.normalized_query || '%' THEN 1
            WHEN COALESCE(public.normalize_location_search_text(lc.district), '') LIKE params.normalized_query || '%' THEN 2
            WHEN COALESCE(public.normalize_location_search_text(lc.city), '') LIKE params.normalized_query || '%' THEN 3
            ELSE 4
        END,
        lc.updated_at DESC,
        lc.name ASC
    LIMIT (SELECT safe_limit FROM params);
$$;

GRANT EXECUTE ON FUNCTION public.normalize_location_search_text(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.normalize_location_search_text(TEXT) TO authenticated;
