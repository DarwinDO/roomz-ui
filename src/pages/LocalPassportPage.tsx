import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Map,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PartnerSignUpModal } from "@/components/modals/PartnerSignUpModal";
import { HowToRedeemModal } from "@/components/modals/HowToRedeemModal";
import { usePartners } from "@/hooks/usePartners";
import { useDeals } from "@/hooks/useDeals";
import type { Partner } from "@/services/partners";
import type { DealWithPartner } from "@/services/deals";
import { toast } from "sonner";

interface PerkCardData {
  id: string;
  name: string;
  category: string;
  discount: string;
  distance?: string;
  image: string;
  icon: string;
  color: string;
  // Full data for modal
  partner?: Partner;
  deal?: DealWithPartner;
}

export default function LocalPassportPage() {
  const navigate = useNavigate();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPartnerSignUpOpen, setIsPartnerSignUpOpen] = useState<boolean>(false);
  const [isHowToRedeemOpen, setIsHowToRedeemOpen] = useState<boolean>(false);

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

  // Combine partners + deals into perk cards
  const perkCards: PerkCardData[] = useMemo(() => {
    if (!partners || !deals) return [];

    // Map partners with their deals
    return partners.map((partner): PerkCardData => {
      // Find deals for this partner
      const partnerDeals = deals.filter(
        (deal) => deal.partner_id === partner.id
      );
      const mainDeal = partnerDeals[0];

      // Map category to emoji and color
      const categoryConfig: Record<string, { emoji: string; color: string }> = {
        coffee: { emoji: "☕", color: "bg-amber-100 text-amber-700" },
        fitness: { emoji: "🏋️", color: "bg-red-100 text-red-700" },
        entertainment: { emoji: "🎬", color: "bg-purple-100 text-purple-700" },
        food: { emoji: "🍔", color: "bg-orange-100 text-orange-700" },
        laundry: { emoji: "👕", color: "bg-blue-100 text-blue-700" },
      };

      const config = categoryConfig[partner.category] || categoryConfig.food;

      return {
        id: partner.id,
        name: partner.name,
        category: partner.category || "other",
        discount: mainDeal?.discount_value || mainDeal?.title || "Khám phá ngay",
        image: partner.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
        icon: config.emoji,
        color: config.color,
        partner,
        deal: mainDeal,
      };
    });
  }, [partners, deals]);

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
    toast.success(`Đã lưu voucher: ${perk.name}`);
  };

  const handleSeeAllPerks = () => {
    const perksGrid = document.getElementById("perks-grid");
    perksGrid?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePartnerSubmit = () => {
    toast.success(
      "Cảm ơn bạn đã tham gia RoomZ Passport! Đội ngũ RoomZ sẽ liên hệ sớm nhất."
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="ml-3">RoomZ Passport</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Map Preview */}
        <Card className="p-0 rounded-2xl shadow-md overflow-hidden border-border">
          <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-100 to-secondary/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Map className="w-12 h-12 text-primary mx-auto" />
              <p className="text-muted-foreground">
                Bản đồ tương tác sẽ ra mắt sớm
              </p>
              <Button variant="outline" className="rounded-full">
                <MapPin className="mr-2 w-4 h-4" />
                Xem bản đồ
              </Button>
            </div>
          </div>
        </Card>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm đối tác, ưu đãi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

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
                  className="overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all border-border cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={perk.image}
                      alt={perk.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
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
                    <Button
                      onClick={(e) => handleGetVoucher(e, perk)}
                      className="w-full rounded-full"
                    >
                      <QrCode className="mr-2 w-4 h-4" />
                      Nhận voucher
                    </Button>
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
                <h2 className="text-white">Trở thành đối tác của RoomZ</h2>
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
