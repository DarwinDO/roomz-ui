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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const howToRedeemRef = useRef<HTMLDivElement>(null);
  const perksGridRef = useRef<HTMLDivElement>(null);
  const perks = [
    {
      id: 1,
      name: "Café 89°",
      category: "Café",
      discount: "-20% for RoomZ members",
      distance: "300m away",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
      icon: Coffee,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: 2,
      name: "CleanMe Laundry",
      category: "Laundry",
      discount: "-15% on first service",
      distance: "450m away",
      image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
      icon: Shirt,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: 3,
      name: "GymZone Fitness",
      category: "Gym",
      discount: "First month free",
      distance: "600m away",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
      icon: Dumbbell,
      color: "bg-red-100 text-red-700",
    },
    {
      id: 4,
      name: "Pizza Corner",
      category: "Food",
      discount: "-25% after 9 PM",
      distance: "200m away",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
      icon: Pizza,
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: 5,
      name: "BookNest Café",
      category: "Café",
      discount: "Buy 2 get 1 free",
      distance: "350m away",
      image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop",
      icon: Coffee,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: 6,
      name: "FlexFit Studio",
      category: "Gym",
      discount: "-30% for students",
      distance: "800m away",
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
    toast.success("Thanks for joining RoomZ Passport! Our team will reach out soon.");
  };

  const filteredPerks = selectedCategory === "All"
    ? perks
    : perks.filter((perk) => perk.category === selectedCategory);

  const categories = [
    { name: "All", count: perks.length },
    { name: "Café", count: 2 },
    { name: "Gym", count: 2 },
    { name: "Food", count: 1 },
    { name: "Laundry", count: 1 },
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
            <h1>Your Local Passport</h1>
            <p className="text-muted-foreground">
              Discover exclusive student deals near your area.
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
              <p className="text-muted-foreground">Interactive Map Coming Soon</p>
              <Button variant="outline" className="rounded-full">
                <MapPin className="mr-2 w-4 h-4" />
                View Map
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
            <h2>Available Perks Near You</h2>
            <p className="text-sm text-muted-foreground">
              {filteredPerks.length} exclusive deals within 1 km
            </p>
          </div>
          <Button
            onClick={handleSeeAllPerks}
            variant="ghost"
            className="rounded-full text-primary hidden md:flex"
          >
            See All Perks
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
                  Get Voucher
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
          See All Perks Near You
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
                <h3>How to Redeem Perks</h3>
                <p className="text-muted-foreground text-sm">
                  Click "Get Voucher" to generate a QR code. Show it to the
                  partner at checkout to claim your student discount.
                </p>
              </div>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                className="rounded-full shrink-0"
              >
                Learn More
              </Button>
            </div>
          </Card>
        </div>

        {/* Bottom CTA */}
        <Card className="p-8 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg border-0">
          <div className="text-center space-y-4">
            <h2 className="text-white">Partner with RoomZ</h2>
            <p className="text-white/90 max-w-2xl mx-auto">
              Are you a local business? Join our Local Passport program and
              connect with thousands of students in your area.
            </p>
            <Button
              onClick={() => setIsPartnerSignUpOpen(true)}
              variant="secondary"
              className="rounded-full bg-white text-primary hover:bg-white/90"
            >
              Become a Partner
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
