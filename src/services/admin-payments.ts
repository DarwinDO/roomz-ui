/**
 * Admin Payments Service
 * Payment orders and manual reviews management for admins
 */

import { supabase } from '@/lib/supabase';

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

/**
 * Fetch all payment orders (admin)
 */
export async function getPaymentOrders(filter?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<PaymentOrder[]> {
    let query = (supabase as any)
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

    return (data || []).map((order: any) => ({
        ...order,
        user_email: order.user?.email,
        user_name: order.user?.full_name,
    }));
}

/**
 * Fetch manual reviews
 */
export async function getManualReviews(filter?: {
    status?: string;
}): Promise<ManualReview[]> {
    let query = (supabase as any)
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

    return (data || []).map((review: any) => ({
        ...review,
        user_email: review.user?.email,
        user_name: review.user?.full_name,
    }));
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
    const { error } = await (supabase as any).rpc('resolve_payment_review', {
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
    const { data: paidOrders } = await (supabase as any)
        .from('payment_orders')
        .select('amount')
        .eq('status', 'paid');

    const totalRevenue = (paidOrders || []).reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    // Get counts by status
    const { data: allOrders } = await (supabase as any)
        .from('payment_orders')
        .select('status');

    const ordersByStatus = (allOrders || []).reduce((acc: Record<string, number>, o: any) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
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
