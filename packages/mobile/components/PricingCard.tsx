import { View, Text, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    savings?: string;
    isSelected: boolean;
    onSelect: () => void;
    isBestValue?: boolean;
}

/**
 * Pricing card for subscription packages
 * Shows price, period, and optional savings badge
 */
export function PricingCard({
    title,
    price,
    period,
    savings,
    isSelected,
    onSelect,
    isBestValue = false,
}: PricingCardProps) {
    return (
        <TouchableOpacity
            onPress={onSelect}
            className={`
                flex-1 rounded-2xl p-4 relative
                ${isSelected
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-surface border border-gray-200'
                }
            `}
            activeOpacity={0.8}
        >
            {isBestValue && (
                <View className="absolute -top-3 right-4 bg-amber-500 px-3 py-1 rounded-full flex-row items-center">
                    <Star size={12} color="white" fill="white" />
                    <Text className="text-white text-xs font-bold ml-1">Tiết kiệm</Text>
                </View>
            )}

            <Text className={`font-bold text-base mb-1 ${isSelected ? 'text-primary-700' : 'text-text-primary'}`}>
                {title}
            </Text>

            <View className="flex-row items-baseline">
                <Text className={`text-2xl font-bold ${isSelected ? 'text-primary-600' : 'text-text-primary'}`}>
                    {price}
                </Text>
            </View>

            <Text className="text-text-secondary text-sm">
                {period}
            </Text>

            {savings && (
                <View className="mt-2 bg-green-100 self-start px-2 py-1 rounded">
                    <Text className="text-green-700 text-xs font-medium">{savings}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
