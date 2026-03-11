-- Verify the database contract required by the current web/shared clients.
-- Safe to run repeatedly. This script only inspects schema metadata.

DO $$
DECLARE
    v_status_check TEXT;
    v_partner_status_check TEXT;
    v_plan_default TEXT;
    v_checkout_proc REGPROCEDURE;
    v_checkout_def TEXT;
    v_promo_proc REGPROCEDURE;
    v_promo_view_options TEXT[];
    v_swap_proc REGPROCEDURE;
    v_search_proc REGPROCEDURE;
    v_search_def TEXT;
    v_partner_crawl_classify_proc REGPROCEDURE;
    v_partner_crawl_promote_proc REGPROCEDURE;
    v_partner_crawl_rls BOOLEAN;
    v_location_catalog REGCLASS;
    v_location_search_proc REGPROCEDURE;
    v_location_nearby_proc REGPROCEDURE;
    v_location_featured_proc REGPROCEDURE;
    v_location_crawl_classify_proc REGPROCEDURE;
    v_location_crawl_promote_proc REGPROCEDURE;
    v_location_crawl_rls BOOLEAN;
    v_payment_cleanup_rls BOOLEAN;
    v_auth_fk_count INTEGER;
    v_public_user_fk_count INTEGER;
    v_public_assigned_fk_count INTEGER;
BEGIN
    SELECT pg_get_constraintdef(c.oid)
    INTO v_status_check
    FROM pg_constraint c
    WHERE c.conrelid = 'public.service_leads'::regclass
      AND c.conname = 'service_leads_status_check';

    IF v_status_check IS NULL THEN
        RAISE EXCEPTION 'Missing constraint public.service_leads.service_leads_status_check';
    END IF;

    IF position('submitted' in v_status_check) = 0
        OR position('assigned' in v_status_check) = 0
        OR position('confirmed' in v_status_check) = 0
        OR position('completed' in v_status_check) = 0
        OR position('cancelled' in v_status_check) = 0
        OR position('rejected' in v_status_check) = 0 THEN
        RAISE EXCEPTION 'service_leads_status_check is missing one or more required statuses: %', v_status_check;
    END IF;

    IF position('partner_contacted' in v_status_check) > 0
        OR position('rated' in v_status_check) > 0 THEN
        RAISE EXCEPTION 'service_leads_status_check still exposes legacy statuses: %', v_status_check;
    END IF;

    SELECT pg_get_constraintdef(c.oid)
    INTO v_partner_status_check
    FROM pg_constraint c
    WHERE c.conrelid = 'public.partners'::regclass
      AND c.conname = 'partners_status_check';

    IF v_partner_status_check IS NULL THEN
        RAISE EXCEPTION 'Missing constraint public.partners.partners_status_check';
    END IF;

    IF position('active' in v_partner_status_check) = 0
        OR position('inactive' in v_partner_status_check) = 0 THEN
        RAISE EXCEPTION 'partners_status_check is missing one or more required statuses: %', v_partner_status_check;
    END IF;

    IF position('pending' in v_partner_status_check) > 0
        OR position('suspended' in v_partner_status_check) > 0
        OR position('rejected' in v_partner_status_check) > 0 THEN
        RAISE EXCEPTION 'partners_status_check still exposes unsupported statuses: %', v_partner_status_check;
    END IF;

    SELECT COUNT(*)
    INTO v_auth_fk_count
    FROM pg_constraint c
    WHERE c.conrelid = 'public.service_leads'::regclass
      AND c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass;

    IF v_auth_fk_count > 0 THEN
        RAISE EXCEPTION 'service_leads still has % auth.users foreign keys attached', v_auth_fk_count;
    END IF;

    SELECT COUNT(*)
    INTO v_public_user_fk_count
    FROM pg_constraint c
    WHERE c.conrelid = 'public.service_leads'::regclass
      AND c.contype = 'f'
      AND c.conname = 'service_leads_user_id_users_fkey'
      AND c.confrelid = 'public.users'::regclass;

    IF v_public_user_fk_count = 0 THEN
        RAISE EXCEPTION 'service_leads_user_id_users_fkey is missing';
    END IF;

    SELECT COUNT(*)
    INTO v_public_assigned_fk_count
    FROM pg_constraint c
    WHERE c.conrelid = 'public.service_leads'::regclass
      AND c.contype = 'f'
      AND c.conname = 'service_leads_assigned_by_users_fkey'
      AND c.confrelid = 'public.users'::regclass;

    IF v_public_assigned_fk_count = 0 THEN
        RAISE EXCEPTION 'service_leads_assigned_by_users_fkey is missing';
    END IF;

    SELECT column_default
    INTO v_plan_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_orders'
      AND column_name = 'plan';

    IF v_plan_default IS NULL OR position('rommz_plus' in v_plan_default) = 0 THEN
        RAISE EXCEPTION 'payment_orders.plan default is not rommz_plus: %', coalesce(v_plan_default, '<null>');
    END IF;

    SELECT to_regprocedure('public.get_promo_status()')
    INTO v_promo_proc;

    IF v_promo_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.get_promo_status()';
    END IF;

    SELECT c.reloptions
    INTO v_promo_view_options
    FROM pg_class c
    WHERE c.oid = 'public.promo_status'::regclass;

    IF v_promo_view_options IS NULL
        OR array_position(v_promo_view_options, 'security_invoker=true') IS NULL THEN
        RAISE EXCEPTION 'promo_status view is not configured with security_invoker=true: %', v_promo_view_options;
    END IF;

    SELECT c.relrowsecurity
    INTO v_payment_cleanup_rls
    FROM pg_class c
    WHERE c.oid = 'public.payment_cleanup_logs'::regclass;

    IF coalesce(v_payment_cleanup_rls, false) = false THEN
        RAISE EXCEPTION 'payment_cleanup_logs still has RLS disabled';
    END IF;

    SELECT to_regprocedure('public.create_checkout_order(text, text, boolean)')
    INTO v_checkout_proc;

    IF v_checkout_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.create_checkout_order(text, text, boolean)';
    END IF;

    SELECT pg_get_functiondef(v_checkout_proc)
    INTO v_checkout_def;

    IF position('pg_advisory_xact_lock' in v_checkout_def) = 0 THEN
        RAISE EXCEPTION 'create_checkout_order no longer acquires the per-user advisory transaction lock';
    END IF;

    IF position('expires_at <= NOW()' in v_checkout_def) = 0
        OR position('status = ''expired''' in v_checkout_def) = 0 THEN
        RAISE EXCEPTION 'create_checkout_order no longer expires stale pending orders';
    END IF;

    IF position('plan <> p_plan OR billing_cycle <> p_billing_cycle' in v_checkout_def) = 0
        OR position('status = ''cancelled''' in v_checkout_def) = 0 THEN
        RAISE EXCEPTION 'create_checkout_order no longer cancels conflicting pending orders';
    END IF;

    IF position('id <> v_existing_order.id' in v_checkout_def) = 0 THEN
        RAISE EXCEPTION 'create_checkout_order no longer deduplicates same-plan pending orders';
    END IF;

    IF position('promo_applied' in v_checkout_def) = 0 THEN
        RAISE EXCEPTION 'create_checkout_order response no longer exposes promo_applied';
    END IF;

    SELECT to_regprocedure('public.search_rooms(text, text, numeric, numeric, text[], boolean, boolean, boolean, text[], numeric, numeric, numeric, text, integer, integer)')
    INTO v_search_proc;

    IF v_search_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.search_rooms(text, text, numeric, numeric, text[], boolean, boolean, boolean, text[], numeric, numeric, numeric, text, integer, integer)';
    END IF;

    SELECT pg_get_functiondef(v_search_proc)
    INTO v_search_def;

    IF position('p_lat numeric DEFAULT NULL::numeric' in v_search_def) = 0
        OR position('p_lng numeric DEFAULT NULL::numeric' in v_search_def) = 0
        OR position('p_radius_km numeric DEFAULT NULL::numeric' in v_search_def) = 0 THEN
        RAISE EXCEPTION 'search_rooms no longer exposes geo filter parameters';
    END IF;

    IF position('distance_km double precision' in v_search_def) = 0
        OR position('public.calculate_distance_km' in v_search_def) = 0 THEN
        RAISE EXCEPTION 'search_rooms no longer computes distance-based ranking';
    END IF;

    SELECT to_regprocedure('public.classify_partner_crawl_ingestion(uuid)')
    INTO v_partner_crawl_classify_proc;

    IF v_partner_crawl_classify_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.classify_partner_crawl_ingestion(uuid)';
    END IF;

    SELECT to_regprocedure('public.promote_partner_crawl_ingestion(uuid)')
    INTO v_partner_crawl_promote_proc;

    IF v_partner_crawl_promote_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.promote_partner_crawl_ingestion(uuid)';
    END IF;

    SELECT c.relrowsecurity
    INTO v_partner_crawl_rls
    FROM pg_class c
    WHERE c.oid = 'public.partner_crawl_ingestions'::regclass;

    IF coalesce(v_partner_crawl_rls, false) = false THEN
        RAISE EXCEPTION 'partner_crawl_ingestions still has RLS disabled';
    END IF;

    SELECT to_regclass('public.location_catalog')
    INTO v_location_catalog;

    IF v_location_catalog IS NULL THEN
        RAISE EXCEPTION 'Missing table public.location_catalog';
    END IF;

    SELECT to_regprocedure('public.search_location_catalog(text, text, text[], integer)')
    INTO v_location_search_proc;

    IF v_location_search_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.search_location_catalog(text, text, text[], integer)';
    END IF;

    SELECT to_regprocedure('public.get_nearby_locations(numeric, numeric, numeric, integer, text[], text)')
    INTO v_location_nearby_proc;

    IF v_location_nearby_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.get_nearby_locations(numeric, numeric, numeric, integer, text[], text)';
    END IF;

    SELECT to_regprocedure('public.get_featured_locations(text, text[], integer)')
    INTO v_location_featured_proc;

    IF v_location_featured_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.get_featured_locations(text, text[], integer)';
    END IF;

    SELECT to_regprocedure('public.classify_location_crawl_ingestion(uuid)')
    INTO v_location_crawl_classify_proc;

    IF v_location_crawl_classify_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.classify_location_crawl_ingestion(uuid)';
    END IF;

    SELECT to_regprocedure('public.promote_location_crawl_ingestion(uuid)')
    INTO v_location_crawl_promote_proc;

    IF v_location_crawl_promote_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.promote_location_crawl_ingestion(uuid)';
    END IF;

    SELECT c.relrowsecurity
    INTO v_location_crawl_rls
    FROM pg_class c
    WHERE c.oid = 'public.location_crawl_ingestions'::regclass;

    IF coalesce(v_location_crawl_rls, false) = false THEN
        RAISE EXCEPTION 'location_crawl_ingestions still has RLS disabled';
    END IF;

    SELECT to_regprocedure('public.find_potential_swap_matches(uuid, integer)')
    INTO v_swap_proc;

    IF v_swap_proc IS NULL THEN
        RAISE EXCEPTION 'Missing function public.find_potential_swap_matches(uuid, integer)';
    END IF;
END;
$$;
