import { View, Text, Animated } from 'react-native';
import React, { useEffect, useRef } from 'react';

interface TypingIndicatorProps {
    text?: string;
}

export const TypingIndicator = React.memo(function TypingIndicator({
    text = 'Đang nhập...',
}: TypingIndicatorProps) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = animateDot(dot1, 0);
        const anim2 = animateDot(dot2, 150);
        const anim3 = animateDot(dot3, 300);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, [dot1, dot2, dot3]);

    const dotStyle = (animatedValue: Animated.Value) => ({
        opacity: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        }),
        transform: [
            {
                translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                }),
            },
        ],
    });

    return (
        <View className="flex-row items-center self-start bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
            <Text className="text-sm text-text-secondary italic mr-2">
                {text}
            </Text>
            <View className="flex-row items-end h-4">
                <Animated.Text
                    style={dotStyle(dot1)}
                    className="text-text-secondary text-lg leading-none"
                >
                    .
                </Animated.Text>
                <Animated.Text
                    style={dotStyle(dot2)}
                    className="text-text-secondary text-lg leading-none"
                >
                    .
                </Animated.Text>
                <Animated.Text
                    style={dotStyle(dot3)}
                    className="text-text-secondary text-lg leading-none"
                >
                    .
                </Animated.Text>
            </View>
        </View>
    );
});
