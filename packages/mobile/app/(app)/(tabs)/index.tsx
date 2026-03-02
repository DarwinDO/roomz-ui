import { View, FlatList, ActivityIndicator, RefreshControl, Pressable, Text } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SearchX, SlidersHorizontal } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoomSearch } from '../../../src/hooks/useRoomSearch';
import { useRoomFilterStore } from '../../../src/stores/useRoomFilterStore';
import { SearchBar } from '../../../components/SearchBar';
import { RoomCard } from '../../../components/RoomCard';
import { EmptyState } from '../../../components/EmptyState';
import type { RoomWithDetails } from '@roomz/shared';

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { filters: storeFilters } = useRoomFilterStore();

    // Combine search query (local) + filters (store)
    const roomFilters = {
        ...storeFilters,
        searchQuery: searchQuery.trim() || undefined,
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = useRoomSearch(roomFilters);

    // Flatten pages for FlatList
    const rooms = data?.pages.flatMap((page) => page.rooms) ?? [];

    const handleRoomPress = useCallback((roomId: string) => {
        router.push(`/room/${roomId}` as any);
    }, [router]);

    const handleOpenFilters = useCallback(() => {
        router.push('/search-filter');
    }, [router]);

    const renderItem = useCallback(({ item }: { item: RoomWithDetails }) => (
        <RoomCard
            room={item}
            onPress={() => handleRoomPress(item.id)}
        />
    ), [handleRoomPress]);

    const keyExtractor = useCallback((item: RoomWithDetails) => item.id, []);

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#2a9d6a" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <EmptyState
                icon={<SearchX size={48} color="#9ca3af" />}
                title="Không tìm thấy phòng"
                subtitle="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
            />
        );
    };

    if (isError) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <EmptyState
                    title="Đã có lỗi xảy ra"
                    subtitle={error?.message || 'Không thể tải danh sách phòng'}
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

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 pt-2 pb-2 bg-surface border-b border-gray-100">
                <View className="flex-row items-center gap-2">
                    <View className="flex-1">
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmit={() => refetch()}
                            placeholder="Tìm theo quận, địa chỉ..."
                        />
                    </View>
                    <Pressable
                        onPress={handleOpenFilters}
                        className="p-3 bg-primary-50 rounded-xl"
                    >
                        <SlidersHorizontal size={20} color="#2a9d6a" />
                    </Pressable>
                </View>
            </View>

            {/* Room List */}
            <FlatList
                data={rooms}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        colors={['#2a9d6a']}
                        tintColor="#2a9d6a"
                    />
                }
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={8}
            />
        </SafeAreaView>
    );
}
