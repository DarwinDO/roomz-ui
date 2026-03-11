import { supabase } from '@/lib/supabase';
import type { SelectedMapboxPlace } from '@/components/maps/mapboxGeocoding.utils';

export type LocationCatalogType =
  | 'university'
  | 'district'
  | 'neighborhood'
  | 'poi'
  | 'campus'
  | 'station'
  | 'landmark';

export interface LocationCatalogEntry {
  id: string;
  name: string;
  location_type: LocationCatalogType;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  source_name: string | null;
  source_url: string | null;
  distance_km?: number | null;
}

export interface SearchLocationCatalogFilters {
  query: string;
  city?: string | null;
  types?: LocationCatalogType[];
  limit?: number;
}

export interface NearbyLocationFilters {
  lat: number;
  lng: number;
  radiusKm?: number;
  city?: string | null;
  types?: LocationCatalogType[];
  limit?: number;
}

export interface FeaturedLocationFilters {
  city?: string | null;
  types?: LocationCatalogType[];
  limit?: number;
}

const DEFAULT_LOCATION_LIMIT = 6;

export async function searchLocationCatalog(
  filters: SearchLocationCatalogFilters,
): Promise<LocationCatalogEntry[]> {
  const query = filters.query.trim();
  if (query.length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_location_catalog' as never, {
    p_query: query,
    p_city: filters.city ?? null,
    p_types: filters.types?.length ? filters.types : null,
    p_limit: filters.limit ?? DEFAULT_LOCATION_LIMIT,
  } as never);

  if (error) {
    throw error;
  }

  return (data ?? []) as LocationCatalogEntry[];
}

export async function getNearbyLocations(
  filters: NearbyLocationFilters,
): Promise<LocationCatalogEntry[]> {
  const { data, error } = await supabase.rpc('get_nearby_locations' as never, {
    p_lat: filters.lat,
    p_lng: filters.lng,
    p_radius_km: filters.radiusKm ?? 5,
    p_limit: filters.limit ?? DEFAULT_LOCATION_LIMIT,
    p_types: filters.types?.length ? filters.types : null,
    p_city: filters.city ?? null,
  } as never);

  if (error) {
    throw error;
  }

  return (data ?? []) as LocationCatalogEntry[];
}

export async function getFeaturedLocations(
  filters: FeaturedLocationFilters = {},
): Promise<LocationCatalogEntry[]> {
  const { data, error } = await supabase.rpc('get_featured_locations' as never, {
    p_city: filters.city ?? null,
    p_types: filters.types?.length ? filters.types : null,
    p_limit: filters.limit ?? DEFAULT_LOCATION_LIMIT,
  } as never);

  if (error) {
    throw error;
  }

  return (data ?? []) as LocationCatalogEntry[];
}

export function formatLocationCatalogSubtitle(location: Pick<LocationCatalogEntry, 'district' | 'city' | 'address'>): string {
  const area = [location.district, location.city].filter(Boolean).join(', ');
  return area || location.address || 'Địa điểm nổi bật';
}

export function formatLocationTypeLabel(type: LocationCatalogType): string {
  switch (type) {
    case 'university':
      return 'Trường đại học';
    case 'district':
      return 'Khu vực';
    case 'neighborhood':
      return 'Lân cận';
    case 'campus':
      return 'Campus';
    case 'station':
      return 'Ga / bến';
    case 'landmark':
      return 'Điểm mốc';
    case 'poi':
    default:
      return 'Địa điểm';
  }
}

export function locationCatalogToSelectedPlace(
  location: LocationCatalogEntry,
): SelectedMapboxPlace | null {
  if (location.latitude === null || location.longitude === null) {
    return null;
  }

  const address = [
    location.name,
    location.district,
    location.city,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    address,
    lat: Number(location.latitude),
    lng: Number(location.longitude),
    city: location.city ?? undefined,
    district: location.district ?? undefined,
  };
}
