/**
 * useCommunity Hook (TanStack Query)
 * useInfiniteQuery for paginated feed, useQuery for detail, useMutation for actions.
 * Query key factory for proper invalidation.
 */

import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData, type InfiniteData } from '@tanstack/react-query';
import {
    getPosts,
    getPostById,
    getTopPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    checkIfLiked,
    getComments,
    createComment,
    deleteComment,
    reportPost,
    type PostRow,
} from '@/services/community';
import { uploadMultipleCommunityImages } from '@/services/communityImages';
import { useAuth } from '@/contexts/AuthContext';
import type { PostsFilter, CreatePostData, Comment } from '@/pages/community/types';

const PAGE_SIZE = 10;
type CommunityFeedPage = { posts: PostRow[]; totalCount: number };
type CommunityFeedData = InfiniteData<CommunityFeedPage>;

/** Query key factory for community */
export const communityKeys = {
    all: ['community'] as const,
    feed: (filters: PostsFilter) => ['community', 'feed', filters] as const,
    detail: (id: string) => ['community', 'detail', id] as const,
    topPosts: () => ['community', 'topPosts'] as const,
    comments: (postId: string) => ['community', 'comments', postId] as const,
    liked: (postId: string, userId: string) => ['community', 'liked', postId, userId] as const,
};

/**
 * Hook to get paginated posts feed with infinite scroll
 */
export function usePosts(filters: PostsFilter = {}) {
    const { user } = useAuth();

    const query = useInfiniteQuery<CommunityFeedPage>({
        queryKey: communityKeys.feed(filters),
        queryFn: ({ pageParam = 1 }) =>
            getPosts({ ...filters, page: pageParam as number, pageSize: PAGE_SIZE, userId: user?.id }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const loaded = allPages.length * PAGE_SIZE;
            return loaded < lastPage.totalCount ? allPages.length + 1 : undefined;
        },
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });

    // Flatten all pages into a single posts array
    const posts = useMemo(
        () => query.data?.pages.flatMap((p) => p.posts) ?? [],
        [query.data?.pages],
    );
    const totalCount = query.data?.pages[0]?.totalCount ?? 0;

    return {
        posts,
        totalCount,
        isLoading: query.isLoading,
        isFetchingNextPage: query.isFetchingNextPage,
        error: query.error,
        refetch: query.refetch,
        hasNextPage: query.hasNextPage ?? false,
        fetchNextPage: query.fetchNextPage,
    };
}

/**
 * Hook to get a single post by ID
 */
export function usePost(id: string | undefined) {
    return useQuery<PostRow | null>({
        queryKey: communityKeys.detail(id!),
        queryFn: () => getPostById(id!),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/**
 * Hook to get top posts for sidebar
 */
export function useTopPosts(limit: number = 5) {
    return useQuery<PostRow[]>({
        queryKey: communityKeys.topPosts(),
        queryFn: () => getTopPosts(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to create a new post
 */
export function useCreatePost() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ data, imageFiles }: { data: CreatePostData; imageFiles?: File[] }) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập để đăng bài');
            }

            // Upload images if provided
            let imageUrls: string[] = [];
            if (imageFiles && imageFiles.length > 0) {
                imageUrls = await uploadMultipleCommunityImages(user.id, imageFiles);
            }

            // Create post with image URLs
            return createPost(user.id, data, imageUrls);
        },
        onSuccess: () => {
            // Invalidate feed to refetch
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        },
    });
}

/**
 * Hook to update an existing post
 */
export function useUpdatePost() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ postId, data, imageFiles, existingImages }: {
            postId: string;
            data: Partial<CreatePostData>;
            imageFiles?: File[];
            existingImages?: string[];
        }) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập để chỉnh sửa bài viết');
            }

            let imageUrls: string[] | undefined;

            if (imageFiles !== undefined || existingImages !== undefined) {
                const existing = existingImages || [];
                let newUrls: string[] = [];
                if (imageFiles && imageFiles.length > 0) {
                    newUrls = await uploadMultipleCommunityImages(user.id, imageFiles);
                }
                imageUrls = [...existing, ...newUrls];
            }

            return updatePost(postId, user.id, data, imageUrls);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        },
    });
}

/**
 * Hook to delete a post
 */
export function useDeletePost() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (postId: string) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập');
            }
            return deletePost(postId, user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        },
    });
}

/**
 * Hook to toggle like on a post (with optimistic update)
 */
export function useToggleLike() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (postId: string) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập để thích bài viết');
            }
            return toggleLike(postId, user.id);
        },
        onMutate: async (postId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: communityKeys.all });

            // Snapshot the previous value
            const previousPosts = queryClient.getQueryData(communityKeys.feed({}));

            // Optimistically update the like count
            queryClient.setQueriesData(
                { queryKey: communityKeys.all },
                (old: CommunityFeedData | undefined) => {
                    if (!old) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            posts: page.posts.map((post) =>
                                post.id === postId
                                    ? {
                                        ...post,
                                        liked: !post.liked,
                                        likes_count: post.liked
                                            ? post.likes_count - 1
                                            : post.likes_count + 1,
                                    }
                                    : post
                            ),
                        })),
                    };
                }
            );

            return { previousPosts };
        },
        onError: (_err, _postId, context) => {
            // Rollback on error
            if (context?.previousPosts) {
                queryClient.setQueryData(communityKeys.feed({}), context.previousPosts);
            }
        },
        onSettled: () => {
            // Invalidate to ensure sync
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        },
    });
}

/**
 * Hook to get comments for a post
 */
export function useComments(postId: string | undefined) {
    return useQuery<Comment[]>({
        queryKey: communityKeys.comments(postId!),
        queryFn: () => getComments(postId!),
        enabled: !!postId,
        staleTime: 30_000,
    });
}

/**
 * Hook to create a comment
 */
export function useCreateComment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            postId,
            content,
            parentId,
        }: {
            postId: string;
            content: string;
            parentId?: string;
        }) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập để bình luận');
            }
            return createComment(postId, user.id, content, parentId);
        },
        onSuccess: (_, variables) => {
            // Invalidate comments and post detail
            queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
            queryClient.invalidateQueries({ queryKey: communityKeys.detail(variables.postId) });
        },
    });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ commentId }: { commentId: string; postId: string }) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập');
            }
            return deleteComment(commentId, user.id);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: communityKeys.comments(variables.postId) });
            queryClient.invalidateQueries({ queryKey: communityKeys.detail(variables.postId) });
        },
    });
}

/**
 * Hook to report a post
 */
export function useReportPost() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
            if (!user) {
                throw new Error('Vui lòng đăng nhập để báo cáo');
            }
            return reportPost(postId, user.id, reason);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: communityKeys.all });
        },
    });
}

/**
 * Hook to check if user liked a post
 */
export function useCheckIfLiked(postId: string | undefined) {
    const { user } = useAuth();

    return useQuery<boolean>({
        queryKey: communityKeys.liked(postId!, user?.id || ''),
        queryFn: () => checkIfLiked(postId!, user!.id),
        enabled: !!postId && !!user,
        staleTime: 60_000,
    });
}
