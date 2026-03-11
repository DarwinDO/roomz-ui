import { expect, test } from "@playwright/test";
import { supabase } from "@/lib/supabase";
import {
  getFeatureUsageStats,
  getPopularLocationStats,
  getUserRetentionCohorts,
} from "./analytics";

type RpcResult = {
  data: unknown;
  error: { message?: string } | null;
};

const mutableSupabase = supabase as typeof supabase & {
  rpc: typeof supabase.rpc;
};

test.describe("analytics service", () => {
  const originalRpc = mutableSupabase.rpc;

  test.afterEach(() => {
    mutableSupabase.rpc = originalRpc;
  });

  test("getFeatureUsageStats returns feature usage rows from RPC", async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: [
          {
            event_name: "search_performed",
            feature_label: "Search",
            feature_group: "discovery",
            total_events: 42,
            unique_users: 10,
            unique_sessions: 20,
            last_7d_events: 18,
            previous_7d_events: 12,
            change_pct: 50,
            last_event_at: "2026-03-11T05:00:00.000Z",
          },
        ],
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await getFeatureUsageStats(30);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      event_name: "search_performed",
      total_events: 42,
      unique_users: 10,
      feature_group: "discovery",
    });
  });

  test("getFeatureUsageStats throws when RPC fails", async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: null,
        error: { message: "rpc failed" },
      }) as RpcResult) as typeof supabase.rpc;

    await expect(getFeatureUsageStats(7)).rejects.toThrow("rpc failed");
  });

  test("getPopularLocationStats returns grouped location analytics", async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: {
          searched: [
            {
              location_label: "Đại học Bách khoa Hà Nội",
              city: "Thành phố Hà Nội",
              district: "Quận Hai Bà Trưng",
              source: "catalog",
              search_events: 21,
              unique_users: 9,
              unique_sessions: 12,
              change_pct: 25,
            },
          ],
          viewed: [],
          converting: [],
        },
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await getPopularLocationStats(30, 8);

    expect(result.searched).toHaveLength(1);
    expect(result.searched[0]).toMatchObject({
      location_label: "Đại học Bách khoa Hà Nội",
      source: "catalog",
      search_events: 21,
    });
  });

  test("getUserRetentionCohorts returns cohort rows from RPC", async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: [
          {
            cohort_month: "2026-03",
            cohort_label: "03/2026",
            cohort_size: 50,
            week_1_users: 20,
            week_2_users: 12,
            week_4_users: 7,
            week_1_retention: 40,
            week_2_retention: 24,
            week_4_retention: 14,
          },
        ],
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await getUserRetentionCohorts(6);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      cohort_label: "03/2026",
      week_1_retention: 40,
      week_4_retention: 14,
    });
  });
});
