/**
 * Chat & Messaging API Service
 */
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/lib/database.types';

export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type MessageInsert = TablesInsert<'messages'>;

export interface ConversationWithDetails extends Conversation {
    last_message?: Message;
    participants: { user: Tables<'users'> }[];
    unread_count?: number;
}

/**
 * Get all conversations for current user
 */
export async function getConversations(): Promise<ConversationWithDetails[]> {
    // Supabase complex query to get convos, participants, and last message
    // Note: This often requires a View for performance, but we'll try raw query with nested selects
    const { data, error } = await supabase
        .from('conversations')
        .select(`
      *,
      conversation_participants!inner (
        user:users (*)
      ),
      messages (
        *
      )
    `)
        .order('updated_at', { ascending: false });

    if (error) throw error;

    // Client-side transform (not ideal for large list but fine for MVP)
    // We need to filter out the current user from participants list for display
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    return data.map((conv: any) => {
        const lastMsg = conv.messages && conv.messages.length > 0
            ? conv.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            : null;

        return {
            ...conv,
            last_message: lastMsg,
            participants: conv.conversation_participants.filter((p: any) => p.user.id !== currentUserId),
            unread_count: 0 // TODO: Calculate
        };
    });
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select(`
      *,
      sender:users(*)
    `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

/**
 * Send a message
 */
export async function sendMessage(conversationId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
        })
        .select()
        .single();

    if (error) throw error;

    // Touch conversation updated_at
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return data;
}

/**
 * Start a conversation with a user (if not exists)
 */
export async function startConversation(otherUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if existing conversation (Client side check or RPC recommended)
    // For MVP: Create new always or handle duplicate via unique constraints if logic needed
    // We will assume creation for now.

    const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

    if (convoError) throw convoError;

    // Add participants
    const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
            { conversation_id: convo.id, user_id: user.id },
            { conversation_id: convo.id, user_id: otherUserId }
        ]);

    if (partError) throw partError;

    return convo;
}
