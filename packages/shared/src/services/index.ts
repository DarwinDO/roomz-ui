/**
 * Services Index - Phase 3
 * 
 * This module provides shared service implementations.
 * All services accept SupabaseClient as a parameter for platform agnosticism.
 * 
 * Architecture:
 * - Services live in @roomz/shared/src/services/
 * - All services accept SupabaseClient as first parameter
 * - Browser-specific services (roommates, vietnamLocations) accept StorageAdapter
 * 
 * Usage in web app:
 * - Import from @roomz/shared/services
 * - Services are wrapped in web to inject SupabaseClient automatically
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export adapter types for service use
export type { StorageAdapter, PlatformFile, PlatformAdapters, NotificationAdapter, NotificationOptions, ConfigAdapter } from '../adapters';

// ============================================
// Room Services
// ============================================

export * from './rooms';

// ============================================
// Chat & Messaging Services
// (chat module re-exports from messages and realtime)
// ============================================

export { DEFAULT_QUICK_REPLIES } from './chat';
export type { QuickReply } from './chat';

// Re-export chat API functions (they include optimized versions of messages functions)
export {
    getConversations as getChatConversations,
    getMessages as getChatMessages,
    getUnreadCount as getChatUnreadCount,
    sendMessage as sendChatMessage,
    markMessagesAsRead as markChatMessagesAsRead,
    getOrCreateConversation as getOrCreateChatConversation,
    startConversation as startChatConversation,
} from './chat/api';

// Re-export chat realtime functions
export {
    subscribeToConversationMessages,
    subscribeToUserMessages,
    subscribeToConversations,
    createTypingChannel,
    createPresenceChannel,
    onConnectionStatusChange,
    cleanupAllChannels,
    getActiveChannelCount,
} from './chat';

// ============================================
// Community Services
// ============================================

export * from './community';

// ============================================
// Favorites Services
// ============================================

export * from './favorites';

// ============================================
// Bookings Services
// ============================================

export * from './bookings';

// ============================================
// Deals Services
// ============================================

export * from './deals';

// ============================================
// Partners Services
// ============================================

export * from './partners';

// ============================================
// Reviews Services
// ============================================

export * from './reviews';

// ============================================
// Profile Services
// ============================================

export * from './profile';

// ============================================
// Reports Services
// ============================================

export * from './reports';

// ============================================
// Service Leads Services
// ============================================

export * from './serviceLeads';

// ============================================
// Sublets Services
// ============================================

export * from './sublets';

// ============================================
// Swap Services
// ============================================

export * from './swap';

// ============================================
// Analytics Services
// ============================================

export * from './analytics';

// ============================================
// Verification Services
// ============================================

export * from './verification';

// ============================================
// Realtime Types
// ============================================

export type { RealtimeSubscription, UserPresence, TypingIndicator, ConnectionStatus } from './realtime';
