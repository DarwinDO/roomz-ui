import React from 'react';
import { View, Text } from 'react-native';

interface AIChatMessageProps {
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export function AIChatMessage({ text, sender, timestamp }: AIChatMessageProps) {
    const isUser = sender === 'user';

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <View className={`flex-row gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <View
                className={`w-8 h-8 rounded-full items-center justify-center ${isUser ? 'bg-gray-200' : 'bg-primary-500'
                    }`}
            >
                <Text className="text-xs">
                    {isUser ? '👤' : '✨'}
                </Text>
            </View>

            {/* Message bubble */}
            <View className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <View
                    className={`rounded-2xl px-4 py-2.5 ${isUser
                            ? 'bg-primary-500 rounded-tr-sm'
                            : 'bg-gray-100 rounded-tl-sm'
                        }`}
                >
                    <Text
                        className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-text-primary'
                            }`}
                    >
                        {text}
                    </Text>
                </View>
                <Text className="text-xs text-text-secondary mt-1 px-1">
                    {formatTime(timestamp)}
                </Text>
            </View>
        </View>
    );
}
