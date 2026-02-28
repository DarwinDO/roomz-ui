/**
 * Chat Service - Main Entry Point (Shared)
 * Re-exports all chat functionality from organized modules
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export type {
    Message,
    MessageWithSender,
    Conversation,
    UserInfo,
    QuickReply,
} from './types';

export { DEFAULT_QUICK_REPLIES } from './types';

// API functions
export {
    getConversations,
    getMessages,
    getUnreadCount,
    sendMessage,
    markMessagesAsRead,
    getOrCreateConversation,
    startConversation,
} from './api';

// Realtime subscriptions
export {
    subscribeToConversationMessages,
    subscribeToUserMessages,
    subscribeToConversations,
    createTypingChannel,
    createPresenceChannel,
    onConnectionStatusChange,
    cleanupAllChannels,
    getActiveChannelCount,
    type RealtimeSubscription,
    type UserPresence,
    type TypingIndicator,
    type ConnectionStatus,
} from '../realtime';
