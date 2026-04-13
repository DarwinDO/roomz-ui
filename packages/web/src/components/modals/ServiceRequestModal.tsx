import { useEffect, useMemo, useState } from "react";
import { Calendar, Loader2, MapPin, Phone, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts";
import { Button } from "@/components/ui/button";
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
import type { Partner } from "@/services/partners";
import type { CreateServiceLeadRequest } from "@roomz/shared/types/serviceLeads";
import type { ServiceRequestMode } from "./serviceRequestRouting";

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: ServiceRequestMode | null;
  partner?: Partner | null;
}

const MODE_CONFIG = {
  repair: {
    title: "Yêu cầu sửa chữa & điện nước",
    description: "Gửi mô tả sự cố để RommZ hoặc đối tác liên hệ xác nhận hướng xử lý phù hợp.",
    messageLabel: "Mô tả sự cố",
    messagePlaceholder: "Ví dụ: Rò nước dưới bồn rửa, ổ điện chập chờn, cần kiểm tra máy lạnh...",
  },
  laundry: {
    title: "Yêu cầu giặt ủi lấy liền",
    description: "Điền nhanh loại đồ cần giặt để hệ thống tạo yêu cầu dịch vụ và sắp lịch lấy đồ.",
    messageLabel: "Mô tả đồ cần giặt",
    messagePlaceholder: "Ví dụ: 6kg quần áo, 2 bộ drap, cần lấy lúc tối nay...",
  },
  setup: {
    title: "Yêu cầu đóng gói & lắp đặt",
    description: "Dùng form này để đặt đội đóng gói, lắp nội thất hoặc setup góc ở mới.",
    itemsLabel: "Danh sách món đồ",
    itemsPlaceholder: "Ví dụ: Bàn học, kệ sách, rèm cửa, 4 thùng đồ...",
  },
} satisfies Record<ServiceRequestMode, Record<string, string>>;

function splitItems(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ServiceRequestModal({
  isOpen,
  onClose,
  mode,
  partner,
}: ServiceRequestModalProps) {
  const { profile } = useAuth();
  const createServiceLead = useCreateServiceLead();
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [setupType, setSetupType] = useState("full");
  const [items, setItems] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = mode ? MODE_CONFIG[mode] : null;
  const requestCopy = mode === "repair" ? MODE_CONFIG.repair : MODE_CONFIG.laundry;
  const isLoading = createServiceLead.isPending;

  useEffect(() => {
    if (isOpen && profile?.phone && !contactPhone) {
      setContactPhone(profile.phone);
    }
  }, [contactPhone, isOpen, profile?.phone]);

  const partnerDescription = useMemo(() => {
    if (!partner) {
      return null;
    }

    return `Yêu cầu sẽ được gửi trực tiếp tới ${partner.name}.`;
  }, [partner]);

  if (!mode || !config) {
    return null;
  }

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ hoặc mã phòng";
    }

    if (!preferredDate) {
      nextErrors.preferredDate = "Vui lòng chọn ngày mong muốn";
    }

    if (mode === "setup" && splitItems(items).length === 0) {
      nextErrors.items = "Vui lòng nhập ít nhất một món đồ cần hỗ trợ";
    }

    if (mode !== "setup" && !message.trim()) {
      nextErrors.message = "Vui lòng mô tả yêu cầu của bạn";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const request: CreateServiceLeadRequest =
      mode === "setup"
        ? {
            service_type: "setup",
            partner_id: partner?.id,
            preferred_date: preferredDate,
            details: {
              address: address.trim(),
              setup_type: setupType,
              items: splitItems(items),
              notes: notes.trim(),
              contact_phone: contactPhone.trim() || profile?.phone || null,
            },
          }
        : {
            service_type: "support",
            partner_id: partner?.id,
            preferred_date: preferredDate,
            details: {
              address: address.trim(),
              category: mode,
              message: message.trim(),
              notes: notes.trim(),
              contact_phone: contactPhone.trim() || profile?.phone || null,
            },
          };

    try {
      await createServiceLead.mutateAsync(request);
      setAddress("");
      setPreferredDate("");
      setNotes("");
      setMessage("");
      setItems("");
      setSetupType("full");
      setContactPhone(profile?.phone ?? "");
      setErrors({});
      onClose();
    } catch {
      // Mutation error is surfaced by toast.
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description}
            {partnerDescription ? ` ${partnerDescription}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-request-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Địa chỉ / mã phòng <span className="text-destructive">*</span>
            </Label>
            <Input
              id="service-request-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ví dụ: Căn B1205, Vinhomes Grand Park"
              className="rounded-xl"
              disabled={isLoading}
            />
            {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-request-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Ngày mong muốn <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-request-date"
                type="date"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                className="rounded-xl"
                disabled={isLoading}
              />
              {errors.preferredDate ? (
                <p className="text-xs text-destructive">{errors.preferredDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-request-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Số điện thoại liên hệ
              </Label>
              <Input
                id="service-request-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="Ví dụ: 09xxxxxxxx"
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
          </div>

          {mode === "setup" ? (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  Kiểu hỗ trợ
                </Label>
                <Select value={setupType} onValueChange={setSetupType} disabled={isLoading}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Chọn loại hỗ trợ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Trọn gói</SelectItem>
                    <SelectItem value="furniture">Nội thất</SelectItem>
                    <SelectItem value="appliances">Thiết bị điện</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-request-items">
                  {MODE_CONFIG.setup.itemsLabel} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="service-request-items"
                  value={items}
                  onChange={(event) => setItems(event.target.value)}
                  placeholder={MODE_CONFIG.setup.itemsPlaceholder}
                  className="min-h-[110px] rounded-xl"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Có thể nhập nhiều món, ngăn cách bằng dấu phẩy hoặc xuống dòng.
                </p>
                {errors.items ? <p className="text-xs text-destructive">{errors.items}</p> : null}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="service-request-message">
                {requestCopy.messageLabel} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="service-request-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={requestCopy.messagePlaceholder}
                className="min-h-[120px] rounded-xl"
                disabled={isLoading}
              />
              {errors.message ? <p className="text-xs text-destructive">{errors.message}</p> : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service-request-notes">Ghi chú thêm</Label>
            <Textarea
              id="service-request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ví dụ: Cần gọi trước 15 phút, có bảo vệ hỗ trợ mở cổng..."
              className="min-h-[90px] rounded-xl"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 flex-1 rounded-full"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-12 flex-1 rounded-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
