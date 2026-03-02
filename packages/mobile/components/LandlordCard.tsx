import { View, Text, Image, Pressable } from 'react-native';
import React from 'react';
import { Phone, Star, MessageCircle, User } from 'lucide-react-native';

interface LandlordCardProps {
    landlord: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        phone: string | null;
        email: string;
        trust_score: number | null;
    };
    onContact?: () => void;
    onMessage?: () => void;
}

export const LandlordCard = React.memo(function LandlordCard({
    landlord,
    onContact,
    onMessage,
}: LandlordCardProps) {
    const trustScore = landlord.trust_score ?? 0;
    const hasAvatar = !!landlord.avatar_url;

    return (
        <View className="bg-surface rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
                {/* Avatar */}
                <View className="relative">
                    {hasAvatar ? (
                        <Image
                            source={{ uri: landlord.avatar_url! }}
                            className="w-14 h-14 rounded-full bg-gray-200"
                        />
                    ) : (
                        <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
                            <User size={28} color="#2a9d6a" />
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-text-primary">
                        {landlord.full_name}
                    </Text>
                    <Text className="text-sm text-text-secondary mt-0.5">
                        Chủ nhà
                    </Text>
                    {trustScore > 0 && (
                        <View className="flex-row items-center mt-1">
                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                            <Text className="ml-1 text-sm text-text-secondary">
                                {trustScore.toFixed(1)} điểm tin cậy
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                    {onMessage && (
                        <Pressable
                            onPress={onMessage}
                            className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center"
                            hitSlop={8}
                        >
                            <MessageCircle size={20} color="#2a9d6a" />
                        </Pressable>
                    )}
                    {onContact && landlord.phone && (
                        <Pressable
                            onPress={onContact}
                            className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center"
                            hitSlop={8}
                        >
                            <Phone size={20} color="white" />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
});
