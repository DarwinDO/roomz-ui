import { View, Text, Image, Pressable } from 'react-native';
import React from 'react';
import { ArrowUp, MessageCircle, Eye } from 'lucide-react-native';
import { PostTypeTag } from './PostTypeTag';
import { RelativeTime } from './RelativeTime';

// Match the types from @roomz/shared CommunityPost
type PostType = 'discussion' | 'question' | 'review' | 'advice' | 'news';

interface CommunityPost {
    id: string;
    author_id: string;
    author_name: string;
    author_avatar: string | null;
    type: PostType;
    title: string;
    content: string;
    category: string;
    tags: string[];
    upvotes: number;
    comments_count: number;
    views: number;
    created_at: string;
    is_upvoted?: boolean;
}

interface CommunityPostCardProps {
    post: CommunityPost;
    onPress?: () => void;
}

export const CommunityPostCard = React.memo(function CommunityPostCard({
    post,
    onPress,
}: CommunityPostCardProps) {
    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    return (
        <Pressable
            onPress={onPress}
            className="bg-surface rounded-xl p-4 mb-3 mx-4 border border-gray-100 active:scale-[0.99]"
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
            {/* Header: Avatar + Name + Time */}
            <View className="flex-row items-center mb-2">
                {post.author_avatar ? (
                    <Image
                        source={{ uri: post.author_avatar }}
                        className="w-8 h-8 rounded-full bg-primary-100"
                    />
                ) : (
                    <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                        <Text className="text-sm font-semibold text-primary-600">
                            {post.author_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <Text className="ml-2 text-sm font-medium text-gray-900 flex-1" numberOfLines={1}>
                    {post.author_name}
                </Text>
                <RelativeTime date={post.created_at} className="text-gray-400" />
            </View>

            {/* Type Badge */}
            <View className="mb-2">
                <PostTypeTag type={post.type} />
            </View>

            {/* Title */}
            <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
                {post.title}
            </Text>

            {/* Content Preview */}
            <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                {post.content}
            </Text>

            {/* Footer: Upvotes | Comments | Views */}
            <View className="flex-row items-center gap-4">
                <View className={`flex-row items-center ${post.is_upvoted ? 'text-primary-600' : ''}`}>
                    <ArrowUp
                        size={16}
                        color={post.is_upvoted ? '#0891b2' : '#9ca3af'}
                    />
                    <Text
                        className={`ml-1 text-xs ${post.is_upvoted ? 'text-primary-600 font-medium' : 'text-gray-500'
                            }`}
                    >
                        {formatNumber(post.upvotes)}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <MessageCircle size={16} color="#9ca3af" />
                    <Text className="ml-1 text-xs text-gray-500">
                        {formatNumber(post.comments_count)}
                    </Text>
                </View>

                <View className="flex-row items-center">
                    <Eye size={16} color="#9ca3af" />
                    <Text className="ml-1 text-xs text-gray-500">
                        {formatNumber(post.views)}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
});
