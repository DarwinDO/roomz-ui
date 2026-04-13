import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  Truck,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateServiceLead } from "@/hooks/useServiceLeads";
import { formatCurrency } from "@roomz/shared/utils/format";
import {
  calculateFinalPrice,
  calculateMovingEstimate,
  calculateStudentDiscount,
  MOVING_ITEM_OPTIONS,
  type MovingItemId,
} from "./serviceBookingPricing";

interface BookMovingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId?: string;
  partnerName?: string | null;
}

export function BookMovingModal({
  isOpen,
  onClose,
  partnerId,
  partnerName,
}: BookMovingModalProps) {
  const { profile } = useAuth();
  const createServiceLead = useCreateServiceLead();

  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moveTime, setMoveTime] = useState("08:00");
  const [floorPickup, setFloorPickup] = useState(1);
  const [floorDestination, setFloorDestination] = useState(1);
  const [hasElevatorPickup, setHasElevatorPickup] = useState(false);
  const [hasElevatorDestination, setHasElevatorDestination] = useState(false);
  const [selectedItems, setSelectedItems] = useState<MovingItemId[]>(["mattress", "boxes"]);
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isStudentVerified = Boolean(profile?.student_card_verified);
  const estimatedPrice = useMemo(
    () =>
      calculateMovingEstimate({
        floorPickup,
        floorDestination,
        hasElevatorPickup,
        hasElevatorDestination,
        items: selectedItems,
      }),
    [
      floorDestination,
      floorPickup,
      hasElevatorDestination,
      hasElevatorPickup,
      selectedItems,
    ],
  );
  const studentDiscount = calculateStudentDiscount(estimatedPrice, isStudentVerified);
  const finalPrice = calculateFinalPrice(estimatedPrice, isStudentVerified);

  useEffect(() => {
    if (isOpen && profile?.phone && !contactPhone) {
      setContactPhone(profile.phone);
    }
  }, [contactPhone, isOpen, profile?.phone]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!pickupAddress.trim()) {
      nextErrors.pickupAddress = "Vui lòng nhập địa chỉ lấy đồ";
    }

    if (!destinationAddress.trim()) {
      nextErrors.destinationAddress = "Vui lòng nhập địa chỉ đến";
    }

    if (!moveDate) {
      nextErrors.moveDate = "Vui lòng chọn ngày chuyển";
    } else {
      const selectedDate = new Date(moveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        nextErrors.moveDate = "Ngày chọn phải là ngày trong tương lai";
      }
    }

    if (selectedItems.length === 0) {
      nextErrors.items = "Vui lòng chọn ít nhất một nhóm đồ đạc";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setPickupAddress("");
    setDestinationAddress("");
    setMoveDate("");
    setMoveTime("08:00");
    setFloorPickup(1);
    setFloorDestination(1);
    setHasElevatorPickup(false);
    setHasElevatorDestination(false);
    setSelectedItems(["mattress", "boxes"]);
    setContactPhone(profile?.phone ?? "");
    setNotes("");
    setErrors({});
  };

  const toggleItem = (itemId: MovingItemId, checked: boolean) => {
    if (checked) {
      setSelectedItems((current) => (current.includes(itemId) ? current : [...current, itemId]));
      return;
    }

    setSelectedItems((current) => current.filter((item) => item !== itemId));
  };

  const handleConfirm = async () => {
    if (!validate()) {
      return;
    }

    try {
      await createServiceLead.mutateAsync({
        service_type: "moving",
        partner_id: partnerId,
        details: {
          pickup_address: pickupAddress.trim(),
          destination_address: destinationAddress.trim(),
          floor_pickup: floorPickup,
          floor_destination: floorDestination,
          has_elevator_pickup: hasElevatorPickup,
          has_elevator_destination: hasElevatorDestination,
          preferred_time: moveTime,
          items: selectedItems,
          notes: notes.trim(),
          contact_phone: contactPhone.trim() || profile?.phone || null,
        },
        preferred_date: moveDate,
      });

      resetForm();
      onClose();
    } catch {
      // Mutation error is surfaced by toast.
    }
  };

  const isLoading = createServiceLead.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đặt dịch vụ chuyển phòng</DialogTitle>
          <DialogDescription>
            Đội chuyển phòng chuyên nghiệp giúp bạn dọn đồ gọn gàng, có tính giá tham khảo
            theo số tầng và nhóm đồ đạc.
            {partnerName ? ` Yêu cầu sẽ ưu tiên gửi tới ${partnerName}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Địa chỉ lấy đồ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pickup-address"
                placeholder="Ví dụ: Phòng B204, KTX khu A"
                className="rounded-xl"
                value={pickupAddress}
                onChange={(event) => setPickupAddress(event.target.value)}
                disabled={isLoading}
              />
              {errors.pickupAddress ? (
                <p className="text-xs text-destructive">{errors.pickupAddress}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination-address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                Địa chỉ đến <span className="text-destructive">*</span>
              </Label>
              <Input
                id="destination-address"
                placeholder="Ví dụ: Tòa S1.05, Vinhomes Grand Park"
                className="rounded-xl"
                value={destinationAddress}
                onChange={(event) => setDestinationAddress(event.target.value)}
                disabled={isLoading}
              />
              {errors.destinationAddress ? (
                <p className="text-xs text-destructive">{errors.destinationAddress}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="move-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Ngày chuyển <span className="text-destructive">*</span>
              </Label>
              <Input
                id="move-date"
                type="date"
                className="rounded-xl"
                value={moveDate}
                onChange={(event) => setMoveDate(event.target.value)}
                disabled={isLoading}
              />
              {errors.moveDate ? <p className="text-xs text-destructive">{errors.moveDate}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="move-time">Khung giờ mong muốn</Label>
              <Input
                id="move-time"
                type="time"
                className="rounded-xl"
                value={moveTime}
                onChange={(event) => setMoveTime(event.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                {
                  label: "Điểm lấy đồ",
                  floor: floorPickup,
                  setFloor: setFloorPickup,
                  hasElevator: hasElevatorPickup,
                  setHasElevator: setHasElevatorPickup,
                  floorId: "floor-pickup",
                  elevatorId: "elevator-pickup",
                } ,
                {
                  label: "Điểm đến",
                  floor: floorDestination,
                  setFloor: setFloorDestination,
                  hasElevator: hasElevatorDestination,
                  setHasElevator: setHasElevatorDestination,
                  floorId: "floor-destination",
                  elevatorId: "elevator-destination",
                },
              ] as const
            ).map((point) => (
              <div key={point.label} className="space-y-3 rounded-2xl border border-border/70 p-4">
                <h3 className="text-sm font-semibold text-foreground">{point.label}</h3>

                <div className="space-y-1.5">
                  <Label htmlFor={point.floorId} className="text-xs text-muted-foreground">
                    Số tầng
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Giảm tầng"
                      onClick={() => point.setFloor(Math.max(1, point.floor - 1))}
                      disabled={isLoading || point.floor <= 1}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <Input
                      id={point.floorId}
                      type="number"
                      min={1}
                      max={50}
                      value={point.floor}
                      onChange={(e) => point.setFloor(Math.max(1, Number(e.target.value) || 1))}
                      disabled={isLoading}
                      className="h-10 rounded-xl text-center text-base font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Tăng tầng"
                      onClick={() => point.setFloor(Math.min(50, point.floor + 1))}
                      disabled={isLoading || point.floor >= 50}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <label
                  htmlFor={point.elevatorId}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    id={point.elevatorId}
                    checked={point.hasElevator}
                    onCheckedChange={(checked) => point.setHasElevator(checked === true)}
                    disabled={isLoading}
                  />
                  Có thang máy
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">
                Nhóm đồ đạc cần chuyển <span className="text-destructive">*</span>
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Chọn các nhóm chính để hệ thống tính giá sơ bộ. Đối tác sẽ xác nhận lại nếu có
                đồ cồng kềnh phát sinh.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {MOVING_ITEM_OPTIONS.map((item) => {
                const checked = selectedItems.includes(item.id);

                return (
                  <label
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleItem(item.id, value === true)}
                        disabled={isLoading}
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium text-primary">+{formatCurrency(item.price)}</span>
                  </label>
                );
              })}
            </div>
            {errors.items ? <p className="text-xs text-destructive">{errors.items}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Số điện thoại liên hệ
              </Label>
              <Input
                id="contact-phone"
                placeholder="Ví dụ: 09xxxxxxxx"
                className="rounded-xl"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Giá hiển thị là giá tham khảo</p>
              <p className="mt-1">
                Mức giá được tính từ tầng, thang máy và nhóm đồ đã chọn. Đối tác sẽ gọi lại để
                xác nhận chi phí cuối cùng trước khi chốt lịch.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moving-notes">Ghi chú thêm</Label>
            <Textarea
              id="moving-notes"
              placeholder="Ví dụ: Có bảo vệ hỗ trợ bãi xe, cần chuyển trước 9h sáng..."
              className="min-h-[96px] rounded-xl"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Chi phí ước tính</p>
                <div className="mt-2 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Tính theo nhóm đồ đạc và điều kiện lên xuống hàng
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-2xl font-semibold">{formatCurrency(estimatedPrice)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Giá sơ bộ trước ưu đãi</p>
              </div>
            </div>
          </div>

          {isStudentVerified ? (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                🎓
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Đã áp dụng ưu đãi sinh viên</p>
                <p className="text-xs text-amber-700">Giảm 15% trên giá tham khảo của đơn dịch vụ.</p>
              </div>
              <span className="text-sm font-semibold text-amber-700">
                -{formatCurrency(studentDiscount)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Chưa áp dụng ưu đãi sinh viên</p>
                <p className="text-xs text-muted-foreground">
                  Xác thực thẻ sinh viên trong hồ sơ để mở giảm giá 15% cho các đơn dịch vụ đủ
                  điều kiện.
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng thanh toán tham khảo</span>
              <span className="text-xl font-semibold text-primary">{formatCurrency(finalPrice)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              onClick={onClose}
              variant="outline"
              className="h-12 flex-1 rounded-full"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className="h-12 flex-1 rounded-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
