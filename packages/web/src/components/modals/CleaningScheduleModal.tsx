import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sparkles, Loader2 } from "lucide-react";
import { useCreateServiceLead } from "@/hooks/useServiceLeads";
import { formatCurrency } from "@roomz/shared/utils/format";

interface CleaningScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CleaningScheduleModal({ isOpen, onClose }: CleaningScheduleModalProps) {
  const createServiceLead = useCreateServiceLead();

  const [address, setAddress] = useState("");
  const [selectedType, setSelectedType] = useState("move_in");
  const [cleaningDate, setCleaningDate] = useState("");
  const [cleaningTime, setCleaningTime] = useState("08:00");
  const [numRooms, setNumRooms] = useState(1);
  const [numBathrooms, setNumBathrooms] = useState(1);
  const [addOns, setAddOns] = useState({
    aircon: false,
    laundry: false,
    trash: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const cleaningTypes = [
    { id: "move_in", label: "Vệ sinh nhận phòng", price: 900_000 },
    { id: "move_out", label: "Vệ sinh trả phòng", price: 1_000_000 },
    { id: "basic", label: "Vệ sinh cơ bản", price: 650_000 },
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ";
    }
    if (!cleaningDate) {
      newErrors.cleaningDate = "Vui lòng chọn ngày";
    } else {
      const selectedDate = new Date(cleaningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.cleaningDate = "Ngày chọn phải là ngày trong tương lai";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;

    try {
      await createServiceLead.mutateAsync({
        service_type: 'cleaning',
        details: {
          address: address,
          cleaning_type: selectedType,
          num_rooms: numRooms,
          num_bathrooms: numBathrooms,
          preferred_time: cleaningTime,
          add_ons: Object.entries(addOns)
            .filter(([, value]) => value)
            .map(([key]) => key),
        },
        preferred_date: cleaningDate,
      });

      // Reset form
      setAddress("");
      setSelectedType("move_in");
      setCleaningDate("");
      setCleaningTime("08:00");
      setNumRooms(1);
      setNumBathrooms(1);
      setAddOns({ aircon: false, laundry: false, trash: false });
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
              Địa chỉ / Mã phòng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cleaning-address"
              placeholder="Ví dụ: Căn A203, The Sun Avenue, Quận 2"
              className="rounded-xl"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address}</p>
            )}
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
                  className={`cursor-pointer text-center justify-center py-3 px-2 rounded-xl transition-all ${selectedType === type.id
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

          {/* Number of rooms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num-rooms">Số phòng</Label>
              <Input
                id="num-rooms"
                type="number"
                min={1}
                max={10}
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value, 10) || 1)}
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-bathrooms">Số toilet</Label>
              <Input
                id="num-bathrooms"
                type="number"
                min={1}
                max={5}
                value={numBathrooms}
                onChange={(e) => setNumBathrooms(parseInt(e.target.value, 10) || 1)}
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cleaning-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Ngày <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cleaning-date"
                type="date"
                className="rounded-xl"
                value={cleaningDate}
                onChange={(e) => setCleaningDate(e.target.value)}
                disabled={isLoading}
              />
              {errors.cleaningDate && (
                <p className="text-xs text-red-500">{errors.cleaningDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning-time">Khung giờ</Label>
              <select
                id="cleaning-time"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                value={cleaningTime}
                onChange={(e) => setCleaningTime(e.target.value)}
                disabled={isLoading}
              >
                <option value="08:00">08:00 - 11:00</option>
                <option value="12:30">12:30 - 15:30</option>
                <option value="16:00">16:00 - 19:00</option>
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
                      disabled={isLoading}
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
                "Xác nhận đặt lịch"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
