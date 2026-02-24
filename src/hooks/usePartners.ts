/**
 * TanStack Query Hooks for Partners
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as partnersService from '@/services/partners';
import type { PartnerFilters } from '@/services/partners';

// Query key factory
export const partnerKeys = {
    all: ['partners'] as const,
    lists: () => [...partnerKeys.all, 'list'] as const,
    list: (filters: PartnerFilters) => [...partnerKeys.lists(), filters] as const,
    details: () => [...partnerKeys.all, 'detail'] as const,
    detail: (id: string) => [...partnerKeys.details(), id] as const,
};

/**
 * Get partners with optional filters
 */
export function usePartners(filters: PartnerFilters = {}) {
    return useQuery({
        queryKey: partnerKeys.list(filters),
        queryFn: () => partnersService.getPartners(filters),
    });
}

/**
 * Get partners by category
 */
export function usePartnersByCategory(category: string) {
    return useQuery({
        queryKey: partnerKeys.list({ category }),
        queryFn: () => partnersService.getPartners({ category }),
        enabled: !!category,
    });
}

// ============================================
// Partner Mutations
// ============================================

/**
 * Toggle partner status (active <-> inactive)
 */
export function useTogglePartnerStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => partnersService.togglePartnerStatus(id),
        onSuccess: () => {
            // Invalidate all partner queries
            queryClient.invalidateQueries({ queryKey: partnerKeys.all });
        },
    });
}

/**
 * Delete a partner
 */
export function useDeletePartner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => partnersService.deletePartner(id),
        onSuccess: () => {
            // Invalidate all partner queries
            queryClient.invalidateQueries({ queryKey: partnerKeys.all });
        },
    });
}
