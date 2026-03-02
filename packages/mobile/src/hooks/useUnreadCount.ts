import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getChatUnreadCount } from '@roomz/shared';

interface UseUnreadCountReturn {
    count: number;
    isLoading: boolean;
    error: Error | null;
}

export function useUnreadCount(): UseUnreadCountReturn {
    const { user } = useAuth();
    const userId = user?.id;

    const { data, isLoading, error } = useQuery({
        queryKey: ['unreadCount', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User not authenticated');
            return getChatUnreadCount(supabase, userId);
        },
        enabled: !!userId,
        staleTime: 30_000,
    });

    return {
        count: data ?? 0,
        isLoading,
        error,
    };
}
