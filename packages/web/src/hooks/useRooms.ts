/**
 * useRooms Hook (TanStack Query)
 * useInfiniteQuery for paginated search, useQuery for detail/landlord.
 * Query key factory for proper invalidation.
 */

import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { searchRooms, getRoomById, getRoomsByLandlord, type RoomWithDetails, type RoomFilters, type RoomSearchResponse } from '@/services/rooms';

const PAGE_SIZE = 12;

/** Query key factory for rooms */
export const roomKeys = {
  all: ['rooms'] as const,
  search: (filters: RoomFilters) => ['rooms', 'search', filters] as const,
  detail: (id: string) => ['rooms', 'detail', id] as const,
  landlord: (landlordId: string) => ['rooms', 'landlord', landlordId] as const,
};

/**
 * Hook to search rooms with server-side filters, sort, and cursor-based pagination.
 * Uses useInfiniteQuery so "Load More" appends new pages.
 */
export function useSearchRooms(filters: Omit<RoomFilters, 'page' | 'pageSize'> = {}) {
  const query = useInfiniteQuery<RoomSearchResponse>({
    queryKey: roomKeys.search(filters),
    queryFn: ({ pageParam }) =>
      searchRooms({ ...filters, page: pageParam as number, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.length * PAGE_SIZE;
      return loaded < lastPage.totalCount ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  // Flatten all pages into a single rooms array
  const rooms = useMemo(
    () => query.data?.pages.flatMap(p => p.rooms) ?? [],
    [query.data?.pages],
  );
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return {
    rooms,
    totalCount,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isPlaceholderData: query.isPlaceholderData,
  };
}

/**
 * Hook to fetch a single room by ID
 */
export function useRoom(id: string | undefined) {
  return useQuery<RoomWithDetails | null>({
    queryKey: roomKeys.detail(id!),
    queryFn: () => getRoomById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch landlord's rooms (includes all statuses)
 */
export function useLandlordRooms(landlordId: string | undefined) {
  const query = useQuery<RoomWithDetails[]>({
    queryKey: roomKeys.landlord(landlordId!),
    queryFn: () => getRoomsByLandlord(landlordId!),
    enabled: !!landlordId,
    staleTime: 30_000,
  });

  const rooms = useMemo(() => query.data ?? [], [query.data]);
  const stats = useMemo(() => ({
    total: rooms.length,
    pending: rooms.filter(r => r.status === 'pending').length,
    active: rooms.filter(r => r.status === 'active').length,
    rejected: rooms.filter(r => r.status === 'rejected').length,
    totalViews: rooms.reduce((sum, r) => sum + (r.view_count || 0), 0),
    totalFavorites: rooms.reduce((sum, r) => sum + (r.favorite_count || 0), 0),
  }), [rooms]);

  return {
    rooms,
    loading: query.isLoading,
    error: query.error?.message || null,
    stats,
    refetch: query.refetch,
  };
}

/**
 * Hook to invalidate room queries after mutations (create/update/delete)
 */
export function useInvalidateRooms() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: roomKeys.all }),
    invalidateSearch: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'search'] }),
    invalidateRoom: (id: string) => queryClient.invalidateQueries({ queryKey: roomKeys.detail(id) }),
    invalidateLandlord: (landlordId: string) => queryClient.invalidateQueries({ queryKey: roomKeys.landlord(landlordId) }),
  };
}
