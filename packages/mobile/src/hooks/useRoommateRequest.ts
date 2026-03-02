import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    sendRoommateRequest,
    respondToRequest,
    incrementDailyRequestCount,
    type RoommateRequest,
} from '@roomz/shared';
import { mobileStorageAdapter } from '../adapters/storageAdapter';

interface SendRequestVariables {
    receiverId: string;
    message?: string;
}

interface RespondRequestVariables {
    requestId: string;
    accept: boolean;
}

interface UseRoommateRequestReturn {
    sendRequest: (variables: SendRequestVariables) => void;
    respondRequest: (variables: RespondRequestVariables) => void;
    isSendingPending: boolean;
    isRespondingPending: boolean;
    sendError: Error | null;
    respondError: Error | null;
}

export function useRoommateRequest(): UseRoommateRequestReturn {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;

    const sendMutation = useMutation({
        mutationFn: async ({ receiverId, message }: SendRequestVariables): Promise<RoommateRequest> => {
            if (!userId) throw new Error('User not authenticated');
            const request = await sendRoommateRequest(supabase, userId, receiverId, message);
            // Increment daily request count after successful send
            await incrementDailyRequestCount(mobileStorageAdapter, userId);
            return request;
        },

        onSuccess: () => {
            // Invalidate sent requests query
            queryClient.invalidateQueries({
                queryKey: ['roommate-requests-sent', userId],
            });
            // Invalidate remaining limits
            queryClient.invalidateQueries({
                queryKey: ['roommate-limits', userId],
            });
        },
    });

    const respondMutation = useMutation({
        mutationFn: async ({ requestId, accept }: RespondRequestVariables): Promise<void> => {
            if (!userId) throw new Error('User not authenticated');
            return respondToRequest(supabase, requestId, accept);
        },

        onMutate: async ({ requestId, accept }) => {
            const queryKey = ['roommate-requests-received', userId];
            await queryClient.cancelQueries({ queryKey });

            const previousRequests = queryClient.getQueryData<RoommateRequest[]>(queryKey);

            // Optimistically update the request status
            queryClient.setQueryData<RoommateRequest[]>(queryKey, (old) => {
                if (!old) return [];
                return old.map((req) =>
                    req.id === requestId
                        ? { ...req, status: accept ? 'accepted' : 'declined' }
                        : req
                );
            });

            return { previousRequests, queryKey };
        },

        onError: (_error, _variables, context) => {
            if (!context?.previousRequests) return;
            queryClient.setQueryData(context.queryKey, context.previousRequests);
        },

        onSettled: () => {
            // Invalidate received requests and matches
            queryClient.invalidateQueries({
                queryKey: ['roommate-requests-received', userId],
            });
            queryClient.invalidateQueries({
                queryKey: ['roommate-matches', userId],
            });
        },
    });

    return {
        sendRequest: sendMutation.mutate,
        respondRequest: respondMutation.mutate,
        isSendingPending: sendMutation.isPending,
        isRespondingPending: respondMutation.isPending,
        sendError: sendMutation.error,
        respondError: respondMutation.error,
    };
}
