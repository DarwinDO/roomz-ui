import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getRoommateProfile, type RoommateProfile } from '@roomz/shared';

interface UseRoommateProfileReturn {
    profile: RoommateProfile | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useRoommateProfile(): UseRoommateProfileReturn {
    const { user } = useAuth();
    const userId = user?.id;

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['roommate-profile', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User not authenticated');
            return getRoommateProfile(supabase, userId);
        },
        enabled: !!userId,
        staleTime: 60_000,
    });

    return {
        profile: data ?? null,
        isLoading,
        error,
        refetch,
    };
}
