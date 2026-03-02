import { View, Text, FlatList, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, FileText, ClipboardList } from 'lucide-react-native';
import { useCallback } from 'react';

import { useRoommateProfile } from '@/src/hooks/useRoommateProfile';
import { useRoommateMatches } from '@/src/hooks/useRoommateMatches';
import { useRoommateRequest } from '@/src/hooks/useRoommateRequest';
import { useAuth } from '@/src/contexts/AuthContext';
import { MatchCard } from '@/components/MatchCard';
import { EmptyState } from '@/components/EmptyState';
import { mobileStorageAdapter } from '@/src/adapters/storageAdapter';
import { getRemainingLimits } from '@roomz/shared';
import { useQuery } from '@tanstack/react-query';
import type { RoommateMatch } from '@roomz/shared';

const DAILY_VIEW_LIMIT = 10;

export default function RoommatesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const userId = user?.id;

    // Fetch profile and matches
    const { profile, isLoading: isProfileLoading, refetch: refetchProfile } = useRoommateProfile();
    const { matches, isLoading: isMatchesLoading, refetch: refetchMatches } = useRoommateMatches({ limit: 20 });
    const { sendRequest } = useRoommateRequest();

    // Fetch remaining daily views
    const { data: remainingViews = DAILY_VIEW_LIMIT, refetch: refetchLimits } = useQuery({
        queryKey: ['roommate-limits', userId],
        queryFn: async () => {
            if (!userId) return DAILY_VIEW_LIMIT;
            const limits = await getRemainingLimits(mobileStorageAdapter, userId);
            return limits.views;
        },
        enabled: !!userId,
    });

    // Combined refresh
    const handleRefresh = useCallback(async () => {
        await Promise.all([
            refetchProfile(),
            refetchMatches(),
            refetchLimits(),
        ]);
    }, [refetchProfile, refetchMatches, refetchLimits]);

    // Check if user has quiz answers
    const hasQuiz = profile && profile.status !== 'draft';

    // Handle connect action
    const handleConnect = useCallback((match: RoommateMatch) => {
        sendRequest({ receiverId: match.matched_user_id });
    }, [sendRequest]);

    // Handle skip action
    const handleSkip = useCallback((_match: RoommateMatch) => {
        // For now, just refetch to get fresh matches
        refetchMatches();
    }, [refetchMatches]);

    // Loading state
    if (isProfileLoading || isMatchesLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-text-secondary mt-4">Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // No profile - Show CTA to create profile
    if (!profile) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <EmptyState
                    icon={<Users size={64} color="#3b82f6" />}
                    title="Tìm bạn cùng phòng"
                    subtitle="Tạo hồ sơ để tìm bạn cùng phòng phù hợp với bạn"
                    action={
                        <Pressable
                            onPress={() => router.push('/roommate-profile-setup' as never)}
                            className="bg-primary-500 px-8 py-4 rounded-full active:bg-primary-600"
                            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                            <Text className="text-white font-semibold text-base">
                                Tạo hồ sơ tìm bạn cùng phòng
                            </Text>
                        </Pressable>
                    }
                />
            </SafeAreaView>
        );
    }

    // Has profile but no quiz - Show CTA to do quiz
    if (!hasQuiz) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
                <EmptyState
                    icon={<ClipboardList size={64} color="#3b82f6" />}
                    title="Hoàn thiện hồ sơ"
                    subtitle="Làm bài trắc nghiệm để chúng tôi tìm bạn cùng phòng phù hợp nhất"
                    action={
                        <Pressable
                            onPress={() => router.push('/compatibility-quiz' as never)}
                            className="bg-primary-500 px-8 py-4 rounded-full active:bg-primary-600"
                            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                            <Text className="text-white font-semibold text-base">
                                Làm bài trắc nghiệm
                            </Text>
                        </Pressable>
                    }
                />
            </SafeAreaView>
        );
    }

    // Has profile + quiz - Show match list
    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xl font-bold text-text-primary">
                            Bạn cùng phòng
                        </Text>
                        <Text className="text-sm text-text-secondary mt-1">
                            {matches.length} người phù hợp
                        </Text>
                    </View>
                    <View className="bg-primary-50 px-3 py-2 rounded-full">
                        <Text className="text-xs font-medium text-primary-600">
                            Còn {remainingViews}/{DAILY_VIEW_LIMIT} lượt xem hôm nay
                        </Text>
                    </View>
                </View>
            </View>

            {/* Match List */}
            <FlatList
                data={matches as any}
                keyExtractor={(item) => item.matched_user_id}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isMatchesLoading}
                        onRefresh={handleRefresh}
                        tintColor="#3b82f6"
                    />
                }
                renderItem={({ item }) => (
                    <MatchCard
                        match={item}
                        onSkip={() => handleSkip(item)}
                        onConnect={() => handleConnect(item)}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon={<FileText size={48} color="#9ca3af" />}
                        title="Chưa có gợi ý nào"
                        subtitle="Hãy quay lại sau để xem thêm bạn cùng phòng phù hợp"
                    />
                }
            />
        </SafeAreaView>
    );
}
