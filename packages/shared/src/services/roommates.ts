/**
 * Roommates API Service (Shared)
 * CRUD operations for roommate profiles, matching, and requests
 * Platform agnostic with SupabaseClient and StorageAdapter injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageAdapter } from '../adapters';

// ============================================
// Types - Must match DB enum values
// ============================================

// DB: roommate_profile_status = 'looking' | 'paused' | 'found'
export type RoommateProfileStatus = 'looking' | 'paused' | 'found';
// DB: roommate_request_status = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
export type RoommateRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export type RoommateMatchScope = 'same_district' | 'same_city' | 'outside_priority_area';

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
    confidence_score: number;
    match_scope: RoommateMatchScope;
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
    sleep_score: number;
    cleanliness_score: number;
    noise_score: number;
    guest_score: number;
    weekend_score: number;
    budget_score: number;
    hobby_score: number;
    age_score: number;
    move_in_score: number;
    location_score: number;
    last_seen: string | null;
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
// Constants
// ============================================

const DAILY_VIEW_LIMIT = 10;
const DAILY_REQUEST_LIMIT = 5;

// ============================================
// Profile CRUD
// ============================================

/**
 * Get roommate profile for a user
 */
export async function getRoommateProfile(
    supabase: SupabaseClient,
    userId: string
): Promise<RoommateProfile | null> {
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
    supabase: SupabaseClient,
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
    supabase: SupabaseClient,
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
    supabase: SupabaseClient,
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
export async function deleteRoommateProfile(
    supabase: SupabaseClient,
    userId: string
): Promise<void> {
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
    supabase: SupabaseClient,
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
export async function getQuizAnswers(
    supabase: SupabaseClient,
    userId: string
): Promise<QuizAnswer[]> {
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
 */
export async function getTopMatches(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 20
): Promise<RoommateMatch[]> {
    const { data, error } = await supabase.rpc('get_roommate_matches', {
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
    supabase: SupabaseClient,
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
    hobby_score: number;
    age_score: number;
    move_in_score: number;
    location_score: number;
    confidence_score: number;
}> {
    const { data, error } = await supabase.rpc('calculate_compatibility_score', {
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
        hobby_score: 0,
        age_score: 0,
        move_in_score: 0,
        location_score: 0,
        confidence_score: 0,
    };
}

// ============================================
// Requests
// ============================================

/**
 * Send a roommate request
 */
export async function sendRoommateRequest(
    supabase: SupabaseClient,
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
        if (error.code === '23505') {
            throw new Error('Bạn đã gửi yêu cầu cho người này rồi');
        }
        console.error('[sendRoommateRequest] Error:', error);
        throw error;
    }

    return data as RoommateRequest;
}

/**
 * Get connected users (accepted requests)
 */
export async function getConnectedUsers(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
        console.error('[getConnectedUsers] Error:', error);
        return [];
    }

    return (data || []).map(r =>
        r.sender_id === userId ? r.receiver_id : r.sender_id
    );
}

/**
 * Cancel a pending request (sender only)
 */
export async function cancelRoommateRequest(
    supabase: SupabaseClient,
    requestId: string
): Promise<void> {
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
    supabase: SupabaseClient,
    requestId: string,
    accept: boolean
): Promise<void> {
    const { error } = await supabase
        .from('roommate_requests')
        .update({
            status: accept ? 'accepted' : 'declined',
            responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

    if (error) {
        console.error('[respondToRequest] Error:', error);
        throw error;
    }
}

/**
 * Get all requests received by user
 */
export async function getReceivedRequests(
    supabase: SupabaseClient,
    userId: string
): Promise<RoommateRequest[]> {
    const { data, error } = await supabase
        .from('roommate_requests')
        .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getReceivedRequests] Error:', error);
        throw error;
    }

    return (data || []) as RoommateRequest[];
}

/**
 * Get requests sent by user
 */
export async function getSentRequests(
    supabase: SupabaseClient,
    userId: string
): Promise<RoommateRequest[]> {
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

// ============================================
// Premium Limits (StorageAdapter-based for cross-platform)
// ============================================

/**
 * Get daily view count from storage adapter
 */
export async function getDailyViewCount(
    storageAdapter: StorageAdapter,
    userId?: string
): Promise<number> {
    if (!userId) return 0;
    const today = new Date().toDateString();
    const stored = await storageAdapter.getItem(`roommate_views_${userId}`);

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
export async function incrementDailyViewCount(
    storageAdapter: StorageAdapter,
    userId: string
): Promise<number> {
    const today = new Date().toDateString();
    const current = await getDailyViewCount(storageAdapter, userId);
    const newCount = current + 1;

    await storageAdapter.setItem(`roommate_views_${userId}`, JSON.stringify({
        date: today,
        count: newCount,
    }));

    return newCount;
}

/**
 * Check if user can view more profiles
 */
export async function canViewMoreProfiles(
    storageAdapter: StorageAdapter,
    userId?: string
): Promise<boolean> {
    const count = await getDailyViewCount(storageAdapter, userId);
    return count < DAILY_VIEW_LIMIT;
}

/**
 * Get daily request count
 */
export async function getDailyRequestCount(
    storageAdapter: StorageAdapter,
    userId?: string
): Promise<number> {
    if (!userId) return 0;
    const today = new Date().toDateString();
    const stored = await storageAdapter.getItem(`roommate_requests_${userId}`);

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
export async function incrementDailyRequestCount(
    storageAdapter: StorageAdapter,
    userId: string
): Promise<number> {
    const today = new Date().toDateString();
    const current = await getDailyRequestCount(storageAdapter, userId);
    const newCount = current + 1;

    await storageAdapter.setItem(`roommate_requests_${userId}`, JSON.stringify({
        date: today,
        count: newCount,
    }));

    return newCount;
}

/**
 * Check if user can send more requests
 */
export async function canSendMoreRequests(
    storageAdapter: StorageAdapter,
    userId?: string
): Promise<boolean> {
    const count = await getDailyRequestCount(storageAdapter, userId);
    return count < DAILY_REQUEST_LIMIT;
}

/**
 * Get remaining limits
 */
export async function getRemainingLimits(
    storageAdapter: StorageAdapter,
    userId?: string
): Promise<{
    views: number;
    requests: number;
    viewLimit: number;
    requestLimit: number;
}> {
    const views = await getDailyViewCount(storageAdapter, userId);
    const requests = await getDailyRequestCount(storageAdapter, userId);
    return {
        views: DAILY_VIEW_LIMIT - views,
        requests: DAILY_REQUEST_LIMIT - requests,
        viewLimit: DAILY_VIEW_LIMIT,
        requestLimit: DAILY_REQUEST_LIMIT,
    };
}
