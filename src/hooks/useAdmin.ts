/**
 * Admin Hooks
 * React hooks for admin dashboard data management
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getAdminRooms,
    getAdminUsers,
    getAdminStats,
    approveRoom,
    rejectRoom,
    deleteRoom as deleteRoomApi,
    updateUserStatus,
    deleteUser as deleteUserApi,
    type AdminRoom,
    type AdminUser,
    type AdminStats,
} from '@/services/admin';

interface UseAdminRoomsReturn {
    rooms: AdminRoom[];
    loading: boolean;
    error: string | null;
    stats: {
        total: number;
        active: number;
        pending: number;
        verified: number;
    };
    approveRoom: (id: string) => Promise<void>;
    rejectRoom: (id: string) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

interface UseAdminUsersReturn {
    users: AdminUser[];
    loading: boolean;
    error: string | null;
    stats: {
        total: number;
        active: number;
        suspended: number;
        verified: number;
    };
    suspendUser: (id: string) => Promise<void>;
    activateUser: (id: string) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Hook to manage admin rooms
 */
export function useAdminRooms(): UseAdminRoomsReturn {
    const [rooms, setRooms] = useState<AdminRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAdminRooms();
            setRooms(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch rooms';
            setError(message);
            console.error('Error fetching admin rooms:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleApproveRoom = useCallback(async (id: string) => {
        await approveRoom(id);
        setRooms(prev => prev.map(r =>
            r.id === id ? { ...r, status: 'active' as const, is_verified: true } : r
        ));
    }, []);

    const handleRejectRoom = useCallback(async (id: string) => {
        await rejectRoom(id);
        setRooms(prev => prev.map(r =>
            r.id === id ? { ...r, status: 'inactive' as const } : r
        ));
    }, []);

    const handleDeleteRoom = useCallback(async (id: string) => {
        await deleteRoomApi(id);
        setRooms(prev => prev.filter(r => r.id !== id));
    }, []);

    const stats = {
        total: rooms.length,
        active: rooms.filter(r => r.status === 'active').length,
        pending: rooms.filter(r => r.status === 'pending').length,
        verified: rooms.filter(r => r.is_verified).length,
    };

    return {
        rooms,
        loading,
        error,
        stats,
        approveRoom: handleApproveRoom,
        rejectRoom: handleRejectRoom,
        deleteRoom: handleDeleteRoom,
        refetch: fetchRooms,
    };
}

/**
 * Hook to manage admin users
 */
export function useAdminUsers(): UseAdminUsersReturn {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAdminUsers();
            setUsers(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch users';
            setError(message);
            console.error('Error fetching admin users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSuspendUser = useCallback(async (id: string) => {
        await updateUserStatus(id, 'suspended');
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, account_status: 'suspended' as const } : u
        ));
    }, []);

    const handleActivateUser = useCallback(async (id: string) => {
        await updateUserStatus(id, 'active');
        setUsers(prev => prev.map(u =>
            u.id === id ? { ...u, account_status: 'active' as const } : u
        ));
    }, []);

    const handleDeleteUser = useCallback(async (id: string) => {
        await deleteUserApi(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    }, []);

    const stats = {
        total: users.length,
        active: users.filter(u => u.account_status === 'active').length,
        suspended: users.filter(u => u.account_status === 'suspended').length,
        verified: users.filter(u => u.account_status === 'active').length, // Using active as verified proxy
    };

    return {
        users,
        loading,
        error,
        stats,
        suspendUser: handleSuspendUser,
        activateUser: handleActivateUser,
        deleteUser: handleDeleteUser,
        refetch: fetchUsers,
    };
}

/**
 * Hook to get admin dashboard stats
 */
export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAdminStats();
            setStats(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch stats';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refetch: fetchStats };
}
