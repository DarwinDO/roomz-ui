import { Crown, Heart, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRommZPlusPlan } from "@/services/payments";
import {
  PREMIUM_PUBLIC_BENEFITS,
  type PremiumPublicBenefit,
} from "@roomz/shared/constants/premium-offer";

interface UpgradeBannerProps {
  onUpgrade?: () => void;
  isPremium?: boolean | null;
}

const BENEFIT_ICONS: Record<PremiumPublicBenefit["id"], typeof Phone> = {
  phone_views: Phone,
  favorites: Heart,
  roommate_access: Users,
  local_passport_deals: MapPin,
  premium_badge: Crown,
};

export function UpgradeBanner({ onUpgrade, isPremium }: UpgradeBannerProps) {
  const navigate = useNavigate();
  const rommzPlusPlan = getRommZPlusPlan();
  const priceDisplay = rommzPlusPlan?.priceDisplay || "39.000đ/tháng";

  const handleOpenPayment = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    navigate("/payment");
  };

  if (isPremium) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <Card className="rounded-[28px] border border-amber-200/80 bg-[linear-gradient(135deg,#fff5d6_0%,#fff1df_50%,#ffffff_100%)] p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)]">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                  Premium active
                </p>
                <h3 className="mt-1 text-lg text-amber-950">RommZ+ đang hoạt động</h3>
                <p className="text-sm text-amber-800">
                  Bạn vẫn có thể mở trang gói để đối chiếu quyền lợi, giá và trạng thái hiện tại.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="rounded-full border-amber-200 bg-amber-100 text-amber-800">
                Active
              </Badge>
              <Button
                variant="outline"
                className="rounded-full border-amber-300 bg-white text-amber-950"
                onClick={() => navigate("/payment")}
              >
                Xem gói của bạn
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
      <Card className="rounded-[28px] border border-warning/20 bg-[linear-gradient(135deg,#fff7e5_0%,#fffdf9_48%,#ffffff_100%)] p-6 shadow-soft">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#f97316_100%)]">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Upgrade path
              </p>
              <h3 className="mt-2 text-2xl text-foreground">Mở thêm quyền lợi trong RommZ+</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-7 text-muted-foreground">
                Gói premium dành cho lúc bạn cần xem sâu hơn, liên hệ nhanh hơn và dùng thêm
                các lớp đặc quyền quanh quá trình tìm và chốt nơi ở.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {PREMIUM_PUBLIC_BENEFITS.slice(0, 4).map((benefit) => {
                const Icon = BENEFIT_ICONS[benefit.id];
                return (
                  <div
                    key={benefit.id}
                    className="rounded-[22px] border border-border/70 bg-card/80 px-4 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-foreground">{benefit.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Giá hiện tại
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{priceDisplay}</p>
              </div>
              <Button
                onClick={handleOpenPayment}
                className="rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)] text-white hover:opacity-95"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Nâng cấp ngay
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
