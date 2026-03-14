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
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                    <Button
                        key={item.path}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                            'gap-2 relative',
                            isActive && 'bg-primary text-primary-foreground shadow-sm',
                            !isActive && 'text-foreground hover:bg-muted'
                        )}
                        onClick={() => navigate(item.path)}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.label}</span>
                        {item.showBadge && pendingCount > 0 && (
                            <Badge
                                className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center"
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
