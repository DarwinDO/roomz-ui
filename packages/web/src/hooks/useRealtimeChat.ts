/**
 * =============================================
 * useRealtimeChat Hook
 * =============================================
 * Comprehensive hook for realtime chat functionality
 * Combines messages, typing indicators, and presence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import {
    subscribeToConversationMessages,
    createTypingChannel,
    type MessageWithSender,
    type RealtimeSubscription,
    type TypingIndicator,
} from '@/services/realtime';
import { getMessages, sendMessage as sendMessageApi } from '@/services/chat';
import type { Tables } from '@/lib/database.types';

type Message = Tables<'messages'>;

interface UseRealtimeChatOptions {
    conversationId: string;
    enableTypingIndicator?: boolean;
    enablePresence?: boolean;
}

interface UseRealtimeChatReturn {
    // Messages
    messages: MessageWithSender[];
    loading: boolean;
    error: string | null;

    // Actions
    sendMessage: (content: string) => Promise<void>;

    // Typing
    isTyping: boolean;
    typingUsers: TypingIndicator[];
    setTyping: (typing: boolean) => void;

    // Connection
    connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';

    // Utils
    refetch: () => Promise<void>;
}

export function useRealtimeChat(options: UseRealtimeChatOptions): UseRealtimeChatReturn {
    const { conversationId, enableTypingIndicator = true } = options;
    const { user, profile } = useAuth();

    // State
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<UseRealtimeChatReturn['connectionStatus']>('disconnected');
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

    // Refs for subscriptions
    const messageSubRef = useRef<RealtimeSubscription | null>(null);
    const typingSubRef = useRef<{ sendTyping: (isTyping: boolean) => Promise<void>; subscription: RealtimeSubscription } | null>(null);

    // Fetch initial messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getMessages(conversationId);
            setMessages(data.map(msg => ({
                ...msg,
                sender: msg.sender as MessageWithSender['sender'],
            })));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch messages';
            setError(errorMsg);
            console.error('[useRealtimeChat] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Subscribe to new messages
    useEffect(() => {
        if (!conversationId || !user) return;

        if (import.meta.env.DEV) {
            console.log('[useRealtimeChat] Setting up message subscription');
        }
        setConnectionStatus('connecting');

        messageSubRef.current = subscribeToConversationMessages(conversationId, {
            onNewMessage: (message) => {
                if (import.meta.env.DEV) {
                    console.log('[useRealtimeChat] New message received:', message.id);
                }
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            },
            onMessageUpdate: (message) => {
                if (import.meta.env.DEV) {
                    console.log('[useRealtimeChat] Message updated:', message.id);
                }
                setMessages(prev => prev.map(m =>
                    m.id === message.id ? { ...m, ...message } : m
                ));
            },
            onError: (err) => {
                console.error('[useRealtimeChat] Subscription error:', err);
                setError(err.message);
                setConnectionStatus('error');
            },
        });

        setConnectionStatus('connected');

        return () => {
            if (import.meta.env.DEV) {
                console.log('[useRealtimeChat] Cleaning up message subscription');
            }
            messageSubRef.current?.unsubscribe();
        };
    }, [conversationId, user]);

    // Set up typing indicator
    useEffect(() => {
        if (!conversationId || !user || !enableTypingIndicator) return;

        if (import.meta.env.DEV) {
            console.log('[useRealtimeChat] Setting up typing channel');
        }

        typingSubRef.current = createTypingChannel(
            conversationId,
            user.id,
            profile?.full_name || user.email || 'Unknown',
            (indicator) => {
                setTypingUsers(prev => {
                    // Remove old typing indicators from same user
                    const filtered = prev.filter(t => t.userId !== indicator.userId);

                    if (indicator.isTyping) {
                        return [...filtered, indicator];
                    }
                    return filtered;
                });

                // Auto-remove typing indicators after 5 seconds
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(t => t.userId !== indicator.userId));
                }, 5000);
            }
        );

        return () => {
            if (import.meta.env.DEV) {
                console.log('[useRealtimeChat] Cleaning up typing channel');
            }
            typingSubRef.current?.subscription.unsubscribe();
        };
    }, [conversationId, user, enableTypingIndicator]);

    // Initial fetch
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!conversationId || !user || !content.trim()) return;

        try {
            // Stop typing indicator
            typingSubRef.current?.sendTyping(false);

            // Send message
            const newMessage = await sendMessageApi(conversationId, content, user.id);

            // Optimistically add to list (realtime will also add it)
            setMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, {
                    ...newMessage,
                    sender: {
                        id: user.id,
                        full_name: profile?.full_name || 'You',
                        avatar_url: profile?.avatar_url ?? null,
                    },
                }];
            });
        } catch (err) {
            console.error('[useRealtimeChat] Send message error:', err);
            throw err;
        }
    }, [conversationId, user]);

    // Set typing status
    const setTyping = useCallback((isTyping: boolean) => {
        typingSubRef.current?.sendTyping(isTyping);
    }, []);

    // Check if current user is typing (for UI)
    const isTyping = typingUsers.length > 0;

    return {
        messages,
        loading,
        error,
        sendMessage,
        isTyping,
        typingUsers,
        setTyping,
        connectionStatus,
        refetch: fetchMessages,
    };
}

export default useRealtimeChat;
