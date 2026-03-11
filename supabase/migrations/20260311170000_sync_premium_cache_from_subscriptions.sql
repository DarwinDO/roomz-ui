CREATE OR REPLACE FUNCTION public.sync_user_premium_cache(p_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_updated integer := 0;
BEGIN
    WITH active_subscriptions AS (
        SELECT
            s.user_id,
            MAX(s.current_period_end) AS premium_until
        FROM public.subscriptions s
        WHERE s.status = 'active'
          AND (s.current_period_end IS NULL OR s.current_period_end > now())
          AND (p_user_id IS NULL OR s.user_id = p_user_id)
        GROUP BY s.user_id
    ),
    updated_active AS (
        UPDATE public.users u
        SET is_premium = TRUE,
            premium_until = a.premium_until,
            updated_at = now()
        FROM active_subscriptions a
        WHERE u.id = a.user_id
          AND (
              u.is_premium IS DISTINCT FROM TRUE
              OR u.premium_until IS DISTINCT FROM a.premium_until
          )
        RETURNING 1
    ),
    updated_inactive AS (
        UPDATE public.users u
        SET is_premium = FALSE,
            premium_until = NULL,
            updated_at = now()
        WHERE (p_user_id IS NULL OR u.id = p_user_id)
          AND (COALESCE(u.is_premium, FALSE) = TRUE OR u.premium_until IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1
              FROM active_subscriptions a
              WHERE a.user_id = u.id
          )
        RETURNING 1
    )
    SELECT
        COALESCE((SELECT COUNT(*) FROM updated_active), 0)
        + COALESCE((SELECT COUNT(*) FROM updated_inactive), 0)
    INTO v_rows_updated;

    RETURN v_rows_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_user_premium_cache(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_premium_cache(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_user_premium_cache_from_subscription_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
    PERFORM public.sync_user_premium_cache(v_user_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_user_premium_cache_on_subscriptions ON public.subscriptions;

CREATE TRIGGER sync_user_premium_cache_on_subscriptions
AFTER INSERT OR UPDATE OF status, current_period_end, user_id OR DELETE
ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_premium_cache_from_subscription_trigger();

SELECT public.sync_user_premium_cache();
