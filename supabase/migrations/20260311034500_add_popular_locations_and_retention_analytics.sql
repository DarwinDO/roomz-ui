CREATE OR REPLACE FUNCTION public.get_popular_location_stats(p_days integer DEFAULT 30, p_limit integer DEFAULT 8)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
WITH params AS (
    SELECT
        GREATEST(COALESCE(p_days, 30), 1) AS days_window,
        GREATEST(COALESCE(p_limit, 8), 1) AS limit_count,
        now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1)) AS since_at
),
location_search_events AS (
    SELECT
        COALESCE(
            NULLIF(trim(ae.properties->>'label'), ''),
            NULLIF(trim(ae.properties->'filters'->>'location_label'), ''),
            concat_ws(', ',
                NULLIF(trim(ae.properties->>'district'), ''),
                NULLIF(trim(ae.properties->>'city'), '')
            ),
            concat_ws(', ',
                NULLIF(trim(ae.properties->'filters'->>'location_district'), ''),
                NULLIF(trim(ae.properties->'filters'->>'location_city'), '')
            )
        ) AS location_label,
        COALESCE(
            NULLIF(trim(ae.properties->>'city'), ''),
            NULLIF(trim(ae.properties->'filters'->>'location_city'), '')
        ) AS city,
        COALESCE(
            NULLIF(trim(ae.properties->>'district'), ''),
            NULLIF(trim(ae.properties->'filters'->>'location_district'), '')
        ) AS district,
        COALESCE(NULLIF(trim(ae.properties->>'source'), ''), 'search') AS source,
        ae.user_id::text AS user_id,
        NULLIF(ae.session_id, '') AS session_id,
        ae.timestamp
    FROM public.analytics_events ae
    CROSS JOIN params p
    WHERE ae.timestamp >= p.since_at
      AND ae.event_name IN ('location_selected', 'search_performed')
      AND (
            NULLIF(trim(ae.properties->>'label'), '') IS NOT NULL
            OR NULLIF(trim(ae.properties->'filters'->>'location_label'), '') IS NOT NULL
            OR NULLIF(trim(ae.properties->>'city'), '') IS NOT NULL
            OR NULLIF(trim(ae.properties->'filters'->>'location_city'), '') IS NOT NULL
            OR NULLIF(trim(ae.properties->>'district'), '') IS NOT NULL
            OR NULLIF(trim(ae.properties->'filters'->>'location_district'), '') IS NOT NULL
      )
),
normalized_location_search_events AS (
    SELECT
        COALESCE(location_label, concat_ws(', ', district, city), city, district) AS location_label,
        city,
        district,
        source,
        user_id,
        session_id,
        timestamp
    FROM location_search_events
),
searched_ranked AS (
    SELECT
        location_label,
        city,
        district,
        source,
        COUNT(*)::int AS search_events,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS unique_users,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL)::int AS unique_sessions,
        COUNT(*) FILTER (WHERE timestamp >= now() - interval '7 days')::int AS last_7d_events,
        COUNT(*) FILTER (
            WHERE timestamp >= now() - interval '14 days'
              AND timestamp < now() - interval '7 days'
        )::int AS previous_7d_events,
        ROW_NUMBER() OVER (
            ORDER BY COUNT(*) DESC, COUNT(DISTINCT user_id) DESC, location_label ASC
        ) AS row_num
    FROM normalized_location_search_events
    GROUP BY location_label, city, district, source
),
room_location_events AS (
    SELECT
        concat_ws(', ', NULLIF(trim(r.district), ''), NULLIF(trim(r.city), '')) AS location_label,
        NULLIF(trim(r.city), '') AS city,
        NULLIF(trim(r.district), '') AS district,
        ae.event_name,
        ae.user_id::text AS user_id,
        ae.timestamp
    FROM public.analytics_events ae
    CROSS JOIN params p
    JOIN public.rooms r
      ON r.id = CASE
            WHEN COALESCE(ae.properties->>'room_id', ae.properties->>'original_room_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN COALESCE(ae.properties->>'room_id', ae.properties->>'original_room_id')::uuid
            ELSE NULL
        END
    WHERE ae.timestamp >= p.since_at
      AND ae.event_name IN ('room_view', 'room_contact_view', 'room_favorite', 'booking_created')
),
normalized_room_location_events AS (
    SELECT
        COALESCE(location_label, concat_ws(', ', district, city), city, district) AS location_label,
        city,
        district,
        event_name,
        user_id,
        timestamp
    FROM room_location_events
),
room_location_aggregates AS (
    SELECT
        location_label,
        city,
        district,
        COUNT(*) FILTER (WHERE event_name = 'room_view')::int AS room_views,
        COUNT(*) FILTER (WHERE event_name = 'room_contact_view')::int AS contact_views,
        COUNT(*) FILTER (WHERE event_name = 'room_favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE event_name = 'booking_created')::int AS bookings,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS unique_users
    FROM normalized_room_location_events
    GROUP BY location_label, city, district
),
viewed_ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            ORDER BY room_views DESC, favorites DESC, bookings DESC, location_label ASC
        ) AS row_num
    FROM room_location_aggregates
    WHERE room_views > 0
),
converting_ranked AS (
    SELECT
        location_label,
        city,
        district,
        room_views,
        contact_views,
        favorites,
        bookings,
        unique_users,
        ROUND((bookings::numeric / NULLIF(room_views, 0)) * 100, 1) AS booking_rate,
        ROUND(((favorites + contact_views + bookings)::numeric / NULLIF(room_views, 0)) * 100, 1) AS engagement_rate,
        ROW_NUMBER() OVER (
            ORDER BY bookings DESC, favorites DESC, contact_views DESC, room_views DESC, location_label ASC
        ) AS row_num
    FROM room_location_aggregates
    WHERE room_views > 0 OR favorites > 0 OR bookings > 0 OR contact_views > 0
)
SELECT json_build_object(
    'searched', COALESCE((
        SELECT json_agg(
            json_build_object(
                'location_label', location_label,
                'city', city,
                'district', district,
                'source', source,
                'search_events', search_events,
                'unique_users', unique_users,
                'unique_sessions', unique_sessions,
                'change_pct', CASE
                    WHEN previous_7d_events = 0 AND last_7d_events > 0 THEN 100
                    WHEN previous_7d_events = 0 THEN 0
                    ELSE ROUND(((last_7d_events - previous_7d_events)::numeric / previous_7d_events) * 100, 1)
                END
            )
            ORDER BY row_num
        )
        FROM searched_ranked
        CROSS JOIN params
        WHERE row_num <= params.limit_count
    ), '[]'::json),
    'viewed', COALESCE((
        SELECT json_agg(
            json_build_object(
                'location_label', location_label,
                'city', city,
                'district', district,
                'room_views', room_views,
                'contact_views', contact_views,
                'favorites', favorites,
                'bookings', bookings,
                'unique_users', unique_users
            )
            ORDER BY row_num
        )
        FROM viewed_ranked
        CROSS JOIN params
        WHERE row_num <= params.limit_count
    ), '[]'::json),
    'converting', COALESCE((
        SELECT json_agg(
            json_build_object(
                'location_label', location_label,
                'city', city,
                'district', district,
                'room_views', room_views,
                'contact_views', contact_views,
                'favorites', favorites,
                'bookings', bookings,
                'unique_users', unique_users,
                'booking_rate', booking_rate,
                'engagement_rate', engagement_rate
            )
            ORDER BY row_num
        )
        FROM converting_ranked
        CROSS JOIN params
        WHERE row_num <= params.limit_count
    ), '[]'::json)
);
$$;

GRANT EXECUTE ON FUNCTION public.get_popular_location_stats(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_retention_cohorts(p_months_back integer DEFAULT 6)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
WITH params AS (
    SELECT GREATEST(COALESCE(p_months_back, 6), 1) AS months_back
),
cohorts AS (
    SELECT
        u.id AS user_id,
        u.created_at,
        date_trunc('month', u.created_at)::date AS cohort_month
    FROM public.users u
    CROSS JOIN params p
    WHERE u.created_at >= date_trunc('month', now()) - make_interval(months => p.months_back - 1)
),
meaningful_activity AS (
    SELECT DISTINCT ae.user_id, ae.timestamp
    FROM public.analytics_events ae
    WHERE ae.user_id IS NOT NULL
      AND ae.event_name = ANY (
        ARRAY[
            'search_performed',
            'location_selected',
            'room_view',
            'room_favorite',
            'room_contact_view',
            'booking_created',
            'roommate_profile_viewed',
            'roommate_intro_sent',
            'subscription_started',
            'subscription_renewed'
        ]::text[]
      )
),
retention AS (
    SELECT
        c.cohort_month,
        COUNT(*)::int AS cohort_size,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1
                FROM meaningful_activity ma
                WHERE ma.user_id = c.user_id
                  AND ma.timestamp >= c.created_at + interval '1 day'
                  AND ma.timestamp < c.created_at + interval '8 days'
            )
        )::int AS week_1_users,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1
                FROM meaningful_activity ma
                WHERE ma.user_id = c.user_id
                  AND ma.timestamp >= c.created_at + interval '8 days'
                  AND ma.timestamp < c.created_at + interval '15 days'
            )
        )::int AS week_2_users,
        COUNT(*) FILTER (
            WHERE EXISTS (
                SELECT 1
                FROM meaningful_activity ma
                WHERE ma.user_id = c.user_id
                  AND ma.timestamp >= c.created_at + interval '22 days'
                  AND ma.timestamp < c.created_at + interval '29 days'
            )
        )::int AS week_4_users
    FROM cohorts c
    GROUP BY c.cohort_month
)
SELECT COALESCE(
    json_agg(
        json_build_object(
            'cohort_month', to_char(cohort_month, 'YYYY-MM'),
            'cohort_label', to_char(cohort_month, 'MM/YYYY'),
            'cohort_size', cohort_size,
            'week_1_users', week_1_users,
            'week_2_users', week_2_users,
            'week_4_users', week_4_users,
            'week_1_retention', ROUND((week_1_users::numeric / NULLIF(cohort_size, 0)) * 100, 1),
            'week_2_retention', ROUND((week_2_users::numeric / NULLIF(cohort_size, 0)) * 100, 1),
            'week_4_retention', ROUND((week_4_users::numeric / NULLIF(cohort_size, 0)) * 100, 1)
        )
        ORDER BY cohort_month
    ),
    '[]'::json
)
FROM retention;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_retention_cohorts(integer) TO authenticated;
