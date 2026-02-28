/**
 * Chat API Service (Shared)
 * Consolidated and optimized API functions for messaging
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

export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
}

export interface MessageWithSender extends Message {
    sender?: UserInfo;
}

export interface Conversation {
    id: string;
    participant: UserInfo;
    lastMessage: Message | null;
    unreadCount: number;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all conversations for a user (OPTIMIZED)
 * Uses batch queries instead of N+1 pattern
 */
export async function getConversations(
    supabase: SupabaseClient,
    userId: string
): Promise<Conversation[]> {
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
        const participants = (conv.conversation_participants || []) as unknown as Array<{
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
        const dateA = a.lastMessage?.created_at || a.updatedAt || '';
        const dateB = b.lastMessage?.created_at || b.updatedAt || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return conversations;
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
    supabase: SupabaseClient,
    conversationId: string
): Promise<MessageWithSender[]> {
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
    supabase: SupabaseClient,
    conversationId: string,
    content: string,
    senderId: string
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
 * Get or create conversation between two users
 * Uses RPC for atomic operation
 */
export async function getOrCreateConversation(
    supabase: SupabaseClient,
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
export async function startConversation(
    supabase: SupabaseClient,
    otherUserId: string,
    currentUserId: string
): Promise<{ id: string }> {
    const conversationId = await getOrCreateConversation(supabase, currentUserId, otherUserId);
    return { id: conversationId };
}
