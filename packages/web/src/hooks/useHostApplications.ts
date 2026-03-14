import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as hostApplicationsService from '@/services/hostApplications';

export const hostApplicationKeys = {
  all: ['host-applications'] as const,
  mine: () => [...hostApplicationKeys.all, 'mine'] as const,
  admin: (status?: string) => [...hostApplicationKeys.all, 'admin', status ?? 'all'] as const,
};

export function useMyHostApplication(enabled = true) {
  return useQuery({
    queryKey: hostApplicationKeys.mine(),
    queryFn: () => hostApplicationsService.getMyHostApplication(),
    enabled,
  });
}

export function useSubmitHostApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: hostApplicationsService.submitHostApplication,
    onSuccess: () => {
      toast.success('Đơn host đã được gửi');
      queryClient.invalidateQueries({ queryKey: hostApplicationKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAdminHostApplications(status?: hostApplicationsService.HostApplicationStatus | 'all') {
  return useQuery({
    queryKey: hostApplicationKeys.admin(status),
    queryFn: () => hostApplicationsService.getAdminHostApplications(status),
  });
}

export function useReviewHostApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      rejectionReason,
    }: {
      applicationId: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => hostApplicationsService.reviewHostApplication(applicationId, status, rejectionReason),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'Đã phê duyệt hồ sơ host' : 'Đã từ chối hồ sơ host');
      queryClient.invalidateQueries({ queryKey: hostApplicationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
