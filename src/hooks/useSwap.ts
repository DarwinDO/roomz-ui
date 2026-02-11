/**
 * useSwap Hook (TanStack Query)
 * Server state management for swap requests and matches
 * Following patterns from useRooms.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchSwapMatches,
    fetchSwapRequests,
    fetchSwapRequestById,
    createSwapRequest,
    respondToSwapRequest,
    cancelSwapRequest,
    swipeMatch,
} from '@/services/swap';
import { toast } from 'sonner';
import type {
    SwapRequest,
    SwapMatch,
    CreateSwapRequest,
    RespondToSwapRequest,
    SwapMatchResponse,
} from '@/types/swap';

// ============================================
// Query Key Factory
// ============================================

export const swapKeys = {
    all: ['swap'] as const,
    matches: () => [...swapKeys.all, 'matches'] as const,
    matchList: (minScore: number) => [...swapKeys.matches(), minScore] as const,
    requests: () => [...swapKeys.all, 'requests'] as const,
    requestList: (status?: string) => [...swapKeys.requests(), status || 'all'] as const,
    requestDetail: (id: string) => [...swapKeys.requests(), 'detail', id] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to fetch swap matches for current user
 */
export function useSwapMatches(minScore: number = 60) {
    return useQuery<SwapMatchResponse>({
        queryKey: swapKeys.matchList(minScore),
        queryFn: () => fetchSwapMatches(minScore),
        staleTime: 5 * 60_000,
        refetchInterval: 5 * 60_000,
    });
}

/**
 * Hook to fetch swap requests for current user
 */
export function useSwapRequests(status?: string) {
    return useQuery<SwapRequest[]>({
        queryKey: swapKeys.requestList(status),
        queryFn: () => fetchSwapRequests(status),
        staleTime: 10_000,
    });
}

/**
 * Hook to fetch a single swap request by ID
 */
export function useSwapRequest(id: string | undefined) {
    return useQuery<SwapRequest | null>({
        queryKey: swapKeys.requestDetail(id || ''),
        queryFn: () => fetchSwapRequestById(id!),
        enabled: !!id,
        staleTime: 30_000,
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a swap request
 */
export function useCreateSwapRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSwapRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: swapKeys.requests() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message || 'Không thể tạo yêu cầu hoán đổi.' });
        },
    });
}

/**
 * Hook to respond to a swap request (accept/reject)
 */
export function useRespondToSwapRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            requestId,
            response,
        }: {
            requestId: string;
            response: RespondToSwapRequest;
        }) => respondToSwapRequest(requestId, response),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: swapKeys.requestDetail(variables.requestId),
            });
            queryClient.invalidateQueries({ queryKey: swapKeys.requests() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message || 'Không thể phản hồi yêu cầu.' });
        },
    });
}

/**
 * Hook to cancel a swap request
 */
export function useCancelSwapRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelSwapRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: swapKeys.requests() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message || 'Không thể hủy yêu cầu.' });
        },
    });
}

/**
 * Hook to swipe on a match (like/pass)
 */
export function useSwipeMatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ matchId, direction }: { matchId: string; direction: 'like' | 'pass' }) =>
            swipeMatch(matchId, direction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: swapKeys.matches() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message || 'Không thể cập nhật.' });
        },
    });
}

// ============================================
// Cache Invalidation Helpers
// ============================================

export function useInvalidateSwap() {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: swapKeys.all }),
        invalidateMatches: () =>
            queryClient.invalidateQueries({ queryKey: swapKeys.matches() }),
        invalidateRequests: () =>
            queryClient.invalidateQueries({ queryKey: swapKeys.requests() }),
        invalidateRequestDetail: (id: string) =>
            queryClient.invalidateQueries({ queryKey: swapKeys.requestDetail(id) }),
    };
}
