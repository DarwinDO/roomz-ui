/**
 * Payments API Service
 * Stripe integration for RoomZ+ subscription
 */

import { supabase } from '@/lib/supabase';

export type SubscriptionPlan = 'free' | 'roomz_plus' | 'roomz_pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number; // VND per month
  priceDisplay: string;
  features: string[];
  recommended?: boolean;
}

// Subscription plans
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
    ],
  },
  {
    id: 'roomz_plus',
    name: 'RoomZ+',
    price: 99000,
    priceDisplay: '99.000đ/tháng',
    recommended: true,
    features: [
      'Tất cả tính năng miễn phí',
      'Lưu không giới hạn phòng yêu thích',
      'Xem số điện thoại chủ nhà',
      'Badge Verified+ miễn phí',
      'Ưu tiên hiển thị hồ sơ',
      'Thống kê xem hồ sơ',
      'Hỗ trợ ưu tiên 24/7',
    ],
  },
  {
    id: 'roomz_pro',
    name: 'RoomZ Pro',
    price: 199000,
    priceDisplay: '199.000đ/tháng',
    features: [
      'Tất cả tính năng RoomZ+',
      'Đăng tin phòng không giới hạn',
      'Quảng cáo tin đăng',
      'Phân tích dữ liệu chi tiết',
      'API access',
      'Account manager riêng',
    ],
  },
];

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
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: data.created_at,
  };
}

/**
 * Check if user has premium access
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription?.plan === 'roomz_plus' || subscription?.plan === 'roomz_pro';
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
  const { error } = await supabase
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
  const { data, error } = await supabase
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
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: nextMonth.toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: now.toISOString(),
      };
    }
    throw error;
  }

  // Update user's subscription status
  await supabase
    .from('users')
    .update({
      subscription_plan: 'roomz_plus',
      updated_at: now.toISOString(),
    } as never)
    .eq('id', userId);

  return {
    id: data.id,
    userId: data.user_id,
    plan: data.plan as SubscriptionPlan,
    status: data.status as SubscriptionStatus,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    createdAt: data.created_at,
  };
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
  const { error } = await supabase
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
