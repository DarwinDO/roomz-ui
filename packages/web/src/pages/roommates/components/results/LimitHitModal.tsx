/**
 * LimitHitModal - Modal shown when user hits daily limit
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Eye, Send, Check, ArrowRight } from 'lucide-react';
import { getRoomZPlusPlan } from '@/services/payments';
import { useNavigate } from 'react-router';
import { UPGRADE_SOURCES } from '@roomz/shared/constants/tracking';

interface LimitHitModalProps {
    isOpen: boolean;
    onClose: () => void;
    limitType: 'views' | 'requests';
    onUpgrade?: () => void;
}

const PREMIUM_BENEFITS = [
    { icon: Eye, text: 'Xem không giới hạn profile' },
    { icon: Send, text: 'Gửi không giới hạn yêu cầu kết nối' },
    { icon: Sparkles, text: 'Ưu tiên hiển thị trong kết quả tìm kiếm' },
    { icon: Check, text: 'Xem ai đã xem profile của bạn' },
];

export function LimitHitModal({
    isOpen,
    onClose,
    limitType,
}: LimitHitModalProps) {
    const navigate = useNavigate();
    const roomzPlusPlan = getRoomZPlusPlan();
    const priceDisplay = roomzPlusPlan?.priceDisplay || '49.000đ/tháng';

    const title = limitType === 'views'
        ? 'Đã hết lượt xem profile hôm nay'
        : 'Đã hết lượt gửi yêu cầu hôm nay';

    const description = limitType === 'views'
        ? 'Bạn đã xem tối đa 10 profile trong ngày. Nâng cấp Premium để xem không giới hạn!'
        : 'Bạn đã gửi tối đa 5 yêu cầu trong ngày. Nâng cấp Premium để gửi không giới hạn!';

    const handleUpgrade = () => {
        navigate(`/payment?source=${UPGRADE_SOURCES.FAVORITES_LIMIT}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <h4 className="font-medium mb-4 text-center">Quyền lợi Premium:</h4>
                    <ul className="space-y-3">
                        {PREMIUM_BENEFITS.map((benefit, i) => {
                            const Icon = benefit.icon;
                            return (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-sm">{benefit.text}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="space-y-3">
                    <Button
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        size="lg"
                        onClick={handleUpgrade}
                    >
                        <Crown className="w-4 h-4 mr-2" />
                        Nâng cấp Premium - {priceDisplay}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={onClose}
                    >
                        Để sau, quay lại vào ngày mai
                    </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Lượt xem và yêu cầu được reset lúc 00:00 mỗi ngày
                </p>
            </DialogContent>
        </Dialog>
    );
}
