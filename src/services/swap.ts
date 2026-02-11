/**
 * Swap Services
 * API functions for swap requests and matches
 * Following Supabase Postgres Best Practices
 */

import { supabase } from '@/lib/supabase';
import type {
    SwapRequest,
    SwapMatch,
    CreateSwapRequest,
    RespondToSwapRequest,
    SwapMatchResponse,
} from '@/types/swap';

/**
 * Fetch swap matches for current user
 * Uses indexed query on swap_matches table
 */
export async function fetchSwapMatches(
    minScore: number = 60,
    limit: number = 20
): Promise<SwapMatchResponse> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get user's sublet listings first
    const { data: myListings, error: listingsError } = await supabase
        .from('sublet_listings')
        .select('id')
        .eq('owner_id', user.user.id)
        .eq('status', 'active');

    if (listingsError) {
        console.error('Error fetching my listings:', listingsError);
        throw listingsError;
    }

    if (!myListings || myListings.length === 0) {
        return { matches: [], totalCount: 0 };
    }

    const listingIds = myListings.map((l) => l.id);

    // Find matches where my listings are involved
    const { data, error, count } = await supabase
        .from('swap_matches')
        .select(
            `
      *,
      listing1:sublet_listings!listing_1_id (
        id, start_date, end_date, sublet_price, original_price,
        original_room:original_room_id (
          title, address, district, city, room_images(image_url, is_primary, display_order)
        ),
        owner:owner_id (
          full_name, avatar_url
        )
      ),
      listing2:sublet_listings!listing_2_id (
        id, start_date, end_date, sublet_price, original_price,
        original_room:original_room_id (
          title, address, district, city, room_images(image_url, is_primary, display_order)
        ),
        owner:owner_id (
          full_name, avatar_url
        )
      )
    `,
            { count: 'exact' }
        )
        .or(
            listingIds.map((id) => `listing_1_id.eq.${id}`).join(',') +
            ',' +
            listingIds.map((id) => `listing_2_id.eq.${id}`).join(',')
        )
        .eq('is_active', true)
        .gte('match_score', minScore)
        .order('match_score', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching swap matches:', error);
        throw error;
    }

    // Transform data
    const matches: SwapMatch[] = (data || []).map((match: any) => {
        const isListing1Mine = listingIds.includes(match.listing_1_id);
        return {
            ...match,
            my_listing: isListing1Mine ? match.listing1 : match.listing2,
            matched_listing: isListing1Mine ? match.listing2 : match.listing1,
        };
    });

    return {
        matches,
        totalCount: count || 0,
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
        throw new Error('Your listing not found');
    }

    if (requesterListing.owner_id !== user.user.id) {
        throw new Error('You can only swap with your own listings');
    }

    if (requesterListing.status !== 'active') {
        throw new Error('Your listing must be active to create swap requests');
    }

    // Validate: recipient listing exists and is active
    const { data: recipientListing, error: recipientError } = await supabase
        .from('sublet_listings')
        .select('owner_id, status')
        .eq('id', request.recipient_listing_id)
        .single();

    if (recipientError || !recipientListing) {
        throw new Error('Recipient listing not found');
    }

    if (recipientListing.status !== 'active') {
        throw new Error('Recipient listing is not available for swap');
    }

    if (recipientListing.owner_id === user.user.id) {
        throw new Error('Cannot swap with your own listing');
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
 */
export async function cancelSwapRequest(requestId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('swap_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('requester_id', user.user.id)
        .in('status', ['pending', 'negotiating']);

    if (error) {
        console.error('Error cancelling swap request:', error);
        throw error;
    }
}

/**
 * Update match swipe status (like/pass)
 */
export async function swipeMatch(
    matchId: string,
    direction: 'like' | 'pass'
): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // First get the match to determine if user is user1 or user2
    const { data: match, error: matchError } = await supabase
        .from('swap_matches')
        .select('listing_1_id, listing_2_id')
        .eq('id', matchId)
        .single();

    if (matchError || !match) {
        throw new Error('Match not found');
    }

    // Determine which field to update based on user's listing
    const { data: listing1 } = await supabase
        .from('sublet_listings')
        .select('owner_id')
        .eq('id', match.listing_1_id)
        .single();

    const isUser1 = listing1?.owner_id === user.user.id;

    const { error } = await supabase
        .from('swap_matches')
        .update({
            [isUser1 ? 'user1_swiped' : 'user2_swiped']: direction === 'like',
            [isUser1 ? 'shown_to_user1' : 'shown_to_user2']: true,
        })
        .eq('id', matchId);

    if (error) {
        console.error('Error updating match swipe:', error);
        throw error;
    }
}
