import { View, Text } from 'react-native';
import React from 'react';
import type { MessageWithSender } from '@roomz/shared';
import { Check, CheckCheck } from 'lucide-react-native';

interface MessageBubbleProps {
    message: MessageWithSender;
    isMine: boolean;
    showTime?: boolean;
}

export const MessageBubble = React.memo(function MessageBubble({
    message,
    isMine,
    showTime = true,
}: MessageBubbleProps) {
    const bubbleClass = isMine
        ? 'bg-primary-500 text-white rounded-2xl rounded-br-sm'
        : 'bg-gray-100 text-text-primary rounded-2xl rounded-bl-sm';

    const timeClass = isMine ? 'text-white/70' : 'text-text-secondary';

    return (
        <View
            className={`max-w-[80%] ${isMine ? 'self-end' : 'self-start'}`}
        >
            <View className={`px-4 py-2 ${bubbleClass}`}>
                <Text
                    className={`text-base leading-5 ${isMine ? 'text-white' : 'text-text-primary'
                        }`}
                >
                    {message.content}
                </Text>
            </View>

            {showTime && (
                <View
                    className={`flex-row items-center mt-1 ${isMine ? 'justify-end' : 'justify-start'
                        }`}
                >
                    <Text className={`text-xs ${timeClass}`}>
                        {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>

                    {/* Read Status - Only for my messages */}
                    {isMine && (
                        <View className="ml-1">
                            {message.is_read ? (
                                <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
                            ) : (
                                <Check size={14} color="rgba(255,255,255,0.7)" />
                            )}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
});
