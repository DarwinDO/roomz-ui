import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTopMatches, type RoommateMatch } from '@roomz/shared';

interface UseRoommateMatchesOptions {
    limit?: number;
}

interface UseRoommateMatchesReturn {
    matches: RoommateMatch[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useRoommateMatches(options: UseRoommateMatchesOptions = {}): UseRoommateMatchesReturn {
    const { user } = useAuth();
    const userId = user?.id;
    const { limit = 20 } = options;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['roommate-matches', userId, limit],
        queryFn: async () => {
            if (!userId) throw new Error('User not authenticated');
            return getTopMatches(supabase, userId, limit);
        },
        enabled: !!userId,
        staleTime: 30_000,
    });

    return {
        matches: data ?? [],
        isLoading,
        error,
        refetch,
    };
}
