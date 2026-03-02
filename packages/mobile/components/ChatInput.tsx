import {
    View,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import { Send } from 'lucide-react-native';

interface ChatInputProps {
    onSend: (message: string) => void;
    onTyping?: (isTyping: boolean) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const ChatInput = React.memo(function ChatInput({
    onSend,
    onTyping,
    placeholder = 'Nhập tin nhắn...',
    disabled = false,
}: ChatInputProps) {
    const [text, setText] = useState('');

    const handleSend = useCallback(() => {
        const trimmedText = text.trim();
        if (trimmedText && !disabled) {
            onSend(trimmedText);
            setText('');
        }
    }, [text, onSend, disabled]);

    const handleChangeText = useCallback((newText: string) => {
        setText(newText);
        onTyping?.(newText.trim().length > 0);
    }, [onTyping]);

    const isEmpty = text.trim().length === 0;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View className="flex-row items-end px-4 py-3 bg-surface border-t border-gray-100">
                <TextInput
                    value={text}
                    onChangeText={handleChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                    className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 max-h-24 text-text-primary"
                    style={{ textAlignVertical: 'center' }}
                />

                <Pressable
                    onPress={handleSend}
                    disabled={isEmpty || disabled}
                    className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${isEmpty || disabled
                        ? 'bg-gray-300'
                        : 'bg-primary-500 active:bg-primary-600'
                        }`}
                    hitSlop={8}
                >
                    <Send
                        size={20}
                        color={isEmpty || disabled ? '#9ca3af' : 'white'}
                    />
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
});
