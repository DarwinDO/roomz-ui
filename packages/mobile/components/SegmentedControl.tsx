import { View, Text, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface SegmentedControlProps {
    tabs: string[];
    activeTab: string;
    onChange: (tab: string) => void;
}

export const SegmentedControl = React.memo(function SegmentedControl({
    tabs,
    activeTab,
    onChange,
}: SegmentedControlProps) {
    const [tabWidth, setTabWidth] = useState(0);
    const activeIndex = tabs.indexOf(activeTab);
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (tabWidth > 0) {
            Animated.spring(translateX, {
                toValue: activeIndex * tabWidth,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        }
    }, [activeIndex, tabWidth, translateX]);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setTabWidth(width / tabs.length);
    }, [tabs.length]);

    return (
        <View
            className="flex-row bg-gray-100 rounded-full p-1 mx-4 my-3"
            onLayout={onLayout}
        >
            {/* Animated background indicator */}
            {tabWidth > 0 && (
                <Animated.View
                    className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm"
                    style={{
                        width: tabWidth - 8,
                        transform: [{ translateX: Animated.add(translateX, new Animated.Value(4)) }],
                    }}
                />
            )}

            {tabs.map((tab) => {
                const isActive = tab === activeTab;
                return (
                    <Pressable
                        key={tab}
                        onPress={() => onChange(tab)}
                        className="flex-1 py-2 px-4 rounded-full items-center justify-center"
                        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                    >
                        <Text
                            className={`text-sm font-medium ${isActive
                                ? 'text-gray-900'
                                : 'text-gray-500'
                                }`}
                        >
                            {tab}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
});
