import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getPosts, type CommunityPost, type CommunityFilters as SharedCommunityFilters } from '@roomz/shared';

const PAGE_SIZE = 12;

export interface CommunityFilters {
    category?: string;
    sortBy?: 'newest' | 'popular';
    search?: string;
}

interface PostsResponse {
    posts: CommunityPost[];
    totalCount: number;
}

export function useCommunityPosts(filters: CommunityFilters = {}) {
    return useInfiniteQuery<PostsResponse, Error>({
        queryKey: ['community-posts', filters],
        queryFn: async ({ pageParam = 1 }) => {
            const sharedFilters: SharedCommunityFilters = {
                category: filters.category,
                searchQuery: filters.search,
                page: pageParam as number,
                pageSize: PAGE_SIZE,
            };

            const response = await getPosts(supabase, sharedFilters);
            return response;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((acc, page) => acc + page.posts.length, 0);
            if (loadedCount >= lastPage.totalCount) return undefined;
            return allPages.length + 1;
        },
        staleTime: 30_000,
    });
}
