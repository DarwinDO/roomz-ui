-- =============================================================================
-- Location Crawl Ingestion Pipeline
-- Safe staging for crawled location metadata before promotion to curated catalog
-- Created: 2026-03-10
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.location_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    location_type TEXT NOT NULL CHECK (
        location_type IN (
            'university',
            'district',
            'neighborhood',
            'poi',
            'campus',
            'station',
            'landmark'
        )
    ),
    city TEXT,
    district TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    source_name TEXT,
    source_url TEXT,
    source_domain TEXT,
    external_id TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_catalog_external
    ON public.location_catalog(source_domain, external_id)
    WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_catalog_identity
    ON public.location_catalog(location_type, normalized_name, city, district);

CREATE INDEX IF NOT EXISTS idx_location_catalog_lookup
    ON public.location_catalog(location_type, city, district, status);

ALTER TABLE public.location_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read location catalog" ON public.location_catalog;
CREATE POLICY "Public read location catalog"
ON public.location_catalog
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert location catalog" ON public.location_catalog;
CREATE POLICY "Admins can insert location catalog"
ON public.location_catalog
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update location catalog" ON public.location_catalog;
CREATE POLICY "Admins can update location catalog"
ON public.location_catalog
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete location catalog" ON public.location_catalog;
CREATE POLICY "Admins can delete location catalog"
ON public.location_catalog
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_location_catalog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS location_catalog_updated_at_trigger
ON public.location_catalog;

CREATE TRIGGER location_catalog_updated_at_trigger
BEFORE UPDATE ON public.location_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_location_catalog_updated_at();

CREATE TABLE IF NOT EXISTS public.location_crawl_ingestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL DEFAULT 'firecrawl' CHECK (
        source_type IN ('firecrawl', 'manual_json', 'csv_import', 'admin_import')
    ),
    source_name TEXT NOT NULL,
    source_url TEXT,
    source_domain TEXT,
    external_id TEXT,
    location_name TEXT,
    normalized_name TEXT,
    location_type TEXT CHECK (
        location_type IN (
            'university',
            'district',
            'neighborhood',
            'poi',
            'campus',
            'station',
            'landmark'
        )
    ),
    city TEXT,
    district TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    notes TEXT,
    crawl_confidence NUMERIC(5, 2),
    dedupe_key TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    normalized_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        review_status IN (
            'pending',
            'ready',
            'duplicate_location',
            'imported',
            'rejected',
            'error'
        )
    ),
    matched_location_id UUID REFERENCES public.location_catalog(id) ON DELETE SET NULL,
    imported_location_id UUID REFERENCES public.location_catalog(id) ON DELETE SET NULL,
    import_error TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_crawl_ingestions_source_external
    ON public.location_crawl_ingestions(source_type, external_id)
    WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_crawl_ingestions_source_url
    ON public.location_crawl_ingestions(source_type, source_url)
    WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_location_crawl_ingestions_review_status
    ON public.location_crawl_ingestions(review_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_crawl_ingestions_dedupe_key
    ON public.location_crawl_ingestions(dedupe_key)
    WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.location_crawl_ingestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view location crawl ingestions" ON public.location_crawl_ingestions;
CREATE POLICY "Admins can view location crawl ingestions"
ON public.location_crawl_ingestions
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert location crawl ingestions" ON public.location_crawl_ingestions;
CREATE POLICY "Admins can insert location crawl ingestions"
ON public.location_crawl_ingestions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update location crawl ingestions" ON public.location_crawl_ingestions;
CREATE POLICY "Admins can update location crawl ingestions"
ON public.location_crawl_ingestions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete location crawl ingestions" ON public.location_crawl_ingestions;
CREATE POLICY "Admins can delete location crawl ingestions"
ON public.location_crawl_ingestions
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_location_crawl_ingestions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS location_crawl_ingestions_updated_at_trigger
ON public.location_crawl_ingestions;

CREATE TRIGGER location_crawl_ingestions_updated_at_trigger
BEFORE UPDATE ON public.location_crawl_ingestions
FOR EACH ROW
EXECUTE FUNCTION public.update_location_crawl_ingestions_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_location_name(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
    SELECT NULLIF(regexp_replace(lower(btrim(COALESCE(p_value, ''))), '\s+', ' ', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.classify_location_crawl_ingestion(p_ingestion_id UUID)
RETURNS TABLE(
    review_status TEXT,
    matched_location_id UUID,
    import_error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_item public.location_crawl_ingestions%ROWTYPE;
    v_existing_location_id UUID;
    v_review_status TEXT := 'ready';
    v_import_error TEXT;
    v_request_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
    IF v_request_role <> 'service_role'
        AND session_user <> 'postgres'
        AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to classify location crawl ingestion';
    END IF;

    SELECT *
    INTO v_item
    FROM public.location_crawl_ingestions
    WHERE id = p_ingestion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'location_crawl_ingestions row not found: %', p_ingestion_id;
    END IF;

    IF COALESCE(NULLIF(btrim(v_item.location_name), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'location_name is required';
    ELSIF COALESCE(NULLIF(btrim(v_item.location_type), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'location_type is required';
    END IF;

    IF v_review_status <> 'error' THEN
        SELECT lc.id
        INTO v_existing_location_id
        FROM public.location_catalog AS lc
        WHERE lc.location_type = v_item.location_type
          AND lc.normalized_name = COALESCE(v_item.normalized_name, public.normalize_location_name(v_item.location_name))
          AND COALESCE(lc.city, '') = COALESCE(v_item.city, '')
          AND COALESCE(lc.district, '') = COALESCE(v_item.district, '')
        ORDER BY lc.updated_at DESC
        LIMIT 1;

        IF v_existing_location_id IS NOT NULL THEN
            v_review_status := 'duplicate_location';
        END IF;
    END IF;

    UPDATE public.location_crawl_ingestions
    SET
        normalized_name = COALESCE(v_item.normalized_name, public.normalize_location_name(v_item.location_name)),
        review_status = v_review_status,
        matched_location_id = v_existing_location_id,
        import_error = v_import_error,
        updated_at = now()
    WHERE id = p_ingestion_id;

    RETURN QUERY
    SELECT
        v_review_status,
        v_existing_location_id,
        v_import_error;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_location_crawl_ingestion(p_ingestion_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_item public.location_crawl_ingestions%ROWTYPE;
    v_location_id UUID;
    v_request_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
    IF v_request_role <> 'service_role'
        AND session_user <> 'postgres'
        AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to promote location crawl ingestion';
    END IF;

    PERFORM public.classify_location_crawl_ingestion(p_ingestion_id);

    SELECT *
    INTO v_item
    FROM public.location_crawl_ingestions
    WHERE id = p_ingestion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'location_crawl_ingestions row not found: %', p_ingestion_id;
    END IF;

    IF v_item.review_status = 'duplicate_location' AND v_item.matched_location_id IS NOT NULL THEN
        UPDATE public.location_crawl_ingestions
        SET
            review_status = 'imported',
            imported_location_id = v_item.matched_location_id,
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_ingestion_id;

        RETURN v_item.matched_location_id;
    END IF;

    IF v_item.review_status = 'error' THEN
        RAISE EXCEPTION 'Ingestion % is not ready: %', p_ingestion_id, COALESCE(v_item.import_error, 'unknown error');
    END IF;

    INSERT INTO public.location_catalog (
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
        status
    )
    VALUES (
        v_item.location_name,
        COALESCE(v_item.normalized_name, public.normalize_location_name(v_item.location_name)),
        v_item.location_type,
        v_item.city,
        v_item.district,
        v_item.address,
        v_item.latitude,
        v_item.longitude,
        v_item.source_name,
        v_item.source_url,
        v_item.source_domain,
        v_item.external_id,
        COALESCE(v_item.tags, '{}'::TEXT[]),
        jsonb_build_object(
            'notes', v_item.notes,
            'normalized_payload', v_item.normalized_payload
        ),
        'active'
    )
    ON CONFLICT (location_type, normalized_name, city, district)
    DO UPDATE SET
        name = EXCLUDED.name,
        address = COALESCE(EXCLUDED.address, public.location_catalog.address),
        latitude = COALESCE(EXCLUDED.latitude, public.location_catalog.latitude),
        longitude = COALESCE(EXCLUDED.longitude, public.location_catalog.longitude),
        source_name = EXCLUDED.source_name,
        source_url = COALESCE(EXCLUDED.source_url, public.location_catalog.source_url),
        source_domain = COALESCE(EXCLUDED.source_domain, public.location_catalog.source_domain),
        external_id = COALESCE(EXCLUDED.external_id, public.location_catalog.external_id),
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO v_location_id;

    UPDATE public.location_crawl_ingestions
    SET
        review_status = 'imported',
        imported_location_id = v_location_id,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_ingestion_id;

    RETURN v_location_id;
END;
$$;

CREATE OR REPLACE VIEW public.location_crawl_review_queue
WITH (security_invoker = true)
AS
SELECT
    lci.id,
    lci.source_type,
    lci.source_name,
    lci.source_url,
    lci.source_domain,
    lci.external_id,
    lci.location_name,
    lci.normalized_name,
    lci.location_type,
    lci.city,
    lci.district,
    lci.address,
    lci.latitude,
    lci.longitude,
    lci.tags,
    lci.notes,
    lci.crawl_confidence,
    lci.review_status,
    lci.import_error,
    lci.created_at,
    lci.updated_at,
    lci.reviewed_at,
    lci.reviewed_by,
    lci.matched_location_id,
    lci.imported_location_id,
    lc.name AS matched_location_name
FROM public.location_crawl_ingestions AS lci
LEFT JOIN public.location_catalog AS lc
    ON lc.id = lci.matched_location_id;

GRANT SELECT ON public.location_catalog TO anon;
GRANT SELECT ON public.location_catalog TO authenticated;
GRANT SELECT ON public.location_crawl_review_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_location_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classify_location_crawl_ingestion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_location_crawl_ingestion(UUID) TO authenticated;
