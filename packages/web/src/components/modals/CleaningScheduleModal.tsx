import { useEffect, useMemo, useState } from "react";
import { Calendar, Loader2, MapPin, Phone, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateServiceLead } from "@/hooks/useServiceLeads";
import { formatCurrency } from "@roomz/shared/utils/format";
import {
  calculateCleaningEstimate,
  calculateFinalPrice,
  calculateStudentDiscount,
  CLEANING_ADD_ON_OPTIONS,
  CLEANING_TYPE_OPTIONS,
  type CleaningAddOnId,
  type CleaningTypeId,
} from "./serviceBookingPricing";

interface CleaningScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId?: string;
  partnerName?: string | null;
}

export function CleaningScheduleModal({
  isOpen,
  onClose,
  partnerId,
  partnerName,
}: CleaningScheduleModalProps) {
  const { profile } = useAuth();
  const createServiceLead = useCreateServiceLead();

  const [address, setAddress] = useState("");
  const [selectedType, setSelectedType] = useState<CleaningTypeId>("move_in");
  const [cleaningDate, setCleaningDate] = useState("");
  const [cleaningTime, setCleaningTime] = useState("08:00");
  const [numRooms, setNumRooms] = useState(1);
  const [numBathrooms, setNumBathrooms] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<CleaningAddOnId[]>([]);
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isStudentVerified = Boolean(profile?.student_card_verified);
  const basePrice = CLEANING_TYPE_OPTIONS.find((type) => type.id === selectedType)?.price ?? 0;
  const addOnPrice = selectedAddOns.reduce(
    (total, addOnId) =>
      total + (CLEANING_ADD_ON_OPTIONS.find((option) => option.id === addOnId)?.price ?? 0),
    0,
  );
  const subtotalPrice = useMemo(
    () =>
      calculateCleaningEstimate({
        cleaningType: selectedType,
        numRooms,
        numBathrooms,
        addOns: selectedAddOns,
      }),
    [numBathrooms, numRooms, selectedAddOns, selectedType],
  );
  const scaleAdjustment = subtotalPrice - basePrice - addOnPrice;
  const studentDiscount = calculateStudentDiscount(subtotalPrice, isStudentVerified);
  const finalPrice = calculateFinalPrice(subtotalPrice, isStudentVerified);

  useEffect(() => {
    if (isOpen && profile?.phone && !contactPhone) {
      setContactPhone(profile.phone);
    }
  }, [contactPhone, isOpen, profile?.phone]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ";
    }

    if (!cleaningDate) {
      nextErrors.cleaningDate = "Vui lòng chọn ngày";
    } else {
      const selectedDate = new Date(cleaningDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        nextErrors.cleaningDate = "Ngày chọn phải là ngày trong tương lai";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const toggleAddOn = (addOnId: CleaningAddOnId, checked: boolean) => {
    if (checked) {
      setSelectedAddOns((current) => (current.includes(addOnId) ? current : [...current, addOnId]));
      return;
    }

    setSelectedAddOns((current) => current.filter((item) => item !== addOnId));
  };

  const resetForm = () => {
    setAddress("");
    setSelectedType("move_in");
    setCleaningDate("");
    setCleaningTime("08:00");
    setNumRooms(1);
    setNumBathrooms(1);
    setSelectedAddOns([]);
    setContactPhone(profile?.phone ?? "");
    setNotes("");
    setErrors({});
  };

  const handleConfirm = async () => {
    if (!validate()) {
      return;
    }

    try {
      await createServiceLead.mutateAsync({
        service_type: "cleaning",
        partner_id: partnerId,
        details: {
          address: address.trim(),
          cleaning_type: selectedType,
          num_rooms: numRooms,
          num_bathrooms: numBathrooms,
          preferred_time: cleaningTime,
          add_ons: selectedAddOns,
          notes: notes.trim(),
          contact_phone: contactPhone.trim() || profile?.phone || null,
        },
        preferred_date: cleaningDate,
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
          <DialogTitle>Đặt lịch vệ sinh phòng</DialogTitle>
          <DialogDescription>
            Dịch vụ vệ sinh tổng quát cho phòng hoặc căn hộ với giá tham khảo theo quy mô thực tế.
            {partnerName ? ` Yêu cầu sẽ ưu tiên gửi tới ${partnerName}.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="cleaning-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Địa chỉ / mã phòng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cleaning-address"
              placeholder="Ví dụ: Căn A203, The Sun Avenue, Quận 2"
              className="rounded-xl"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={isLoading}
            />
            {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary" />
                Loại hình vệ sinh
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Trên màn hình hẹp, các gói được xếp dọc để tránh vỡ layout và chồng chữ.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CLEANING_TYPE_OPTIONS.map((type) => {
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white shadow-soft"
                        : "border-border/70 bg-card hover:border-primary/30 hover:bg-primary/5"
                    }`}
                    disabled={isLoading}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-5">{type.label}</p>
                      <p
                        className={`text-xs ${
                          isSelected ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(type.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="num-rooms">Số phòng</Label>
              <Input
                id="num-rooms"
                type="number"
                min={1}
                max={10}
                value={numRooms}
                onChange={(event) => setNumRooms(Number(event.target.value) || 1)}
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
                onChange={(event) => setNumBathrooms(Number(event.target.value) || 1)}
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cleaning-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Ngày <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cleaning-date"
                type="date"
                className="rounded-xl"
                value={cleaningDate}
                onChange={(event) => setCleaningDate(event.target.value)}
                disabled={isLoading}
              />
              {errors.cleaningDate ? (
                <p className="text-xs text-destructive">{errors.cleaningDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning-time">Khung giờ</Label>
              <Select value={cleaningTime} onValueChange={setCleaningTime} disabled={isLoading}>
                <SelectTrigger id="cleaning-time" className="rounded-xl">
                  <SelectValue placeholder="Chọn khung giờ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00 - 11:00</SelectItem>
                  <SelectItem value="12:30">12:30 - 15:30</SelectItem>
                  <SelectItem value="16:00">16:00 - 19:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Dịch vụ bổ sung (tùy chọn)</Label>
            <div className="space-y-2">
              {CLEANING_ADD_ON_OPTIONS.map((addOn) => {
                const checked = selectedAddOns.includes(addOn.id);

                return (
                  <label
                    key={addOn.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleAddOn(addOn.id, value === true)}
                        disabled={isLoading}
                      />
                      <span>{addOn.label}</span>
                    </div>
                    <span className="font-medium text-primary">+{formatCurrency(addOn.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cleaning-contact-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Số điện thoại liên hệ
              </Label>
              <Input
                id="cleaning-contact-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="Ví dụ: 09xxxxxxxx"
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning-notes">Ghi chú thêm</Label>
              <Textarea
                id="cleaning-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ví dụ: Cần mang dụng cụ riêng, nhà có thú cưng..."
                className="min-h-[96px] rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>

            <div className="space-y-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gói vệ sinh chính</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>

            {scaleAdjustment > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Quy mô phòng ({numRooms} phòng, {numBathrooms} toilet)
                </span>
                <span>{formatCurrency(scaleAdjustment)}</span>
              </div>
            ) : null}

            {selectedAddOns.length > 0 ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dịch vụ bổ sung</span>
                <span>{formatCurrency(addOnPrice)}</span>
              </div>
            ) : null}

            {isStudentVerified ? (
              <div className="flex items-center justify-between text-sm text-amber-700">
                <span>Ưu đãi sinh viên</span>
                <span>-{formatCurrency(studentDiscount)}</span>
              </div>
            ) : null}

            <div className="border-t border-primary/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tổng cộng</span>
                <span className="text-2xl font-semibold text-primary">
                  {formatCurrency(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {isStudentVerified ? (
            <Badge className="w-full justify-center rounded-xl bg-amber-50 py-3 text-amber-800 hover:bg-amber-50">
              🎓 Ưu đãi sinh viên 15% đã được áp dụng vào tổng cộng
            </Badge>
          ) : (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Xác thực thẻ sinh viên trong hồ sơ để mở ưu đãi 15% cho đơn dọn dẹp.
              </p>
            </div>
          )}

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
                "Xác nhận đặt lịch"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
