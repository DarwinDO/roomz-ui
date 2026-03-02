import { View, Text, Image, Pressable } from 'react-native';
import React from 'react';
import { CompatibilityScore } from './CompatibilityScore';
import { ScoreChip } from './ScoreChip';
import { MapPin } from 'lucide-react-native';

// Extended RoommateMatch type with budget fields
interface RoommateMatch {
    matched_user_id: string;
    compatibility_score: number;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    city: string;
    district: string | null;
    budget_min: number | null;
    budget_max: number | null;
    hobbies: string[];
    age: number | null;
    sleep_score: number;
    cleanliness_score: number;
    noise_score: number;
    guest_score: number;
    weekend_score: number;
    budget_score: number;
}

interface MatchCardProps {
    match: RoommateMatch;
    onSkip: () => void;
    onConnect: () => void;
}

export const MatchCard = React.memo(function MatchCard({
    match,
    onSkip,
    onConnect,
}: MatchCardProps) {
    const displayLocation = match.district
        ? `${match.district}, ${match.city}`
        : match.city;

    const formatBudget = (amount: number | null) => {
        if (!amount) return '';
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}tr`;
        }
        return `${(amount / 1000).toFixed(0)}k`;
    };

    const budgetText = match.budget_min && match.budget_max
        ? `${formatBudget(match.budget_min)} - ${formatBudget(match.budget_max)}/tháng`
        : match.budget_min
            ? `Từ ${formatBudget(match.budget_min)}/tháng`
            : match.budget_max
                ? `Đến ${formatBudget(match.budget_max)}/tháng`
                : 'Thương lượng';

    return (
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
            {/* Header: Avatar + Name/Age + Compatibility Score */}
            <View className="flex-row items-center mb-3">
                {/* Avatar */}
                {match.avatar_url ? (
                    <Image
                        source={{ uri: match.avatar_url }}
                        className="w-14 h-14 rounded-full bg-primary-100"
                    />
                ) : (
                    <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
                        <Text className="text-xl font-semibold text-primary-600">
                            {match.full_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Name and Age */}
                <View className="flex-1 ml-3">
                    <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
                        {match.full_name}
                        {match.age && <Text className="text-gray-500 font-normal">, {match.age}</Text>}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#6b7280" />
                        <Text className="ml-1 text-xs text-gray-500" numberOfLines={1}>
                            {displayLocation}
                        </Text>
                    </View>
                </View>

                {/* Compatibility Score */}
                <CompatibilityScore score={Math.round(match.compatibility_score)} size={56} />
            </View>

            {/* Bio - truncated to 2 lines */}
            {match.bio && (
                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                    {match.bio}
                </Text>
            )}

            {/* Tags: Hobbies, Budget, Location */}
            <View className="flex-row flex-wrap gap-2 mb-3">
                {/* Budget Tag */}
                <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-xs text-gray-700">💰 {budgetText}</Text>
                </View>

                {/* Hobbies */}
                {match.hobbies.slice(0, 3).map((hobby, index) => (
                    <View key={index} className="bg-gray-100 px-2 py-1 rounded-full">
                        <Text className="text-xs text-gray-700">{hobby}</Text>
                    </View>
                ))}
                {match.hobbies.length > 3 && (
                    <View className="bg-gray-100 px-2 py-1 rounded-full">
                        <Text className="text-xs text-gray-500">+{match.hobbies.length - 3}</Text>
                    </View>
                )}
            </View>

            {/* Score Breakdown: Row of ScoreChips */}
            <View className="flex-row flex-wrap gap-2 mb-4">
                <ScoreChip icon="😴" label="Ngủ" score={match.sleep_score} />
                <ScoreChip icon="📗" label="Sạch" score={match.cleanliness_score} />
                <ScoreChip icon="🔇" label="Yên" score={match.noise_score} />
            </View>

            {/* Actions: Skip and Connect Buttons */}
            <View className="flex-row gap-3">
                <Pressable
                    onPress={onSkip}
                    className="flex-1 bg-gray-100 rounded-full py-3 items-center active:bg-gray-200"
                    android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                >
                    <Text className="text-sm font-medium text-gray-700">Bỏ qua</Text>
                </Pressable>
                <Pressable
                    onPress={onConnect}
                    className="flex-1 bg-primary-500 rounded-full py-3 items-center active:bg-primary-600"
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                    <Text className="text-sm font-medium text-white">Kết nối</Text>
                </Pressable>
            </View>
        </View>
    );
});
