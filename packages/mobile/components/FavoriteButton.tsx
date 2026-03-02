import { Pressable, ActivityIndicator } from 'react-native';
import React from 'react';
import { Heart } from 'lucide-react-native';
import { useFavorite } from '../src/hooks/useFavorite';

interface FavoriteButtonProps {
    itemId: string;
    itemType?: 'room' | 'sublet' | 'post';
    size?: number;
    className?: string;
}

export const FavoriteButton = React.memo(function FavoriteButton({
    itemId,
    itemType = 'room',
    size = 24,
    className = '',
}: FavoriteButtonProps) {
    const { isFavorited, isLoading, toggleFavorite, isToggling } = useFavorite(itemId, itemType);

    const handlePress = () => {
        if (!isLoading && !isToggling) {
            toggleFavorite();
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className={`p-2 rounded-full bg-white/90 shadow-sm active:scale-95 ${className}`}
            hitSlop={8}
        >
            {isLoading || isToggling ? (
                <ActivityIndicator size="small" color="#ef4444" />
            ) : (
                <Heart
                    size={size}
                    color={isFavorited ? '#ef4444' : '#6b7280'}
                    fill={isFavorited ? '#ef4444' : 'transparent'}
                />
            )}
        </Pressable>
    );
});
