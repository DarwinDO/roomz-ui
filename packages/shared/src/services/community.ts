/**
 * Community API Service (Shared)
 * CRUD operations for community posts
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface CommunityPost {
    id: string;
    user_id: string;
    type: 'discussion' | 'question' | 'review' | 'advice' | 'news';
    title: string;
    content: string;
    category: string;
    tags: string[];
    images: string[];
    upvotes: number;
    comment_count: number;
    view_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    status: 'draft' | 'published' | 'hidden' | 'deleted';
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface CommunityComment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    upvotes: number;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface CommunityFilters {
    type?: string;
    category?: string;
    tags?: string[];
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all community posts
 */
export async function getPosts(
    supabase: SupabaseClient,
    filters: CommunityFilters = {}
): Promise<{ posts: CommunityPost[]; totalCount: number }> {
    let query = supabase
        .from('community_posts')
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    if (filters.searchQuery) {
        query = query.ilike('title', `%${filters.searchQuery}%`);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        posts: (data || []) as CommunityPost[],
        totalCount: count || 0,
    };
}

/**
 * Get a single post by ID
 */
export async function getPostById(
    supabase: SupabaseClient,
    id: string
): Promise<CommunityPost | null> {
    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    // Increment view count
    supabase.rpc('increment_post_views' as never, { p_post_id: id } as never).then(() => { });

    return data as CommunityPost;
}

/**
 * Create a new post
 */
export async function createPost(
    supabase: SupabaseClient,
    data: {
        type: CommunityPost['type'];
        title: string;
        content: string;
        category: string;
        tags?: string[];
        images?: string[];
    }
): Promise<CommunityPost> {
    const { data: post, error } = await supabase
        .from('community_posts')
        .insert({
            ...data,
            tags: data.tags || [],
            images: data.images || [],
            status: 'published',
        })
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    return post as CommunityPost;
}

/**
 * Update a post
 */
export async function updatePost(
    supabase: SupabaseClient,
    id: string,
    data: Partial<{
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: string[];
        status: CommunityPost['status'];
    }>
): Promise<CommunityPost> {
    const { data: post, error } = await supabase
        .from('community_posts')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    return post as CommunityPost;
}

/**
 * Delete a post
 */
export async function deletePost(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('community_posts')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Upvote a post
 */
export async function upvotePost(
    supabase: SupabaseClient,
    postId: string,
    userId: string
): Promise<void> {
    // Add upvote record
    const { error: upvoteError } = await supabase
        .from('community_upvotes')
        .insert({ post_id: postId, user_id: userId });

    if (upvoteError && upvoteError.code !== '23505') {
        throw upvoteError;
    }

    // Increment count
    await supabase.rpc('increment_post_upvotes' as never, { p_post_id: postId } as never);
}

/**
 * Get comments for a post
 */
export async function getComments(
    supabase: SupabaseClient,
    postId: string
): Promise<CommunityComment[]> {
    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as CommunityComment[];
}

/**
 * Add a comment to a post
 */
export async function addComment(
    supabase: SupabaseClient,
    postId: string,
    userId: string,
    content: string,
    parentId?: string
): Promise<CommunityComment> {
    const { data: comment, error } = await supabase
        .from('community_comments')
        .insert({
            post_id: postId,
            user_id: userId,
            parent_id: parentId || null,
            content,
        })
        .select(`
            *,
            author:users!user_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) throw error;

    // Increment comment count
    await supabase.rpc('increment_post_comments' as never, { p_post_id: postId } as never);

    return comment as CommunityComment;
}

/**
 * Get categories
 */
export async function getCategories(supabase: SupabaseClient): Promise<string[]> {
    const { data, error } = await supabase
        .from('community_categories')
        .select('name')
        .order('name');

    if (error) throw error;

    return (data || []).map(c => c.name);
}
