/**
 * Chat Types
 * Centralized types for messaging functionality
 */

import type { Tables } from '@/lib/database.types';

// Base types from database
export type Message = Tables<'messages'>;
export type ConversationTable = Tables<'conversations'>;

// User info for display
export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_premium?: boolean | null;
    email?: string;
}

// Message with sender info
export interface MessageWithSender extends Message {
    sender?: UserInfo;
}

// Conversation with participant and last message
export interface Conversation {
    id: string;
    participant: UserInfo;
    lastMessage: Message | null;
    unreadCount: number;
    roomId?: string;
    roomTitle?: string;
    createdAt: string;
    updatedAt: string;
}

// Note: TypingIndicator and ConnectionStatus types are defined in ../realtime.ts

// Quick reply preset
export interface QuickReply {
    id: string;
    text: string;
    category?: 'inquiry' | 'schedule' | 'negotiation';
}

// Default quick replies for room seekers
export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
    { id: '1', text: 'Phòng này còn không ạ?', category: 'inquiry' },
    { id: '2', text: 'Điện nước giá sao ạ?', category: 'inquiry' },
    { id: '3', text: 'Em có thể xem phòng được không?', category: 'schedule' },
    { id: '4', text: 'Có bao nhiêu người ở rồi ạ?', category: 'inquiry' },
    { id: '5', text: 'Phòng có cửa sổ không ạ?', category: 'inquiry' },
    { id: '6', text: 'Có chỗ để xe không ạ?', category: 'inquiry' },
];
