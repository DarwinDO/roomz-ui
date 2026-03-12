import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRommZPlusPlan } from '@/services/payments';
import {
  PREMIUM_PUBLIC_BENEFITS,
  type PremiumPublicBenefit,
} from '@roomz/shared/constants/premium-offer';
import { Crown, Heart, MapPin, Phone, Users } from 'lucide-react';
import { useNavigate } from 'react-router';

interface UpgradeBannerProps {
  onUpgrade?: () => void;
  isPremium?: boolean | null;
}

const BENEFIT_ICONS: Record<PremiumPublicBenefit['id'], typeof Phone> = {
  phone_views: Phone,
  favorites: Heart,
  roommate_access: Users,
  local_passport_deals: MapPin,
  premium_badge: Crown,
};

export function UpgradeBanner({ onUpgrade, isPremium }: UpgradeBannerProps) {
  const navigate = useNavigate();
  const rommzPlusPlan = getRommZPlusPlan();
  const priceDisplay = rommzPlusPlan?.priceDisplay || '49.000đ/tháng';

  if (isPremium) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-4">
        <Card className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900">RommZ+ Premium</h4>
                <p className="text-sm text-amber-700">Đang hoạt động</p>
              </div>
            </div>
            <Badge className="border-amber-200 bg-amber-100 text-amber-800">Active</Badge>
          </div>
        </Card>
      </div>
    );
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    navigate('/payment');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Card className="rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warning to-warning/80">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1">Nâng cấp lên RommZ+</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Mở khóa các quyền lợi roommate, contact và deal premium với{' '}
              {rommzPlusPlan?.price?.toLocaleString('vi-VN')}đ/tháng.
            </p>
            <ul className="mb-4 space-y-1 text-sm">
              {PREMIUM_PUBLIC_BENEFITS.slice(0, 4).map((benefit) => {
                const Icon = BENEFIT_ICONS[benefit.id];
                return (
                  <li key={benefit.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-warning" />
                    {benefit.label}
                  </li>
                );
              })}
            </ul>
            <Button
              onClick={handleUpgrade}
              className="rounded-xl bg-gradient-to-r from-warning to-warning/80 text-white hover:from-warning/90 hover:to-warning/70"
            >
              Nâng cấp ngay - {priceDisplay}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
