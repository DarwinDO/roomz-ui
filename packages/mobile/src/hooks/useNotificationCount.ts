import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseNotificationCountReturn {
    count: number;
    isLoading: boolean;
    error: Error | null;
}

export function useNotificationCount(): UseNotificationCountReturn {
    const { user } = useAuth();
    const userId = user?.id;

    const { data, isLoading, error } = useQuery({
        queryKey: ['notification-count', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User not authenticated');

            const { count, error: countError } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (countError) {
                console.warn('Notification count query failed:', countError.message);
                return 0;
            }

            return count || 0;
        },
        enabled: !!userId,
        refetchInterval: 30_000, // Poll every 30s for real-time badge updates
    });

    return {
        count: data ?? 0,
        isLoading,
        error: error as Error | null,
    };
}
