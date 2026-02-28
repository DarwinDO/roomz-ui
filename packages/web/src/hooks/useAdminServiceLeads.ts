/**
 * TanStack Query Hooks for Admin Service Leads Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as adminService from '@/services/admin';
import type { ServiceLeadFilters } from '@/services/admin';

// Query key factory
export const adminServiceLeadKeys = {
    all: ['admin', 'service-leads'] as const,
    lists: () => [...adminServiceLeadKeys.all, 'list'] as const,
    list: (filters: ServiceLeadFilters) => [...adminServiceLeadKeys.lists(), filters] as const,
    details: () => [...adminServiceLeadKeys.all, 'detail'] as const,
    detail: (id: string) => [...adminServiceLeadKeys.details(), id] as const,
    stats: () => [...adminServiceLeadKeys.all, 'stats'] as const,
};

/**
 * Get all service leads for admin
 */
export function useAdminServiceLeads(filters: ServiceLeadFilters = {}) {
    return useQuery({
        queryKey: adminServiceLeadKeys.list(filters),
        queryFn: () => adminService.getAdminServiceLeads(filters),
    });
}

/**
 * Get single service lead by ID for admin
 */
export function useAdminServiceLead(id: string) {
    return useQuery({
        queryKey: adminServiceLeadKeys.detail(id),
        queryFn: () => adminService.getAdminServiceLeadById(id),
        enabled: !!id,
    });
}

/**
 * Assign partner to a service lead
 */
export function useAssignPartner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leadId, partnerId }: { leadId: string; partnerId: string }) =>
            adminService.assignPartnerToLead(leadId, partnerId),
        onSuccess: () => {
            toast.success('Đã gán đối tác cho yêu cầu dịch vụ');
            queryClient.invalidateQueries({ queryKey: adminServiceLeadKeys.all });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể gán đối tác.',
            });
        },
    });
}

/**
 * Update service lead status
 */
export function useUpdateLeadStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leadId, status, reason }: { leadId: string; status: string; reason?: string }) =>
            adminService.updateServiceLeadStatus(leadId, status, reason),
        onSuccess: (_, { status }) => {
            const statusMessages: Record<string, string> = {
                confirmed: 'Đã xác nhận yêu cầu',
                completed: 'Đã hoàn thành yêu cầu',
                cancelled: 'Đã hủy yêu cầu',
                rejected: 'Đã từ chối yêu cầu',
            };
            toast.success(statusMessages[status] || 'Đã cập nhật trạng thái');
            queryClient.invalidateQueries({ queryKey: adminServiceLeadKeys.all });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể cập nhật trạng thái.',
            });
        },
    });
}

/**
 * Append admin note to service lead
 */
export function useAppendAdminNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leadId, note, adminName }: { leadId: string; note: string; adminName: string }) =>
            adminService.appendAdminNote(leadId, note, adminName),
        onSuccess: () => {
            toast.success('Đã thêm ghi chú');
            queryClient.invalidateQueries({ queryKey: adminServiceLeadKeys.all });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể thêm ghi chú.',
            });
        },
    });
}

/**
 * Get service lead statistics
 */
export function useServiceLeadStats() {
    return useQuery({
        queryKey: adminServiceLeadKeys.stats(),
        queryFn: () => adminService.getServiceLeadStats(),
    });
}
