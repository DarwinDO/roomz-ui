-- =====================================================
-- Admin Stats RPC - Combine 6 queries into 1
-- =====================================================
-- Optimizes dashboard performance by fetching all stats in single call
CREATE OR REPLACE FUNCTION public.get_admin_stats() RETURNS JSON LANGUAGE sql SECURITY DEFINER STABLE AS $$
SELECT json_build_object(
        'totalUsers',
        (
            SELECT count(*)
            FROM users
            WHERE deleted_at IS NULL
        ),
        'activeUsers',
        (
            SELECT count(*)
            FROM users
            WHERE account_status = 'active'
                AND deleted_at IS NULL
        ),
        'totalRooms',
        (
            SELECT count(*)
            FROM rooms
            WHERE deleted_at IS NULL
        ),
        'pendingRooms',
        (
            SELECT count(*)
            FROM rooms
            WHERE status = 'pending'
                AND deleted_at IS NULL
        ),
        'activeRooms',
        (
            SELECT count(*)
            FROM rooms
            WHERE status = 'active'
                AND deleted_at IS NULL
        ),
        'totalBookings',
        (
            SELECT count(*)
            FROM bookings
        )
    );
$$;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;