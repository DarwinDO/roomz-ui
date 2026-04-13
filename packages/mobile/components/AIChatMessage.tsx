import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { RomiChatAction } from '@roomz/shared/services/ai-chatbot';

interface AIChatMessageProps {
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    actions?: RomiChatAction[];
    onActionPress?: (action: RomiChatAction) => void;
}

export function AIChatMessage({ text, sender, timestamp, actions, onActionPress }: AIChatMessageProps) {
    const isUser = sender === 'user';

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('vi-VN', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <View className={`mb-3 flex-row gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <View
                className={`h-8 w-8 items-center justify-center rounded-full ${isUser ? 'bg-gray-200' : 'bg-primary-500'
                    }`}
            >
                <Text className="text-xs">
                    {isUser ? '👤' : '✨'}
                </Text>
            </View>

            <View className={`max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
                <View
                    className={`rounded-2xl px-4 py-2.5 ${isUser
                            ? 'rounded-tr-sm bg-primary-500'
                            : 'rounded-tl-sm bg-gray-100'
                        }`}
                >
                    <Text
                        className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-text-primary'
                            }`}
                    >
                        {text}
                    </Text>
                </View>

                {!isUser && actions && actions.length > 0 ? (
                    <View className="mt-2 flex-row flex-wrap gap-2">
                        {actions.slice(0, 3).map((action) => (
                            <TouchableOpacity
                                key={`${action.type}:${action.href}`}
                                onPress={() => onActionPress?.(action)}
                                className="rounded-full border border-primary-200 bg-white px-3 py-2"
                            >
                                <Text className="text-xs font-medium text-primary-600">
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : null}

                <Text className="mt-1 px-1 text-xs text-text-secondary">
                    {formatTime(timestamp)}
                </Text>
            </View>
        </View>
    );
}
