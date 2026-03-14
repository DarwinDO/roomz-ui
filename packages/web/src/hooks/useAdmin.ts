/**
 * TanStack Query Hooks for Admin Dashboard
 * Migrated from manual useState/useEffect to React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as adminService from '@/services/admin';

// Query key factory
export const adminKeys = {
    all: ['admin'] as const,
    stats: () => [...adminKeys.all, 'stats'] as const,
    rooms: {
        all: () => [...adminKeys.all, 'rooms'] as const,
        list: () => [...adminKeys.rooms.all(), 'list'] as const,
        detail: (id: string) => [...adminKeys.rooms.all(), 'detail', id] as const,
    },
    users: {
        all: () => [...adminKeys.all, 'users'] as const,
        list: () => [...adminKeys.users.all(), 'list'] as const,
        detail: (id: string) => [...adminKeys.users.all(), 'detail', id] as const,
    },
};

/**
 * Get admin dashboard statistics
 */
export function useAdminStats() {
    return useQuery({
        queryKey: adminKeys.stats(),
        queryFn: () => adminService.getAdminStats(),
    });
}

/**
 * Get all rooms for admin
 */
export function useAdminRooms() {
    return useQuery({
        queryKey: adminKeys.rooms.list(),
        queryFn: () => adminService.getAdminRooms(),
    });
}

/**
 * Get all users for admin
 */
export function useAdminUsers() {
    return useQuery({
        queryKey: adminKeys.users.list(),
        queryFn: () => adminService.getAdminUsers(),
    });
}

/**
 * Approve a room
 */
export function useApproveRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roomId: string) => adminService.approveRoom(roomId),
        onSuccess: () => {
            toast.success('Đã duyệt phòng');
            queryClient.invalidateQueries({ queryKey: adminKeys.rooms.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Reject a room
 */
export function useRejectRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, reason }: { roomId: string; reason?: string }) =>
            adminService.rejectRoom(roomId, reason),
        onSuccess: () => {
            toast.success('Đã từ chối phòng');
            queryClient.invalidateQueries({ queryKey: adminKeys.rooms.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Delete (soft) a room
 */
export function useDeleteRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roomId: string) => adminService.deleteRoom(roomId),
        onSuccess: () => {
            toast.success('Đã xóa phòng');
            queryClient.invalidateQueries({ queryKey: adminKeys.rooms.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Toggle room featured status
 */
export function useToggleRoomFeatured() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, featured }: { roomId: string; featured: boolean }) =>
            adminService.toggleRoomFeatured(roomId, featured),
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái nổi bật');
            queryClient.invalidateQueries({ queryKey: adminKeys.rooms.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Suspend a user
 */
export function useSuspendUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) =>
            adminService.updateUserStatus(userId, 'suspended'),
        onSuccess: () => {
            toast.success('Đã tạm khóa người dùng');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Activate a user
 */
export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) =>
            adminService.updateUserStatus(userId, 'active'),
        onSuccess: () => {
            toast.success('Đã kích hoạt người dùng');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Delete (soft) a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminService.deleteUser(userId),
        onSuccess: () => {
            toast.success('Đã xóa người dùng');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Approve landlord application
 */
export function useApproveLandlord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) =>
            adminService.approveLandlordApplication(userId),
        onSuccess: () => {
            toast.success('Đã phê duyệt chủ trọ');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Reject landlord application
 */
export function useRejectLandlord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
            adminService.rejectLandlordApplication(userId, reason),
        onSuccess: () => {
            toast.success('Đã từ chối yêu cầu làm chủ trọ');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}

/**
 * Reject user verification
 */
export function useRejectUserVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
            adminService.rejectUserVerification(userId, reason),
        onSuccess: () => {
            toast.success('Đã từ chối xác thực');
            queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
        },
        onError: (error: Error) => {
            toast.error('Lỗi', { description: error.message });
        },
    });
}
