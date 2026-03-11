CREATE TABLE IF NOT EXISTS public.roommate_daily_usage (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature_key text NOT NULL CHECK (feature_key IN ('roommate_profile_view', 'roommate_request')),
    usage_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
    usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (user_id, feature_key, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_roommate_daily_usage_user_date
    ON public.roommate_daily_usage(user_id, usage_date DESC);

ALTER TABLE public.roommate_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_roommate_premium_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions s
        WHERE s.user_id = p_user_id
          AND s.status = 'active'
          AND s.plan = 'rommz_plus'
          AND (s.current_period_end IS NULL OR s.current_period_end > timezone('utc', now()))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_roommate_feature_limits()
RETURNS TABLE (
    views integer,
    requests integer,
    view_limit integer,
    request_limit integer,
    can_view_more boolean,
    can_send_more boolean,
    is_premium boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_premium boolean := false;
    v_views_used integer := 0;
    v_requests_used integer := 0;
    v_free_view_limit constant integer := 10;
    v_free_request_limit constant integer := 5;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    v_is_premium := public.is_roommate_premium_user(v_user_id);

    SELECT
        COALESCE(MAX(CASE WHEN feature_key = 'roommate_profile_view' THEN usage_count END), 0),
        COALESCE(MAX(CASE WHEN feature_key = 'roommate_request' THEN usage_count END), 0)
    INTO v_views_used, v_requests_used
    FROM public.roommate_daily_usage
    WHERE user_id = v_user_id
      AND usage_date = (timezone('utc', now()))::date;

    RETURN QUERY
    SELECT
        CASE WHEN v_is_premium THEN 0 ELSE GREATEST(0, v_free_view_limit - v_views_used) END,
        CASE WHEN v_is_premium THEN 0 ELSE GREATEST(0, v_free_request_limit - v_requests_used) END,
        CASE WHEN v_is_premium THEN NULL ELSE v_free_view_limit END,
        CASE WHEN v_is_premium THEN NULL ELSE v_free_request_limit END,
        CASE WHEN v_is_premium THEN true ELSE v_views_used < v_free_view_limit END,
        CASE WHEN v_is_premium THEN true ELSE v_requests_used < v_free_request_limit END,
        v_is_premium;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_roommate_profile_view()
RETURNS TABLE (
    views integer,
    requests integer,
    view_limit integer,
    request_limit integer,
    can_view_more boolean,
    can_send_more boolean,
    is_premium boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_premium boolean := false;
    v_current_count integer := 0;
    v_free_view_limit constant integer := 10;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    v_is_premium := public.is_roommate_premium_user(v_user_id);

    SELECT usage_count
    INTO v_current_count
    FROM public.roommate_daily_usage
    WHERE user_id = v_user_id
      AND feature_key = 'roommate_profile_view'
      AND usage_date = (timezone('utc', now()))::date;

    v_current_count := COALESCE(v_current_count, 0);

    IF NOT v_is_premium AND v_current_count >= v_free_view_limit THEN
        RAISE EXCEPTION 'ROOMMATE_VIEW_LIMIT_REACHED';
    END IF;

    INSERT INTO public.roommate_daily_usage (user_id, feature_key, usage_date, usage_count)
    VALUES (v_user_id, 'roommate_profile_view', (timezone('utc', now()))::date, 1)
    ON CONFLICT (user_id, feature_key, usage_date)
    DO UPDATE
    SET
        usage_count = public.roommate_daily_usage.usage_count + 1,
        updated_at = timezone('utc', now());

    RETURN QUERY
    SELECT * FROM public.get_roommate_feature_limits();
END;
$$;

CREATE OR REPLACE FUNCTION public.create_roommate_request_with_limit(
    p_receiver_id uuid,
    p_message text DEFAULT NULL
)
RETURNS public.roommate_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id uuid := auth.uid();
    v_is_premium boolean := false;
    v_current_count integer := 0;
    v_free_request_limit constant integer := 5;
    v_request public.roommate_requests;
BEGIN
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF v_sender_id = p_receiver_id THEN
        RAISE EXCEPTION 'no_self_request';
    END IF;

    v_is_premium := public.is_roommate_premium_user(v_sender_id);

    SELECT usage_count
    INTO v_current_count
    FROM public.roommate_daily_usage
    WHERE user_id = v_sender_id
      AND feature_key = 'roommate_request'
      AND usage_date = (timezone('utc', now()))::date;

    v_current_count := COALESCE(v_current_count, 0);

    IF NOT v_is_premium AND v_current_count >= v_free_request_limit THEN
        RAISE EXCEPTION 'ROOMMATE_REQUEST_LIMIT_REACHED';
    END IF;

    INSERT INTO public.roommate_daily_usage (user_id, feature_key, usage_date, usage_count)
    VALUES (v_sender_id, 'roommate_request', (timezone('utc', now()))::date, 1)
    ON CONFLICT (user_id, feature_key, usage_date)
    DO UPDATE
    SET
        usage_count = public.roommate_daily_usage.usage_count + 1,
        updated_at = timezone('utc', now());

    INSERT INTO public.roommate_requests (sender_id, receiver_id, message)
    VALUES (v_sender_id, p_receiver_id, p_message)
    RETURNING * INTO v_request;

    RETURN v_request;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_roommate_premium_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_roommate_feature_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_roommate_profile_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_roommate_request_with_limit(uuid, text) TO authenticated;
