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
    };
}

export interface UserInfo {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
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
