import {
  buildRoomSearchQuery,
  sanitizeRoomSearchInput,
  type SelectedMapboxPlace,
} from "@/components/maps/mapboxGeocoding.utils";

export type SearchLocationSource = "mapbox" | "catalog" | "current_location" | null;

type SearchStateForUrl = {
  searchInput: string;
  selectedLocation: SelectedMapboxPlace | null;
  radiusKm: number;
  locationSource: SearchLocationSource;
};

function parseNumericSearchParam(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasValidSearchCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  if (latitude === null || longitude === null) {
    return false;
  }

  const isWithinBounds =
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  return isWithinBounds && !(latitude === 0 && longitude === 0);
}

export function parseSearchLocationState(searchParams: URLSearchParams): {
  query: string;
  selectedLocation: SelectedMapboxPlace | null;
  radiusKm: number;
  locationSource: SearchLocationSource;
} {
  const query = searchParams.get("q")?.trim() ?? "";
  const address = searchParams.get("address")?.trim() || query;
  const city = searchParams.get("city")?.trim() || undefined;
  const district = searchParams.get("district")?.trim() || undefined;
  const rawLocationSource = searchParams.get("location_source");
  const latitude = parseNumericSearchParam(searchParams.get("lat"));
  const longitude = parseNumericSearchParam(searchParams.get("lng"));
  const radius = parseNumericSearchParam(searchParams.get("radius"));
  const hasCoordinates = hasValidSearchCoordinates(latitude, longitude);
  const locationSource: SearchLocationSource =
    rawLocationSource === "mapbox" ||
    rawLocationSource === "catalog" ||
    rawLocationSource === "current_location"
      ? rawLocationSource
      : null;

  return {
    query,
    selectedLocation:
      hasCoordinates && latitude !== null && longitude !== null
        ? {
            address,
            lat: latitude,
            lng: longitude,
            city,
            district,
          }
        : null,
    radiusKm: hasCoordinates && radius !== null && radius > 0 ? radius : 5,
    locationSource,
  };
}

export function getSelectedLocationLabel(place: SelectedMapboxPlace | null): string {
  if (!place) {
    return "";
  }

  return (
    buildRoomSearchQuery(place) ||
    sanitizeRoomSearchInput(place.address) ||
    "Khu vực đã chọn"
  );
}

export function buildSearchParamsFromState(state: SearchStateForUrl): URLSearchParams {
  const nextParams = new URLSearchParams();
  const trimmedSearchInput = state.searchInput.trim();

  if (trimmedSearchInput) {
    nextParams.set("q", trimmedSearchInput);
  }

  if (!state.selectedLocation) {
    return nextParams;
  }

  nextParams.set("lat", String(state.selectedLocation.lat));
  nextParams.set("lng", String(state.selectedLocation.lng));
  nextParams.set("radius", String(state.radiusKm));

  if (state.selectedLocation.address.trim()) {
    nextParams.set("address", state.selectedLocation.address.trim());
  }

  if (state.selectedLocation.city?.trim()) {
    nextParams.set("city", state.selectedLocation.city.trim());
  }

  if (state.selectedLocation.district?.trim()) {
    nextParams.set("district", state.selectedLocation.district.trim());
  }

  if (state.locationSource) {
    nextParams.set("location_source", state.locationSource);
  }

  return nextParams;
}

export function getNextRadiusOption(currentRadius: number, options: number[]): number | null {
  return options.find((option) => option > currentRadius) ?? null;
}
