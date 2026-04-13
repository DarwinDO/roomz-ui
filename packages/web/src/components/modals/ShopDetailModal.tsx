import { useState, useMemo, lazy, Suspense } from "react";
import type { SavedVoucher } from "@/services/deals";
import { parseVoucherCode } from "@/services/deals";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Lazy load Mapbox map component to avoid blocking initial render
const ShopMiniMapbox = lazy(() =>
  import("@/components/maps/ShopMiniMapbox").then((mod) => ({
    default: mod.ShopMiniMapbox,
  }))
);
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Gift,
  QrCode,
  Navigation,
  X,
  CheckCircle2,
  Copy,
  Check,
  BadgeCheck,
} from "lucide-react";
import { useMyVouchers, useSaveVoucher } from "@/hooks/useDeals";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineDistance, formatDistance } from "@roomz/shared/utils/geo";
import type { DealWithPartner } from "@/services/deals";

interface ShopDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealWithPartner | null;
}

/**
 * ShopDetailModal - Displays deal details with QR code generation
 * Uses real partner and deal data from database
 */
export function ShopDetailModal({ isOpen, onClose, deal }: ShopDetailModalProps) {
  const [showVoucher, setShowVoucher] = useState(false);
  // Local state for immediate QR display after claiming (fixes race condition)
  const [claimedVoucher, setClaimedVoucher] = useState<SavedVoucher | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isMarkedUsed, setIsMarkedUsed] = useState(false);

  // Geolocation
  const { position: userPosition } = useGeolocation();

  // Fetch user's saved vouchers to check if already claimed
  const { data: savedVouchers = [], isLoading: isVouchersLoading } = useMyVouchers();

  // Save voucher mutation
  const saveVoucherMutation = useSaveVoucher();

  // Get partner from deal
  const partner = deal?.partner;

  // Check if user has already saved this specific deal
  const hasVoucher = useMemo(() => {
    if (!deal) return false;
    return savedVouchers.some((v) => v.deal_id === deal.id);
  }, [savedVouchers, deal]);

  // Get the saved voucher data for this deal
  const savedVoucher = useMemo(() => {
    if (!deal) return null;
    return savedVouchers.find((v) => v.deal_id === deal.id) || null;
  }, [savedVouchers, deal]);

  // Calculate distance if user has position and partner has coordinates
  const distance = useMemo(() => {
    if (!userPosition || !partner?.latitude || !partner?.longitude) {
      return undefined;
    }
    const km = haversineDistance(
      userPosition.lat,
      userPosition.lng,
      Number(partner.latitude),
      Number(partner.longitude)
    );
    return formatDistance(km);
  }, [userPosition, partner]);

  // Handle getting/claiming voucher
  const handleGetVoucher = async () => {
    if (!deal) return;

    try {
      const voucher = await saveVoucherMutation.mutateAsync(deal.id);
      setClaimedVoucher(voucher);
      setShowVoucher(true);
    } catch (error) {
      console.error("Error saving voucher:", error);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setShowVoucher(false);
      setClaimedVoucher(null);
      setIsCopied(false);
      setIsMarkedUsed(false);
    }, 300);
  };

  const activeVoucher = claimedVoucher ?? savedVoucher;
  const voucherCode = activeVoucher ? parseVoucherCode(activeVoucher.qr_data) : null;
  const hasVoucherQrData = Boolean(activeVoucher?.qr_data?.trim());

  const handleCopyCode = async () => {
    if (!voucherCode) return;
    try {
      await navigator.clipboard.writeText(voucherCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  // Format expiry date
  const formatExpiryDate = (dateStr: string | null): string => {
    if (!dateStr) return "Không có thời hạn";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Loading state
  const isSaving = saveVoucherMutation.isPending;

  // Don't render if no deal
  if (!deal) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{partner?.name || "Shop"} - Shop Details</DialogTitle>
          <DialogDescription>
            View exclusive student discount details and get your voucher for {partner?.name}
          </DialogDescription>
        </VisuallyHidden>

        {/* Hero Image */}
        <div className="relative h-52 overflow-hidden rounded-t-xl">
          <img
            src={partner?.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop"}
            alt={partner?.name || "Shop"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />

          {/* Close button */}
          <div className="absolute top-3 right-3">
            <Button
              onClick={handleClose}
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md"
            >
              <X className="w-3.5 h-3.5 text-gray-700" />
            </Button>
          </div>

          {/* Bottom overlay: name + badges */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
            <p className="text-white font-semibold text-lg leading-snug line-clamp-1 drop-shadow-sm mb-2">
              {partner?.name || "Shop"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {distance && (
                <Badge className="h-6 rounded-full bg-white/20 border border-white/30 text-white text-[11px] backdrop-blur-sm px-2">
                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                  {distance}
                </Badge>
              )}
              {partner?.category && (
                <Badge className="h-6 rounded-full bg-white/20 border border-white/30 text-white text-[11px] backdrop-blur-sm px-2 uppercase tracking-wide">
                  {partner.category}
                </Badge>
              )}
              {(deal.discount_value || deal.title) && (
                <Badge className="h-6 rounded-full bg-primary text-white text-[11px] px-2 ml-auto shrink-0 max-w-[120px] truncate">
                  <Gift className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{deal.discount_value || deal.title}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Offer pill — gọn hơn */}
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Ưu đãi dành riêng cho thành viên RommZ</p>
              <p className="truncate text-sm font-semibold text-primary leading-snug">
                {deal.title || deal.discount_value || "Khám phá ngay"}
              </p>
            </div>
          </div>

          {/* Description from deal */}
          {deal.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Về {partner?.name}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{deal.description}</p>
            </div>
          )}

          <Separator />

          {/* Contact Information */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Liên hệ & địa chỉ
            </p>
            <div className="divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden">
              {partner?.hours && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Giờ mở cửa</span>
                  <span className="text-sm font-medium text-foreground truncate">{partner.hours}</span>
                </div>
              )}
              {partner?.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Điện thoại</span>
                  <a href={`tel:${partner.phone}`} className="text-sm font-medium text-primary hover:underline truncate">
                    {partner.phone}
                  </a>
                </div>
              )}
              {partner?.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0">Email</span>
                  <a href={`mailto:${partner.email}`} className="text-sm font-medium text-primary hover:underline truncate">
                    {partner.email}
                  </a>
                </div>
              )}
              {partner?.address && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-20 shrink-0 mt-0.5">Địa chỉ</span>
                  <span className="text-sm font-medium text-foreground">{partner.address}</span>
                </div>
              )}
              {!partner?.hours && !partner?.phone && !partner?.email && !partner?.address && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Liên hệ để biết địa chỉ chi tiết</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Mini Map - Show only when partner has coordinates */}
          {partner?.latitude && partner?.longitude && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Vị trí trên bản đồ</h3>
              <Suspense
                fallback={
                  <Skeleton className="w-full h-[200px] rounded-2xl" />
                }
              >
                <ShopMiniMapbox
                  latitude={Number(partner.latitude)}
                  longitude={Number(partner.longitude)}
                  partnerName={partner.name || "Đối tác"}
                  category={partner.category}
                  userPosition={userPosition}
                />
              </Suspense>
            </div>
          )}

          <Separator />

          {/* Voucher Section */}
          <div className="space-y-4">
            {(showVoucher || hasVoucher) && activeVoucher ? (
              voucherCode ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-secondary" />
                  <h3 className="text-base font-semibold text-secondary">Voucher của bạn</h3>
                </div>

                {/* Ticket card */}
                <div className="rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden shadow-sm">
                  {/* Top — voucher code */}
                  <div className="px-6 pt-6 pb-5 text-center">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                      Mã ưu đãi
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-bold tracking-widest text-primary">
                        {voucherCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        aria-label="Sao chép mã"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-secondary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isCopied ? "Đã sao chép!" : "Đọc hoặc sao chép mã cho nhân viên"}
                    </p>
                  </div>

                  {/* Ticket cut-line divider */}
                  <div className="relative flex items-center">
                    <div className="absolute -left-3 h-6 w-6 rounded-full bg-background" />
                    <div className="mx-3 w-full border-t-2 border-dashed border-primary/20" />
                    <div className="absolute -right-3 h-6 w-6 rounded-full bg-background" />
                  </div>

                  {/* Bottom — QR code */}
                  <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-5">
                    {hasVoucherQrData ? (
                      <div className="rounded-xl bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={activeVoucher.qr_data}
                          size={140}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Quét QR nếu quầy có máy đọc mã</span>
                    </div>
                  </div>
                </div>

                {/* How to use */}
                <div className="space-y-2.5 rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cách dùng
                  </p>
                  {[
                    "Đưa màn hình hoặc đọc mã cho nhân viên trước khi thanh toán",
                    "Xuất trình thẻ sinh viên nếu được yêu cầu",
                    "Ưu đãi áp dụng trực tiếp vào hoá đơn",
                  ].map((step) => (
                    <div key={step} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Expiry */}
                {deal.valid_until && (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <span className="text-amber-500">⏰</span>
                    <p className="text-sm font-medium text-amber-800">
                      Hiệu lực đến: {formatExpiryDate(deal.valid_until)}
                    </p>
                  </div>
                )}

                {/* Mark as used */}
                {isMarkedUsed ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary/10 py-3 text-secondary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Đã đánh dấu sử dụng</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-muted-foreground/25 text-muted-foreground hover:border-secondary hover:text-secondary"
                    onClick={() => setIsMarkedUsed(true)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Đánh dấu đã dùng
                  </Button>
                )}
              </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm font-medium text-amber-900">Mã voucher chưa sẵn sàng</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Voucher đã được lưu nhưng hiện chưa có mã hợp lệ để xuất trình. Vui lòng liên hệ
                    hỗ trợ hoặc thử lại sau.
                  </p>
                </div>
              )
            ) : (
              /* Not yet claimed */
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Nhận voucher ưu đãi</h3>
                <Button
                  onClick={handleGetVoucher}
                  disabled={isSaving || isVouchersLoading}
                  className="w-full rounded-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-base font-medium shadow-md hover:shadow-lg transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang tạo mã...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-5 w-5" />
                      Nhận voucher
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Bạn sẽ nhận được mã ưu đãi và mã QR để dùng tại {partner?.name}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-11"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button
              className="flex-1 rounded-full h-11 bg-primary hover:bg-primary/90"
              onClick={() => {
                if (partner?.latitude && partner?.longitude) {
                  const dest = `${partner.latitude},${partner.longitude}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
                }
              }}
              disabled={!partner?.latitude || !partner?.longitude}
              title={!partner?.latitude || !partner?.longitude ? "Đối tác chưa cập nhật vị trí" : undefined}
            >
              <Navigation className="w-4 h-4 mr-2 shrink-0" />
              Chỉ đường
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
