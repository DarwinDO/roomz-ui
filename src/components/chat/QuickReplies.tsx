/**
 * QuickReplies Component
 * Preset message buttons for common questions
 */

import { Badge } from '@/components/ui/badge';
import { DEFAULT_QUICK_REPLIES, type QuickReply } from '@/services/chat';

interface QuickRepliesProps {
    onSelect: (text: string) => void;
    replies?: QuickReply[];
    className?: string;
}

export function QuickReplies({
    onSelect,
    replies = DEFAULT_QUICK_REPLIES,
    className = '',
}: QuickRepliesProps) {
    return (
        <div className={`flex flex-wrap gap-2 px-4 py-2 bg-muted/30 border-t ${className}`}>
            <span className="text-xs text-muted-foreground w-full mb-1">
                Tin nhắn nhanh:
            </span>
            {replies.map((reply) => (
                <Badge
                    key={reply.id}
                    variant="outline"
                    className="cursor-pointer bg-background hover:bg-primary hover:text-primary-foreground transition-colors text-xs py-1 px-2"
                    onClick={() => onSelect(reply.text)}
                >
                    {reply.text}
                </Badge>
            ))}
        </div>
    );
}
