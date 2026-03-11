-- =============================================================================
-- Partner Crawl Ingestion Pipeline
-- Safe staging for crawled partner/company data before promoting to partner_leads
-- Created: 2026-03-10
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.partner_crawl_ingestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL DEFAULT 'firecrawl' CHECK (
        source_type IN ('firecrawl', 'manual_json', 'csv_import', 'admin_import')
    ),
    source_name TEXT NOT NULL,
    source_url TEXT,
    source_domain TEXT,
    external_id TEXT,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    service_area TEXT,
    service_category TEXT,
    address TEXT,
    website TEXT,
    notes TEXT,
    crawl_confidence NUMERIC(5, 2),
    dedupe_key TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    normalized_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        review_status IN (
            'pending',
            'ready',
            'duplicate_partner',
            'duplicate_lead',
            'imported',
            'rejected',
            'error'
        )
    ),
    matched_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    matched_partner_lead_id UUID REFERENCES public.partner_leads(id) ON DELETE SET NULL,
    imported_partner_lead_id UUID REFERENCES public.partner_leads(id) ON DELETE SET NULL,
    import_error TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_source_external
    ON public.partner_crawl_ingestions(source_type, external_id)
    WHERE external_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_source_url
    ON public.partner_crawl_ingestions(source_type, source_url)
    WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_review_status
    ON public.partner_crawl_ingestions(review_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_dedupe_key
    ON public.partner_crawl_ingestions(dedupe_key)
    WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.partner_crawl_ingestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view partner crawl ingestions" ON public.partner_crawl_ingestions;
CREATE POLICY "Admins can view partner crawl ingestions"
ON public.partner_crawl_ingestions
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert partner crawl ingestions" ON public.partner_crawl_ingestions;
CREATE POLICY "Admins can insert partner crawl ingestions"
ON public.partner_crawl_ingestions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update partner crawl ingestions" ON public.partner_crawl_ingestions;
CREATE POLICY "Admins can update partner crawl ingestions"
ON public.partner_crawl_ingestions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete partner crawl ingestions" ON public.partner_crawl_ingestions;
CREATE POLICY "Admins can delete partner crawl ingestions"
ON public.partner_crawl_ingestions
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.update_partner_crawl_ingestions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_crawl_ingestions_updated_at_trigger
ON public.partner_crawl_ingestions;

CREATE TRIGGER partner_crawl_ingestions_updated_at_trigger
BEFORE UPDATE ON public.partner_crawl_ingestions
FOR EACH ROW
EXECUTE FUNCTION public.update_partner_crawl_ingestions_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_partner_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
    SELECT NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.classify_partner_crawl_ingestion(p_ingestion_id UUID)
RETURNS TABLE(
    review_status TEXT,
    matched_partner_id UUID,
    matched_partner_lead_id UUID,
    import_error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_item public.partner_crawl_ingestions%ROWTYPE;
    v_existing_partner_id UUID;
    v_existing_partner_lead_id UUID;
    v_review_status TEXT := 'ready';
    v_import_error TEXT;
    v_request_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
    IF v_request_role <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to classify partner crawl ingestion';
    END IF;

    SELECT *
    INTO v_item
    FROM public.partner_crawl_ingestions
    WHERE id = p_ingestion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'partner_crawl_ingestions row not found: %', p_ingestion_id;
    END IF;

    IF COALESCE(NULLIF(btrim(v_item.company_name), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'company_name is required';
    ELSIF COALESCE(NULLIF(btrim(v_item.email), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'email is required before promotion';
    ELSIF COALESCE(NULLIF(public.normalize_partner_phone(v_item.phone), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'phone is required before promotion';
    END IF;

    IF v_review_status <> 'error' THEN
        SELECT p.id
        INTO v_existing_partner_id
        FROM public.partners AS p
        WHERE (
            v_item.email IS NOT NULL
            AND p.email IS NOT NULL
            AND lower(p.email) = lower(v_item.email)
        ) OR (
            public.normalize_partner_phone(v_item.phone) IS NOT NULL
            AND public.normalize_partner_phone(p.phone) = public.normalize_partner_phone(v_item.phone)
        )
        ORDER BY p.updated_at DESC
        LIMIT 1;

        IF v_existing_partner_id IS NOT NULL THEN
            v_review_status := 'duplicate_partner';
        ELSE
            SELECT pl.id
            INTO v_existing_partner_lead_id
            FROM public.partner_leads AS pl
            WHERE (
                v_item.email IS NOT NULL
                AND lower(pl.email) = lower(v_item.email)
            ) OR (
                public.normalize_partner_phone(v_item.phone) IS NOT NULL
                AND public.normalize_partner_phone(pl.phone) = public.normalize_partner_phone(v_item.phone)
            )
            ORDER BY pl.updated_at DESC
            LIMIT 1;

            IF v_existing_partner_lead_id IS NOT NULL THEN
                v_review_status := 'duplicate_lead';
            END IF;
        END IF;
    END IF;

    UPDATE public.partner_crawl_ingestions
    SET
        review_status = v_review_status,
        matched_partner_id = v_existing_partner_id,
        matched_partner_lead_id = v_existing_partner_lead_id,
        import_error = v_import_error,
        updated_at = now()
    WHERE id = p_ingestion_id;

    RETURN QUERY
    SELECT
        v_review_status,
        v_existing_partner_id,
        v_existing_partner_lead_id,
        v_import_error;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_partner_crawl_ingestion(p_ingestion_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_item public.partner_crawl_ingestions%ROWTYPE;
    v_partner_lead_id UUID;
    v_request_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
    IF v_request_role <> 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to promote partner crawl ingestion';
    END IF;

    PERFORM public.classify_partner_crawl_ingestion(p_ingestion_id);

    SELECT *
    INTO v_item
    FROM public.partner_crawl_ingestions
    WHERE id = p_ingestion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'partner_crawl_ingestions row not found: %', p_ingestion_id;
    END IF;

    IF v_item.review_status = 'duplicate_partner' THEN
        RAISE EXCEPTION 'Ingestion % already matches partner %', p_ingestion_id, v_item.matched_partner_id;
    END IF;

    IF v_item.review_status = 'duplicate_lead' AND v_item.matched_partner_lead_id IS NOT NULL THEN
        UPDATE public.partner_crawl_ingestions
        SET
            review_status = 'imported',
            imported_partner_lead_id = v_item.matched_partner_lead_id,
            reviewed_by = auth.uid(),
            reviewed_at = now(),
            updated_at = now()
        WHERE id = p_ingestion_id;

        RETURN v_item.matched_partner_lead_id;
    END IF;

    IF v_item.review_status = 'error' THEN
        RAISE EXCEPTION 'Ingestion % is not ready: %', p_ingestion_id, COALESCE(v_item.import_error, 'unknown error');
    END IF;

    INSERT INTO public.partner_leads (
        company_name,
        contact_name,
        email,
        phone,
        service_area,
        notes,
        status
    )
    VALUES (
        v_item.company_name,
        COALESCE(NULLIF(btrim(v_item.contact_name), ''), v_item.company_name),
        lower(v_item.email),
        v_item.phone,
        COALESCE(NULLIF(btrim(v_item.service_area), ''), NULLIF(btrim(v_item.address), ''), 'Chưa rõ'),
        CONCAT_WS(
            E'\n\n',
            NULLIF(btrim(v_item.notes), ''),
            format(
                'Imported from %s%s%s',
                v_item.source_name,
                CASE WHEN v_item.source_type IS NOT NULL THEN format(' [%s]', v_item.source_type) ELSE '' END,
                CASE WHEN v_item.source_url IS NOT NULL THEN format(': %s', v_item.source_url) ELSE '' END
            )
        ),
        'pending'
    )
    ON CONFLICT (email) DO UPDATE
    SET
        company_name = EXCLUDED.company_name,
        contact_name = EXCLUDED.contact_name,
        phone = EXCLUDED.phone,
        service_area = EXCLUDED.service_area,
        notes = EXCLUDED.notes,
        updated_at = now()
    RETURNING id INTO v_partner_lead_id;

    UPDATE public.partner_crawl_ingestions
    SET
        review_status = 'imported',
        imported_partner_lead_id = v_partner_lead_id,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_ingestion_id;

    RETURN v_partner_lead_id;
END;
$$;

CREATE OR REPLACE VIEW public.partner_crawl_review_queue
WITH (security_invoker = true)
AS
SELECT
    pci.id,
    pci.source_type,
    pci.source_name,
    pci.source_url,
    pci.source_domain,
    pci.external_id,
    pci.company_name,
    pci.contact_name,
    pci.email,
    pci.phone,
    pci.service_area,
    pci.service_category,
    pci.address,
    pci.website,
    pci.crawl_confidence,
    pci.review_status,
    pci.import_error,
    pci.created_at,
    pci.updated_at,
    pci.reviewed_at,
    pci.reviewed_by,
    pci.matched_partner_id,
    pci.matched_partner_lead_id,
    pci.imported_partner_lead_id,
    p.name AS matched_partner_name,
    pl.company_name AS matched_partner_lead_name
FROM public.partner_crawl_ingestions AS pci
LEFT JOIN public.partners AS p
    ON p.id = pci.matched_partner_id
LEFT JOIN public.partner_leads AS pl
    ON pl.id = pci.matched_partner_lead_id;

GRANT SELECT ON public.partner_crawl_review_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_partner_phone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classify_partner_crawl_ingestion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_partner_crawl_ingestion(UUID) TO authenticated;
