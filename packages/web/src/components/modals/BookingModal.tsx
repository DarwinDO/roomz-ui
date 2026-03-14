import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, DollarSign, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { formatCurrencyShort } from "@roomz/shared/utils/format";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subletInfo: {
    title: string;
    price: number;
    location: string;
    duration: string;
  };
}

export function BookingModal({ isOpen, onClose, onConfirm, subletInfo }: BookingModalProps) {
  const [depositAmount] = useState(subletInfo.price);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt chỗ cho phòng</DialogTitle>
          <DialogDescription>
            Điền thông tin để xác nhận đặt chỗ. Host sẽ liên hệ lại với bạn trong vòng 24 giờ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
            <h4 className="mb-2 font-medium">{subletInfo.title}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📍 {subletInfo.location}</p>
              <p>📅 {subletInfo.duration}</p>
              <div className="flex items-center gap-2 pt-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-lg font-medium text-primary">
                  {formatCurrencyShort(subletInfo.price)}/tháng
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Thông tin liên hệ</h4>

            <div className="space-y-2">
              <Label htmlFor="fullname" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Họ và tên
              </Label>
              <Input id="fullname" placeholder="Nguyễn Văn A" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Số điện thoại
              </Label>
              <Input id="phone" type="tel" placeholder="0912345678" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </Label>
              <Input id="email" type="email" placeholder="example@email.com" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-in-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Ngày dự kiến chuyển vào
              </Label>
              <Input id="move-in-date" type="date" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-out-date">Ngày dự kiến chuyển đi</Label>
              <Input id="move-out-date" type="date" className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Lời nhắn cho host (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Giới thiệu bản thân, lý do thuê phòng, câu hỏi thêm..."
              className="min-h-24 rounded-xl"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                💰
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Đặt cọc</p>
                <p className="text-xs text-gray-600">
                  Tiền cọc thường bằng 1 tháng tiền thuê ({formatCurrencyShort(depositAmount)}) và sẽ được
                  hoàn trả khi kết thúc hợp đồng.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 p-4">
            <p className="text-sm font-medium">Quy trình đặt chỗ:</p>
            <div className="space-y-2">
              {[
                "Bước 1: Điền thông tin và gửi yêu cầu đặt chỗ",
                "Bước 2: Host xem xét và liên hệ lại trong 24h",
                "Bước 3: Hẹn xem phòng trực tiếp và ký hợp đồng",
                "Bước 4: Thanh toán tiền cọc và nhận chìa khóa",
              ].map((step) => (
                <div key={step} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs text-gray-700">
              <strong>Lưu ý an toàn:</strong> Luôn xem phòng trực tiếp và kiểm tra giấy tờ
              host trước khi thanh toán bất kỳ khoản tiền nào.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-full h-12">
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 rounded-full h-12 bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Xác nhận đặt chỗ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
