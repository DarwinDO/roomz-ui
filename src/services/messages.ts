/**
 * Messages API Service
 * CRUD operations for messages using conversation-based schema
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type Message = Tables<'messages'>;

export interface MessageWithUsers extends Message {
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  };
  // For compatibility, keep receiver but it will be inferred from conversation participants
  receiver?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  };
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  roomId?: string;
  roomTitle?: string;
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  // Get all conversations where user is a participant
  const { data: participantData, error: participantError } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      conversation:conversations(id, created_at, updated_at)
    `)
    .eq('user_id', userId);

  if (participantError) throw participantError;
  if (!participantData || participantData.length === 0) return [];

  const conversationIds = participantData.map(p => p.conversation_id);

  // Get other participants for each conversation
  const { data: allParticipants, error: allParticipantsError } = await supabase
    .from('conversation_participants')
    .select(`
      conversation_id,
      user:users(id, full_name, avatar_url, email)
    `)
    .in('conversation_id', conversationIds)
    .neq('user_id', userId);

  if (allParticipantsError) throw allParticipantsError;

  // Get latest message and unread count for each conversation
  const conversations: Conversation[] = [];

  for (const convId of conversationIds) {
    // Get latest message
    const { data: lastMessageData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    // Find the other participant
    const otherParticipant = allParticipants?.find(p => p.conversation_id === convId);
    const participant = otherParticipant?.user;

    if (participant && lastMessageData) {
      conversations.push({
        id: convId,
        participant: {
          id: participant.id,
          full_name: participant.full_name || 'Unknown',
          avatar_url: participant.avatar_url,
          email: participant.email || undefined,
        },
        lastMessage: lastMessageData,
        unreadCount: unreadCount || 0,
      });
    }
  }

  // Sort by latest message
  conversations.sort((a, b) => {
    const dateA = a.lastMessage.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
    const dateB = b.lastMessage.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
    return dateB - dateA;
  });

  return conversations;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<MessageWithUsers[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url, email)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as MessageWithUsers[];
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  // Get user's conversations
  const { data: participantData } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (!participantData || participantData.length === 0) return 0;

  const conversationIds = participantData.map(p => p.conversation_id);

  // Count unread messages in those conversations (not sent by user)
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .eq('is_read', false);

  return count || 0;
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark messages as read in a conversation
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Create or get existing conversation between users
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string
): Promise<string> {
  // Check if conversation already exists
  const { data: existingConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (existingConvs) {
    for (const conv of existingConvs) {
      const { data: otherParticipant } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conv.conversation_id)
        .eq('user_id', otherUserId)
        .single();

      if (otherParticipant) {
        return conv.conversation_id;
      }
    }
  }

  // Create new conversation
  const { data: newConversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (convError) throw convError;

  // Add participants
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConversation.id, user_id: userId },
      { conversation_id: newConversation.id, user_id: otherUserId },
    ]);

  if (participantError) throw participantError;

  return newConversation.id;
}

/**
 * Legacy subscriptions - deprecated, use realtime.ts instead
 */
export function subscribeToMessages(
  userId: string,
  onNewMessage: (message: Message) => void,
  _onMessagesRead?: (payload: { messageIds: string[] }) => void
) {
  console.warn('[messages.ts] subscribeToMessages is deprecated, use realtime.ts instead');

  const channel = supabase
    .channel(`user-messages-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}

export function subscribeToConversation(
  _userId: string,
  conversationId: string,
  onNewMessage: (message: MessageWithUsers) => void
) {
  console.warn('[messages.ts] subscribeToConversation is deprecated, use realtime.ts instead');

  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new as MessageWithUsers);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
