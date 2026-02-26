-- Analytics RPC functions for admin dashboard
-- User growth by month (last 6 months)
CREATE OR REPLACE FUNCTION get_user_growth_stats() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
            count(*)::int as users
        FROM users
        WHERE deleted_at IS NULL
            AND created_at >= now() - interval '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;
$$;
-- Room type distribution
CREATE OR REPLACE FUNCTION get_room_type_distribution() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
        SELECT COALESCE(room_type, 'Khác') as type,
            count(*)::int as value
        FROM rooms
        WHERE deleted_at IS NULL
        GROUP BY room_type
    ) t;
$$;
GRANT EXECUTE ON FUNCTION get_user_growth_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_type_distribution() TO authenticated;