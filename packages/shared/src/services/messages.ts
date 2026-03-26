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
    room?: {
        id: string;
        title: string;
        address?: string | null;
        pricePerMonth?: number | null;
        imageUrl?: string | null;
    };
}

type ConversationMeta = {
    id: string;
    room_id: string | null;
    room_title_snapshot: string | null;
    room?: {
        id: string;
        title: string | null;
        address?: string | null;
        price_per_month?: number | null;
        room_images?: Array<{ image_url: string | null; display_order?: number | null }>;
    } | null;
};

function mapRoomContext(conversation?: ConversationMeta | null) {
    const room = conversation?.room ?? null;
    const roomTitle = room?.title || conversation?.room_title_snapshot || undefined;
    const roomImageUrl =
        room?.room_images
            ?.slice()
            .sort((left, right) => Number(left.display_order ?? 0) - Number(right.display_order ?? 0))[0]
            ?.image_url || null;

    return {
        roomId: conversation?.room_id || undefined,
        roomTitle,
        room: room && roomTitle
            ? {
                id: room.id,
                title: roomTitle,
                address: room.address || null,
                pricePerMonth: room.price_per_month ?? null,
                imageUrl: roomImageUrl,
            }
            : undefined,
    };
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
    const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
      conversation_id,
      conversation:conversations(
        id,
        created_at,
        updated_at,
        room_id,
        room_title_snapshot,
        room:rooms(
          id,
          title,
          address,
          price_per_month,
          room_images(image_url, display_order)
        )
      )
    `)
        .eq('user_id', userId);

    if (participantError) throw participantError;
    if (!participantData || participantData.length === 0) return [];

    const typedConversationMeta = participantData as unknown as Array<{
        conversation_id: string;
        conversation: ConversationMeta | null;
    }>;
    const conversationIds = typedConversationMeta.map((participant) => participant.conversation_id);
    const conversationMeta = new Map(
        typedConversationMeta
            .filter((entry) => entry.conversation)
            .map((entry) => [entry.conversation_id, entry.conversation!]),
    );

    const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
      conversation_id,
      user:users(id, full_name, avatar_url, email)
    `)
        .in('conversation_id', conversationIds)
        .neq('user_id', userId);

    if (allParticipantsError) throw allParticipantsError;

    const typedParticipants = allParticipants as unknown as Array<{
        conversation_id: string;
        user: {
            id: string;
            full_name: string;
            avatar_url: string | null;
            email?: string;
        };
    }>;

    const conversations: Conversation[] = [];

    for (const conversationId of conversationIds) {
        const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        const participant = typedParticipants.find((entry) => entry.conversation_id === conversationId)?.user;
        if (!participant) {
            continue;
        }

        const roomContext = mapRoomContext(conversationMeta.get(conversationId));

        conversations.push({
            id: conversationId,
            participant: {
                id: participant.id,
                full_name: participant.full_name || 'Unknown',
                avatar_url: participant.avatar_url,
                email: participant.email || undefined,
            },
            lastMessage: lastMessageData || {
                id: '',
                conversation_id: conversationId,
                sender_id: '',
                content: 'Bắt đầu cuộc trò chuyện...',
                created_at: new Date().toISOString(),
                updated_at: null,
                is_read: true,
            },
            unreadCount: unreadCount || 0,
            ...roomContext,
        });
    }

    conversations.sort((left, right) => {
        const leftDate = left.lastMessage.created_at ? new Date(left.lastMessage.created_at).getTime() : 0;
        const rightDate = right.lastMessage.created_at ? new Date(right.lastMessage.created_at).getTime() : 0;
        return rightDate - leftDate;
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
    const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

    if (!participantData || participantData.length === 0) return 0;

    const conversationIds = participantData.map((participant) => participant.conversation_id);

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
    otherUserId: string,
    roomId?: string | null,
    roomTitleSnapshot?: string | null,
): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_or_create_conversation', {
        room_id: roomId ?? null,
        room_title_snapshot: roomTitleSnapshot ?? null,
        user1_id: userId,
        user2_id: otherUserId,
    });

    if (error) {
        console.error('[getOrCreateConversation] RPC error:', error);
        throw error;
    }

    return data as string;
}
