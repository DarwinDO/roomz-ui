/**
 * Swap API Service (Shared)
 * CRUD operations for room swap requests
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SwapRequest, CreateSwapRequest, RespondToSwapRequest, PotentialMatchResponse, PotentialMatch } from '../types/swap';

// ============================================
// API Functions
// ============================================

/**
 * Get user's swap requests (as requester or recipient)
 */
export async function getUserSwapRequests(
    supabase: SupabaseClient,
    userId: string
): Promise<{ incoming: SwapRequest[]; outgoing: SwapRequest[] }> {
    // Get requests where user is the recipient
    const { data: incoming, error: incomingError } = await supabase
        .from('swap_requests')
        .select(`
            *,
            requester:users!requester_id(id, full_name, avatar_url),
            requester_listing:sublet_listings!requester_listing_id(*),
            recipient_listing:sublet_listings!recipient_listing_id(*)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

    if (incomingError) throw incomingError;

    // Get requests where user is the requester
    const { data: outgoing, error: outgoingError } = await supabase
        .from('swap_requests')
        .select(`
            *,
            recipient:users!recipient_id(id, full_name, avatar_url),
            requester_listing:sublet_listings!requester_listing_id(*),
            recipient_listing:sublet_listings!recipient_listing_id(*)
        `)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

    if (outgoingError) throw outgoingError;

    return {
        incoming: (incoming || []) as unknown as SwapRequest[],
        outgoing: (outgoing || []) as unknown as SwapRequest[],
    };
}

/**
 * Create a swap request
 */
export async function createSwapRequest(
    supabase: SupabaseClient,
    userId: string,
    data: CreateSwapRequest
): Promise<SwapRequest> {
    // Get recipient ID from the listing
    const { data: listing } = await supabase
        .from('sublet_listings')
        .select('user_id')
        .eq('id', data.recipient_listing_id)
        .single();

    if (!listing) throw new Error('Listing not found');

    const { data: request, error } = await supabase
        .from('swap_requests')
        .insert({
            requester_id: userId,
            recipient_id: listing.user_id,
            requester_listing_id: data.requester_listing_id,
            recipient_listing_id: data.recipient_listing_id,
            message: data.message || null,
            proposed_start_date: data.proposed_start_date,
            proposed_end_date: data.proposed_end_date,
        })
        .select(`
            *,
            requester:users!requester_id(id, full_name, avatar_url),
            recipient:users!recipient_id(id, full_name, avatar_url),
            requester_listing:sublet_listings!requester_listing_id(*),
            recipient_listing:sublet_listings!recipient_listing_id(*)
        `)
        .single();

    if (error) throw error;

    return request as unknown as SwapRequest;
}

/**
 * Respond to a swap request
 */
export async function respondToSwapRequest(
    supabase: SupabaseClient,
    requestId: string,
    userId: string,
    data: RespondToSwapRequest
): Promise<void> {
    const { error } = await supabase
        .from('swap_requests')
        .update({
            status: data.status,
            rejection_reason: data.rejection_reason || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('recipient_id', userId);

    if (error) throw error;
}

/**
 * Cancel a swap request
 */
export async function cancelSwapRequest(
    supabase: SupabaseClient,
    requestId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('swap_requests')
        .update({
            status: 'rejected',
            rejection_reason: 'Cancelled by requester',
            updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('requester_id', userId);

    if (error) throw error;
}

/**
 * Get potential swap matches for a listing
 */
export async function getPotentialMatches(
    supabase: SupabaseClient,
    listingId: string
): Promise<PotentialMatchResponse> {
    const { data, error } = await supabase.rpc('find_swap_matches', {
        p_listing_id: listingId,
    });

    if (error) throw error;

    return {
        matches: (data || []) as PotentialMatch[],
        totalCount: (data || []).length,
    };
}
