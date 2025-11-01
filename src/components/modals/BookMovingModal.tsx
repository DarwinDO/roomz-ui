import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, DollarSign, Truck } from "lucide-react";

interface BookMovingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BookMovingModal({ isOpen, onClose, onConfirm }: BookMovingModalProps) {
  const [estimatedPrice] = useState(3_500_000);
  const discountRate = 0.15;

  const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt dịch vụ chuyển phòng</DialogTitle>
          <DialogDescription>
            Đội ngũ chuyển nhà chuyên nghiệp hỗ trợ bạn dọn phòng an toàn, nhanh chóng
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Pickup Address */}
          <div className="space-y-2">
            <Label htmlFor="pickup-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ lấy đồ
            </Label>
            <Input
              id="pickup-address"
              placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Quận 1"
              className="rounded-xl"
            />
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              Địa chỉ đến
            </Label>
            <Input
              id="destination-address"
              placeholder="Ví dụ: 45 Phan Xích Long, Phú Nhuận"
              className="rounded-xl"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày chuyển
              </Label>
              <Input
                id="move-date"
                type="date"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-time">Giờ chuyển</Label>
              <Input
                id="move-time"
                type="time"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Estimated Price */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chi phí ước tính</p>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-600">Gói chuyển phòng tiêu chuẩn (2 nhân sự)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-2xl text-primary">{formatCurrency(estimatedPrice)}</span>
                </div>
                <p className="text-xs text-gray-500">Giá gốc tham khảo</p>
              </div>
            </div>
          </div>

          {/* Discount Badge */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              🎓
            </div>
            <div className="flex-1">
              <p className="text-sm">Đã áp dụng ưu đãi sinh viên</p>
              <p className="text-xs text-gray-600">Giảm 15% cho đơn đặt dịch vụ</p>
            </div>
            <span className="text-amber-700">-{formatCurrency(Math.round(estimatedPrice * discountRate))}</span>
          </div>

          {/* Final Price */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng thanh toán</span>
              <span className="text-xl text-primary">{formatCurrency(Math.round(estimatedPrice * (1 - discountRate)))}</span>
            </div>
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
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Xác nhận đặt dịch vụ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
