-- =============================================================================
-- Improve crawl ingestion dedupe and debug visibility
-- - Stop treating article source_url as a unique identity for every crawled row
-- - Keep low-confidence partner rows in review queue instead of dropping them
-- - Link ingestions back to crawl_jobs for admin debugging
-- =============================================================================

ALTER TABLE public.partner_crawl_ingestions
    ADD COLUMN IF NOT EXISTS crawl_job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE SET NULL;

ALTER TABLE public.location_crawl_ingestions
    ADD COLUMN IF NOT EXISTS crawl_job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_crawl_job_id
    ON public.partner_crawl_ingestions(crawl_job_id)
    WHERE crawl_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_location_crawl_ingestions_crawl_job_id
    ON public.location_crawl_ingestions(crawl_job_id)
    WHERE crawl_job_id IS NOT NULL;

DROP INDEX IF EXISTS idx_partner_crawl_ingestions_source_url;
CREATE INDEX IF NOT EXISTS idx_partner_crawl_ingestions_source_url_lookup
    ON public.partner_crawl_ingestions(source_type, source_url)
    WHERE source_url IS NOT NULL;

DROP INDEX IF EXISTS idx_location_crawl_ingestions_source_url;
CREATE INDEX IF NOT EXISTS idx_location_crawl_ingestions_source_url_lookup
    ON public.location_crawl_ingestions(source_type, source_url)
    WHERE source_url IS NOT NULL;

UPDATE public.partner_crawl_ingestions AS pci
SET crawl_job_id = (
    SELECT cj.id
    FROM public.crawl_jobs AS cj
    WHERE cj.entity_type = 'partner'
      AND cj.source_name = pci.source_name
      AND COALESCE(cj.source_url, '') = COALESCE(pci.source_url, '')
      AND cj.created_at <= pci.created_at
    ORDER BY cj.created_at DESC
    LIMIT 1
)
WHERE pci.crawl_job_id IS NULL;

UPDATE public.location_crawl_ingestions AS lci
SET crawl_job_id = (
    SELECT cj.id
    FROM public.crawl_jobs AS cj
    WHERE cj.entity_type = 'location'
      AND cj.source_name = lci.source_name
      AND COALESCE(cj.source_url, '') = COALESCE(lci.source_url, '')
      AND cj.created_at <= lci.created_at
    ORDER BY cj.created_at DESC
    LIMIT 1
)
WHERE lci.crawl_job_id IS NULL;

ALTER TABLE public.partner_crawl_ingestions
    DROP CONSTRAINT IF EXISTS partner_crawl_ingestions_review_status_check;

ALTER TABLE public.partner_crawl_ingestions
    ADD CONSTRAINT partner_crawl_ingestions_review_status_check CHECK (
        review_status IN (
            'pending',
            'ready',
            'low_confidence',
            'duplicate_partner',
            'duplicate_lead',
            'imported',
            'rejected',
            'error'
        )
    );

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
    v_normalized_email TEXT;
    v_normalized_phone TEXT;
    v_missing_fields TEXT[] := ARRAY[]::TEXT[];
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

    v_normalized_email := NULLIF(lower(btrim(COALESCE(v_item.email, ''))), '');
    v_normalized_phone := public.normalize_partner_phone(v_item.phone);

    IF COALESCE(NULLIF(btrim(v_item.company_name), ''), '') = '' THEN
        v_review_status := 'error';
        v_import_error := 'company_name is required';
    ELSE
        IF v_normalized_email IS NOT NULL OR v_normalized_phone IS NOT NULL THEN
            SELECT p.id
            INTO v_existing_partner_id
            FROM public.partners AS p
            WHERE (
                v_normalized_email IS NOT NULL
                AND p.email IS NOT NULL
                AND lower(p.email) = v_normalized_email
            ) OR (
                v_normalized_phone IS NOT NULL
                AND public.normalize_partner_phone(p.phone) = v_normalized_phone
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
                    v_normalized_email IS NOT NULL
                    AND lower(pl.email) = v_normalized_email
                ) OR (
                    v_normalized_phone IS NOT NULL
                    AND public.normalize_partner_phone(pl.phone) = v_normalized_phone
                )
                ORDER BY pl.updated_at DESC
                LIMIT 1;

                IF v_existing_partner_lead_id IS NOT NULL THEN
                    v_review_status := 'duplicate_lead';
                END IF;
            END IF;
        END IF;

        IF v_review_status = 'ready' THEN
            IF v_normalized_email IS NULL THEN
                v_missing_fields := array_append(v_missing_fields, 'email');
            END IF;
            IF v_normalized_phone IS NULL THEN
                v_missing_fields := array_append(v_missing_fields, 'phone');
            END IF;

            IF array_length(v_missing_fields, 1) > 0 THEN
                v_review_status := 'low_confidence';
                v_import_error := format(
                    'Missing %s. Review manually before promotion.',
                    array_to_string(v_missing_fields, ' and ')
                );
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

    IF v_item.review_status IN ('error', 'low_confidence', 'pending', 'rejected') THEN
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

DROP VIEW IF EXISTS public.partner_crawl_review_queue;

CREATE VIEW public.partner_crawl_review_queue
WITH (security_invoker = true)
AS
SELECT
    pci.id,
    pci.crawl_job_id,
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
    pci.notes,
    pci.dedupe_key,
    pci.crawl_confidence,
    pci.review_status,
    pci.import_error,
    pci.raw_payload,
    pci.normalized_payload,
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

DROP VIEW IF EXISTS public.location_crawl_review_queue;

CREATE VIEW public.location_crawl_review_queue
WITH (security_invoker = true)
AS
SELECT
    lci.id,
    lci.crawl_job_id,
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
    lci.dedupe_key,
    lci.raw_payload,
    lci.normalized_payload,
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
