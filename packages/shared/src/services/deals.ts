/**
 * Deals API Service (Shared)
 * CRUD operations for deals and promotions
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type DealStatus = 'active' | 'expired' | 'cancelled';

export interface Deal {
    id: string;
    partner_id: string;
    title: string;
    description: string | null;
    discount_percent: number;
    discount_amount: number | null;
    code: string | null;
    start_date: string;
    end_date: string;
    status: DealStatus;
    min_booking_amount: number | null;
    max_discount: number | null;
    created_at: string;
    partner?: {
        id: string;
        name: string;
        logo_url: string | null;
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Get all active deals
 */
export async function getActiveDeals(supabase: SupabaseClient): Promise<Deal[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('deals')
        .select(`
            *,
            partner:partners(id, name, logo_url)
        `)
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .order('end_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Deal[];
}

/**
 * Get deal by ID
 */
export async function getDealById(
    supabase: SupabaseClient,
    id: string
): Promise<Deal | null> {
    const { data, error } = await supabase
        .from('deals')
        .select(`
            *,
            partner:partners(id, name, logo_url)
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as Deal;
}

/**
 * Validate deal code
 */
export async function validateDealCode(
    supabase: SupabaseClient,
    code: string,
    bookingAmount?: number
): Promise<Deal | null> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

    if (error || !data) return null;

    // Check minimum booking amount
    if (bookingAmount && data.min_booking_amount && bookingAmount < data.min_booking_amount) {
        return null;
    }

    return data as Deal;
}

/**
 * Get deals by partner
 */
export async function getPartnerDeals(
    supabase: SupabaseClient,
    partnerId: string
): Promise<Deal[]> {
    const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Deal[];
}

/**
 * Apply deal to booking
 */
export async function applyDeal(
    supabase: SupabaseClient,
    dealId: string,
    bookingId: string
): Promise<void> {
    const { error } = await supabase
        .from('booking_deals')
        .insert({
            deal_id: dealId,
            booking_id: bookingId,
        });

    if (error) throw error;
}
