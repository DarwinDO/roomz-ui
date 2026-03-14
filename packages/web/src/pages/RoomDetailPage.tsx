import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Heart,
  Images,
  Map,
  MapPin,
  MessageCircle,
  Ruler,
  Share2,
  Sofa,
  Sparkles,
  Users,
  Wifi,
  ParkingCircle,
  UtensilsCrossed,
  WashingMachine,
  Snowflake,
  ShieldCheck,
  Fence,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookViewingModal } from "@/components/modals/BookViewingModal";
import { ContactLandlordModal } from "@/components/modals/ContactLandlordModal";
import { GalleryModal } from "@/components/modals/GalleryModal";
import { MapModal } from "@/components/modals/MapModal";
import { PhoneRevealButton } from "@/components/PhoneRevealButton";
import {
  ListingHostCard,
  ListingLocationContext,
  ListingMediaHero,
  ListingMetricGrid,
  ListingSafetyCard,
} from "@/components/listings";
import { useAuth } from "@/contexts";
import { useIsFavorited } from "@/hooks/useFavorites";
import { useRoom } from "@/hooks/useRooms";
import { supabase } from "@/lib/supabase";
import { trackFeatureEvent, trackRoomViewed } from "@/services/analyticsTracking";
import { formatPriceInMillions } from "@roomz/shared/utils/format";

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
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "air_conditioning", label: "Điều hòa", icon: Snowflake },
  { key: "parking", label: "Chỗ để xe", icon: ParkingCircle },
  { key: "washing_machine", label: "Máy giặt", icon: WashingMachine },
  { key: "refrigerator", label: "Tủ lạnh", icon: Snowflake },
  { key: "heater", label: "Bình nóng lạnh", icon: Snowflake },
  { key: "security_camera", label: "Camera an ninh", icon: ShieldCheck },
  { key: "balcony", label: "Ban công", icon: Fence },
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

function formatAvailability(date?: string | null) {
  if (!date) {
    return "Sẵn sàng ngay";
  }

  return format(new Date(date), "dd/MM/yyyy");
}

export default function RoomDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const trackedRoomViewId = useRef<string | null>(null);

  const { data: room, isLoading, error: queryError, refetch } = useRoom(id);
  const error = queryError?.message || null;

  const { data: subletData } = useQuery({
    queryKey: ["sublet-by-room", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error: subletError } = await supabase
        .from("sublet_listings")
        .select("id, status")
        .eq("original_room_id", id)
        .eq("status", "active")
        .maybeSingle();

      if (subletError) throw subletError;
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

  const images = useMemo(
    () =>
      room?.images
        ?.slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((image) => image.image_url) ?? [],
    [room?.images],
  );

  const amenityItems = useMemo(() => {
    const amenityList = amenityLabels.filter((item) => Boolean(room?.amenities?.[item.key]));

    if (room?.furnished) {
      amenityList.unshift({ key: "wifi", label: "Có nội thất", icon: Sofa });
    }

    return amenityList;
  }, [room?.amenities, room?.furnished]);

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

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Không tìm thấy phòng</h2>
          <p className="text-muted-foreground">{error || "Tin đăng này có thể đã bị gỡ hoặc hiện không còn khả dụng."}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/search")} className="rounded-xl">
              Quay về tìm phòng
            </Button>
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Tải lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const location = [room.address, room.district, room.city].filter(Boolean).join(", ");
  const hostName = room.landlord?.full_name || "Host";
  const quickFacts = [
    {
      icon: CircleDollarSign,
      label: "Mức giá",
      value: formatCompactMonthlyPrice(room.price_per_month),
    },
    {
      icon: CalendarDays,
      label: "Có thể dọn vào",
      value: formatAvailability(room.available_from),
    },
    {
      icon: Users,
      label: "Sức chứa",
      value: room.max_occupants ? `${room.max_occupants} người` : "Đang cập nhật",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" disabled>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted"
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <ListingMediaHero
          images={images}
          title={room.title}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          emptyStateText="Chưa có ảnh"
          topLeftBadges={[
            ...(room.is_verified
              ? [
                  {
                    id: "verified",
                    label: (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Tin đã xác minh
                      </>
                    ),
                    className: "border-0 bg-white/95 text-primary backdrop-blur-sm",
                  },
                ]
              : []),
            ...(room.has_360_photos
              ? [
                  {
                    id: "360",
                    label: (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Có ảnh 360°
                      </>
                    ),
                    className: "border-0 bg-primary/95 text-white backdrop-blur-sm",
                  },
                ]
              : []),
          ]}
          bottomRightActions={
            images.length ? (
              <div className="flex items-center gap-2">
                {room.latitude && room.longitude ? (
                  <Button variant="secondary" onClick={() => setIsMapOpen(true)} className="rounded-xl bg-white/90 text-foreground hover:bg-white">
                    <Map className="mr-2 h-4 w-4" />
                    Xem bản đồ
                  </Button>
                ) : null}
                <Button onClick={() => setIsGalleryOpen(true)} className="rounded-xl bg-white/95 text-foreground hover:bg-white">
                  <Images className="mr-2 h-4 w-4" />
                  Xem tất cả ảnh
                </Button>
              </div>
            ) : null
          }
        />

        <div className="px-4 py-6 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              {subletData ? (
                <div className="flex items-center justify-between gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-soft">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-primary">Ở ngắn hạn</p>
                    <h2 className="text-lg font-semibold">Phòng này hiện có lịch short-stay</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nếu bạn cần ở tạm thời hoặc thuê lại ngắn hạn, hãy xem ngay lịch khả dụng của listing này.
                    </p>
                  </div>
                  <Button onClick={() => navigate(`/sublet/${subletData.id}`)} className="rounded-xl">
                    Xem lịch ở ngắn hạn
                  </Button>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                    Phòng dài hạn
                  </Badge>
                  {room.room_type ? <Badge variant="outline" className="rounded-full">{room.room_type}</Badge> : null}
                </div>

                <div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{room.title}</h1>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <p className="text-sm md:text-base">{location || "Đang cập nhật địa chỉ"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-primary">{formatCompactMonthlyPrice(room.price_per_month)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Giá thuê mỗi tháng</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Có thể dọn vào</p>
                  <p className="text-sm font-medium text-foreground">{formatAvailability(room.available_from)}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Thông tin nhanh</p>
                  <p className="text-sm font-medium text-foreground">
                    {room.min_lease_term ? `Tối thiểu ${room.min_lease_term} tháng` : "Không giới hạn rõ"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đặt cọc: {room.deposit_amount ? formatCompactMonthlyPrice(room.deposit_amount) : "Thỏa thuận thêm"}
                  </p>
                </div>
              </div>

              <ListingMetricGrid items={detailItems} />

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold">Giới thiệu về chỗ ở</h3>
                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {room.description || "Host chưa thêm mô tả chi tiết cho phòng này."}
                </p>
              </div>

              {amenityItems.length ? (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                  <h3 className="mb-3 text-lg font-semibold">Tiện ích của phòng</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenityItems.map((amenity) => (
                      <Badge key={`${amenity.key}-${amenity.label}`} variant="secondary" className="rounded-full px-3 py-1.5">
                        {amenity.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <ListingLocationContext
                listing={{
                  id: room.id,
                  title: room.title,
                  city: room.city,
                  district: room.district,
                  latitude: room.latitude,
                  longitude: room.longitude,
                  price_per_month: room.price_per_month,
                  images: room.images,
                }}
                nearbyTitle="Điểm mốc quanh phòng"
                emptyCoordsText="Tin đăng này chưa có tọa độ đủ chính xác để hiển thị bản đồ và các điểm mốc lân cận."
              />
            </div>

            <div className="space-y-6 md:sticky md:top-20 md:self-start">
              <ListingHostCard
                name={hostName}
                avatarUrl={room.landlord?.avatar_url}
                email={room.landlord?.email}
                trustScore={Number(room.landlord?.trust_score) || null}
                roleLabel="Host của tin đăng này"
                onMessageClick={() => setIsContactHostOpen(true)}
                messageLabel="Nhắn host"
                footer={
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-muted-foreground">Lượt xem</p>
                        <p className="mt-1 font-medium text-foreground">{room.view_count ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-muted/50 p-3">
                        <p className="text-muted-foreground">Yêu thích</p>
                        <p className="mt-1 font-medium text-foreground">{room.favorite_count ?? 0}</p>
                      </div>
                    </div>
                    <PhoneRevealButton roomId={room.id} />
                  </div>
                }
              />

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <p className="mb-4 text-sm text-muted-foreground">
                  Nếu bạn muốn chốt nhanh, hãy nhắn host để xác nhận thời gian dọn vào, các khoản phí và điều kiện ở thực tế trước khi đặt cọc.
                </p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => setIsBookViewingOpen(true)} className="h-11 rounded-xl">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Đặt lịch xem phòng
                  </Button>
                  <Button onClick={() => setIsContactHostOpen(true)} variant="outline" className="h-11 rounded-xl">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Nhắn host
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold">Thông tin nhanh</h3>
                <div className="space-y-3 text-sm">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <fact.icon className="h-4 w-4" />
                        {fact.label}
                      </div>
                      <span className="text-right font-medium text-foreground">{fact.value}</span>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UtensilsCrossed className="h-4 w-4" />
                      Khu vực
                    </div>
                    <span className="text-right font-medium text-foreground">{[room.district, room.city].filter(Boolean).join(", ") || "Đang cập nhật"}</span>
                  </div>
                </div>
              </div>

              <ListingSafetyCard description="Chỉ chuyển khoản khi bạn đã xác minh người đăng, điều kiện ở và tình trạng thật của căn phòng. Nếu có thể, hãy xem phòng trực tiếp trước khi chốt." />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card px-4 py-3 shadow-lg md:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button onClick={() => setIsContactHostOpen(true)} variant="outline" className="h-11 flex-1 rounded-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Nhắn host
          </Button>
          <Button onClick={() => setIsBookViewingOpen(true)} className="h-11 flex-[1.4] rounded-full">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Đặt lịch xem
          </Button>
        </div>
      </div>

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
                full_name: room.landlord.full_name || "Host",
                avatar_url: room.landlord.avatar_url,
                email: room.landlord.email,
              }
            : undefined
        }
        roomId={room.id}
        roomTitle={room.title}
      />
      <GalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} images={images.length ? images : [""]} initialIndex={currentImageIndex} />
    </div>
  );
}
