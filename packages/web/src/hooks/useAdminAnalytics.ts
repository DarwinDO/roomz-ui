/**
 * TanStack Query Hooks for Admin Analytics
 */
import { useQuery } from '@tanstack/react-query';
import * as analyticsService from '@/services/analytics';

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export const adminAnalyticsKeys = {
  all: ['admin', 'analytics'] as const,
  userGrowth: () => [...adminAnalyticsKeys.all, 'userGrowth'] as const,
  roomDistribution: () => [...adminAnalyticsKeys.all, 'roomDistribution'] as const,
  featureUsage: (days: number) => [...adminAnalyticsKeys.all, 'featureUsage', days] as const,
  popularLocations: (days: number, limit: number) => [...adminAnalyticsKeys.all, 'popularLocations', days, limit] as const,
  retention: (monthsBack: number) => [...adminAnalyticsKeys.all, 'retention', monthsBack] as const,
  recentActivities: () => [...adminAnalyticsKeys.all, 'recentActivities'] as const,
};

export function useUserGrowthStats() {
  return useQuery({
    queryKey: adminAnalyticsKeys.userGrowth(),
    queryFn: () => analyticsService.getUserGrowthStats(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useRoomTypeDistribution() {
  return useQuery({
    queryKey: adminAnalyticsKeys.roomDistribution(),
    queryFn: () => analyticsService.getRoomTypeDistribution(),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useFeatureUsageStats(days = 30) {
  return useQuery({
    queryKey: adminAnalyticsKeys.featureUsage(days),
    queryFn: () => analyticsService.getFeatureUsageStats(days),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function usePopularLocationStats(days = 30, limit = 8) {
  return useQuery({
    queryKey: adminAnalyticsKeys.popularLocations(days, limit),
    queryFn: () => analyticsService.getPopularLocationStats(days, limit),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useUserRetentionCohorts(monthsBack = 6) {
  return useQuery({
    queryKey: adminAnalyticsKeys.retention(monthsBack),
    queryFn: () => analyticsService.getUserRetentionCohorts(monthsBack),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: adminAnalyticsKeys.recentActivities(),
    queryFn: () => analyticsService.getRecentActivities(),
    staleTime: 2 * 60 * 1000,
  });
}
