/**
 * VisibilityToggle - 3-state profile visibility control
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Eye,
    EyeOff,
    Heart,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoommateProfileStatus } from '@/services/roommates';

interface VisibilityToggleProps {
    status: RoommateProfileStatus;
    onStatusChange: (status: RoommateProfileStatus) => Promise<void>;
    compact?: boolean;
}

const STATUS_CONFIG = {
    looking: {
        label: 'Đang tìm',
        description: 'Profile hiển thị trong tìm kiếm',
        icon: Eye,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
    },
    paused: {
        label: 'Tạm dừng',
        description: 'Profile bị ẩn tạm thời',
        icon: EyeOff,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
    },
    found: {
        label: 'Đã tìm được',
        description: 'Đã tìm được bạn cùng phòng',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
    },
};

export function VisibilityToggle({
    status,
    onStatusChange,
    compact = false,
}: VisibilityToggleProps) {
    const [loading, setLoading] = useState(false);
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    const handleChange = async (newStatus: RoommateProfileStatus) => {
        if (newStatus === status) return;
        setLoading(true);
        try {
            await onStatusChange(newStatus);
        } finally {
            setLoading(false);
        }
    };

    if (compact) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn('gap-2', config.borderColor)}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Icon className={cn('w-4 h-4', config.color)} />
                        )}
                        <span className={config.color}>{config.label}</span>
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {(Object.keys(STATUS_CONFIG) as RoommateProfileStatus[]).map((key) => {
                        const itemConfig = STATUS_CONFIG[key];
                        const ItemIcon = itemConfig.icon;
                        return (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => handleChange(key)}
                                className={cn(
                                    'gap-2',
                                    status === key && 'bg-muted'
                                )}
                            >
                                <ItemIcon className={cn('w-4 h-4', itemConfig.color)} />
                                <div>
                                    <p className="font-medium">{itemConfig.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {itemConfig.description}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Card className={cn('p-4', config.bgColor, config.borderColor)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        config.bgColor
                    )}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                    </div>
                    <div>
                        <p className={cn('font-semibold', config.color)}>
                            {config.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {config.description}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Thay đổi
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {(Object.keys(STATUS_CONFIG) as RoommateProfileStatus[]).map((key) => {
                            const itemConfig = STATUS_CONFIG[key];
                            const ItemIcon = itemConfig.icon;
                            return (
                                <DropdownMenuItem
                                    key={key}
                                    onClick={() => handleChange(key)}
                                    className={cn(
                                        'gap-2',
                                        status === key && 'bg-muted'
                                    )}
                                >
                                    <ItemIcon className={cn('w-4 h-4', itemConfig.color)} />
                                    <span>{itemConfig.label}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    );
}
