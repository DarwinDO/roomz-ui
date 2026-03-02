import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getRoomById } from '@roomz/shared';

export function useRoomDetail(roomId: string | undefined) {
    return useQuery({
        queryKey: ['room', 'detail', roomId],
        queryFn: async () => {
            if (!roomId) throw new Error('Room ID is required');
            const room = await getRoomById(supabase, roomId);
            if (!room) throw new Error('Room not found');
            return room;
        },
        enabled: !!roomId,
        staleTime: 60_000,
    });
}
