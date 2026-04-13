/**
 * IntroMessageModal - Modal to compose and send intro message
 * Allows user to send a first message (limited to 200 chars) before connecting
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumAvatar } from '@/components/ui/PremiumAvatar';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoommateMatch } from '@/services/roommates';

interface IntroMessageModalProps {
    open: boolean;
    onClose: () => void;
    match: RoommateMatch | null;
    onSend: (message: string) => Promise<void>;
}

const MAX_CHARS = 200;
const INTRO_SUGGESTIONS = [
    'Chào bạn! Mình thấy chúng ta khá phù hợp. Bạn có thể cho mình biết thêm về lịch sinh hoạt của bạn không?',
    'Hi! Mình đang tìm bạn cùng phòng ở khu vực này. Rất vui được gặp bạn! 👋',
    'Xin chào! Mình thấy chúng ta có nhiều điểm chung. Bạn có đang tìm phòng không?',
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function IntroMessageModal({
    open,
    onClose,
    match,
    onSend,
}: IntroMessageModalProps) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const charCount = message.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isEmpty = message.trim().length === 0;

    const handleSend = async () => {
        if (isEmpty || isOverLimit || !match) return;

        setSending(true);
        try {
            await onSend(message);
            setMessage('');
            onClose();
        } finally {
            setSending(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setMessage(suggestion);
    };

    const handleClose = () => {
        if (!sending) {
            setMessage('');
            onClose();
        }
    };

    if (!match) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gửi lời chào</DialogTitle>
                    <DialogDescription>
                        Gửi tin nhắn giới thiệu đến {match.full_name}. Họ sẽ thấy tin nhắn này khi xem yêu cầu kết nối của bạn.
                    </DialogDescription>
                </DialogHeader>

                {/* Recipient Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <PremiumAvatar isPremium={match.is_premium ?? false} className="h-12 w-12">
                        <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(match.full_name)}
                        </AvatarFallback>
                    </PremiumAvatar>
                    <div>
                        <p className="font-medium">{match.full_name}</p>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {match.compatibility_score}% phù hợp
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                    <Textarea
                        placeholder="Viết tin nhắn giới thiệu của bạn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={cn(
                            'min-h-[100px] resize-none',
                            isOverLimit && 'border-red-500 focus-visible:ring-red-500'
                        )}
                        disabled={sending}
                    />
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                            Gợi ý nhanh:
                        </span>
                        <span className={cn(
                            'font-medium',
                            isOverLimit ? 'text-red-500' : 'text-muted-foreground'
                        )}>
                            {charCount}/{MAX_CHARS}
                        </span>
                    </div>
                </div>

                {/* Quick Suggestions */}
                <div className="flex flex-wrap gap-2">
                    {INTRO_SUGGESTIONS.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                            disabled={sending}
                        >
                            {suggestion.slice(0, 30)}...
                        </button>
                    ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={sending}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isEmpty || isOverLimit || sending}
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Gửi tin nhắn
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
