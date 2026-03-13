CREATE OR REPLACE FUNCTION public.get_romi_overview_stats(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
WITH windowed AS (
    SELECT event_name, user_id, NULLIF(session_id, '') AS session_id
    FROM public.analytics_events
    WHERE "timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
      AND event_name IN (
          'romi_opened',
          'romi_suggested_prompt_clicked',
          'romi_message_sent',
          'romi_response_received',
          'romi_action_clicked',
          'romi_error'
      )
), aggregated AS (
    SELECT
        COUNT(*) FILTER (WHERE event_name = 'romi_opened')::int AS opens,
        COUNT(*) FILTER (WHERE event_name = 'romi_suggested_prompt_clicked')::int AS suggested_prompt_clicks,
        COUNT(*) FILTER (WHERE event_name = 'romi_message_sent')::int AS messages,
        COUNT(*) FILTER (WHERE event_name = 'romi_response_received')::int AS responses,
        COUNT(*) FILTER (WHERE event_name = 'romi_action_clicked')::int AS action_clicks,
        COUNT(*) FILTER (WHERE event_name = 'romi_error')::int AS errors,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS unique_users,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL)::int AS unique_sessions
    FROM windowed
)
SELECT row_to_json(result)
FROM (
    SELECT
        opens,
        suggested_prompt_clicks,
        messages,
        responses,
        action_clicks,
        errors,
        unique_users,
        unique_sessions,
        CASE
            WHEN messages = 0 THEN 0
            ELSE ROUND((responses::numeric / messages) * 100, 1)
        END AS response_rate,
        CASE
            WHEN messages = 0 THEN 0
            ELSE ROUND((errors::numeric / messages) * 100, 1)
        END AS error_rate,
        CASE
            WHEN responses = 0 THEN 0
            ELSE ROUND((action_clicks::numeric / responses) * 100, 1)
        END AS action_ctr
    FROM aggregated
) result;
$$;

GRANT EXECUTE ON FUNCTION public.get_romi_overview_stats(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_romi_tool_health(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
WITH tool_events AS (
    SELECT
        COALESCE(properties ->> 'tool_name', 'unknown') AS tool_name,
        COALESCE(properties ->> 'status', 'unknown') AS status,
        COALESCE(NULLIF(properties ->> 'result_count', ''), '0')::numeric AS result_count,
        "timestamp"
    FROM public.analytics_events
    WHERE "timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
      AND event_name = 'romi_tool_called'
), aggregated AS (
    SELECT
        tool_name,
        COUNT(*)::int AS total_calls,
        COUNT(*) FILTER (WHERE status = 'success')::int AS success_calls,
        COUNT(*) FILTER (WHERE status = 'empty')::int AS empty_calls,
        COUNT(*) FILTER (WHERE status = 'error')::int AS error_calls,
        ROUND(AVG(result_count), 2) AS average_result_count,
        MAX("timestamp") AS last_called_at
    FROM tool_events
    GROUP BY tool_name
)
SELECT COALESCE(
    json_agg(
        json_build_object(
            'tool_name', tool_name,
            'total_calls', total_calls,
            'success_calls', success_calls,
            'empty_calls', empty_calls,
            'error_calls', error_calls,
            'success_rate', CASE WHEN total_calls = 0 THEN 0 ELSE ROUND((success_calls::numeric / total_calls) * 100, 1) END,
            'empty_rate', CASE WHEN total_calls = 0 THEN 0 ELSE ROUND((empty_calls::numeric / total_calls) * 100, 1) END,
            'average_result_count', average_result_count,
            'last_called_at', last_called_at
        )
        ORDER BY total_calls DESC, tool_name ASC
    ),
    '[]'::json
)
FROM aggregated;
$$;

GRANT EXECUTE ON FUNCTION public.get_romi_tool_health(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_romi_recent_errors(
    p_days integer DEFAULT 30,
    p_limit integer DEFAULT 10
)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
SELECT COALESCE(
    json_agg(
        json_build_object(
            'occurred_at', err."timestamp",
            'session_id', NULLIF(err.session_id, ''),
            'error_code', err.properties ->> 'code',
            'error_message', err.properties ->> 'message'
        )
        ORDER BY err."timestamp" DESC
    ),
    '[]'::json
)
FROM (
    SELECT *
    FROM public.analytics_events
    WHERE "timestamp" >= now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1))
      AND event_name = 'romi_error'
    ORDER BY "timestamp" DESC
    LIMIT GREATEST(COALESCE(p_limit, 10), 1)
) err;
$$;

GRANT EXECUTE ON FUNCTION public.get_romi_recent_errors(integer, integer) TO authenticated;
