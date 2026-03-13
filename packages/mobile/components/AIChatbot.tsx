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
import { ROMI_NAME, ROMI_SUGGESTED_QUESTIONS } from '@roomz/shared/constants/romi';

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
            <TouchableOpacity
                onPress={() => setIsVisible(true)}
                className="absolute bottom-24 right-4 z-50 h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg"
                activeOpacity={0.8}
            >
                <Text className="text-2xl">✨</Text>
            </TouchableOpacity>

            <Modal
                visible={isVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsVisible(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row items-center border-b border-gray-100 bg-white px-4 py-3">
                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary-500">
                            <Text className="text-lg">✨</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-semibold text-text-primary">
                                {ROMI_NAME}
                            </Text>
                            <Text className="text-xs text-text-secondary">
                                Trợ lý của RommZ • Tìm phòng và điều hướng app
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={startNewChat}
                            className="mr-2 rounded-full bg-gray-100 px-3 py-1.5"
                        >
                            <Text className="text-xs text-text-secondary">Mới</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsVisible(false)}
                            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                        >
                            <Text className="text-base text-text-secondary">✕</Text>
                        </TouchableOpacity>
                    </View>

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
                                        <Text className="mb-2 text-center text-xs text-text-secondary">
                                            Gợi ý nhanh:
                                        </Text>
                                        <View className="flex-row flex-wrap justify-center gap-2">
                                            {ROMI_SUGGESTED_QUESTIONS.map((question) => (
                                                <TouchableOpacity
                                                    key={question}
                                                    onPress={() => handleSuggestion(question)}
                                                    className="rounded-full border border-gray-200 bg-white px-3 py-2"
                                                >
                                                    <Text className="text-xs text-text-primary">{question}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ) : null
                            }
                            ListFooterComponent={
                                <>
                                    {isLoading && (
                                        <View className="mb-3 flex-row gap-2">
                                            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                                                <Text className="text-xs">✨</Text>
                                            </View>
                                            <View className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                                                <View className="flex-row items-center gap-2">
                                                    <ActivityIndicator size="small" color="#6366f1" />
                                                    <Text className="text-sm text-text-secondary">
                                                        ROMI đang suy nghĩ...
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                    {error && (
                                        <View className="mb-3 items-center">
                                            <Text className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">
                                                {error}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            }
                            onContentSizeChange={scrollToEnd}
                        />

                        <View className="flex-row items-center border-t border-gray-100 bg-white px-4 py-3">
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                onSubmitEditing={handleSend}
                                placeholder={
                                    isAuthenticated
                                        ? 'Hỏi ROMI bất kỳ điều gì...'
                                        : 'Đăng nhập để sử dụng ROMI'
                                }
                                placeholderTextColor="#9CA3AF"
                                className="mr-2 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm text-text-primary"
                                editable={isAuthenticated && !isLoading}
                                returnKeyType="send"
                                multiline={false}
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputValue.trim() || isLoading || !isAuthenticated}
                                className={`h-10 w-10 items-center justify-center rounded-full ${!inputValue.trim() || isLoading
                                        ? 'bg-gray-200'
                                        : 'bg-primary-500'
                                    }`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-base text-white">➜</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </>
    );
}

