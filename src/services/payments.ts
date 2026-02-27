/**
 * Payments API Service
 * RoomZ+ subscription management
 */

import { supabase } from '@/lib/supabase';

export type SubscriptionPlan = 'free' | 'roomz_plus';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  promoApplied: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
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
 * Create a checkout session for subscription
 * Note: This would normally call a backend API that creates a Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  plan: SubscriptionPlan,
  successUrl: string,
  cancelUrl: string
): Promise<{ checkoutUrl: string }> {
  // In production, this would call your backend API
  // For now, we'll simulate the flow

  // Store pending subscription intent
  const { error } = await (supabase as any)
    .from('subscription_intents')
    .insert({
      user_id: userId,
      plan,
      status: 'pending',
      created_at: new Date().toISOString(),
    } as never);

  if (error && error.code !== '42P01') {
    throw error;
  }

  // In production, this would return the actual Stripe checkout URL
  // For demo purposes, we'll simulate a successful subscription
  console.log('Checkout session created for plan:', plan, 'user:', userId);

  // Simulate checkout - in production, redirect to Stripe
  return {
    checkoutUrl: `${successUrl}?session_id=demo_${Date.now()}`,
  };
}

/**
 * Handle successful checkout (called from success page)
 */
export async function handleCheckoutSuccess(
  userId: string,
  sessionId: string
): Promise<Subscription> {
  // In production, verify the session with Stripe and create subscription
  // For demo, we'll create a mock subscription

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const subscriptionData = {
    user_id: userId,
    plan: 'roomz_plus',
    status: 'active',
    stripe_session_id: sessionId,
    current_period_start: now.toISOString(),
    current_period_end: nextMonth.toISOString(),
    cancel_at_period_end: false,
    created_at: now.toISOString(),
  };

  // Try to insert subscription
  const { data, error } = await (supabase as any)
    .from('subscriptions')
    .insert(subscriptionData as never)
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist, return mock subscription
      return {
        id: `sub_${Date.now()}`,
        userId,
        plan: 'roomz_plus',
        status: 'active',
        promoApplied: false,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: nextMonth.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }
    throw error;
  }

  // Update user's subscription status (using existing is_premium + premium_until columns)
  await supabase
    .from('users')
    .update({
      is_premium: true,
      premium_until: nextMonth.toISOString(),
      updated_at: now.toISOString(),
    } as never)
    .eq('id', userId);

  return {
    id: data.id,
    userId: data.user_id,
    plan: data.plan as SubscriptionPlan,
    status: data.status as SubscriptionStatus,
    promoApplied: data.promo_applied ?? false,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
