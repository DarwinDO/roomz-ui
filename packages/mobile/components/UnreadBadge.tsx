import { View, Text } from 'react-native';
import React from 'react';

interface UnreadBadgeProps {
    count: number;
}

export const UnreadBadge = React.memo(function UnreadBadge({ count }: UnreadBadgeProps) {
    if (count <= 0) {
        return null;
    }

    const displayCount = count > 99 ? '99+' : count.toString();

    return (
        <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
            <Text className="text-white text-xs font-bold">
                {displayCount}
            </Text>
        </View>
    );
});
