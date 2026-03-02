import { View, ScrollView, Image, Text, Dimensions, Pressable } from 'react-native';
import React, { useState, useCallback } from 'react';
import type { RoomImage } from '@roomz/shared';

interface RoomImageCarouselProps {
    images: RoomImage[];
    height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const RoomImageCarousel = React.memo(function RoomImageCarousel({
    images,
    height = 280,
}: RoomImageCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(slideIndex);
    }, []);

    const validImages = images.filter((img) => img.image_url);

    if (validImages.length === 0) {
        return (
            <View
                className="bg-gray-200 items-center justify-center"
                style={{ height, width: SCREEN_WIDTH }}
            >
                <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
                    <View className="w-10 h-10 border-2 border-gray-400 rounded" />
                </View>
            </View>
        );
    }

    return (
        <View style={{ height }}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                className="flex-1"
            >
                {validImages.map((image, index) => (
                    <Pressable key={image.id || index} className="relative">
                        <Image
                            source={{ uri: image.image_url }}
                            className="bg-gray-200"
                            style={{ width: SCREEN_WIDTH, height }}
                            resizeMode="cover"
                        />
                    </Pressable>
                ))}
            </ScrollView>

            {/* Page Indicator */}
            {validImages.length > 1 && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                    {validImages.map((_, index) => (
                        <View
                            key={index}
                            className={`h-1.5 rounded-full ${index === activeIndex
                                    ? 'w-6 bg-white'
                                    : 'w-1.5 bg-white/60'
                                }`}
                        />
                    ))}
                </View>
            )}

            {/* Image Counter */}
            {validImages.length > 1 && (
                <View className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-medium">
                        {activeIndex + 1}/{validImages.length}
                    </Text>
                </View>
            )}
        </View>
    );
});
