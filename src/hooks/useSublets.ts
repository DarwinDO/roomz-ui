/**
 * useSublets Hook (TanStack Query)
 * Server state management for sublet listings
 * Following patterns from useRooms.ts
 */

import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import {
    fetchSublets,
    fetchSubletById,
    createSublet,
    updateSublet,
    deleteSublet,
    incrementSubletView,
    createApplication,
    fetchApplicationsForSublet,
    fetchMyApplications,
    updateApplicationStatus,
    withdrawApplication,
    fetchMySublets,
} from '@/services/sublets';
import type {
    SubletFilters,
    SubletSearchResponse,
    SubletListing,
    SubletApplication,
    CreateSubletRequest,
    CreateApplicationRequest,
    UpdateApplicationStatusRequest,
} from '@/types/swap';

const PAGE_SIZE = 12;

// ============================================
// Query Key Factory
// ============================================

export const subletKeys = {
    all: ['sublets'] as const,
    lists: () => [...subletKeys.all, 'list'] as const,
    list: (filters: SubletFilters) => [...subletKeys.lists(), filters] as const,
    details: () => [...subletKeys.all, 'detail'] as const,
    detail: (id: string) => [...subletKeys.details(), id] as const,
    mySublets: () => [...subletKeys.all, 'my-sublets'] as const,
    applications: (subletId: string) =>
        [...subletKeys.all, 'applications', subletId] as const,
    myApplications: () => [...subletKeys.all, 'my-applications'] as const,
};

// ============================================
// List Hooks
// ============================================

/**
 * Hook to search sublet listings with infinite pagination
 */
export function useSublets(filters: SubletFilters = {}) {
    return useInfiniteQuery<SubletSearchResponse>({
        queryKey: subletKeys.list(filters),
        queryFn: ({ pageParam }) => fetchSublets(filters, pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasMore) return undefined;
            return allPages.length + 1;
        },
        placeholderData: keepPreviousData,
        staleTime: 30_000, // 30 seconds
    });
}

/**
 * Hook to fetch a single sublet by ID
 */
export function useSublet(id: string | undefined) {
    return useQuery<SubletListing | null>({
        queryKey: subletKeys.detail(id || ''),
        queryFn: () => fetchSubletById(id!),
        enabled: !!id,
        staleTime: 60_000, // 1 minute
    });
}

/**
 * Hook to fetch current user's sublet listings
 */
export function useMySublets() {
    return useQuery<SubletListing[]>({
        queryKey: subletKeys.mySublets(),
        queryFn: fetchMySublets,
        staleTime: 30_000,
    });
}

// ============================================
// Application Hooks
// ============================================

/**
 * Hook to fetch applications for a sublet (owner view)
 */
export function useApplicationsForSublet(subletId: string | undefined) {
    return useQuery<SubletApplication[]>({
        queryKey: subletKeys.applications(subletId || ''),
        queryFn: () => fetchApplicationsForSublet(subletId!),
        enabled: !!subletId,
        staleTime: 10_000,
    });
}

/**
 * Hook to fetch my applications (applicant view)
 */
export function useMyApplications() {
    return useQuery<SubletApplication[]>({
        queryKey: subletKeys.myApplications(),
        queryFn: fetchMyApplications,
        staleTime: 30_000,
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a new sublet listing
 */
export function useCreateSublet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSublet,
        onSuccess: () => {
            // Invalidate all sublet lists
            queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
            queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
        },
    });
}

/**
 * Hook to update a sublet listing
 */
export function useUpdateSublet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateSubletRequest> }) =>
            updateSublet(id, updates),
        onSuccess: (_, { id }) => {
            // Invalidate specific detail and all lists
            queryClient.invalidateQueries({ queryKey: subletKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
            queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
        },
    });
}

/**
 * Hook to delete (soft delete) a sublet listing
 */
export function useDeleteSublet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSublet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
            queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
        },
    });
}

/**
 * Hook to increment sublet view count
 */
export function useIncrementSubletView() {
    return useMutation({
        mutationFn: incrementSubletView,
    });
}

/**
 * Hook to create an application
 */
export function useCreateApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createApplication,
        onSuccess: (_, variables) => {
            // Invalidate applications for the sublet
            queryClient.invalidateQueries({
                queryKey: subletKeys.applications(variables.sublet_listing_id),
            });
            queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
        },
    });
}

/**
 * Hook to update application status (approve/reject)
 */
export function useUpdateApplicationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            applicationId,
            request,
            subletId,
        }: {
            applicationId: string;
            request: UpdateApplicationStatusRequest;
            subletId: string;
        }) => updateApplicationStatus(applicationId, request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: subletKeys.applications(variables.subletId),
            });
            queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
        },
    });
}

/**
 * Hook to withdraw an application
 */
export function useWithdrawApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: withdrawApplication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
        },
    });
}

// ============================================
// Cache Invalidation Helpers
// ============================================

export function useInvalidateSublets() {
    const queryClient = useQueryClient();

    return {
        invalidateAll: () => queryClient.invalidateQueries({ queryKey: subletKeys.all }),
        invalidateLists: () => queryClient.invalidateQueries({ queryKey: subletKeys.lists() }),
        invalidateDetail: (id: string) =>
            queryClient.invalidateQueries({ queryKey: subletKeys.detail(id) }),
        invalidateMySublets: () =>
            queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() }),
        invalidateApplications: (subletId: string) =>
            queryClient.invalidateQueries({ queryKey: subletKeys.applications(subletId) }),
        invalidateMyApplications: () =>
            queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() }),
    };
}
