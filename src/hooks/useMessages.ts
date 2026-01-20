/**
 * useMessages Hook
 * React hook for managing messages and conversations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  subscribeToMessages,
  type Conversation,
  type MessageWithUsers,
} from '@/services/messages';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refetch: () => Promise<void>;
}

interface UseMessagesReturn {
  messages: MessageWithUsers[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage conversations list
 */
export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToMessages(user.id, (newMessage) => {
      // Update conversations with new message
      setConversations(prev => {
        const partnerId = newMessage.sender_id === user.id 
          ? newMessage.receiver_id 
          : newMessage.sender_id;
        
        const existingIndex = prev.findIndex(c => c.id === partnerId);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          const isIncoming = newMessage.receiver_id === user.id;
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: newMessage,
            unreadCount: isIncoming 
              ? updated[existingIndex].unreadCount + 1 
              : updated[existingIndex].unreadCount,
          };
          // Move to top
          const [conversation] = updated.splice(existingIndex, 1);
          return [conversation, ...updated];
        }
        
        return prev;
      });
      
      // Only increment total unread count if message is from other user
      if (newMessage.sender_id !== user.id) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]); // Use user.id to prevent recreation on user object change

  return {
    conversations,
    loading,
    error,
    unreadCount,
    refetch: fetchConversations,
  };
}

/**
 * Hook to manage messages in a specific conversation
 */
export function useConversationMessages(
  partnerId: string,
  roomId?: string
): UseMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !partnerId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getConversationMessages(user.id, partnerId, roomId);
      setMessages(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, partnerId, roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time updates for this conversation
  useEffect(() => {
    if (!user || !partnerId) return;

    const subscription = subscribeToMessages(user.id, (newMessage) => {
      // Add if it's from this conversation partner (either sent or received)
      if (newMessage.sender_id === partnerId || 
          (newMessage.sender_id === user.id && newMessage.receiver_id === partnerId)) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, partnerId]); // Use user.id instead of user object

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !partnerId) return;

    try {
      const newMessage = await sendMessage(user.id, partnerId, content, roomId);
      setMessages(prev => [...prev, newMessage]);
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [user, partnerId, roomId]);

  const handleMarkAsRead = useCallback(async () => {
    if (!user || !partnerId) return;

    try {
      await markMessagesAsRead(user.id, partnerId);
    } catch (err: unknown) {
      console.error('Error marking messages as read:', err);
    }
  }, [user, partnerId]);

  return {
    messages,
    loading,
    error,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    refetch: fetchMessages,
  };
}
