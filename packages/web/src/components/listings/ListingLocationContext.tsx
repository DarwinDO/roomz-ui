import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { MapboxRoomMap } from "@/components/maps";
import { useNearbyLocations } from "@/hooks";
import { formatDistance } from "@roomz/shared/utils/geo";
import { Compass, GraduationCap, Landmark, TrainFront } from "lucide-react";
import {
  formatLocationTypeLabel,
  type LocationCatalogEntry,
} from "@/services/locations";
import type { RoomWithDetails } from "@/services/rooms";

interface ListingLocationContextProps {
  listing: Pick<
    RoomWithDetails,
    "id" | "title" | "city" | "district" | "latitude" | "longitude" | "price_per_month"
  > & {
    images?: { image_url: string }[];
  };
  nearbyTitle?: string;
  nearbyDescription?: string;
  emptyCoordsText?: string;
  emptyNearbyText?: string;
}

function getNearbyLocationIcon(type: LocationCatalogEntry["location_type"]) {
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

export function ListingLocationContext({
  listing,
  nearbyTitle = "Điểm mốc quanh chỗ ở",
  nearbyDescription = "Trường, ga bến và landmark nổi bật trong bán kính 5 km.",
  emptyCoordsText = "Tin đăng này chưa có tọa độ đủ chính xác để hiển thị bản đồ và các điểm mốc lân cận.",
  emptyNearbyText = "Chúng tôi đang cập nhật thêm các điểm mốc nổi bật quanh khu vực này.",
}: ListingLocationContextProps) {
  const mapRooms = useMemo(
    () =>
      [
        {
          id: listing.id,
          title: listing.title,
          city: listing.city,
          district: listing.district,
          latitude: listing.latitude,
          longitude: listing.longitude,
          price_per_month: listing.price_per_month,
          images: listing.images ?? [],
        },
      ] as RoomWithDetails[],
    [listing],
  );

  const { data: nearbyLocations = [], isLoading: isNearbyLocationsLoading } =
    useNearbyLocations(
      listing.latitude && listing.longitude
        ? {
            lat: Number(listing.latitude),
            lng: Number(listing.longitude),
            city: listing.city,
            radiusKm: 5,
            limit: 6,
            types: ["university", "station", "landmark", "district"],
          }
        : null,
    );

  return (
    <>
      <div className="hidden md:block">
        <h3 className="mb-3 text-lg font-semibold">Vị trí trên bản đồ</h3>
        <MapboxRoomMap rooms={mapRooms} singleRoom interactive={false} className="h-[350px]" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{nearbyTitle}</h3>
            <p className="text-sm text-muted-foreground">{nearbyDescription}</p>
          </div>
          <Badge variant="outline" className="rounded-full">
            Điểm quanh đây
          </Badge>
        </div>

        {!listing.latitude || !listing.longitude ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
            {emptyCoordsText}
          </div>
        ) : isNearbyLocationsLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : nearbyLocations.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {nearbyLocations.map((location) => {
              const Icon = getNearbyLocationIcon(location.location_type);

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
                          {[location.district, location.city].filter(Boolean).join(", ") ||
                            location.address ||
                            "Đang cập nhật địa chỉ"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {formatLocationTypeLabel(location.location_type)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span>{location.source_name || "Gợi ý của RoomZ"}</span>
                    <span className="font-medium text-foreground">
                      {location.distance_km !== null && location.distance_km !== undefined
                        ? formatDistance(location.distance_km)
                        : "Gần khu vực này"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
            {emptyNearbyText}
          </div>
        )}
      </div>
    </>
  );
}
