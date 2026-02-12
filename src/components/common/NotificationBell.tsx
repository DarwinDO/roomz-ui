/**
 * NotificationBell Component
 * Displays notification icon with badge and dropdown list
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { cn } from '@/components/ui/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NOTIFICATION_ICONS: Record<Notification['type'], string> = {
    booking_request: '📅',
    booking_status: '📋',
    new_message: '💬',
    system: '🔔',
    verification: '✅',
    roommate_request: '🏠',
    sublet_request: '📝',
    sublet_approved: '✨',
    swap_match: '🔄',
    swap_request: '🔀',
    swap_confirmed: '✅',
};

interface NotificationItemProps {
    notification: Notification;
    onRead: () => void;
    onClick: () => void;
}

function NotificationItem({ notification, onRead, onClick }: NotificationItemProps) {
    const icon = NOTIFICATION_ICONS[notification.type] || '🔔';
    const timeAgo = notification.created_at
        ? formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: vi,
        })
        : '';

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0',
                !notification.is_read && 'bg-primary/5'
            )}
            onClick={onClick}
        >
            <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !notification.is_read && 'font-medium')}>
                    {notification.title}
                </p>
                {notification.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.content}
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
            {!notification.is_read && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRead();
                    }}
                >
                    <Check className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

export function NotificationBell() {
    const navigate = useNavigate();
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);

    const handleItemClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Debug: Check link value
        console.log('[NotificationBell] Clicked notification:', {
            id: notification.id,
            link: notification.link,
            type: notification.type,
        });

        if (notification.link) {
            setOpen(false);
            // Small delay to ensure popover closes before navigation
            setTimeout(() => {
                navigate(notification.link!);
            }, 100);
        } else {
            console.warn('[NotificationBell] No link found for notification:', notification.id);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs bg-red-500 hover:bg-red-500"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Thông báo</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Đã đọc tất cả
                        </Button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Chưa có thông báo</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[min(400px,calc(100vh-200px))]">
                        <div className="max-h-full">
                            {notifications.slice(0, 10).map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onRead={() => markAsRead(notification.id)}
                                    onClick={() => handleItemClick(notification)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer */}
                {notifications.length > 10 && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                                navigate('/notifications');
                                setOpen(false);
                            }}
                        >
                            Xem tất cả thông báo
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell;
