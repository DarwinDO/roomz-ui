import {
    View,
    Text,
    ScrollView,
    Pressable,
} from 'react-native';
import React, { useCallback } from 'react';
import { DEFAULT_QUICK_REPLIES } from '@roomz/shared';
import type { QuickReply } from '@roomz/shared';

interface QuickRepliesProps {
    replies?: QuickReply[];
    onSelect: (reply: QuickReply) => void;
}

export { DEFAULT_QUICK_REPLIES };

export const QuickReplies = React.memo(function QuickReplies({
    replies = DEFAULT_QUICK_REPLIES,
    onSelect,
}: QuickRepliesProps) {
    const handlePress = useCallback(
        (reply: QuickReply) => {
            onSelect(reply);
        },
        [onSelect]
    );

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 py-2"
            keyboardShouldPersistTaps="handled"
        >
            {replies.map((reply) => (
                <Pressable
                    key={reply.id}
                    onPress={() => handlePress(reply)}
                    className="px-4 py-2 bg-gray-100 rounded-full mr-2 flex-row items-center active:bg-gray-200"
                    hitSlop={4}
                >
                    {reply.icon && (
                        <Text className="text-base mr-1.5">{reply.icon}</Text>
                    )}
                    <Text className="text-sm text-text-primary">
                        {reply.text}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );
});
