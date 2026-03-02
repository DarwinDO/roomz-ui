import {
    View,
    Text,
    FlatList,
    Pressable,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useChatMessages } from '../../../src/hooks/useChatMessages';
import { useSendMessage } from '../../../src/hooks/useSendMessage';
import { MessageBubble } from '../../../components/MessageBubble';
import { ChatInput } from '../../../components/ChatInput';
import { TypingIndicator } from '../../../components/TypingIndicator';
import { QuickReplies } from '../../../components/QuickReplies';
import { DEFAULT_QUICK_REPLIES } from '@roomz/shared';
import { EmptyState } from '../../../components/EmptyState';
import { createTypingChannel } from '@roomz/shared';
import { supabase } from '../../../src/lib/supabase';
import type { MessageWithSender, QuickReply } from '@roomz/shared';

interface MessageItem {
    type: 'message' | 'date';
    id: string;
    message?: MessageWithSender;
    date?: string;
    showAvatar?: boolean;
    isFirstInGroup?: boolean;
}

function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hôm nay';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua';
    }
    return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
}

export default function ChatScreen() {
    const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const flatListRef = useRef<FlatList>(null);
    const typingChannelRef = useRef<ReturnType<typeof createTypingChannel> | null>(null);

    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [otherUserName, setOtherUserName] = useState('');
    const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(false);

    const { messages, isLoading, error, refetch } = useChatMessages(conversationId);
    const { sendMessage, isPending } = useSendMessage();

    // Extract other participant info from messages
    useEffect(() => {
        if (messages.length > 0 && user) {
            const otherParticipantMessage = messages.find((m) => m.sender_id !== user.id);
            if (otherParticipantMessage?.sender) {
                setOtherUserName(otherParticipantMessage.sender.full_name);
                setOtherUserAvatar(otherParticipantMessage.sender.avatar_url);
            }
        }
    }, [messages, user]);

    // Setup typing channel
    useEffect(() => {
        if (!conversationId || !user) return;

        typingChannelRef.current = createTypingChannel(
            supabase,
            conversationId,
            user.id,
            user.user_metadata?.full_name || 'User',
            (typing) => {
                setIsOtherUserTyping(typing.isTyping);
            }
        );

        return () => {
            typingChannelRef.current?.subscription.unsubscribe();
            typingChannelRef.current = null;
        };
    }, [conversationId, user]);

    // Process messages with date separators and grouping
    const processedItems = React.useMemo((): MessageItem[] => {
        if (!messages.length) return [];

        const items: MessageItem[] = [];
        let lastDate = '';
        let lastSenderId = '';

        // Process in reverse order since FlatList is inverted
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            const messageDate = new Date(message.created_at).toDateString();

            // Add date separator if date changed
            if (messageDate !== lastDate) {
                items.unshift({
                    type: 'date',
                    id: `date-${message.created_at}`,
                    date: formatDateHeader(message.created_at),
                });
                lastDate = messageDate;
            }

            // Determine if this is first message in a group from same sender
            const isFirstInGroup = message.sender_id !== lastSenderId;
            lastSenderId = message.sender_id;

            items.unshift({
                type: 'message',
                id: message.id,
                message,
                showAvatar: message.sender_id !== user?.id && isFirstInGroup,
                isFirstInGroup,
            });
        }

        return items;
    }, [messages, user?.id]);

    // Handle sending message
    const handleSend = useCallback(
        (content: string) => {
            if (!conversationId || !content.trim()) return;

            sendMessage({ conversationId, content: content.trim() });

            // Send typing stopped
            typingChannelRef.current?.sendTyping(false);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }, 100);
        },
        [conversationId, sendMessage]
    );

    // Handle quick reply selection
    const handleQuickReply = useCallback(
        (reply: QuickReply) => {
            handleSend(reply.text);
        },
        [handleSend]
    );

    // Handle typing indicator
    const handleTyping = useCallback((isTyping: boolean) => {
        typingChannelRef.current?.sendTyping(isTyping);
    }, []);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Render message item
    const renderItem = useCallback(
        ({ item }: { item: MessageItem }) => {
            if (item.type === 'date' && item.date) {
                return (
                    <View className="items-center my-3">
                        <View className="bg-gray-100 px-3 py-1 rounded-full">
                            <Text className="text-xs text-text-secondary">{item.date}</Text>
                        </View>
                    </View>
                );
            }

            if (item.type === 'message' && item.message) {
                const isMine = item.message.sender_id === user?.id;

                return (
                    <View
                        className={`flex-row ${isMine ? 'justify-end' : 'justify-start'} mb-1 ${item.isFirstInGroup ? 'mt-3' : 'mt-0.5'
                            }`}
                    >
                        {/* Avatar for other user's messages */}
                        {!isMine && item.showAvatar && (
                            <View className="mr-2 self-end mb-5">
                                {otherUserAvatar ? (
                                    <Image
                                        source={{ uri: otherUserAvatar }}
                                        className="w-8 h-8 rounded-full bg-primary-100"
                                    />
                                ) : (
                                    <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                                        <Text className="text-sm font-semibold text-primary-600">
                                            {otherUserName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        {!isMine && !item.showAvatar && <View className="w-8 mr-2" />}

                        <MessageBubble message={item.message} isMine={isMine} showTime={true} />
                    </View>
                );
            }

            return null;
        },
        [user?.id, otherUserAvatar, otherUserName]
    );

    // Key extractor
    const keyExtractor = useCallback((item: MessageItem) => item.id, []);

    // Show loading state
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2a9d6a" />
                </View>
            </SafeAreaView>
        );
    }

    // Show error state
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-3 border-b border-gray-100 bg-surface flex-row items-center">
                    <Pressable onPress={handleBack} className="p-2 -ml-2" hitSlop={8}>
                        <ArrowLeft size={24} color="#0f172a" />
                    </Pressable>
                </View>
                <EmptyState
                    title="Đã có lỗi xảy ra"
                    subtitle={error.message || 'Không thể tải tin nhắn'}
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

    const showQuickReplies = messages.length < 5;

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-3 border-b border-gray-100 bg-surface flex-row items-center">
                <Pressable onPress={handleBack} className="p-2 -ml-2" hitSlop={8}>
                    <ArrowLeft size={24} color="#0f172a" />
                </Pressable>

                {/* Avatar and Name */}
                <View className="flex-row items-center flex-1 ml-2">
                    {otherUserAvatar ? (
                        <Image
                            source={{ uri: otherUserAvatar }}
                            className="w-10 h-10 rounded-full bg-primary-100"
                        />
                    ) : (
                        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                            <Text className="text-lg font-semibold text-primary-600">
                                {otherUserName ? otherUserName.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-semibold text-text-primary" numberOfLines={1}>
                            {otherUserName || 'Đang tải...'}
                        </Text>
                        {isOnline && (
                            <View className="flex-row items-center">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                <Text className="text-xs text-text-secondary">Đang hoạt động</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Message List */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={processedItems}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    inverted={true}
                    className="flex-1 px-4"
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    initialNumToRender={20}
                    ListEmptyComponent={
                        <EmptyState
                            title="Chưa có tin nhắn"
                            subtitle="Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên"
                        />
                    }
                    ListFooterComponent={
                        isOtherUserTyping ? (
                            <View className="mt-3 ml-10">
                                <TypingIndicator />
                            </View>
                        ) : null
                    }
                />

                {/* Quick Replies */}
                {showQuickReplies && messages.length < 5 && (
                    <QuickReplies
                        replies={DEFAULT_QUICK_REPLIES}
                        onSelect={handleQuickReply}
                    />
                )}

                {/* Input Bar */}
                <ChatInput
                    onSend={handleSend}
                    onTyping={handleTyping}
                    disabled={isPending}
                    placeholder="Nhập tin nhắn..."
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
