import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dataQualityKeys } from '@/hooks/useDataQuality';
import { locationKeys } from '@/hooks/useLocations';
import {
  getAdminLocations,
  toggleAdminLocationStatus,
  updateAdminLocation,
  type AdminLocationStatus,
  type AdminLocationUpdateDraft,
} from '@/services/adminLocations';

export const adminLocationKeys = {
  all: ['admin-locations'] as const,
  list: () => [...adminLocationKeys.all, 'list'] as const,
};

export function useAdminLocations() {
  return useQuery({
    queryKey: adminLocationKeys.list(),
    queryFn: getAdminLocations,
  });
}

function invalidateLocationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: adminLocationKeys.all });
  queryClient.invalidateQueries({ queryKey: locationKeys.all });
  queryClient.invalidateQueries({ queryKey: dataQualityKeys.dashboard() });
}

export function useUpdateAdminLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: AdminLocationUpdateDraft }) =>
      updateAdminLocation(id, draft),
    onSuccess: () => {
      toast.success('Đã cập nhật location');
      invalidateLocationQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error('Không thể cập nhật location', { description: error.message });
    },
  });
}

export function useToggleAdminLocationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: AdminLocationStatus }) =>
      toggleAdminLocationStatus(id, nextStatus),
    onSuccess: (_, variables) => {
      toast.success(
        variables.nextStatus === 'active' ? 'Đã kích hoạt location' : 'Đã tắt location',
      );
      invalidateLocationQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error('Không thể cập nhật trạng thái location', { description: error.message });
    },
  });
}
