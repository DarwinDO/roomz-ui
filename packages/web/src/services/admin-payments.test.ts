import { describe, expect, test } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getRevenueStats, setPaymentOrderRevenueExclusion } from './admin-payments';

type SelectResult = {
  data: Array<{
    status: string | null;
    amount: number | null;
    exclude_from_revenue: boolean | null;
  }> | null;
  error: {
    message?: string;
  } | null;
};

type RpcResult = {
  data: unknown;
  error: {
    message?: string;
  } | null;
};

const mutableSupabase = supabase as typeof supabase & {
  from: typeof supabase.from;
  rpc: typeof supabase.rpc;
};

describe('admin payment revenue controls', () => {
  const originalFrom = mutableSupabase.from;
  const originalRpc = mutableSupabase.rpc;

  test.afterEach(() => {
    mutableSupabase.from = originalFrom;
    mutableSupabase.rpc = originalRpc;
  });

  test('getRevenueStats excludes flagged paid orders from total revenue while preserving paid counts', async () => {
    mutableSupabase.from = ((table: string) => {
      expect(table).toBe('payment_orders');

      return {
        select: async (columns: string) => {
          expect(columns).toBe('status, amount, exclude_from_revenue');

          return {
            data: [
              { status: 'paid', amount: 19500, exclude_from_revenue: false },
              { status: 'paid', amount: 19500, exclude_from_revenue: true },
              { status: 'pending', amount: 19500, exclude_from_revenue: false },
              { status: 'manual_review', amount: 39000, exclude_from_revenue: false },
              { status: 'expired', amount: 19500, exclude_from_revenue: false },
            ],
            error: null,
          } as SelectResult;
        },
      } as never;
    }) as typeof supabase.from;

    const stats = await getRevenueStats();

    expect(stats).toMatchObject({
      totalRevenue: 19500,
      totalOrders: 5,
      paidOrders: 2,
      pendingOrders: 1,
      expiredOrders: 1,
      manualReviewOrders: 1,
      excludedRevenue: 19500,
      excludedPaidOrders: 1,
    });
  });

  test('setPaymentOrderRevenueExclusion calls the admin RPC with the expected payload', async () => {
    mutableSupabase.rpc = (async (fn, args) => {
      expect(fn).toBe('set_payment_order_revenue_exclusion');
      expect(args).toEqual({
        p_order_id: 'order-1',
        p_exclude: true,
      });

      return {
        data: null,
        error: null,
      } as RpcResult;
    }) as typeof supabase.rpc;

    await expect(setPaymentOrderRevenueExclusion('order-1', true)).resolves.toBeUndefined();
  });
});
