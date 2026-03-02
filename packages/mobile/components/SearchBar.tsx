import { View, TextInput, Pressable } from 'react-native';
import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react-native';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export const SearchBar = React.memo(function SearchBar({
    value,
    onChangeText,
    onSubmit,
    placeholder = 'Tìm kiếm phòng trọ...',
    autoFocus = false,
}: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = useCallback(() => {
        onChangeText('');
    }, [onChangeText]);

    return (
        <View
            className={`flex-row items-center bg-surface rounded-xl px-4 py-3 shadow-sm border ${isFocused ? 'border-primary-500' : 'border-gray-200'
                }`}
        >
            <Search size={20} color="#6b7280" />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={onSubmit}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-3 text-text-primary text-base"
                autoFocus={autoFocus}
                returnKeyType="search"
            />
            {value.length > 0 && (
                <Pressable
                    onPress={handleClear}
                    className="p-1 rounded-full bg-gray-100"
                    hitSlop={8}
                >
                    <X size={16} color="#6b7280" />
                </Pressable>
            )}
        </View>
    );
});
