import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Linking,
    Dimensions,
    Alert,
} from 'react-native';
import React, { useCallback } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { startChatConversation } from '@roomz/shared';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
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
} from 'lucide-react-native';
import { useRoomDetail } from '../../../src/hooks/useRoomDetail';
import { RoomImageCarousel } from '../../../components/RoomImageCarousel';
import { AmenityGrid } from '../../../components/AmenityGrid';
import { LandlordCard } from '../../../components/LandlordCard';
import { FavoriteButton } from '../../../components/FavoriteButton';
import { PriceDisplay } from '../../../components/PriceDisplay';
import { EmptyState } from '../../../components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoomDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { data: room, isLoading, isError, error, refetch } = useRoomDetail(id);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleShare = useCallback(() => {
        // TODO: Implement share functionality
    }, []);

    const handleCall = useCallback(() => {
        if (room?.landlord?.phone) {
            Linking.openURL(`tel:${room.landlord.phone}`);
        }
    }, [room?.landlord?.phone]);

    const handleMessage = useCallback(async () => {
        if (!user) {
            Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để nhắn tin với chủ nhà', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng nhập', onPress: () => router.push('/login') },
            ]);
            return;
        }
        if (!room?.landlord?.id) return;

        try {
            const { id: conversationId } = await startChatConversation(
                supabase, room.landlord.id, user.id
            );
            router.push(`/chat/${conversationId}` as any);
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể tạo cuộc hội thoại. Vui lòng thử lại sau.');
        }
    }, [user, room, router]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#2a9d6a" />
            </SafeAreaView>
        );
    }

    if (isError || !room) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-row items-center px-4 py-3">
                    <Pressable onPress={handleBack} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#0f172a" />
                    </Pressable>
                </View>
                <EmptyState
                    title={isError ? 'Đã có lỗi xảy ra' : 'Không tìm thấy phòng'}
                    subtitle={error?.message || 'Phòng này có thể đã bị xóa hoặc không tồn tại'}
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

    const displayAddress = room.district && room.city
        ? `${room.address}, ${room.district}, ${room.city}`
        : room.address;

    const availableDate = room.available_from
        ? new Date(room.available_from).toLocaleDateString('vi-VN')
        : null;

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
                        itemId={room.id}
                        itemType="room"
                        size={22}
                        className="bg-white/90"
                    />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Image Carousel */}
                <RoomImageCarousel
                    images={room.images || []}
                    height={SCREEN_WIDTH * 0.75}
                />

                {/* Content */}
                <View className="px-4 py-4">
                    {/* Title & Price */}
                    <Text className="text-2xl font-bold text-text-primary leading-tight">
                        {room.title}
                    </Text>
                    <View className="mt-2">
                        <PriceDisplay price={room.price_per_month} size="lg" />
                    </View>

                    {/* Address */}
                    <View className="flex-row items-start mt-3">
                        <MapPin size={18} color="#6b7280" className="mt-0.5" />
                        <Text className="ml-2 text-text-secondary flex-1">
                            {displayAddress}
                        </Text>
                    </View>

                    {/* Room Stats */}
                    <View className="flex-row mt-4 p-4 bg-gray-50 rounded-xl">
                        {room.area_sqm && (
                            <View className="flex-1 items-center">
                                <Maximize size={20} color="#2a9d6a" />
                                <Text className="mt-1 text-sm font-medium text-text-primary">
                                    {room.area_sqm} m²
                                </Text>
                                <Text className="text-xs text-text-secondary">Diện tích</Text>
                            </View>
                        )}
                        {room.bedroom_count !== null && room.bedroom_count !== undefined && (
                            <View className="flex-1 items-center border-l border-gray-200">
                                <Bed size={20} color="#2a9d6a" />
                                <Text className="mt-1 text-sm font-medium text-text-primary">
                                    {room.bedroom_count}
                                </Text>
                                <Text className="text-xs text-text-secondary">Phòng ngủ</Text>
                            </View>
                        )}
                        {room.bathroom_count !== null && room.bathroom_count !== undefined && (
                            <View className="flex-1 items-center border-l border-gray-200">
                                <Bath size={20} color="#2a9d6a" />
                                <Text className="mt-1 text-sm font-medium text-text-primary">
                                    {room.bathroom_count}
                                </Text>
                                <Text className="text-xs text-text-secondary">WC</Text>
                            </View>
                        )}
                        {availableDate && (
                            <View className="flex-1 items-center border-l border-gray-200">
                                <Calendar size={20} color="#2a9d6a" />
                                <Text className="mt-1 text-sm font-medium text-text-primary">
                                    {availableDate}
                                </Text>
                                <Text className="text-xs text-text-secondary">Có thể vào</Text>
                            </View>
                        )}
                    </View>

                    {/* Amenities */}
                    {room.amenities && (
                        <View className="mt-6">
                            <Text className="text-lg font-semibold text-text-primary mb-3">
                                Tiện ích
                            </Text>
                            <AmenityGrid amenities={room.amenities} size="md" />
                        </View>
                    )}

                    {/* Description */}
                    {room.description && (
                        <View className="mt-6">
                            <Text className="text-lg font-semibold text-text-primary mb-3">
                                Mô tả
                            </Text>
                            <Text className="text-text-secondary leading-relaxed">
                                {room.description}
                            </Text>
                        </View>
                    )}

                    {/* Landlord */}
                    {room.landlord && (
                        <View className="mt-6">
                            <Text className="text-lg font-semibold text-text-primary mb-3">
                                Thông tin chủ nhà
                            </Text>
                            <LandlordCard
                                landlord={room.landlord}
                                onContact={handleCall}
                                onMessage={handleMessage}
                            />
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
                        disabled={!room?.landlord?.id}
                        className="flex-1 flex-row items-center justify-center bg-primary-50 rounded-xl py-4 disabled:opacity-50"
                    >
                        <MessageCircle size={20} color="#2a9d6a" />
                        <Text className="ml-2 font-semibold text-primary-600">Nhắn tin</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleCall}
                        className="flex-1 flex-row items-center justify-center bg-primary-500 rounded-xl py-4"
                        disabled={!room.landlord?.phone}
                    >
                        <Phone size={20} color="white" />
                        <Text className="ml-2 font-semibold text-white">Gọi ngay</Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
