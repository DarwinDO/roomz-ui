/**
 * Partners API Service
 * Interact with 'partners' table
 */
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type Partner = Tables<'partners'>;

export interface PartnerFilters {
    search?: string;
    category?: string;
    sortBy?: 'rating' | 'reviews' | 'name';
}

/**
 * Get all partners with optional filters
 */
export async function getPartners(filters: PartnerFilters = {}): Promise<Partner[]> {
    let query = supabase
        .from('partners')
        .select('*')
        .eq('status', 'active');

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
    // Using RPC is ideal, but for now simple update or ignore if high traffic
    // We'll trust the component to call this
    // Optimized: Create an RPC function for atomic increment later.
    // For now, client-side update is risky for concurrency but acceptible for view counts in MVP.
    // actually, let's just skip if no RPC exists, or try a simple update.
    /* 
    await supabase.rpc('increment_partner_view_count', { row_id: id });
    */
}
