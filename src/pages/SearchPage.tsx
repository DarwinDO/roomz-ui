import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoomCard } from "@/components/common/RoomCard";
import { formatPriceInMillions } from "@/utils/format";
import { useRooms, useDebounce } from "@/hooks";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts";
import { Search, SlidersHorizontal, Map, List, X, Wifi, Car, WashingMachine, UtensilsCrossed, PawPrint, Armchair, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { RoomWithDetails } from "@/services/rooms";

// Helper function to transform room data to RoomCard props
function transformRoomToCardProps(room: RoomWithDetails, isFavorited: boolean = false) {
  // Get primary image or first image
  const primaryImage = room.images?.find(img => img.is_primary) || room.images?.[0];
  const imageUrl = primaryImage?.image_url || '';

  // Format location
  const location = [room.district, room.city].filter(Boolean).join(', ') || room.address;

  return {
    id: room.id,
    image: imageUrl,
    title: room.title,
    location,
    price: Number(room.price_per_month),
    distance: undefined,
    verified: room.is_verified || false,
    available: room.is_available || false,
    matchPercentage: undefined,
    isFavorited,
  };
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [showVerifiedCheck, setShowVerifiedCheck] = useState(false);

  // Debounce search query to reduce API calls (only fires after user stops typing for 400ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Extract price range values for stable dependencies
  const minPrice = priceRange[0];
  const maxPrice = priceRange[1];

  // Memoize filters object to prevent unnecessary re-fetches
  const roomFilters = useMemo(() => ({
    minPrice,
    maxPrice,
    isVerified: verifiedOnly ? true : undefined,
    searchQuery: debouncedSearchQuery || undefined,
  }), [minPrice, maxPrice, verifiedOnly, debouncedSearchQuery]);

  // Fetch rooms from database
  const { rooms, loading, error, refetch } = useRooms(roomFilters);

  // Fetch favorites
  const { isFavorited, toggleFavorite } = useFavorites();

  const onRoomClick = (id: string) => {
    navigate(`/room/${id}`);
  };

  const handleFavorite = async (roomId: string) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để lưu phòng yêu thích");
      navigate('/login');
      return;
    }

    try {
      const favorited = await toggleFavorite(roomId);
      toast.success(favorited ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích");
    } catch {
      toast.error("Không thể cập nhật yêu thích");
    }
  };

  const roomTypes = [
    { value: "private", label: "Phòng riêng" },
    { value: "shared", label: "Phòng chung" },
    { value: "studio", label: "Căn studio" },
    { value: "entire", label: "Nguyên căn" },
  ];

  const amenities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "parking", label: "Chỗ đỗ xe", icon: Car },
    { id: "washing_machine", label: "Giặt là", icon: WashingMachine },
    { id: "kitchen", label: "Bếp", icon: UtensilsCrossed },
    { id: "pet_allowed", label: "Cho phép thú cưng", icon: PawPrint },
    { id: "furnished", label: "Có nội thất", icon: Armchair },
  ];

  const toggleRoomType = (type: string) => {
    setSelectedRoomTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(a => a !== amenityId) : [...prev, amenityId]
    );
  };

  const handleResetFilters = () => {
    setPriceRange([0, 10000000]);
    setVerifiedOnly(false);
    setSelectedRoomTypes([]);
    setSelectedAmenities([]);
    setShowVerifiedCheck(false);
    setSearchQuery("");
    toast.success("Đã đặt lại bộ lọc");
  };

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);
    await refetch();
    setIsApplyingFilters(false);
    setIsFiltersOpen(false);
    toast.success("Đã áp dụng bộ lọc");
  };

  // Filter rooms locally for room type and amenities
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filter by room type
      if (selectedRoomTypes.length > 0 && !selectedRoomTypes.includes(room.room_type)) {
        return false;
      }

      // Filter by amenities
      if (selectedAmenities.length > 0 && room.amenities) {
        const hasAllAmenities = selectedAmenities.every(amenity => {
          return room.amenities?.[amenity as keyof typeof room.amenities] === true;
        });
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [rooms, selectedRoomTypes, selectedAmenities]);

  // Transform rooms to card props
  const roomCards = useMemo(() => {
    return filteredRooms.map(room => transformRoomToCardProps(room, isFavorited(room.id)));
  }, [filteredRooms, isFavorited]);

  return (
    <div className="pb-20 md:pb-8">
      {/* Search Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm địa điểm..."
                className="pl-10 rounded-full border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    refetch();
                  }
                }}
              />
            </div>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl shrink-0 border-border hover-scale">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* Price Range Section */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <Label className="mb-3 block text-sm font-medium">Khoảng giá</Label>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                        {priceRange[0].toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-xs text-muted-foreground">đến</span>
                      <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                        {priceRange[1].toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={10000000}
                        step={100000}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>0đ</span>
                        <span>10tr</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Only Section */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="verified-toggle" className="text-sm font-medium cursor-pointer">
                          Chỉ phòng đã xác thực
                        </Label>
                        <AnimatePresence>
                          {showVerifiedCheck && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-secondary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <Switch
                        id="verified-toggle"
                        checked={verifiedOnly}
                        onCheckedChange={(checked) => {
                          setVerifiedOnly(checked);
                          if (checked) {
                            setShowVerifiedCheck(true);
                            setTimeout(() => setShowVerifiedCheck(false), 2000);
                          } else {
                            setShowVerifiedCheck(false);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Chỉ hiển thị tin đăng đã xác thực</p>
                  </div>

                  {/* Room Type Section */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <Label className="mb-3 block text-sm font-medium">Loại phòng</Label>
                    <div className="flex flex-wrap gap-2">
                      {roomTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => toggleRoomType(type.value)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all h-9 ${selectedRoomTypes.includes(type.value)
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-foreground hover:bg-muted/80"
                            }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <Label className="mb-3 block text-sm font-medium">Tiện nghi</Label>
                    <div className="space-y-3">
                      {amenities.map((amenity) => {
                        const Icon = amenity.icon;
                        const isSelected = selectedAmenities.includes(amenity.id);
                        return (
                          <div key={amenity.id} className="flex items-center gap-3">
                            <Checkbox
                              id={amenity.id}
                              checked={isSelected}
                              onCheckedChange={() => toggleAmenity(amenity.id)}
                              className="w-5 h-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <Label
                              htmlFor={amenity.id}
                              className="cursor-pointer flex-1 text-base"
                            >
                              {amenity.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Actions */}
                <div className="border-t border-border p-4 bg-card">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleResetFilters}
                      className="flex-1 rounded-xl border-border hover:bg-muted h-11"
                    >
                      Đặt lại
                    </Button>
                    <Button
                      onClick={handleApplyFilters}
                      disabled={isApplyingFilters}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90 h-11"
                    >
                      {isApplyingFilters ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang áp dụng...
                        </>
                      ) : (
                        "Áp dụng"
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* View Toggle & Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải...
                </span>
              ) : (
                `${roomCards.length} phòng còn trống`
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-xl"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-xl"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>


      {/* Active Filters */}
      {
        (verifiedOnly || priceRange[0] > 0 || priceRange[1] < 10000000 || selectedRoomTypes.length > 0) && (
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
              {verifiedOnly && (
                <Badge className="bg-primary text-primary-foreground gap-1">
                  Đã xác thực
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setVerifiedOnly(false)} />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 10000000) && (
                <Badge className="bg-primary text-white gap-1">
                  {formatPriceInMillions(priceRange[0])}tr - {formatPriceInMillions(priceRange[1])}tr
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setPriceRange([0, 10000000])}
                  />
                </Badge>
              )}
              {selectedRoomTypes.map(type => {
                const roomType = roomTypes.find(t => t.value === type);
                return (
                  <Badge key={type} className="bg-primary text-primary-foreground gap-1">
                    {roomType?.label}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleRoomType(type)} />
                  </Badge>
                );
              })}
            </div>
          </div>
        )
      }

      {/* Results */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Error State */}
        {error && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center animate-fade-in">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Thử lại
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
                <div className="h-48 bg-muted animate-skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded animate-skeleton w-3/4" />
                  <div className="h-4 bg-muted rounded animate-skeleton w-1/2" />
                  <div className="h-4 bg-muted rounded animate-skeleton w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && roomCards.length === 0 && (
          <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center animate-fade-in">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy phòng</h3>
            <p className="text-muted-foreground mb-4">Thử điều chỉnh bộ lọc để xem thêm kết quả</p>
            <Button onClick={handleResetFilters} variant="outline" className="rounded-xl">
              Đặt lại bộ lọc
            </Button>
          </div>
        )}

        {/* Results List */}
        {!loading && !error && roomCards.length > 0 && viewMode === "list" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {roomCards.map((room) => (
              <RoomCard
                key={room.id}
                {...room}
                onClick={onRoomClick}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        )}

        {/* Map View */}
        {!loading && !error && viewMode === "map" && (
          <div className="bg-muted/30 rounded-2xl h-[600px] flex items-center justify-center border border-border">
            <div className="text-center">
              <Map className="w-16 h-16 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Chế độ xem bản đồ sắp ra mắt</p>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
