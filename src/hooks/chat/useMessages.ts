/**
 * useMessages Hook
 * TanStack Query hook for messages with realtime sync and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts';
import {
    getMessages,
    sendMessage as sendMessageApi,
    markMessagesAsRead,
    subscribeToConversationMessages,
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
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    // Fetch messages
    const {
        data: messages = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: messageKeys.conversation(conversationId),
        queryFn: () => getMessages(conversationId),
        enabled: !!conversationId,
        staleTime: 0, // Always fresh for active chat
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (content: string) => sendMessageApi(conversationId, content),
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

    // Realtime subscription for this conversation
    useEffect(() => {
        if (!conversationId || !user) return;

        const subscription = subscribeToConversationMessages(conversationId, {
            onNewMessage: (message) => {
                // Add to cache (avoid duplicates)
                queryClient.setQueryData<MessageWithSender[]>(
                    messageKeys.conversation(conversationId),
                    (old = []) => {
                        if (old.some(m => m.id === message.id)) return old;
                        return [...old, message];
                    }
                );
            },
            onMessageUpdate: (message) => {
                // Update message in cache (e.g., read status)
                queryClient.setQueryData<MessageWithSender[]>(
                    messageKeys.conversation(conversationId),
                    (old = []) => old.map(m =>
                        m.id === message.id ? { ...m, ...message } : m
                    )
                );
            },
            onError: (err) => {
                console.error('[useMessages] Realtime error:', err);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, user, queryClient]);

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
