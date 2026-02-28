/**
 * TanStack Query Hooks for Service Leads
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as serviceLeadsService from '@/services/serviceLeads';
import type { ServiceLeadFilters, CreateServiceLeadRequest } from '@roomz/shared/types/serviceLeads';

// Query key factory
export const serviceLeadKeys = {
    all: ['serviceLeads'] as const,
    lists: () => [...serviceLeadKeys.all, 'list'] as const,
    list: (filters: ServiceLeadFilters) => [...serviceLeadKeys.lists(), filters] as const,
    details: () => [...serviceLeadKeys.all, 'detail'] as const,
    detail: (id: string) => [...serviceLeadKeys.details(), id] as const,
};

/**
 * Get current user's service leads
 */
export function useMyServiceLeads(filters: ServiceLeadFilters = {}) {
    return useQuery({
        queryKey: serviceLeadKeys.list(filters),
        queryFn: () => serviceLeadsService.getMyServiceLeads(filters),
    });
}

/**
 * Get single service lead by ID
 */
export function useServiceLead(id: string) {
    return useQuery({
        queryKey: serviceLeadKeys.detail(id),
        queryFn: () => serviceLeadsService.getServiceLeadById(id),
        enabled: !!id,
    });
}

/**
 * Create a new service lead
 */
export function useCreateServiceLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateServiceLeadRequest) =>
            serviceLeadsService.createServiceLead(data),
        onSuccess: () => {
            toast.success('Đặt dịch vụ thành công!', {
                description: 'Chúng tôi sẽ liên hệ với bạn sớm nhất.',
            });
            queryClient.invalidateQueries({ queryKey: serviceLeadKeys.lists() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể đặt dịch vụ. Vui lòng thử lại.',
            });
        },
    });
}

/**
 * Cancel a service lead
 */
export function useCancelServiceLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => serviceLeadsService.cancelServiceLead(id),
        onSuccess: () => {
            toast.success('Đã hủy dịch vụ');
            queryClient.invalidateQueries({ queryKey: serviceLeadKeys.lists() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể hủy dịch vụ.',
            });
        },
    });
}

/**
 * Rate a completed service
 */
export function useRateServiceLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, rating, review }: { id: string; rating: number; review?: string }) =>
            serviceLeadsService.rateServiceLead(id, rating, review),
        onSuccess: () => {
            toast.success('Cảm ơn bạn! Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ.');
            queryClient.invalidateQueries({ queryKey: serviceLeadKeys.lists() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', {
                description: error.message || 'Không thể gửi đánh giá.',
            });
        },
    });
}
