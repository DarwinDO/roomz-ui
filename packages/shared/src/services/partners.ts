/**
 * Partners API Service (Shared)
 * CRUD operations for partner businesses
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type PartnerCategory = 'moving' | 'cleaning' | 'real_estate' | 'utilities' | 'furniture' | 'other';

export interface Partner {
    id: string;
    user_id: string;
    name: string;
    category: PartnerCategory;
    description: string | null;
    phone: string;
    email: string;
    address: string | null;
    website: string | null;
    logo_url: string | null;
    cover_url: string | null;
    rating: number | null;
    review_count: number;
    status: PartnerStatus;
    is_verified: boolean;
    specialization: string | null;
    service_areas: string[];
    created_at: string;
    updated_at: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all partners
 */
export async function getPartners(
    supabase: SupabaseClient,
    options?: {
        category?: PartnerCategory;
        city?: string;
        search?: string;
    }
): Promise<Partner[]> {
    let query = supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

    if (options?.category) {
        query = query.eq('category', options.category);
    }
    if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Partner[];
}

/**
 * Get partner by ID
 */
export async function getPartnerById(
    supabase: SupabaseClient,
    id: string
): Promise<Partner | null> {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as Partner;
}

/**
 * Get partners by category
 */
export async function getPartnersByCategory(
    supabase: SupabaseClient,
    category: PartnerCategory
): Promise<Partner[]> {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .order('rating', { ascending: false });

    if (error) throw error;

    return (data || []) as Partner[];
}

/**
 * Get partner categories
 */
export async function getPartnerCategories(
    supabase: SupabaseClient
): Promise<string[]> {
    const { data, error } = await supabase
        .from('partners')
        .select('category')
        .eq('status', 'active');

    if (error) throw error;

    const categories = new Set((data || []).map(p => p.category));
    return Array.from(categories);
}

/**
 * Search partners
 */
export async function searchPartners(
    supabase: SupabaseClient,
    query: string,
    category?: PartnerCategory
): Promise<Partner[]> {
    let supabaseQuery = supabase
        .from('partners')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (category) {
        supabaseQuery = supabaseQuery.eq('category', category);
    }

    const { data, error } = await supabaseQuery.order('rating', { ascending: false });

    if (error) throw error;

    return (data || []) as Partner[];
}
