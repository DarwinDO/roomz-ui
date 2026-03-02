import { View, Text, Image, Pressable } from 'react-native';
import React from 'react';
import { MapPin, Bed, Bath, Maximize, BadgeCheck } from 'lucide-react-native';
import { PriceDisplay } from './PriceDisplay';
import { FavoriteButton } from './FavoriteButton';
import type { RoomWithDetails } from '@roomz/shared';

interface RoomCardProps {
    room: RoomWithDetails;
    onPress?: () => void;
}

export const RoomCard = React.memo(function RoomCard({
    room,
    onPress,
}: RoomCardProps) {
    const primaryImage = room.images?.find((img) => img.is_primary)?.image_url
        || room.images?.[0]?.image_url;

    const displayAddress = room.district && room.city
        ? `${room.district}, ${room.city}`
        : room.address;

    return (
        <Pressable
            onPress={onPress}
            className="bg-surface rounded-xl shadow-sm overflow-hidden mb-4 mx-4 border border-gray-100 active:scale-[0.99]"
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
            {/* Image Section */}
            <View className="relative">
                {primaryImage ? (
                    <Image
                        source={{ uri: primaryImage }}
                        className="w-full h-48 bg-gray-200"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-48 bg-gray-200 items-center justify-center">
                        <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                            <View className="w-8 h-8 border-2 border-gray-400 rounded" />
                        </View>
                    </View>
                )}

                {/* Favorite Button */}
                <View className="absolute top-3 right-3">
                    <FavoriteButton itemId={room.id} itemType="room" size={22} />
                </View>

                {/* Verified Badge */}
                {room.is_verified && (
                    <View className="absolute top-3 left-3 flex-row items-center bg-primary-500 px-2 py-1 rounded-full">
                        <BadgeCheck size={14} color="white" />
                        <Text className="ml-1 text-xs font-medium text-white">Đã xác minh</Text>
                    </View>
                )}

                {/* Room Type Badge */}
                <View className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded">
                    <Text className="text-xs text-white capitalize">
                        {room.room_type === 'private' && 'Phòng riêng'}
                        {room.room_type === 'shared' && 'Ở ghép'}
                        {room.room_type === 'studio' && 'Studio'}
                        {room.room_type === 'entire' && 'Nguyên căn'}
                        {!['private', 'shared', 'studio', 'entire'].includes(room.room_type) && room.room_type}
                    </Text>
                </View>
            </View>

            {/* Content Section */}
            <View className="p-4">
                {/* Title & Price */}
                <View className="flex-row justify-between items-start">
                    <Text className="flex-1 text-lg font-semibold text-text-primary mr-2" numberOfLines={2}>
                        {room.title}
                    </Text>
                    <PriceDisplay price={room.price_per_month} size="lg" />
                </View>

                {/* Address */}
                <View className="flex-row items-center mt-2">
                    <MapPin size={14} color="#6b7280" />
                    <Text className="ml-1 text-sm text-text-secondary flex-1" numberOfLines={1}>
                        {displayAddress}
                    </Text>
                </View>

                {/* Room Stats */}
                <View className="flex-row items-center mt-3 gap-4">
                    {room.area_sqm && (
                        <View className="flex-row items-center">
                            <Maximize size={14} color="#6b7280" />
                            <Text className="ml-1 text-sm text-text-secondary">
                                {room.area_sqm} m²
                            </Text>
                        </View>
                    )}
                    {room.bedroom_count !== null && room.bedroom_count !== undefined && (
                        <View className="flex-row items-center">
                            <Bed size={14} color="#6b7280" />
                            <Text className="ml-1 text-sm text-text-secondary">
                                {room.bedroom_count} PN
                            </Text>
                        </View>
                    )}
                    {room.bathroom_count !== null && room.bathroom_count !== undefined && (
                        <View className="flex-row items-center">
                            <Bath size={14} color="#6b7280" />
                            <Text className="ml-1 text-sm text-text-secondary">
                                {room.bathroom_count} WC
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
});
