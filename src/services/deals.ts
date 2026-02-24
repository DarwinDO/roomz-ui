/**
 * Deals API Service
 * Interact with 'deals' and 'user_saved_vouchers' tables
 */
import { supabase } from '@/lib/supabase';
import type { Partner } from './partners';

// ============================================
// Types
// ============================================

export interface Deal {
    id: string;
    partner_id: string;
    title: string;
    discount_value: string | null;
    description: string | null;
    valid_until: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Joined fields
    partner?: Partner;
}

export interface SavedVoucher {
    user_id: string;
    deal_id: string;
    qr_data: string;
    created_at: string;
    // Joined fields
    deal?: DealWithPartner;
}

export interface DealWithPartner extends Deal {
    partner: Partner;
}

export interface DealFilters {
    partnerId?: string;
    category?: string;
    isActive?: boolean;
}

// ============================================
// Deal Functions
// ============================================

/**
 * Get deals with optional filters
 * Joins partner data for display
 */
export async function getDeals(filters: DealFilters = {}): Promise<DealWithPartner[]> {
    let query = supabase
        .from('deals')
        .select(`
      *,
      partner:partners(*)
    `);

    // Filter by active status (default to true)
    if (filters.isActive === undefined) {
        query = query.eq('is_active', true);
    } else if (filters.isActive !== null) {
        query = query.eq('is_active', filters.isActive);
    }

    // Filter by partner
    if (filters.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
    }

    // Filter by category via partner
    if (filters.category && filters.category !== 'all') {
        query = query.eq('partners.category', filters.category);
    }

    // Order by created_at desc (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching deals:', error);
        throw error;
    }

    // Transform to flatten partner data
    return (data || []).map((item) => ({
        ...item,
        partner: item.partner,
    })) as DealWithPartner[];
}

/**
 * Get single deal by ID with partner info
 */
export async function getDealById(id: string): Promise<DealWithPartner | null> {
    const { data, error } = await supabase
        .from('deals')
        .select(`
      *,
      partner:partners(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching deal:', error);
        return null;
    }

    return data as DealWithPartner;
}

// ============================================
// User Voucher Functions
// ============================================

/**
 * Get current user's saved vouchers with deal and partner info
 */
export async function getMyVouchers(): Promise<SavedVoucher[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_saved_vouchers')
        .select(`
      *,
      deal:deals(
        *,
        partner:partners(*)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching vouchers:', error);
        throw error;
    }

    return (data || []).map((item) => ({
        ...item,
        deal: item.deal,
    })) as SavedVoucher[];
}

/**
 * Save a voucher (claim a deal)
 * Generates QR data for the voucher
 */
export async function saveVoucher(dealId: string): Promise<SavedVoucher> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Generate QR data payload (browser-safe, no Buffer)
    const randomPart = Math.random().toString(36).substring(2, 10);
    const qrData = JSON.stringify({
        type: 'roomz_deal',
        deal_id: dealId,
        user_id: user.id,
        timestamp: Date.now(),
        signature: btoa(`${dealId}_${user.id}_${Date.now()}_${randomPart}`).slice(0, 16),
    });

    const { data, error } = await supabase
        .from('user_saved_vouchers')
        .upsert(
            {
                user_id: user.id,
                deal_id: dealId,
                qr_data: qrData,
            },
            {
                onConflict: 'user_id,deal_id',
            }
        )
        .select(`
      *,
      deal:deals(
        *,
        partner:partners(*)
      )
    `)
        .single();

    if (error) {
        console.error('Error saving voucher:', error);
        throw error;
    }

    return data as SavedVoucher;
}

/**
 * Delete a saved voucher
 */
export async function deleteVoucher(dealId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('user_saved_vouchers')
        .delete()
        .eq('user_id', user.id)
        .eq('deal_id', dealId);

    if (error) {
        console.error('Error deleting voucher:', error);
        throw error;
    }
}

/**
 * Check if user has saved a specific deal
 */
export async function hasSavedVoucher(dealId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from('user_saved_vouchers')
        .select('deal_id')
        .eq('user_id', user.id)
        .eq('deal_id', dealId)
        .single();

    if (error) {
        return false;
    }

    return !!data;
}
