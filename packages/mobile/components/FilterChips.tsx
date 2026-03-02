import { View, Text, ScrollView, Pressable } from 'react-native';
import React, { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react-native';

export type FilterOption = {
    id: string;
    label: string;
    active: boolean;
};

interface FilterChipsProps {
    filters: FilterOption[];
    onFilterPress: (filterId: string) => void;
    onMoreFilters?: () => void;
    showMoreButton?: boolean;
}

export const FilterChips = React.memo(function FilterChips({
    filters,
    onFilterPress,
    onMoreFilters,
    showMoreButton = true,
}: FilterChipsProps) {
    const handlePress = useCallback((id: string) => {
        onFilterPress(id);
    }, [onFilterPress]);

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-2"
            contentContainerStyle={{ gap: 8 }}
        >
            {showMoreButton && (
                <Pressable
                    onPress={onMoreFilters}
                    className="flex-row items-center px-3 py-2 bg-surface rounded-full border border-gray-200 shadow-sm"
                >
                    <SlidersHorizontal size={16} color="#374151" />
                    <Text className="ml-2 text-sm font-medium text-text-primary">Bộ lọc</Text>
                </Pressable>
            )}

            {filters.map((filter) => (
                <Pressable
                    key={filter.id}
                    onPress={() => handlePress(filter.id)}
                    className={`px-4 py-2 rounded-full border shadow-sm ${filter.active
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-surface border-gray-200'
                        }`}
                >
                    <Text
                        className={`text-sm font-medium ${filter.active ? 'text-white' : 'text-text-primary'
                            }`}
                    >
                        {filter.label}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );
});
