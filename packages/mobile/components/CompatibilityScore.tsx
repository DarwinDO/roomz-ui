import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CompatibilityScoreProps {
    score: number;
    size?: number;
}

export const CompatibilityScore = React.memo(function CompatibilityScore({
    score,
    size = 64,
}: CompatibilityScoreProps) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(Math.max(score, 0), 100);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View style={{ width: size, height: size }} className="items-center justify-center">
            <Svg width={size} height={size} className="absolute">
                {/* Background track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#2a9d6a"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <Text className="text-sm font-bold text-gray-900">
                {score}%
            </Text>
        </View>
    );
});
