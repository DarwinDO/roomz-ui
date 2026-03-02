import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    getPostById,
    getComments,
    addComment,
    type CommunityPost,
    type CommunityComment,
} from '@roomz/shared';

export function usePostDetail(postId: string | undefined) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    // Fetch post detail
    const {
        data: post,
        isLoading,
        error: postError,
        refetch: refetchPost,
    } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            if (!postId) throw new Error('Post ID required');
            return getPostById(supabase, postId);
        },
        enabled: !!postId,
        staleTime: 60_000,
    });

    // Fetch comments
    const {
        data: comments,
        isLoading: isCommentsLoading,
        error: commentsError,
        refetch: refetchComments,
    } = useQuery({
        queryKey: ['post-comments', postId],
        queryFn: async () => {
            if (!postId) throw new Error('Post ID required');
            return getComments(supabase, postId);
        },
        enabled: !!postId,
        staleTime: 30_000,
    });

    // Add comment mutation with optimistic update
    const addCommentMutation = useMutation({
        mutationFn: async ({
            content,
            parentId,
        }: {
            content: string;
            parentId?: string;
        }) => {
            if (!postId) throw new Error('Post ID required');
            if (!userId) throw new Error('User not authenticated');
            return addComment(supabase, postId, userId, content, parentId);
        },

        onMutate: async ({ content, parentId }) => {
            if (!postId || !userId) return;

            const queryKey = ['post-comments', postId];
            await queryClient.cancelQueries({ queryKey });

            const previousComments = queryClient.getQueryData<CommunityComment[]>(queryKey);

            // Create optimistic comment
            const userMetadata = user?.user_metadata || {};
            const optimisticComment: CommunityComment = {
                id: `temp_${Date.now()}`,
                post_id: postId,
                user_id: userId,
                parent_id: parentId || null,
                content,
                upvotes: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                author: {
                    id: userId,
                    full_name: userMetadata.full_name || 'You',
                    avatar_url: userMetadata.avatar_url || null,
                },
            };

            queryClient.setQueryData<CommunityComment[]>(queryKey, (old) => {
                if (!old) return [optimisticComment];
                return [...old, optimisticComment];
            });

            return { previousComments, optimisticId: optimisticComment.id, queryKey };
        },

        onSuccess: (data, _variables, context) => {
            if (!context) return;

            // Replace optimistic comment with real one
            queryClient.setQueryData<CommunityComment[]>(context.queryKey, (old) => {
                if (!old) return [data];
                return old.map((comment) =>
                    comment.id === context.optimisticId ? data : comment
                );
            });
        },

        onError: (_error, _variables, context) => {
            if (!context?.previousComments) return;

            // Rollback on error
            queryClient.setQueryData(context.queryKey, context.previousComments);
        },

        onSettled: () => {
            // Invalidate comments and post queries
            if (postId) {
                queryClient.invalidateQueries({
                    queryKey: ['post-comments', postId],
                });
                queryClient.invalidateQueries({
                    queryKey: ['post', postId],
                });
                // Invalidate community posts to update comment count
                queryClient.invalidateQueries({
                    queryKey: ['community-posts'],
                });
            }
        },
    });

    return {
        post: post ?? null,
        isLoading,
        error: postError,
        refetch: refetchPost,
        comments: comments ?? [],
        isCommentsLoading,
        commentsError,
        refetchComments,
        addComment: addCommentMutation.mutate,
        isAddingComment: addCommentMutation.isPending,
        addCommentError: addCommentMutation.error,
    };
}
