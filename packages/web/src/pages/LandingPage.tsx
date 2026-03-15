import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarRange,
  LocateFixed,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RoomCard } from '@/components/common/RoomCard';
import { searchRooms } from '@/services/rooms';
import { reverseGeocodeCoordinates } from '@/services/mapboxGeocoding';
import { transformRoomToCardProps } from '@/utils/room';
import { buildSearchParamsFromState, getSelectedLocationLabel } from './searchPage.utils';
import type { SelectedMapboxPlace } from '@/components/maps/mapboxGeocoding.utils';

const FEATURED_ROOM_LIMIT = 4;
const NEARBY_ROOM_LIMIT = 3;
const DEFAULT_NEARBY_RADIUS_KM = 5;

const QUICK_INTENTS = [
  { title: 'Tìm phòng', path: '/search', icon: Search },
  { title: 'Tìm bạn cùng phòng', path: '/roommates', icon: Users },
  { title: 'Ở ngắn hạn', path: '/swap', icon: CalendarRange },
  { title: 'Trở thành host', path: '/become-host', icon: Building2 },
] as const;

const POPULAR_LOCATIONS = [
  'Bách Khoa Hà Nội',
  'Cầu Giấy',
  'Mỹ Đình',
  'Thành phố Thủ Đức',
  'Bình Thạnh',
  'Làng Đại học',
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<SelectedMapboxPlace | null>(null);
  const [isLocatingCurrentLocation, setIsLocatingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: featuredResponse, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['landing', 'featured-rooms'],
    queryFn: () =>
      searchRooms({
        isVerified: true,
        sortBy: 'newest',
        page: 1,
        pageSize: FEATURED_ROOM_LIMIT,
      }),
    staleTime: 60_000,
  });

  const { data: nearbyResponse, isLoading: isNearbyLoading } = useQuery({
    queryKey: ['landing', 'nearby-rooms', currentLocation?.lat, currentLocation?.lng],
    queryFn: () =>
      searchRooms({
        latitude: currentLocation!.lat,
        longitude: currentLocation!.lng,
        radiusKm: DEFAULT_NEARBY_RADIUS_KM,
        sortBy: 'newest',
        page: 1,
        pageSize: NEARBY_ROOM_LIMIT,
      }),
    enabled: Boolean(currentLocation),
    staleTime: 30_000,
  });

  const featuredRooms = useMemo(
    () => (featuredResponse?.rooms ?? []).map((room) => ({ room, cardProps: transformRoomToCardProps(room) })),
    [featuredResponse?.rooms],
  );

  const nearbyRooms = useMemo(
    () => (nearbyResponse?.rooms ?? []).map((room) => ({ room, cardProps: transformRoomToCardProps(room) })),
    [nearbyResponse?.rooms],
  );

  const currentLocationLabel = getSelectedLocationLabel(currentLocation);

  const openSearch = (query: string) => {
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
  };

  const openCurrentLocationSearch = () => {
    if (!currentLocation) {
      return;
    }

    const params = buildSearchParamsFromState({
      searchInput: '',
      selectedLocation: currentLocation,
      radiusKm: DEFAULT_NEARBY_RADIUS_KM,
      locationSource: 'current_location',
    });

    navigate(`/search?${params.toString()}`);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt này không hỗ trợ lấy vị trí hiện tại.');
      return;
    }

    setIsLocatingCurrentLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 120_000,
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const resolvedPlace = await reverseGeocodeCoordinates(latitude, longitude);

      setCurrentLocation(
        resolvedPlace ?? {
          address: 'Vị trí hiện tại',
          city: undefined,
          district: undefined,
          lat: latitude,
          lng: longitude,
        },
      );
    } catch {
      setLocationError('Không thể lấy vị trí hiện tại. Hãy thử lại hoặc tìm theo khu vực.');
    } finally {
      setIsLocatingCurrentLocation(false);
    }
  };

  const resetCurrentLocation = () => {
    setCurrentLocation(null);
    setLocationError(null);
  };

  return (
    <div className="bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_18%,#f8fafc_72%,#ffffff_100%)] pb-16 md:pb-8">
      <section className="px-6 pb-10 pt-14 md:pb-12 md:pt-16">
        <div className="mx-auto max-w-6xl rounded-[36px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_28%),linear-gradient(180deg,#fbfdff_0%,#ffffff_68%)] px-6 py-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.24)] md:px-8 md:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">RommZ</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] text-slate-950 md:text-6xl">
              Tìm phòng gần nơi bạn cần ở.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Nhập khu vực, trường học hoặc địa điểm bạn quan tâm. Khi cần, bạn có thể bật vị trí hiện tại để xem phòng gần mình.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] backdrop-blur-[2px] sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <Input
                placeholder="Khu vực, trường học hoặc địa điểm bạn muốn ở..."
                className="border-0 bg-transparent px-0 text-base focus-visible:ring-0"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && openSearch(searchQuery)}
              />
            </div>
            <Button onClick={() => openSearch(searchQuery)} size="lg" className="rounded-2xl px-8">
              Tìm phòng ngay
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_INTENTS.map((intent) => {
              const Icon = intent.icon;
              return (
                <button
                  key={intent.title}
                  type="button"
                  onClick={() => navigate(intent.path)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {intent.title}
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,252,0.96)_100%)] p-4 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm font-medium text-slate-500">Tìm nhanh theo khu vực</span>
                {POPULAR_LOCATIONS.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => openSearch(location)}
                    className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    {location}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!currentLocation ? (
                  <Button variant="outline" className="rounded-full px-4" onClick={handleUseCurrentLocation} disabled={isLocatingCurrentLocation}>
                    {isLocatingCurrentLocation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lấy vị trí
                      </>
                    ) : (
                      <>
                        <LocateFixed className="mr-2 h-4 w-4" />
                        Dùng vị trí hiện tại
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                      Gần bạn: {currentLocationLabel || 'Khu vực đã chọn'}
                    </span>
                    <Button variant="outline" className="rounded-full px-4" onClick={openCurrentLocationSearch}>
                      Mở tìm phòng gần đây
                    </Button>
                    <Button variant="ghost" className="rounded-full px-3" onClick={resetCurrentLocation}>
                      Bỏ vị trí
                    </Button>
                  </>
                )}
              </div>
            </div>

            {locationError ? <p className="mt-3 text-sm text-rose-600">{locationError}</p> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="rounded-[32px] border border-amber-100/80 bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_100%)] px-6 py-8 shadow-[0_24px_60px_-52px_rgba(15,23,42,0.22)] md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Phòng nổi bật</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Phòng mới lên</h2>
            <p className="mt-2 text-sm text-slate-600">Xem nhanh vài phòng đang mở trước khi vào bộ lọc chi tiết.</p>
          </div>
          <Button variant="outline" className="rounded-2xl px-6" onClick={() => navigate('/search')}>
            Xem tất cả
          </Button>
        </div>

        {isFeaturedLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: FEATURED_ROOM_LIMIT }).map((_, index) => (
              <Card key={index} className="h-[340px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-50" />
            ))}
          </div>
        ) : featuredRooms.length === 0 ? (
          <Card className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
            Chưa có phòng nổi bật để hiển thị.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredRooms.map(({ room, cardProps }) => (
              <RoomCard
                key={room.id}
                {...cardProps}
                showFavoriteButton={false}
                onClick={() => navigate(`/room/${room.id}`)}
              />
            ))}
          </div>
        )}
        </div>
      </section>

      {currentLocation ? (
        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,#f6fbff_0%,#ffffff_100%)] px-6 py-8 shadow-[0_24px_60px_-52px_rgba(15,23,42,0.24)] md:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Gần bạn</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Quanh {currentLocationLabel || 'khu vực đã chọn'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl px-6" onClick={openCurrentLocationSearch}>
                Xem đầy đủ trong tìm phòng
              </Button>
              <Button variant="ghost" className="rounded-2xl px-4" onClick={resetCurrentLocation}>
                Bỏ vị trí
              </Button>
            </div>
          </div>

          {isNearbyLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: NEARBY_ROOM_LIMIT }).map((_, index) => (
                <Card key={index} className="h-[300px] animate-pulse rounded-[26px] border border-slate-200 bg-slate-50" />
              ))}
            </div>
          ) : nearbyRooms.length === 0 ? (
            <Card className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              Chưa có phòng phù hợp trong {DEFAULT_NEARBY_RADIUS_KM} km quanh khu vực này.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nearbyRooms.map(({ room, cardProps }) => (
                <RoomCard
                  key={room.id}
                  {...cardProps}
                  showFavoriteButton={false}
                  onClick={() => navigate(`/room/${room.id}`)}
                />
              ))}
            </div>
          )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
