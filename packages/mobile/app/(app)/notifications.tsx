import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCheck, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { NotificationItem } from '../../components/NotificationItem';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
    id: string;
    user_id: string;
    type: 'message' | 'match' | 'verification' | 'deal' | 'system' | 'new_message' | 'booking_request' | 'booking_status' | 'roommate_request' | 'sublet_request' | 'sublet_approved' | 'swap_match' | 'swap_request' | 'swap_confirmed';
    title: string;
    body: string;  // maps to 'content' column in DB
    data?: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications } = useQuery<Notification[]>({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });
            if (error) {
                // Table may not exist yet
                console.warn('Notifications query failed:', error.message);
                return [];
            }
            // Map 'content' column to 'body' for interface compatibility
            return (data || []).map(n => ({ ...n, body: n.content }));
        },
        enabled: !!user?.id,
        retry: false,  // Không retry nếu table không tồn tại
    });

    const markAllRead = useMutation({
        mutationFn: async () => {
            try {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('user_id', user!.id)
                    .eq('is_read', false);
            } catch (e) {
                console.warn('markAllRead failed:', e);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            try {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', id);
            } catch (e) {
                console.warn('markAsRead failed:', e);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleNotificationPress = (notification: Notification) => {
        markAsRead.mutate(notification.id);

        if (notification.data?.conversation_id) {
            router.push(`/(app)/chat/${notification.data.conversation_id}` as never);
        } else if (notification.data?.post_id) {
            router.push(`/(app)/post/${notification.data.post_id}` as never);
        } else if (notification.data?.room_id) {
            router.push(`/(app)/room/${notification.data.room_id}` as never);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-text-primary">Thông báo</Text>
                <TouchableOpacity
                    onPress={() => markAllRead.mutate()}
                    className="p-2 -mr-2"
                    disabled={markAllRead.isPending}
                >
                    <CheckCheck size={24} color="#0891b2" />
                </TouchableOpacity>
            </View>

            {!notifications || notifications.length === 0 ? (
                <EmptyState
                    icon={<Bell size={48} color="#94a3b8" />}
                    title="Chưa có thông báo"
                    subtitle="Bạn sẽ nhận được thông báo về tin nhắn, match và ưu đãi mới"
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationItem
                            {...item}
                            onPress={() => handleNotificationPress(item)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}
