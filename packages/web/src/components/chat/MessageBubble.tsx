/**
 * MessageBubble Component
 * Reusable message bubble with avatar, timestamp, and read status
 */

import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumAvatar } from '@/components/ui/PremiumAvatar';
import { Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { MessageWithSender } from '@/services/chat';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
    message: MessageWithSender;
    isFromMe: boolean;
    showAvatar?: boolean;
}

/**
 * Smart timestamp formatting
 * "vừa xong" | "2 phút trước" | "hôm qua 14:30" | "03/02 14:30"
 */
function formatMessageTime(dateString: string): string {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;

    if (isToday(date)) {
        return format(date, 'HH:mm');
    }

    if (isYesterday(date)) {
        return `hôm qua ${format(date, 'HH:mm')}`;
    }

    // More than yesterday
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
}

export function MessageBubble({ message, isFromMe, showAvatar = true }: MessageBubbleProps) {
    const initials = message.sender?.full_name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';

    const timeAgo = message.created_at ? formatMessageTime(message.created_at) : '';

    return (
        <div className={cn('flex gap-2', isFromMe ? 'justify-end' : 'justify-start')}>
            {/* Avatar (only for received messages) */}
            {!isFromMe && showAvatar && (
                <PremiumAvatar
                    isPremium={message.sender?.is_premium ?? false}
                    className="h-8 w-8 shrink-0"
                >
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-muted">
                        {initials}
                    </AvatarFallback>
                </PremiumAvatar>
            )}

            {/* Message Bubble */}
            <div
                className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                    isFromMe
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border rounded-bl-sm'
                )}
            >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* Timestamp and Read Status */}
                <div
                    className={cn(
                        'flex items-center gap-1 mt-1 text-[10px]',
                        isFromMe ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                    )}
                >
                    <span>{timeAgo}</span>
                    {isFromMe && (
                        message.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5" />
                        ) : (
                            <Check className="w-3.5 h-3.5" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
