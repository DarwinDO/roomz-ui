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
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại.');
    }

    const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { message, sessionId } as AIChatRequest,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (error) {
        const context = (error as { context?: Response }).context;
        let detailedMessage: string | null = null;

        if (context) {
            const payload = await context.clone().json().catch(() => null) as
                | { error?: string; message?: string; code?: string | number; details?: string | null }
                | null;

            const serverMessage = payload?.error || payload?.message;
            if (serverMessage) {
                detailedMessage = payload.code
                    ? `${serverMessage} (${payload.code})`
                    : serverMessage;

                if (payload.details) {
                    detailedMessage = `${detailedMessage}: ${payload.details}`;
                }
            }
        }

        throw new Error(detailedMessage || error.message || 'Failed to send message');
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
