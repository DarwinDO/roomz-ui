import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Coffee,
  Dumbbell,
  Shirt,
  Pizza,
  MapPin,
  Gift,
  QrCode,
  ExternalLink,
  Map,
} from "lucide-react";
import { VoucherModal } from "@/components/modals/VoucherModal";
import { PartnerSignUpModal } from "@/components/modals/PartnerSignUpModal";
import { ShopDetailModal } from "@/components/modals/ShopDetailModal";
import { toast } from "sonner";

export default function LocalPassportPage({ onBack }: LocalPassportPageProps) {
  const [selectedPerk, setSelectedPerk] = useState<any | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isPartnerSignUpOpen, setIsPartnerSignUpOpen] = useState(false);
  const [isShopDetailOpen, setIsShopDetailOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const howToRedeemRef = useRef<HTMLDivElement>(null);
  const perksGridRef = useRef<HTMLDivElement>(null);
  const perks = [
    {
      id: 1,
      name: "Café 89°",
      category: "Cà phê",
      discount: "Giảm 20% cho thành viên RoomZ",
      distance: "Cách 300 m",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      icon: Coffee,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: 2,
      name: "CleanMe Laundry",
      category: "Giặt ủi",
      discount: "Giảm 15% cho đơn đầu tiên",
      distance: "Cách 450 m",
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
      icon: Shirt,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: 3,
      name: "GymZone Fitness",
      category: "Phòng gym",
      discount: "Miễn phí tháng đầu tiên",
      distance: "Cách 600 m",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
      icon: Dumbbell,
      color: "bg-red-100 text-red-700",
    },
    {
      id: 4,
      name: "Pizza Corner",
      category: "Ăn uống",
      discount: "Giảm 25% sau 21h",
      distance: "Cách 200 m",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
      icon: Pizza,
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: 5,
      name: "BookNest Café",
      category: "Cà phê",
      discount: "Mua 2 tặng 1 đồ uống",
      distance: "Cách 350 m",
      image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop",
      icon: Coffee,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: 6,
      name: "FlexFit Studio",
      category: "Phòng gym",
      discount: "Giảm 30% cho sinh viên",
      distance: "Cách 800 m",
      image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=300&fit=crop",
      icon: Dumbbell,
      color: "bg-red-100 text-red-700",
    },
  ];

  const handleCardClick = (perk: any) => {
    setSelectedPerk(perk);
    setIsShopDetailOpen(true);
  };

  const handleGetVoucher = (e: React.MouseEvent, perk: any) => {
    e.stopPropagation(); // Prevent card click
    setSelectedPerk(perk);
    setIsShopDetailOpen(true);
  };

  const handleSeeAllPerks = () => {
    perksGridRef.current?.scrollIntoView({ behavior: "smooth" });
    // Highlight filter bar
    const filterBar = document.getElementById("filter-bar");
    filterBar?.classList.add("ring-2", "ring-primary", "ring-offset-2");
    setTimeout(() => {
      filterBar?.classList.remove("ring-2", "ring-primary", "ring-offset-2");
    }, 1000);
  };

  const handleLearnMore = () => {
    howToRedeemRef.current?.scrollIntoView({ behavior: "smooth" });
    // Add a subtle highlight effect
    howToRedeemRef.current?.classList.add("ring-2", "ring-primary", "ring-offset-4");
    setTimeout(() => {
      howToRedeemRef.current?.classList.remove("ring-2", "ring-primary", "ring-offset-4");
    }, 2000);
  };

  const handlePartnerSubmit = () => {
    toast.success("Cảm ơn bạn đã tham gia RoomZ Passport! Đội ngũ RoomZ sẽ liên hệ sớm nhất.");
  };

  const filteredPerks = selectedCategory === "Tất cả"
    ? perks
    : perks.filter((perk) => perk.category === selectedCategory);

  const categories = [
    { name: "Tất cả", count: perks.length },
    { name: "Cà phê", count: 2 },
    { name: "Phòng gym", count: 2 },
    { name: "Ăn uống", count: 1 },
    { name: "Giặt ủi", count: 1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFF] to-white pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-2 rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="space-y-1">
            <h1>RoomZ Local Passport</h1>
            <p className="text-muted-foreground">
              Khám phá ưu đãi dành riêng cho sinh viên quanh khu bạn ở.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Map Preview */}
        <Card className="p-0 rounded-2xl shadow-md overflow-hidden border-border">
          <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-100 to-secondary/20 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Map className="w-12 h-12 text-primary mx-auto" />
              <p className="text-muted-foreground">Bản đồ tương tác sẽ ra mắt sớm</p>
              <Button variant="outline" className="rounded-full">
                <MapPin className="mr-2 w-4 h-4" />
                Xem bản đồ
              </Button>
            </div>
          </div>
        </Card>

        {/* Category Filter */}
        <div
          id="filter-bar"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide transition-all duration-300 rounded-xl"
        >
          {categories.map((category) => (
            <Button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.name
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
              {filteredPerks.length} ưu đãi trong bán kính 1 km
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

        {/* Perks Grid */}
        <div
          ref={perksGridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPerks.map((perk) => (
            <Card
              key={perk.id}
              onClick={() => handleCardClick(perk)}
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
                  <Badge className={`rounded-full ${perk.color} border-0`}>
                    <perk.icon className="w-3 h-3 mr-1" />
                    {perk.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4>{perk.name}</h4>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-blue-50 text-primary text-xs"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {perk.distance}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-secondary" />
                    <span className="text-secondary">{perk.discount}</span>
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
        <div ref={howToRedeemRef}>
          <Card className="p-6 rounded-2xl bg-gradient-to-r from-secondary/10 to-primary/10 border-primary/20 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 space-y-1">
                <h3>Cách sử dụng ưu đãi</h3>
                <p className="text-muted-foreground text-sm">
                  Nhấn "Nhận voucher" để tạo mã QR và xuất trình cho nhân viên quầy khi thanh toán để áp dụng ưu đãi sinh viên.
                </p>
              </div>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                className="rounded-full shrink-0"
              >
                Tìm hiểu thêm
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom CTA */}
        <Card className="p-8 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
          <div className="text-center space-y-4">
            <h2 className="text-white">Trở thành đối tác của RoomZ</h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              Bạn là doanh nghiệp địa phương? Tham gia Local Passport để kết nối với hàng nghìn sinh viên quanh khu vực.
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
      </div>

      {/* Modals */}
      {selectedPerk && (
        <ShopDetailModal
          isOpen={isShopDetailOpen}
          onClose={() => setIsShopDetailOpen(false)}
          shop={selectedPerk}
        />
      )}
      <PartnerSignUpModal
        isOpen={isPartnerSignUpOpen}
        onClose={() => setIsPartnerSignUpOpen(false)}
        onSubmit={handlePartnerSubmit}
      />
    </div>
  );
}

