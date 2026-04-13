import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getReviews } from "@/services/reviews";
import { getDeals } from "@/services/deals";
import type { Partner } from "@/services/partners";
import { getPartnerBookingLabel, isVoucherPartner } from "./serviceRequestRouting";
import {
  Clock,
  ExternalLink,
  Gift,
  Mail,
  MapPin,
  Percent,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";

interface PartnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
  onBookService?: (partner: Partner) => void;
}

export function PartnerDetailModal({
  isOpen,
  onClose,
  partner,
  onBookService,
}: PartnerDetailModalProps) {
  const navigate = useNavigate();
  const bookingLabel = getPartnerBookingLabel(partner);
  const isVoucher = isVoucherPartner(partner);

  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["partner-reviews", partner.id],
    queryFn: () => getReviews(partner.id, "partner"),
    enabled: isOpen,
    staleTime: 60_000,
  });

  // For voucher partners, only show the CTA when there are actual active deals in DB.
  // Service partners (moving, cleaning, etc.) always show — they can always be booked.
  const { data: partnerDeals = [] } = useQuery({
    queryKey: ["partner-deals", partner.id],
    queryFn: () => getDeals({ partnerId: partner.id, isActive: true }),
    enabled: isOpen && isVoucher,
    staleTime: 60_000,
  });
  const showBookingCta = !isVoucher || partnerDeals.length > 0;

  const handleContactPartner = () => {
    if (partner.phone) {
      window.open(`tel:${partner.phone}`, "_blank");
      return;
    }

    toast.error("Chưa có SĐT");
  };

  const handleBookService = () => {
    if (onBookService) {
      onBookService(partner);
      onClose();
      return;
    }

    navigate("/services");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{partner.name}</span>
            <Badge className="bg-primary text-white">
              <Star className="mr-1 h-3 w-3 fill-white" />
              {partner.rating || 0}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {partner.specialization || "Dịch vụ"} • {partner.review_count || 0} đánh giá
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Percent className="h-6 w-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">Ưu đãi dành cho sinh viên</p>
                <p className="text-sm text-amber-700">{partner.discount || "Liên hệ để nhận báo giá ưu đãi."}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Giới thiệu</h4>
            <p className="text-sm leading-relaxed text-gray-600">
              {partner.description || <span className="text-gray-400">Chưa cập nhật</span>}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Thông tin liên hệ</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-gray-600">
                  {partner.address || <span className="text-gray-400">Chưa cập nhật</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                {partner.phone ? (
                  <a href={`tel:${partner.phone}`} className="text-primary hover:underline">
                    {partner.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Chưa cập nhật</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                {partner.email ? (
                  <a href={`mailto:${partner.email}`} className="text-primary hover:underline">
                    {partner.email}
                  </a>
                ) : (
                  <span className="text-gray-400">Chưa cập nhật</span>
                )}
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-gray-600">
                  {partner.hours || <span className="text-gray-400">Chưa cập nhật</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <ShieldCheck className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Đối tác được xác thực</p>
                <p className="text-xs text-blue-700">
                  Đã được RommZ kiểm tra và phê duyệt theo tiêu chuẩn chất lượng cao.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Đánh giá từ khách hàng</h4>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{partner.rating || 0}</span>
                <span className="text-xs text-gray-500">({partner.review_count || 0} đánh giá)</span>
              </div>
            </div>

            <div className="space-y-3">
              {isReviewsLoading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </>
              ) : reviews.length > 0 ? (
                reviews.slice(0, 3).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-white/70 bg-white/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {review.reviewer?.full_name || "Khách hàng RommZ"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.created_at
                            ? new Date(review.created_at).toLocaleDateString("vi-VN")
                            : "Mới đây"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={`${review.id}-${starIndex}`}
                            className={`h-4 w-4 ${
                              starIndex < Number(review.rating || 0) ? "fill-current" : ""
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {review.comment || "Khách hàng đánh giá tốt về trải nghiệm làm việc với đối tác này."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-white/70 p-4 text-sm text-muted-foreground">
                  Chưa có review chi tiết hiển thị công khai. Điểm tổng và số lượng đánh giá vẫn
                  được giữ lại để bạn tham khảo trước khi đặt dịch vụ.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              onClick={handleContactPartner}
              variant="outline"
              className={`h-12 rounded-full border-2 border-primary text-primary hover:bg-primary/10 ${showBookingCta ? "flex-1" : "w-full"}`}
            >
              <Phone className="mr-2 h-5 w-5" />
              Liên hệ
            </Button>
            {showBookingCta && (
              <Button
                onClick={handleBookService}
                className="h-12 flex-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
              >
                {isVoucher
                  ? <Gift className="mr-2 h-5 w-5" />
                  : <ExternalLink className="mr-2 h-5 w-5" />
                }
                {bookingLabel}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
