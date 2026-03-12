import { test, expect } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import { createSePayCheckoutSession, getAnonymousEntitlements, getEntitlementsForPlan } from './payments';
import { PREMIUM_PUBLIC_BENEFIT_LABELS } from '@roomz/shared/constants/premium-offer';
import { getRommZPlusPlan } from '@/config/payment.config';

type RpcResult = {
  data: {
    order_code?: string;
    amount?: number;
    expires_at?: string;
    promo_applied?: boolean;
  } | null;
  error: {
    code?: string;
    message?: string;
  } | null;
};

const mutableSupabase = supabase as typeof supabase & {
  rpc: typeof supabase.rpc;
};

test.describe('createSePayCheckoutSession', () => {
  const originalRpc = mutableSupabase.rpc;

  test.afterEach(() => {
    mutableSupabase.rpc = originalRpc;
  });

  test('returns normalized checkout data from the RPC response', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: {
          order_code: 'ROMMZ123',
          amount: 119000,
          expires_at: '2026-03-10T11:20:00.000Z',
          promo_applied: true,
        },
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    const result = await createSePayCheckoutSession('user-1', 'rommz_plus', 'quarterly', true);

    expect(result).toMatchObject({
      orderCode: 'ROMMZ123',
      amount: 119000,
      expiresAt: '2026-03-10T11:20:00.000Z',
      promoApplied: true,
    });
    expect(result.qrCodeUrl).toContain('des=ROMMZ123');
    expect(result.qrCodeUrl).toContain('amount=119000');
  });

  test('maps missing checkout RPC deployment to a clear error', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: null,
        error: {
          code: 'PGRST202',
          message: 'function not found',
        },
      }) as RpcResult) as typeof supabase.rpc;

    await expect(
      createSePayCheckoutSession('user-1', 'rommz_plus', 'monthly', false)
    ).rejects.toThrow('Checkout function is not deployed. Please run latest migrations.');
  });

  test('rejects malformed checkout responses', async () => {
    mutableSupabase.rpc = (async () =>
      ({
        data: {
          order_code: 'ROMMZ124',
          promo_applied: false,
        },
        error: null,
      }) as RpcResult) as typeof supabase.rpc;

    await expect(
      createSePayCheckoutSession('user-1', 'rommz_plus', 'monthly', false)
    ).rejects.toThrow('Invalid checkout response from server');
  });
});

test.describe('premium entitlements', () => {
  test('returns free limits for anonymous users', () => {
    expect(getAnonymousEntitlements()).toMatchObject({
      isPremium: false,
      viewLimit: 10,
      requestLimit: 5,
      favoriteLimit: 5,
      phoneViewLimit: 3,
      premiumUntil: null,
    });
  });

  test('maps RommZ+ plan to unlimited premium roommate access', () => {
    const entitlements = getEntitlementsForPlan('rommz_plus', '2026-04-09T08:21:45.189540Z');

    expect(entitlements.isPremium).toBe(true);
    expect(entitlements.viewLimit).toBe(Infinity);
    expect(entitlements.requestLimit).toBe(Infinity);
    expect(entitlements.favoriteLimit).toBe(Infinity);
    expect(entitlements.phoneViewLimit).toBe(100);
    expect(entitlements.premiumUntil).toBe('2026-04-09T08:21:45.189540Z');
  });

  test('keeps public pricing copy aligned with supported premium benefits', () => {
    expect(getRommZPlusPlan()?.features).toEqual(PREMIUM_PUBLIC_BENEFIT_LABELS);
  });
});
