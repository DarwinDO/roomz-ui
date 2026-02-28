/**
 * Swap Services
 * API functions for swap requests
 * Following Supabase Postgres Best Practices
 * Simplified version - using RPC for matches
 */

import { supabase } from '@/lib/supabase';
import type {
    SwapRequest,
    CreateSwapRequest,
    RespondToSwapRequest,
    PotentialMatch,
    PotentialMatchResponse,
} from '@roomz/shared/types/swap';

/**
 * Fetch potential swap matches for current user
 * Uses RPC function get_potential_matches for realtime calculation
 */
export async function fetchPotentialMatches(
    minScore: number = 40
): Promise<PotentialMatchResponse> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('get_potential_matches', {
        p_user_id: user.user.id,
    });

    if (error) {
        console.error('Error fetching potential matches:', error);
        throw error;
    }

    // Filter by min score and cast to type
    const matches: PotentialMatch[] = (data || [])
        .filter((match: any) => match.match_score >= minScore)
        .map((match: any) => ({
            listing_id: match.listing_id,
            matched_listing_id: match.matched_listing_id,
            match_score: match.match_score,
            matched_listing: match.matched_listing,
        }));

    return {
        matches,
        totalCount: matches.length,
    };
}

/**
 * Create a swap request
 * Validates that users have active listings
 */
export async function createSwapRequest(
    request: CreateSwapRequest
): Promise<SwapRequest> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Validate: requester must own the requester_listing_id
    const { data: requesterListing, error: requesterError } = await supabase
        .from('sublet_listings')
        .select('owner_id, status')
        .eq('id', request.requester_listing_id)
        .single();

    if (requesterError || !requesterListing) {
        throw new Error('Không tìm thấy tin đăng của bạn');
    }

    if (requesterListing.owner_id !== user.user.id) {
        throw new Error('Bạn chỉ có thể hoán đổi với tin đăng của chính mình');
    }

    if (requesterListing.status !== 'active') {
        throw new Error('Tin đăng của bạn phải đang hoạt động để gửi yêu cầu hoán đổi');
    }

    // Validate: recipient listing exists and is active
    const { data: recipientListing, error: recipientError } = await supabase
        .from('sublet_listings')
        .select('owner_id, status')
        .eq('id', request.recipient_listing_id)
        .single();

    if (recipientError || !recipientListing) {
        throw new Error('Không tìm thấy tin đăng của ngườ nhận');
    }

    if (recipientListing.status !== 'active') {
        throw new Error('Tin đăng của ngườ nhận không khả dụng để hoán đổi');
    }

    if (recipientListing.owner_id === user.user.id) {
        throw new Error('Không thể hoán đổi với chính tin đăng của bạn');
    }

    const { data, error } = await supabase
        .from('swap_requests')
        .insert({
            requester_id: user.user.id,
            requester_listing_id: request.requester_listing_id,
            recipient_id: recipientListing.owner_id,
            recipient_listing_id: request.recipient_listing_id,
            message: request.message,
            proposed_start_date: request.proposed_start_date,
            proposed_end_date: request.proposed_end_date,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating swap request:', error);
        throw error;
    }

    return data as SwapRequest;
}

/**
 * Fetch swap requests for current user
 * Includes both sent and received requests
 */
export async function fetchSwapRequests(
    status?: string
): Promise<SwapRequest[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = supabase
        .from('swap_requests')
        .select(
            `
      *,
      requester:users!requester_id (
        id, full_name, avatar_url
      ),
      requester_listing:sublet_listings!requester_listing_id (
        id, start_date, end_date, sublet_price,
        original_room:original_room_id (
          title, address, district, city, room_images(image_url, is_primary, display_order)
        )
      ),
      recipient:users!recipient_id (
        id, full_name, avatar_url
      ),
      recipient_listing:sublet_listings!recipient_listing_id (
        id, start_date, end_date, sublet_price,
        original_room:original_room_id (
          title, address, district, city, room_images(image_url, is_primary, display_order)
        )
      )
    `
        )
        .or(`requester_id.eq.${user.user.id},recipient_id.eq.${user.user.id}`);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching swap requests:', error);
        throw error;
    }

    return (data || []) as unknown as SwapRequest[];
}

/**
 * Fetch a single swap request by ID
 */
export async function fetchSwapRequestById(
    id: string
): Promise<SwapRequest | null> {
    const { data, error } = await supabase
        .from('swap_requests')
        .select(
            `
      *,
      requester:users!requester_id (
        id, full_name, avatar_url
      ),
      requester_listing:sublet_listings!requester_listing_id (
        id, start_date, end_date, sublet_price, deposit_required, description,
        original_room:original_room_id (
          title, address, district, city, area_sqm,
          bedroom_count, bathroom_count, furnished,
           room_images(image_url, is_primary, display_order)
        )
      ),
      recipient:users!recipient_id (
        id, full_name, avatar_url
      ),
      recipient_listing:sublet_listings!recipient_listing_id (
        id, start_date, end_date, sublet_price, deposit_required, description,
        original_room:original_room_id (
          title, address, district, city, area_sqm,
          bedroom_count, bathroom_count, furnished,
           room_images(image_url, is_primary, display_order)
        )
      )
    `
        )
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching swap request:', error);
        throw error;
    }

    return data as unknown as SwapRequest;
}

/**
 * Respond to a swap request (accept/reject)
 */
export async function respondToSwapRequest(
    requestId: string,
    response: RespondToSwapRequest
): Promise<SwapRequest> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('swap_requests')
        .update({
            status: response.status,
            rejection_reason: response.rejection_reason,
            responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('recipient_id', user.user.id)
        .eq('status', 'pending')
        .select()
        .single();

    if (error) {
        console.error('Error responding to swap request:', error);
        throw error;
    }

    return data as SwapRequest;
}

/**
 * Cancel a swap request (requester only)
 * Updates status to 'rejected' (simplified - no cancelled status)
 */
export async function cancelSwapRequest(requestId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('requester_id', user.user.id)
        .eq('status', 'pending');

    if (error) {
        console.error('Error cancelling swap request:', error);
        throw error;
    }
}
