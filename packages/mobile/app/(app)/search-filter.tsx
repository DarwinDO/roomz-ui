import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useRoomFilterStore } from '../../src/stores/useRoomFilterStore';
import type { RoomFilters } from '@roomz/shared';

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
    return (
        <View className="mb-6">
            <Text className="text-base font-semibold text-text-primary mb-3">{title}</Text>
            {children}
        </View>
    );
}

interface ChipOption {
    id: string;
    label: string;
}

interface ChipGroupProps {
    options: ChipOption[];
    selected: string | null;
    onSelect: (id: string | null) => void;
}

function ChipGroup({ options, selected, onSelect }: ChipGroupProps) {
    return (
        <View className="flex-row flex-wrap gap-2">
            {options.map((option) => (
                <Pressable
                    key={option.id}
                    onPress={() => onSelect(selected === option.id ? null : option.id)}
                    className={`px-4 py-2 rounded-full border ${selected === option.id
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-surface border-gray-200'
                        }`}
                >
                    <Text
                        className={`text-sm font-medium ${selected === option.id ? 'text-white' : 'text-text-primary'
                            }`}
                    >
                        {option.label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const ROOM_TYPE_OPTIONS: ChipOption[] = [
    { id: 'private', label: 'Phòng riêng' },
    { id: 'shared', label: 'Ở ghép' },
    { id: 'studio', label: 'Studio' },
    { id: 'entire', label: 'Nguyên căn' },
];

const SORT_OPTIONS: ChipOption[] = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'price_asc', label: 'Giá tăng dần' },
    { id: 'price_desc', label: 'Giá giảm dần' },
    { id: 'most_viewed', label: 'Xem nhiều nhất' },
];

export default function SearchFilterScreen() {
    const router = useRouter();
    const { filters: savedFilters, setFilters, resetFilters } = useRoomFilterStore();

    // Init local state from store
    const [roomType, setRoomType] = useState(savedFilters.roomType || null);
    const [minPrice, setMinPrice] = useState(savedFilters.minPrice?.toString() || '');
    const [maxPrice, setMaxPrice] = useState(savedFilters.maxPrice?.toString() || '');
    const [sortBy, setSortBy] = useState(savedFilters.sortBy || 'newest');
    const [isVerified, setIsVerified] = useState(!!savedFilters.isVerified);

    const handleApply = useCallback(() => {
        setFilters({
            roomType: roomType || undefined,
            minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
            sortBy: sortBy as RoomFilters['sortBy'],
            isVerified: isVerified || undefined,
        });
        router.back();
    }, [roomType, minPrice, maxPrice, sortBy, isVerified, router, setFilters]);

    const handleReset = useCallback(() => {
        resetFilters();
        setRoomType(null);
        setMinPrice('');
        setMaxPrice('');
        setSortBy('newest');
        setIsVerified(false);
    }, [resetFilters]);

    const handleClose = useCallback(() => {
        router.back();
    }, [router]);

    const hasFilters = roomType || minPrice || maxPrice || sortBy !== 'newest' || isVerified;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Pressable onPress={handleClose} className="p-2 -ml-2">
                    <X size={24} color="#0f172a" />
                </Pressable>
                <Text className="text-lg font-semibold text-text-primary">Bộ lọc</Text>
                <Pressable
                    onPress={handleReset}
                    disabled={!hasFilters}
                    className={`px-3 py-1 rounded-full ${hasFilters ? 'bg-gray-100' : ''}`}
                >
                    <Text className={`text-sm ${hasFilters ? 'text-text-primary' : 'text-gray-400'}`}>
                        Đặt lại
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
                {/* Room Type */}
                <FilterSection title="Loại phòng">
                    <ChipGroup
                        options={ROOM_TYPE_OPTIONS}
                        selected={roomType}
                        onSelect={setRoomType}
                    />
                </FilterSection>

                {/* Price Range */}
                <FilterSection title="Khoảng giá (VNĐ/tháng)">
                    <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                            <TextInput
                                value={minPrice}
                                onChangeText={setMinPrice}
                                placeholder="Từ"
                                keyboardType="numeric"
                                className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                            />
                        </View>
                        <Text className="text-text-secondary">-</Text>
                        <View className="flex-1">
                            <TextInput
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                                placeholder="Đến"
                                keyboardType="numeric"
                                className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                            />
                        </View>
                    </View>
                </FilterSection>

                {/* Sort By */}
                <FilterSection title="Sắp xếp theo">
                    <ChipGroup
                        options={SORT_OPTIONS}
                        selected={sortBy}
                        onSelect={(id) => id && setSortBy(id as typeof sortBy)}
                    />
                </FilterSection>

                {/* Verified Only */}
                <FilterSection title="Tùy chọn khác">
                    <Pressable
                        onPress={() => setIsVerified(!isVerified)}
                        className="flex-row items-center justify-between p-4 bg-surface rounded-xl border border-gray-200"
                    >
                        <Text className="text-text-primary">Chỉ hiện phòng đã xác minh</Text>
                        <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isVerified ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                                }`}
                        >
                            {isVerified && (
                                <View className="w-3 h-3 bg-white rounded-full" />
                            )}
                        </View>
                    </Pressable>
                </FilterSection>

                {/* Bottom Spacing */}
                <View className="h-20" />
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-gray-100 px-4 py-4 pb-8">
                <Pressable
                    onPress={handleApply}
                    className="bg-primary-500 rounded-xl py-4 items-center"
                >
                    <Text className="text-white font-semibold text-lg">
                        Áp dụng
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
