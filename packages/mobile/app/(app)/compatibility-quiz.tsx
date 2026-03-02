import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { saveQuizAnswers, updateProfileStatus, type QuizAnswer } from '@roomz/shared';
import { QuizQuestion } from '@/components/QuizQuestion';

// Quiz questions data
interface QuizOption {
    value: string;
    label: string;
}

interface QuizQuestionData {
    id: number;
    text: string;
    options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestionData[] = [
    {
        id: 1,
        text: 'Thói quen ngủ của bạn?',
        options: [
            { value: 'early_bird', label: 'Dậy sớm (trước 7h)' },
            { value: 'night_owl', label: 'Cú đêm (ngủ sau 12h)' },
            { value: 'flexible', label: 'Linh hoạt' },
        ],
    },
    {
        id: 2,
        text: 'Mức độ sạch sẽ của bạn?',
        options: [
            { value: 'very_clean', label: 'Rất sạch sẽ' },
            { value: 'moderate', label: 'Bình thường' },
            { value: 'relaxed', label: 'Thoải mái' },
        ],
    },
    {
        id: 3,
        text: 'Mức độ tiếng ồn bạn chấp nhận?',
        options: [
            { value: 'silent', label: 'Yên tĩnh tuyệt đối' },
            { value: 'some_noise', label: 'Một chút ồn ào' },
            { value: 'loud_ok', label: 'Không vấn đề' },
        ],
    },
    {
        id: 4,
        text: 'Tần suất khách đến chơi?',
        options: [
            { value: 'rarely', label: 'Hiếm khi' },
            { value: 'sometimes', label: 'Thỉnh thoảng' },
            { value: 'often', label: 'Thường xuyên' },
        ],
    },
    {
        id: 5,
        text: 'Cuối tuần của bạn thường?',
        options: [
            { value: 'home', label: 'Ở nhà nghỉ ngơi' },
            { value: 'out', label: 'Đi ra ngoài' },
            { value: 'mixed', label: 'Tùy lúc' },
        ],
    },
    {
        id: 6,
        text: 'Bạn có hút thuốc không?',
        options: [
            { value: 'no', label: 'Không hút' },
            { value: 'outside', label: 'Hút bên ngoài' },
            { value: 'yes', label: 'Có hút' },
        ],
    },
    {
        id: 7,
        text: 'Bạn có nuôi thú cưng không?',
        options: [
            { value: 'no', label: 'Không nuôi' },
            { value: 'want', label: 'Muốn nuôi' },
            { value: 'have', label: 'Đang nuôi' },
        ],
    },
];

export default function CompatibilityQuizScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
    const hasSelectedAnswer = answers[currentQuestion.id] !== undefined;

    // Mutation for saving quiz answers
    const saveMutation = useMutation({
        mutationFn: async (quizAnswers: QuizAnswer[]) => {
            if (!user?.id) throw new Error('User not authenticated');
            await saveQuizAnswers(supabase, user.id, quizAnswers);
            await updateProfileStatus(supabase, user.id, 'active');
        },
        onSuccess: () => {
            // Invalidate profile query to reflect quiz completion
            queryClient.invalidateQueries({ queryKey: ['roommate-profile', user?.id] });
            // Navigate back to roommates tab
            router.replace('/(app)/(tabs)/roommates' as never);
        },
    });

    // Handle answer selection
    const handleSelectAnswer = useCallback((value: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    }, [currentQuestion.id]);

    // Handle next button
    const handleNext = useCallback(() => {
        if (isLastQuestion) {
            // Submit all answers
            const quizAnswers: QuizAnswer[] = Object.entries(answers).map(([questionId, answerValue]) => ({
                question_id: parseInt(questionId, 10),
                answer_value: answerValue,
            }));
            saveMutation.mutate(quizAnswers);
        } else {
            // Move to next question
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [isLastQuestion, answers, saveMutation]);

    // Handle previous button
    const handlePrevious = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    // Progress percentage
    const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 -ml-2 active:opacity-60"
                >
                    <X size={24} color="#374151" />
                </Pressable>
                <Text className="text-lg font-semibold text-text-primary">
                    Bài trắc nghiệm
                </Text>
                <View className="w-10" /> {/* Spacer for alignment */}
            </View>

            {/* Progress Bar */}
            <View className="px-4 py-3">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-text-secondary">
                        Câu hỏi {currentQuestionIndex + 1}/{QUIZ_QUESTIONS.length}
                    </Text>
                    <Text className="text-sm font-medium text-primary-600">
                        {Math.round(progress)}%
                    </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </View>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Current Question */}
                <View className="mt-4">
                    <QuizQuestion
                        question={currentQuestion}
                        selectedValue={answers[currentQuestion.id] || null}
                        onSelect={handleSelectAnswer}
                    />
                </View>

                {/* Error message */}
                {saveMutation.error && (
                    <Text className="text-red-500 text-sm text-center mt-4">
                        {saveMutation.error instanceof Error
                            ? saveMutation.error.message
                            : 'Đã xảy ra lỗi, vui lòng thử lại'}
                    </Text>
                )}

                {/* Bottom padding */}
                <View className="h-8" />
            </ScrollView>

            {/* Footer with Navigation Buttons */}
            <View className="px-4 py-4 border-t border-gray-100 bg-surface">
                <View className="flex-row gap-3">
                    {/* Previous Button */}
                    {currentQuestionIndex > 0 && (
                        <Pressable
                            onPress={handlePrevious}
                            className="flex-1 bg-gray-100 py-4 rounded-full items-center active:bg-gray-200"
                            disabled={saveMutation.isPending}
                        >
                            <Text className="text-gray-700 font-semibold">Quay lại</Text>
                        </Pressable>
                    )}

                    {/* Next/Submit Button */}
                    <Pressable
                        onPress={handleNext}
                        disabled={!hasSelectedAnswer || saveMutation.isPending}
                        className={`flex-1 py-4 rounded-full items-center flex-row justify-center gap-2 ${hasSelectedAnswer && !saveMutation.isPending
                            ? 'bg-primary-500 active:bg-primary-600'
                            : 'bg-gray-300'
                            }`}
                    >
                        {saveMutation.isPending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Text className="text-white font-semibold">
                                    {isLastQuestion ? 'Hoàn tất' : 'Tiếp theo'}
                                </Text>
                                {!isLastQuestion && (
                                    <ChevronRight size={20} color="#ffffff" />
                                )}
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
