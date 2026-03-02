import { View, Text } from 'react-native';
import React from 'react';

// Match the types from @roomz/shared CommunityPost
type PostType = 'discussion' | 'question' | 'review' | 'advice' | 'news';

interface PostTypeTagProps {
    type: PostType;
}

const typeConfig: Record<PostType, { label: string; bgColor: string; textColor: string }> = {
    discussion: {
        label: 'Thảo luận',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
    },
    question: {
        label: 'Hỏi đáp',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
    },
    review: {
        label: 'Đánh giá',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
    },
    advice: {
        label: 'Mẹo hay',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
    },
    news: {
        label: 'Tin tức',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
    },
};

export const PostTypeTag = React.memo(function PostTypeTag({
    type,
}: PostTypeTagProps) {
    const config = typeConfig[type];

    return (
        <View className={`${config.bgColor} px-2 py-0.5 rounded-full self-start`}>
            <Text className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
            </Text>
        </View>
    );
});
