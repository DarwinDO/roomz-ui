import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getActiveDeals, type Deal } from '@roomz/shared';

export function useActiveDeals() {
    return useQuery<Deal[], Error>({
        queryKey: ['active-deals'],
        queryFn: async () => {
            return getActiveDeals(supabase);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}
