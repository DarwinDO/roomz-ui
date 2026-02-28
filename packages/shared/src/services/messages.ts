/**
 * Messages API Service (Shared)
 * CRUD operations for messages using conversation-based schema
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    updated_at: string | null;
    is_read: boolean;
}

export interface MessageWithUsers extends Message {
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        email?: string;
    };
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

// ============================================
// API Functions
// ============================================

/**
 * Get all conversations for a user
 */
export async function getConversations(
    supabase: SupabaseClient,
    userId: string
): Promise<Conversation[]> {
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
        // Get latest message (use maybeSingle to avoid 406 error when no messages)
        const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        // Find the other participant
        const typedParticipants = allParticipants as unknown as Array<{ conversation_id: string; user: { id: string; full_name: string; avatar_url: string | null; email?: string } }>;
        const otherParticipant = typedParticipants?.find(p => p.conversation_id === convId);
        const participant = otherParticipant?.user;

        // Include conversations even without messages (e.g., newly accepted roommate requests)
        if (participant) {
            conversations.push({
                id: convId,
                participant: {
                    id: participant.id,
                    full_name: participant.full_name || 'Unknown',
                    avatar_url: participant.avatar_url,
                    email: participant.email || undefined,
                },
                // Provide empty placeholder if no messages yet
                lastMessage: lastMessageData || {
                    id: '',
                    conversation_id: convId,
                    sender_id: '',
                    content: 'Bắt đầu cuộc trò chuyện...',
                    created_at: new Date().toISOString(),
                    updated_at: null,
                    is_read: true,
                },
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
    supabase: SupabaseClient,
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
export async function getUnreadCount(
    supabase: SupabaseClient,
    userId: string
): Promise<number> {
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
    supabase: SupabaseClient,
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
    supabase: SupabaseClient,
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
 * Uses RPC function to bypass RLS issues with SECURITY DEFINER
 */
export async function getOrCreateConversation(
    supabase: SupabaseClient,
    userId: string,
    otherUserId: string
): Promise<string> {
    // Use RPC function which runs with SECURITY DEFINER
    // This handles finding existing conversation or creating new one atomically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_or_create_conversation', {
        user1_id: userId,
        user2_id: otherUserId,
    });

    if (error) {
        console.error('[getOrCreateConversation] RPC error:', error);
        throw error;
    }

    return data as string;
}
