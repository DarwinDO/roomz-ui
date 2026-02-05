/**
 * useConversations Hook
 * TanStack Query hook for conversation list with realtime sync
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/contexts';
import {
    getConversations,
    getUnreadCount,
    subscribeToUserMessages,
    subscribeToConversations,
    type Conversation,
} from '@/services/chat';

// Query keys for consistent caching
export const conversationKeys = {
    all: ['conversations'] as const,
    list: (userId: string) => [...conversationKeys.all, 'list', userId] as const,
    unreadCount: (userId: string) => [...conversationKeys.all, 'unread', userId] as const,
};

interface UseConversationsResult {
    conversations: Conversation[];
    isLoading: boolean;
    error: Error | null;
    unreadCount: number;
    refetch: () => void;
}

/**
 * Hook to fetch and cache conversations with realtime updates
 */
export function useConversations(): UseConversationsResult {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch conversations
    const {
        data: conversations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: conversationKeys.list(user?.id || ''),
        queryFn: () => getConversations(user!.id),
        enabled: !!user?.id,
        staleTime: 30 * 1000, // 30 seconds - conversations update frequently
    });

    // Fetch unread count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: conversationKeys.unreadCount(user?.id || ''),
        queryFn: () => getUnreadCount(user!.id),
        enabled: !!user?.id,
        staleTime: 10 * 1000, // 10 seconds
    });

    // Realtime subscription for new messages
    useEffect(() => {
        if (!user?.id) return;

        const subscription = subscribeToUserMessages(user.id, {
            onNewMessage: (message, conversationId) => {
                // Update cache directly (smooth, no flicker)
                queryClient.setQueryData<Conversation[]>(
                    conversationKeys.list(user.id),
                    (old = []) => {
                        const updated = [...old];
                        const index = updated.findIndex(c => c.id === conversationId);

                        if (index >= 0) {
                            // Update existing conversation
                            const isIncoming = message.sender_id !== user.id;
                            updated[index] = {
                                ...updated[index],
                                lastMessage: message,
                                unreadCount: isIncoming
                                    ? updated[index].unreadCount + 1
                                    : updated[index].unreadCount,
                                updatedAt: message.created_at || new Date().toISOString(),
                            };

                            // Move to top
                            const [conv] = updated.splice(index, 1);
                            updated.unshift(conv);
                        }

                        return updated;
                    }
                );

                // Update unread count
                if (message.sender_id !== user.id) {
                    queryClient.setQueryData<number>(
                        conversationKeys.unreadCount(user.id),
                        (old = 0) => old + 1
                    );
                }
            },
            onError: (err) => {
                console.error('[useConversations] Realtime error:', err);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id, queryClient]);

    // Subscribe to new conversations (when roommate request is accepted)
    useEffect(() => {
        if (!user?.id) return;

        const subscription = subscribeToConversations(user.id, {
            onConversationUpdate: () => {
                // Conversation updated - refetch for full data
                queryClient.invalidateQueries({ queryKey: conversationKeys.list(user.id) });
            },
            onNewConversation: () => {
                // New conversation created - refetch
                queryClient.invalidateQueries({ queryKey: conversationKeys.list(user.id) });
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id, queryClient]);

    return {
        conversations,
        isLoading,
        error: error as Error | null,
        unreadCount,
        refetch,
    };
}
