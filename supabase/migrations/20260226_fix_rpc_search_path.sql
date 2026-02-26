-- Fix search_path for admin RPC functions
-- Prevents search_path hijacking on SECURITY DEFINER functions
-- NOTE: All table references must use public. prefix
CREATE OR REPLACE FUNCTION public.get_admin_stats() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '' AS $$
SELECT json_build_object(
        'totalUsers',
        (
            SELECT count(*)
            FROM public.users
            WHERE deleted_at IS NULL
        ),
        'activeUsers',
        (
            SELECT count(*)
            FROM public.users
            WHERE account_status = 'active'
                AND deleted_at IS NULL
        ),
        'totalRooms',
        (
            SELECT count(*)
            FROM public.rooms
            WHERE deleted_at IS NULL
        ),
        'pendingRooms',
        (
            SELECT count(*)
            FROM public.rooms
            WHERE status = 'pending'
                AND deleted_at IS NULL
        ),
        'activeRooms',
        (
            SELECT count(*)
            FROM public.rooms
            WHERE status = 'active'
                AND deleted_at IS NULL
        ),
        'totalBookings',
        (
            SELECT count(*)
            FROM public.bookings
        )
    ) $$;
CREATE OR REPLACE FUNCTION public.get_user_growth_stats() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '' AS $$
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
            count(*)::int as users
        FROM public.users
        WHERE deleted_at IS NULL
            AND created_at >= now() - interval '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t $$
CREATE OR REPLACE FUNCTION public.get_room_type_distribution() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = '' AS $$
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
FROM (
        SELECT COALESCE(room_type::text, 'other') as type,
            count(*)::int as value
        FROM public.rooms
        WHERE deleted_at IS NULL
        GROUP BY room_type
    ) t $$;