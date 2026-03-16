/**
 * useTypingIndicator Hook
 * Manages typing indicator state for active chat
 */

import { useCallback } from 'react';
import type { TypingIndicator } from '@/services/chat';

interface UseTypingIndicatorResult {
    typingUsers: TypingIndicator[];
    isOtherTyping: boolean;
    setTyping: (isTyping: boolean) => void;
}

/**
 * Hook for typing indicators in active chat only
 */
export function useTypingIndicator(conversationId: string): UseTypingIndicatorResult {
    void conversationId;
    const setTyping = useCallback((isTyping: boolean) => {
        void isTyping;
        return;
    }, []);

    return {
        typingUsers: [],
        isOtherTyping: false,
        setTyping,
    };
}
