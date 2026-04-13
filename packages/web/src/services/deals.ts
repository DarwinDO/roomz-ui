/**
 * Deals API Service
 * Interact with 'deals' and 'user_saved_vouchers' tables
 */
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/lib/database.types';
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
    is_premium_only: boolean;
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
/** Derives a stable, human-readable voucher code from deal + user IDs. */
function generateVoucherCode(dealId: string, userId: string): string {
    const dealPart = dealId.replace(/-/g, '').slice(0, 4).toUpperCase();
    const userPart = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
    return `RMZ-${dealPart}${userPart}`;
}

/**
 * Parses the voucher code from a stored qr_data string.
 * Falls back gracefully for vouchers created before this format.
 */
export function parseVoucherCode(qrData: string): string {
    try {
        const parsed = JSON.parse(qrData) as { code?: string; deal_id?: string; user_id?: string };
        if (parsed.code) return parsed.code;
        // Legacy vouchers: derive from embedded IDs if available
        if (parsed.deal_id && parsed.user_id) {
            return generateVoucherCode(parsed.deal_id, parsed.user_id);
        }
    } catch {
        // not parseable
    }
    return 'RMZ-VOUCHER';
}

export async function saveVoucher(dealId: string): Promise<SavedVoucher> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const code = generateVoucherCode(dealId, user.id);
    const qrData = JSON.stringify({
        type: 'roomz_deal',
        code,
        deal_id: dealId,
        user_id: user.id,
        issued_at: Date.now(),
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

// ============================================
// Deal Admin Functions
// ============================================

export interface CreateDealInput {
    partner_id: string;
    title: string;
    discount_value?: string;
    description?: string;
    valid_until?: string;
    is_premium_only?: boolean;
}

/**
 * Create a new deal
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
    const { data, error } = await supabase
        .from('deals')
        .insert({
            partner_id: input.partner_id,
            title: input.title,
            discount_value: input.discount_value || null,
            description: input.description || null,
            valid_until: input.valid_until || null,
            is_active: true,
            is_premium_only: input.is_premium_only || false,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating deal:', error);
        throw error;
    }

    if (!data) {
        throw new Error('Failed to create deal');
    }

    return data as Deal;
}

/**
 * Update an existing deal
 */
export async function updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
    const updateData: TablesUpdate<'deals'> = {
        updated_at: new Date().toISOString(),
    };

    if (data.partner_id !== undefined) updateData.partner_id = data.partner_id;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.valid_until !== undefined) updateData.valid_until = data.valid_until;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.is_premium_only !== undefined) updateData.is_premium_only = data.is_premium_only;

    const { data: updated, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating deal:', error);
        throw error;
    }

    if (!updated) {
        throw new Error('Failed to update deal');
    }

    return updated as Deal;
}

/**
 * Delete a deal
 */
export async function deleteDeal(id: string): Promise<void> {
    const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting deal:', error);
        throw error;
    }
}

/**
 * Toggle deal active status
 */
export async function toggleDealActive(id: string): Promise<Deal> {
    // Get current status
    const { data: deal, error: fetchError } = await supabase
        .from('deals')
        .select('is_active')
        .eq('id', id)
        .single();

    if (fetchError || !deal) {
        console.error('Error fetching deal:', fetchError);
        throw fetchError || new Error('Deal not found');
    }

    const newStatus = !deal.is_active;

    const { data: updated, error } = await supabase
        .from('deals')
        .update({
            is_active: newStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error toggling deal status:', error);
        throw error;
    }

    if (!updated) {
        throw new Error('Failed to toggle deal status');
    }

    return updated as Deal;
}
