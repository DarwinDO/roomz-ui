import { ArrowRight, Crown, Eye, MapPin, Phone, Send } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRommZPlusPlan } from "@/services/payments";
import { PREMIUM_ROOMMATE_UPSELL_BENEFITS } from "@roomz/shared/constants/premium-offer";
import { UPGRADE_SOURCES } from "@roomz/shared/constants/tracking";

interface LimitHitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: "views" | "requests";
  onUpgrade?: () => void;
}

const BENEFIT_ICONS = [Eye, Send, Phone, MapPin] as const;

export function LimitHitModal({ isOpen, onClose, limitType }: LimitHitModalProps) {
  const navigate = useNavigate();
  const rommzPlusPlan = getRommZPlusPlan();
  const priceDisplay = rommzPlusPlan?.priceDisplay || "39.000đ/tháng";

  const title =
    limitType === "views"
      ? "Đã hết lượt xem profile hôm nay"
      : "Đã hết lượt gửi yêu cầu hôm nay";

  const description =
    limitType === "views"
      ? "Bạn đã dùng hết lượt xem roommate trong hôm nay. RommZ+ sẽ mở khóa hoàn toàn luồng xem hồ sơ này."
      : "Bạn đã dùng hết lượt gửi lời chào hôm nay. RommZ+ sẽ mở khóa hoàn toàn luồng kết nối roommate này.";

  const handleUpgrade = () => {
    navigate(`/payment?source=${UPGRADE_SOURCES.ROOMMATE_LIMIT}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <h4 className="mb-4 text-center font-medium">RommZ+ hiện đang mở khóa:</h4>
          <ul className="space-y-3">
            {PREMIUM_ROOMMATE_UPSELL_BENEFITS.map((benefit, index) => {
              const Icon = BENEFIT_ICONS[index];
              return (
                <li key={benefit} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-sm">{benefit}</span>
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
            <Crown className="mr-2 h-4 w-4" />
            Nâng cấp RommZ+ - {priceDisplay}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button variant="ghost" className="w-full" onClick={onClose}>
            Để sau, quay lại vào ngày mai
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Lượt xem và yêu cầu được reset lúc 00:00 mỗi ngày.
        </p>
      </DialogContent>
    </Dialog>
  );
}
