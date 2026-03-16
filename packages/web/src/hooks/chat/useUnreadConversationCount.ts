import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts';
import { getUnreadCount } from '@/services/chat';
import { conversationKeys } from './useConversations';

interface UseUnreadConversationCountResult {
    unreadCount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useUnreadConversationCount(): UseUnreadConversationCountResult {
    const { user, session, loading } = useAuth();

    const {
        data: unreadCount = 0,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: conversationKeys.unreadCount(user?.id || ''),
        queryFn: () => getUnreadCount(user!.id),
        enabled: !loading && !!user?.id && !!session?.access_token,
        staleTime: 15 * 1000,
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });

    return {
        unreadCount,
        isLoading,
        error: error as Error | null,
        refetch: () => {
            void refetch();
        },
    };
}
