import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    getChatConversations,
    subscribeToUserMessages,
} from '@roomz/shared';

interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
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

interface Conversation {
    id: string;
    participant: UserInfo;
    lastMessage: Message | null;
    unreadCount: number;
    createdAt?: string;
    updatedAt?: string;
}

interface UseConversationsReturn {
    conversations: Conversation[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useConversations(): UseConversationsReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User not authenticated');
            return getChatConversations(supabase, userId);
        },
        enabled: !!userId,
        staleTime: 30_000,
    });

    useEffect(() => {
        if (!userId) return;

        const subscription = subscribeToUserMessages(
            supabase,
            userId,
            {
                onNewMessage: () => {
                    queryClient.invalidateQueries({
                        queryKey: ['conversations', userId],
                    });
                },
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [userId, queryClient]);

    return {
        conversations: data ?? [],
        isLoading,
        error,
        refetch,
    };
}
