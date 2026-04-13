/**
 * Chat Types (Shared)
 */

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    updated_at: string | null;
    is_read: boolean;
}

export interface MessageWithSender extends Message {
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        is_premium?: boolean | null;
    };
}

export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_premium?: boolean | null;
    email?: string;
}

export interface ConversationRoomContext {
    id: string;
    title: string;
    address?: string | null;
    pricePerMonth?: number | null;
    imageUrl?: string | null;
}

export interface Conversation {
    id: string;
    participant: UserInfo;
    lastMessage: Message | null;
    unreadCount: number;
    createdAt?: string;
    updatedAt?: string;
    roomId?: string;
    roomTitle?: string;
    room?: ConversationRoomContext;
}

export interface QuickReply {
    id: string;
    text: string;
    icon?: string;
}

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
    { id: '1', text: 'Tôi quan tâm', icon: '❤️' },
    { id: '2', text: 'Có thể gặp mặt không?', icon: '📅' },
    { id: '3', text: 'Phòng còn available không?', icon: '🏠' },
    { id: '4', text: 'Cảm ơn!', icon: '🙏' },
];
