import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    sendAIChatMessage,
    getAIChatSessions,
    getAIChatMessages,
    deleteAIChatSession,
} from '@roomz/shared/services/ai-chatbot';
import type { AIChatResponse, AIChatMessage } from '@roomz/shared/services/ai-chatbot';

interface DisplayMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const WELCOME_MESSAGE: DisplayMessage = {
    id: 'welcome',
    text: 'Xin chào! 👋 Tôi là trợ lý AI của RommZ. Hỏi tôi bất cứ điều gì về tìm phòng, app, hoặc đời sống sinh viên!',
    sender: 'bot',
    timestamp: new Date(),
};

export function useAIChatbot() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
    const [error, setError] = useState<string | null>(null);

    const sendMutation = useMutation({
        mutationFn: async (message: string) => {
            return sendAIChatMessage(supabase, message, sessionId || undefined);
        },
        onMutate: (message: string) => {
            setError(null);
            const userMsg: DisplayMessage = {
                id: `user-${Date.now()}`,
                text: message,
                sender: 'user',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMsg]);
        },
        onSuccess: (response: AIChatResponse) => {
            if (!sessionId) {
                setSessionId(response.sessionId);
            }
            const botMsg: DisplayMessage = {
                id: `bot-${Date.now()}`,
                text: response.message,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
        },
        onError: (err: Error) => {
            setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        },
    });

    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim();
        if (!trimmed || sendMutation.isPending || !user) return;
        sendMutation.mutate(trimmed);
    }, [sendMutation, user]);

    const startNewChat = useCallback(() => {
        setSessionId(null);
        setMessages([WELCOME_MESSAGE]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading: sendMutation.isPending,
        error,
        isAuthenticated: !!user,
        sendMessage,
        startNewChat,
        sessionId,
    };
}
