/**
 * Payments API Service
 * RoomZ+ subscription management with SePay integration
 */

import { supabase } from '@/lib/supabase';
import { generateOrderCode, getOrderExpiration, generateQRUrl } from './sepay';
import {
  PLANS,
  PROMO,
  ORDER,
  PRICING,
  getPlanById,
  getRoomZPlusPlan,
  getCurrentPrice,
  type SubscriptionPlan,
  type BillingCycle,
  type PlanDetails,
} from '@/config/payment.config';
import type { Tables } from '@/lib/database.types';

export type { SubscriptionPlan, BillingCycle, PlanDetails };

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

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

// Re-export config functions and values for backward compatibility
export { PLANS, getPlanById, getRoomZPlusPlan, getCurrentPrice, PRICING, PROMO, ORDER };

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
  const subscription = await getUserSubscription(userId);
  return subscription?.plan === 'roomz_plus';
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
}

/**
 * Create SePay checkout session (QR-based payment)
 */
export async function createSePayCheckoutSession(
  userId: string,
  plan: SubscriptionPlan,
  billingCycle: BillingCycle = 'monthly',
  isPromo: boolean = false
): Promise<SePayCheckoutResult> {
  if (plan === 'free') {
    throw new Error('Cannot create checkout for free plan');
  }

  const roomzPlusPlan = getRoomZPlusPlan();
  if (!roomzPlusPlan) {
    throw new Error('Plan not found');
  }

  // Calculate amount using config
  let amount = PRICING.getPrice(billingCycle);
  if (isPromo) {
    amount = PRICING.getPromoPrice(amount);
  }

  // Generate order code and expiration using config
  const orderCode = generateOrderCode();
  const expiresAt = getOrderExpiration(ORDER.EXPIRATION_MINUTES);
  const qrCodeUrl = generateQRUrl(orderCode, amount);

  // Save order to database
  await supabase
    .from('payment_orders')
    .insert({
      user_id: userId,
      order_code: orderCode,
      plan,
      billing_cycle: billingCycle,
      amount,
      status: ORDER.STATUS.PENDING,
      payment_provider: 'sepay',
      qr_data: qrCodeUrl,
      expires_at: expiresAt.toISOString(),
    });

  if (import.meta.env.DEV) {
    console.log('[Payment] Created order:', { orderCode, amount, billingCycle, isPromo });
  }

  return {
    orderCode,
    qrCodeUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Subscribe to payment status changes via realtime
 */
export function subscribeToPaymentStatus(
  orderCode: string,
  onPaid: () => void
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
      (payload: any) => {
        if (payload.new?.status === ORDER.STATUS.PAID) {
          if (import.meta.env.DEV) {
            console.log('[Payment] Payment received for order:', orderCode);
          }
          onPaid();
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// Note: getCurrentPrice is now imported from config/payment.config
