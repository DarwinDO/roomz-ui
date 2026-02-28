/**
 * Messages API Service (Web Wrapper)
 * Re-exports from shared with SupabaseClient injection
 */

import { supabase } from '@/lib/supabase';
import * as messagesService from '@roomz/shared/services/messages';

export const getConversations = (userId: string) =>
  messagesService.getConversations(supabase, userId);

export const getConversationMessages = (conversationId: string) =>
  messagesService.getConversationMessages(supabase, conversationId);

export const getUnreadCount = (userId: string) =>
  messagesService.getUnreadCount(supabase, userId);

export const sendMessage = (
  conversationId: string,
  senderId: string,
  content: string
) => messagesService.sendMessage(supabase, conversationId, senderId, content);

export const markMessagesAsRead = (conversationId: string, userId: string) =>
  messagesService.markMessagesAsRead(supabase, conversationId, userId);

export const getOrCreateConversation = (userId: string, otherUserId: string) =>
  messagesService.getOrCreateConversation(supabase, userId, otherUserId);

// Re-export types
export type { Message, MessageWithUsers, Conversation } from '@roomz/shared/services/messages';
