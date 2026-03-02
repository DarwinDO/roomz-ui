import {
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Linking,
    Dimensions,
} from 'react-native';
import React, { useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    MapPin,
    Bed,
    Bath,
    Maximize,
    Calendar,
    Share2,
    Phone,
    MessageCircle,
    Clock,
    Wallet,
    List,
} from 'lucide-react-native';
import { useSubletDetail } from '../../../src/hooks/useSubletDetail';
import { PriceDisplay } from '../../../components/PriceDisplay';
import { FavoriteButton } from '../../../components/FavoriteButton';
import { EmptyState } from '../../../components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SubletDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data: sublet, isLoading, isError, error, refetch } = useSubletDetail(id);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleShare = useCallback(() => {
        // TODO: Implement share functionality
    }, []);

    const handleCall = useCallback(() => {
        // TODO: Get owner phone from sublet data
    }, []);

    const handleMessage = useCallback(() => {
        // TODO: Navigate to chat
    }, []);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#2a9d6a" />
            </SafeAreaView>
        );
    }

    if (isError || !sublet) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-row items-center px-4 py-3">
                    <Pressable onPress={handleBack} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#0f172a" />
                    </Pressable>
                </View>
                <EmptyState
                    title={isError ? 'Đã có lỗi xảy ra' : 'Không tìm thấy tin sang nhượng'}
                    subtitle={error?.message || 'Tin này có thể đã bị xóa hoặc không tồn tại'}
                    action={
                        <Pressable
                            onPress={() => refetch()}
                            className="bg-primary-500 px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-medium">Thử lại</Text>
                        </Pressable>
                    }
                />
            </SafeAreaView>
        );
    }

    const room = sublet.original_room || sublet.room;
    const displayAddress = room?.district && room?.city
        ? `${room.address}, ${room.district}, ${room.city}`
        : room?.address || '';

    const startDate = sublet.start_date
        ? new Date(sublet.start_date).toLocaleDateString('vi-VN')
        : null;
    const endDate = sublet.end_date
        ? new Date(sublet.end_date).toLocaleDateString('vi-VN')
        : null;

    const primaryImage = sublet.images?.find((img) => img.is_primary)?.image_url
        || sublet.images?.[0]?.image_url;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 py-3">
                <Pressable
                    onPress={handleBack}
                    className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                    hitSlop={8}
                >
                    <ChevronLeft size={24} color="#0f172a" />
                </Pressable>
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={handleShare}
                        className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-sm"
                        hitSlop={8}
                    >
                        <Share2 size={20} color="#0f172a" />
                    </Pressable>
                    <FavoriteButton
                        itemId={sublet.id}
                        itemType="sublet"
                        size={22}
                        className="bg-white/90"
                    />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Image */}
                <View className="relative" style={{ height: SCREEN_WIDTH * 0.6 }}>
                    {primaryImage ? (
                        <Image
                            source={{ uri: primaryImage }}
                            className="w-full h-full bg-gray-200"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-gray-200 items-center justify-center">
                            <View className="w-20 h-20 rounded-full bg-gray-300 items-center justify-center">
                                <View className="w-10 h-10 border-2 border-gray-400 rounded" />
                            </View>
                        </View>
                    )}
                    {/* Sublet Badge */}
                    <View className="absolute bottom-4 left-4 bg-primary-500 px-3 py-1.5 rounded-full">
                        <Text className="text-white font-medium text-sm">Sang nhượng</Text>
                    </View>
                </View>

                {/* Content */}
                <View className="px-4 py-4">
                    {/* Title */}
                    <Text className="text-2xl font-bold text-text-primary leading-tight">
                        {room?.title || 'Phòng sang nhượng'}
                    </Text>

                    {/* Prices */}
                    <View className="mt-3">
                        <Text className="text-xs text-text-secondary">Giá sang nhượng</Text>
                        <PriceDisplay price={sublet.sublet_price} size="lg" />
                    </View>

                    {/* Date Range */}
                    <View className="mt-4 p-4 bg-primary-50 rounded-xl">
                        <View className="flex-row items-center">
                            <Clock size={20} color="#2a9d6a" />
                            <Text className="ml-2 font-semibold text-primary-700">
                                Thờigian sang nhượng
                            </Text>
                        </View>
                        <Text className="mt-2 text-text-primary">
                            {startDate && endDate
                                ? `Từ ${startDate} đến ${endDate}`
                                : 'Liên hệ để biết thêm chi tiết'}
                        </Text>
                    </View>

                    {/* Address */}
                    {displayAddress && (
                        <View className="flex-row items-start mt-4">
                            <MapPin size={18} color="#6b7280" />
                            <Text className="ml-2 text-text-secondary flex-1">
                                {displayAddress}
                            </Text>
                        </View>
                    )}

                    {/* Room Stats */}
                    {room && (
                        <View className="flex-row mt-4 p-4 bg-gray-50 rounded-xl">
                            {room.area_sqm && (
                                <View className="flex-1 items-center">
                                    <Maximize size={20} color="#2a9d6a" />
                                    <Text className="mt-1 text-sm font-medium text-text-primary">
                                        {room.area_sqm} m²
                                    </Text>
                                </View>
                            )}
                            {room.bedroom_count !== null && room.bedroom_count !== undefined && (
                                <View className="flex-1 items-center border-l border-gray-200">
                                    <Bed size={20} color="#2a9d6a" />
                                    <Text className="mt-1 text-sm font-medium text-text-primary">
                                        {room.bedroom_count} PN
                                    </Text>
                                </View>
                            )}
                            {room.bathroom_count !== null && room.bathroom_count !== undefined && (
                                <View className="flex-1 items-center border-l border-gray-200">
                                    <Bath size={20} color="#2a9d6a" />
                                    <Text className="mt-1 text-sm font-medium text-text-primary">
                                        {room.bathroom_count} WC
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Description */}
                    {sublet.description && (
                        <View className="mt-6">
                            <View className="flex-row items-center mb-3">
                                <List size={18} color="#0f172a" />
                                <Text className="ml-2 text-lg font-semibold text-text-primary">
                                    Mô tả
                                </Text>
                            </View>
                            <Text className="text-text-secondary leading-relaxed">
                                {sublet.description}
                            </Text>
                        </View>
                    )}

                    {/* Requirements */}
                    {sublet.requirements && sublet.requirements.length > 0 && (
                        <View className="mt-6">
                            <Text className="text-lg font-semibold text-text-primary mb-3">
                                Yêu cầu
                            </Text>
                            {sublet.requirements.map((req, index) => (
                                <View key={index} className="flex-row items-center mb-2">
                                    <View className="w-2 h-2 rounded-full bg-primary-500 mr-2" />
                                    <Text className="text-text-secondary">{req}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Owner */}
                    {sublet.owner && (
                        <View className="mt-6">
                            <Text className="text-lg font-semibold text-text-primary mb-3">
                                Ngườidăng tin
                            </Text>
                            <View className="flex-row items-center p-4 bg-surface rounded-xl border border-gray-100">
                                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                                    <Text className="text-primary-600 font-semibold text-lg">
                                        {sublet.owner.full_name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="font-semibold text-text-primary">
                                        {sublet.owner.full_name}
                                    </Text>
                                    {sublet.owner.is_verified && (
                                        <Text className="text-xs text-primary-600">
                                            Đã xác minh
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Bottom Spacing for CTA */}
                    <View className="h-24" />
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-gray-100 px-4 py-4 pb-8">
                <View className="flex-row gap-3">
                    <Pressable
                        onPress={handleMessage}
                        className="flex-1 flex-row items-center justify-center bg-primary-50 rounded-xl py-4"
                    >
                        <MessageCircle size={20} color="#2a9d6a" />
                        <Text className="ml-2 font-semibold text-primary-600">Nhắn tin</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleCall}
                        className="flex-1 flex-row items-center justify-center bg-primary-500 rounded-xl py-4"
                    >
                        <Phone size={20} color="white" />
                        <Text className="ml-2 font-semibold text-white">Liên hệ</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
