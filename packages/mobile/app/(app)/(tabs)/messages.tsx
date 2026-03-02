import { View, FlatList, ActivityIndicator, RefreshControl, Pressable, Text } from 'react-native';
import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConversations } from '../../../src/hooks/useConversations';
import { useUnreadCount } from '../../../src/hooks/useUnreadCount';
import { ConversationItem } from '../../../components/ConversationItem';
import { EmptyState } from '../../../components/EmptyState';
import type { Conversation } from '@roomz/shared';

export default function MessagesScreen() {
    const router = useRouter();
    const { conversations, isLoading, error, refetch } = useConversations();
    const { count: unreadCount } = useUnreadCount();

    const handleConversationPress = useCallback((conversation: Conversation) => {
        router.push(`/chat/${conversation.id}` as any);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Conversation }) => (
        <ConversationItem
            conversation={item}
            onPress={handleConversationPress}
        />
    ), [handleConversationPress]);

    const keyExtractor = useCallback((item: Conversation) => item.id, []);

    // Loading State
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 border-b border-gray-100 bg-surface">
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-text-primary">Tin nhắn</Text>
                    </View>
                </View>
                {/* Loading Indicator */}
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2a9d6a" />
                </View>
            </SafeAreaView>
        );
    }

    // Error State
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 border-b border-gray-100 bg-surface">
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-text-primary">Tin nhắn</Text>
                    </View>
                </View>
                {/* Error Message */}
                <EmptyState
                    title="Đã có lỗi xảy ra"
                    subtitle={error.message || 'Không thể tải danh sách tin nhắn'}
                    action={
                        <Pressable
                            onPress={() => refetch()}
                            className="bg-primary-500 px-6 py-3 rounded-xl active:opacity-80"
                            style={{ minHeight: 48, justifyContent: 'center' }}
                        >
                            <Text className="text-white font-medium">Thử lại</Text>
                        </Pressable>
                    }
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            {/* Header with Unread Count */}
            <View className="px-4 py-3 border-b border-gray-100 bg-surface">
                <View className="flex-row items-center">
                    <Text className="text-xl font-bold text-text-primary">Tin nhắn</Text>
                    {unreadCount > 0 && (
                        <View className="ml-2 bg-primary-500 px-2.5 py-0.5 rounded-full">
                            <Text className="text-xs font-semibold text-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Conversation List */}
            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                className="flex-1"
                contentContainerStyle={
                    conversations.length === 0
                        ? { flex: 1 }
                        : { paddingVertical: 8 }
                }
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => { }}
                        colors={['#2a9d6a']}
                        tintColor="#2a9d6a"
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
                ListEmptyComponent={
                    <EmptyState
                        icon={<MessageCircle size={48} color="#9ca3af" />}
                        title="Chưa có tin nhắn"
                        subtitle="Các cuộc hội thoại của bạn sẽ xuất hiện ở đây"
                    />
                }
                ItemSeparatorComponent={() => (
                    <View className="h-px bg-gray-100 mx-4" />
                )}
            />
        </SafeAreaView>
    );
}
