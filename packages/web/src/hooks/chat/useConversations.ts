/**
 * useConversations Hook
 * TanStack Query hook for conversation list with realtime sync
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import {
    getConversations,
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
    const { user, session, loading } = useAuth();
    const isRealtimeReady = !loading && !!user?.id && !!session?.access_token;

    // Fetch conversations
    const {
        data: conversations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: conversationKeys.list(user?.id || ''),
        queryFn: () => getConversations(user!.id),
        enabled: isRealtimeReady,
        staleTime: 10 * 1000,
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });

    const unreadCount = conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
    );

    return {
        conversations,
        isLoading,
        error: error as Error | null,
        unreadCount,
        refetch,
    };
}
