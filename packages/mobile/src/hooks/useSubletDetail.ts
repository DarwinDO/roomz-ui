import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getSubletById } from '@roomz/shared';

export function useSubletDetail(subletId: string | undefined) {
    return useQuery({
        queryKey: ['sublet', 'detail', subletId],
        queryFn: async () => {
            if (!subletId) throw new Error('Sublet ID is required');
            const sublet = await getSubletById(supabase, subletId);
            if (!sublet) throw new Error('Sublet not found');
            return sublet;
        },
        enabled: !!subletId,
        staleTime: 60_000,
    });
}
