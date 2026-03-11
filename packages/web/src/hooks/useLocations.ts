import { useQuery } from '@tanstack/react-query';
import {
  getFeaturedLocations,
  getNearbyLocations,
  searchLocationCatalog,
  type FeaturedLocationFilters,
  type NearbyLocationFilters,
  type SearchLocationCatalogFilters,
} from '@/services/locations';

export const locationKeys = {
  all: ['locations'] as const,
  search: (filters: SearchLocationCatalogFilters) => [...locationKeys.all, 'search', filters] as const,
  nearby: (filters: NearbyLocationFilters) => [...locationKeys.all, 'nearby', filters] as const,
  featured: (filters: FeaturedLocationFilters) => [...locationKeys.all, 'featured', filters] as const,
};

export function useLocationCatalogSearch(filters: SearchLocationCatalogFilters) {
  const query = filters.query.trim();

  return useQuery({
    queryKey: locationKeys.search(filters),
    queryFn: () => searchLocationCatalog(filters),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}

export function useNearbyLocations(filters: NearbyLocationFilters | null) {
  return useQuery({
    queryKey: locationKeys.nearby(filters ?? { lat: 0, lng: 0 }),
    queryFn: () => getNearbyLocations(filters as NearbyLocationFilters),
    enabled: Boolean(filters?.lat && filters?.lng),
    staleTime: 60_000,
  });
}

export function useFeaturedLocations(filters: FeaturedLocationFilters = {}) {
  return useQuery({
    queryKey: locationKeys.featured(filters),
    queryFn: () => getFeaturedLocations(filters),
    staleTime: 60_000,
  });
}
