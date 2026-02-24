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
export function useDeals(filters: DealFilters = {}) {
    return useQuery({
        queryKey: dealKeys.list(filters),
        queryFn: () => dealsService.getDeals(filters),
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
