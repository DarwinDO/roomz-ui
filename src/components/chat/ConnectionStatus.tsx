/**
 * ConnectionStatus Component
 * Shows realtime connection status
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { onConnectionStatusChange, type ConnectionStatus as Status } from '@/services/chat';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
    className?: string;
    showLabel?: boolean;
}

export function ConnectionStatus({ className = '', showLabel = false }: ConnectionStatusProps) {
    const [status, setStatus] = useState<Status>('disconnected');

    useEffect(() => {
        const unsubscribe = onConnectionStatusChange(setStatus);
        return unsubscribe;
    }, []);

    const statusConfig = {
        connected: {
            icon: Wifi,
            color: 'text-green-500',
            label: 'Đã kết nối',
        },
        connecting: {
            icon: Loader2,
            color: 'text-yellow-500 animate-spin',
            label: 'Đang kết nối...',
        },
        disconnected: {
            icon: WifiOff,
            color: 'text-muted-foreground',
            label: 'Mất kết nối',
        },
        error: {
            icon: WifiOff,
            color: 'text-destructive',
            label: 'Lỗi kết nối',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={cn('flex items-center gap-1.5', className)}>
            <Icon className={cn('w-4 h-4', config.color)} />
            {showLabel && (
                <span className={cn('text-xs', config.color)}>
                    {config.label}
                </span>
            )}
        </div>
    );
}
