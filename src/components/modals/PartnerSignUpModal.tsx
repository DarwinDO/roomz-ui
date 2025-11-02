import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Mail, MapPin, Phone, Users } from "lucide-react";

interface PartnerSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

interface PartnerFormState {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: string;
  notes: string;
}

const initialFormState: PartnerFormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  serviceArea: "",
  notes: "",
};

export function PartnerSignUpModal({ isOpen, onClose, onSubmit }: PartnerSignUpModalProps) {
  const [formState, setFormState] = useState<PartnerFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field: keyof PartnerFormState) => (value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetAndClose = () => {
    setFormState(initialFormState);
    setIsSubmitting(false);
    setIsSubmitted(false);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate async submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      onSubmit?.();
    }, 1500);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetAndClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden p-0 [&_[data-slot='dialog-close']]:text-white [&_[data-slot='dialog-close']]:hover:bg-white/10">
        <div className="bg-gradient-to-r from-primary to-secondary px-6 pb-16 pt-10 text-white">
          <DialogHeader className="space-y-3 text-white">
            <DialogTitle className="text-2xl font-semibold text-white">
              Đăng ký đối tác RoomZ
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Kết nối với mạng lưới sinh viên và khách thuê trên toàn quốc
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Users className="mr-2 h-4 w-4" />
              50.000+ người dùng RoomZ
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Chỉ 3 bước xét duyệt
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <MapPin className="mr-2 h-4 w-4" />
              Phủ khắp 20+ tỉnh thành
            </Badge>
          </div>
        </div>

        <div className="-mt-12 space-y-6 px-6 pb-6">
          {isSubmitted ? (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-green-700">
                Đã nhận thông tin đăng ký
              </h3>
              <p className="text-sm text-green-700/80">
                Đội ngũ RoomZ sẽ liên hệ với bạn trong 1-2 ngày làm việc để hoàn tất quy
                trình xác thực đối tác.
              </p>
              <Button onClick={resetAndClose} className="mt-6 rounded-full">
                Đóng
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border bg-background/70 p-6 shadow-sm backdrop-blur"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="companyName">Tên doanh nghiệp / đội nhóm</Label>
                  <Input
                    id="companyName"
                    placeholder="Ví dụ: CleanMaster Services"
                    required
                    value={formState.companyName}
                    onChange={(event) => handleChange("companyName")(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Người liên hệ</Label>
                  <Input
                    id="contactName"
                    placeholder="Nguyễn Văn A"
                    required
                    value={formState.contactName}
                    onChange={(event) => handleChange("contactName")(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    placeholder="09xx xxx xxx"
                    required
                    value={formState.phone}
                    onChange={(event) => handleChange("phone")(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      placeholder="contact@roomz-partner.com"
                      required
                      value={formState.email}
                      onChange={(event) => handleChange("email")(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea">Khu vực hoạt động chính</Label>
                  <Input
                    id="serviceArea"
                    placeholder="TP.HCM, Quận 1, Quận 7..."
                    required
                    value={formState.serviceArea}
                    onChange={(event) => handleChange("serviceArea")(event.target.value)}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">
                    Giới thiệu ngắn gọn về dịch vụ của bạn
                  </Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Mô tả dịch vụ, ưu đãi dành cho sinh viên, thời gian hoạt động..."
                    value={formState.notes}
                    onChange={(event) => handleChange("notes")(event.target.value)}
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 text-primary" />
                  <p>
                    Sau khi gửi thông tin, đội ngũ RoomZ sẽ gọi xác nhận trong vòng 24
                    giờ làm việc.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={resetAndClose}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi đăng ký"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PartnerSignUpModal as PartnerSignupModal };
