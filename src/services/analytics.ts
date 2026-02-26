/**
 * Analytics Service
 * RPC functions for admin dashboard analytics
 */
import { supabase } from '@/lib/supabase';

export interface UserGrowthData {
    month: string;
    users: number;
}

export interface RoomTypeData {
    type: string;
    value: number;
}

export interface RecentActivity {
    type: 'room_created' | 'user_joined' | 'booking_created' | 'report_submitted';
    description: string | null;
    created_at: string;
}

/**
 * Get user growth stats (last 6 months)
 */
export async function getUserGrowthStats(): Promise<UserGrowthData[]> {
    const { data, error } = await supabase.rpc('get_user_growth_stats' as never);

    if (error) {
        throw error;
    }

    return (data || []) as UserGrowthData[];
}

/**
 * Get room type distribution
 */
export async function getRoomTypeDistribution(): Promise<RoomTypeData[]> {
    const { data, error } = await supabase.rpc('get_room_type_distribution' as never);

    if (error) {
        throw error;
    }

    return (data || []) as RoomTypeData[];
}

/**
 * Get recent admin activities
 */
export async function getRecentActivities(limit = 10): Promise<RecentActivity[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_recent_admin_activities', { p_limit: limit });
    if (error) throw error;
    return (data || []) as RecentActivity[];
}
