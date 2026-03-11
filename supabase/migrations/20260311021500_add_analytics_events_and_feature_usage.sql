CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name text NOT NULL CHECK (char_length(trim(event_name)) > 0),
    user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
    session_id text NULL,
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    "timestamp" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_name_timestamp_idx
    ON public.analytics_events (event_name, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS analytics_events_user_id_timestamp_idx
    ON public.analytics_events (user_id, "timestamp" DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_events_session_id_timestamp_idx
    ON public.analytics_events (session_id, "timestamp" DESC)
    WHERE session_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'analytics_events'
          AND policyname = 'analytics_events_insert_anon'
    ) THEN
        CREATE POLICY analytics_events_insert_anon
            ON public.analytics_events
            FOR INSERT
            TO anon
            WITH CHECK (user_id IS NULL);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'analytics_events'
          AND policyname = 'analytics_events_insert_authenticated'
    ) THEN
        CREATE POLICY analytics_events_insert_authenticated
            ON public.analytics_events
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'analytics_events'
          AND policyname = 'analytics_events_select_admin'
    ) THEN
        CREATE POLICY analytics_events_select_admin
            ON public.analytics_events
            FOR SELECT
            TO authenticated
            USING (public.is_admin());
    END IF;
END $$;

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;

CREATE OR REPLACE FUNCTION public.get_feature_usage_stats(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
WITH feature_map AS (
    SELECT *
    FROM (
        VALUES
            ('search_performed', 'Tìm kiếm phòng', 'discovery', 1),
            ('filter_applied', 'Áp dụng bộ lọc', 'discovery', 2),
            ('location_selected', 'Chọn khu vực', 'discovery', 3),
            ('room_view', 'Xem chi tiết phòng', 'engagement', 4),
            ('room_favorite', 'Lưu yêu thích', 'engagement', 5),
            ('room_contact_view', 'Xem liên hệ chủ nhà', 'engagement', 6),
            ('roommate_profile_viewed', 'Xem hồ sơ roommate', 'engagement', 7),
            ('roommate_intro_sent', 'Gửi lời chào roommate', 'engagement', 8),
            ('booking_created', 'Đặt lịch xem phòng', 'conversion', 9),
            ('signup_completed', 'Hoàn tất đăng ký', 'growth', 10),
            ('subscription_started', 'Mở gói thành viên', 'revenue', 11),
            ('subscription_renewed', 'Gia hạn gói', 'revenue', 12),
            ('subscription_cancelled', 'Hủy gói', 'revenue', 13)
    ) AS mapping(event_name, feature_label, feature_group, sort_order)
),
windowed_events AS (
    SELECT
        event_name,
        user_id::text AS user_id,
        NULLIF(session_id, '') AS session_id,
        "timestamp"
    FROM public.analytics_events
    WHERE "timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 14))
),
aggregated AS (
    SELECT
        fm.event_name,
        fm.feature_label,
        fm.feature_group,
        fm.sort_order,
        COUNT(*) FILTER (
            WHERE e."timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
        )::int AS total_events,
        COUNT(DISTINCT e.user_id) FILTER (
            WHERE e."timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
              AND e.user_id IS NOT NULL
        )::int AS unique_users,
        COUNT(DISTINCT e.session_id) FILTER (
            WHERE e."timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
              AND e.session_id IS NOT NULL
        )::int AS unique_sessions,
        COUNT(*) FILTER (
            WHERE e."timestamp" >= now() - interval '7 days'
        )::int AS last_7d_events,
        COUNT(*) FILTER (
            WHERE e."timestamp" >= now() - interval '14 days'
              AND e."timestamp" < now() - interval '7 days'
        )::int AS previous_7d_events,
        MAX(e."timestamp") AS last_event_at
    FROM feature_map fm
    LEFT JOIN windowed_events e
        ON e.event_name = fm.event_name
    GROUP BY fm.event_name, fm.feature_label, fm.feature_group, fm.sort_order
),
ranked AS (
    SELECT
        event_name,
        feature_label,
        feature_group,
        total_events,
        unique_users,
        unique_sessions,
        last_7d_events,
        previous_7d_events,
        CASE
            WHEN previous_7d_events = 0 AND last_7d_events > 0 THEN 100
            WHEN previous_7d_events = 0 THEN 0
            ELSE ROUND(((last_7d_events - previous_7d_events)::numeric / previous_7d_events) * 100, 1)
        END AS change_pct,
        last_event_at,
        sort_order
    FROM aggregated
    WHERE total_events > 0 OR last_event_at IS NOT NULL
)
SELECT COALESCE(
    json_agg(row_to_json(ranked) ORDER BY total_events DESC, sort_order ASC),
    '[]'::json
)
FROM ranked;
$$;

GRANT EXECUTE ON FUNCTION public.get_feature_usage_stats(integer) TO authenticated;
