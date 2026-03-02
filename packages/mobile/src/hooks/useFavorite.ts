import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { addFavorite, removeFavorite, isFavorited } from '@roomz/shared';
import { useAuth } from '../contexts/AuthContext';

export function useFavorite(itemId: string, itemType: 'room' | 'sublet' | 'post' = 'room') {
    const { session } = useAuth();
    const queryClient = useQueryClient();
    const userId = session?.user?.id;

    const { data: isFav, isLoading } = useQuery({
        queryKey: ['favorite', itemType, itemId, userId],
        queryFn: async () => {
            if (!userId) return false;
            return isFavorited(supabase, userId, itemId);
        },
        enabled: !!userId && !!itemId,
    });

    const toggleMutation = useMutation({
        mutationFn: async () => {
            if (!userId) throw new Error('User must be logged in');
            // Use isFav from query data instead of calling API again
            if (isFav) {
                await removeFavorite(supabase, userId, itemId);
                return false;
            } else {
                await addFavorite(supabase, userId, itemId, itemType);
                return true;
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['favorite', itemType, itemId, userId] });
            const previousValue = queryClient.getQueryData(['favorite', itemType, itemId, userId]);
            queryClient.setQueryData(['favorite', itemType, itemId, userId], !previousValue);
            return { previousValue };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousValue !== undefined) {
                queryClient.setQueryData(['favorite', itemType, itemId, userId], context.previousValue);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['favorite', itemType, itemId, userId] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    return {
        isFavorited: isFav ?? false,
        isLoading,
        toggleFavorite: toggleMutation.mutate,
        isToggling: toggleMutation.isPending,
    };
}
