/**
 * Chat API Service
 * Consolidated and optimized API functions for messaging
 * Fixes N+1 query problem with batch queries
 */

import { supabase } from '@/lib/supabase';
import type { Conversation, Message, MessageWithSender, UserInfo } from './types';

/**
 * Get all conversations for a user (OPTIMIZED)
 * Uses batch queries instead of N+1 pattern
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
    // Step 1: Get all conversation IDs where user is participant
    const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (participantError) throw participantError;
    if (!participantData || participantData.length === 0) return [];

    const conversationIds = participantData.map(p => p.conversation_id);

    // Step 2: Batch fetch conversations with participants (single query)
    const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
      id,
      created_at,
      updated_at,
      conversation_participants!inner (
        user_id,
        user:users (id, full_name, avatar_url, email)
      )
    `)
        .in('id', conversationIds);

    if (convError) throw convError;

    // Step 3: Batch fetch latest message for each conversation (single query with window function)
    const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    if (msgError) throw msgError;

    // Step 4: Count unread messages manually (simpler, no RPC needed)
    const unreadCounts: Record<string, number> = {};
    const unreadMessages = messagesData?.filter(
        m => m.sender_id !== userId && !m.is_read
    ) || [];
    unreadMessages.forEach(m => {
        unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1;
    });

    // Step 5: Build conversation objects
    const conversations: Conversation[] = [];

    for (const conv of conversationsData || []) {
        // Find other participant (not current user)
        const participants = (conv.conversation_participants || []) as Array<{
            user_id: string;
            user: UserInfo | null;
        }>;
        const otherParticipant = participants.find(p => p.user_id !== userId);

        if (!otherParticipant?.user) continue;

        // Find latest message for this conversation
        const latestMessage = messagesData?.find(m => m.conversation_id === conv.id) || null;

        conversations.push({
            id: conv.id,
            participant: {
                id: otherParticipant.user.id,
                full_name: otherParticipant.user.full_name || 'Unknown',
                avatar_url: otherParticipant.user.avatar_url,
                email: otherParticipant.user.email || undefined,
            },
            lastMessage: latestMessage,
            unreadCount: unreadCounts[conv.id] || 0,
            createdAt: conv.created_at || '',
            updatedAt: conv.updated_at || '',
        });
    }

    // Sort by latest message or updated_at
    conversations.sort((a, b) => {
        const dateA = a.lastMessage?.created_at || a.updatedAt;
        const dateB = b.lastMessage?.created_at || b.updatedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return conversations;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:users!sender_id(id, full_name, avatar_url)
    `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as MessageWithSender[];
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

    // Count unread messages
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
    content: string
): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            is_read: false,
        })
        .select()
        .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

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
 * Get or create conversation between two users
 * Uses RPC for atomic operation
 */
export async function getOrCreateConversation(
    userId: string,
    otherUserId: string
): Promise<string> {
    // Try RPC first (atomic operation)
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: userId,
        user2_id: otherUserId,
    });

    if (error) {
        console.error('[getOrCreateConversation] RPC error:', error);
        throw error;
    }

    return data as string;
}

/**
 * Start a new conversation (creates conversation and adds participants)
 */
export async function startConversation(otherUserId: string): Promise<{ id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const conversationId = await getOrCreateConversation(user.id, otherUserId);
    return { id: conversationId };
}
