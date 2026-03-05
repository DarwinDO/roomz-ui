/**
 * React Query hooks for Partner Leads
 * Quản lý đăng ký đối tác
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { createPartnerLead, checkPartnerLeadExists, updatePartnerLeadStatus, getPartnerLeads, type CreatePartnerLeadRequest, type PartnerLeadStatus } from '@/services/partnerLeads';
import { toast } from 'sonner';

const PARTNER_LEADS_KEY = 'partnerLeads';

/**
 * Hook để lấy danh sách đơn đăng ký (admin only)
 */
export function usePartnerLeads() {
    return useQuery({
        queryKey: [PARTNER_LEADS_KEY],
        queryFn: getPartnerLeads,
    });
}

/**
 * Hook để tạo đăng ký đối tác mới (public form)
 */
export function useCreatePartnerLead() {
    return useMutation({
        mutationFn: createPartnerLead,
        onSuccess: () => {
            toast.success('Đã gửi đăng ký thành công!', {
                description: 'Đội ngũ RommZ sẽ liên hệ với bạn trong 1-2 ngày làm việc.',
            });
        },
        onError: (error: Error) => {
            toast.error('Gửi đăng ký thất bại', {
                description: error.message || 'Vui lòng thử lại sau.',
            });
        },
    });
}

/**
 * Hook để cập nhật trạng thái đơn đăng ký (admin only)
 */
export function useUpdatePartnerLeadStatus() {
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: PartnerLeadStatus }) =>
            updatePartnerLeadStatus(id, status),
    });
}

/**
 * Hook để kiểm tra email đã tồn tại chưa
 */
export function useCheckPartnerLead() {
    return useMutation({
        mutationFn: checkPartnerLeadExists,
    });
}

export type { CreatePartnerLeadRequest };
