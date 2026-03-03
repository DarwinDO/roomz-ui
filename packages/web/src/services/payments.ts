/**
 * Payments API Service
 * RoomZ+ subscription management with SePay integration
 */

import { supabase } from '@/lib/supabase';
import { generateOrderCode, getOrderExpiration, generateQRUrl } from './sepay';

export type SubscriptionPlan = 'free' | 'roomz_plus';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';
export type BillingCycle = 'monthly' | 'quarterly';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  promoApplied: boolean;
  paymentProviderCustomerId?: string;
  paymentProviderTransactionId?: string;
  paymentProvider?: string;
  amountPaid?: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number;
  quarterlyPrice?: number;
  priceDisplay: string;
  features: string[];
  recommended?: boolean;
}

export interface PromoStatus {
  totalSlots: number;
  claimedSlots: number;
}

// Subscription plans - 2-tier: Free + RoomZ+
export const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: 0,
    priceDisplay: '0đ',
    features: [
      'Tìm kiếm phòng không giới hạn',
      'Lưu tối đa 5 phòng yêu thích',
      'Nhắn tin cơ bản',
      'Đặt lịch xem phòng',
      'Xem số điện thoại chủ nhà (3 lần/ngày)',
    ],
  },
  {
    id: 'roomz_plus',
    name: 'RoomZ+',
    price: 49000,
    quarterlyPrice: 119000,
    priceDisplay: '49.000đ/tháng',
    recommended: true,
    features: [
      '♾️ Xem SĐT không giới hạn',
      '♾️ Lưu phòng yêu thích không giới hạn',
      '♾️ Roommate views & requests không giới hạn',
      '👑 Badge premium trên profile',
      '🎁 Deal độc quyền Local Passport',
      '⚡ Ưu tiên hiển thị',
      '🛡️ Duyệt xác thực nhanh',
      '📞 Hỗ trợ ưu tiên 24/7',
    ],
  },
];

// Get plan by ID
export function getPlanById(planId: SubscriptionPlan): PlanDetails | undefined {
  return PLANS.find(p => p.id === planId);
}

// Get RoomZ+ plan
export function getRoomZPlusPlan(): PlanDetails | undefined {
  return PLANS.find(p => p.id === 'roomz_plus');
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await (supabase as any)
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
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', subscriptionId);

  if (error && error.code !== '42P01') {
    throw error;
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', subscriptionId);

  if (error && error.code !== '42P01') {
    throw error;
  }
}

/**
 * Get promo status - returns available slots for Early Bird promotion
 */
export async function getPromoStatus(): Promise<PromoStatus> {
  const { data, error } = await (supabase as any)
    .from('promo_status')
    .select('*')
    .single();

  if (error || !data) {
    // Return default values if view doesn't exist
    return { totalSlots: 500, claimedSlots: 0 };
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

  // Calculate amount
  let amount = billingCycle === 'monthly' ? roomzPlusPlan.price : (roomzPlusPlan.quarterlyPrice || 119000);
  if (isPromo) {
    amount = Math.round(amount / 2); // Early bird 50% off
  }

  // Generate order code and expiration
  const orderCode = generateOrderCode();
  const expiresAt = getOrderExpiration(20); // 20 minutes (15 display + 5 grace)
  const qrCodeUrl = generateQRUrl(orderCode, amount);

  // Save order to database
  await (supabase as any)
    .from('payment_orders')
    .insert({
      user_id: userId,
      order_code: orderCode,
      plan,
      billing_cycle: billingCycle,
      amount,
      status: 'pending',
      payment_provider: 'sepay',
      qr_data: qrCodeUrl,
      expires_at: expiresAt.toISOString(),
    } as never);

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
        if (payload.new?.status === 'paid') {
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

/**
 * Get current price based on billing cycle and promo
 */
export function getCurrentPrice(
  billingCycle: BillingCycle = 'monthly',
  isPromo: boolean = false
): number {
  const plan = getRoomZPlusPlan();
  if (!plan) return 0;

  let price = billingCycle === 'monthly' ? plan.price : (plan.quarterlyPrice || 119000);
  if (isPromo) {
    price = Math.round(price / 2);
  }
  return price;
}
