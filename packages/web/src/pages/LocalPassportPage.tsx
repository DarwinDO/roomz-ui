import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MapPin,
  Gift,
  QrCode,
  ExternalLink,
  Search,
  Loader2,
  AlertCircle,
  Crown,
  GraduationCap,
  Landmark,
  TrainFront,
  Compass,
} from "lucide-react";
import { PartnerSignUpModal } from "@/components/modals/PartnerSignUpModal";
import { ShopDetailModal } from "@/components/modals/ShopDetailModal";
import { HowToRedeemModal } from "@/components/modals/HowToRedeemModal";
import { usePartners } from "@/hooks/usePartners";
import { useDeals } from "@/hooks/useDeals";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePremiumLimits } from "@/hooks/usePremiumLimits";
import { useFeaturedLocations, useNearbyLocations } from "@/hooks";
import { haversineDistance, formatDistance } from "@roomz/shared/utils/geo";
import { UPGRADE_SOURCES } from "@roomz/shared/constants/tracking";
import { cn } from "@/lib/utils";
import type { Partner } from "@/services/partners";
import type { DealWithPartner as DealWithPartnerType } from "@/services/deals";
import {
  formatLocationCatalogSubtitle,
  formatLocationTypeLabel,
  type LocationCatalogEntry,
} from "@/services/locations";
import { toast } from "sonner";

interface PerkCardData {
  id: string;
  name: string;
  category: string;
  discount: string;
  distance?: string;
  distanceKm?: number;
  image: string;
  icon: string;
  color: string;
  // Full data for modal
  partner?: Partner;
  deal?: DealWithPartnerType;
  // Premium lock
  isPremiumLocked?: boolean;
}

interface LocalPassportContentProps {
  embedded?: boolean;
}

function getPassportLocationIcon(type: LocationCatalogEntry["location_type"]) {
  switch (type) {
    case "university":
    case "campus":
      return GraduationCap;
    case "station":
      return TrainFront;
    case "landmark":
      return Landmark;
    default:
      return Compass;
  }
}

export function LocalPassportContent({
  embedded = false,
}: LocalPassportContentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<DealWithPartnerType | null>(null);
  const [isShopDetailOpen, setIsShopDetailOpen] = useState<boolean>(false);
  const [isPartnerSignUpOpen, setIsPartnerSignUpOpen] = useState<boolean>(false);
  const [isHowToRedeemOpen, setIsHowToRedeemOpen] = useState<boolean>(false);

  useEffect(() => {
    const nextSearch = searchParams.get("search")?.trim() ?? "";
    const nextCategory = searchParams.get("category")?.trim() ?? "Tất cả";

    setSearchQuery((current) => (current === nextSearch ? current : nextSearch));
    setSelectedCategory((current) => (current === nextCategory ? current : nextCategory));
  }, [searchParams]);

  // Geolocation
  const { position, loading: geoLoading, denied: geoDenied } = useGeolocation();
  const { data: nearbyLocations = [], isLoading: isNearbyLocationsLoading } = useNearbyLocations(
    position
      ? {
          lat: position.lat,
          lng: position.lng,
          radiusKm: 6,
          limit: 6,
          types: ["university", "station", "landmark", "district"],
        }
      : null,
  );
  const { data: featuredLocations = [], isLoading: isFeaturedLocationsLoading } = useFeaturedLocations({
    limit: 6,
    types: ["university", "station", "landmark", "district"],
  });

  // Data fetching - use both partners and deals
  const {
    data: partners,
    isLoading: isPartnersLoading,
    error: partnersError,
  } = usePartners({});

  const {
    data: deals,
    isLoading: isDealsLoading,
    error: dealsError,
  } = useDeals({});

  // Premium status
  const { isPremium } = usePremiumLimits();
  const highlightedLocations = position && !geoDenied ? nearbyLocations : featuredLocations;
  const isLocationSectionLoading =
    position && !geoDenied ? isNearbyLocationsLoading : isFeaturedLocationsLoading;

  // Combine partners + deals into perk cards with distance calculation
  const perkCards: PerkCardData[] = useMemo(() => {
    if (!partners || !deals) return [];

    // Calculate distance if we have user position and partner coordinates
    const calculateDistanceData = (partner: Partner): { distance?: string; distanceKm?: number } => {
      if (!position || !partner.latitude || !partner.longitude) {
        return {};
      }
      const distance = haversineDistance(
        position.lat,
        position.lng,
        Number(partner.latitude),
        Number(partner.longitude)
      );
      return {
        distance: formatDistance(distance),
        distanceKm: distance,
      };
    };

    // Map partners with their deals
    const cards = partners.map((partner): PerkCardData => {
      // Find deals for this partner
      const partnerDeals = deals.filter(
        (deal) => deal.partner_id === partner.id
      );
      const mainDeal = partnerDeals[0];

      // Map category to emoji and color
      const categoryConfig: Record<string, { emoji: string; color: string }> = {
        coffee: { emoji: "☕", color: "bg-amber-100 text-amber-700" },
        fitness: { emoji: "🏋️", color: "bg-red-100 text-red-700" },
        gym: { emoji: "🏋️", color: "bg-red-100 text-red-700" },
        entertainment: { emoji: "🎬", color: "bg-sky-100 text-sky-700" },
        food: { emoji: "🍔", color: "bg-orange-100 text-orange-700" },
        laundry: { emoji: "👕", color: "bg-blue-100 text-blue-700" },
        cleaning: { emoji: "🧹", color: "bg-teal-100 text-teal-700" },
        moving: { emoji: "📦", color: "bg-gray-100 text-gray-700" },
        other: { emoji: "✨", color: "bg-stone-100 text-stone-700" },
      };

      const config = categoryConfig[partner.category] || categoryConfig.other;
      const distanceData = calculateDistanceData(partner);

      return {
        id: partner.id,
        name: partner.name,
        category: partner.category || "other",
        discount: mainDeal?.discount_value || mainDeal?.title || "Khám phá ngay",
        distance: distanceData.distance,
        distanceKm: distanceData.distanceKm,
        image: partner.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
        icon: config.emoji,
        color: config.color,
        partner,
        deal: mainDeal,
        isPremiumLocked: mainDeal?.is_premium_only || false,
      };
    });

    // Sort by distance if user has position and it's not denied
    if (position && !geoDenied) {
      cards.sort((a, b) => {
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm; // Sort from nearest to farthest
      });
    }

    return cards;
  }, [partners, deals, position, geoDenied]);

  // Filter by category and search
  const filteredPerks = useMemo(() => {
    let result = perkCards;

    // Filter by category - compare lowercase with lowercase
    if (selectedCategory !== "Tất cả") {
      const categoryLower = selectedCategory.toLowerCase();
      result = result.filter((perk) => perk.category.toLowerCase() === categoryLower);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (perk) =>
          perk.name.toLowerCase().includes(query) ||
          perk.category.toLowerCase().includes(query) ||
          perk.discount.toLowerCase().includes(query)
      );
    }

    return result;
  }, [perkCards, selectedCategory, searchQuery]);

  // Dynamic categories from data - only partners with deals
  const categories = useMemo((): Array<{ name: string; count: number }> => {
    const categoryMap: Record<string, number> = {};

    perkCards.forEach((perk) => {
      categoryMap[perk.category] = (categoryMap[perk.category] || 0) + 1;
    });

    const result: Array<{ name: string; count: number }> = [
      { name: "Tất cả", count: perkCards.length },
    ];

    Object.entries(categoryMap).forEach(([name, count]) => {
      result.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      });
    });

    return result;
  }, [perkCards]);

  // Loading state
  const isLoading = isPartnersLoading || isDealsLoading;

  // Error state
  const error = partnersError || dealsError;

  // Handlers
  const handleGetVoucher = (e: React.MouseEvent, perk: PerkCardData) => {
    e.stopPropagation();

    // If deal is premium-locked and user is not premium, redirect to upgrade
    if (perk.isPremiumLocked && !isPremium) {
      navigate(`/payment?source=${UPGRADE_SOURCES.DEAL_PREMIUM}`);
      return;
    }

    // Open ShopDetailModal with the deal data
    if (perk.deal) {
      setSelectedDeal(perk.deal);
      setIsShopDetailOpen(true);
    } else {
      toast.error("Không thể nhận voucher");
    }
  };

  const handleSeeAllPerks = () => {
    const perksGrid = document.getElementById("perks-grid");
    perksGrid?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePremiumBannerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/payment?source=${UPGRADE_SOURCES.DEAL_PREMIUM}`);
    }
  };

  const handlePartnerSubmit = () => {
    toast.success(
      "Cảm ơn bạn đã tham gia RommZ Passport! Đội ngũ RommZ sẽ liên hệ sớm nhất."
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      lang="vi"
      className={
        embedded
          ? "space-y-8"
          : "min-h-screen bg-gradient-to-b from-[#f5f9ff] via-[#fffdf9] to-white pb-24 md:pb-8"
      }
    >
      {!embedded ? (
        <div className="scroll-lock-shell sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h3 className="ml-3 font-display text-xl">RommZ Passport</h3>
          </div>
        </div>
      ) : null}

      <div className={embedded ? "space-y-8" : "mx-auto max-w-6xl space-y-8 px-4 py-8"}>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            aria-label="Tìm kiếm đối tác và ưu đãi"
            placeholder="Tìm kiếm đối tác, ưu đãi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Premium Upgrade Banner - show for free users */}
        {!isPremium && (
          <Card
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
            role="button"
            tabIndex={0}
            aria-label="Nâng cấp RommZ Premium"
            onClick={() => navigate(`/payment?source=${UPGRADE_SOURCES.DEAL_PREMIUM}`)}
            onKeyDown={handlePremiumBannerKeyDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800">RommZ Premium</h4>
                  <p className="text-sm text-amber-700">Ưu đãi độc quyền & không giới hạn</p>
                </div>
              </div>
              <Button variant="default" size="sm" className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Khám phá
              </Button>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden rounded-[28px] border-[#d6e4f5] bg-[linear-gradient(135deg,#f5fbff_0%,#ffffff_50%,#fff7ec_100%)] p-0 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1.9fr]">
            <div className="border-b border-[#d6e4f5] bg-[#0f172a] px-6 py-6 text-white lg:border-b-0 lg:border-r">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                <MapPin className="h-3.5 w-3.5" />
                Local context
              </div>
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Điểm mốc nổi bật
                <br />
                cho khu vực của bạn
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Local Passport không chỉ là ưu đãi. Nó cần biết bạn đang ở gần trường, ga bến hay landmark nào để gợi ý đối tác hợp lý hơn.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="rounded-full bg-white/10 text-white">Trường</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Ga / bến</Badge>
                <Badge className="rounded-full bg-white/10 text-white">Landmark</Badge>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {position && !geoDenied ? "Gần bạn lúc này" : "Điểm mốc đang nổi bật"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {position && !geoDenied
                      ? "Dựa trên vị trí hiện tại trong bán kính 6 km."
                      : "Hiển thị từ location catalog đã được duyệt."}
                  </p>
                </div>
                {geoLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {isLocationSectionLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border bg-muted/40 p-4">
                      <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : highlightedLocations.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {highlightedLocations.map((location) => {
                    const Icon = getPassportLocationIcon(location.location_type);

                    return (
                      <div
                        key={location.id}
                        className="rounded-2xl border border-border/70 bg-background px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-primary/10 p-2 text-primary">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{location.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatLocationCatalogSubtitle(location)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            {formatLocationTypeLabel(location.location_type)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                          <span>{location.source_name || "Catalog nội bộ"}</span>
                          <span className="font-medium text-foreground">
                            {location.distance_km !== null && location.distance_km !== undefined
                              ? formatDistance(location.distance_km)
                              : "Đang dùng làm mốc khu vực"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
                  Chúng tôi đang cập nhật thêm các điểm mốc nổi bật quanh bạn để Local Passport gợi ý khu vực chính xác hơn.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-4 rounded-2xl bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="ml-auto"
              >
                Thử lại
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="overflow-hidden rounded-2xl border-border"
              >
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Category Filter */}
        {!isLoading && !error && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide rounded-xl">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  variant={
                    selectedCategory === category.name
                      ? "default"
                      : "outline"
                  }
                  className={`rounded-full whitespace-nowrap transition-all ${selectedCategory === category.name
                    ? "bg-primary text-white"
                    : ""
                    }`}
                >
                  {category.name}
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full bg-white/20 text-inherit text-xs"
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Header CTA */}
            <div className="flex items-center justify-between">
              <div>
                <h2>Ưu đãi đang mở quanh bạn</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPerks.length} ưu đãi
                  {selectedCategory !== "Tất cả"
                    ? ` trong danh mục ${selectedCategory}`
                    : ""}
                </p>
              </div>
              <Button
                onClick={handleSeeAllPerks}
                variant="ghost"
                className="rounded-full text-primary hidden md:flex"
              >
                Xem tất cả ưu đãi
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {/* Empty State */}
            {filteredPerks.length === 0 && (
              <Card className="p-8 rounded-2xl text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2">Không có ưu đãi nào</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `Không tìm thấy "${searchQuery}"`
                    : "Hãy thử danh mục khác hoặc quay lại sau."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4 rounded-full"
                    onClick={() => setSearchQuery("")}
                  >
                    Xóa tìm kiếm
                  </Button>
                )}
              </Card>
            )}

            {/* Perks Grid */}
            <div
              id="perks-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPerks.map((perk) => (
                <Card
                  key={perk.id}
                  className="group overflow-hidden rounded-2xl border-border shadow-sm transition-all hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={perk.image}
                      alt={perk.name}
                      className={cn(
                        "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                        perk.isPremiumLocked && !isPremium && "blur-sm"
                      )}
                    />
                    {/* Premium overlay */}
                    {perk.isPremiumLocked && !isPremium && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="font-semibold text-sm">Premium</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      {/* Premium badge */}
                      {perk.isPremiumLocked && (
                        <Badge className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {/* Distance badge - only show if available */}
                      {perk.distance && !geoDenied && (
                        <Badge className="rounded-full bg-white/90 text-gray-900 border-0 shadow-sm">
                          <MapPin className="w-3 h-3 mr-1" />
                          {perk.distance}
                        </Badge>
                      )}
                      <Badge
                        className={`rounded-full ${perk.color} border-0`}
                      >
                        <span className="w-3 h-3 mr-1">{perk.icon}</span>
                        {perk.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4>{perk.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-secondary" />
                        <span className="text-secondary">
                          {perk.discount}
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    {perk.deal ? (
                      <Button
                        onClick={(e) => handleGetVoucher(e, perk)}
                        className="w-full rounded-full"
                      >
                        <QrCode className="mr-2 w-4 h-4" />
                        Nhận voucher
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        disabled
                      >
                        Chưa có ưu đãi
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Mobile CTA */}
            <Button
              onClick={handleSeeAllPerks}
              variant="ghost"
              className="w-full rounded-full text-primary md:hidden"
            >
              Xem tất cả ưu đãi gần bạn
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>

            {/* Info Card */}
            <Card className="p-6 rounded-2xl bg-gradient-to-r from-secondary/10 to-primary/10 border-primary/20 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3>Cách sử dụng ưu đãi</h3>
                  <p className="text-muted-foreground text-sm">
                    Nhấn "Nhận voucher" để tạo mã QR và xuất trình cho
                    nhân viên quầy khi thanh toán để áp dụng ưu đãi sinh
                    viên.
                  </p>
                </div>
                <Button
                  onClick={() => setIsHowToRedeemOpen(true)}
                  variant="outline"
                  className="rounded-full shrink-0"
                >
                  Tìm hiểu thêm
                </Button>
              </div>
            </Card>

            {/* Bottom CTA */}
            <Card className="p-8 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
              <div className="text-center space-y-4">
                <h2 className="text-white">Trở thành đối tác của RommZ</h2>
                <p className="text-white/90 max-w-2xl mx-auto">
                  Bạn là doanh nghiệp địa phương? Tham gia Local Passport để
                  kết nối với hàng nghìn sinh viên quanh khu vực.
                </p>
                <Button
                  onClick={() => setIsPartnerSignUpOpen(true)}
                  variant="secondary"
                  className="rounded-full bg-white text-primary hover:bg-white/90"
                >
                  Đăng ký đối tác
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Modals */}
      <ShopDetailModal
        isOpen={isShopDetailOpen}
        onClose={() => setIsShopDetailOpen(false)}
        deal={selectedDeal}
      />
      <PartnerSignUpModal
        isOpen={isPartnerSignUpOpen}
        onClose={() => setIsPartnerSignUpOpen(false)}
        onSubmit={handlePartnerSubmit}
      />
      <HowToRedeemModal
        isOpen={isHowToRedeemOpen}
        onClose={() => setIsHowToRedeemOpen(false)}
      />
    </div>
  );
}

export default function LocalPassportPage() {
  return <LocalPassportContent />;
}

