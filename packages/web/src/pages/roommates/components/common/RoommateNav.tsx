/**
 * RoommateNav - Navigation bar for roommate pages
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Inbox,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoommateRequestsQuery } from '@/hooks/useRoommatesQuery';

const NAV_ITEMS = [
    { path: '/roommates', label: 'Tìm kiếm', icon: Users },
    { path: '/roommates/requests', label: 'Yêu cầu', icon: Inbox, showBadge: true },
    { path: '/roommates/profile', label: 'Profile', icon: User },
];

export function RoommateNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { pendingCount } = useRoommateRequestsQuery();

    return (
        <div className="flex items-center gap-1 rounded-full border border-outline-variant/20 bg-white/90 p-1.5 shadow-sm backdrop-blur-xl">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                    <Button
                        key={item.path}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                            'relative gap-2 rounded-full px-4',
                            isActive && 'bg-primary text-white shadow-sm hover:bg-primary/95',
                            !isActive && 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                        )}
                        onClick={() => navigate(item.path)}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                        {item.showBadge && pendingCount > 0 && (
                            <Badge
                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
                                variant="destructive"
                            >
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                );
            })}
        </div>
    );
}
