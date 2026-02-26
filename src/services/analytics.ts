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
