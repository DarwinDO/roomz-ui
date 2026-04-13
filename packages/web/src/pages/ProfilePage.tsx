import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Clock3,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileEditModal } from "@/components/modals/ProfileEditModal";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumAvatar } from "@/components/ui/PremiumAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts";
import { useTenantBookings } from "@/hooks/useBookings";
import { useFavorites } from "@/hooks/useFavorites";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { useRoommateMatchesQuery } from "@/hooks/useRoommatesQuery";
import {
  getPreferredSearchAreaSourceLabel,
  loadPreferredSearchArea,
  type PreferredSearchArea,
} from "@/lib/preferredSearchArea";
import { stitchAssets } from "@/lib/stitchAssets";
import { searchLocationCatalog } from "@/services/locations";
import { transformRoomToCardProps } from "@/utils/room";
import { UPGRADE_SOURCES } from "@roomz/shared/constants/tracking";
import { getUserInitials } from "@roomz/shared/utils/user";
import { BookingsTab } from "./profile/components/BookingsTab";
import { MyServicesTab } from "./profile/components/MyServicesTab";
import { SettingsTab } from "./profile/components/SettingsTab";

type DetailPanel = "favorites" | "bookings" | "settings" | "services" | null;
type SavedRoomCard = ReturnType<typeof transformRoomToCardProps>;

const ShopMiniMapbox = lazy(() =>
  import("@/components/maps/ShopMiniMapbox").then((module) => ({ default: module.ShopMiniMapbox })),
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, isEmailVerified, loading: authLoading } = useAuth();
  const { isPremium, premiumUntil } = usePremiumLimits();
  const {
    favorites,
    loading: favoritesLoading,
    error: favoritesError,
    refetch: refetchFavorites,
    toggleFavorite,
  } = useFavorites();
  const { bookings, loading: bookingsLoading } = useTenantBookings();
  const { matches, loading: matchesLoading } = useRoommateMatchesQuery();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);
  const [preferredArea, setPreferredArea] = useState<PreferredSearchArea | null>(null);
  const [resolvedPreferredArea, setResolvedPreferredArea] = useState<PreferredSearchArea | null>(null);

  const savedRooms = useMemo<SavedRoomCard[]>(
    () =>
      favorites
        .filter((favorite) => favorite.room)
        .map((favorite) => transformRoomToCardProps(favorite.room!, true)),
    [favorites],
  );

  const trustScore = useMemo(() => {
    let score = 0;
    if (isEmailVerified || profile?.email_verified) score += 30;
    if (profile?.phone_verified) score += 20;
    if (profile?.id_card_verified) score += 30;
    if (profile?.student_card_verified) score += 20;
    return score;
  }, [
    isEmailVerified,
    profile?.email_verified,
    profile?.id_card_verified,
    profile?.phone_verified,
    profile?.student_card_verified,
  ]);

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "pending" || booking.status === "confirmed")
        .sort(
          (left, right) =>
            new Date(left.booking_date).getTime() - new Date(right.booking_date).getTime(),
        ),
    [bookings],
  );

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Thành viên RommZ";
  const displaySubtitle =
    profile?.major && profile?.university
      ? `${profile.major} • ${profile.university}`
      : profile?.university || user?.email || "Thiết lập hồ sơ để nhận gợi ý đúng gu hơn.";
  const locationLabel = profile?.university || profile?.major || "";
  const personaLabel =
    profile?.role === "landlord"
      ? "Chủ nhà"
      : profile?.role === "student"
        ? "Sinh viên"
        : profile?.major || "Thành viên";

  useEffect(() => {
    setPreferredArea(loadPreferredSearchArea(user?.id ?? null));
  }, [user?.id]);

  useEffect(() => {
    let isCancelled = false;

    if (!preferredArea) {
      setResolvedPreferredArea(null);
      return () => {
        isCancelled = true;
      };
    }

    const hasCoordinates =
      typeof preferredArea.latitude === "number" && typeof preferredArea.longitude === "number";

    if (hasCoordinates) {
      setResolvedPreferredArea(preferredArea);
      return () => {
        isCancelled = true;
      };
    }

    const fallbackQuery = preferredArea.label || preferredArea.district || preferredArea.city || "";
    setResolvedPreferredArea(preferredArea);

    if (fallbackQuery.trim().length < 2) {
      return () => {
        isCancelled = true;
      };
    }

    void searchLocationCatalog({ query: fallbackQuery, limit: 1 })
      .then((matches) => {
        if (isCancelled || matches.length === 0) {
          return;
        }

        const [firstMatch] = matches;
        if (firstMatch.latitude === null || firstMatch.longitude === null) {
          return;
        }

        setResolvedPreferredArea({
          ...preferredArea,
          latitude: Number(firstMatch.latitude),
          longitude: Number(firstMatch.longitude),
          city: preferredArea.city ?? firstMatch.city,
          district: preferredArea.district ?? firstMatch.district,
          address: preferredArea.address ?? firstMatch.address,
          label: preferredArea.label || firstMatch.name,
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setResolvedPreferredArea(preferredArea);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [preferredArea]);

  const recentActivities = useMemo(() => {
    const items: Array<{ title: string; time: string; accent: "primary" | "muted" }> = [];

    if (upcomingBookings[0]?.room?.title) {
      items.push({
        title: `Lịch xem phòng "${truncateText(upcomingBookings[0].room.title, 28)}"`,
        time: formatRelativeTime(upcomingBookings[0].booking_date),
        accent: "primary",
      });
    }

    if (savedRooms[0]?.title) {
      items.push({
        title: `Đã lưu "${truncateText(savedRooms[0].title, 28)}"`,
        time: "Vừa xong",
        accent: "muted",
      });
    }

    if (profile?.updated_at) {
      items.push({
        title: "Cập nhật thông tin hồ sơ",
        time: formatRelativeTime(profile.updated_at),
        accent: "muted",
      });
    }

    return items.slice(0, 3);
  }, [profile?.updated_at, savedRooms, upcomingBookings]);

  const preferredAreaChips = useMemo(
    () =>
      Array.from(
        new Set(
          [
            preferredArea?.district,
            preferredArea?.city,
            preferredArea?.radiusKm ? `Bán kính ${preferredArea.radiusKm} km` : null,
            preferredArea ? getPreferredSearchAreaSourceLabel(preferredArea.source) : null,
          ].filter(Boolean),
        ),
      ).slice(0, 4) as string[],
    [preferredArea],
  );

  const preferredAreaSearchPath = preferredArea?.searchPath || "/search";
  const preferredAreaDescription = preferredArea
    ? `Đồng bộ từ lần tìm gần nhất ${formatRelativeTime(preferredArea.updatedAt)}. RommZ sẽ mở lại đúng vùng này để bạn tiếp tục so sánh phòng nhanh hơn.`
    : "Khi bạn khóa khu vực trong trang tìm phòng, RommZ sẽ ghi nhớ và đưa bạn quay lại đúng vùng đó ngay từ hồ sơ.";
  const handleRemoveFavorite = async (roomId: string) => {
    try {
      await toggleFavorite(roomId);
      toast.success("Đã xóa khỏi danh sách đã lưu");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Không thể cập nhật danh sách đã lưu");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Không thể đăng xuất");
    }
  };

  if (authLoading) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6 pt-28 pb-16">
          <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 shadow-soft">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Đang tải hồ sơ RommZ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pb-20 md:pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="flex flex-col gap-8 lg:col-span-4">
            <Card className="relative overflow-hidden rounded-[32px] border border-white/70 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-container)_100%)] opacity-10" />
              <div className="relative mt-4 flex flex-col items-center text-center">
                <div className="relative">
                  <PremiumAvatar
                    isPremium={profile?.is_premium ?? false}
                    className="h-32 w-32 border-4 border-surface-container-lowest shadow-[0_20px_40px_rgba(40,43,81,0.12)]"
                  >
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || user?.email || "Ảnh đại diện"}
                    />
                    <AvatarFallback className="bg-primary/10 font-display text-3xl text-primary">
                      {getUserInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </PremiumAvatar>
                  {(trustScore >= 80 || profile?.id_card_verified) ? (
                    <div className="absolute right-1 bottom-1 flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-tertiary-container shadow-sm">
                      <ShieldCheck className="h-3 w-3" />
                      Emerald
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  <h1 className="font-display text-3xl text-on-surface">{displayName}</h1>
                  <p className="mt-2 text-sm text-on-surface-variant">{displaySubtitle}</p>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {locationLabel ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {locationLabel}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {personaLabel}
                  </span>
                </div>

                <div className="mt-8 w-full rounded-[28px] bg-surface-container-low p-6 text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Phong cách sống
                  </p>
                  <p className="mt-3 text-sm leading-7 text-on-surface">
                    {profile?.bio ||
                      "Ưu tiên không gian gọn gàng, lịch sinh hoạt rõ ràng và những kết nối ở ghép đủ tin cậy để bắt đầu nhanh hơn."}
                  </p>
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-4">
                  <ProfileMetric value={`${trustScore}%`} label="Tin cậy" />
                  <ProfileMetric value={`${matches.length}`} label="Kết nối" />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-[32px] border border-primary/10 bg-[linear-gradient(135deg,#121739_0%,#2147d0_56%,#82a6ff_100%)] p-8 text-white shadow-[0_24px_48px_rgba(6,9,47,0.24)]">
              <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/18 blur-3xl" />
              <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-[#ffcf8c]/25 blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/90 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-[#ffd797]" />
                  RommZ+
                </div>
                <p className="mt-5 font-display text-[1.65rem] leading-tight text-white">
                  {isPremium
                    ? "Lớp ưu tiên của bạn đang hoạt động."
                    : "Mở khóa lớp ưu tiên của RommZ."}
                </p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/84">
                  {isPremium
                    ? "RommZ+ của bạn đang hoạt động. Hồ sơ, contact và quyền lợi deal hiện đã được ưu tiên hiển thị."
                    : "Mở khóa gợi ý phòng độc quyền, quyền liên hệ nhanh và lớp ưu tiên hiển thị hồ sơ khi bạn sẵn sàng chốt nơi ở."}
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/payment?source=${UPGRADE_SOURCES.PROFILE_BANNER}`)
                  }
                  className="mt-6 w-full rounded-full border-white/70 bg-none bg-white text-primary shadow-none hover:bg-white/95 hover:text-primary"
                >
                  {isPremium ? "Xem gói của bạn" : "Nâng cấp ngay"}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[32px] border border-white/70 bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
              <h2 className="font-display text-lg text-on-surface">Hoạt động gần đây</h2>
              <div className="mt-6 space-y-6">
                {recentActivities.length > 0 ? (
                  recentActivities.map((item, index) => (
                    <ActivityItem
                      key={`${item.title}-${index}`}
                      title={item.title}
                      time={item.time}
                      accent={item.accent}
                      isLast={index === recentActivities.length - 1}
                    />
                  ))
                ) : (
                  <p className="text-sm leading-7 text-on-surface-variant">
                    Hoạt động của bạn sẽ xuất hiện ở đây sau khi lưu phòng, đặt lịch xem, hoặc cập nhật hồ sơ.
                  </p>
                )}
              </div>
            </Card>
          </aside>

          <div className="flex flex-col gap-10 lg:col-span-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Card className="rounded-[32px] border border-white/70 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg text-on-surface">Phòng đã lưu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                    onClick={() => setDetailPanel("favorites")}
                  >
                    Xem tất cả
                  </Button>
                </div>

                {favoritesLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-4 rounded-[22px] bg-surface-container-low p-3"
                      >
                        <div className="h-16 w-20 animate-skeleton rounded-2xl bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-2/3 animate-skeleton rounded-full bg-muted" />
                          <div className="h-3 w-1/2 animate-skeleton rounded-full bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : favoritesError ? (
                  <div className="rounded-[24px] bg-destructive/5 px-5 py-6 text-sm text-destructive">
                    <p>{favoritesError}</p>
                    <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={refetchFavorites}>
                      Thử lại
                    </Button>
                  </div>
                ) : savedRooms.length === 0 ? (
                  <EmptyStateCard
                    title="Chưa có phòng đã lưu"
                    description="Lưu những căn phù hợp để quay lại so sánh nhanh hơn khi bạn cần chốt nơi ở."
                    actionLabel="Tìm phòng ngay"
                    onAction={() => navigate("/search")}
                  />
                ) : (
                  <div className="space-y-4">
                    {savedRooms.slice(0, 2).map((room, index) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => navigate(`/room/${room.id}`)}
                        className="group flex w-full items-center gap-4 rounded-[22px] p-3 text-left transition-colors hover:bg-surface-container-low"
                      >
                        <div className="h-16 w-20 overflow-hidden rounded-2xl">
                          <img
                            src={room.image || stitchAssets.roomDetail.related[index]}
                            alt={room.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-on-surface">{room.title}</p>
                          <p className="mt-1 truncate text-xs text-on-surface-variant">{room.location}</p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                            {formatCompactPrice(room.price)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="rounded-[32px] border border-white/70 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg text-on-surface">Lịch xem phòng</h2>
                  <button
                    type="button"
                    onClick={() => setDetailPanel("bookings")}
                    className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container"
                  >
                    {upcomingBookings.length} sắp tới
                  </button>
                </div>

                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((item) => (
                      <div key={item} className="rounded-r-[20px] border-l-4 border-primary/20 bg-surface-container-low p-4">
                        <div className="h-3 w-24 animate-skeleton rounded-full bg-muted" />
                        <div className="mt-3 h-4 w-2/3 animate-skeleton rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <EmptyStateCard
                    title="Chưa có lịch xem phòng"
                    description="Khi bạn đặt lịch xem phòng, các mốc sắp tới sẽ hiện ngay trong bảng điều khiển này."
                    actionLabel="Khám phá phòng"
                    onAction={() => navigate("/search")}
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.slice(0, 2).map((booking) => (
                      <div key={booking.id} className="rounded-r-[20px] border-l-4 border-primary bg-surface-container-low p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                          {formatBookingMeta(booking.booking_date)}
                        </p>
                        <p className="mt-2 text-sm font-bold text-on-surface">
                          {booking.room?.title || "Lịch xem phòng sắp tới"}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-on-surface-variant">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>{booking.landlord?.full_name || "Chủ nhà đang cập nhật"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="rounded-[32px] border border-white/70 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)] md:col-span-2">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg text-on-surface">Gợi ý người ở cùng</h2>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Dựa trên phong cách sống và khu vực ưu tiên hiện có của bạn.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border/70 bg-surface-container-high px-4"
                    onClick={() => navigate("/roommates")}
                  >
                    Tùy chỉnh lọc
                  </Button>
                </div>

                {matchesLoading ? (
                  <div className="grid gap-6 sm:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex flex-col items-center rounded-[24px] bg-surface-container-low p-4">
                        <div className="h-16 w-16 animate-skeleton rounded-full bg-muted" />
                        <div className="mt-4 h-4 w-24 animate-skeleton rounded-full bg-muted" />
                        <div className="mt-2 h-3 w-16 animate-skeleton rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : matches.length === 0 ? (
                  <EmptyStateCard
                    title="Chưa có gợi ý tương thích"
                    description="Hoàn thiện hồ sơ tìm bạn cùng phòng để hệ thống bắt đầu đề xuất những kết nối phù hợp hơn."
                    actionLabel="Mở hành trình ở ghép"
                    onAction={() => navigate("/roommates")}
                  />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-3">
                    {matches.slice(0, 3).map((match) => (
                      <button
                        key={match.matched_user_id}
                        type="button"
                        onClick={() => navigate("/roommates")}
                        className="group flex flex-col items-center rounded-[24px] bg-surface-container-low p-4 text-center transition-transform hover:-translate-y-0.5"
                      >
                        <div className="relative">
                          <PremiumAvatar
                            isPremium={match.is_premium ?? false}
                            className="h-16 w-16"
                          >
                            <AvatarImage src={match.avatar_url || undefined} alt={match.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getUserInitials(match.full_name, null)}
                            </AvatarFallback>
                          </PremiumAvatar>
                          <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container-low bg-tertiary text-[10px] font-bold text-on-tertiary">
                            {Math.round(match.compatibility_score)}%
                          </div>
                        </div>
                        <p className="mt-4 text-sm font-bold text-on-surface">{match.full_name}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                          {[match.occupation, match.age ? `${match.age}t` : null].filter(Boolean).join(" • ") ||
                            "Đang hoàn thiện hồ sơ"}
                        </p>
                        <span className="mt-4 text-[11px] font-bold text-primary group-hover:underline">
                          Mở hành trình ở ghép
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="rounded-[32px] border border-white/70 bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
                <h2 className="font-display text-lg text-on-surface">Cài đặt tài khoản</h2>
                <div className="mt-6 space-y-2">
                  <SettingsAction
                    icon={<PencilLine className="h-4 w-4" />}
                    label="Thông tin cá nhân"
                    onClick={() => setIsEditProfileOpen(true)}
                  />
                  <SettingsAction
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Xác minh & bảo mật"
                    onClick={() => setDetailPanel("settings")}
                  />
                  <SettingsAction
                    icon={<Bell className="h-4 w-4" />}
                    label="Lịch sử và thông báo"
                    onClick={() => setDetailPanel("bookings")}
                  />
                  <SettingsAction
                    icon={<Wrench className="h-4 w-4" />}
                    label="Dịch vụ đã đặt"
                    onClick={() => setDetailPanel("services")}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <VerificationBadge label="Email" verified={Boolean(isEmailVerified || profile?.email_verified)} />
                  <VerificationBadge label="CMND/CCCD" verified={Boolean(profile?.id_card_verified)} />
                  <VerificationBadge label="Sinh viên" verified={Boolean(profile?.student_card_verified)} />
                </div>

                <Button
                  variant="outline"
                  className="mt-6 w-full rounded-full border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </Card>

              <Card className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[32px] border border-primary/5 bg-primary/5 p-8 shadow-[0_20px_40px_rgba(40,43,81,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg text-on-surface">Vùng tìm kiếm ưu tiên</h2>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Các khu vực hệ thống nên ưu tiên khi đề xuất phòng cho bạn.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                    onClick={() => navigate(preferredAreaSearchPath)}
                  >
                    Mở tìm phòng
                  </Button>
                </div>
                <PreferredAreaPreview
                  preferredArea={resolvedPreferredArea ?? preferredArea}
                  locationLabel={locationLabel}
                />

                <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-on-surface-variant">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>{preferredAreaDescription}</p>
                </div>

                {preferredAreaChips.length > 0 ? (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {preferredAreaChips.map((chip) => (
                      <span
                        key={chip}
                        className="shrink-0 rounded-full border border-primary-container bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.04em] text-on-surface"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                    Cập nhật quận, thành phố hoặc trường học trong hồ sơ để kết quả tìm kiếm bám sát hơn.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={detailPanel === "favorites"} onOpenChange={(open) => !open && setDetailPanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border/70 bg-background p-0 sm:max-w-[1080px]">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Phòng đã lưu</DialogTitle>
            <DialogDescription>
              Toàn bộ danh sách phòng bạn đang giữ lại để so sánh và quay lại sau.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">
            {favoritesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-40 animate-skeleton rounded-[24px] bg-muted" />
                ))}
              </div>
            ) : favoritesError ? (
              <div className="rounded-[24px] bg-destructive/5 px-5 py-6 text-sm text-destructive">
                <p>{favoritesError}</p>
                <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={refetchFavorites}>
                  Thử lại
                </Button>
              </div>
            ) : savedRooms.length === 0 ? (
              <EmptyStateCard
                title="Chưa có phòng đã lưu"
                description="Lưu căn phù hợp trong lúc search để quay lại xử lý nhanh hơn khi bạn cần."
                actionLabel="Đi tới tìm phòng"
                onAction={() => {
                  setDetailPanel(null);
                  navigate("/search");
                }}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {savedRooms.map((room, index) => (
                  <Card
                    key={room.id}
                    className="overflow-hidden rounded-[28px] border border-border/70 bg-surface-container-lowest"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDetailPanel(null);
                        navigate(`/room/${room.id}`);
                      }}
                      className="block w-full text-left"
                    >
                      <img
                        src={
                          room.image ||
                          stitchAssets.roomDetail.related[index % stitchAssets.roomDetail.related.length]
                        }
                        alt={room.title}
                        className="h-44 w-full object-cover"
                      />
                    </button>
                    <div className="space-y-4 p-5">
                      <div>
                        <p className="text-lg font-bold text-on-surface">{room.title}</p>
                        <p className="mt-2 text-sm text-on-surface-variant">{room.location}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
                          {formatCompactPrice(room.price)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleRemoveFavorite(room.id)}
                        >
                          <Heart className="mr-2 h-4 w-4 fill-destructive text-destructive" />
                          Bỏ lưu
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailPanel === "bookings"} onOpenChange={(open) => !open && setDetailPanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border/70 bg-background p-0 sm:max-w-[1120px]">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Lịch xem phòng</DialogTitle>
            <DialogDescription>Quản lý toàn bộ lịch hẹn đang chờ, sắp tới và lịch sử của bạn.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">
            <BookingsTab />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailPanel === "services"} onOpenChange={(open) => !open && setDetailPanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border/70 bg-background p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Dịch vụ đã đặt</DialogTitle>
            <DialogDescription>
              Theo dõi trạng thái các yêu cầu dịch vụ bạn đã gửi — chuyển phòng, dọn dẹp, lắp đặt và hơn thế nữa.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">
            <MyServicesTab />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailPanel === "settings"} onOpenChange={(open) => !open && setDetailPanel(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border-border/70 bg-background p-0 sm:max-w-[980px]">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>Cài đặt tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật hồ sơ, theo dõi trạng thái xác minh và quản lý gói dịch vụ hiện có.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6">
            <SettingsTab
              profile={profile}
              isPremium={isPremium}
              premiumUntil={premiumUntil}
              isEmailVerified={isEmailVerified}
              trustScore={trustScore}
              onEditProfile={() => {
                setDetailPanel(null);
                setIsEditProfileOpen(true);
              }}
              onSignOut={handleSignOut}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ProfileEditModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </div>
  );
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

function formatCompactPrice(price: number) {
  const millions = price / 1_000_000;
  const rounded = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);
  return `${rounded.replace(/\\.0$/, "")}tr/tháng`;
}

function formatRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffHours < 48) return "Hôm qua";
  return new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function formatBookingMeta(dateString: string) {
  const bookingDate = new Date(dateString);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfBooking = new Date(
    bookingDate.getFullYear(),
    bookingDate.getMonth(),
    bookingDate.getDate(),
  ).getTime();
  const dayDiff = Math.round((startOfBooking - startOfToday) / 86_400_000);
  const timeLabel = bookingDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (dayDiff === 0) return `Hôm nay - ${timeLabel}`;
  if (dayDiff === 1) return `Ngày mai - ${timeLabel}`;
  return `${bookingDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })} - ${timeLabel}`;
}

function ProfileMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] bg-surface-container-low px-4 py-5 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  time,
  accent,
  isLast,
}: {
  title: string;
  time: string;
  accent: "primary" | "muted";
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="relative">
        <div
          className={`mt-1.5 h-2 w-2 rounded-full ${accent === "primary" ? "bg-primary" : "bg-outline-variant"}`}
        />
        {!isLast ? <div className="absolute top-4 left-1 h-10 w-px bg-outline-variant" /> : null}
      </div>
      <div>
        <p className="text-xs font-medium text-on-surface">{title}</p>
        <p className="mt-1 text-[10px] text-on-surface-variant">{time}</p>
      </div>
    </div>
  );
}

function SettingsAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left transition-colors hover:bg-surface-container-low"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-on-surface">
        <span className="text-on-surface-variant group-hover:text-primary">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}

function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={
        verified
          ? "border-0 bg-tertiary-container text-on-tertiary-container"
          : "bg-surface-container-low text-on-surface-variant"
      }
    >
      {verified ? <ShieldCheck className="mr-1 h-3 w-3" /> : null}
      {verified ? `Đã xác minh ${label}` : `Chưa xác minh ${label}`}
    </Badge>
  );
}

function PreferredAreaPreview({
  preferredArea,
  locationLabel,
}: {
  preferredArea: PreferredSearchArea | null;
  locationLabel: string;
}) {
  const latitude = preferredArea?.latitude ?? null;
  const longitude = preferredArea?.longitude ?? null;
  const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";

  if (hasCoordinates) {
    const area = preferredArea;

    if (!area) {
      return null;
    }

    return (
      <div className="mt-auto overflow-hidden rounded-[24px] border border-white bg-surface-container-high">
        <Suspense fallback={<div className="h-40 animate-skeleton bg-muted" />}>
          <ShopMiniMapbox
            latitude={latitude}
            longitude={longitude}
            partnerName={area.label}
            category={area.city ?? area.district ?? undefined}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative mt-auto overflow-hidden rounded-[24px] border border-white bg-surface-container-high">
      <img
        src={stitchAssets.profile.preferredAreaMap}
        alt={`Bản đồ ưu tiên ${locationLabel || "RommZ"}`}
        className="h-40 w-full object-cover grayscale"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,23,57,0.06),rgba(18,23,57,0.18))]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">
            {preferredArea?.label || "Chưa khóa khu vực"}
          </span>
          <span className="sr-only">{locationLabel || "Chọn khu vực ưu tiên"}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyStateCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-surface-container-low px-5 py-6 text-center">
      <p className="text-sm font-bold text-on-surface">{title}</p>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{description}</p>
      <Button onClick={onAction} className="mt-5 rounded-full">
        {actionLabel}
      </Button>
    </div>
  );
}
