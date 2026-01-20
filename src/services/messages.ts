/**
 * Messages API Service
 * CRUD operations for messages
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type Message = Tables<'messages'>;

export interface MessageWithUsers extends Message {
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
  room?: {
    id: string;
    title: string;
  };
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
  lastMessage: Message;
  unreadCount: number;
  roomId?: string;
  roomTitle?: string;
}

/**
 * Get all messages for a user (both sent and received)
 */
export async function getUserMessages(userId: string): Promise<MessageWithUsers[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, email),
      receiver:users!receiver_id(id, full_name, avatar_url, email),
      room:rooms(id, title)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []) as MessageWithUsers[];
}

/**
 * Get conversations list (grouped by participant)
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const messages = await getUserMessages(userId);

  // Group messages by conversation partner
  const conversationMap = new Map<string, Conversation>();

  for (const msg of messages) {
    const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const partner = msg.sender_id === userId ? msg.receiver : msg.sender;

    if (!partner) continue;

    const existing = conversationMap.get(partnerId);
    
    if (!existing) {
      conversationMap.set(partnerId, {
        id: partnerId,
        participant: partner,
        lastMessage: msg,
        unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0,
        roomId: msg.room?.id,
        roomTitle: msg.room?.title,
      });
    } else {
      // Update unread count
      if (msg.receiver_id === userId && !msg.is_read) {
        existing.unreadCount++;
      }
    }
  }

  return Array.from(conversationMap.values());
}

/**
 * Get messages between two users
 */
export async function getConversationMessages(
  userId: string,
  partnerId: string,
  roomId?: string
): Promise<MessageWithUsers[]> {
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, email),
      receiver:users!receiver_id(id, full_name, avatar_url, email)
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .is('deleted_at', null);

  if (roomId) {
    query = query.eq('room_id', roomId);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []) as MessageWithUsers[];
}

/**
 * Send a message
 */
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  roomId?: string,
  messageType: 'text' | 'image' | 'file' = 'text'
): Promise<MessageWithUsers> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      room_id: roomId,
      message_type: messageType,
    })
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, email),
      receiver:users!receiver_id(id, full_name, avatar_url, email)
    `)
    .single();

  if (error) throw error;

  return data as MessageWithUsers;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(userId: string, senderId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Get unread message count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false)
    .is('deleted_at', null);

  if (error) throw error;

  return count || 0;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(messageId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (error) throw error;
}

/**
 * Subscribe to new messages in real-time using Supabase Realtime
 * Uses Postgres Changes (CDC) to listen for INSERT events on messages table
 * 
 * @param userId - Current user ID to filter messages
 * @param onNewMessage - Callback when a new message is received
 * @param onMessageRead - Optional callback when messages are marked as read
 * @returns Supabase RealtimeChannel that can be unsubscribed
 */
export function subscribeToMessages(
  userId: string,
  onNewMessage: (message: MessageWithUsers) => void,
  onMessageRead?: (payload: { messageIds: string[] }) => void
) {
  const channelName = `messages-${userId}-${Date.now()}`;
  
  console.log('[Realtime] Subscribing to messages channel:', channelName);
  
  const channel = supabase
    .channel(channelName)
    // Listen for new messages where user is the receiver
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] New message received:', payload.new);
        
        // Fetch the full message with user details
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, full_name, avatar_url, email),
              receiver:users!receiver_id(id, full_name, avatar_url, email)
            `)
            .eq('id', (payload.new as Message).id)
            .single();

          if (error) {
            console.error('[Realtime] Error fetching message details:', error);
            return;
          }

          if (data) {
            onNewMessage(data as MessageWithUsers);
          }
        } catch (err) {
          console.error('[Realtime] Exception fetching message:', err);
        }
      }
    )
    // Listen for new messages where user is the sender (for optimistic UI sync)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('[Realtime] Sent message confirmed:', payload.new);
        // Could be used to confirm message was saved
      }
    )
    // Listen for message updates (read status)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        console.log('[Realtime] Message updated:', payload.new);
        
        // Check if this is a read status update
        const newMsg = payload.new as Message;
        const oldMsg = payload.old as Partial<Message>;
        
        if (newMsg.is_read && !oldMsg.is_read && onMessageRead) {
          onMessageRead({ messageIds: [newMsg.id] });
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed to messages');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error:', err);
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
      }
    });

  return channel;
}

/**
 * Subscribe to a specific conversation for real-time updates
 * Uses a more focused filter for better performance
 * 
 * @param userId - Current user ID
 * @param partnerId - Conversation partner's ID  
 * @param onNewMessage - Callback when a new message arrives in this conversation
 * @returns Supabase RealtimeChannel
 */
export function subscribeToConversation(
  userId: string,
  partnerId: string,
  onNewMessage: (message: MessageWithUsers) => void
) {
  const channelName = `conversation-${[userId, partnerId].sort().join('-')}`;
  
  console.log('[Realtime] Subscribing to conversation:', channelName);

  const channel = supabase
    .channel(channelName)
    // Messages from partner to user
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${partnerId}`,
      },
      async (payload) => {
        const newMsg = payload.new as Message;
        // Only process if this message is for the current user
        if (newMsg.receiver_id !== userId) return;
        
        try {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(id, full_name, avatar_url, email),
              receiver:users!receiver_id(id, full_name, avatar_url, email)
            `)
            .eq('id', newMsg.id)
            .single();

          if (data) {
            onNewMessage(data as MessageWithUsers);
          }
        } catch (err) {
          console.error('[Realtime] Error fetching conversation message:', err);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Subscribed to conversation with', partnerId);
      }
    });

  return channel;
}

/**
 * Create a broadcast channel for typing indicators
 * Uses Supabase Broadcast (not Postgres Changes) for ephemeral events
 * 
 * @param conversationId - Unique conversation identifier
 * @param onTyping - Callback when someone is typing
 * @returns Object with channel, sendTyping function, and unsubscribe
 */
export function createTypingChannel(
  conversationId: string,
  onTyping: (userId: string, isTyping: boolean) => void
) {
  const channelName = `typing-${conversationId}`;
  
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: false, self: false },
    },
  });

  channel
    .on('broadcast', { event: 'typing' }, (payload) => {
      const { userId, isTyping } = payload.payload as { userId: string; isTyping: boolean };
      onTyping(userId, isTyping);
    })
    .subscribe();

  const sendTyping = async (userId: string, isTyping: boolean) => {
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId, isTyping },
    });
  };

  return {
    channel,
    sendTyping,
    unsubscribe: () => channel.unsubscribe(),
  };
}
