-- Harden promo status exposure and cleanup logging table access.
-- 1. Replace the SECURITY DEFINER view implementation with a SECURITY DEFINER
--    function behind a SECURITY INVOKER view.
-- 2. Enable RLS on payment_cleanup_logs so it is no longer publicly exposed.

CREATE OR REPLACE FUNCTION public.get_promo_status()
RETURNS TABLE(total_slots integer, claimed_slots bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        (
            SELECT value::integer
            FROM public.app_configs
            WHERE key = 'promo_slot_limit'
        ) AS total_slots,
        (
            SELECT count(*)
            FROM public.subscriptions
            WHERE promo_applied = true
        ) AS claimed_slots;
$$;

REVOKE ALL ON FUNCTION public.get_promo_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_promo_status() TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.promo_status
WITH (security_invoker = true)
AS
SELECT *
FROM public.get_promo_status();

GRANT SELECT ON public.promo_status TO anon, authenticated;

ALTER TABLE public.payment_cleanup_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_cleanup_logs FROM PUBLIC, anon, authenticated;

