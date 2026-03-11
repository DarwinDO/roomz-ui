-- Allow direct postgres/admin sessions to verify and operate crawl ingestion RPCs.
-- Keeps runtime protection for authenticated clients and service_role requests.

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
    IF v_request_role <> 'service_role'
        AND session_user <> 'postgres'
        AND NOT public.is_admin() THEN
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
    IF v_request_role <> 'service_role'
        AND session_user <> 'postgres'
        AND NOT public.is_admin() THEN
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
