/**
 * TanStack Query Hooks for Admin Analytics
 */
import { useQuery } from '@tanstack/react-query';
import * as analyticsService from '@/services/analytics';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

// Query key factory
export const adminAnalyticsKeys = {
    all: ['admin', 'analytics'] as const,
    userGrowth: () => [...adminAnalyticsKeys.all, 'userGrowth'] as const,
    roomDistribution: () => [...adminAnalyticsKeys.all, 'roomDistribution'] as const,
};

/**
 * Get user growth stats (last 6 months)
 */
export function useUserGrowthStats() {
    return useQuery({
        queryKey: adminAnalyticsKeys.userGrowth(),
        queryFn: () => analyticsService.getUserGrowthStats(),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
    });
}

/**
 * Get room type distribution
 */
export function useRoomTypeDistribution() {
    return useQuery({
        queryKey: adminAnalyticsKeys.roomDistribution(),
        queryFn: () => analyticsService.getRoomTypeDistribution(),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
    });
}
