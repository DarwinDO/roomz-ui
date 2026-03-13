/**
 * AI Chatbot Types (Shared)
 */

export interface AIChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
        functionCalls?: Array<{
            name: string;
            result: unknown;
        }>;
        actions?: RomiChatAction[];
        sources?: string[];
        geminiCallCount?: number;
    };
    created_at: string;
}

export interface AIChatSession {
    id: string;
    user_id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
}

export interface AIChatRequest {
    message: string;
    sessionId?: string;
}

export type RomiChatActionType =
    | 'open_search'
    | 'open_room'
    | 'open_local_passport'
    | 'open_payment'
    | 'open_support_services'
    | 'open_verification'
    | 'open_roommates'
    | 'open_swap';

export interface RomiChatAction {
    type: RomiChatActionType;
    label: string;
    href: string;
    description?: string;
}

export interface AIChatResponse {
    message: string;
    sessionId: string;
    metadata?: {
        functionCalls?: Array<{
            name: string;
            result: unknown;
        }>;
        actions?: RomiChatAction[];
        sources?: string[];
        geminiCallCount?: number;
    };
}

export interface AIChatError {
    error: string;
    code:
        | 'RATE_LIMITED'
        | 'GEMINI_ERROR'
        | 'AUTH_ERROR'
        | 'INVALID_INPUT'
        | 'INVALID_SESSION'
        | 'DB_SCHEMA_MISSING';
    details?: string | null;
}
