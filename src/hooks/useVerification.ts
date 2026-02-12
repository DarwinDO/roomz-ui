/**
 * Verification Hooks
 * TanStack Query hooks for identity verification feature
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getMyVerificationStatus,
    uploadCCCDImages,
    submitVerificationRequest,
    deleteUploadedFiles,
    fetchVerificationRequests,
    reviewVerification,
    type VerificationStatus,
} from '@/services/verification';

const verificationKeys = {
    myStatus: () => ['verification', 'my-status'] as const,
    adminList: (status?: VerificationStatus) => ['verification', 'admin', status] as const,
};

// ============================================
// User Hooks
// ============================================

/** Get current user's verification status */
export function useMyVerificationStatus() {
    return useQuery({
        queryKey: verificationKeys.myStatus(),
        queryFn: getMyVerificationStatus,
        staleTime: 5 * 60 * 1000, // 5 min cache
    });
}

/** Submit CCCD for verification (upload + insert) */
export function useSubmitVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ frontFile, backFile }: { frontFile: File; backFile: File }) => {
            // Step 1: Compress + upload
            const { frontPath, backPath } = await uploadCCCDImages(frontFile, backFile);
            // Step 2: Insert DB record (cleanup uploaded files if this fails)
            try {
                await submitVerificationRequest(frontPath, backPath);
            } catch (error) {
                await deleteUploadedFiles(frontPath, backPath).catch(() => { });
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

// ============================================
// Admin Hooks
// ============================================

/** List verification requests (admin) */
export function usePendingVerifications(statusFilter?: VerificationStatus) {
    return useQuery({
        queryKey: verificationKeys.adminList(statusFilter),
        queryFn: () => fetchVerificationRequests(statusFilter),
        staleTime: 30 * 1000, // 30s cache (admin refreshes often)
    });
}

/** Approve or reject a verification request (admin) */
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
            // Invalidate all admin lists
            queryClient.invalidateQueries({ queryKey: ['verification', 'admin'] });
            toast.success(
                status === 'approved' ? 'Đã phê duyệt xác thực' : 'Đã từ chối xác thực'
            );
        },
        onError: (error: Error) => {
            toast.error('Lỗi cập nhật', { description: error.message });
        },
    });
}
