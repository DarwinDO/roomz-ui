import { View, Text } from 'react-native';
import React from 'react';
import {
    Wifi,
    Wind,
    Car,
    Waves,
    Refrigerator,
    Thermometer,
    Camera,
    Sun,
} from 'lucide-react-native';
import type { RoomAmenity } from '@roomz/shared';

interface AmenityGridProps {
    amenities: RoomAmenity | null | undefined;
    size?: 'sm' | 'md';
}

const amenityConfig: Array<{
    key: keyof RoomAmenity;
    label: string;
    icon: React.ElementType;
}> = [
        { key: 'wifi', label: 'WiFi', icon: Wifi },
        { key: 'air_conditioning', label: 'Điều hòa', icon: Wind },
        { key: 'parking', label: 'Chỗ để xe', icon: Car },
        { key: 'washing_machine', label: 'Máy giặt', icon: Waves },
        { key: 'refrigerator', label: 'Tủ lạnh', icon: Refrigerator },
        { key: 'heater', label: 'Máy nóng lạnh', icon: Thermometer },
        { key: 'security_camera', label: 'Camera', icon: Camera },
        { key: 'balcony', label: 'Ban công', icon: Sun },
    ];

const sizeClasses = {
    sm: {
        container: 'p-2',
        icon: 16,
        text: 'text-xs',
    },
    md: {
        container: 'p-3',
        icon: 20,
        text: 'text-sm',
    },
};

export const AmenityGrid = React.memo(function AmenityGrid({
    amenities,
    size = 'md',
}: AmenityGridProps) {
    if (!amenities) return null;

    const activeAmenities = amenityConfig.filter(
        (config) => amenities[config.key] === true
    );

    if (activeAmenities.length === 0) return null;

    const classes = sizeClasses[size];

    return (
        <View className="flex-row flex-wrap gap-2">
            {activeAmenities.map((amenity) => {
                const Icon = amenity.icon;
                return (
                    <View
                        key={amenity.key}
                        className={`flex-row items-center bg-primary-50 rounded-lg ${classes.container}`}
                    >
                        <Icon size={classes.icon} color="#2a9d6a" />
                        <Text className={`ml-2 text-primary-700 ${classes.text}`}>
                            {amenity.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
});
