import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { X, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost, getCategories } from '@roomz/shared';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { PostTypeTag } from '../../components/PostTypeTag';

type PostType = 'discussion' | 'question' | 'review' | 'advice' | 'news';

const postTypes: { type: PostType; label: string }[] = [
    { type: 'discussion', label: 'Thảo luận' },
    { type: 'question', label: 'Hỏi đáp' },
    { type: 'review', label: 'Đánh giá' },
    { type: 'advice', label: 'Mẹo hay' },
    { type: 'news', label: 'Tin tức' },
];

interface FormErrors {
    title?: string;
    content?: string;
    category?: string;
}

export default function CreatePostScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [type, setType] = useState<PostType>('discussion');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Load categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const cats = await getCategories(supabase);
                setCategories(cats);
                if (cats.length > 0 && !category) {
                    setCategory(cats[0]);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    // Validate form
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!title.trim()) {
            newErrors.title = 'Vui lòng nhập tiêu đề';
        } else if (title.trim().length < 5) {
            newErrors.title = 'Tiêu đề phải có ít nhất 5 ký tự';
        }

        if (!content.trim()) {
            newErrors.content = 'Vui lòng nhập nội dung';
        } else if (content.trim().length < 10) {
            newErrors.content = 'Nội dung phải có ít nhất 10 ký tự';
        }

        if (!category) {
            newErrors.category = 'Vui lòng chọn danh mục';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [title, content, category]);

    // Handle submit
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;
        if (!user) {
            setSubmitError('Bạn cần đăng nhập để tạo bài viết');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Parse tags
            const parsedTags = tags
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t.length > 0);

            await createPost(supabase, {
                type,
                title: title.trim(),
                content: content.trim(),
                category,
                tags: parsedTags,
                images: [],
            });

            // Invalidate community posts cache and navigate back
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            router.back();
        } catch (error) {
            console.error('Failed to create post:', error);
            setSubmitError(
                'Không thể tạo bài viết. Vui lòng thử lại sau.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [validateForm, user, type, title, content, category, tags, router]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        router.back();
    }, [router]);

    // Handle category select
    const handleCategorySelect = useCallback((cat: string) => {
        setCategory(cat);
        setShowCategoryDropdown(false);
        if (errors.category) {
            setErrors((prev) => ({ ...prev, category: undefined }));
        }
    }, [errors.category]);

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Pressable
                    onPress={handleCancel}
                    className="p-2 -ml-2 active:opacity-70"
                >
                    <X size={24} color="#374151" />
                </Pressable>
                <Text className="text-lg font-bold text-text-primary">
                    Tạo bài viết mới
                </Text>
                <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-full ${isSubmitting
                        ? 'bg-gray-300'
                        : 'bg-primary-500 active:bg-primary-600'
                        }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text className="text-white font-semibold text-sm">
                            Đăng
                        </Text>
                    )}
                </Pressable>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView className="flex-1 px-4 py-4">
                    {/* Type Selector */}
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 mb-3">
                            Loại bài viết
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8 }}
                        >
                            {postTypes.map((pt) => (
                                <Pressable
                                    key={pt.type}
                                    onPress={() => setType(pt.type)}
                                    className={`px-4 py-2 rounded-full border ${type === pt.type
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${type === pt.type
                                            ? 'text-primary-600'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {pt.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Title Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Tiêu đề <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            value={title}
                            onChangeText={(text) => {
                                setTitle(text);
                                if (errors.title) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        title: undefined,
                                    }));
                                }
                            }}
                            placeholder="Nhập tiêu đề bài viết..."
                            className={`bg-white border rounded-xl px-4 py-3 text-text-primary ${errors.title
                                ? 'border-red-500'
                                : 'border-gray-200'
                                }`}
                            maxLength={200}
                        />
                        {errors.title && (
                            <Text className="text-red-500 text-sm mt-1">
                                {errors.title}
                            </Text>
                        )}
                    </View>

                    {/* Content Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Nội dung <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            value={content}
                            onChangeText={(text) => {
                                setContent(text);
                                if (errors.content) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        content: undefined,
                                    }));
                                }
                            }}
                            placeholder="Nhập nội dung bài viết..."
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            className={`bg-white border rounded-xl px-4 py-3 text-text-primary min-h-[150] ${errors.content
                                ? 'border-red-500'
                                : 'border-gray-200'
                                }`}
                            maxLength={5000}
                        />
                        {errors.content && (
                            <Text className="text-red-500 text-sm mt-1">
                                {errors.content}
                            </Text>
                        )}
                    </View>

                    {/* Category Picker */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Danh mục <Text className="text-red-500">*</Text>
                        </Text>
                        <Pressable
                            onPress={() =>
                                setShowCategoryDropdown(!showCategoryDropdown)
                            }
                            className={`bg-white border rounded-xl px-4 py-3 flex-row items-center justify-between ${errors.category
                                ? 'border-red-500'
                                : 'border-gray-200'
                                }`}
                        >
                            <Text
                                className={
                                    category
                                        ? 'text-text-primary'
                                        : 'text-gray-400'
                                }
                            >
                                {category || 'Chọn danh mục'}
                            </Text>
                            <ChevronDown
                                size={20}
                                color="#9ca3af"
                                style={{
                                    transform: [
                                        {
                                            rotate: showCategoryDropdown
                                                ? '180deg'
                                                : '0deg',
                                        },
                                    ],
                                }}
                            />
                        </Pressable>
                        {showCategoryDropdown && (
                            <View className="mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat}
                                        onPress={() =>
                                            handleCategorySelect(cat)
                                        }
                                        className="px-4 py-3 border-b border-gray-100 last:border-b-0 active:bg-gray-50"
                                    >
                                        <Text className="text-text-primary">
                                            {cat}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                        {errors.category && (
                            <Text className="text-red-500 text-sm mt-1">
                                {errors.category}
                            </Text>
                        )}
                    </View>

                    {/* Tags Input */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Tags <Text className="text-gray-400">(tùy chọn)</Text>
                        </Text>
                        <TextInput
                            value={tags}
                            onChangeText={setTags}
                            placeholder="Nhập tags, phân cách bằng dấu phẩy..."
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                        />
                        <Text className="text-gray-400 text-xs mt-1">
                            Ví dụ: review, căn hộ, quận 1
                        </Text>
                    </View>

                    {/* Submit Error */}
                    {submitError && (
                        <View className="mb-4 p-3 bg-red-50 rounded-xl">
                            <Text className="text-red-500 text-sm text-center">
                                {submitError}
                            </Text>
                        </View>
                    )}

                    {/* Preview */}
                    <View className="mt-4 mb-8">
                        <Text className="text-sm font-medium text-gray-700 mb-3">
                            Xem trước
                        </Text>
                        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <PostTypeTag type={type} />
                            <Text
                                className="text-base font-bold text-gray-900 mt-2"
                                numberOfLines={2}
                            >
                                {title || 'Tiêu đề bài viết'}
                            </Text>
                            <Text
                                className="text-sm text-gray-600 mt-1"
                                numberOfLines={3}
                            >
                                {content || 'Nội dung bài viết...'}
                            </Text>
                            {category && (
                                <View className="mt-2 flex-row flex-wrap gap-2">
                                    <View className="bg-gray-200 px-2 py-1 rounded-full">
                                        <Text className="text-xs text-gray-600">
                                            {category}
                                        </Text>
                                    </View>
                                    {tags
                                        .split(',')
                                        .map((t) => t.trim())
                                        .filter((t) => t.length > 0)
                                        .map((tag) => (
                                            <View
                                                key={tag}
                                                className="bg-primary-100 px-2 py-1 rounded-full"
                                            >
                                                <Text className="text-xs text-primary-600">
                                                    #{tag}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
