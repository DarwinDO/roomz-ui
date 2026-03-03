/**
 * useNotifications Hook
 * Realtime notifications with Supabase subscription
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
    | 'verification';

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;

            const notifs = data || [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.is_read).length);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể tải thông báo';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (updateError) {
            console.error('[useNotifications] Mark as read error:', updateError);
            return;
        }

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.id) return;

        const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (updateError) {
            console.error('[useNotifications] Mark all as read error:', updateError);
            return;
        }

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, [user?.id]);

    // Setup realtime subscription
    useEffect(() => {
        if (!user?.id) return;

        let isMounted = true;

        // Initial fetch
        fetchNotifications();

        // Stable channel name - reuse same channel for same user
        const channelName = `notifications-${user.id}`;

        // Check if channel already exists to prevent duplicates
        const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
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
                    // Client-side filter: only process notifications for current user
                    if (newNotification.user_id !== user.id) return;

                    if (import.meta.env.DEV) {
                        console.log('[useNotifications] Received new notification:', payload);
                    }
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    if (import.meta.env.DEV) {
                        console.log('[useNotifications] ✅ Successfully subscribed to notifications');
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
    }, [user?.id]); // Remove fetchNotifications from deps - it's stable via useCallback

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
}

export default useNotifications;
