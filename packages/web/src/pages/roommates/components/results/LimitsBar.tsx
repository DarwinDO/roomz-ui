/**
 * LimitsBar - Display remaining daily limits for free users
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Send, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router';
import { UPGRADE_SOURCES } from '@roomz/shared/constants/tracking';

interface LimitsBarProps {
    limits: {
        views: number;
        requests: number;
        viewLimit: number;
        requestLimit: number;
    };
    isPremium?: boolean;
    onUpgrade?: () => void;
}

export function LimitsBar({ limits, isPremium = false, onUpgrade }: LimitsBarProps) {
    const navigate = useNavigate();

    // Don't show for premium users
    if (isPremium) {
        return null;
    }

    const viewPercentage = (limits.views / limits.viewLimit) * 100;
    const requestPercentage = (limits.requests / limits.requestLimit) * 100;

    const isViewsLow = limits.views <= 2;
    const isRequestsLow = limits.requests <= 1;
    const isAnyLow = isViewsLow || isRequestsLow;

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            navigate(`/payment?source=${UPGRADE_SOURCES.CONTEXTUAL_HINT}`);
        }
    };

    return (
        <Card className={cn(
            'p-4 mb-6 transition-colors',
            isAnyLow
                ? 'bg-amber-50 border-amber-200'
                : 'bg-muted/30 border-muted'
        )}>
            <div className="flex items-center justify-between gap-6">
                {/* Views */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Eye className={cn('w-4 h-4', isViewsLow ? 'text-amber-600' : 'text-muted-foreground')} />
                            <span className="text-sm font-medium">Lượt xem profile</span>
                        </div>
                        <span className={cn(
                            'text-sm font-semibold',
                            isViewsLow ? 'text-amber-600' : 'text-muted-foreground'
                        )}>
                            {limits.views}/{limits.viewLimit}
                        </span>
                    </div>
                    <Progress
                        value={viewPercentage}
                        className={cn(
                            'h-2',
                            isViewsLow && '[&>div]:bg-amber-500'
                        )}
                    />
                </div>

                {/* Requests */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Send className={cn('w-4 h-4', isRequestsLow ? 'text-amber-600' : 'text-muted-foreground')} />
                            <span className="text-sm font-medium">Yêu cầu kết nối</span>
                        </div>
                        <span className={cn(
                            'text-sm font-semibold',
                            isRequestsLow ? 'text-amber-600' : 'text-muted-foreground'
                        )}>
                            {limits.requests}/{limits.requestLimit}
                        </span>
                    </div>
                    <Progress
                        value={requestPercentage}
                        className={cn(
                            'h-2',
                            isRequestsLow && '[&>div]:bg-amber-500'
                        )}
                    />
                </div>

                {/* Upgrade Button */}
                <Button
                    variant={isAnyLow ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleUpgrade}
                    className={cn(
                        'flex-shrink-0',
                        isAnyLow && 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    )}
                >
                    <Crown className="w-4 h-4 mr-2" />
                    Nâng cấp Premium
                </Button>
            </div>

            {/* Low limit warning */}
            {(limits.views === 0 || limits.requests === 0) && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                        <Sparkles className="w-4 h-4" />
                        <span>
                            {limits.views === 0 && limits.requests === 0
                                ? 'Bạn đã hết lượt hôm nay. Quay lại vào ngày mai hoặc nâng cấp Premium!'
                                : limits.views === 0
                                    ? 'Hết lượt xem profile. Nâng cấp Premium để xem không giới hạn!'
                                    : 'Hết lượt gửi yêu cầu. Nâng cấp Premium để gửi không giới hạn!'}
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
}
