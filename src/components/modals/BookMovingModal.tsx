import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, DollarSign, Truck, Loader2 } from "lucide-react";
import { useCreateServiceLead } from "@/hooks/useServiceLeads";
import { formatCurrency } from "@/utils/format";

interface BookMovingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookMovingModal({ isOpen, onClose }: BookMovingModalProps) {
  const createServiceLead = useCreateServiceLead();

  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moveTime, setMoveTime] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const estimatedPrice = 3_500_000;
  const discountRate = 0.15;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!pickupAddress.trim()) {
      newErrors.pickupAddress = "Vui lòng nhập địa chỉ lấy đồ";
    }
    if (!destinationAddress.trim()) {
      newErrors.destinationAddress = "Vui lòng nhập địa chỉ đến";
    }
    if (!moveDate) {
      newErrors.moveDate = "Vui lòng chọn ngày chuyển";
    } else {
      const selectedDate = new Date(moveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.moveDate = "Ngày chọn phải là ngày trong tương lai";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;

    try {
      await createServiceLead.mutateAsync({
        service_type: 'moving',
        details: {
          pickup_address: pickupAddress,
          destination_address: destinationAddress,
          preferred_time: moveTime,
          notes: notes,
        },
        preferred_date: moveDate,
      });

      // Reset form
      setPickupAddress("");
      setDestinationAddress("");
      setMoveDate("");
      setMoveTime("");
      setNotes("");
      setErrors({});
      onClose();
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const isLoading = createServiceLead.isPending;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={isLoading ? undefined : onClose}
    >
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
              Địa chỉ lấy đồ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pickup-address"
              placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Quận 1"
              className="rounded-xl"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              disabled={isLoading}
            />
            {errors.pickupAddress && (
              <p className="text-xs text-red-500">{errors.pickupAddress}</p>
            )}
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              Địa chỉ đến <span className="text-red-500">*</span>
            </Label>
            <Input
              id="destination-address"
              placeholder="Ví dụ: 45 Phan Xích Long, Phú Nhuận"
              className="rounded-xl"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              disabled={isLoading}
            />
            {errors.destinationAddress && (
              <p className="text-xs text-red-500">{errors.destinationAddress}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày chuyển <span className="text-red-500">*</span>
              </Label>
              <Input
                id="move-date"
                type="date"
                className="rounded-xl"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                disabled={isLoading}
              />
              {errors.moveDate && (
                <p className="text-xs text-red-500">{errors.moveDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="move-time">Giờ chuyển</Label>
              <Input
                id="move-time"
                type="time"
                className="rounded-xl"
                value={moveTime}
                onChange={(e) => setMoveTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú thêm</Label>
            <Input
              id="notes"
              placeholder="Ví dụ: Cần thang máy, đồ dễ vỡ..."
              className="rounded-xl"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
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
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận đặt dịch vụ"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
