import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sparkles } from "lucide-react";

interface CleaningScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CleaningScheduleModal({ isOpen, onClose, onConfirm }: CleaningScheduleModalProps) {
  const [selectedType, setSelectedType] = useState("move-in");
  const [addOns, setAddOns] = useState({
    aircon: false,
    laundry: false,
    trash: false,
  });

  const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

  const cleaningTypes = [
    { id: "move-in", label: "Vệ sinh nhận phòng", price: 900_000 },
    { id: "move-out", label: "Vệ sinh trả phòng", price: 1_000_000 },
    { id: "weekly", label: "Vệ sinh định kỳ", price: 650_000 },
  ];

  const addOnOptions = [
    { id: "aircon", label: "Vệ sinh máy lạnh", price: 250_000 },
    { id: "laundry", label: "Giặt sấy chăn ga", price: 180_000 },
    { id: "trash", label: "Thu gom & xử lý rác", price: 120_000 },
  ];

  const basePrice = cleaningTypes.find((t) => t.id === selectedType)?.price || 0;
  const addOnPrice = Object.entries(addOns).reduce((total, [key, value]) => {
    if (value) {
      const addOn = addOnOptions.find((a) => a.id === key);
      return total + (addOn?.price || 0);
    }
    return total;
  }, 0);
  const totalPrice = basePrice + addOnPrice;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt lịch vệ sinh phòng</DialogTitle>
          <DialogDescription>
            Dịch vụ vệ sinh tổng quát chuyên nghiệp cho phòng hoặc căn hộ của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="cleaning-address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ / Mã phòng
            </Label>
            <Input
              id="cleaning-address"
              placeholder="Ví dụ: Căn A203, The Sun Avenue, Quận 2"
              className="rounded-xl"
            />
          </div>

          {/* Cleaning Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              Loại hình vệ sinh
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {cleaningTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className={`cursor-pointer text-center justify-center py-3 px-2 rounded-xl transition-all ${
                    selectedType === type.id
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs">{type.label}</span>
                    <span className="text-xs opacity-80">{formatCurrency(type.price)}</span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cleaning-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày
              </Label>
              <Input
                id="cleaning-date"
                type="date"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning-time">Khung giờ</Label>
              <select
                id="cleaning-time"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
              >
                <option>08:00 - 11:00</option>
                <option>12:30 - 15:30</option>
                <option>16:00 - 19:00</option>
              </select>
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-3">
            <Label>Dịch vụ bổ sung (tùy chọn)</Label>
            <div className="space-y-2">
              {addOnOptions.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addOn.id}
                      checked={addOns[addOn.id as keyof typeof addOns]}
                      onCheckedChange={(checked) =>
                        setAddOns({ ...addOns, [addOn.id]: checked === true })
                      }
                    />
                    <label
                      htmlFor={addOn.id}
                      className="text-sm cursor-pointer"
                  >
                    {addOn.label}
                  </label>
                </div>
                  <span className="text-sm text-gray-600">+{formatCurrency(addOn.price)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-5 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Gói vệ sinh chính</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            {addOnPrice > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dịch vụ bổ sung</span>
                <span>+{formatCurrency(addOnPrice)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tổng cộng</span>
                <span className="text-2xl text-primary">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Student Discount */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-sm text-amber-800">
              🎓 Giảm 15% cho sinh viên sẽ được áp dụng khi thanh toán
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
              className="flex-1 bg-primary hover:bg-primary/90 rounded-full h-12"
            >
              Xác nhận đặt lịch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
