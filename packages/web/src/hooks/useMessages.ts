/**
 * useMessages Hook
 * React hooks for conversations and messages using controlled polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import { getConversations, type Conversation } from '@/services/messages';
import { getMessages, sendMessage as sendMessageApi } from '@/services/chat';
import type { MessageWithSender } from '@/services/realtime';

export type { Conversation } from '@/services/messages';
export type { MessageWithSender };

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refetch: () => Promise<void>;
}

interface UseMessagesReturn {
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useConversations(): UseConversationsReturn {
  const { user, session, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isReady = !authLoading && !!user?.id && !!session?.access_token;
  const hasLoadedRef = useRef(false);

  const fetchConversations = useCallback(async (options?: { background?: boolean }) => {
    if (!isReady) {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    const background = options?.background ?? false;
    const shouldShowLoading = !background && !hasLoadedRef.current;

    if (shouldShowLoading) {
      setLoading(true);
    }

    if (!background) {
      setError(null);
    }

    try {
      const convos = await getConversations(user.id);
      setConversations(convos);
      setUnreadCount(convos.reduce((total, conversation) => total + conversation.unreadCount, 0));
      hasLoadedRef.current = true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('[useConversations] Fetch error:', err);
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [isReady, user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void fetchConversations();
  }, [authLoading, fetchConversations]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchConversations({ background: true });
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchConversations, isReady]);

  return {
    conversations,
    loading,
    error,
    unreadCount,
    refetch: fetchConversations,
  };
}

export function useConversationMessages(
  conversationId: string
): UseMessagesReturn {
  const { user, profile, session, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<UseMessagesReturn['connectionStatus']>('disconnected');
  const isReady = !authLoading && !!user?.id && !!session?.access_token;
  const hasLoadedRef = useRef(false);

  const fetchMessages = useCallback(async (options?: { background?: boolean }) => {
    if (!conversationId || !isReady) {
      setMessages([]);
      setLoading(false);
      setConnectionStatus('disconnected');
      hasLoadedRef.current = false;
      return;
    }

    const background = options?.background ?? false;
    const shouldShowLoading = !background && !hasLoadedRef.current;

    if (shouldShowLoading) {
      setLoading(true);
    }

    if (!background) {
      setError(null);
    }

    setConnectionStatus('connected');

    try {
      const data = await getMessages(conversationId);
      setMessages(data.map((msg) => ({
        ...msg,
        sender: msg.sender as MessageWithSender['sender'],
      })));
      hasLoadedRef.current = true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      setConnectionStatus('error');
      console.error('[useConversationMessages] Fetch error:', err);
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [conversationId, isReady]);

  useEffect(() => {
    if (authLoading || !conversationId) {
      return;
    }

    void fetchMessages();
  }, [authLoading, conversationId, fetchMessages]);

  useEffect(() => {
    if (!conversationId || !isReady) {
      setConnectionStatus('disconnected');
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchMessages({ background: true });
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
      setConnectionStatus('disconnected');
    };
  }, [conversationId, fetchMessages, isReady]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user?.id || !conversationId) {
      return;
    }

    try {
      const newMessage = await sendMessageApi(conversationId, content, user.id);

      setMessages((prev) => {
        if (prev.some((message) => message.id === newMessage.id)) {
          return prev;
        }

        return [
          ...prev,
          {
            ...newMessage,
            sender: {
              id: user.id,
              full_name: profile?.full_name || 'You',
              avatar_url: profile?.avatar_url ?? null,
              is_premium: profile?.is_premium ?? undefined,
            },
          },
        ];
      });
    } catch (err: unknown) {
      console.error('[useConversationMessages] Send error:', err);
      throw err;
    }
  }, [conversationId, profile?.avatar_url, profile?.full_name, profile?.is_premium, user?.id]);

  const handleMarkAsRead = useCallback(async () => {
    if (!user?.id || !conversationId) {
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      setMessages((prev) => prev.map((message) => (
        message.sender_id !== user.id ? { ...message, is_read: true } : message
      )));
    } catch (err: unknown) {
      console.error('[useConversationMessages] Mark as read error:', err);
    }
  }, [conversationId, user?.id]);

  return {
    messages,
    loading,
    error,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    refetch: fetchMessages,
    connectionStatus,
  };
}

export function useProfileMessages() {
  const { conversations, loading, error, unreadCount, refetch } = useConversations();

  const messages = conversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.participant.full_name,
    avatar: conversation.participant.avatar_url || undefined,
    lastMessage: conversation.lastMessage?.content || '',
    time: conversation.lastMessage?.created_at || '',
    unread: conversation.unreadCount > 0,
    unreadCount: conversation.unreadCount,
    conversationId: conversation.id,
    participantId: conversation.participant.id,
  }));

  return {
    messages,
    loading,
    error,
    unreadCount,
    refetch,
  };
}
