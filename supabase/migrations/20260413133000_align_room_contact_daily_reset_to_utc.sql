CREATE OR REPLACE FUNCTION public.get_room_contact(p_room_id uuid)
RETURNS TABLE(phone text, is_masked boolean)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_premium boolean := false;
    v_daily_views integer := 0;
    v_phone text;
    v_daily_limit integer := 3;
    v_premium_limit integer := 100;
    v_utc_day_start timestamptz := date_trunc('day', timezone('utc', now())) AT TIME ZONE 'utc';
    v_utc_next_day_start timestamptz := (date_trunc('day', timezone('utc', now())) + interval '1 day') AT TIME ZONE 'utc';
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE user_id = v_user_id
          AND plan = 'rommz_plus'
          AND status = 'active'
          AND (current_period_end IS NULL OR current_period_end > now())
    ) INTO v_is_premium;

    SELECT count(*)
    INTO v_daily_views
    FROM public.phone_number_views
    WHERE user_id = v_user_id
      AND viewed_at >= v_utc_day_start
      AND viewed_at < v_utc_next_day_start;

    SELECT u.phone
    INTO v_phone
    FROM public.rooms r
    JOIN public.users u ON r.landlord_id = u.id
    WHERE r.id = p_room_id;

    IF v_phone IS NULL THEN
        RETURN QUERY SELECT ''::text, true;
        RETURN;
    END IF;

    IF (
        v_is_premium
        AND v_daily_views >= v_premium_limit
    ) OR (
        NOT v_is_premium
        AND v_daily_views >= v_daily_limit
    ) THEN
        RETURN QUERY
        SELECT
            substring(v_phone from 1 for 3) || '***' || substring(v_phone from length(v_phone) - 2 for 3),
            true;
        RETURN;
    END IF;

    INSERT INTO public.phone_number_views (user_id, room_id)
    VALUES (v_user_id, p_room_id);

    RETURN QUERY SELECT v_phone, false;
END;
$$;
