/**
 * useNotifications Hook
 * Notification polling with TanStack Query
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';
import type { Tables } from '@/lib/database.types';

export type Notification = Tables<'notifications'>;

export type NotificationType =
    | 'booking_request'
    | 'booking_status'
    | 'new_message'
    | 'system'
    | 'verification'
    | 'roommate_request'
    | 'sublet_request'
    | 'sublet_approved'
    | 'swap_match'
    | 'swap_request'
    | 'swap_confirmed';

const notificationsKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationsKeys.all, 'list'] as const,
    list: (userId: string) => [...notificationsKeys.lists(), userId] as const,
    unread: (userId: string) => [...notificationsKeys.list(userId), 'unread'] as const,
};

const fetchNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        throw error;
    }

    return data || [];
};

const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        throw error;
    }
};

const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        throw error;
    }
};

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: Error | null;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const { user, session, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const userId = user?.id;
    const isReady = !authLoading && !!userId && !!session?.access_token;

    const {
        data: notifications = [],
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationsKeys.list(userId || ''),
        queryFn: () => fetchNotifications(userId!),
        enabled: isReady,
        staleTime: 15 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });

    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: notificationsKeys.list(userId || '') });

            const previousNotifications = queryClient.getQueryData<Notification[]>(
                notificationsKeys.list(userId || '')
            );

            queryClient.setQueryData<Notification[]>(
                notificationsKeys.list(userId || ''),
                (old) => old?.map((notification) => (
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )) || []
            );

            return { previousNotifications };
        },
        onError: (_error, _notificationId, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    notificationsKeys.list(userId || ''),
                    context.previousNotifications
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.list(userId || '') });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => markAllNotificationsAsRead(userId!),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: notificationsKeys.list(userId || '') });

            const previousNotifications = queryClient.getQueryData<Notification[]>(
                notificationsKeys.list(userId || '')
            );

            queryClient.setQueryData<Notification[]>(
                notificationsKeys.list(userId || ''),
                (old) => old?.map((notification) => ({ ...notification, is_read: true })) || []
            );

            return { previousNotifications };
        },
        onError: (_error, _vars, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    notificationsKeys.list(userId || ''),
                    context.previousNotifications
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationsKeys.list(userId || '') });
        },
    });

    const handleMarkAsRead = useCallback(async (notificationId: string) => {
        await markAsReadMutation.mutateAsync(notificationId);
    }, [markAsReadMutation]);

    const handleMarkAllAsRead = useCallback(async () => {
        await markAllAsReadMutation.mutateAsync();
    }, [markAllAsReadMutation]);

    const handleRefetch = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return {
        notifications,
        unreadCount,
        loading,
        error: error || null,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        refetch: handleRefetch,
    };
}

export default useNotifications;
