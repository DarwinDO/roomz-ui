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
 * Subscribe to new messages in real-time
 */
export function subscribeToMessages(
  userId: string,
  callback: (message: MessageWithUsers) => void
) {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch the full message with user details
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!sender_id(id, full_name, avatar_url, email),
            receiver:users!receiver_id(id, full_name, avatar_url, email)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          callback(data as MessageWithUsers);
        }
      }
    )
    .subscribe();
}
