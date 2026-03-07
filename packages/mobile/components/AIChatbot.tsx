import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    SafeAreaView,
} from 'react-native';
import { AIChatMessage } from './AIChatMessage';
import { useAIChatbot } from '../src/hooks/useAIChatbot';

const SUGGESTED_QUESTIONS = [
    'Tìm phòng ở Quận 7 dưới 3 triệu',
    'RommZ+ có gì hay?',
    'SwapRoom là gì?',
];

export function AIChatbot() {
    const {
        messages,
        isLoading,
        error,
        isAuthenticated,
        sendMessage,
        startNewChat,
    } = useAIChatbot();

    const [isVisible, setIsVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const scrollToEnd = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    useEffect(() => {
        scrollToEnd();
    }, [messages, scrollToEnd]);

    const handleSend = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        sendMessage(trimmed);
        setInputValue('');
    };

    const handleSuggestion = (question: string) => {
        sendMessage(question);
    };

    return (
        <>
            {/* FAB Button */}
            <TouchableOpacity
                onPress={() => setIsVisible(true)}
                className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-primary-500 items-center justify-center shadow-lg z-50"
                activeOpacity={0.8}
            >
                <Text className="text-2xl">✨</Text>
            </TouchableOpacity>

            {/* Chat Modal */}
            <Modal
                visible={isVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsVisible(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    {/* Header */}
                    <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
                        <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center mr-3">
                            <Text className="text-lg">✨</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-text-primary">
                                Trợ lý AI RommZ
                            </Text>
                            <Text className="text-xs text-text-secondary">
                                Powered by Gemini • 24/7
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={startNewChat}
                            className="px-3 py-1.5 rounded-full bg-gray-100 mr-2"
                        >
                            <Text className="text-xs text-text-secondary">Mới</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsVisible(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                        >
                            <Text className="text-text-secondary text-base">✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <KeyboardAvoidingView
                        className="flex-1"
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={0}
                    >
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            className="flex-1 px-4 pt-4"
                            renderItem={({ item }) => (
                                <AIChatMessage
                                    text={item.text}
                                    sender={item.sender}
                                    timestamp={item.timestamp}
                                />
                            )}
                            ListHeaderComponent={
                                messages.length <= 1 ? (
                                    <View className="mb-4">
                                        <Text className="text-xs text-text-secondary text-center mb-2">
                                            Gợi ý nhanh:
                                        </Text>
                                        <View className="flex-row flex-wrap justify-center gap-2">
                                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                                <TouchableOpacity
                                                    key={i}
                                                    onPress={() => handleSuggestion(q)}
                                                    className="px-3 py-2 rounded-full border border-gray-200 bg-white"
                                                >
                                                    <Text className="text-xs text-text-primary">{q}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ) : null
                            }
                            ListFooterComponent={
                                <>
                                    {isLoading && (
                                        <View className="flex-row gap-2 mb-3">
                                            <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center">
                                                <Text className="text-xs">✨</Text>
                                            </View>
                                            <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                                <View className="flex-row items-center gap-2">
                                                    <ActivityIndicator size="small" color="#6366f1" />
                                                    <Text className="text-sm text-text-secondary">
                                                        Đang suy nghĩ...
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                    {error && (
                                        <View className="items-center mb-3">
                                            <Text className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                                                {error}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            }
                            onContentSizeChange={scrollToEnd}
                        />

                        {/* Input */}
                        <View className="flex-row items-center px-4 py-3 border-t border-gray-100 bg-white">
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                onSubmitEditing={handleSend}
                                placeholder={
                                    isAuthenticated
                                        ? 'Hỏi trợ lý AI...'
                                        : 'Đăng nhập để sử dụng'
                                }
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm text-text-primary mr-2"
                                editable={isAuthenticated && !isLoading}
                                returnKeyType="send"
                                multiline={false}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputValue.trim() || isLoading || !isAuthenticated}
                                className={`w-10 h-10 rounded-full items-center justify-center ${!inputValue.trim() || isLoading
                                        ? 'bg-gray-200'
                                        : 'bg-primary-500'
                                    }`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-base">➤</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </>
    );
}
