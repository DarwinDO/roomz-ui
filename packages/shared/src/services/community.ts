/**
 * Community API Service (Shared)
 * Platform-agnostic service layer for community posts/comments.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type DbCommunityPostType = 'story' | 'offer' | 'qa' | 'tip';
export type LegacyCommunityPostType = 'discussion' | 'question' | 'review' | 'advice' | 'news';
export type CommunityPostType = DbCommunityPostType | LegacyCommunityPostType;
export type CommunityPostStatus = 'active' | 'hidden' | 'reported';

export interface CommunityPost {
    id: string;
    user_id: string;
    type: CommunityPostType;
    title: string;
    content: string;
    images: string[];
    likes_count: number;
    comments_count: number;
    status: CommunityPostStatus;
    created_at: string;
    updated_at: string;

    // Backward-compatible aliases for legacy mobile/web consumers
    category: string;
    tags: string[];
    upvotes: number;
    comment_count: number;
    view_count: number;
    views: number;
    is_pinned: boolean;
    is_locked: boolean;

    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean | null;
    };
}

export interface CommunityComment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    status: string;
    created_at: string;

    // Backward-compatible aliases
    upvotes: number;
    updated_at: string;

    author?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean | null;
    };
}

export interface CommunityFilters {
    type?: CommunityPostType;
    category?: string;
    tags?: string[];
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}

type CommunityPostRow = {
    id: string;
    user_id: string;
    type: DbCommunityPostType;
    title: string;
    content: string;
    images: string[] | null;
    likes_count: number | null;
    comments_count: number | null;
    status: string;
    created_at: string;
    updated_at: string;
    author?: AuthorRow | AuthorRow[] | null;
};

type AuthorRow = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_premium?: boolean | null;
};

type CommunityCommentRow = {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    status: string | null;
    created_at: string;
    author?: AuthorRow | AuthorRow[] | null;
};

function normalizeAuthor(author: AuthorRow | AuthorRow[] | null | undefined): AuthorRow | undefined {
    if (!author) return undefined;
    if (Array.isArray(author)) return author[0];
    return author;
}

const LEGACY_TO_DB_TYPE: Record<LegacyCommunityPostType, DbCommunityPostType> = {
    discussion: 'story',
    question: 'qa',
    review: 'story',
    advice: 'tip',
    news: 'offer',
};

function toDbPostType(type?: string): DbCommunityPostType | null {
    if (!type) return null;

    if (type === 'story' || type === 'offer' || type === 'qa' || type === 'tip') {
        return type;
    }

    return LEGACY_TO_DB_TYPE[type as LegacyCommunityPostType] ?? null;
}

function mapPost(row: CommunityPostRow): CommunityPost {
    const likes = row.likes_count ?? 0;
    const comments = row.comments_count ?? 0;
    const author = normalizeAuthor(row.author);

    return {
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        title: row.title,
        content: row.content,
        images: row.images ?? [],
        likes_count: likes,
        comments_count: comments,
        status: (row.status as CommunityPostStatus) ?? 'active',
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.type,
        tags: [],
        upvotes: likes,
        comment_count: comments,
        view_count: 0,
        views: 0,
        is_pinned: false,
        is_locked: false,
        author: author
            ? {
                id: author.id,
                full_name: author.full_name,
                avatar_url: author.avatar_url,
                is_premium: author.is_premium ?? undefined,
            }
            : undefined,
    };
}

function mapComment(row: CommunityCommentRow): CommunityComment {
    const author = normalizeAuthor(row.author);

    return {
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        parent_id: row.parent_id,
        content: row.content,
        status: row.status ?? 'active',
        created_at: row.created_at,
        upvotes: 0,
        updated_at: row.created_at,
        author: author
            ? {
                id: author.id,
                full_name: author.full_name,
                avatar_url: author.avatar_url,
                is_premium: author.is_premium ?? undefined,
            }
            : undefined,
    };
}

export async function getPosts(
    supabase: SupabaseClient,
    filters: CommunityFilters = {}
): Promise<{ posts: CommunityPost[]; totalCount: number }> {
    let query = supabase
        .from('community_posts')
        .select(
            `
            id,
            user_id,
            type,
            title,
            content,
            images,
            likes_count,
            comments_count,
            status,
            created_at,
            updated_at,
            author:users!community_posts_user_id_fkey(id, full_name, avatar_url, is_premium)
        `,
            { count: 'exact' }
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    const typeFilter = toDbPostType(filters.type);
    if (typeFilter) {
        query = query.eq('type', typeFilter);
    }

    const categoryTypeFilter = toDbPostType(filters.category);
    if (!typeFilter && categoryTypeFilter) {
        query = query.eq('type', categoryTypeFilter);
    }

    const searchQuery = filters.searchQuery?.trim();
    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        posts: ((data || []) as unknown as CommunityPostRow[]).map(mapPost),
        totalCount: count || 0,
    };
}

export async function getPostById(
    supabase: SupabaseClient,
    id: string
): Promise<CommunityPost | null> {
    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            id,
            user_id,
            type,
            title,
            content,
            images,
            likes_count,
            comments_count,
            status,
            created_at,
            updated_at,
            author:users!community_posts_user_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }

    return mapPost(data as unknown as CommunityPostRow);
}

export async function createPost(
    supabase: SupabaseClient,
    data: {
        type: CommunityPostType;
        title: string;
        content: string;
        category?: string;
        tags?: string[];
        images?: string[];
    }
): Promise<CommunityPost> {
    const dbType = toDbPostType(data.type) ?? 'story';

    const { data: post, error } = await supabase
        .from('community_posts')
        .insert({
            type: dbType,
            title: data.title,
            content: data.content,
            images: data.images || [],
            status: 'active',
        })
        .select(`
            id,
            user_id,
            type,
            title,
            content,
            images,
            likes_count,
            comments_count,
            status,
            created_at,
            updated_at,
            author:users!community_posts_user_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .single();

    if (error) throw error;

    return mapPost(post as unknown as CommunityPostRow);
}

export async function updatePost(
    supabase: SupabaseClient,
    id: string,
    data: Partial<{
        type: CommunityPostType;
        title: string;
        content: string;
        category: string;
        tags: string[];
        images: string[];
        status: CommunityPostStatus;
    }>
): Promise<CommunityPost> {
    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.type !== undefined) {
        const dbType = toDbPostType(data.type);
        if (dbType) updateData.type = dbType;
    }

    const { data: post, error } = await supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', id)
        .select(`
            id,
            user_id,
            type,
            title,
            content,
            images,
            likes_count,
            comments_count,
            status,
            created_at,
            updated_at,
            author:users!community_posts_user_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .single();

    if (error) throw error;

    return mapPost(post as unknown as CommunityPostRow);
}

export async function deletePost(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('community_posts')
        .update({ status: 'hidden' })
        .eq('id', id);

    if (error) throw error;
}

export async function upvotePost(
    supabase: SupabaseClient,
    postId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('community_likes')
        .insert({ post_id: postId, user_id: userId });

    if (error && error.code !== '23505') {
        throw error;
    }
}

export async function getComments(
    supabase: SupabaseClient,
    postId: string
): Promise<CommunityComment[]> {
    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            id,
            post_id,
            user_id,
            parent_id,
            content,
            status,
            created_at,
            author:users!community_comments_user_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return ((data || []) as unknown as CommunityCommentRow[]).map(mapComment);
}

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
            id,
            post_id,
            user_id,
            parent_id,
            content,
            status,
            created_at,
            author:users!community_comments_user_id_fkey(id, full_name, avatar_url, is_premium)
        `)
        .single();

    if (error) throw error;

    return mapComment(comment as unknown as CommunityCommentRow);
}

export async function getCategories(
    supabase: SupabaseClient
): Promise<string[]> {
    const { data, error } = await supabase
        .from('community_posts')
        .select('type')
        .eq('status', 'active');

    if (error) throw error;

    const uniqueTypes = Array.from(
        new Set((data || []).map((row: { type: string }) => row.type))
    ).filter(Boolean);

    if (uniqueTypes.length > 0) {
        return uniqueTypes;
    }

    return ['story', 'offer', 'qa', 'tip'];
}
