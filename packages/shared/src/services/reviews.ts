/**
 * Reviews API Service (Shared)
 * CRUD operations for partner reviews
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface Review {
    id: string;
    partner_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    images: string[];
    is_verified: boolean;
    status: 'pending' | 'published' | 'hidden';
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Get reviews for a partner
 */
export async function getPartnerReviews(
    supabase: SupabaseClient,
    partnerId: string
): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            user:users!user_id(id, full_name, avatar_url)
        `)
        .eq('partner_id', partnerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Review[];
}

/**
 * Get review statistics for a partner
 */
export async function getPartnerReviewStats(
    supabase: SupabaseClient,
    partnerId: string
): Promise<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
}> {
    const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('partner_id', partnerId)
        .eq('status', 'published');

    if (error) throw error;

    const reviews = data || [];
    const total = reviews.length;

    if (total === 0) {
        return {
            average_rating: 0,
            total_reviews: 0,
            rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return {
        average_rating: Math.round(avg * 10) / 10,
        total_reviews: total,
        rating_distribution: distribution,
    };
}

/**
 * Create a review
 */
export async function createReview(
    supabase: SupabaseClient,
    data: {
        partner_id: string;
        user_id: string;
        rating: number;
        comment?: string;
        images?: string[];
    }
): Promise<Review> {
    const { data: review, error } = await supabase
        .from('reviews')
        .insert({
            ...data,
            images: data.images || [],
            status: 'published',
            is_verified: true, // Only verified bookings can review
        })
        .select(`
            *,
            user:users!user_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    return review as Review;
}

/**
 * Update a review
 */
export async function updateReview(
    supabase: SupabaseClient,
    id: string,
    data: {
        rating?: number;
        comment?: string;
        images?: string[];
    }
): Promise<Review> {
    const { data: review, error } = await supabase
        .from('reviews')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return review as Review;
}

/**
 * Delete a review
 */
export async function deleteReview(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('reviews')
        .update({ status: 'hidden' })
        .eq('id', id);

    if (error) throw error;
}
