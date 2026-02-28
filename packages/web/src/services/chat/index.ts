/**
 * Chat Service - Main Entry Point (Web Wrapper)
 * Re-exports from shared with SupabaseClient injection
 */

import { supabase } from '@/lib/supabase';
import * as chatApi from './api';
import * as realtimeShared from '@roomz/shared/services/realtime';
import type { RealtimeSubscription, UserPresence, TypingIndicator, ConnectionStatus, MessageWithSender, Message, Conversation } from '@roomz/shared/services/realtime';

// Re-export chat API
export const getConversations = chatApi.getConversations;
export const getMessages = chatApi.getMessages;
export const getUnreadCount = chatApi.getUnreadCount;
export const sendMessage = chatApi.sendMessage;
export const markMessagesAsRead = chatApi.markMessagesAsRead;
export const getOrCreateConversation = chatApi.getOrCreateConversation;
export const startConversation = chatApi.startConversation;

// Re-export types
export type { Message, MessageWithSender, Conversation, UserInfo, QuickReply } from '@roomz/shared/services/chat';
export { DEFAULT_QUICK_REPLIES } from '@roomz/shared/services/chat';

// Re-export realtime with supabase bound
export const subscribeToConversationMessages = (
    conversationId: string,
    callbacks: {
        onNewMessage: (message: MessageWithSender) => void;
        onMessageUpdate?: (message: Message) => void;
        onError?: (error: Error) => void;
    }
): RealtimeSubscription => realtimeShared.subscribeToConversationMessages(supabase, conversationId, callbacks);

export const subscribeToUserMessages = (
    userId: string,
    callbacks: {
        onNewMessage: (message: Message, conversationId: string) => void;
        onError?: (error: Error) => void;
    }
): RealtimeSubscription => realtimeShared.subscribeToUserMessages(supabase, userId, callbacks);

export const subscribeToConversations = (
    userId: string,
    callbacks: {
        onConversationUpdate: (conversation: Conversation) => void;
        onNewConversation: (conversationId: string) => void;
    }
): RealtimeSubscription => realtimeShared.subscribeToConversations(supabase, userId, callbacks);

export const createTypingChannel = (
    conversationId: string,
    userId: string,
    userName: string,
    onTyping: (indicator: TypingIndicator) => void
): {
    sendTyping: (isTyping: boolean) => Promise<void>;
    subscription: RealtimeSubscription;
} => realtimeShared.createTypingChannel(supabase, conversationId, userId, userName, onTyping);

export const createPresenceChannel = (
    conversationId: string,
    userId: string,
    userName: string,
    callbacks: {
        onSync: (presences: Record<string, UserPresence[]>) => void;
        onJoin: (userId: string, presence: UserPresence) => void;
        onLeave: (userId: string) => void;
    }
): RealtimeSubscription => realtimeShared.createPresenceChannel(supabase, conversationId, userId, userName, callbacks);

export const onConnectionStatusChange = realtimeShared.onConnectionStatusChange;
export const cleanupAllChannels = () => realtimeShared.cleanupAllChannels(supabase);
export const getActiveChannelCount = () => realtimeShared.getActiveChannelCount(supabase);

// Realtime types
export type { RealtimeSubscription, UserPresence, TypingIndicator, ConnectionStatus };
