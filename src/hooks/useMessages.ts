/**
 * useMessages Hook
 * React hook for managing messages and conversations with realtime support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import { getConversations, getUnreadCount, type Conversation } from '@/services/messages';
import { getMessages, sendMessage as sendMessageApi } from '@/services/chat';
import {
  subscribeToConversationMessages,
  subscribeToUserMessages,
  subscribeToConversations,
  type MessageWithSender,
  type RealtimeSubscription,
} from '@/services/realtime';

// Re-export types for convenience
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

/**
 * Hook to manage conversations list with realtime updates
 */
export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [convos, count] = await Promise.all([
        getConversations(user.id),
        getUnreadCount(user.id),
      ]);
      setConversations(convos);
      setUnreadCount(count);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('[useConversations] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to realtime updates for all user messages
  useEffect(() => {
    if (!user?.id) return;



    // Subscribe to new messages for this user
    subscriptionRef.current = subscribeToUserMessages(user.id, {
      onNewMessage: (newMessage, conversationId) => {


        // Update conversations list
        setConversations(prev => {
          const existingIndex = prev.findIndex(c => c.id === conversationId);

          if (existingIndex >= 0) {
            const updated = [...prev];
            const isIncoming = newMessage.sender_id !== user.id;
            // Update lastMessage with only the fields we need for display
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastMessage: {
                ...updated[existingIndex].lastMessage,
                content: newMessage.content,
                created_at: newMessage.created_at,
                sender_id: newMessage.sender_id,
              },
              unreadCount: isIncoming
                ? updated[existingIndex].unreadCount + 1
                : updated[existingIndex].unreadCount,
            };
            // Move to top
            const [conversation] = updated.splice(existingIndex, 1);
            return [conversation, ...updated];
          }

          // New conversation - refetch to get full data
          fetchConversations();
          return prev;
        });

        // Increment unread count if message is from other user
        if (newMessage.sender_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      },
      onError: (err) => {
        console.error('[useConversations] Realtime error:', err);
      },
    });

    return () => {

      subscriptionRef.current?.unsubscribe();
    };
  }, [user?.id, fetchConversations]);

  // Also subscribe to conversation list updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToConversations(user.id, {
      onConversationUpdate: (updatedConversation) => {

        setConversations(prev =>
          prev.map(c =>
            c.id === updatedConversation.id ? { ...c, ...updatedConversation } : c
          )
        );
      },
      onNewConversation: () => {
        // Refetch to get new conversation with full data
        fetchConversations();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    unreadCount,
    refetch: fetchConversations,
  };
}

/**
 * Hook to manage messages in a specific conversation with realtime
 */
export function useConversationMessages(
  conversationId: string,
  roomId?: string
): UseMessagesReturn {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<UseMessagesReturn['connectionStatus']>('disconnected');
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getMessages(conversationId);
      // Transform to MessageWithSender format
      setMessages(data.map(msg => ({
        ...msg,
        sender: msg.sender as MessageWithSender['sender'],
      })));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('[useConversationMessages] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates for this conversation
  useEffect(() => {
    if (!user || !conversationId) return;


    setConnectionStatus('connecting');

    subscriptionRef.current = subscribeToConversationMessages(conversationId, {
      onNewMessage: (message) => {

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      },
      onMessageUpdate: (message) => {

        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, ...message } : m))
        );
      },
      onError: (err) => {
        console.error('[useConversationMessages] Error:', err);
        setError(err.message);
        setConnectionStatus('error');
      },
    });

    setConnectionStatus('connected');

    return () => {

      subscriptionRef.current?.unsubscribe();
      setConnectionStatus('disconnected');
    };
  }, [user?.id, conversationId]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !conversationId) return;

    try {
      const newMessage = await sendMessageApi(conversationId, content);

      // Optimistically add the message (realtime will also add)
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
    } catch (err: unknown) {
      console.error('[useConversationMessages] Send error:', err);
      throw err;
    }
  }, [user, profile, conversationId]);

  const handleMarkAsRead = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      // Mark messages as read via API
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m.sender_id !== user.id ? { ...m, is_read: true } : m
        )
      );
    } catch (err: unknown) {
      console.error('[useConversationMessages] Mark as read error:', err);
    }
  }, [user, conversationId]);

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

/**
 * Simplified hook for ProfilePage messages tab
 * Shows list of conversations with latest messages
 */
export function useProfileMessages() {
  const { conversations, loading, error, unreadCount, refetch } = useConversations();

  // Transform conversations to a format suitable for MessagesList component
  const messages = conversations.map(conv => ({
    id: conv.id,
    name: conv.participant.full_name,
    avatar: conv.participant.avatar_url || undefined,
    lastMessage: conv.lastMessage?.content || '',
    time: conv.lastMessage?.created_at || '',
    unread: conv.unreadCount > 0,
    unreadCount: conv.unreadCount,
    conversationId: conv.id,
    participantId: conv.participant.id,
  }));

  return {
    messages,
    loading,
    error,
    unreadCount,
    refetch,
  };
}
