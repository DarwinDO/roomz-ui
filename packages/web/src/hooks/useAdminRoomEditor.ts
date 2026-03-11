import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminKeys } from '@/hooks/useAdmin';
import { dataQualityKeys } from '@/hooks/useDataQuality';
import {
  type AdminRoomUpdateDraft,
  updateAdminRoom,
} from '@/services/adminRoomEditor';

export function useUpdateAdminRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, draft }: { roomId: string; draft: AdminRoomUpdateDraft }) =>
      updateAdminRoom(roomId, draft),
    onSuccess: () => {
      toast.success('Đã cập nhật phòng');
      queryClient.invalidateQueries({ queryKey: adminKeys.rooms.all() });
      queryClient.invalidateQueries({ queryKey: dataQualityKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error('Không thể cập nhật phòng', { description: error.message });
    },
  });
}
