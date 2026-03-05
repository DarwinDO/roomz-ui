/**
 * useNotifications Hook
 * Realtime notifications with TanStack Query + Supabase subscription
 * 
 * IMPROVEMENTS:
 * - Uses TanStack Query for initial data fetch (caching, background refetch)
 * - Keeps realtime subscription for live updates
 * - Optimistic updates for markAsRead operations
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts';
import type { RealtimeChannel } from '@supabase/supabase-js';
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

// Query keys for TanStack Query
const notificationsKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationsKeys.all, 'list'] as const,
    list: (userId: string) => [...notificationsKeys.lists(), userId] as const,
    unread: (userId: string) => [...notificationsKeys.list(userId), 'unread'] as const,
};

// Fetch notifications from API
const fetchNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
};

// Mark single notification as read
const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
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
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const userId = user?.id;

    // TanStack Query for initial data fetch
    const {
        data: notifications = [],
        isLoading: loading,
        error,
        refetch,
    } = useQuery({
        queryKey: notificationsKeys.list(userId || ''),
        queryFn: () => fetchNotifications(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // Optimistic mutation for marking single notification as read
    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onMutate: async (notificationId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: notificationsKeys.list(userId || '') });

            // Snapshot previous value
            const previousNotifications = queryClient.getQueryData<Notification[]>(
                notificationsKeys.list(userId || '')
            );

            // Optimistically update
            queryClient.setQueryData<Notification[]>(
                notificationsKeys.list(userId || ''),
                (old) =>
                    old?.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)) || []
            );

            return { previousNotifications };
        },
        onError: (_err, _notificationId, context) => {
            // Rollback on error
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    notificationsKeys.list(userId || ''),
                    context.previousNotifications
                );
            }
        },
        onSettled: () => {
            // Always refetch after error or success to ensure sync
            queryClient.invalidateQueries({ queryKey: notificationsKeys.list(userId || '') });
        },
    });

    // Optimistic mutation for marking all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: () => markAllNotificationsAsRead(userId!),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: notificationsKeys.list(userId || '') });

            const previousNotifications = queryClient.getQueryData<Notification[]>(
                notificationsKeys.list(userId || '')
            );

            queryClient.setQueryData<Notification[]>(
                notificationsKeys.list(userId || ''),
                (old) => old?.map((n) => ({ ...n, is_read: true })) || []
            );

            return { previousNotifications };
        },
        onError: (_err, _vars, context) => {
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

    // Realtime subscription for new notifications
    useEffect(() => {
        if (!userId) return;

        let isMounted = true;

        // Stable channel name
        const channelName = `notifications-${userId}`;

        // Check if channel already exists
        const existingChannel = supabase
            .getChannels()
            .find((c) => c.topic === `realtime:${channelName}`);
        if (existingChannel) {
            if (import.meta.env.DEV) {
                console.log('[useNotifications] Reusing existing channel');
            }
            channelRef.current = existingChannel;
            return;
        }

        if (import.meta.env.DEV) {
            console.log('[useNotifications] Setting up realtime subscription:', channelName);
        }

        // Subscribe to INSERT events
        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    if (!isMounted) return;

                    const newNotification = payload.new as Notification;
                    // Client-side filter
                    if (newNotification.user_id !== userId) return;

                    if (import.meta.env.DEV) {
                        console.log('[useNotifications] Received new notification:', payload);
                    }

                    // Add to query cache
                    queryClient.setQueryData<Notification[]>(
                        notificationsKeys.list(userId),
                        (old) => {
                            if (!old) return [newNotification];
                            // Avoid duplicates
                            if (old.some((n) => n.id === newNotification.id)) return old;
                            return [newNotification, ...old];
                        }
                    );
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    if (import.meta.env.DEV) {
                        console.log('[useNotifications] ✅ Successfully subscribed');
                    }
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('[useNotifications] ❌ Channel error:', err);
                }
            });

        return () => {
            isMounted = false;
            if (import.meta.env.DEV) {
                console.log('[useNotifications] Cleaning up subscription:', channelName);
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId, queryClient]);

    // Wrapped handlers
    const handleMarkAsRead = useCallback(
        async (notificationId: string) => {
            await markAsReadMutation.mutateAsync(notificationId);
        },
        [markAsReadMutation]
    );

    const handleMarkAllAsRead = useCallback(async () => {
        await markAllAsReadMutation.mutateAsync();
    }, [markAllAsReadMutation]);

    // Wrap refetch to match expected return type
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
