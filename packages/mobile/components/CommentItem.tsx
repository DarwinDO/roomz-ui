import { View, Text, Image, Pressable } from 'react-native';
import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { RelativeTime } from './RelativeTime';

interface CommunityComment {
    id: string;
    post_id: string;
    author_id: string;
    author_name: string;
    author_avatar: string | null;
    content: string;
    parent_id: string | null;
    created_at: string;
    replies?: CommunityComment[];
}

interface CommentItemProps {
    comment: CommunityComment;
    onReply?: () => void;
    isReply?: boolean;
}

export const CommentItem = React.memo(function CommentItem({
    comment,
    onReply,
    isReply = false,
}: CommentItemProps) {
    return (
        <View
            className={`py-3 border-b border-gray-100 ${isReply ? 'pl-12' : ''
                }`}
        >
            {/* Header: Avatar + Name + Time */}
            <View className="flex-row items-start">
                {comment.author_avatar ? (
                    <Image
                        source={{ uri: comment.author_avatar }}
                        className="w-8 h-8 rounded-full bg-primary-100"
                    />
                ) : (
                    <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                        <Text className="text-sm font-semibold text-primary-600">
                            {comment.author_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-gray-900">
                            {comment.author_name}
                        </Text>
                        <RelativeTime date={comment.created_at} className="text-gray-400" />
                    </View>

                    {/* Comment Content */}
                    <Text className="text-sm text-gray-700 mt-1 leading-5">
                        {comment.content}
                    </Text>

                    {/* Reply Button */}
                    {onReply && !isReply && (
                        <Pressable
                            onPress={onReply}
                            className="flex-row items-center mt-2 self-start"
                            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                        >
                            <MessageCircle size={14} color="#0891b2" />
                            <Text className="ml-1 text-xs font-medium text-primary-600">
                                Trả lời
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <View className="mt-2">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            isReply={true}
                        />
                    ))}
                </View>
            )}
        </View>
    );
});
