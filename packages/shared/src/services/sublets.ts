/**
 * Sublets API Service (Shared)
 * CRUD operations for sublet listings
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubletListing, SubletFilters, CreateSubletRequest, SubletSearchResponse } from '../types/swap';

// ============================================
// API Functions
// ============================================

/**
 * Search sublets
 */
export async function searchSublets(
    supabase: SupabaseClient,
    filters: SubletFilters = {}
): Promise<SubletSearchResponse> {
    let query = supabase
        .from('sublet_listings')
        .select(`
            *,
            original_room:rooms!original_room_id(
                id, title, address, district, city, area_sqm,
                bedroom_count, bathroom_count, furnished, latitude, longitude, room_type
            ),
            owner:users!user_id(id, full_name, avatar_url, is_verified),
            images:sublet_images(image_url, is_primary, display_order)
        `, { count: 'exact' })
        .eq('status', 'active');

    if (filters.city) {
        query = query.eq('city', filters.city);
    }
    if (filters.district) {
        query = query.eq('district', filters.district);
    }
    if (filters.min_price) {
        query = query.gte('sublet_price', filters.min_price);
    }
    if (filters.max_price) {
        query = query.lte('sublet_price', filters.max_price);
    }
    if (filters.room_type) {
        query = query.eq('room_type', filters.room_type);
    }
    if (filters.furnished !== undefined) {
        query = query.eq('furnished', filters.furnished);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
        sublets: (data || []) as unknown as SubletListing[],
        totalCount: count || 0,
        hasMore: (count || 0) > page * pageSize,
    } as SubletSearchResponse;
}

/**
 * Get sublet by ID
 */
export async function getSubletById(
    supabase: SupabaseClient,
    id: string
): Promise<SubletListing | null> {
    const { data, error } = await supabase
        .from('sublet_listings')
        .select(`
            *,
            original_room:rooms!original_room_id(
                id, title, address, district, city, area_sqm,
                bedroom_count, bathroom_count, furnished, latitude, longitude, room_type
            ),
            owner:users!user_id(id, full_name, avatar_url, is_verified),
            images:sublet_images(image_url, is_primary, display_order)
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as unknown as SubletListing;
}

/**
 * Get user's sublets
 */
export async function getUserSublets(
    supabase: SupabaseClient,
    userId: string
): Promise<SubletListing[]> {
    const { data, error } = await supabase
        .from('sublet_listings')
        .select(`
            *,
            images:sublet_images(image_url, is_primary, display_order)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as unknown as SubletListing[];
}

/**
 * Create a sublet
 */
export async function createSublet(
    supabase: SupabaseClient,
    userId: string,
    data: CreateSubletRequest
): Promise<SubletListing> {
    const { data: sublet, error } = await supabase
        .from('sublet_listings')
        .insert({
            user_id: userId,
            original_room_id: data.original_room_id,
            start_date: data.start_date,
            end_date: data.end_date,
            sublet_price: data.sublet_price,
            deposit_required: data.deposit_required || null,
            description: data.description || null,
            requirements: data.requirements || null,
        })
        .select()
        .single();

    if (error) throw error;

    return sublet as unknown as SubletListing;
}

/**
 * Update a sublet
 */
export async function updateSublet(
    supabase: SupabaseClient,
    id: string,
    data: Partial<{
        start_date: string;
        end_date: string;
        sublet_price: number;
        deposit_required: number;
        description: string;
        requirements: string[];
        status: 'active' | 'booked' | 'cancelled';
    }>
): Promise<SubletListing> {
    const { data: sublet, error } = await supabase
        .from('sublet_listings')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return sublet as unknown as SubletListing;
}

/**
 * Delete a sublet
 */
export async function deleteSublet(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('sublet_listings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}
