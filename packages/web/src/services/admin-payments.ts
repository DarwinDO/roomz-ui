/**
 * Admin Payments Service
 * Payment orders and manual reviews management for admins
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@roomz/shared/services/database.types';

export interface PaymentOrder {
    id: string;
    user_id: string;
    order_code: string;
    plan: string;
    billing_cycle: string;
    amount: number;
    status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'manual_review';
    payment_provider: string;
    provider_transaction_id?: string;
    qr_data?: string;
    expires_at: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    user_email?: string;
    user_name?: string;
}

export interface ManualReview {
    id: string;
    user_id?: string;
    order_code?: string;
    transaction_id?: string;
    amount?: number;
    reason: string;
    raw_payload?: Record<string, unknown>;
    status: 'pending' | 'resolved_premium' | 'resolved_refund' | 'dismissed';
    resolved_by?: string;
    resolved_at?: string;
    notes?: string;
    created_at: string;
    // Joined fields
    user_email?: string;
    user_name?: string;
}

export interface RevenueStats {
    totalRevenue: number;
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    expiredOrders: number;
    manualReviewOrders: number;
}

type PaymentOrderRow = Tables<'payment_orders'> & {
    user?: {
        email: string | null;
        full_name: string | null;
    } | null;
};

type ManualReviewRow = Tables<'manual_reviews'> & {
    user?: {
        email: string | null;
        full_name: string | null;
    } | null;
};

function toRawPayload(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    return value as Record<string, unknown>;
}

function mapPaymentOrder(order: PaymentOrderRow): PaymentOrder {
    return {
        id: order.id,
        user_id: order.user_id,
        order_code: order.order_code,
        plan: order.plan,
        billing_cycle: order.billing_cycle,
        amount: order.amount,
        status: (order.status ?? 'pending') as PaymentOrder['status'],
        payment_provider: order.payment_provider,
        provider_transaction_id: order.provider_transaction_id ?? undefined,
        qr_data: order.qr_data ?? undefined,
        expires_at: order.expires_at,
        paid_at: order.paid_at ?? undefined,
        created_at: order.created_at ?? order.updated_at ?? order.expires_at,
        updated_at: order.updated_at ?? order.created_at ?? order.expires_at,
        user_email: order.user?.email ?? undefined,
        user_name: order.user?.full_name ?? undefined,
    };
}

function mapManualReview(review: ManualReviewRow): ManualReview {
    return {
        id: review.id,
        user_id: review.user_id ?? undefined,
        order_code: review.order_code ?? undefined,
        transaction_id: review.transaction_id ?? undefined,
        amount: review.amount ?? undefined,
        reason: review.reason,
        raw_payload: toRawPayload(review.raw_payload),
        status: review.status as ManualReview['status'],
        resolved_by: review.resolved_by ?? undefined,
        resolved_at: review.resolved_at ?? undefined,
        notes: review.notes ?? undefined,
        created_at: review.created_at ?? review.resolved_at ?? new Date().toISOString(),
        user_email: review.user?.email ?? undefined,
        user_name: review.user?.full_name ?? undefined,
    };
}

/**
 * Fetch all payment orders (admin)
 */
export async function getPaymentOrders(filter?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<PaymentOrder[]> {
    let query = supabase
        .from('payment_orders')
        .select(`
      *,
      user:users(email, full_name)
    `)
        .order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
    }

    if (filter?.limit) {
        query = query.limit(filter.limit);
    }

    if (filter?.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return ((data || []) as PaymentOrderRow[]).map(mapPaymentOrder);
}

/**
 * Fetch manual reviews
 */
export async function getManualReviews(filter?: {
    status?: string;
}): Promise<ManualReview[]> {
    let query = supabase
        .from('manual_reviews')
        .select(`
      *,
      user:users(email, full_name)
    `)
        .order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return ((data || []) as ManualReviewRow[]).map(mapManualReview);
}

/**
 * Resolve manual review
 */
export async function resolveManualReview(
    reviewId: string,
    resolution: 'resolved_premium' | 'resolved_refund' | 'dismissed',
    adminUserId: string
): Promise<void> {
    // Use RPC to bypass RLS (SECURITY DEFINER)
    const { error } = await supabase.rpc('resolve_payment_review', {
        p_review_id: reviewId,
        p_resolution: resolution,
        p_admin_user_id: adminUserId,
    });

    if (error) throw error;
}

/**
 * Get revenue stats
 */
export async function getRevenueStats(): Promise<RevenueStats> {
    // Get paid orders total
    const { data: paidOrders } = await supabase
        .from('payment_orders')
        .select('amount')
        .eq('status', 'paid');

    const totalRevenue = ((paidOrders || []) as Pick<Tables<'payment_orders'>, 'amount'>[])
        .reduce((sum, order) => sum + (order.amount || 0), 0);

    // Get counts by status
    const { data: allOrders } = await supabase
        .from('payment_orders')
        .select('status');

    const ordersByStatus = ((allOrders || []) as Pick<Tables<'payment_orders'>, 'status'>[])
        .reduce((acc, order) => {
        if (!order.status) {
            return acc;
        }
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalRevenue,
        totalOrders: allOrders?.length || 0,
        paidOrders: ordersByStatus.paid || 0,
        pendingOrders: ordersByStatus.pending || 0,
        expiredOrders: ordersByStatus.expired || 0,
        manualReviewOrders: ordersByStatus.manual_review || 0,
    };
}
