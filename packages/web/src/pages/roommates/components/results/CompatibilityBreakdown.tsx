/**
 * CompatibilityBreakdown - Modal showing detailed score breakdown
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
    Moon,
    Sparkles,
    Volume2,
    Users,
    Coffee,
    Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
    sleep_score: number;
    cleanliness_score: number;
    noise_score: number;
    guest_score: number;
    weekend_score: number;
    budget_score: number;
}

interface CompatibilityBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
    userB: string;
    totalScore: number;
    breakdown: ScoreBreakdown;
}

const SCORE_ITEMS = [
    {
        key: 'sleep_score',
        label: 'Lịch ngủ',
        description: 'Thời gian ngủ và thức dậy',
        icon: Moon,
        weight: 25,
    },
    {
        key: 'cleanliness_score',
        label: 'Mức độ ngăn nắp',
        description: 'Tiêu chuẩn vệ sinh và gọn gàng',
        icon: Sparkles,
        weight: 20,
    },
    {
        key: 'noise_score',
        label: 'Độ chịu tiếng ồn',
        description: 'Mức độ yên tĩnh mong muốn',
        icon: Volume2,
        weight: 20,
    },
    {
        key: 'guest_score',
        label: 'Tần suất khách',
        description: 'Thường mời khách về phòng',
        icon: Users,
        weight: 15,
    },
    {
        key: 'weekend_score',
        label: 'Hoạt động cuối tuần',
        description: 'Ở nhà hay đi chơi',
        icon: Coffee,
        weight: 10,
    },
    {
        key: 'budget_score',
        label: 'Ngân sách',
        description: 'Mức chi tiêu tương đồng',
        icon: Wallet,
        weight: 10,
    },
];

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
}

function getProgressColor(score: number): string {
    if (score >= 80) return '[&>div]:bg-green-500';
    if (score >= 60) return '[&>div]:bg-yellow-500';
    if (score >= 40) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
}

export function CompatibilityBreakdown({
    isOpen,
    onClose,
    userB,
    totalScore,
    breakdown,
}: CompatibilityBreakdownProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Độ phù hợp chi tiết</span>
                        <span className={cn(
                            'text-2xl font-bold',
                            getScoreColor(totalScore)
                        )}>
                            {totalScore}%
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        Phân tích chi tiết mức độ phù hợp giữa bạn và {userB}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {SCORE_ITEMS.map((item) => {
                        const score = breakdown[item.key as keyof ScoreBreakdown];
                        const Icon = item.icon;

                        return (
                            <div key={item.key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn('w-4 h-4', getScoreColor(score))} />
                                        <span className="font-medium text-sm">{item.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({item.weight}%)
                                        </span>
                                    </div>
                                    <span className={cn('font-semibold', getScoreColor(score))}>
                                        {score}%
                                    </span>
                                </div>
                                <Progress
                                    value={score}
                                    className={cn('h-2', getProgressColor(score))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Công thức tính điểm:</span>
                        <span className="font-mono text-xs">
                            Σ(score × weight) / 100
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Điểm càng cao = lối sống càng tương đồng. Điểm &gt;70% được xem là phù hợp tốt.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
