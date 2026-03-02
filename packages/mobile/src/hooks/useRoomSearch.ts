import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { searchRooms, type RoomFilters, type RoomSearchResponse } from '@roomz/shared';

const PAGE_SIZE = 12;

export function useRoomSearch(filters: RoomFilters = {}) {
    return useInfiniteQuery<RoomSearchResponse, Error>({
        queryKey: ['rooms', 'search', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await searchRooms(supabase, {
                ...filters,
                page: pageParam as number,
                pageSize: PAGE_SIZE,
            });
            return response;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((acc, page) => acc + page.rooms.length, 0);
            if (loadedCount >= lastPage.totalCount) return undefined;
            return allPages.length + 1;
        },
        staleTime: 30_000,
    });
}
