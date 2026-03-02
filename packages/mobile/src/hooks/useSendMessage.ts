import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendChatMessage } from '@roomz/shared';

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

interface SendMessageVariables {
    conversationId: string;
    content: string;
}

interface UseSendMessageReturn {
    sendMessage: (variables: SendMessageVariables) => void;
    isPending: boolean;
    error: Error | null;
}

const TEMP_ID_PREFIX = 'temp_';

function createTempMessage(content: string, userId: string): MessageWithSender {
    const now = new Date().toISOString();

    return {
        id: `${TEMP_ID_PREFIX}${Date.now()}`,
        conversation_id: '',
        sender_id: userId,
        content,
        created_at: now,
        updated_at: null,
        is_read: true,
    };
}

export function useSendMessage(): UseSendMessageReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const mutation = useMutation({
        mutationFn: async ({ conversationId, content }: SendMessageVariables) => {
            if (!userId) throw new Error('User not authenticated');
            return sendChatMessage(supabase, conversationId, content, userId);
        },

        onMutate: async ({ conversationId, content }) => {
            if (!userId) return;

            const queryKey = ['messages', conversationId];
            await queryClient.cancelQueries({ queryKey });

            const previousMessages = queryClient.getQueryData<MessageWithSender[]>(queryKey);
            const tempMessage = createTempMessage(content, userId);

            queryClient.setQueryData<MessageWithSender[]>(queryKey, (old) => {
                if (!old) return [tempMessage];
                return [...old, tempMessage];
            });

            return { previousMessages, tempId: tempMessage.id, queryKey };
        },

        onSuccess: (data, _variables, context) => {
            if (!context) return;

            queryClient.setQueryData<MessageWithSender[]>(context.queryKey, (old) => {
                if (!old) return [data as MessageWithSender];
                return old.map((msg) =>
                    msg.id === context.tempId ? (data as MessageWithSender) : msg
                );
            });
        },

        onError: (_error, _variables, context) => {
            if (!context?.previousMessages) return;

            queryClient.setQueryData(context.queryKey, context.previousMessages);
        },

        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['messages', variables.conversationId],
            });
            queryClient.invalidateQueries({
                queryKey: ['conversations', userId],
            });
        },
    });

    return {
        sendMessage: mutation.mutate,
        isPending: mutation.isPending,
        error: mutation.error,
    };
}
