import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { getUnreadCount, subscribeToUserMessages } from '@/services/chat';
import { conversationKeys } from './useConversations';

interface UseUnreadConversationCountResult {
    unreadCount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useUnreadConversationCount(): UseUnreadConversationCountResult {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const {
        data: unreadCount = 0,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: conversationKeys.unreadCount(user?.id || ''),
        queryFn: () => getUnreadCount(user!.id),
        enabled: !!user?.id,
        staleTime: 10 * 1000,
    });

    useEffect(() => {
        if (!user?.id) return;

        const subscription = subscribeToUserMessages(user.id, {
            onNewMessage: (message) => {
                if (message.sender_id === user.id) {
                    return;
                }

                queryClient.setQueryData<number>(
                    conversationKeys.unreadCount(user.id),
                    (old = 0) => old + 1
                );
            },
            onError: (subscriptionError) => {
                console.error('[useUnreadConversationCount] Realtime error:', subscriptionError);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id, queryClient]);

    return {
        unreadCount,
        isLoading,
        error: error as Error | null,
        refetch: () => {
            void refetch();
        },
    };
}
