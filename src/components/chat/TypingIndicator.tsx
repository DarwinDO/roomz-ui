/**
 * TypingIndicator Component
 * Animated dots showing someone is typing
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TypingIndicator as TypingIndicatorType } from '@/services/chat';

interface TypingIndicatorProps {
    typingUsers: TypingIndicatorType[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
    if (typingUsers.length === 0) return null;

    const userName = typingUsers[0]?.userName || 'Someone';
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <Avatar className="w-6 h-6">
                <AvatarFallback className="text-[10px] bg-muted">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1.5">
                <span className="text-xs text-muted-foreground mr-1">
                    {typingUsers.length === 1
                        ? `${userName} đang gõ`
                        : `${typingUsers.length} người đang gõ`}
                </span>

                {/* Animated dots */}
                <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}
