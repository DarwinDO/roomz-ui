/**
 * Reviews API Service
 */
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/lib/database.types';

export type Review = Tables<'reviews'>;
export type ReviewInsert = TablesInsert<'reviews'>;

// ... implementation similar to others ...
export async function getReviews(targetId: string, type: 'room' | 'partner' | 'user') {
    let query = supabase
        .from('reviews')
        .select(`
            *,
            reviewer:users!reviews_reviewer_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .order('created_at', { ascending: false });

    if (type === 'room') query = query.eq('room_id', targetId);
    else if (type === 'partner') query = query.eq('partner_id', targetId);
    else if (type === 'user') query = query.eq('reviewed_user_id', targetId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function createReview(review: ReviewInsert) {
    const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

    if (error) throw error;
    return data;
}
