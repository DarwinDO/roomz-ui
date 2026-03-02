import { View, Text, Pressable } from 'react-native';
import React from 'react';

interface QuizOption {
    value: string;
    label: string;
}

interface QuizQuestionData {
    id: number;
    text: string;
    options: QuizOption[];
}

interface QuizQuestionProps {
    question: QuizQuestionData;
    selectedValue: string | null;
    onSelect: (value: string) => void;
}

export const QuizQuestion = React.memo(function QuizQuestion({
    question,
    selectedValue,
    onSelect,
}: QuizQuestionProps) {
    return (
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
            {/* Question Text */}
            <Text className="text-base font-bold text-gray-900 mb-4">
                {question.text}
            </Text>

            {/* Options in 2x2 Grid */}
            <View className="flex-row flex-wrap gap-3">
                {question.options.map((option, index) => {
                    const isSelected = selectedValue === option.value;
                    return (
                        <Pressable
                            key={index}
                            onPress={() => onSelect(option.value)}
                            className={`flex-1 min-w-[45%] py-3 px-4 rounded-xl items-center justify-center active:scale-[0.98] ${isSelected
                                    ? 'bg-primary-500'
                                    : 'bg-gray-100'
                                }`}
                            style={{ minWidth: '45%' }}
                            android_ripple={{
                                color: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <Text
                                className={`text-sm font-medium text-center ${isSelected ? 'text-white' : 'text-gray-700'
                                    }`}
                                numberOfLines={2}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
});
