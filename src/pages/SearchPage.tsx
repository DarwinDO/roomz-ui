import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoomCard } from "@/components/common/RoomCard";
import { Search, SlidersHorizontal, Map, List, X, Wifi, Car, WashingMachine, UtensilsCrossed, PawPrint, Armchair, CheckCircle2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SearchPage() {
  const navigate = useNavigate();
  
  const onRoomClick = (id: string) => {
    navigate(`/room/${id}`);
  };
  const [priceRange, setPriceRange] = useState([500, 1500]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [showVerifiedCheck, setShowVerifiedCheck] = useState(false);

  const mockRooms = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1668089677938-b52086753f77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYwNjM2NDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Cozy Private Room near Campus",
      location: "University District",
      price: 850,
      distance: "0.3 mi",
      verified: true,
      available: true,
      matchPercentage: 92,
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYmVkcm9vbXxlbnwxfHx8fDE3NjA2MzgzMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Modern Studio with City View",
      location: "Downtown",
      price: 1250,
      distance: "1.2 mi",
      verified: true,
      available: true,
      matchPercentage: 85,
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc2MDY3MzE2NXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Shared Apartment with Great Amenities",
      location: "Midtown",
      price: 650,
      distance: "0.7 mi",
      verified: false,
      available: true,
      matchPercentage: 78,
    },
    {
      id: "4",
      image: "https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwc3R1ZGVudCUyMHJvb218ZW58MXx8fHwxNzYwNjA0MDMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Bright Room in Student Housing",
      location: "College Town",
      price: 720,
      distance: "0.5 mi",
      verified: true,
      available: true,
      matchPercentage: 88,
    },
    {
      id: "5",
      image: "https://images.unsplash.com/photo-1691126223630-ac10cb81f1f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwYXBhcnRtZW50JTIwdmlld3xlbnwxfHx8fDE3NjA2MDc2MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Luxury Apartment with Rooftop",
      location: "Financial District",
      price: 1600,
      distance: "2.1 mi",
      verified: true,
      available: true,
      matchPercentage: 72,
    },
    {
      id: "6",
      image: "https://images.unsplash.com/photo-1758523417133-41f21fb9f058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGFyZWQlMjBraXRjaGVuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc2MDY3MzE2Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Spacious Room with Kitchen Access",
      location: "West End",
      price: 790,
      distance: "1.5 mi",
      verified: false,
      available: true,
      matchPercentage: 81,
    },
  ];

  const roomTypes = ["Private Room", "Shared Room", "Studio", "Entire Place"];
  
  const amenities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "parking", label: "Parking", icon: Car },
    { id: "laundry", label: "Laundry", icon: WashingMachine },
    { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { id: "pet", label: "Pet Friendly", icon: PawPrint },
    { id: "furnished", label: "Furnished", icon: Armchair },
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
    setPriceRange([0, 3000]);
    setVerifiedOnly(false);
    setSelectedRoomTypes([]);
    setSelectedAmenities([]);
    setShowVerifiedCheck(false);
    toast.success("Filters reset");
  };

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsApplyingFilters(false);
    setIsFiltersOpen(false);
    toast.success("Filters applied");
  };

  const filteredRooms = mockRooms.filter((room) => {
    if (verifiedOnly && !room.verified) return false;
    if (room.price < priceRange[0] || room.price > priceRange[1]) return false;
    return true;
  });

  return (
    <div className="pb-20 md:pb-8">
      {/* Search Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search location..."
                className="pl-10 rounded-full border-gray-200"
              />
            </div>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {/* Price Range Section */}
                  <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <Label className="mb-3 block text-base">Price Range</Label>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                        ${priceRange[0]}
                      </span>
                      <span className="text-xs text-gray-400">to</span>
                      <span className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                        ${priceRange[1]}
                      </span>
                    </div>
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={3000}
                        step={50}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>$0</span>
                        <span>$3000</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified Only Section */}
                  <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="verified-toggle" className="text-base cursor-pointer">
                          Verified Only
                        </Label>
                        <AnimatePresence>
                          {showVerifiedCheck && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                    <p className="text-xs text-gray-500 mt-1">Show only verified listings</p>
                  </div>

                  {/* Room Type Section */}
                  <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <Label className="mb-3 block text-base">Room Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {roomTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleRoomType(type)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all h-9 ${
                            selectedRoomTypes.includes(type)
                              ? "bg-primary text-white shadow-md"
                              : "bg-[#F5F5F5] text-[#333333] hover:bg-gray-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <Label className="mb-3 block text-base">Amenities</Label>
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
                            <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
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
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleResetFilters}
                      className="flex-1 rounded-full border-gray-300 hover:bg-gray-50 h-11"
                    >
                      Reset Filters
                    </Button>
                    <Button
                      onClick={handleApplyFilters}
                      disabled={isApplyingFilters}
                      className="flex-1 rounded-full bg-primary hover:bg-primary/90 h-11"
                    >
                      {isApplyingFilters ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        "Apply Filters"
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* View Toggle & Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredRooms.length} rooms available
            </p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-full"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-full"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(verifiedOnly || priceRange[0] > 0 || priceRange[1] < 2500) && (
        <div className="px-4 py-3 bg-gray-50 border-b border-border">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
            {verifiedOnly && (
              <Badge className="bg-primary text-white gap-1">
                Verified Only
                <X className="w-3 h-3 cursor-pointer" onClick={() => setVerifiedOnly(false)} />
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 2500) && (
              <Badge className="bg-primary text-white gap-1">
                ${priceRange[0]} - ${priceRange[1]}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setPriceRange([0, 2500])}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {viewMode === "list" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} {...room} onClick={onRoomClick} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-2xl h-[600px] flex items-center justify-center">
            <div className="text-center">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Map view coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
