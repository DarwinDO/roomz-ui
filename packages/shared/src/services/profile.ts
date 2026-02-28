/**
 * Profile API Service (Shared)
 * CRUD operations for user profiles
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    city: string | null;
    district: string | null;
    address: string | null;
    bio: string | null;
    university: string | null;
    major: string | null;
    occupation: string | null;
    is_verified: boolean;
    trust_score: number | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get user profile by ID
 */
export async function getProfile(
    supabase: SupabaseClient,
    userId: string
): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return data as UserProfile;
}

/**
 * Update user profile
 */
export async function updateProfile(
    supabase: SupabaseClient,
    userId: string,
    data: Partial<{
        full_name: string;
        phone: string;
        avatar_url: string;
        gender: 'male' | 'female' | 'other';
        date_of_birth: string;
        city: string;
        district: string;
        address: string;
        bio: string;
        university: string;
        major: string;
        occupation: string;
    }>
): Promise<UserProfile> {
    const { data: profile, error } = await supabase
        .from('users')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;

    return profile as UserProfile;
}

/**
 * Update avatar
 */
export async function updateAvatar(
    supabase: SupabaseClient,
    userId: string,
    avatarUrl: string
): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Get user by IDs (batch)
 */
export async function getUsersByIds(
    supabase: SupabaseClient,
    userIds: string[]
): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

    if (error) throw error;

    return (data || []) as UserProfile[];
}

/**
 * Search users
 */
export async function searchUsers(
    supabase: SupabaseClient,
    query: string
): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

    if (error) throw error;

    return (data || []) as UserProfile[];
}
