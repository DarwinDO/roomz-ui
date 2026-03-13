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

export interface FeatureUsageStat {
  event_name: string;
  feature_label: string;
  feature_group: 'discovery' | 'engagement' | 'conversion' | 'growth' | 'revenue';
  total_events: number;
  unique_users: number;
  unique_sessions: number;
  last_7d_events: number;
  previous_7d_events: number;
  change_pct: number;
  last_event_at: string | null;
}

export interface PopularSearchLocationStat {
  location_label: string;
  city: string | null;
  district: string | null;
  source: string;
  search_events: number;
  unique_users: number;
  unique_sessions: number;
  change_pct: number;
}

export interface PopularViewedLocationStat {
  location_label: string;
  city: string | null;
  district: string | null;
  room_views: number;
  contact_views: number;
  favorites: number;
  bookings: number;
  unique_users: number;
}

export interface PopularConvertingLocationStat extends PopularViewedLocationStat {
  booking_rate: number;
  engagement_rate: number;
}

export interface PopularLocationStats {
  searched: PopularSearchLocationStat[];
  viewed: PopularViewedLocationStat[];
  converting: PopularConvertingLocationStat[];
}

export interface RetentionCohortStat {
  cohort_month: string;
  cohort_label: string;
  cohort_size: number;
  week_1_users: number;
  week_2_users: number;
  week_4_users: number;
  week_1_retention: number;
  week_2_retention: number;
  week_4_retention: number;
}

export interface RomiOverviewStat {
  opens: number;
  suggested_prompt_clicks: number;
  messages: number;
  responses: number;
  action_clicks: number;
  errors: number;
  unique_users: number;
  unique_sessions: number;
  response_rate: number;
  error_rate: number;
  action_ctr: number;
}

export interface RomiToolHealthStat {
  tool_name: string;
  total_calls: number;
  success_calls: number;
  empty_calls: number;
  error_calls: number;
  success_rate: number;
  empty_rate: number;
  average_result_count: number;
  last_called_at: string | null;
}

export interface RomiErrorStat {
  occurred_at: string;
  session_id: string | null;
  error_code: string | null;
  error_message: string | null;
}

type RpcResult<T> = {
  data: T | null;
  error: { message?: string } | Error | null;
};

function getRpcErrorMessage(error: RpcResult<unknown>['error'], fallback: string) {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return error.message || fallback;
}

async function runJsonRpc<T>(fn: string, args: Record<string, unknown>, fallbackMessage: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(fn, args) as RpcResult<T>;

  if (error) {
    throw new Error(getRpcErrorMessage(error, fallbackMessage));
  }

  return (data ?? ([] as unknown as T));
}

export async function getUserGrowthStats(): Promise<UserGrowthData[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_user_growth_stats');

  if (error) {
    throw error;
  }

  return (data || []) as UserGrowthData[];
}

export async function getRoomTypeDistribution(): Promise<RoomTypeData[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_room_type_distribution');

  if (error) {
    throw error;
  }

  return (data || []) as RoomTypeData[];
}

export async function getRecentActivities(limit = 10): Promise<RecentActivity[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_recent_admin_activities', { p_limit: limit });
  if (error) throw error;
  return (data || []) as RecentActivity[];
}

export async function getFeatureUsageStats(days = 30): Promise<FeatureUsageStat[]> {
  return runJsonRpc<FeatureUsageStat[]>(
    'get_feature_usage_stats',
    { p_days: days },
    'Failed to load feature usage stats',
  );
}

export async function getPopularLocationStats(days = 30, limit = 8): Promise<PopularLocationStats> {
  return runJsonRpc<PopularLocationStats>(
    'get_popular_location_stats',
    { p_days: days, p_limit: limit },
    'Failed to load popular location stats',
  );
}

export async function getUserRetentionCohorts(monthsBack = 6): Promise<RetentionCohortStat[]> {
  return runJsonRpc<RetentionCohortStat[]>(
    'get_user_retention_cohorts',
    { p_months_back: monthsBack },
    'Failed to load user retention cohorts',
  );
}

export async function getRomiOverview(days = 30): Promise<RomiOverviewStat | null> {
  return runJsonRpc<RomiOverviewStat | null>(
    'get_romi_overview_stats',
    { p_days: days },
    'Failed to load ROMI overview stats',
  );
}

export async function getRomiToolHealth(days = 30): Promise<RomiToolHealthStat[]> {
  return runJsonRpc<RomiToolHealthStat[]>(
    'get_romi_tool_health',
    { p_days: days },
    'Failed to load ROMI tool health',
  );
}

export async function getRomiRecentErrors(days = 30, limit = 10): Promise<RomiErrorStat[]> {
  return runJsonRpc<RomiErrorStat[]>(
    'get_romi_recent_errors',
    { p_days: days, p_limit: limit },
    'Failed to load ROMI recent errors',
  );
}
