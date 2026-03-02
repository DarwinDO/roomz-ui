import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    RefreshControl,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUp, ArrowLeft, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePostDetail } from '../../../src/hooks/usePostDetail';
import { CommentItem } from '../../../components/CommentItem';
import { ChatInput } from '../../../components/ChatInput';
import { PostTypeTag } from '../../../components/PostTypeTag';
import { RelativeTime } from '../../../components/RelativeTime';
import { EmptyState } from '../../../components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const {
        post,
        isLoading,
        error,
        refetch,
        comments,
        isCommentsLoading,
        addComment,
        isAddingComment,
    } = usePostDetail(id);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // Handle add comment
    const handleAddComment = useCallback(
        (content: string) => {
            if (content.trim()) {
                addComment({ content: content.trim() });
            }
        },
        [addComment]
    );

    // Handle back press
    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Handle image scroll
    const handleImageScroll = useCallback(
        (event: { nativeEvent: { contentOffset: { x: number } } }) => {
            const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
            setActiveImageIndex(slideIndex);
        },
        []
    );

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text-secondary">Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error || !post) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-row items-center px-4 py-4">
                    <Pressable
                        onPress={handleBack}
                        className="p-2 -ml-2 active:opacity-70"
                    >
                        <ArrowLeft size={24} color="#374151" />
                    </Pressable>
                    <Text className="text-lg font-bold text-text-primary ml-2">
                        Chi tiết bài viết
                    </Text>
                </View>
                <EmptyState
                    title="Không tìm thấy bài viết"
                    subtitle="Bài viết này có thể đã bị xóa hoặc không tồn tại."
                />
            </SafeAreaView>
        );
    }

    const hasImages = post.images && post.images.length > 0;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <Pressable
                    onPress={handleBack}
                    className="p-2 -ml-2 active:opacity-70"
                >
                    <ArrowLeft size={24} color="#374151" />
                </Pressable>
                <Text
                    className="text-lg font-bold text-text-primary ml-2 flex-1"
                    numberOfLines={1}
                >
                    Chi tiết bài viết
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={handleRefresh}
                            tintColor="#0891b2"
                        />
                    }
                    className="flex-1"
                >
                    {/* Author Header */}
                    <View className="px-4 py-4">
                        <View className="flex-row items-center">
                            {post.author?.avatar_url ? (
                                <Image
                                    source={{ uri: post.author.avatar_url }}
                                    className="w-10 h-10 rounded-full bg-primary-100"
                                />
                            ) : (
                                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                                    <Text className="text-lg font-bold text-primary-600">
                                        {post.author?.full_name
                                            ?.charAt(0)
                                            .toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}
                            <View className="ml-3 flex-1">
                                <Text
                                    className="text-base font-semibold text-gray-900"
                                    numberOfLines={1}
                                >
                                    {post.author?.full_name || 'Unknown'}
                                </Text>
                                <RelativeTime
                                    date={post.created_at}
                                    className="text-gray-400"
                                />
                            </View>
                        </View>

                        {/* Type Badge */}
                        <View className="mt-3">
                            <PostTypeTag
                                type={
                                    post.type as
                                    | 'discussion'
                                    | 'question'
                                    | 'review'
                                    | 'advice'
                                    | 'news'
                                }
                            />
                        </View>

                        {/* Title */}
                        <Text className="text-xl font-bold text-gray-900 mt-3">
                            {post.title}
                        </Text>

                        {/* Content */}
                        <Text className="text-base text-gray-700 mt-3 leading-6">
                            {post.content}
                        </Text>

                        {/* Images Carousel */}
                        {hasImages && (
                            <View className="mt-4">
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={handleImageScroll}
                                    scrollEventThrottle={16}
                                >
                                    {post.images.map((image, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: image }}
                                            className="bg-gray-200 rounded-xl"
                                            style={{
                                                width: SCREEN_WIDTH - 32,
                                                height: 240,
                                            }}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </ScrollView>

                                {/* Image Indicator */}
                                {post.images.length > 1 && (
                                    <View className="flex-row justify-center mt-2 gap-1">
                                        {post.images.map((_, index) => (
                                            <View
                                                key={index}
                                                className={`h-1.5 rounded-full ${index === activeImageIndex
                                                    ? 'w-6 bg-primary-500'
                                                    : 'w-1.5 bg-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </View>
                                )}

                                {/* Image Counter */}
                                {post.images.length > 1 && (
                                    <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                                        <Text className="text-white text-xs font-medium">
                                            {activeImageIndex + 1}/
                                            {post.images.length}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Category & Tags */}
                        <View className="mt-4 flex-row flex-wrap items-center gap-2">
                            <View className="bg-gray-100 px-3 py-1 rounded-full">
                                <Text className="text-sm text-gray-600">
                                    {post.category}
                                </Text>
                            </View>
                            {post.tags.map((tag) => (
                                <View
                                    key={tag}
                                    className="bg-primary-50 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-sm text-primary-600">
                                        #{tag}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Upvote Button */}
                        <Pressable className="flex-row items-center mt-4 self-start bg-gray-50 px-4 py-2 rounded-full active:bg-gray-100">
                            <ArrowUp size={20} color="#0891b2" />
                            <Text className="ml-2 text-base font-medium text-gray-700">
                                {post.upvotes} upvote
                            </Text>
                        </Pressable>
                    </View>

                    {/* Comments Section */}
                    <View className="px-4 py-4 border-t border-gray-100">
                        <View className="flex-row items-center mb-4">
                            <MessageCircle size={20} color="#374151" />
                            <Text className="ml-2 text-lg font-bold text-gray-900">
                                Bình luận
                            </Text>
                            <Text className="ml-2 text-base text-gray-500">
                                ({post.comment_count})
                            </Text>
                        </View>

                        {isCommentsLoading ? (
                            <Text className="text-center text-gray-500 py-4">
                                Đang tải bình luận...
                            </Text>
                        ) : comments.length === 0 ? (
                            <EmptyState
                                title="Chưa có bình luận nào"
                                subtitle="Hãy là người đầu tiên bình luận!"
                            />
                        ) : (
                            comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={{
                                        id: comment.id,
                                        post_id: comment.post_id,
                                        author_id: comment.user_id,
                                        author_name:
                                            comment.author?.full_name ||
                                            'Unknown',
                                        author_avatar:
                                            comment.author?.avatar_url || null,
                                        content: comment.content,
                                        parent_id: comment.parent_id,
                                        created_at: comment.created_at,
                                    }}
                                />
                            ))
                        )}
                    </View>

                    {/* Bottom padding for keyboard */}
                    <View className="h-20" />
                </ScrollView>

                {/* Comment Input */}
                <ChatInput
                    onSend={handleAddComment}
                    placeholder="Viết bình luận..."
                    disabled={isAddingComment}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
