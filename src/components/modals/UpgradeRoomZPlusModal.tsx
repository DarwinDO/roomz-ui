import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Crown, CreditCard, Wallet } from "lucide-react";
import { getRoomZPlusPlan } from "@/services/payments";
import { useNavigate } from "react-router";

interface UpgradeRoomZPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeRoomZPlusModal({
  isOpen,
  onClose,
}: UpgradeRoomZPlusModalProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");

  const roomzPlusPlan = getRoomZPlusPlan();
  const priceDisplay = roomzPlusPlan?.priceDisplay || '49.000đ/tháng';
  const promoPrice = roomzPlusPlan ? Math.floor(roomzPlusPlan.price / 2).toLocaleString('vi-VN') + 'đ' : '24.500đ';

  const handleUpgrade = () => {
    // Navigate to payment page instead of mock processing
    navigate('/payment');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0 text-left [&_[data-slot='dialog-close']]:text-white [&_[data-slot='dialog-close']]:hover:bg-white/10 [&_[data-slot='dialog-close']]:hover:text-white"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          headerRef.current?.focus();
        }}
      >
        <div className="flex-1 overflow-y-auto">
          <div
            ref={headerRef}
            tabIndex={-1}
            className="bg-gradient-to-br from-primary via-primary to-secondary px-6 pt-10 pb-16 text-center text-white focus:outline-none"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Crown className="h-8 w-8" />
            </div>
            <DialogHeader className="space-y-3 text-white">
              <DialogTitle className="text-2xl font-semibold text-white">
                Mở khóa RoomZ+ cao cấp
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Trải nghiệm thuê nhà tốt nhất với lợi ích độc quyền
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="-mt-12 space-y-6 px-6 pb-6">
            <div className="rounded-3xl border border-border bg-background/70 p-6 shadow-sm backdrop-blur">
              <div className="text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-3xl font-semibold text-primary">{roomzPlusPlan ? Math.floor(roomzPlusPlan.price / 1000) + 'k' : '49k'}</span>
                  <span className="text-gray-600">/tháng</span>
                </div>
                <Badge className="border-0 bg-secondary/10 text-secondary">
                  Giảm 50% tháng đầu – Chỉ {promoPrice}!
                </Badge>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Lợi ích cao cấp
                </h3>
                <div className="space-y-3">
                  {roomzPlusPlan?.features.map((benefit: string) => (
                    <div
                      key={benefit}
                      className="flex items-start gap-3 rounded-xl border border-border/60 p-3 transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-foreground/90">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  Phương thức thanh toán
                </h3>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: "card" | "wallet") => setPaymentMethod(value)}
                >
                  <div className="space-y-3">
                    <div
                      className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <RadioGroupItem value="card" id="payment-card" className="mr-3" />
                      <Label htmlFor="payment-card" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              Thẻ tín dụng / Ghi nợ
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Chấp nhận Visa, Mastercard, Amex
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div
                      className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${paymentMethod === "wallet"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => setPaymentMethod("wallet")}
                    >
                      <RadioGroupItem value="wallet" id="payment-wallet" className="mr-3" />
                      <Label htmlFor="payment-wallet" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                            <Wallet className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Ví sinh viên</p>
                            <p className="text-xs text-muted-foreground">Số dư: 2.500.000đ</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
                <strong>Hủy bất cứ lúc nào.</strong> Không cam kết. Bạn có thể hủy đăng ký
                từ cài đặt tài khoản bất cứ lúc nào.
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="h-12 flex-1 rounded-full"
                >
                  Để sau
                </Button>
                <Button
                  onClick={handleUpgrade}
                  className="h-12 flex-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Xác nhận nâng cấp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
