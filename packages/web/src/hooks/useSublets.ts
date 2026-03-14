/**
 * useSublets Hook (TanStack Query)
 * Server state management for short-stay listings and applications.
 */

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import {
  createApplication,
  createSublet,
  createSubletWithRoom,
  deleteSublet,
  fetchApplicationsForSublet,
  fetchMyApplications,
  fetchMySublets,
  fetchSubletById,
  fetchSublets,
  incrementSubletView,
  updateApplicationStatus,
  updateSublet,
  withdrawApplication,
} from '@/services/sublets';
import type { CreateSubletWithRoomRequest } from '@/services/sublets';
import type {
  ApplicationStatus,
  SubletApplication,
  SubletFilters,
  SubletListing,
  SubletSearchResponse,
  UpdateSubletRequest,
} from '@roomz/shared/types/swap';

export const subletKeys = {
  all: ['sublets'] as const,
  lists: () => [...subletKeys.all, 'list'] as const,
  list: (filters: SubletFilters) => [...subletKeys.lists(), filters] as const,
  details: () => [...subletKeys.all, 'detail'] as const,
  detail: (id: string) => [...subletKeys.details(), id] as const,
  mySublets: () => [...subletKeys.all, 'my-sublets'] as const,
  applications: (subletId: string) => [...subletKeys.all, 'applications', subletId] as const,
  myApplications: () => [...subletKeys.all, 'my-applications'] as const,
};

export function useSublets(filters: SubletFilters = {}) {
  const { user } = useAuth();

  return useInfiniteQuery<SubletSearchResponse>({
    queryKey: subletKeys.list(filters),
    queryFn: ({ pageParam }) => fetchSublets(filters, pageParam as number, user?.id),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSublet(id: string | undefined) {
  return useQuery<SubletListing | null>({
    queryKey: subletKeys.detail(id || ''),
    queryFn: () => fetchSubletById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useMySublets() {
  return useQuery<SubletListing[]>({
    queryKey: subletKeys.mySublets(),
    queryFn: fetchMySublets,
    staleTime: 30_000,
  });
}

export function useApplicationsForSublet(subletId: string | undefined) {
  return useQuery<SubletApplication[]>({
    queryKey: subletKeys.applications(subletId || ''),
    queryFn: () => fetchApplicationsForSublet(subletId!),
    enabled: !!subletId,
    staleTime: 10_000,
  });
}

export function useMyApplications() {
  return useQuery<SubletApplication[]>({
    queryKey: subletKeys.myApplications(),
    queryFn: fetchMyApplications,
    staleTime: 30_000,
  });
}

export function useCreateSublet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSublet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
      toast.success('Thành công', { description: 'Tin đăng đã được tạo.' });
    },
    onError: (error: Error) => {
      if (error.message === 'REQUIRE_VERIFICATION') {
        toast.error('Chưa xác thực tài khoản', {
          description: 'Bạn cần xác thực CCCD hoặc thẻ sinh viên trước khi đăng tin.',
          action: {
            label: 'Xác thực ngay',
            onClick: () => window.location.assign('/verification'),
          },
          duration: 8000,
        });
        return;
      }

      toast.error('Lỗi', { description: error.message || 'Không thể tạo tin đăng.' });
    },
  });
}

export function useCreateSubletWithRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateSubletWithRoomRequest) => createSubletWithRoom(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
      toast.success('Thành công', { description: 'Tin ở ngắn hạn đã được tạo.' });
    },
    onError: (error: Error) => {
      if (error.message === 'REQUIRE_VERIFICATION') {
        toast.error('Chưa xác thực tài khoản', {
          description: 'Bạn cần xác thực CCCD hoặc thẻ sinh viên trước khi đăng tin.',
          action: {
            label: 'Xác thực ngay',
            onClick: () => window.location.assign('/verification'),
          },
          duration: 8000,
        });
        return;
      }

      toast.error('Lỗi', { description: error.message || 'Không thể tạo tin đăng.' });
    },
  });
}

export function useUpdateSublet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSubletRequest }) => updateSublet(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: subletKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể cập nhật tin đăng.' });
    },
  });
}

export function useDeleteSublet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSublet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể xóa tin đăng.' });
    },
  });
}

export function useIncrementSubletView() {
  return useMutation({
    mutationFn: incrementSubletView,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: subletKeys.applications(variables.sublet_listing_id),
      });
      queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể gửi đơn quan tâm.' });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      reviewNotes,
      rejectionReason,
    }: {
      applicationId: string;
      status: Extract<ApplicationStatus, 'approved' | 'rejected'>;
      reviewNotes?: string;
      rejectionReason?: string;
    }) =>
      updateApplicationStatus(applicationId, {
        status,
        review_notes: reviewNotes,
        rejection_reason: rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.all });
      queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể cập nhật trạng thái.' });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể rút đơn quan tâm.' });
    },
  });
}

export function useSubletApplications(subletId: string | undefined) {
  return useApplicationsForSublet(subletId);
}

export function useRespondToApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: Extract<ApplicationStatus, 'approved' | 'rejected'>;
    }) => updateApplicationStatus(applicationId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.all });
    },
    onError: (error: Error) => {
      toast.error('Lỗi', { description: error.message || 'Không thể cập nhật trạng thái.' });
    },
  });
}

export function useInvalidateSublets() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: subletKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: subletKeys.lists() }),
    invalidateDetail: (id: string) => queryClient.invalidateQueries({ queryKey: subletKeys.detail(id) }),
    invalidateMySublets: () => queryClient.invalidateQueries({ queryKey: subletKeys.mySublets() }),
    invalidateApplications: (subletId: string) => queryClient.invalidateQueries({ queryKey: subletKeys.applications(subletId) }),
    invalidateMyApplications: () => queryClient.invalidateQueries({ queryKey: subletKeys.myApplications() }),
  };
}
