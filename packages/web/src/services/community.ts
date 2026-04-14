/**
 * Community API Service
 * CRUD operations for community posts, comments, likes, and reports
 */

import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/lib/database.types';
import type { Comment, CreatePostData, PostsFilter } from '@/pages/community/types';

export interface PostRow {
    id: string;
    user_id: string;
    type: string;
    title: string;
    content: string;
    images: string[];
    likes_count: number;
    comments_count: number;
    status: string;
    created_at: string;
    updated_at: string;
    author: {
        id: string;
        name: string;
        role: string;
        avatar?: string;
        verified?: boolean;
        isPremium?: boolean;
    };
    liked?: boolean;
}

interface PostsResponse {
    posts: PostRow[];
    totalCount: number;
}

// Type for Supabase response
type CommunityPost = {
    id: string;
    user_id: string;
    type: string;
    title: string;
    content: string;
    images: string[] | null;
    likes_count: number | null;
    comments_count: number | null;
    status: string;
    created_at: string | null;
    updated_at: string | null;
    author?: {
        id: string;
        full_name: string | null;
        role: string | null;
        avatar_url: string | null;
        email_verified: boolean | null;
        is_premium: boolean | null;
    };
};

type CommunityComment = {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    parent_id: string | null;
    created_at: string | null;
    status: string;
    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean | null;
    };
};

/**
 * Helper: Transform CommunityPost (DB row) to PostRow (app type)
 * Eliminates DRY violation - single source of truth for transformation
 */
function transformCommunityPost(row: CommunityPost, liked: boolean = false): PostRow {
    return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        title: row.title,
        content: row.content,
        images: row.images || [],
        likes_count: row.likes_count || 0,
        comments_count: row.comments_count || 0,
        status: row.status,
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
        author: {
            id: row.author?.id || row.user_id,
            name: row.author?.full_name || 'Unknown',
            role: row.author?.role || 'Người dùng',
            avatar: row.author?.avatar_url || undefined,
            verified: row.author?.email_verified || false,
            isPremium: row.author?.is_premium ?? false,
        },
        liked,
    };
}

async function getLikedPostMap(postIds: string[], userId?: string) {
    const likedMap: Record<string, boolean> = {};

    if (!userId || postIds.length === 0) {
        return likedMap;
    }

    const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

    if (likes) {
        likes.forEach((like: { post_id: string }) => {
            likedMap[like.post_id] = true;
        });
    }

    return likedMap;
}

/**
 * Get paginated posts feed with author info
 * @param filters - Filter options including optional userId to check liked status
 */
export async function getPosts(filters: PostsFilter = {}): Promise<PostsResponse> {
    const { type, page = 1, pageSize = 10, searchQuery, userId } = filters;

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (type) {
        query = query.eq('type', type);
    }

    const normalizedQuery = searchQuery?.trim();
    if (normalizedQuery) {
        query = query.or(`title.ilike.%${normalizedQuery}%,content.ilike.%${normalizedQuery}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const likedMap = await getLikedPostMap(
        ((data || []) as CommunityPost[]).map((row) => row.id),
        userId,
    );

    const posts = (data || []).map((row: CommunityPost) =>
        transformCommunityPost(row, !!likedMap[row.id])
    );

    return {
        posts,
        totalCount: count || 0,
    };
}

/**
 * Get a single post by ID with author and comments
 */
export async function getPostById(id: string, userId?: string): Promise<PostRow | null> {
    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    const likedMap = await getLikedPostMap([id], userId);

    return transformCommunityPost(data as CommunityPost, !!likedMap[id]);
}

/**
 * Get top posts by likes (for sidebar)
 */
export async function getTopPosts(limit: number = 5): Promise<PostRow[]> {
    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
        `)
        .eq('status', 'active')
        .order('likes_count', { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map((row: CommunityPost) => transformCommunityPost(row));
}

/**
 * Create a new post
 */
export async function createPost(
    userId: string,
    data: CreatePostData,
    imageUrls: string[] = []
): Promise<PostRow> {
    const postData = {
        user_id: userId,
        type: data.type,
        title: data.title,
        content: data.content,
        images: imageUrls,
    };

    const { data: post, error } = await supabase
        .from('community_posts')
        .insert(postData)
        .select(`
            *,
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
        `)
        .single();

    if (error) throw error;

    return transformCommunityPost(post as CommunityPost);
}

/**
 * Update a post (only by owner)
 */
export async function updatePost(
    postId: string,
    userId: string,
    data: Partial<CreatePostData>,
    imageUrls?: string[]
): Promise<PostRow> {
    const updateData: TablesUpdate<'community_posts'> = {
        updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.type !== undefined) updateData.type = data.type;
    if (imageUrls !== undefined) updateData.images = imageUrls;

    const { data: post, error } = await supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', userId)
        .select(`
            *,
            author:users!community_posts_user_id_fkey(
                id,
                full_name,
                role,
                avatar_url,
                email_verified,
                is_premium
            )
        `)
        .single();

    if (error) throw error;

    return transformCommunityPost(post as CommunityPost);
}

/**
 * Delete a post (only by owner)
 */
export async function deletePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Toggle like on a post (atomic - race condition safe)
 * Returns true if liked, false if unliked
 * 
 * Uses insert-first strategy: try insert, if conflict (already liked) → delete
 * This avoids the check-then-act race condition on double-click
 */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
    // Try to insert (like)
    const { error: insertError } = await supabase
        .from('community_likes')
        .insert({ post_id: postId, user_id: userId });

    if (!insertError) {
        // Insert succeeded → liked
        return true;
    }

    // Check if error is unique violation (already liked)
    if (insertError.code === '23505') {
        // Already liked → delete (unlike)
        const { error: deleteError } = await supabase
            .from('community_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (deleteError) throw deleteError;
        return false;
    }

    // Other error → throw
    throw insertError;
}

/**
 * Check if user has liked a post
 */
export async function checkIfLiked(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('community_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    return !!data;
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            *,
            author:users!community_comments_user_id_fkey(
                id,
                full_name,
                avatar_url,
                is_premium
            )
        `)
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Build nested comment structure
    const comments = (data || []).map((row: CommunityComment) => ({
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        content: row.content,
        parent_id: row.parent_id,
        created_at: row.created_at ?? new Date().toISOString(),
        author: {
            name: row.author?.full_name || 'Unknown',
            avatar: row.author?.avatar_url || undefined,
            isPremium: row.author?.is_premium ?? false,
        },
    })) as Comment[];

    // Organize into tree structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
        const current = commentMap.get(comment.id)!;
        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies = parent.replies || [];
                parent.replies.push(current);
            } else {
                rootComments.push(current);
            }
        } else {
            rootComments.push(current);
        }
    });

    return rootComments;
}

/**
 * Create a comment
 */
export async function createComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string
): Promise<Comment> {
    const commentData = {
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId || null,
    };

    const { data, error } = await supabase
        .from('community_comments')
        .insert(commentData)
        .select(`
            *,
            author:users!community_comments_user_id_fkey(
                id,
                full_name,
                avatar_url,
                is_premium
            )
        `)
        .single();

    if (error) throw error;

    const row = data as CommunityComment;
    return {
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        content: row.content,
        parent_id: row.parent_id,
        created_at: row.created_at ?? new Date().toISOString(),
        author: {
            name: row.author?.full_name || 'Unknown',
            avatar: row.author?.avatar_url || undefined,
            isPremium: row.author?.is_premium ?? false,
        },
    } as Comment;
}

/**
 * Delete a comment (only by owner)
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

    if (error) throw error;
}

/**
 * Report a post
 */
export async function reportPost(postId: string, userId: string, reason: string): Promise<void> {
    const { error } = await supabase
        .from('community_reports')
        .insert({
            post_id: postId,
            user_id: userId,
            reason,
        });

    if (error) throw error;
}
