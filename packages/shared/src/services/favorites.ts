/**
 * Favorites API Service (Shared)
 * CRUD operations for user favorites
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface Favorite {
    id: string;
    user_id: string;
    item_id: string;
    item_type: 'room' | 'sublet' | 'post';
    created_at: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get user's favorites
 */
export async function getFavorites(
    supabase: SupabaseClient,
    userId: string,
    itemType?: 'room' | 'sublet' | 'post'
): Promise<Favorite[]> {
    let query = supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId);

    if (itemType) {
        query = query.eq('item_type', itemType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Favorite[];
}

/**
 * Add to favorites
 */
export async function addFavorite(
    supabase: SupabaseClient,
    userId: string,
    itemId: string,
    itemType: 'room' | 'sublet' | 'post'
): Promise<Favorite> {
    const { data, error } = await supabase
        .from('favorites')
        .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType,
        })
        .select()
        .single();

    if (error) throw error;

    return data as Favorite;
}

/**
 * Remove from favorites
 */
export async function removeFavorite(
    supabase: SupabaseClient,
    userId: string,
    itemId: string
): Promise<void> {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

    if (error) throw error;
}

/**
 * Check if item is favorited
 */
export async function isFavorited(
    supabase: SupabaseClient,
    userId: string,
    itemId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

    if (error) throw error;

    return !!data;
}

/**
 * Get favorite rooms with details
 */
export async function getFavoriteRooms(
    supabase: SupabaseClient,
    userId: string
): Promise<Array<{
    id: string;
    room_id: string;
    created_at: string;
    room: {
        id: string;
        title: string;
        address: string;
        price_per_month: number;
        images: Array<{ image_url: string }>;
    };
}>> {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
            id,
            item_id,
            created_at,
            room:rooms!item_id(
                id,
                title,
                address,
                price_per_month,
                images:room_images(image_url)
            )
        `)
        .eq('user_id', userId)
        .eq('item_type', 'room')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as any;
}
