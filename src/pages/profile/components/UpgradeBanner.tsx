import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Phone, Heart, Users, Star, MapPin, Zap, Shield, Headphones } from "lucide-react";
import { getRoomZPlusPlan } from "@/services/payments";
import { useNavigate } from "react-router";

interface UpgradeBannerProps {
    onUpgrade?: () => void;
    isPremium?: boolean | null;
}

const ROOMZ_PLUS_FEATURES = [
    { icon: Phone, text: 'Xem SĐT không giới hạn' },
    { icon: Heart, text: 'Lưu phòng yêu thích không giới hạn' },
    { icon: Users, text: 'Roommate views & requests không giới hạn' },
    { icon: Star, text: 'Badge premium trên profile' },
    { icon: MapPin, text: 'Deal độc quyền Local Passport' },
    { icon: Zap, text: 'Ưu tiên hiển thị' },
    { icon: Shield, text: 'Duyệt xác thực nhanh' },
    { icon: Headphones, text: 'Hỗ trợ ưu tiên 24/7' },
];

export function UpgradeBanner({ onUpgrade, isPremium }: UpgradeBannerProps) {
    const navigate = useNavigate();
    const roomzPlusPlan = getRoomZPlusPlan();
    const priceDisplay = roomzPlusPlan?.priceDisplay || '49.000đ/tháng';

    // Don't render if user is already premium
    if (isPremium) {
        return null;
    }

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            navigate('/payment');
        }
    };

    return (
        <div className="px-6 py-6 max-w-6xl mx-auto">
            <Card className="p-6 rounded-2xl bg-gradient-to-br from-warning/5 to-warning/10 border border-warning/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-2xl flex items-center justify-center shrink-0">
                        <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-1">Nâng cấp lên RoomZ+</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Trải nghiệm thuê nhà tốt nhất với {roomzPlusPlan?.price?.toLocaleString('vi-VN')}đ/tháng
                        </p>
                        <ul className="space-y-1 mb-4 text-sm">
                            {ROOMZ_PLUS_FEATURES.slice(0, 3).map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <li key={i} className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-warning" />
                                        {feature.text}
                                    </li>
                                );
                            })}
                        </ul>
                        <Button
                            onClick={handleUpgrade}
                            className="bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-white rounded-xl">
                            Nâng cấp ngay - {priceDisplay}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
