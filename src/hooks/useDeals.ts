/**
 * TanStack Query Hooks for Deals
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as dealsService from '@/services/deals';
import type { DealFilters } from '@/services/deals';

// ============================================
// Query Key Factory
// ============================================

export const dealKeys = {
    all: ['deals'] as const,
    lists: () => [...dealKeys.all, 'list'] as const,
    list: (filters: DealFilters) => [...dealKeys.lists(), filters] as const,
    details: () => [...dealKeys.all, 'detail'] as const,
    detail: (id: string) => [...dealKeys.details(), id] as const,
    myVouchers: () => [...dealKeys.all, 'myVouchers'] as const,
};

// ============================================
// Deal Queries
// ============================================

/**
 * Get deals with optional filters
 */
export function useDeals(filters: DealFilters = {}, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: dealKeys.list(filters),
        queryFn: () => dealsService.getDeals(filters),
        enabled: options?.enabled ?? true,
    });
}

/**
 * Get single deal by ID
 */
export function useDeal(dealId: string) {
    return useQuery({
        queryKey: dealKeys.detail(dealId),
        queryFn: () => dealsService.getDealById(dealId),
        enabled: !!dealId,
    });
}

// ============================================
// Voucher Queries
// ============================================

/**
 * Get current user's saved vouchers
 */
export function useMyVouchers() {
    return useQuery({
        queryKey: dealKeys.myVouchers(),
        queryFn: () => dealsService.getMyVouchers(),
        // Only run if user is authenticated (handled in service)
        retry: false,
    });
}

// ============================================
// Mutations
// ============================================

/**
 * Save a voucher (claim a deal)
 */
export function useSaveVoucher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dealId: string) => dealsService.saveVoucher(dealId),
        onSuccess: () => {
            // Invalidate my vouchers cache
            queryClient.invalidateQueries({ queryKey: dealKeys.myVouchers() });
        },
    });
}

/**
 * Delete a saved voucher
 */
export function useDeleteVoucher() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dealId: string) => dealsService.deleteVoucher(dealId),
        onSuccess: () => {
            // Invalidate my vouchers cache
            queryClient.invalidateQueries({ queryKey: dealKeys.myVouchers() });
        },
    });
}

/**
 * Check if user has saved a specific deal
 */
export function useHasVoucher(dealId: string) {
    return useQuery({
        queryKey: ['hasVoucher', dealId] as const,
        queryFn: () => dealsService.hasSavedVoucher(dealId),
        enabled: !!dealId,
        retry: false,
    });
}

// ============================================
// Deal Admin Mutations
// ============================================

/**
 * Create a new deal
 */
export function useCreateDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: dealsService.CreateDealInput) => dealsService.createDeal(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
        },
    });
}

/**
 * Update an existing deal
 */
export function useUpdateDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<dealsService.Deal> }) =>
            dealsService.updateDeal(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
        },
    });
}

/**
 * Delete a deal
 */
export function useDeleteDeal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dealsService.deleteDeal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
        },
    });
}

/**
 * Toggle deal active status
 */
export function useToggleDealActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dealsService.toggleDealActive(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
        },
    });
}
