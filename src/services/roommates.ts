// @ts-nocheck - Tables mới chưa có trong database.types.ts
// Regenerate types: npx supabase gen types typescript --project-id vevnoxlgwisdottaifdn > src/lib/database.types.ts
/**
 * Roommates API Service
 * CRUD operations for roommate profiles, matching, and requests
 */



import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export type RoommateProfileStatus = 'looking' | 'paused' | 'found';
export type RoommateRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export interface RoommateProfile {
    id: string;
    user_id: string;
    status: RoommateProfileStatus;
    city: string;
    district: string | null;
    search_radius_km: number;
    university_based: boolean;
    budget_min: number | null;
    budget_max: number | null;
    move_in_date: string | null;
    room_type_preference: string[];
    age: number | null;
    gender: 'male' | 'female' | 'other' | null;
    preferred_gender: 'male' | 'female' | 'any';
    occupation: 'student' | 'worker' | 'freelancer' | 'other' | null;
    bio: string | null;
    hobbies: string[];
    languages: string[];
    created_at: string;
    updated_at: string;
}

export interface RoommateProfileInput {
    city: string;
    district?: string;
    search_radius_km?: number;
    university_based?: boolean;
    budget_min?: number;
    budget_max?: number;
    move_in_date?: string;
    room_type_preference?: string[];
    age?: number;
    gender?: 'male' | 'female' | 'other';
    preferred_gender?: 'male' | 'female' | 'any';
    occupation?: 'student' | 'worker' | 'freelancer' | 'other';
    bio?: string;
    hobbies?: string[];
    languages?: string[];
}

export interface RoommateMatch {
    matched_user_id: string;
    compatibility_score: number;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    university: string | null;
    major: string | null;
    city: string;
    district: string | null;
    age: number | null;
    gender: string | null;
    occupation: string | null;
    hobbies: string[];
    // Score breakdown
    sleep_score: number;
    cleanliness_score: number;
    noise_score: number;
    guest_score: number;
    weekend_score: number;
    budget_score: number;
}

export interface RoommateRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: RoommateRequestStatus;
    message: string | null;
    created_at: string;
    responded_at: string | null;
    expires_at: string;
    // Joined data
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface QuizAnswer {
    question_id: number;
    answer_value: string;
}

// ============================================
// Profile CRUD
// ============================================

/**
 * Get roommate profile for a user
 */
export async function getRoommateProfile(userId: string): Promise<RoommateProfile | null> {
    const { data, error } = await supabase
        .from('roommate_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('[getRoommateProfile] Error:', error);
        throw error;
    }

    return data as RoommateProfile | null;
}

/**
 * Create roommate profile for a user
 */
export async function createRoommateProfile(
    userId: string,
    data: RoommateProfileInput
): Promise<RoommateProfile> {
    const { data: profile, error } = await supabase
        .from('roommate_profiles')
        .insert({
            user_id: userId,
            ...data,
        })
        .select()
        .single();

    if (error) {
        console.error('[createRoommateProfile] Error:', error);
        throw error;
    }

    return profile as RoommateProfile;
}

/**
 * Update roommate profile
 */
export async function updateRoommateProfile(
    userId: string,
    data: Partial<RoommateProfileInput>
): Promise<RoommateProfile> {
    const { data: profile, error } = await supabase
        .from('roommate_profiles')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('[updateRoommateProfile] Error:', error);
        throw error;
    }

    return profile as RoommateProfile;
}

/**
 * Update profile visibility status
 */
export async function updateProfileStatus(
    userId: string,
    status: RoommateProfileStatus
): Promise<void> {
    const { error } = await supabase
        .from('roommate_profiles')
        .update({ status })
        .eq('user_id', userId);

    if (error) {
        console.error('[updateProfileStatus] Error:', error);
        throw error;
    }
}

/**
 * Delete roommate profile
 */
export async function deleteRoommateProfile(userId: string): Promise<void> {
    const { error } = await supabase
        .from('roommate_profiles')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('[deleteRoommateProfile] Error:', error);
        throw error;
    }
}

// ============================================
// Quiz & Compatibility
// ============================================

/**
 * Save quiz answers for a user
 */
export async function saveQuizAnswers(
    userId: string,
    answers: QuizAnswer[]
): Promise<void> {
    const { error } = await supabase
        .from('compatibility_answers')
        .upsert(
            answers.map(a => ({
                user_id: userId,
                question_id: a.question_id,
                answer_value: a.answer_value,
            })),
            { onConflict: 'user_id,question_id' }
        );

    if (error) {
        console.error('[saveQuizAnswers] Error:', error);
        throw error;
    }
}

/**
 * Get quiz answers for a user
 */
export async function getQuizAnswers(userId: string): Promise<QuizAnswer[]> {
    const { data, error } = await supabase
        .from('compatibility_answers')
        .select('question_id, answer_value')
        .eq('user_id', userId);

    if (error) {
        console.error('[getQuizAnswers] Error:', error);
        throw error;
    }

    return (data || []) as QuizAnswer[];
}

// ============================================
// Matching
// ============================================

/**
 * Get top roommate matches for a user
 * Uses stored function for optimized matching
 */
export async function getTopMatches(
    userId: string,
    limit: number = 20
): Promise<RoommateMatch[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_roommate_matches', {
        p_user_id: userId,
        p_limit: limit,
    });

    if (error) {
        console.error('[getTopMatches] Error:', error);
        throw error;
    }

    return (data || []) as RoommateMatch[];
}

/**
 * Calculate compatibility score between two users
 */
export async function calculateCompatibility(
    user1Id: string,
    user2Id: string
): Promise<{
    total_score: number;
    sleep_score: number;
    cleanliness_score: number;
    noise_score: number;
    guest_score: number;
    weekend_score: number;
    budget_score: number;
}> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('calculate_compatibility_score', {
        p_user1_id: user1Id,
        p_user2_id: user2Id,
    });

    if (error) {
        console.error('[calculateCompatibility] Error:', error);
        throw error;
    }

    return data?.[0] || {
        total_score: 0,
        sleep_score: 0,
        cleanliness_score: 0,
        noise_score: 0,
        guest_score: 0,
        weekend_score: 0,
        budget_score: 0,
    };
}

// ============================================
// Requests
// ============================================

/**
 * Send a roommate request
 */
export async function sendRoommateRequest(
    senderId: string,
    receiverId: string,
    message?: string
): Promise<RoommateRequest> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            message: message || null,
        })
        .select()
        .single();

    if (error) {
        // Handle specific errors
        if (error.code === '23505') {
            throw new Error('Bạn đã gửi yêu cầu cho người này rồi');
        }
        if (error.code === '23514' && error.message.includes('no_self_request')) {
            throw new Error('Không thể gửi yêu cầu cho chính mình');
        }
        console.error('[sendRoommateRequest] Error:', error);
        throw error;
    }

    return data as RoommateRequest;
}

/**
 * Cancel a pending request (sender only)
 */
export async function cancelRoommateRequest(requestId: string): Promise<void> {
    const { error } = await supabase
        .from('roommate_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

    if (error) {
        console.error('[cancelRoommateRequest] Error:', error);
        throw error;
    }
}

/**
 * Respond to a roommate request (receiver only)
 */
export async function respondToRequest(
    requestId: string,
    accept: boolean
): Promise<void> {
    const { error } = await supabase
        .from('roommate_requests')
        .update({
            status: accept ? 'accepted' : 'declined',
        })
        .eq('id', requestId);

    if (error) {
        console.error('[respondToRequest] Error:', error);
        throw error;
    }
}

/**
 * Accept and create conversation
 */
export async function acceptRequestAndCreateConversation(
    requestId: string,
    currentUserId: string
): Promise<string> {
    // Get request details first
    const { data: request, error: fetchError } = await supabase
        .from('roommate_requests')
        .select('sender_id, receiver_id')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;
    if (!request) throw new Error('Request not found');

    // Accept the request
    await respondToRequest(requestId, true);

    // Create conversation between sender and receiver
    const otherUserId = request.sender_id === currentUserId
        ? request.receiver_id
        : request.sender_id;

    // Use the existing RPC function to create conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversationId, error: convError } = await (supabase.rpc as any)(
        'get_or_create_conversation',
        {
            user1_id: currentUserId,
            user2_id: otherUserId,
        }
    );

    if (convError) throw convError;

    return conversationId as string;
}

/**
 * Get pending requests received by user
 */
export async function getPendingRequests(userId: string): Promise<RoommateRequest[]> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getPendingRequests] Error:', error);
        throw error;
    }

    return (data || []) as RoommateRequest[];
}

/**
 * Get requests sent by user
 */
export async function getSentRequests(userId: string): Promise<RoommateRequest[]> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .select(`
      *,
      receiver:users!receiver_id(id, full_name, avatar_url)
    `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getSentRequests] Error:', error);
        throw error;
    }

    return (data || []) as RoommateRequest[];
}

/**
 * Get all requests for a user (both sent and received)
 */
export async function getAllRequests(userId: string): Promise<{
    received: RoommateRequest[];
    sent: RoommateRequest[];
}> {
    const [received, sent] = await Promise.all([
        getPendingRequests(userId),
        getSentRequests(userId),
    ]);

    return { received, sent };
}

/**
 * Check if a request already exists between two users
 */
export async function hasExistingRequest(
    user1Id: string,
    user2Id: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .select('id')
        .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
        .eq('status', 'pending')
        .limit(1);

    if (error) {
        console.error('[hasExistingRequest] Error:', error);
        return false;
    }

    return (data?.length || 0) > 0;
}

// ============================================
// Premium Limits
// ============================================

const DAILY_VIEW_LIMIT = 10;
const DAILY_REQUEST_LIMIT = 5;

/**
 * Get daily view count from localStorage
 */
export function getDailyViewCount(): number {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('roommate_views');

    if (!stored) return 0;

    try {
        const data = JSON.parse(stored);
        if (data.date !== today) return 0;
        return data.count || 0;
    } catch {
        return 0;
    }
}

/**
 * Increment daily view count
 */
export function incrementDailyViewCount(): number {
    const today = new Date().toDateString();
    const current = getDailyViewCount();
    const newCount = current + 1;

    localStorage.setItem('roommate_views', JSON.stringify({
        date: today,
        count: newCount,
    }));

    return newCount;
}

/**
 * Check if user can view more profiles
 */
export function canViewMoreProfiles(): boolean {
    return getDailyViewCount() < DAILY_VIEW_LIMIT;
}

/**
 * Get daily request count
 */
export function getDailyRequestCount(): number {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('roommate_requests');

    if (!stored) return 0;

    try {
        const data = JSON.parse(stored);
        if (data.date !== today) return 0;
        return data.count || 0;
    } catch {
        return 0;
    }
}

/**
 * Increment daily request count
 */
export function incrementDailyRequestCount(): number {
    const today = new Date().toDateString();
    const current = getDailyRequestCount();
    const newCount = current + 1;

    localStorage.setItem('roommate_requests', JSON.stringify({
        date: today,
        count: newCount,
    }));

    return newCount;
}

/**
 * Check if user can send more requests
 */
export function canSendMoreRequests(): boolean {
    return getDailyRequestCount() < DAILY_REQUEST_LIMIT;
}

/**
 * Get remaining limits
 */
export function getRemainingLimits(): {
    views: number;
    requests: number;
    viewLimit: number;
    requestLimit: number;
} {
    return {
        views: DAILY_VIEW_LIMIT - getDailyViewCount(),
        requests: DAILY_REQUEST_LIMIT - getDailyRequestCount(),
        viewLimit: DAILY_VIEW_LIMIT,
        requestLimit: DAILY_REQUEST_LIMIT,
    };
}

// ============================================
// Realtime Subscriptions
// ============================================

/**
 * Subscribe to new requests for a user
 */
export function subscribeToRequests(
    userId: string,
    onNewRequest: (request: RoommateRequest) => void
) {
    const channel = supabase
        .channel(`roommate-requests-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'roommate_requests',
                filter: `receiver_id=eq.${userId}`,
            },
            (payload) => {
                onNewRequest(payload.new as RoommateRequest);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => supabase.removeChannel(channel),
    };
}

/**
 * Subscribe to request status changes
 */
export function subscribeToRequestUpdates(
    userId: string,
    onUpdate: (request: RoommateRequest) => void
) {
    const channel = supabase
        .channel(`roommate-request-updates-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'roommate_requests',
                filter: `sender_id=eq.${userId}`,
            },
            (payload) => {
                onUpdate(payload.new as RoommateRequest);
            }
        )
        .subscribe();

    return {
        unsubscribe: () => supabase.removeChannel(channel),
    };
}
