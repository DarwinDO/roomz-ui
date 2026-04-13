import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminKeys } from '@/hooks/useAdmin';
import {
  deleteUploadedFiles,
  fetchVerificationAuditLog,
  fetchVerificationRequests,
  fetchVerifiedUsers,
  getMyVerificationStatus,
  getMyStudentCardVerificationStatus,
  reviewVerification,
  revokeVerification,
  submitVerificationRequest,
  type ManagedVerificationType,
  type VerificationStatus,
  uploadCCCDImages,
  uploadStudentCardImages,
} from '@/services/verification';

export const verificationKeys = {
  all: ['verification'] as const,
  myStatus: () => [...verificationKeys.all, 'my-status'] as const,
  adminList: (status?: VerificationStatus) =>
    [...verificationKeys.all, 'admin', 'requests', status ?? 'all'] as const,
  verifiedUsers: () => [...verificationKeys.all, 'admin', 'verified-users'] as const,
  auditLog: (limit: number) => [...verificationKeys.all, 'admin', 'audit', limit] as const,
};

export function useMyVerificationStatus() {
  return useQuery({
    queryKey: verificationKeys.myStatus(),
    queryFn: getMyVerificationStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frontFile, backFile }: { frontFile: File; backFile: File }) => {
      const { frontPath, backPath } = await uploadCCCDImages(frontFile, backFile);

      try {
        await submitVerificationRequest('', 'cccd', [frontPath, backPath]);
      } catch (error) {
        await deleteUploadedFiles(frontPath, backPath).catch(() => {});
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.myStatus() });
      toast.success('Đã gửi yêu cầu xác thực', {
        description: 'Chúng tôi sẽ xem xét trong vòng 24 giờ.',
      });
    },
    onError: (error: Error) => {
      toast.error('Lỗi gửi yêu cầu', { description: error.message });
    },
  });
}

export function useMyStudentCardStatus() {
  return useQuery({
    queryKey: [...verificationKeys.all, 'student-card-status'] as const,
    queryFn: getMyStudentCardVerificationStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitStudentCardVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frontFile, backFile }: { frontFile: File; backFile: File }) => {
      const { frontPath, backPath } = await uploadStudentCardImages(frontFile, backFile);
      try {
        await submitVerificationRequest('', 'student_card', [frontPath, backPath]);
      } catch (error) {
        await deleteUploadedFiles(frontPath, backPath).catch(() => {});
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.all });
      queryClient.invalidateQueries({ queryKey: [...verificationKeys.all, 'student-card-status'] });
      queryClient.invalidateQueries({ queryKey: verificationKeys.myStatus() });
    },
    onError: (error: Error) => {
      toast.error('Lỗi gửi yêu cầu', { description: error.message });
    },
  });
}

export function usePendingVerifications(statusFilter?: VerificationStatus) {
  return useQuery({
    queryKey: verificationKeys.adminList(statusFilter),
    queryFn: () => fetchVerificationRequests(statusFilter),
    staleTime: 30 * 1000,
  });
}

export function useVerifiedUsers() {
  return useQuery({
    queryKey: verificationKeys.verifiedUsers(),
    queryFn: fetchVerifiedUsers,
    staleTime: 30 * 1000,
  });
}

export function useVerificationAuditLog(limit = 100) {
  return useQuery({
    queryKey: verificationKeys.auditLog(limit),
    queryFn: () => fetchVerificationAuditLog(limit),
    staleTime: 30 * 1000,
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      status,
      rejectionReason,
    }: {
      requestId: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => reviewVerification(requestId, status, rejectionReason),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
      toast.success(status === 'approved' ? 'Đã phê duyệt xác thực' : 'Đã từ chối xác thực');
    },
    onError: (error: Error) => {
      toast.error('Lỗi cập nhật', { description: error.message });
    },
  });
}

export function useRevokeVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      verificationType,
      reason,
    }: {
      userId: string;
      verificationType: ManagedVerificationType;
      reason: string;
    }) => revokeVerification(userId, verificationType, reason),
    onSuccess: (_, { verificationType }) => {
      queryClient.invalidateQueries({ queryKey: verificationKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
      toast.success(
        verificationType === 'id_card'
          ? 'Đã gỡ xác thực CCCD'
          : 'Đã gỡ xác thực thẻ sinh viên',
      );
    },
    onError: (error: Error) => {
      toast.error('Lỗi gỡ xác thực', { description: error.message });
    },
  });
}
