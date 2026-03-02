import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    getChatMessages,
    markChatMessagesAsRead,
    subscribeToConversationMessages,
} from '@roomz/shared';

interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
}

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    updated_at: string | null;
    is_read: boolean;
}

interface MessageWithSender extends Message {
    sender?: UserInfo;
}

interface UseChatMessagesReturn {
    messages: MessageWithSender[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useChatMessages(conversationId: string | undefined): UseChatMessagesReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const queryKey = ['messages', conversationId];

    const markAsRead = useCallback(async () => {
        if (!conversationId || !userId) return;
        await markChatMessagesAsRead(supabase, conversationId, userId);
    }, [conversationId, userId]);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!conversationId) throw new Error('Conversation ID required');
            return getChatMessages(supabase, conversationId);
        },
        enabled: !!conversationId,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!conversationId || !userId) return;

        markAsRead();
    }, [conversationId, userId, markAsRead]);

    useEffect(() => {
        if (!conversationId || !userId) return;

        const subscription = subscribeToConversationMessages(
            supabase,
            conversationId,
            {
                onNewMessage: (message) => {
                    queryClient.setQueryData<MessageWithSender[]>(
                        queryKey,
                        (old) => {
                            if (!old) return [message];
                            if (old.some((m) => m.id === message.id)) return old;
                            return [...old, message];
                        }
                    );

                    if (message.sender_id !== userId) {
                        markChatMessagesAsRead(supabase, conversationId, userId);
                    }
                },
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, userId, queryClient, queryKey]);

    return {
        messages: data ?? [],
        isLoading,
        error,
        refetch,
    };
}
