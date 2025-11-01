import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, Phone, Mail, DollarSign, CheckCircle2 } from "lucide-react";

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

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}tr`;
    }
    return `${Math.round(value / 1_000)}k`;
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt chỗ cho phòng</DialogTitle>
          <DialogDescription>
            Điền thông tin để xác nhận đặt chỗ. Chủ nhà sẽ liên hệ lại với bạn trong vòng 24 giờ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Room Info Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <h4 className="mb-2">{subletInfo.title}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📍 {subletInfo.location}</p>
              <p>📅 {subletInfo.duration}</p>
              <div className="flex items-center gap-2 pt-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-lg text-primary font-medium">
                  {formatCurrency(subletInfo.price)}/tháng
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Thông tin liên hệ</h4>
            
            <div className="space-y-2">
              <Label htmlFor="fullname" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Họ và tên
              </Label>
              <Input
                id="fullname"
                placeholder="Nguyễn Văn A"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0912345678"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Move-in Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-in-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày dự kiến chuyển vào
              </Label>
              <Input
                id="move-in-date"
                type="date"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-out-date">Ngày dự kiến chuyển đi</Label>
              <Input
                id="move-out-date"
                type="date"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Lời nhắn cho chủ nhà (tùy chọn)</Label>
            <Textarea
              id="message"
              placeholder="Giới thiệu bản thân, lý do thuê phòng, câu hỏi thêm..."
              className="rounded-xl min-h-24"
            />
          </div>

          {/* Deposit Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                💰
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Đặt cọc</p>
                <p className="text-xs text-gray-600">
                  Tiền cọc thường bằng 1 tháng tiền thuê ({formatCurrency(depositAmount)}) và sẽ được 
                  hoàn trả khi kết thúc hợp đồng.
                </p>
              </div>
            </div>
          </div>

          {/* Booking Steps */}
          <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium mb-2">Quy trình đặt chỗ:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Bước 1: Điền thông tin và gửi yêu cầu đặt chỗ</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Bước 2: Chủ nhà xem xét và liên hệ lại trong 24h</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Bước 3: Hẹn xem phòng trực tiếp và ký hợp đồng</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>Bước 4: Thanh toán tiền cọc và nhận chìa khóa</span>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs text-gray-700">
              ⚠️ <strong>Lưu ý an toàn:</strong> Luôn xem phòng trực tiếp và kiểm tra giấy tờ 
              chủ nhà trước khi thanh toán bất kỳ khoản tiền nào.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-full h-12"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-white"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Xác nhận đặt chỗ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

