import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, MessageSquare, Tag } from 'lucide-react-native';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CommunityPostCard } from '../../../components/CommunityPostCard';
import { DealCard } from '../../../components/DealCard';
import { EmptyState } from '../../../components/EmptyState';
import { useCommunityPosts } from '../../../src/hooks/useCommunityPosts';
import { useActiveDeals } from '../../../src/hooks/useActiveDeals';
import { getCategories } from '@roomz/shared';
import { supabase } from '../../../src/lib/supabase';

type TabType = 'Cộng đồng' | 'Ưu đãi';

export default function DiscoverScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('Cộng đồng');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [categories, setCategories] = useState<string[]>([]);

    // Fetch community posts with infinite scroll
    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isPostsLoading,
        refetch: refetchPosts,
        isRefetching: isPostsRefetching,
    } = useCommunityPosts({
        category: selectedCategory,
        sortBy: 'newest',
    });

    // Fetch active deals
    const {
        data: deals,
        isLoading: isDealsLoading,
        refetch: refetchDeals,
        isRefetching: isDealsRefetching,
    } = useActiveDeals();

    // Load categories on mount
    React.useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await getCategories(supabase);
                setCategories(cats);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    // Flatten posts from infinite query
    const posts = postsData?.pages.flatMap((page) => page.posts) ?? [];

    // Handle load more for infinite scroll
    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle post press
    const handlePostPress = useCallback((postId: string) => {
        router.push(`/post/${postId}` as any);
    }, [router]);

    // Handle FAB press
    const handleCreatePost = useCallback(() => {
        router.push('/create-post' as any);
    }, [router]);

    // Handle deal press
    const handleDealPress = useCallback((dealId: string) => {
        // TODO: Navigate to deal detail if needed
        console.log('Deal pressed:', dealId);
    }, []);

    // Render category chips
    const renderCategoryChips = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-2"
            contentContainerStyle={{ gap: 8 }}
        >
            <Pressable
                onPress={() => setSelectedCategory(undefined)}
                className={`px-4 py-2 rounded-full ${selectedCategory === undefined
                    ? 'bg-primary-500'
                    : 'bg-gray-100'
                    }`}
            >
                <Text
                    className={`text-sm font-medium ${selectedCategory === undefined
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}
                >
                    Tất cả
                </Text>
            </Pressable>
            {categories.map((category) => (
                <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full ${selectedCategory === category
                        ? 'bg-primary-500'
                        : 'bg-gray-100'
                        }`}
                >
                    <Text
                        className={`text-sm font-medium ${selectedCategory === category
                            ? 'text-white'
                            : 'text-gray-700'
                            }`}
                    >
                        {category}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );

    // Render post item
    const renderPostItem = useCallback(
        ({ item }: { item: typeof posts[0] }) => (
            <CommunityPostCard
                post={{
                    id: item.id,
                    author_id: item.user_id,
                    author_name: item.author?.full_name || 'Unknown',
                    author_avatar: item.author?.avatar_url || null,
                    type: item.type as 'discussion' | 'question' | 'review' | 'advice' | 'news',
                    title: item.title,
                    content: item.content,
                    category: item.category,
                    tags: item.tags,
                    upvotes: item.upvotes,
                    comments_count: item.comment_count,
                    views: item.view_count,
                    created_at: item.created_at,
                    is_upvoted: false,
                }}
                onPress={() => handlePostPress(item.id)}
            />
        ),
        [handlePostPress]
    );

    // Render deal item - pass the deal directly as DealCard now accepts the shared Deal type
    const renderDealItem = useCallback(
        ({ item }: { item: NonNullable<typeof deals>[0] }) => (
            <DealCard
                deal={item}
                onPress={() => handleDealPress(item.id)}
            />
        ),
        [handleDealPress]
    );

    // Render footer loader
    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0891b2" />
            </View>
        );
    };

    // Render empty state for posts
    const renderPostsEmpty = () => (
        <EmptyState
            icon={<MessageSquare size={48} color="#9ca3af" />}
            title="Chưa có bài viết nào"
            subtitle="Hãy là người đầu tiên chia sẻ trong cộng đồng!"
        />
    );

    // Render empty state for deals
    const renderDealsEmpty = () => (
        <EmptyState
            icon={<Tag size={48} color="#9ca3af" />}
            title="Chưa có ưu đãi nào"
            subtitle="Hiện tại chưa có ưu đãi nào đang hoạt động."
        />
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="px-4 py-4">
                <Text className="text-2xl font-bold text-text-primary">
                    Khám phá
                </Text>
            </View>

            {/* Inner Tabs */}
            <SegmentedControl
                tabs={['Cộng đồng', 'Ưu đãi']}
                activeTab={activeTab}
                onChange={(tab) => setActiveTab(tab as TabType)}
            />

            {/* Content */}
            {activeTab === 'Cộng đồng' ? (
                <>
                    {/* Category Filter */}
                    {renderCategoryChips()}

                    {/* Posts List */}
                    <FlatList
                        data={posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={isPostsRefetching}
                                onRefresh={refetchPosts}
                                tintColor="#0891b2"
                            />
                        }
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={
                            !isPostsLoading ? renderPostsEmpty : null
                        }
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Floating Action Button */}
                    <Pressable
                        onPress={handleCreatePost}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-lg active:scale-95"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Plus size={28} color="white" />
                    </Pressable>
                </>
            ) : (
                /* Deals Tab */
                <FlatList
                    data={deals}
                    renderItem={renderDealItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isDealsRefetching}
                            onRefresh={refetchDeals}
                            tintColor="#0891b2"
                        />
                    }
                    ListEmptyComponent={
                        !isDealsLoading ? renderDealsEmpty : null
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

