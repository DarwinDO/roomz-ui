import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Phone, Heart, Users, Star, MapPin, Zap, Shield, Headphones } from "lucide-react";
import { getRommZPlusPlan } from "@/services/payments";
import { useNavigate } from "react-router";

interface UpgradeBannerProps {
    onUpgrade?: () => void;
    isPremium?: boolean | null;
}

const ROMMZ_PLUS_FEATURES = [
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
    const rommzPlusPlan = getRommZPlusPlan();
    const priceDisplay = rommzPlusPlan?.priceDisplay || '49.000đ/tháng';

    // Show active status card for premium users
    if (isPremium) {
        return (
            <div className="px-6 py-4 max-w-6xl mx-auto">
                <Card className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-medium text-amber-900">RommZ+ Premium</h4>
                                <p className="text-sm text-amber-700">Đang hoạt động</p>
                            </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">Active</Badge>
                    </div>
                </Card>
            </div>
        );
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
                        <h3 className="mb-1">Nâng cấp lên RommZ+</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Trải nghiệm thuê nhà tốt nhất với {rommzPlusPlan?.price?.toLocaleString('vi-VN')}đ/tháng
                        </p>
                        <ul className="space-y-1 mb-4 text-sm">
                            {ROMMZ_PLUS_FEATURES.slice(0, 3).map((feature, i) => {
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
