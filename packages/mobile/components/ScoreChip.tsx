import React from 'react';
import { View, Text } from 'react-native';

interface ScoreChipProps {
    icon: string;
    label: string;
    score: number;
    color?: string;
}

export const ScoreChip = React.memo(function ScoreChip({
    icon,
    label,
    score,
}: ScoreChipProps) {
    return (
        <View className="flex-row items-center bg-primary-50 px-2 py-1 rounded-full">
            <Text className="text-xs mr-1">{icon}</Text>
            <Text className="text-xs text-gray-700 mr-1">{label}</Text>
            <Text className="text-xs font-semibold text-primary-600">{score}%</Text>
        </View>
    );
});
