import { useState, useMemo, lazy, Suspense } from "react";
import type { SavedVoucher } from "@/services/deals";
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
    }, 300);
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
        <div className="relative h-64 overflow-hidden rounded-t-xl">
          <img
            src={partner?.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop"}
            alt={partner?.name || "Shop"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-4 right-4">
            <Button
              onClick={handleClose}
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white shadow-md"
            >
              <X className="w-4 h-4 text-primary" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-white mb-2">{partner?.name || "Shop"}</h1>
                <div className="flex gap-1">
                  {distance && (
                    <Badge className="bg-white/90 text-gray-900 border-0">
                      <MapPin className="w-3 h-3 mr-1" />
                      {distance}
                    </Badge>
                  )}
                  <Badge className="bg-white/90 text-gray-900 border-0">
                    {partner?.category || "deal"}
                  </Badge>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full bg-white/90 text-gray-900"
              >
                <Gift className="w-3 h-3 mr-1" />
                {deal.discount_value || deal.title || "Ưu đãi"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Offer Banner */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-5 border border-primary/20 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-1 font-medium">Ưu đãi dành riêng cho thành viên RommZ</p>
                <h2 className="text-lg font-bold text-primary leading-tight">{deal.title || deal.discount_value || "Khám phá ngay"}</h2>
              </div>
            </div>
          </div>

          {/* Description from deal */}
          {deal.description && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">Về {partner?.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{deal.description}</p>
            </div>
          )}

          <Separator />

          {/* Contact Information - from partner */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Liên hệ & địa chỉ</h3>
            <div className="space-y-2">
              {partner?.hours && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Giờ mở cửa</p>
                    <p className="text-sm text-gray-600">{partner.hours}</p>
                  </div>
                </div>
              )}
              {partner?.phone && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Điện thoại</p>
                    <p className="text-sm text-gray-600">{partner.phone}</p>
                  </div>
                </div>
              )}
              {partner?.email && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600 truncate">{partner.email}</p>
                  </div>
                </div>
              )}
              {partner?.address && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                    <p className="text-sm text-gray-600">{partner.address}</p>
                  </div>
                </div>
              )}
              {/* Fallback if no contact info */}
              {!partner?.hours && !partner?.phone && !partner?.email && !partner?.address && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Địa chỉ</p>
                    <p className="text-sm text-gray-600">Liên hệ để biết địa chỉ chi tiết</p>
                  </div>
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
            <h3 className="text-base font-semibold">Nhận voucher ưu đãi</h3>

            {/* Show QR if user has voucher OR is claiming now - use claimedVoucher for immediate display */}
            {(showVoucher || hasVoucher) && (claimedVoucher || savedVoucher) ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* QR Code - Real QR from saved voucher */}
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-primary/30 shadow-sm">
                  <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mx-auto mb-3">
                    <QRCodeSVG
                      value={(claimedVoucher || savedVoucher)?.qr_data || ""}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 font-medium">
                    Quét mã này tại {partner?.name}
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900">Cách sử dụng:</p>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-gray-700">Đưa mã QR cho nhân viên trước khi thanh toán</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-gray-700">Xuất trình thẻ sinh viên khi được yêu cầu</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-gray-700">Ưu đãi sẽ được áp dụng trực tiếp vào hóa đơn</span>
                    </div>
                  </div>
                </div>

                {/* Validity - from deal.valid_until */}
                {deal.valid_until && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-center gap-2">
                    <span className="text-amber-600">⏰</span>
                    <p className="text-sm text-amber-800 font-medium">
                      Hiệu lực đến: {formatExpiryDate(deal.valid_until)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Button to claim voucher */
              <Button
                onClick={handleGetVoucher}
                disabled={isSaving || isVouchersLoading}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang tạo mã...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Nhận voucher
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Action Buttons - Fixed layout to prevent text cutoff */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12 text-base font-medium"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button
              className="flex-1 rounded-full h-12 bg-primary hover:bg-primary/90 text-base font-medium shadow-md"
              onClick={() => {
                if (partner?.latitude && partner?.longitude) {
                  const dest = `${partner.latitude},${partner.longitude}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
                }
              }}
              disabled={!partner?.latitude || !partner?.longitude}
            >
              <Navigation className="w-4 h-4 mr-2 shrink-0" />
              <span className="whitespace-nowrap">Chỉ đường</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
