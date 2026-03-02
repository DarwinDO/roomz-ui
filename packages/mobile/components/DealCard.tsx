import { View, Text, Image, Pressable } from 'react-native';
import React, { useMemo } from 'react';
import { Clock } from 'lucide-react-native';
import type { Deal } from '@roomz/shared';

interface DealCardProps {
    deal: Deal;
    onPress?: () => void;
}

export const DealCard = React.memo(function DealCard({
    deal,
    onPress,
}: DealCardProps) {
    const daysRemaining = useMemo(() => {
        const expiry = new Date(deal.end_date);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, [deal.end_date]);

    const expiryText = useMemo(() => {
        if (daysRemaining < 0) {
            return 'Đã hết hạn';
        } else if (daysRemaining === 0) {
            return 'Hết hạn hôm nay';
        } else if (daysRemaining === 1) {
            return 'Còn 1 ngày';
        } else {
            return `Hết hạn sau ${daysRemaining} ngày`;
        }
    }, [daysRemaining]);

    const partnerName = deal.partner?.name || 'Đối tác';
    const partnerLogo = deal.partner?.logo_url || null;

    return (
        <Pressable
            onPress={onPress}
            className="bg-surface rounded-xl overflow-hidden border border-gray-100 mb-3 mx-4 active:scale-[0.99]"
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
            {/* Discount Badge */}
            <View className="absolute top-0 right-0 bg-red-500 px-3 py-1 rounded-bl-xl z-10">
                <Text className="text-white font-bold text-sm">
                    -{deal.discount_percent}%
                </Text>
            </View>

            <View className="p-4">
                {/* Partner Info */}
                <View className="flex-row items-center mb-3">
                    {partnerLogo ? (
                        <Image
                            source={{ uri: partnerLogo }}
                            className="w-10 h-10 rounded-lg bg-gray-100"
                        />
                    ) : (
                        <View className="w-10 h-10 rounded-lg bg-primary-100 items-center justify-center">
                            <Text className="text-lg font-bold text-primary-600">
                                {partnerName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text className="ml-3 text-sm font-medium text-gray-500">
                        {partnerName}
                    </Text>
                </View>

                {/* Title */}
                <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={2}>
                    {deal.title}
                </Text>

                {/* Description */}
                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                    {deal.description || ''}
                </Text>

                {/* Expiry */}
                <View className="flex-row items-center">
                    <Clock size={14} color={daysRemaining < 0 ? '#ef4444' : '#0891b2'} />
                    <Text
                        className={`ml-1 text-xs ${daysRemaining < 0 ? 'text-red-500' : 'text-primary-600'
                            }`}
                    >
                        {expiryText}
                    </Text>
                </View>

                {/* Promo Code */}
                {deal.code && (
                    <View className="mt-3 bg-gray-100 rounded-lg px-3 py-2 flex-row items-center justify-between">
                        <Text className="text-xs text-gray-500">Mã giảm giá</Text>
                        <Text className="text-sm font-bold text-gray-900 tracking-wider">
                            {deal.code}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
});
