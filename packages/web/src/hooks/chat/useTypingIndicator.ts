/**
 * useTypingIndicator Hook
 * Manages typing indicator state for active chat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts';
import { createTypingChannel, type TypingIndicator } from '@/services/chat';

interface UseTypingIndicatorResult {
    typingUsers: TypingIndicator[];
    isOtherTyping: boolean;
    setTyping: (isTyping: boolean) => void;
}

/**
 * Hook for typing indicators in active chat only
 */
export function useTypingIndicator(conversationId: string): UseTypingIndicatorResult {
    const { user, profile } = useAuth();
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
    const channelRef = useRef<ReturnType<typeof createTypingChannel> | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Setup typing channel
    useEffect(() => {
        if (!conversationId || !user) return;

        channelRef.current = createTypingChannel(
            conversationId,
            user.id,
            profile?.full_name || user.email || 'Unknown',
            (indicator) => {
                setTypingUsers(prev => {
                    // Remove old indicator from same user
                    const filtered = prev.filter(t => t.userId !== indicator.userId);

                    if (indicator.isTyping) {
                        return [...filtered, indicator];
                    }
                    return filtered;
                });

                // Auto-remove after 5 seconds (safety net)
                setTimeout(() => {
                    setTypingUsers(prev =>
                        prev.filter(t => t.userId !== indicator.userId)
                    );
                }, 5000);
            }
        );

        return () => {
            channelRef.current?.subscription.unsubscribe();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [conversationId, user, profile]);

    // Set typing status with debounce
    const setTyping = useCallback((isTyping: boolean) => {
        channelRef.current?.sendTyping(isTyping);

        // Auto-stop typing after 3 seconds of no activity
        if (isTyping) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                channelRef.current?.sendTyping(false);
            }, 3000);
        }
    }, []);

    return {
        typingUsers,
        isOtherTyping: typingUsers.length > 0,
        setTyping,
    };
}
