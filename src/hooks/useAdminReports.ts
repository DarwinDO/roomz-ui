/**
 * TanStack Query Hooks for Admin Reports Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as reportsService from '@/services/reports';
import type { ReportFilters } from '@/services/reports';

// Query key factory
export const adminReportKeys = {
    all: ['admin', 'reports'] as const,
    lists: () => [...adminReportKeys.all, 'list'] as const,
    list: (filters: ReportFilters) => [...adminReportKeys.lists(), filters] as const,
    details: () => [...adminReportKeys.all, 'detail'] as const,
    detail: (id: string) => [...adminReportKeys.details(), id] as const,
};

/**
 * Get all reports for admin
 */
export function useAdminReports(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: adminReportKeys.list(filters),
        queryFn: () => reportsService.getAdminReports(filters),
    });
}

/**
 * Update report status
 */
export function useUpdateReportStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
            reportsService.updateReportStatus(reportId, status),
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái báo cáo');
            queryClient.invalidateQueries({ queryKey: adminReportKeys.all });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể cập nhật trạng thái.',
            });
        },
    });
}

/**
 * Add note to report
 */
export function useAddReportNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ reportId, note }: { reportId: string; note: string }) =>
            reportsService.addReportNote(reportId, note),
        onSuccess: () => {
            toast.success('Đã thêm ghi chú');
            queryClient.invalidateQueries({ queryKey: adminReportKeys.all });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể thêm ghi chú.',
            });
        },
    });
}
