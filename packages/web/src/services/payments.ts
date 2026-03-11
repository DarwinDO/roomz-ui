/**
 * Payments API Service
 * RommZ+ subscription management with SePay integration
 */

import { supabase } from '@/lib/supabase';
import { generateQRUrl } from './sepay';
import {
  PLANS,
  PROMO,
  ORDER,
  PRICING,
  getPlanById,
  getRommZPlusPlan,
  getCurrentPrice,
  type SubscriptionPlan,
  type BillingCycle,
  type PlanDetails,
} from '@/config/payment.config';
import { FREE_LIMITS, PREMIUM_LIMITS } from '@roomz/shared/constants/premium';

export type { SubscriptionPlan, BillingCycle, PlanDetails };

type RuntimeEnv = { DEV?: boolean } & Record<string, string | undefined>;

const env = (import.meta as ImportMeta & {
  env?: RuntimeEnv;
}).env ?? {};
const isDev = env.DEV === true;

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';
export type PaymentOrderStatus = 'pending' | 'paid' | 'expired' | 'manual_review' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  promoApplied: boolean;
  paymentProviderCustomerId?: string | null;
  paymentProviderTransactionId?: string | null;
  paymentProvider?: string | null;
  amountPaid?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PromoStatus {
  totalSlots: number | null;
  claimedSlots: number | null;
}

export interface UserEntitlements {
  isPremium: boolean;
  viewLimit: number;
  requestLimit: number;
  favoriteLimit: number;
  phoneViewLimit: number;
  premiumUntil: string | null;
}

// Re-export config functions and values for backward compatibility
export { PLANS, getPlanById, getRommZPlusPlan, getCurrentPrice, PRICING, PROMO, ORDER };

export function getAnonymousEntitlements(): UserEntitlements {
  return {
    isPremium: false,
    viewLimit: FREE_LIMITS.ROOMMATE_VIEWS_PER_DAY,
    requestLimit: FREE_LIMITS.ROOMMATE_REQUESTS_PER_DAY,
    favoriteLimit: FREE_LIMITS.FAVORITES_MAX,
    phoneViewLimit: FREE_LIMITS.PHONE_VIEWS_PER_DAY,
    premiumUntil: null,
  };
}

export function getEntitlementsForPlan(
  plan: SubscriptionPlan | null | undefined,
  premiumUntil: string | null = null
): UserEntitlements {
  if (plan === 'rommz_plus') {
    return {
      isPremium: true,
      viewLimit: PREMIUM_LIMITS.ROOMMATE_VIEWS_PER_DAY,
      requestLimit: PREMIUM_LIMITS.ROOMMATE_REQUESTS_PER_DAY,
      favoriteLimit: PREMIUM_LIMITS.FAVORITES_MAX,
      phoneViewLimit: PREMIUM_LIMITS.PHONE_VIEWS_PER_DAY,
      premiumUntil,
    };
  }

  return getAnonymousEntitlements();
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist yet
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    plan: data.plan as SubscriptionPlan,
    status: data.status as SubscriptionStatus,
    promoApplied: data.promo_applied ?? false,
    paymentProviderCustomerId: data.payment_provider_customer_id,
    paymentProviderTransactionId: data.payment_provider_transaction_id,
    paymentProvider: data.payment_provider,
    amountPaid: data.amount_paid,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    paymentMethod: data.payment_method,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId);
  return entitlements.isPremium;
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const subscription = await getUserSubscription(userId);
  return getEntitlementsForPlan(subscription?.plan, subscription?.currentPeriodEnd ?? null);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error && error.code !== '42P01') {
    throw error;
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  if (error && error.code !== '42P01') {
    throw error;
  }
}

/**
 * Get promo status - returns available slots for Early Bird promotion
 */
export async function getPromoStatus(): Promise<PromoStatus> {
  const { data, error } = await supabase
    .from('promo_status')
    .select('*')
    .single();

  if (error || !data) {
    // Return default values from config if view doesn't exist
    return { totalSlots: PROMO.TOTAL_SLOTS, claimedSlots: PROMO.DEFAULT_CLAIMED_SLOTS };
  }

  return {
    totalSlots: data.total_slots,
    claimedSlots: data.claimed_slots,
  };
}

// ============================================
// Payment Adapter Interface
// ============================================

export interface PaymentAdapter {
  createCheckoutSession(params: {
    planId: string;
    userId: string;
    isPromo?: boolean;
  }): Promise<{ url: string; sessionId: string }>;
  verifyPayment(sessionId: string): Promise<{ success: boolean; subscriptionId?: string }>;
}

// ============================================
// SePay Integration Functions
// ============================================

export interface SePayCheckoutResult {
  orderCode: string;
  qrCodeUrl: string;
  expiresAt: string;
  amount: number;
  promoApplied: boolean;
}

/**
 * Create SePay checkout session (QR-based payment)
 */
export async function createSePayCheckoutSession(
  _userId: string,
  plan: SubscriptionPlan,
  billingCycle: BillingCycle = 'monthly',
  requestPromo: boolean = false
): Promise<SePayCheckoutResult> {
  if (plan === 'free') {
    throw new Error('Cannot create checkout for free plan');
  }

  const { data, error } = await supabase.rpc('create_checkout_order' as never, {
    p_plan: plan,
    p_billing_cycle: billingCycle,
    p_request_promo: requestPromo,
  } as never);

  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('Checkout function is not deployed. Please run latest migrations.');
    }
    throw error;
  }

  const order = data as {
    order_code?: string;
    amount?: number;
    expires_at?: string;
    promo_applied?: boolean;
  } | null;

  if (!order?.order_code || typeof order.amount !== 'number' || !order.expires_at) {
    throw new Error('Invalid checkout response from server');
  }

  const amount = order.amount;
  const orderCode = order.order_code;
  const expiresAt = order.expires_at;
  const qrCodeUrl = generateQRUrl(orderCode, amount);

  if (isDev) {
    console.log('[Payment] Created order:', {
      orderCode,
      amount,
      billingCycle,
      promoApplied: !!order.promo_applied,
    });
  }

  return {
    orderCode,
    qrCodeUrl,
    expiresAt,
    amount,
    promoApplied: !!order.promo_applied,
  };
}

/**
 * Subscribe to payment status changes via realtime
 */
export function subscribeToPaymentStatus(
  orderCode: string,
  onStatusChange: (status: PaymentOrderStatus) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`payment_${orderCode}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'payment_orders',
        filter: `order_code=eq.${orderCode}`,
      },
      (payload: { new?: { status?: string } }) => {
        const status = payload.new?.status as PaymentOrderStatus | undefined;
        if (!status) return;
        if (isDev) {
          console.log('[Payment] Status update for order:', orderCode, status);
        }
        onStatusChange(status);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Fetch current payment order status (fallback when realtime event is missed)
 */
export async function getPaymentOrderStatus(orderCode: string): Promise<PaymentOrderStatus | null> {
  const { data, error } = await supabase
    .from('payment_orders')
    .select('status')
    .eq('order_code', orderCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.status) return null;
  return data.status as PaymentOrderStatus;
}

// Note: getCurrentPrice is now imported from config/payment.config
