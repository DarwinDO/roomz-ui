import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoomCard } from "@/components/common/RoomCard";
import { MapboxGeocoding, MapboxRoomMap } from "@/components/maps";
import {
  buildRoomSearchQuery,
  sanitizeRoomSearchInput,
  type SelectedMapboxPlace,
} from "@/components/maps/mapboxGeocoding.utils";
import { formatPriceInMillions } from "@roomz/shared/utils/format";
import { transformRoomToCardProps } from "@/utils/room";
import { useSearchRooms, useDebounce, useLocationCatalogSearch } from "@/hooks";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Search, SlidersHorizontal, Map, List, X, Wifi, Car, WashingMachine, UtensilsCrossed, PawPrint, Armchair, CheckCircle2, Loader2, AlertCircle, ChevronDown, GraduationCap, Landmark, TrainFront, MapPinned, Sparkles, LocateFixed } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { SortOption } from "@/services/rooms";
import {
  formatLocationCatalogSubtitle,
  formatLocationTypeLabel,
  locationCatalogToSelectedPlace,
  type LocationCatalogEntry,
} from "@/services/locations";
import { reverseGeocodeCoordinates } from "@/services/mapboxGeocoding";
import { searchRooms } from "@/services/rooms";
import {
  trackFeatureEvent,
  trackLocationSelected,
  trackSearchPerformed,
} from "@/services/analyticsTracking";
import {
  buildSearchParamsFromState,
  getNextRadiusOption,
  getSelectedLocationLabel,
  parseSearchLocationState,
} from "./searchPage.utils";

function getLocationIcon(type: LocationCatalogEntry["location_type"]) {
  switch (type) {
    case "university":
    case "campus":
      return GraduationCap;
    case "station":
      return TrainFront;
    case "landmark":
      return Landmark;
    default:
      return MapPinned;
  }
}

const DEFAULT_SEARCH_RADIUS_KM = 5;
const CURRENT_LOCATION_LABEL = "V\u1ecb tr\u00ed hi\u1ec7n t\u1ea1i";

export default function SearchPage() {
  const locationRadiusOptions = [3, 5, 10, 20];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const lastTrackedSearchFingerprint = useRef<string | null>(null);
  const isHydratingFromUrlRef = useRef(true);

  // Filters state
  const [searchInput, setSearchInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SelectedMapboxPlace | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showVerifiedCheck, setShowVerifiedCheck] = useState(false);
  const [isLocatingCurrentLocation, setIsLocatingCurrentLocation] = useState(false);
  const [isCurrentLocationSearch, setIsCurrentLocationSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    isHydratingFromUrlRef.current = true;

    const {
      query,
      selectedLocation: nextLocation,
      radiusKm,
      locationSource,
    } = parseSearchLocationState(searchParams);

    setSearchInput((current) => (current === query ? current : query));
    setSearchRadiusKm((current) => (current === radiusKm ? current : radiusKm));
    setIsCurrentLocationSearch(locationSource === "current_location");
    setSelectedLocation((current) => {
      if (
        current?.address === nextLocation?.address &&
        current?.lat === nextLocation?.lat &&
        current?.lng === nextLocation?.lng &&
        current?.city === nextLocation?.city &&
        current?.district === nextLocation?.district
      ) {
        return current;
      }

      return nextLocation;
    });
  }, [searchParams]);

  const effectiveSearchQuery = useMemo(() => {
    if (selectedLocation) {
      return isCurrentLocationSearch
        ? sanitizeRoomSearchInput(searchInput)
        : buildRoomSearchQuery(selectedLocation);
    }

    return sanitizeRoomSearchInput(searchInput);
  }, [isCurrentLocationSearch, searchInput, selectedLocation]);

  const debouncedSearchQuery = useDebounce(effectiveSearchQuery, 400);
  const debouncedCatalogQuery = useDebounce(searchInput.trim(), 250);
  const selectedLocationLabel = useMemo(() => {
    if (!selectedLocation) {
      return "";
    }

    if (!isCurrentLocationSearch) {
      return getSelectedLocationLabel(selectedLocation);
    }

    const areaLabel = getSelectedLocationLabel(selectedLocation);
    return areaLabel ? `${areaLabel} - ${CURRENT_LOCATION_LABEL}` : CURRENT_LOCATION_LABEL;
  }, [isCurrentLocationSearch, selectedLocation]);

  useEffect(() => {
    if (isHydratingFromUrlRef.current) {
      isHydratingFromUrlRef.current = false;
      return;
    }

    const nextParams = buildSearchParamsFromState({
      searchInput,
      selectedLocation,
      radiusKm: searchRadiusKm,
      locationSource: selectedLocation
        ? isCurrentLocationSearch
          ? "current_location"
          : "mapbox"
        : null,
    });

    const currentParams = searchParams.toString();
    const nextParamsString = nextParams.toString();

    if (currentParams === nextParamsString) {
      return;
    }

    setSearchParams(nextParams, { replace: true });
  }, [
    isCurrentLocationSearch,
    searchInput,
    searchParams,
    searchRadiusKm,
    selectedLocation,
    setSearchParams,
  ]);

  // Extract price range values for stable dependencies
  const minPrice = priceRange[0];
  const maxPrice = priceRange[1];

  // Derive structured amenity filters once to avoid repeated array scans.
  const amenityFilters = useMemo(() => {
    const hasPetAllowed = selectedAmenities.includes("pet_allowed");
    const hasFurnished = selectedAmenities.includes("furnished");
    const otherAmenities = selectedAmenities.filter(
      (amenity) => amenity !== "pet_allowed" && amenity !== "furnished"
    );

    return {
      petAllowed: hasPetAllowed ? true : undefined,
      furnished: hasFurnished ? true : undefined,
      otherAmenities,
    };
  }, [selectedAmenities]);

  const roomFilters = useMemo(() => ({
    minPrice,
    maxPrice,
    isVerified: verifiedOnly ? true : undefined,
    searchQuery: debouncedSearchQuery || undefined,
    roomTypes: selectedRoomTypes.length > 0 ? selectedRoomTypes : undefined,
    petAllowed: amenityFilters.petAllowed,
    furnished: amenityFilters.furnished,
    amenities: amenityFilters.otherAmenities.length > 0 ? amenityFilters.otherAmenities : undefined,
    latitude: selectedLocation?.lat,
    longitude: selectedLocation?.lng,
    radiusKm: selectedLocation ? searchRadiusKm : undefined,
    sortBy,
  }), [minPrice, maxPrice, verifiedOnly, debouncedSearchQuery, selectedRoomTypes, amenityFilters, selectedLocation, searchRadiusKm, sortBy]);

  const hasActiveSearchIntent = useMemo(() => (
    Boolean(debouncedSearchQuery) ||
    Boolean(selectedLocation) ||
    verifiedOnly ||
    selectedRoomTypes.length > 0 ||
    selectedAmenities.length > 0 ||
    minPrice > 0 ||
    maxPrice < 10000000
  ), [
    debouncedSearchQuery,
    selectedLocation,
    verifiedOnly,
    selectedRoomTypes.length,
    selectedAmenities.length,
    minPrice,
    maxPrice,
  ]);

  const searchAnalyticsFilters = useMemo(
    () => ({
      min_price: minPrice,
      max_price: maxPrice,
      verified_only: verifiedOnly,
      room_types: selectedRoomTypes,
      amenities: selectedAmenities,
      has_location: Boolean(selectedLocation),
      location_label: selectedLocationLabel || null,
      location_city: selectedLocation?.city ?? null,
      location_district: selectedLocation?.district ?? null,
      radius_km: selectedLocation ? searchRadiusKm : null,
      sort_by: sortBy,
    }),
    [
      minPrice,
      maxPrice,
      verifiedOnly,
      selectedRoomTypes,
      selectedAmenities,
      selectedLocation,
      selectedLocationLabel,
      searchRadiusKm,
      sortBy,
    ],
  );

  // Fetch rooms via TanStack Query (infinite pagination)
  const {
    rooms, totalCount, isLoading, isFetchingNextPage,
    error, refetch, hasNextPage, fetchNextPage, isPlaceholderData,
  } = useSearchRooms(roomFilters);

  useEffect(() => {
    if (!hasActiveSearchIntent || isLoading || isPlaceholderData || error) {
      return;
    }

    const fingerprint = JSON.stringify({
      query: debouncedSearchQuery,
      location: selectedLocationLabel || selectedLocation?.address || null,
      radius: selectedLocation ? searchRadiusKm : null,
      filters: searchAnalyticsFilters,
      result_count: totalCount,
    });

    if (lastTrackedSearchFingerprint.current === fingerprint) {
      return;
    }

    lastTrackedSearchFingerprint.current = fingerprint;
    void trackSearchPerformed(user?.id ?? null, {
      query: debouncedSearchQuery || (selectedLocation ? selectedLocationLabel : "browse_all"),
      resultCount: totalCount,
      filters: searchAnalyticsFilters,
    });
  }, [
    debouncedSearchQuery,
    error,
    hasActiveSearchIntent,
    isLoading,
    isPlaceholderData,
    searchAnalyticsFilters,
    searchRadiusKm,
    selectedLocation,
    selectedLocationLabel,
    totalCount,
    user?.id,
  ]);

  const {
    data: locationSuggestions = [],
    isLoading: isLocationSuggestionsLoading,
  } = useLocationCatalogSearch({
    query: debouncedCatalogQuery,
    limit: 5,
    types: ["university", "campus", "district", "station", "landmark"],
  });
  const shouldShowCatalogSuggestions = !selectedLocation && debouncedCatalogQuery.length >= 2;
  const shouldSuppressMapboxSuggestions =
    shouldShowCatalogSuggestions &&
    (isLocationSuggestionsLoading || locationSuggestions.length > 0);

  // Fetch favorites
  const { isFavorited, toggleFavorite } = useFavorites();

  // Query active sublet room IDs for badge display + navigation
  const { data: subletRoomMap } = useQuery({
    queryKey: ['active-sublet-room-map'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sublet_listings')
        .select('id, original_room_id')
        .eq('status', 'active');
      const result: Record<string, string> = {};
      data?.forEach(s => { result[s.original_room_id] = s.id; });
      return result;
    },
    staleTime: 60_000,
  });

  const onRoomClick = (id: string) => {
    const subletId = subletRoomMap?.[id];
    if (subletId) {
      navigate(`/sublet/${subletId}`);
    } else {
      navigate(`/room/${id}`);
    }
  };

  const handleFavorite = async (roomId: string) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để lưu phòng yêu thích");
      navigate('/login');
      return;
    }

    try {
      const favorited = await toggleFavorite(roomId);
      if (favorited) {
        const room = rooms.find((entry) => entry.id === roomId);
        void trackFeatureEvent("room_favorite", user.id, {
          room_id: roomId,
          room_title: room?.title ?? null,
          city: room?.city ?? null,
          district: room?.district ?? null,
          price: room?.price_per_month ?? null,
          source: "search_results",
        });
      }
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
    { id: "parking", label: "Chỗ để xe", icon: Car },
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
    setSearchInput("");
    setSelectedLocation(null);
    setSearchRadiusKm(DEFAULT_SEARCH_RADIUS_KM);
    setIsCurrentLocationSearch(false);
    setSortBy('newest');
    toast.success("Đã đặt lại bộ lọc");
  };

  const handleApplyFilters = () => {
    setIsFiltersOpen(false);
    void trackFeatureEvent("filter_applied", user?.id ?? null, searchAnalyticsFilters);
    toast.success("Đã áp dụng bộ lọc");
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);

    if (selectedLocation && value.trim() !== selectedLocation.address) {
      setSelectedLocation(null);
      setIsCurrentLocationSearch(false);
    }
  };

  const handleLocationSelect = (place: SelectedMapboxPlace) => {
    setSelectedLocation(place);
    setSearchInput(place.address);
    setSearchRadiusKm(DEFAULT_SEARCH_RADIUS_KM);
    setIsCurrentLocationSearch(false);
    void trackLocationSelected(user?.id ?? null, {
      source: "mapbox",
      label: buildRoomSearchQuery(place),
      address: place.address,
      city: place.city ?? null,
      district: place.district ?? null,
      latitude: place.lat,
      longitude: place.lng,
    });
  };

  const handleCatalogLocationSelect = (location: LocationCatalogEntry) => {
    const selectedPlace = locationCatalogToSelectedPlace(location);

    if (!selectedPlace) {
      toast.info("Địa điểm này chưa có tọa độ để tìm theo bán kính.");
      return;
    }

    setSelectedLocation(selectedPlace);
    setSearchInput(selectedPlace.address);
    setSearchRadiusKm(DEFAULT_SEARCH_RADIUS_KM);
    setIsCurrentLocationSearch(false);
    void trackLocationSelected(user?.id ?? null, {
      source: "catalog",
      label: location.name,
      address: selectedPlace.address,
      city: selectedPlace.city ?? null,
      district: selectedPlace.district ?? null,
      latitude: selectedPlace.lat,
      longitude: selectedPlace.lng,
      locationCatalogId: location.id,
    });
  };

  const clearSelectedLocation = () => {
    setSelectedLocation(null);
    setIsCurrentLocationSearch(false);
    setSearchInput("");
    setSearchRadiusKm(DEFAULT_SEARCH_RADIUS_KM);
  };

  const handleUseCurrentLocation = () => {
    if (isLocatingCurrentLocation) {
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Trình duyệt này không hỗ trợ định vị.");
      return;
    }

    setIsLocatingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const reversePlace = await reverseGeocodeCoordinates(latitude, longitude).catch(() => null);
        const nextLocation: SelectedMapboxPlace = reversePlace
          ? {
              ...reversePlace,
              lat: latitude,
              lng: longitude,
            }
          : {
              address: "",
              lat: latitude,
              lng: longitude,
            };

        setSelectedLocation(nextLocation);
        setSearchInput("");
        setSearchRadiusKm(DEFAULT_SEARCH_RADIUS_KM);
        setIsCurrentLocationSearch(true);
        setIsLocatingCurrentLocation(false);

        void trackLocationSelected(user?.id ?? null, {
          source: "current_location",
          label: CURRENT_LOCATION_LABEL,
          address: nextLocation.address,
          city: nextLocation.city ?? null,
          district: nextLocation.district ?? null,
          latitude: nextLocation.lat,
          longitude: nextLocation.lng,
        });

        toast.success(
          reversePlace
            ? `Đang tìm quanh ${getSelectedLocationLabel(nextLocation)}.`
            : "Đang tìm quanh vị trí hiện tại.",
        );
      },
      (error) => {
        setIsLocatingCurrentLocation(false);

        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          toast.info("Bạn chưa cấp quyền vị trí. Hãy cho phép trình duyệt truy cập vị trí nếu muốn tìm quanh đây.");
          return;
        }

        toast.error("Không thể lấy vị trí hiện tại. Hãy thử lại sau.");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  // Transform rooms to card props (no more client-side filtering!)
  const roomCards = useMemo(() => {
    return rooms.map(room => transformRoomToCardProps(room, isFavorited(room.id)));
  }, [rooms, isFavorited]);

  const emptyRadiusSuggestion = useQuery({
    queryKey: [
      "rooms",
      "search-radius-suggestion",
      selectedLocation?.lat ?? null,
      selectedLocation?.lng ?? null,
      debouncedSearchQuery || null,
      minPrice,
      maxPrice,
      verifiedOnly,
      selectedRoomTypes.join(","),
      selectedAmenities.join(","),
      sortBy,
      searchRadiusKm,
    ],
    enabled: Boolean(selectedLocation) && !isLoading && !error && roomCards.length === 0,
    staleTime: 30_000,
    queryFn: async () => {
      const nextRadii = locationRadiusOptions.filter((radius) => radius > searchRadiusKm);

      for (const radius of nextRadii) {
        const result = await searchRooms({
          ...roomFilters,
          radiusKm: radius,
          page: 1,
          pageSize: 1,
        });

        if (result.totalCount > 0) {
          return {
            radius,
            totalCount: result.totalCount,
          };
        }
      }

      return null;
    },
  });

  const suggestedRadius = emptyRadiusSuggestion.data?.radius ?? null;
  const suggestedRoomCount = emptyRadiusSuggestion.data?.totalCount ?? 0;
  const nextRadiusOption = getNextRadiusOption(searchRadiusKm, locationRadiusOptions);
  const activeFilterCount =
    (verifiedOnly ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    selectedRoomTypes.length +
    selectedAmenities.length +
    (selectedLocation ? 1 : 0);
  const hasActiveFilters =
    verifiedOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000000 ||
    selectedRoomTypes.length > 0 ||
    selectedAmenities.length > 0;
  const selectedAmenityItems = amenities.filter((amenity) =>
    selectedAmenities.includes(amenity.id),
  );
  const resultsLabel = selectedLocation
    ? `Kết quả quanh ${selectedLocationLabel}`
    : debouncedSearchQuery
      ? `Kết quả cho "${debouncedSearchQuery}"`
      : "Nguồn phòng đang mở";

  return (
    <div className="bg-[var(--hero-bg)] pb-20 md:pb-8">
      <section className="px-4 pb-6 pt-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[32px] border-border/70 bg-card/92 p-6 shadow-soft-lg md:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm">
              <Search className="h-3.5 w-3.5" />
              Bộ tìm phòng
            </div>
            <h1 className="mt-5 max-w-[14ch] text-foreground">
              Khoá khu vực sống thật trước, rồi mới lọc sâu tới mức phòng phù hợp.
            </h1>
            <p className="mt-4 max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-base">
              Search của RommZ ưu tiên đúng ngữ cảnh thuê trọ: nơi ở gần trường, quận, landmark
              hoặc vị trí hiện tại, sau đó mới chốt bộ lọc giá, tiện nghi và xác thực.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="rounded-full bg-primary/10 text-primary">Ưu tiên phòng đã xác thực</Badge>
              <Badge className="rounded-full bg-secondary/10 text-secondary">List hoặc bản đồ</Badge>
              <Badge className="rounded-full bg-amber-100 text-warning">Theo bán kính khu vực</Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card className="rounded-[24px] border-border/70 bg-muted/30 p-4 shadow-none">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm font-semibold text-foreground">Trust signal trước</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tin đã xác thực và trạng thái còn trống được đẩy lên sớm hơn trong decision flow.
                </p>
              </Card>
              <Card className="rounded-[24px] border-border/70 bg-muted/30 p-4 shadow-none">
                <MapPinned className="h-6 w-6 text-secondary" />
                <p className="mt-4 text-sm font-semibold text-foreground">Theo khu vực thật</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Dùng trường, landmark hoặc vị trí hiện tại thay vì chỉ gõ tự do và lọc mù.
                </p>
              </Card>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[32px] border-border/70 bg-[var(--hero-card-search)] p-6 shadow-soft-lg md:p-7">
            <div className="rounded-[28px] bg-[#102131] p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                    Bảng điều hướng
                  </p>
                  <p className="mt-3 max-w-[28ch] text-2xl font-semibold leading-tight text-white">
                    Nhìn nhanh khu vực, bộ lọc đang bật và cách bạn muốn xem kết quả.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-sky-100">
                  <Search className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Khu vực</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectedLocationLabel || "Chưa khóa"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Bộ lọc</p>
                  <p className="mt-2 text-sm font-semibold text-white">{activeFilterCount} đang bật</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Chế độ xem</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {viewMode === "list" ? "Danh sách" : "Bản đồ"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Card className="rounded-[24px] border-border/70 bg-white/90 p-4 shadow-soft">
                <Map className="h-6 w-6 text-warning" />
                <p className="mt-4 text-sm font-semibold text-foreground">Hai góc nhìn</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Xem dạng danh sách để so sánh, hoặc mở bản đồ khi bạn cần định vị nhanh hơn.
                </p>
              </Card>
              <Card className="rounded-[24px] border-border/70 bg-white/90 p-4 shadow-soft">
                <Sparkles className="h-6 w-6 text-primary" />
                <p className="mt-4 text-sm font-semibold text-foreground">Từ khu vực đến quyết định</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Flow ưu tiên khoanh vùng trước, rồi mới đi sâu vào mức giá và tiện nghi.
                </p>
              </Card>
            </div>
          </Card>
        </div>
      </section>

      {/* Search Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-md">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <div className="mb-3 flex items-center gap-2">
            <MapboxGeocoding
              value={searchInput}
              onChange={handleSearchInputChange}
              onSelect={handleLocationSelect}
              placeholder="Tìm theo địa chỉ, khu vực hoặc trường học..."
              className="flex-1"
              suppressSuggestions={shouldSuppressMapboxSuggestions}
              inputId="search-location"
              inputAriaLabel="Tìm theo địa chỉ, khu vực hoặc trường học"
            />
            <Button
              type="button"
              variant={isCurrentLocationSearch ? "default" : "outline"}
              onClick={handleUseCurrentLocation}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsCurrentLocationSearch(false);
                }
              }}
              disabled={isLocatingCurrentLocation}
              className="shrink-0 rounded-full px-3 md:px-4"
            >
              {isLocatingCurrentLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              <span className="ml-2 hidden lg:inline">
                {isCurrentLocationSearch ? "Đang dùng vị trí hiện tại" : "Dùng vị trí hiện tại"}
              </span>
            </Button>
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="shrink-0 rounded-full border-border px-4">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Bộ lọc
                  {activeFilterCount > 0 ? (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {activeFilterCount}
                    </span>
                  ) : null}
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
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90 h-11"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {shouldShowCatalogSuggestions && (
            <div className="mb-3 rounded-2xl border border-border/70 bg-card/80 p-2 shadow-sm">
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Gợi ý khu vực nội bộ
                </div>
                {isLocationSuggestionsLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {locationSuggestions.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {locationSuggestions.map((location) => {
                    const Icon = getLocationIcon(location.location_type);
                    const hasCoordinates = location.latitude !== null && location.longitude !== null;

                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleCatalogLocationSelect(location)}
                        className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                      >
                        <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{location.name}</p>
                            <Badge variant="outline" className="rounded-full text-[10px]">
                              {formatLocationTypeLabel(location.location_type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatLocationCatalogSubtitle(location)}
                          </p>
                          {!hasCoordinates && (
                            <p className="mt-1 text-[11px] text-amber-700">
                              Chưa có tọa độ chính xác, chỉ phù hợp để tham khảo.
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                !isLocationSuggestionsLoading && (
                  <p className="px-2 pb-2 text-sm text-muted-foreground">
                    Chưa có điểm mốc nội bộ phù hợp. Bạn vẫn có thể chọn gợi ý từ Mapbox hoặc nhập địa chỉ tự do.
                  </p>
                )
              )}
            </div>
          )}

          {selectedLocation && (
            <div className="mb-4 rounded-[28px] border border-border/70 bg-card/85 p-4 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Search radius
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground md:text-base">
                    <MapPinned className="h-4 w-4 text-primary" />
                    {selectedLocationLabel}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearSelectedLocation}
                  className="h-10 rounded-full px-4 text-sm"
                >
                  Bỏ vị trí
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Bán kính
                </span>
                {locationRadiusOptions.map((radius) => (
                  <Button
                    key={radius}
                    type="button"
                    size="sm"
                    variant={searchRadiusKm === radius ? "default" : "outline"}
                    onClick={() => setSearchRadiusKm(radius)}
                    className="h-9 rounded-full px-4 text-xs"
                  >
                    {radius} km
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-border/70 bg-card/90 p-4 shadow-soft">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Results overview
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground md:text-2xl">{resultsLabel}</h2>
                  <Badge variant="outline" className="rounded-full border-border/70 bg-background">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải
                      </span>
                    ) : (
                      `${totalCount} phòng còn trống`
                    )}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="search-sort" className="sr-only">
                  Sắp xếp kết quả
                </label>
                <select
                  id="search-sort"
                  aria-label="Sắp xếp kết quả"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-10 rounded-full border border-border bg-card px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="most_viewed">Xem nhiều nhất</option>
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-full px-4"
                    aria-label="Hiển thị dạng danh sách"
                  >
                    <List className="mr-2 h-4 w-4" />
                    Danh sách
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-full px-4"
                    aria-label="Hiển thị dạng bản đồ"
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Bản đồ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {(selectedLocation || hasActiveFilters) && (
        <section className="px-4 py-4">
          <div className="mx-auto max-w-6xl rounded-[28px] border border-border/70 bg-card/85 p-4 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Active filters
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Đang áp dụng {activeFilterCount} tín hiệu lọc để giữ kết quả sát hơn với nhu cầu hiện tại.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={handleResetFilters}
                className="h-9 rounded-full px-4 text-sm"
              >
                Xóa tất cả
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedLocation ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                  <MapPinned className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedLocationLabel}</span>
                  <button
                    type="button"
                    onClick={clearSelectedLocation}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Bỏ vị trí tìm kiếm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              {verifiedOnly ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Đã xác thực</span>
                  <button
                    type="button"
                    onClick={() => setVerifiedOnly(false)}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Bỏ lọc đã xác thực"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              {priceRange[0] > 0 || priceRange[1] < 10000000 ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm shadow-sm">
                  <span>
                    {formatPriceInMillions(priceRange[0])}tr - {formatPriceInMillions(priceRange[1])}tr
                  </span>
                  <button
                    type="button"
                    onClick={() => setPriceRange([0, 10000000])}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Bỏ lọc khoảng giá"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              {selectedRoomTypes.map((type) => {
                const roomType = roomTypes.find((item) => item.value === type);

                return (
                  <div
                    key={type}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <span>{roomType?.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleRoomType(type)}
                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={`Bỏ lọc loại phòng ${roomType?.label ?? type}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}

              {selectedAmenityItems.map((amenity) => (
                <div
                  key={amenity.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm shadow-sm"
                >
                  <amenity.icon className="h-3.5 w-3.5 text-primary" />
                  <span>{amenity.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Bỏ lọc tiện nghi ${amenity.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-6 text-center animate-fade-in">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive mb-4">{error instanceof Error ? error.message : 'Đã xảy ra lỗi'}</p>
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
              Thử lại
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="grid gap-4 stagger-children sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-soft">
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
        {!isLoading && !error && roomCards.length === 0 && (
          <div className="rounded-[32px] border border-border/70 bg-[var(--hero-empty-state)] p-12 text-center animate-fade-in shadow-soft">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="mb-2 text-xl font-semibold">
              {selectedLocation ? `Không có phòng trong ${searchRadiusKm} km` : "Không tìm thấy phòng"}
            </h3>
            <p className="mx-auto mb-4 max-w-2xl text-muted-foreground">
              {selectedLocation
                ? suggestedRadius
                  ? `Hiện chưa có phòng trong ${searchRadiusKm} km quanh ${selectedLocationLabel}. Có ${suggestedRoomCount} phòng nếu mở rộng lên ${suggestedRadius} km.`
                  : `Hiện chưa có phòng phù hợp trong ${searchRadiusKm} km quanh ${selectedLocationLabel}.`
                : "Thử điều chỉnh bộ lọc để xem thêm kết quả."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {selectedLocation && suggestedRadius ? (
                <Button onClick={() => setSearchRadiusKm(suggestedRadius)} className="rounded-xl">
                  Mở rộng lên {suggestedRadius} km
                </Button>
              ) : selectedLocation && nextRadiusOption ? (
                <Button onClick={() => setSearchRadiusKm(nextRadiusOption)} className="rounded-xl">
                  Thử {nextRadiusOption} km
                </Button>
              ) : null}
              {selectedLocation ? (
                <Button onClick={clearSelectedLocation} variant="outline" className="rounded-xl">
                  Bỏ vị trí và xem tất cả
                </Button>
              ) : null}
              <Button onClick={handleResetFilters} variant="outline" className="rounded-xl">
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>
        )}

        {/* Results List */}
        {!isLoading && !error && roomCards.length > 0 && viewMode === "list" && (
          <>
            <div className={`grid gap-4 stagger-children sm:grid-cols-2 lg:grid-cols-3 ${isPlaceholderData ? 'opacity-60 transition-opacity' : ''}`}>
              {roomCards.map((room) => (
                <RoomCard
                  key={room.id}
                  {...room}
                  isSublet={!!(subletRoomMap?.[room.id])}
                  onClick={onRoomClick}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="min-h-[44px] rounded-full px-8 py-3 transition-colors hover:bg-primary hover:text-white"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  )}
                  Xem thêm ({totalCount - roomCards.length} phòng còn lại)
                </Button>
              </div>
            )}
          </>
        )}

        {/* Map View */}
        {!isLoading && !error && viewMode === "map" && (
          <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-soft">
            <MapboxRoomMap
              rooms={rooms}
              className="h-[calc(100vh-220px)] min-h-[520px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

