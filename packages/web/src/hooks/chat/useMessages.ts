/**
 * useMessages Hook
 * TanStack Query hook for messages with realtime sync and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/contexts';
import {
    getMessages,
    sendMessage as sendMessageApi,
    markMessagesAsRead,
    type MessageWithSender,
} from '@/services/chat';
import { conversationKeys } from './useConversations';

// Query keys
export const messageKeys = {
    all: ['messages'] as const,
    conversation: (conversationId: string) => [...messageKeys.all, conversationId] as const,
};

interface UseMessagesResult {
    messages: MessageWithSender[];
    isLoading: boolean;
    error: Error | null;
    sendMessage: (content: string) => Promise<void>;
    markAsRead: () => Promise<void>;
    refetch: () => void;
    isSending: boolean;
}

/**
 * Hook for messages in a specific conversation with realtime
 */
export function useMessages(conversationId: string): UseMessagesResult {
    const { user, profile, session, loading } = useAuth();
    const queryClient = useQueryClient();
    const isRealtimeReady = !loading && !!user?.id && !!session?.access_token;

    // Fetch messages
    const {
        data: messages = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: messageKeys.conversation(conversationId),
        queryFn: () => getMessages(conversationId),
        enabled: !!conversationId && isRealtimeReady,
        staleTime: 5 * 1000,
        gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
        refetchInterval: 8 * 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (content: string) => sendMessageApi(conversationId, content, user!.id),
        onSuccess: (newMessage) => {
            // Add message to cache
            queryClient.setQueryData<MessageWithSender[]>(
                messageKeys.conversation(conversationId),
                (old = []) => {
                    // Avoid duplicates
                    if (old.some(m => m.id === newMessage.id)) return old;
                    return [
                        ...old,
                        {
                            ...newMessage,
                            sender: {
                                id: user!.id,
                                full_name: profile?.full_name || 'You',
                                avatar_url: profile?.avatar_url ?? null,
                            },
                        },
                    ];
                }
            );

            // Update conversation list (move to top, update lastMessage)
            queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        },
        onError: (err) => {
            console.error('[useMessages] Send error:', err);
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: () => markMessagesAsRead(conversationId, user!.id),
        onSuccess: () => {
            // Update local message state
            queryClient.setQueryData<MessageWithSender[]>(
                messageKeys.conversation(conversationId),
                (old = []) => old.map(m =>
                    m.sender_id !== user?.id ? { ...m, is_read: true } : m
                )
            );

            // Update unread count in conversations
            queryClient.invalidateQueries({
                queryKey: conversationKeys.unreadCount(user!.id)
            });
        },
    });

    // Wrapped send function
    const handleSend = useCallback(async (content: string) => {
        if (!content.trim()) return;
        await sendMutation.mutateAsync(content);
    }, [sendMutation]);

    // Wrapped mark as read
    const handleMarkAsRead = useCallback(async () => {
        if (!user) return;
        await markAsReadMutation.mutateAsync();
    }, [user, markAsReadMutation]);

    return {
        messages,
        isLoading,
        error: error as Error | null,
        sendMessage: handleSend,
        markAsRead: handleMarkAsRead,
        refetch,
        isSending: sendMutation.isPending,
    };
}
