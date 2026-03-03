/**
 * Chat API Service (Web Wrapper)
 * Re-exports from shared with SupabaseClient injection
 */

import { supabase } from '@/lib/supabase';
import * as chatApi from '@roomz/shared/services/chat/api';

export const getConversations = (userId: string) =>
    chatApi.getConversations(supabase, userId);

export const getMessages = (conversationId: string) =>
    chatApi.getMessages(supabase, conversationId);

export const getUnreadCount = (userId: string) =>
    chatApi.getUnreadCount(supabase, userId);

export const sendMessage = (
    conversationId: string,
    content: string,
    senderId: string
) => chatApi.sendMessage(supabase, conversationId, content, senderId);

export const markMessagesAsRead = (conversationId: string, userId: string) =>
    chatApi.markMessagesAsRead(supabase, conversationId, userId);

export const getOrCreateConversation = (userId: string, otherUserId: string) =>
    chatApi.getOrCreateConversation(supabase, userId, otherUserId);

export const startConversation = (otherUserId: string, currentUserId: string) =>
    chatApi.startConversation(supabase, otherUserId, currentUserId);

// Re-export types
export type { Message, MessageWithSender, Conversation, UserInfo } from '@roomz/shared/services/chat';
