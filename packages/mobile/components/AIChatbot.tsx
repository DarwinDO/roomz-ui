import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AIChatMessage } from './AIChatMessage';
import { useAIChatbot } from '../src/hooks/useAIChatbot';
import {
    ROMI_GUEST_SUGGESTED_QUESTIONS,
    ROMI_NAME,
    ROMI_SUGGESTED_QUESTIONS,
} from '@roomz/shared/constants/romi';
import type { RomiChatAction } from '@roomz/shared/services/ai-chatbot';

const MOBILE_ROUTE_MAP: Record<string, string | null> = {
    open_search: '/search-filter',
    open_payment: '/payment',
    open_verification: '/verification',
    open_roommates: '/(app)/(tabs)/roommates',
    open_login: '/login',
    open_support_services: null,
    open_local_passport: null,
    open_swap: null,
};

function getMessageTimestamp(createdAt: string) {
    const parsed = new Date(createdAt);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function AIChatbot() {
    const router = useRouter();
    const {
        workspaceState,
        messages,
        isLoading,
        error,
        viewerMode,
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
    }, [messages, workspaceState.streamStatus, scrollToEnd]);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        setInputValue('');
        await sendMessage(trimmed);
    };

    const handleSuggestion = async (question: string) => {
        setInputValue('');
        await sendMessage(question);
    };

    const handleAction = useCallback(async (action: RomiChatAction) => {
        if (action.type === 'open_room') {
            router.push(action.href as never);
            return;
        }

        const mappedRoute = MOBILE_ROUTE_MAP[action.type];
        if (mappedRoute) {
            router.push(mappedRoute as never);
            return;
        }

        if (mappedRoute === null) {
            await Linking.openURL(`https://rommz.vn${action.href}`);
            return;
        }

        Alert.alert('Chưa hỗ trợ trên mobile', action.label);
    }, [router]);

    const clarification = workspaceState.clarification;
    const handoff = workspaceState.handoff;
    const promptOptions = viewerMode === 'guest' ? ROMI_GUEST_SUGGESTED_QUESTIONS : ROMI_SUGGESTED_QUESTIONS;

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
                                {viewerMode === 'guest'
                                    ? 'Guest mode • Hỏi phòng, deal, dịch vụ, sản phẩm'
                                    : 'Workspace cá nhân • Giữ ngữ cảnh theo phiên'}
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
                        {clarification ? (
                            <View className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                                    ROMI cần làm rõ
                                </Text>
                                <Text className="mt-2 text-sm leading-5 text-amber-900">
                                    {clarification.prompt}
                                </Text>
                            </View>
                        ) : null}

                        {handoff ? (
                            <View className="mx-4 mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                                <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                                    Bước tiếp theo
                                </Text>
                                <Text className="mt-2 text-sm leading-5 text-blue-900">
                                    {handoff.reason}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => handleAction({
                                        type: 'open_login',
                                        label: handoff.label,
                                        href: handoff.href,
                                    })}
                                    className="mt-3 self-start rounded-full bg-blue-600 px-3 py-2"
                                >
                                    <Text className="text-xs font-medium text-white">
                                        {handoff.label}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item.id}
                            className="flex-1 px-4 pt-4"
                            renderItem={({ item }) => (
                                <AIChatMessage
                                    text={item.text}
                                    sender={item.role === 'user' ? 'user' : 'bot'}
                                    timestamp={getMessageTimestamp(item.createdAt)}
                                    actions={item.actions}
                                    onActionPress={handleAction}
                                />
                            )}
                            ListHeaderComponent={
                                messages.filter((message) => message.role === 'user').length === 0 ? (
                                    <View className="mb-4">
                                        <Text className="mb-2 text-center text-xs text-text-secondary">
                                            Gợi ý nhanh:
                                        </Text>
                                        <View className="flex-row flex-wrap justify-center gap-2">
                                            {promptOptions.map((question) => (
                                                <TouchableOpacity
                                                    key={question}
                                                    onPress={() => void handleSuggestion(question)}
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
                                    {isLoading ? (
                                        <View className="mb-3 flex-row gap-2">
                                            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                                                <Text className="text-xs">✨</Text>
                                            </View>
                                            <View className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                                                <View className="flex-row items-center gap-2">
                                                    <ActivityIndicator size="small" color="#2563eb" />
                                                    <Text className="text-sm text-text-secondary">
                                                        ROMI đang suy nghĩ...
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ) : null}
                                    {error ? (
                                        <View className="mb-3 items-center">
                                            <Text className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">
                                                {error}
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            }
                            onContentSizeChange={scrollToEnd}
                        />

                        <View className="flex-row items-center border-t border-gray-100 bg-white px-4 py-3">
                            <TextInput
                                value={inputValue}
                                onChangeText={setInputValue}
                                onSubmitEditing={() => void handleSend()}
                                placeholder={
                                    viewerMode === 'guest'
                                        ? 'Mô tả khu vực, ngân sách hoặc item cần xem...'
                                        : 'Hỏi ROMI bất kỳ điều gì...'
                                }
                                placeholderTextColor="#9CA3AF"
                                className="mr-2 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm text-text-primary"
                                editable={!isLoading}
                                returnKeyType="send"
                                multiline={false}
                            />
                            <TouchableOpacity
                                onPress={() => void handleSend()}
                                disabled={!inputValue.trim() || isLoading}
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
