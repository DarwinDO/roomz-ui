import { View, Text, Image, Pressable } from 'react-native';
import React, { useCallback } from 'react';
import type { Conversation } from '@roomz/shared';
import { RelativeTime } from './RelativeTime';
import { UnreadBadge } from './UnreadBadge';

interface ConversationItemProps {
    conversation: Conversation;
    onPress?: (conversation: Conversation) => void;
}

export const ConversationItem = React.memo(function ConversationItem({
    conversation,
    onPress,
}: ConversationItemProps) {
    const handlePress = useCallback(() => {
        onPress?.(conversation);
    }, [onPress, conversation]);

    const { participant, lastMessage, unreadCount } = conversation;

    return (
        <Pressable
            onPress={handlePress}
            className="flex-row items-center px-4 py-3 bg-surface active:bg-gray-50"
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
            {/* Avatar */}
            <View className="relative">
                {participant.avatar_url ? (
                    <Image
                        source={{ uri: participant.avatar_url }}
                        className="w-12 h-12 rounded-full bg-primary-100"
                    />
                ) : (
                    <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                        <Text className="text-lg font-semibold text-primary-600">
                            {participant.full_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {/* Unread Badge on Avatar */}
                {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1">
                        <UnreadBadge count={unreadCount} />
                    </View>
                )}
            </View>

            {/* Content */}
            <View className="flex-1 ml-3">
                {/* Name and Time */}
                <View className="flex-row justify-between items-center">
                    <Text
                        className={`font-semibold text-text-primary flex-1 mr-2 ${unreadCount > 0 ? 'font-bold' : ''
                            }`}
                        numberOfLines={1}
                    >
                        {participant.full_name}
                    </Text>
                    {lastMessage?.created_at && (
                        <RelativeTime date={lastMessage.created_at} />
                    )}
                </View>

                {/* Last Message */}
                <View className="flex-row items-center mt-1">
                    <Text
                        className={`text-sm text-text-secondary flex-1 mr-2 ${unreadCount > 0 ? 'font-medium text-text-primary' : ''
                            }`}
                        numberOfLines={1}
                    >
                        {lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
                    </Text>
                </View>

                {/* Room Context (if applicable) */}
                {conversation.roomTitle && (
                    <Text className="text-xs text-text-secondary mt-1" numberOfLines={1}>
                        Về: {conversation.roomTitle}
                    </Text>
                )}
            </View>
        </Pressable>
    );
});
