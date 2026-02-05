/**
 * Chat Service - Main Entry Point
 * Re-exports all chat functionality from organized modules
 */

// Types
export type {
    Message,
    MessageWithSender,
    Conversation,
    UserInfo,
    QuickReply,
} from './types';

export { DEFAULT_QUICK_REPLIES } from './types';

// Types from realtime.ts
export type {
    TypingIndicator,
    ConnectionStatus,
} from '../realtime';

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

// Realtime subscriptions (re-export from realtime.ts)
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
} from '../realtime';
