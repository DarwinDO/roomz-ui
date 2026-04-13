import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bath,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Fence,
  Heart,
  MapPin,
  MessageCircle,
  ParkingCircle,
  Ruler,
  ShieldCheck,
  Snowflake,
  Sofa,
  Star,
  Users,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
} from "lucide-react";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookViewingModal } from "@/components/modals/BookViewingModal";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { GalleryModal } from "@/components/modals/GalleryModal";
import { MapModal } from "@/components/modals/MapModal";
import { PhoneRevealButton } from "@/components/PhoneRevealButton";
import { StitchFooter } from "@/components/common/StitchFooter";
import { useAuth } from "@/contexts";
import { useIsFavorited } from "@/hooks/useFavorites";
import { useRoom } from "@/hooks/useRooms";
import { supabase } from "@/lib/supabase";
import { stitchAssets } from "@/lib/stitchAssets";
import { trackFeatureEvent, trackRoomViewed } from "@/services/analyticsTracking";
import { searchRooms } from "@/services/rooms";
import { getReviews } from "@/services/reviews";
import { formatPriceInMillions } from "@roomz/shared/utils/format";

const InlineRoomMap = lazy(() =>
  import("@/components/maps").then((module) => ({ default: module.MapboxRoomMap })),
);

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
  icon: typeof Wifi;
}> = [
  { key: "wifi", label: "Wifi tốc độ cao", icon: Wifi },
  { key: "air_conditioning", label: "Máy lạnh Inverter", icon: Snowflake },
  { key: "parking", label: "Chỗ để xe an ninh", icon: ParkingCircle },
  { key: "washing_machine", label: "Máy giặt riêng", icon: WashingMachine },
  { key: "refrigerator", label: "Tủ lạnh riêng", icon: Snowflake },
  { key: "heater", label: "Nước nóng đầy đủ", icon: Snowflake },
  { key: "security_camera", label: "Camera giám sát", icon: ShieldCheck },
  { key: "balcony", label: "Ban công riêng", icon: Fence },
];

type RoomReview = Awaited<ReturnType<typeof getReviews>> extends Array<infer T> ? T : never;

function formatCompactMonthlyPrice(price: number | null | undefined) {
  if (!price || !Number.isFinite(price)) {
    return "Liên hệ";
  }

  if (price >= 1_000_000) {
    return `${formatPriceInMillions(price)}tr`;
  }

  return `${price.toLocaleString("vi-VN")}đ`;
}

function formatAvailability(date?: string | null) {
  if (!date) {
    return "Sẵn sàng ngay";
  }

  return format(new Date(date), "dd/MM/yyyy");
}

function formatRoomType(roomType?: string | null) {
  switch (roomType) {
    case "private":
      return "Phòng riêng";
    case "shared":
      return "Phòng ở ghép";
    case "studio":
      return "Studio";
    case "entire":
      return "Căn hộ nguyên căn";
    default:
      return "Đang cập nhật";
  }
}

function buildHighlightItems(room: NonNullable<ReturnType<typeof useRoom>["data"]>) {
  const highlights = [];

  if (room.max_occupants) {
    highlights.push(`Phù hợp tối đa ${room.max_occupants} người.`);
  }

  if (room.min_lease_term) {
    highlights.push(`Thời hạn thuê tối thiểu ${room.min_lease_term} tháng.`);
  }

  if (room.available_from) {
    highlights.push(`Có thể dọn vào từ ${formatAvailability(room.available_from)}.`);
  }

  if (room.is_verified) {
    highlights.push("Tin đăng đã được hệ thống xác minh.");
  }

  return highlights;
}

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const trackedRoomViewId = useRef<string | null>(null);

  const { data: room, isLoading, error: queryError, refetch } = useRoom(id);
  const error = queryError instanceof Error ? queryError.message : null;

  const { data: subletData } = useQuery({
    queryKey: ["sublet-by-room", id],
    queryFn: async () => {
      if (!id) {
        return null;
      }

      const { data, error: subletError } = await supabase
        .from("sublet_listings")
        .select("id, status")
        .eq("original_room_id", id)
        .eq("status", "active")
        .maybeSingle();

      if (subletError) {
        throw subletError;
      }

      return data;
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const { isFavorited, toggle: toggleFavorite, loading: favoriteLoading } = useIsFavorited(id || "");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookViewingOpen, setIsBookViewingOpen] = useState(false);
  const [isContactHostOpen, setIsContactHostOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    if (!room?.id || trackedRoomViewId.current === room.id) {
      return;
    }

    trackedRoomViewId.current = room.id;
    void trackRoomViewed(user?.id ?? null, room.id, room.title, Number(room.price_per_month ?? 0));
  }, [room, user?.id]);

  const roomImages = useMemo(
    () =>
      room?.images
        ?.slice()
        .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0))
        .map((image) => image.image_url) ?? [],
    [room?.images],
  );

  // gridImages: only real uploaded photos — no placeholders.
  // The grid renders slots conditionally so it gracefully handles 1–3 images.
  const gridImages = roomImages;

  const amenityItems = useMemo(() => {
    const amenityList = amenityLabels.filter((item) => Boolean(room?.amenities?.[item.key]));

    if (room?.furnished) {
      amenityList.unshift({ key: "wifi", label: "Nội thất cơ bản", icon: Sofa });
    }

    return amenityList;
  }, [room?.amenities, room?.furnished]);

  const detailItems = useMemo(
    () => [
      {
        icon: CircleDollarSign,
        label: "Giá thuê",
        value: `${formatCompactMonthlyPrice(room?.price_per_month)}/tháng`,
      },
      {
        icon: Ruler,
        label: "Diện tích",
        value: room?.area_sqm ? `${room.area_sqm}m²` : "Đang cập nhật",
      },
      {
        icon: BedDouble,
        label: "Phòng ngủ",
        value: room?.bedroom_count ? `${room.bedroom_count} phòng` : "Studio / mở",
      },
      {
        icon: Bath,
        label: "Phòng tắm",
        value: room?.bathroom_count ? `${room.bathroom_count} phòng` : "Dùng riêng / chưa rõ",
      },
    ],
    [room?.area_sqm, room?.bathroom_count, room?.bedroom_count, room?.price_per_month],
  );

  const { data: reviews = [] } = useQuery<RoomReview[]>({
    queryKey: ["room-reviews", room?.id],
    queryFn: () => getReviews(room!.id, "room"),
    enabled: Boolean(room?.id),
    staleTime: 60_000,
  });

  const { data: relatedRooms = [] } = useQuery({
    queryKey: ["related-rooms", room?.id, room?.district, room?.room_type],
    queryFn: async () => {
      if (!room) {
        return [];
      }

      const response = await searchRooms({
        district: room.district ?? undefined,
        roomTypes: room.room_type ? [room.room_type] : undefined,
        minPrice: room.price_per_month ? Math.max(0, room.price_per_month - 1_500_000) : undefined,
        maxPrice: room.price_per_month ? room.price_per_month + 1_500_000 : undefined,
        page: 1,
        pageSize: 4,
      });

      return response.rooms.filter((candidate) => candidate.id !== room.id).slice(0, 3);
    },
    enabled: Boolean(room),
    staleTime: 60_000,
  });

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu phòng yêu thích.");
      navigate("/login");
      return;
    }

    try {
      const shouldTrackFavorite = !isFavorited;
      await toggleFavorite();

      if (shouldTrackFavorite) {
        void trackFeatureEvent("room_favorite", user.id, {
          room_id: room?.id ?? null,
          room_title: room?.title ?? null,
          city: room?.city ?? null,
          district: room?.district ?? null,
          price: room?.price_per_month ?? null,
          source: "room_detail",
        });
      }

      toast.success(isFavorited ? "Đã bỏ khỏi danh sách yêu thích." : "Đã thêm vào danh sách yêu thích.");
    } catch {
      toast.error("Không thể cập nhật danh sách yêu thích.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <Skeleton className="mb-10 h-[420px] w-full rounded-[32px]" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Skeleton className="h-10 w-64 rounded-full" />
              <Skeleton className="h-16 w-5/6 rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-[32px]" />
              <Skeleton className="h-72 w-full rounded-[32px]" />
            </div>
            <Skeleton className="h-[420px] w-full rounded-[32px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-lg rounded-[32px] border border-outline-variant/20 bg-white p-10 text-center shadow-sm">
          <h2 className="text-3xl text-on-surface">Không tìm thấy phòng</h2>
          <p className="mt-3 text-base leading-8 text-on-surface-variant">
            {error || "Tin đăng này hiện không còn khả dụng hoặc đã được gỡ khỏi hệ thống."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/search")}>Quay về tìm phòng</Button>
            <Button variant="outline" onClick={() => refetch()}>
              Tải lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const location = [room.address, room.district, room.city].filter(Boolean).join(", ");
  const displayImages = gridImages.slice(0, 4);
  const extraImageCount = Math.max(roomImages.length - 4, 0);
  const descriptionHighlights = buildHighlightItems(room);
  const hostRating = room.landlord?.trust_score
    ? Math.min(5, Math.max(4, room.landlord.trust_score / 20)).toFixed(1)
    : "5.0";
  const hostAvatar = room.landlord?.avatar_url || stitchAssets.roomDetail.reviewAvatars[0];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main
        className="mx-auto max-w-7xl px-6 pb-20 pt-24"
        aria-label="Noi dung chinh chi tiet phong, skip link duoc cung cap boi AppShell"
      >
        <section className="mb-12 grid gap-4 lg:grid-cols-[minmax(0,1.24fr)_minmax(0,0.96fr)]">
          <div
            role="button"
            tabIndex={0}
            className="group relative overflow-hidden rounded-[32px]"
            onClick={() => {
              setCurrentImageIndex(0);
              setIsGalleryOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setCurrentImageIndex(0);
                setIsGalleryOpen(true);
              }
            }}
          >
            <img
              src={displayImages[0]}
              alt={room.title}
              className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {room.is_available ? (
                <Badge className="rounded-full bg-tertiary-container px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-tertiary-container">
                  Phòng trống
                </Badge>
              ) : null}
              {room.is_verified ? (
                <Badge className="rounded-full bg-secondary-container px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-secondary-container">
                  Tin xác minh
                </Badge>
              ) : null}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleFavoriteClick();
              }}
              disabled={favoriteLoading}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-on-surface shadow-lg transition hover:bg-white"
              aria-label={isFavorited ? "Bỏ yêu thích" : "Lưu phòng yêu thích"}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayImages.slice(1, 3).map((image, index) => {
              const imageIndex = index + 1;

              return (
                <button
                  key={`${image}-${imageIndex}`}
                  type="button"
                  className="group relative overflow-hidden rounded-[32px]"
                  onClick={() => {
                    setCurrentImageIndex(imageIndex);
                    setIsGalleryOpen(true);
                  }}
                >
                  <img
                    src={image}
                    alt={`${room.title} - ảnh ${imageIndex + 1}`}
                    className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </button>
              );
            })}

            {displayImages[3] ? (
              <button
                type="button"
                className="group relative overflow-hidden rounded-[32px] sm:col-span-2"
                onClick={() => {
                  setCurrentImageIndex(3);
                  setIsGalleryOpen(true);
                }}
              >
                <img
                  src={displayImages[3]}
                  alt={`${room.title} - ảnh 4`}
                  className="aspect-[2.08/1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {extraImageCount > 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest/78">
                    <span className="text-lg font-bold text-on-surface">+{extraImageCount} ảnh</span>
                  </div>
                ) : null}
              </button>
            ) : null}
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <section className="mb-10">
              <div className="mb-4 flex flex-wrap gap-3">
                <Badge className="rounded-full bg-tertiary-container px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-tertiary-container">
                  {room.is_available ? "Phòng trống" : "Theo lịch chủ nhà"}
                </Badge>
                <Badge className="rounded-full bg-secondary-container px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-secondary-container">
                  {room.is_verified ? "Premium match" : "Tin đang hoạt động"}
                </Badge>
                {subletData ? (
                  <Badge className="rounded-full bg-primary-container px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-primary-container">
                    Có lịch short-stay
                  </Badge>
                ) : null}
              </div>

              <h1 className="text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
                {room.title}
              </h1>
              <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-lg">{location}</span>
              </div>

              <div className="mt-8 grid gap-6 rounded-[32px] bg-surface-container-low p-6 sm:grid-cols-2 xl:grid-cols-4 xl:p-8">
                {detailItems.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-on-surface-variant">{item.label}</span>
                    <span className="text-xl font-bold text-on-surface xl:text-2xl">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-on-surface">Tiện ích căn hộ</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {amenityItems.length ? (
                  amenityItems.map((amenity) => (
                    <div
                      key={`${amenity.key}-${amenity.label}`}
                      className="flex items-center gap-4 rounded-[24px] bg-surface-container-lowest p-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                        <amenity.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-on-surface">{amenity.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-surface-container-lowest p-6 text-sm leading-7 text-on-surface-variant shadow-sm md:col-span-2 xl:col-span-3">
                    Chủ nhà chưa cập nhật chi tiết tiện ích cho tin đăng này.
                  </div>
                )}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-on-surface">Mô tả chi tiết</h2>
              <div className="rounded-[32px] bg-surface-container-lowest p-8 shadow-sm">
                <p className="text-base leading-8 text-on-surface-variant">
                  {room.description || "Tin đăng chưa có mô tả chi tiết. Hãy nhắn host để xác nhận thêm điều kiện ở thực tế."}
                </p>

                {descriptionHighlights.length ? (
                  <ul className="mt-6 space-y-3">
                    {descriptionHighlights.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-7 text-on-surface-variant">
                        <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-on-surface">Vị trí &amp; xung quanh</h2>
              <div className="relative overflow-hidden rounded-[32px] bg-surface-container-high">
                <Suspense
                  fallback={<div className="h-80 w-full animate-pulse bg-surface-container-low" />}
                >
                  <InlineRoomMap
                    rooms={[room]}
                    singleRoom
                    interactive={Boolean(room.latitude && room.longitude)}
                    className="h-80 rounded-none border-0"
                  />
                </Suspense>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-[24px] bg-white/92 p-4 shadow-lg backdrop-blur">
                  <div>
                    <h3 className="font-bold text-on-surface">{[room.district, room.city].filter(Boolean).join(", ")}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {room.address || "Xác nhận vị trí chi tiết trực tiếp với chủ nhà."}
                    </p>
                  </div>
                  <Button
                    className="rounded-full bg-primary-container text-on-primary-container hover:bg-primary-container/90"
                    onClick={() => setIsMapOpen(true)}
                    disabled={!room.latitude || !room.longitude}
                  >
                    Chỉ đường
                  </Button>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-on-surface">Đánh giá khách thuê</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-on-surface">
                    {averageRating ? averageRating.toFixed(1) : "—"}
                  </span>
                  <div className="flex text-secondary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${index < Math.round(averageRating) ? "fill-current" : ""}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-on-surface-variant">
                    ({reviews.length} đánh giá)
                  </span>
                </div>
              </div>

              {reviews.length ? (
                <div className="space-y-6">
                  {reviews.slice(0, 2).map((review, index) => (
                    <article
                      key={review.id}
                      className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <PremiumAvatar
                            isPremium={review.reviewer?.is_premium ?? false}
                            className="h-12 w-12"
                          >
                            <AvatarImage
                              src={review.reviewer?.avatar_url || stitchAssets.roomDetail.reviewAvatars[index % stitchAssets.roomDetail.reviewAvatars.length]}
                              alt={review.reviewer?.full_name || "Khách thuê"}
                            />
                            <AvatarFallback className="bg-surface-container-highest text-xs font-semibold text-on-surface">
                              {(review.reviewer?.full_name || "K")
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </PremiumAvatar>
                          <div>
                            <h3 className="font-bold text-on-surface">
                              {review.reviewer?.full_name || "Khách thuê"}
                            </h3>
                            <p className="text-xs text-on-surface-variant">
                              {review.created_at
                                ? format(new Date(review.created_at), "dd/MM/yyyy")
                                : "Đánh giá gần đây"}
                            </p>
                          </div>
                        </div>
                        <div className="flex scale-90 text-secondary">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Star
                              key={`${review.id}-${starIndex}`}
                              className={`h-4 w-4 ${starIndex < Number(review.rating || 0) ? "fill-current" : ""}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-7 text-on-surface-variant">
                        {review.comment || "Khách thuê đánh giá tốt về trải nghiệm ở và mức độ hỗ trợ của chủ nhà."}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-sm">
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Chưa có đánh giá công khai cho căn này. Bạn có thể nhắn chủ nhà để xin thêm phản hồi từ người ở trước.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[32px] border border-outline-variant/10 bg-white p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <PremiumAvatar
                    isPremium={room.landlord?.is_premium ?? false}
                    className="h-24 w-24 ring-4 ring-primary-container/20"
                  >
                    <AvatarImage src={hostAvatar} alt={room.landlord?.full_name || "Chủ nhà"} />
                    <AvatarFallback className="bg-surface-container-high text-lg font-semibold text-on-surface">
                      {(room.landlord?.full_name || "H")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </PremiumAvatar>
                </div>
                <h2 className="text-xl font-bold text-on-surface">
                  {room.landlord?.full_name || "Chủ nhà RommZ"}
                </h2>
                <div className="mt-2 flex items-center justify-center gap-1 text-secondary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{hostRating}</span>
                  <span className="ml-1 text-xs font-normal text-on-surface-variant">• Chủ nhà uy tín</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="stitch-primary-gradient h-14 w-full rounded-full text-base font-bold text-white"
                  onClick={() => setIsContactHostOpen(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Nhắn tin ngay
                </Button>

                <div className="[&_button]:h-14 [&_button]:w-full [&_button]:rounded-full [&_button]:border-none [&_button]:bg-surface-container-highest [&_button]:font-bold [&_button]:text-on-primary-container [&_button]:text-base [&_button]:hover:bg-surface-container-high">
                  <PhoneRevealButton roomId={room.id} />
                </div>

                <Button
                  variant="outline"
                  className="h-14 w-full rounded-full border-outline-variant/30 bg-white text-base"
                  onClick={() => setIsBookViewingOpen(true)}
                >
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Đặt lịch xem phòng
                </Button>
              </div>

              <div className="mt-6 border-t border-outline-variant/10 pt-6">
                <p className="text-center text-xs italic leading-6 text-on-surface-variant">
                  “Cam kết phản hồi người thuê trong vòng 24 giờ và hỗ trợ rõ ràng trước khi chốt cọc.”
                </p>
              </div>

              <div className="mt-6 grid gap-3 rounded-[24px] bg-surface-container-low p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <Users className="h-4 w-4" />
                    Sức chứa
                  </span>
                  <span className="font-semibold text-on-surface">
                    {room.max_occupants ? `${room.max_occupants} người` : "Đang cập nhật"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <CalendarDays className="h-4 w-4" />
                    Dọn vào
                  </span>
                  <span className="font-semibold text-on-surface">{formatAvailability(room.available_from)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-on-surface-variant">
                    <UtensilsCrossed className="h-4 w-4" />
                    Đặt cọc
                  </span>
                  <span className="font-semibold text-on-surface">
                    {room.deposit_amount ? `${formatCompactMonthlyPrice(room.deposit_amount)}` : "Thỏa thuận"}
                  </span>
                </div>
              </div>

              {subletData ? (
                <div className="mt-4 rounded-[24px] bg-primary-container/20 p-4 text-sm leading-7 text-on-surface-variant">
                  Tin này hiện có lịch short-stay.{" "}
                  <button
                    type="button"
                    className="font-bold text-primary"
                    onClick={() => navigate(`/sublet/${subletData.id}`)}
                  >
                    Xem lịch ở ngắn hạn
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] bg-surface-container-low p-6">
              <div className="flex gap-4">
                <ShieldCheck className="h-5 w-5 text-secondary" />
                <div>
                  <h3 className="font-bold text-on-surface">Mẹo an toàn</h3>
                  <p className="mt-1 text-xs leading-6 text-on-surface-variant">
                    Luôn xem phòng trực tiếp và yêu cầu hợp đồng rõ ràng trước khi chuyển khoản tiền cọc.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {relatedRooms.length ? (
          <section className="mt-20">
            <h2 className="mb-10 text-3xl font-extrabold text-on-surface">
              Phòng tương tự tại {room.district || room.city || "khu vực này"}
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedRooms.map((relatedRoom, index) => (
                <button
                  key={relatedRoom.id}
                  type="button"
                  onClick={() => navigate(`/room/${relatedRoom.id}`)}
                  className="group overflow-hidden rounded-[28px] bg-surface-container-lowest text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={relatedRoom.images?.[0]?.image_url || stitchAssets.roomDetail.related[index % stitchAssets.roomDetail.related.length]}
                      alt={relatedRoom.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {index === 0 ? (
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary">
                        Giá tốt
                      </div>
                    ) : null}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-on-surface">{relatedRoom.title}</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {[relatedRoom.district, relatedRoom.city].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">
                        {formatCompactMonthlyPrice(relatedRoom.price_per_month)}
                        <span className="text-xs font-normal text-on-surface-variant">/tháng</span>
                      </span>
                      <span className="text-sm font-medium text-on-surface-variant">
                        {relatedRoom.area_sqm ? `${relatedRoom.area_sqm}m²` : formatRoomType(relatedRoom.room_type)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <StitchFooter />

      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} room={room} />
      <BookViewingModal
        isOpen={isBookViewingOpen}
        onClose={() => setIsBookViewingOpen(false)}
        roomId={room.id}
        landlordId={room.landlord_id}
        roomTitle={room.title}
      />
      <ContactLandlordModal
        isOpen={isContactHostOpen}
        onClose={() => setIsContactHostOpen(false)}
        landlord={
          room.landlord
            ? {
                id: room.landlord_id,
                full_name: room.landlord.full_name || "Chủ nhà",
                avatar_url: room.landlord.avatar_url,
                email: room.landlord.email,
                is_premium: room.landlord.is_premium,
              }
            : undefined
        }
        roomId={room.id}
        roomTitle={room.title}
      />
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={roomImages.length ? roomImages : [""]}
        initialIndex={Math.min(currentImageIndex, Math.max(0, roomImages.length - 1))}
      />
    </div>
  );
}
