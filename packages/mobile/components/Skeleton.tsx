import React, { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle, type DimensionValue } from 'react-native';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton = React.memo(function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = 4,
    style,
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        shimmer.start();
        return () => {
            shimmer.stop();
        };
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#e2e8f0',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    transform: [{ translateX }],
                    backgroundColor: 'rgba(255,255,255,0.5)',
                }}
            />
        </View>
    );
});

interface SkeletonCardProps {
    lines?: number;
    hasImage?: boolean;
}

export const SkeletonCard = React.memo(function SkeletonCard({
    lines = 2,
    hasImage = true,
}: SkeletonCardProps) {
    return (
        <View className="p-4 bg-surface rounded-xl mb-4">
            <View className="flex-row">
                {hasImage && (
                    <Skeleton width={80} height={80} borderRadius={8} style={{ marginRight: 12 }} />
                )}
                <View className="flex-1">
                    <Skeleton width="80%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
                    {Array.from({ length: lines }).map((_, i) => (
                        <Skeleton
                            key={i}
                            width={i === lines - 1 ? '60%' : '100%'}
                            height={14}
                            borderRadius={4}
                            style={{ marginBottom: 6 }}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
});

export const SkeletonList = React.memo(function SkeletonList({
    count = 3,
}: {
    count?: number;
}) {
    return (
        <View className="px-4 pt-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
});
