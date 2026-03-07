/**
 * AI Chatbot API Service (Shared)
 * Platform-agnostic API calls via Supabase Edge Function
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    AIChatRequest,
    AIChatResponse,
    AIChatSession,
    AIChatMessage,
} from './types';

/**
 * Send a message to the AI chatbot
 */
export async function sendAIChatMessage(
    supabase: SupabaseClient,
    message: string,
    sessionId?: string
): Promise<AIChatResponse> {
    const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { message, sessionId } as AIChatRequest,
    });

    if (error) {
        throw new Error(error.message || 'Failed to send message');
    }

    return data as AIChatResponse;
}

/**
 * Get all AI chat sessions for the current user
 */
export async function getAIChatSessions(
    supabase: SupabaseClient
): Promise<AIChatSession[]> {
    const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AIChatSession[];
}

/**
 * Get messages for a specific AI chat session
 */
export async function getAIChatMessages(
    supabase: SupabaseClient,
    sessionId: string
): Promise<AIChatMessage[]> {
    const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as AIChatMessage[];
}

/**
 * Delete an AI chat session and all its messages
 */
export async function deleteAIChatSession(
    supabase: SupabaseClient,
    sessionId: string
): Promise<void> {
    const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) throw error;
}
