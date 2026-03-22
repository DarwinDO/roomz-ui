import type { SelectedMapboxPlace } from "@/components/maps/mapboxGeocoding.utils";

const GLOBAL_PREFERRED_SEARCH_AREA_KEY = "rommz_preferred_search_area";

export type PreferredSearchAreaSource = "text" | "location" | "current_location";

export type PreferredSearchArea = {
  label: string;
  searchPath: string;
  source: PreferredSearchAreaSource;
  updatedAt: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number | null;
};

type PreferredSearchAreaParams = {
  query?: string;
  selectedLocation?: SelectedMapboxPlace | null;
  radiusKm?: number;
  locationSource?: "mapbox" | "catalog" | "current_location" | null;
};

function getUserPreferredSearchAreaKey(userId: string) {
  return `${GLOBAL_PREFERRED_SEARCH_AREA_KEY}:${userId}`;
}

function hasUsableCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  return typeof latitude === "number" && typeof longitude === "number";
}

export function buildPreferredSearchAreaSearchPath({
  query,
  selectedLocation,
  radiusKm,
  locationSource,
}: PreferredSearchAreaParams) {
  const params = new URLSearchParams();
  const trimmedQuery = query?.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (selectedLocation && hasUsableCoordinates(selectedLocation.lat, selectedLocation.lng)) {
    params.set("lat", String(selectedLocation.lat));
    params.set("lng", String(selectedLocation.lng));
    params.set("radius", String(radiusKm ?? 5));

    if (selectedLocation.address.trim()) {
      params.set("address", selectedLocation.address.trim());
    }

    if (selectedLocation.city?.trim()) {
      params.set("city", selectedLocation.city.trim());
    }

    if (selectedLocation.district?.trim()) {
      params.set("district", selectedLocation.district.trim());
    }

    if (locationSource) {
      params.set("location_source", locationSource);
    }
  }

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

function parsePreferredSearchArea(
  rawValue: string | null,
): PreferredSearchArea | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PreferredSearchArea>;

    if (
      typeof parsed.label !== "string" ||
      typeof parsed.searchPath !== "string" ||
      typeof parsed.source !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      label: parsed.label,
      searchPath: parsed.searchPath,
      source:
        parsed.source === "current_location" ||
        parsed.source === "location" ||
        parsed.source === "text"
          ? parsed.source
          : "text",
      updatedAt: parsed.updatedAt,
      address: parsed.address ?? null,
      city: parsed.city ?? null,
      district: parsed.district ?? null,
      latitude: parsed.latitude ?? null,
      longitude: parsed.longitude ?? null,
      radiusKm: parsed.radiusKm ?? null,
    };
  } catch {
    return null;
  }
}

export function savePreferredSearchArea(
  preferredSearchArea: PreferredSearchArea,
  userId?: string | null,
) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(preferredSearchArea);
  window.localStorage.setItem(GLOBAL_PREFERRED_SEARCH_AREA_KEY, serialized);

  if (userId) {
    window.localStorage.setItem(getUserPreferredSearchAreaKey(userId), serialized);
  }
}

export function loadPreferredSearchArea(userId?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }

  if (userId) {
    const userScopedArea = parsePreferredSearchArea(
      window.localStorage.getItem(getUserPreferredSearchAreaKey(userId)),
    );

    if (userScopedArea) {
      return userScopedArea;
    }
  }

  return parsePreferredSearchArea(
    window.localStorage.getItem(GLOBAL_PREFERRED_SEARCH_AREA_KEY),
  );
}

export function getPreferredSearchAreaSourceLabel(source: PreferredSearchAreaSource) {
  switch (source) {
    case "current_location":
      return "Vị trí hiện tại";
    case "location":
      return "Khu vực đã khóa";
    default:
      return "Từ khóa gần nhất";
  }
}
