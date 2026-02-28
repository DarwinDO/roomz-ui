/**
 * Chat Hooks - Main Entry Point
 * Re-exports all chat-related hooks
 */

export { useConversations, conversationKeys } from './useConversations';
export { useMessages, messageKeys } from './useMessages';
export { useTypingIndicator } from './useTypingIndicator';

// Re-export types for convenience
export type { Conversation, MessageWithSender } from '@/services/chat';
