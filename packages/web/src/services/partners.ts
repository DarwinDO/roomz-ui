/**
 * Partners API Service
 * Interact with 'partners' table
 */
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type Partner = Tables<'partners'>;
export type PartnerStatusFilter = 'active' | 'inactive' | 'all';

export interface PartnerFilters {
    search?: string;
    category?: string;
    sortBy?: 'rating' | 'reviews' | 'name';
    status?: PartnerStatusFilter;
}

/**
 * Get all partners with optional filters
 */
export async function getPartners(filters: PartnerFilters = {}): Promise<Partner[]> {
    let query = supabase
        .from('partners')
        .select('*');

    // Status filter - default to active only for public, admin can override
    if (filters.status === undefined) {
        query = query.eq('status', 'active');
    } else if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }
    // if status === 'all', don't filter by status

    // Search filter
    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%`);
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }

    // Sorting
    switch (filters.sortBy) {
        case 'rating':
            query = query.order('rating', { ascending: false });
            break;
        case 'reviews':
            query = query.order('review_count', { ascending: false });
            break;
        case 'name':
            query = query.order('name', { ascending: true });
            break;
        default:
            query = query.order('rating', { ascending: false }); // Default sort
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching partners:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get single partner details
 */
export async function getPartnerById(id: string): Promise<Partner | null> {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching partner:', error);
        return null;
    }

    return data;
}

/**
 * Increment partner view count
 */
export async function incrementPartnerView(id: string): Promise<void> {
    void id;
    // Using RPC is ideal, but for now simple update or ignore if high traffic
    // We'll trust the component to call this
    // Optimized: Create an RPC function for atomic increment later.
    // For now, client-side update is risky for concurrency but acceptible for view counts in MVP.
    // actually, let's just skip if no RPC exists, or try a simple update.
    /* 
    await supabase.rpc('increment_partner_view_count', { row_id: id });
    */
}

/**
 * Update partner information
 */
export async function updatePartner(id: string, data: Partial<Partner>): Promise<Partner> {
    const { data: updated, error } = await supabase
        .from('partners')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating partner:', error);
        throw error;
    }

    return updated;
}

/**
 * Toggle partner status (active <-> inactive)
 */
export async function togglePartnerStatus(id: string): Promise<Partner> {
    // First get current status
    const { data: partner, error: fetchError } = await supabase
        .from('partners')
        .select('status')
        .eq('id', id)
        .single();

    if (fetchError || !partner) {
        console.error('Error fetching partner:', fetchError);
        throw fetchError || new Error('Partner not found');
    }

    const newStatus = partner.status === 'active' ? 'inactive' : 'active';

    const { data: updated, error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error toggling partner status:', error);
        throw error;
    }

    return updated;
}

/**
 * Delete a partner (cascade deletes deals and vouchers)
 */
export async function deletePartner(id: string): Promise<void> {
    const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting partner:', error);
        throw error;
    }
}

/**
 * Create a new partner
 */
export async function createPartner(data: {
    name: string;
    category: string;
    specialization?: string;
    discount?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
}): Promise<Partner> {
    const { data: partner, error } = await supabase
        .from('partners')
        .insert({
            ...data,
            status: 'active',
        })
        .select()
        .single();
    if (error) throw new Error(`Lỗi tạo đối tác: ${error.message}`);
    return partner;
}
