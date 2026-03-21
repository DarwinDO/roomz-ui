import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { ApplySubletDialog } from "@/components/modals/ApplySubletDialog";
import { GalleryModal } from "@/components/modals/GalleryModal";
import {
  ListingHostCard,
  ListingLocationContext,
  ListingMediaHero,
  ListingMetricGrid,
  ListingSafetyCard,
} from "@/components/listings";
import { useAuth } from "@/contexts";
import { useIncrementSubletView, useSublet } from "@/hooks/useSublets";
import { formatPriceInMillions } from "@roomz/shared/utils/format";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Heart,
  Images,
  MapPin,
  MessageCircle,
  Ruler,
  Share2,
  Sofa,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const amenityLabels: Array<{
  key:
    | "wifi"
    | "air_conditioning"
    | "parking"
    | "washing_machine"
    | "refrigerator"
    | "heater"
    | "security_camera"
    | "balcony";
  label: string;
}> = [
  { key: "wifi", label: "Wi‑Fi" },
  { key: "air_conditioning", label: "Điều hòa" },
  { key: "parking", label: "Chỗ để xe" },
  { key: "washing_machine", label: "Máy giặt" },
  { key: "refrigerator", label: "Tủ lạnh" },
  { key: "heater", label: "Bình nóng lạnh" },
  { key: "security_camera", label: "Camera an ninh" },
  { key: "balcony", label: "Ban công" },
];

function formatCompactMonthlyPrice(price: number | null | undefined) {
  if (!price || !Number.isFinite(price)) {
    return "Liên hệ";
  }

  if (price >= 1_000_000) {
    return `${formatPriceInMillions(price)}tr/tháng`;
  }

  return `${price.toLocaleString("vi-VN")}đ/tháng`;
}

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return "Đang cập nhật";
  }

  return `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`;
}

export default function SubletDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: sublet, isLoading, error } = useSublet(id);
  const incrementViewMutation = useIncrementSubletView();
  const trackedSubletViewId = useRef<string | null>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    if (!sublet?.id || trackedSubletViewId.current === sublet.id) {
      return;
    }

    trackedSubletViewId.current = sublet.id;
    incrementViewMutation.mutate(sublet.id);
  }, [incrementViewMutation, sublet?.id]);

  const images = useMemo(
    () =>
      sublet?.images
        ?.slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((image) => image.image_url) ?? [],
    [sublet?.images],
  );

  const room = sublet?.room;
  const owner = sublet?.owner;
  const title = room?.title || "Chỗ ở ngắn hạn";
  const location = [room?.address, room?.district, room?.city].filter(Boolean).join(", ");
  const isOwner = Boolean(user?.id && owner?.id && user.id === owner.id);
  const dateRange = formatDateRange(sublet?.start_date, sublet?.end_date);
  const hostName = owner?.full_name || "Host";

  const amenityItems = useMemo(
    () =>
      amenityLabels.filter((item) => Boolean(room?.amenities?.[item.key])),
    [room?.amenities],
  );

  const detailItems = useMemo(
    () => [
      {
        icon: Ruler,
        label: "Diện tích",
        value: room?.area_sqm ? `${room.area_sqm} m²` : "Đang cập nhật",
      },
      {
        icon: BedDouble,
        label: "Phòng ngủ",
        value: room?.bedroom_count ? `${room.bedroom_count} phòng` : "Đang cập nhật",
      },
      {
        icon: Bath,
        label: "Phòng tắm",
        value: room?.bathroom_count ? `${room.bathroom_count} phòng` : "Đang cập nhật",
      },
      {
        icon: Sofa,
        label: "Nội thất",
        value: room?.furnished ? "Có sẵn" : "Cơ bản / chưa rõ",
      },
    ],
    [room?.area_sqm, room?.bathroom_count, room?.bedroom_count, room?.furnished],
  );

  const handleBack = () => navigate(-1);
  const handleApplyShortStay = () => setIsApplyOpen(true);
  const handleMessageHost = () => {
    if (!owner?.id) {
      toast.error("Không thể nhắn host vì thiếu thông tin liên hệ.");
      return;
    }
    setIsContactOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="sticky top-0 z-20 border-b bg-card px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl md:aspect-video" />
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !sublet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Không tìm thấy tin ở ngắn hạn</h2>
          <p className="text-muted-foreground">
            Tin đăng này có thể đã bị gỡ hoặc hiện không còn khả dụng.
          </p>
          <Button onClick={() => navigate("/swap")} className="rounded-xl">
            Quay về danh sách ở ngắn hạn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                handleBack();
              }
            }}
            className="rounded-xl hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" disabled>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" disabled>
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <ListingMediaHero
          images={images}
          title={title}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          emptyStateText="Chưa có ảnh"
          topLeftBadges={[
            {
              id: "short-stay",
              label: (
                <>
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Ở ngắn hạn
                </>
              ),
              className: "border-0 bg-white/95 text-primary backdrop-blur-sm",
            },
          ]}
          topRightBadges={
            owner?.id_card_verified
              ? [
                  {
                    id: "host-verified",
                    label: (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Host đã xác thực
                      </>
                    ),
                    className: "border-0 bg-primary/95 text-white backdrop-blur-sm",
                  },
                ]
              : []
          }
          bottomRightActions={
            images.length ? (
              <Button onClick={() => setIsGalleryOpen(true)} className="rounded-xl bg-white/95 text-foreground hover:bg-white">
                <Images className="mr-2 h-4 w-4" />
                Xem tất cả ảnh
              </Button>
            ) : null
          }
        />

        <div className="px-4 py-6 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                    Ở ngắn hạn / thuê lại
                  </Badge>
                  {sublet.status !== "active" ? (
                    <Badge variant="outline" className="rounded-full">
                      {sublet.status}
                    </Badge>
                  ) : null}
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <p className="text-sm md:text-base">{location || "Đang cập nhật địa chỉ"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-primary">{formatCompactMonthlyPrice(sublet.sublet_price)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Giá ở ngắn hạn</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Thời gian trống</p>
                  <p className="text-sm font-medium text-foreground">{dateRange}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Giá gốc của phòng</p>
                  <p className="text-sm font-medium text-foreground">{formatCompactMonthlyPrice(sublet.original_price)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đặt cọc: {sublet.deposit_required ? formatCompactMonthlyPrice(sublet.deposit_required) : "Không yêu cầu thêm"}
                  </p>
                </div>
              </div>

              <ListingMetricGrid items={detailItems} />

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold">Giới thiệu về chỗ ở</h3>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {sublet.description || "Host chưa thêm mô tả cho chỗ ở ngắn hạn này."}
                </p>
              </div>

              {sublet.requirements?.length ? (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <h3 className="mb-3 text-lg font-semibold">Điều kiện lưu trú</h3>
                  <div className="flex flex-wrap gap-2">
                    {sublet.requirements.map((requirement) => (
                      <Badge key={requirement} variant="outline" className="rounded-full px-3 py-1 text-sm">
                        {requirement}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {amenityItems.length ? (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <h3 className="mb-3 text-lg font-semibold">Tiện ích chỗ ở</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenityItems.map((amenity) => (
                      <Badge key={amenity.key} variant="secondary" className="rounded-full px-3 py-1.5">
                        {amenity.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {room ? (
                <ListingLocationContext
                  listing={{
                    id: room.id,
                    title,
                    city: room.city,
                    district: room.district,
                    latitude: room.latitude,
                    longitude: room.longitude,
                    price_per_month: sublet.sublet_price,
                    images: sublet.images,
                  }}
                  nearbyTitle="Điểm mốc quanh chỗ ở"
                />
              ) : null}
            </div>

            <div className="space-y-6 md:sticky md:top-20 md:self-start">
              {owner ? (
                <ListingHostCard
                  name={hostName}
                  avatarUrl={owner.avatar_url}
                  isVerified={owner.id_card_verified || false}
                  roleLabel={isOwner ? "Bạn là host của tin đăng này" : "Host của chỗ ở ngắn hạn"}
                  email={owner.email || null}
                  trustScore={owner.trust_score ?? null}
                  onMessageClick={!isOwner ? handleMessageHost : undefined}
                  messageLabel="Nhắn host"
                  footer={
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-muted-foreground">Lượt xem</p>
                        <p className="mt-1 font-medium text-foreground">{sublet.view_count ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-muted-foreground">Đơn đăng ký</p>
                        <p className="mt-1 font-medium text-foreground">{sublet.application_count ?? 0}</p>
                      </div>
                    </div>
                  }
                />
              ) : null}

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <p className="mb-4 text-sm text-muted-foreground">
                  {isOwner
                    ? "Bạn đang xem tin ở ngắn hạn của mình. Quản lý đơn đăng ký hoặc cập nhật nội dung ngay tại đây."
                    : "Nếu thời gian và mức giá phù hợp, hãy gửi đơn đăng ký trước rồi nhắn host để chốt thêm các chi tiết cần thiết."}
                </p>
                {isOwner ? (
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => navigate(`/sublet/${id}/applications`)} variant="outline" className="h-11 rounded-xl">
                      <Users className="mr-2 h-4 w-4" />
                      Xem đơn đăng ký
                    </Button>
                    <Button onClick={() => navigate(`/sublet/${id}/edit`)} className="h-11 rounded-xl">
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa tin đăng
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button onClick={handleApplyShortStay} className="h-11 rounded-xl">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Đăng ký ở ngắn hạn
                    </Button>
                    <Button onClick={handleMessageHost} variant="outline" className="h-11 rounded-xl">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Nhắn host
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold">Thông tin nhanh</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CircleDollarSign className="h-4 w-4" />
                      Mức giá
                    </div>
                    <span className="font-medium text-foreground">{formatCompactMonthlyPrice(sublet.sublet_price)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Khả dụng
                    </div>
                    <span className="text-right font-medium text-foreground">{dateRange}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Khu vực
                    </div>
                    <span className="text-right font-medium text-foreground">{[room?.district, room?.city].filter(Boolean).join(", ") || "Đang cập nhật"}</span>
                  </div>
                </div>
              </div>

              <ListingSafetyCard description="Chỉ chuyển khoản khi bạn đã xác minh người đăng, thời gian ở và tình trạng chỗ ở. Nếu có thể, hãy xem phòng trực tiếp hoặc gọi video trước khi chốt." />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card px-4 py-3 shadow-lg md:hidden">
        {isOwner ? (
          <div className="mx-auto flex max-w-6xl gap-2">
            <Button onClick={() => navigate(`/sublet/${id}/applications`)} variant="outline" className="h-11 flex-1 rounded-full">
              <Users className="mr-2 h-4 w-4" />
              Đơn đăng ký
            </Button>
            <Button onClick={() => navigate(`/sublet/${id}/edit`)} className="h-11 flex-1 rounded-full">
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl gap-2">
            <Button onClick={handleMessageHost} variant="outline" className="h-11 flex-1 rounded-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Nhắn host
            </Button>
            <Button onClick={handleApplyShortStay} className="h-11 flex-[1.4] rounded-full">
              <CalendarDays className="mr-2 h-4 w-4" />
              Đăng ký ở ngắn hạn
            </Button>
          </div>
        )}
      </div>

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images.length ? images : [""]}
        initialIndex={currentImageIndex}
      />

      {!isOwner && owner ? (
        <ContactLandlordModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          landlord={{
            id: owner.id,
            full_name: owner.full_name || "Host",
            avatar_url: owner.avatar_url || null,
            email: owner.email || undefined,
          }}
          roomId={room?.id}
          roomTitle={title}
        />
      ) : null}

      {!isOwner ? (
        <ApplySubletDialog sublet={sublet} isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      ) : null}
    </div>
  );
}
