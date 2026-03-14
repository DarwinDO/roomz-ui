import {
  mapboxFeatureToSelectedPlace,
  type SelectedMapboxPlace,
  type MapboxFeature,
} from '@/components/maps/mapboxGeocoding.utils';

const env = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env ?? {};

const MAPBOX_TOKEN = env.VITE_MAPBOX_ACCESS_TOKEN;
const VIETNAM_BOUNDING_BOX = '102.0,8.0,110.5,24.5';

const CITY_ALIASES = new Map<string, string>([
  ['ha noi', 'Thành phố Hà Nội'],
  ['hanoi', 'Thành phố Hà Nội'],
  ['thanh pho ha noi', 'Thành phố Hà Nội'],
  ['tp ha noi', 'Thành phố Hà Nội'],
  ['ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['ho chi minh city', 'Thành phố Hồ Chí Minh'],
  ['thanh pho ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['tp ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['tphcm', 'Thành phố Hồ Chí Minh'],
  ['sai gon', 'Thành phố Hồ Chí Minh'],
  ['da nang', 'Thành phố Đà Nẵng'],
  ['thanh pho da nang', 'Thành phố Đà Nẵng'],
  ['tp da nang', 'Thành phố Đà Nẵng'],
  ['can tho', 'Thành phố Cần Thơ'],
  ['thanh pho can tho', 'Thành phố Cần Thơ'],
  ['tp can tho', 'Thành phố Cần Thơ'],
]);

const DISTRICT_PREFIX_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^q\.?\s+/i, 'Quận '],
  [/^quan\s+/i, 'Quận '],
  [/^h\.?\s+/i, 'Huyện '],
  [/^huyen\s+/i, 'Huyện '],
  [/^tp\.?\s+/i, 'Thành phố '],
  [/^thanh pho\s+/i, 'Thành phố '],
  [/^tx\.?\s+/i, 'Thị xã '],
  [/^thi xa\s+/i, 'Thị xã '],
];

export interface RoomLocationInput {
  address: string;
  district?: string | null;
  city?: string | null;
}

export interface NormalizedRoomLocation {
  address: string;
  district?: string;
  city?: string;
}

export interface GeocodedRoomLocation {
  address: string;
  district?: string;
  city?: string;
  latitude: number;
  longitude: number;
  placeName: string;
}

function simplifyText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/,+$/g, '')
    .trim();
}

function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeAddressText(value: string | null | undefined): string {
  return normalizeWhitespace(value ?? '');
}

export function normalizeCityName(value: string | null | undefined): string | undefined {
  const normalized = normalizeAddressText(value);
  if (!normalized) return undefined;

  const alias = CITY_ALIASES.get(simplifyText(normalized));
  return alias ?? normalized;
}

export function normalizeDistrictName(value: string | null | undefined): string | undefined {
  let normalized = normalizeAddressText(value);
  if (!normalized) return undefined;

  for (const [pattern, replacement] of DISTRICT_PREFIX_REPLACEMENTS) {
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, replacement);
      break;
    }
  }

  return capitalizeWords(normalized);
}

export function normalizeRoomLocationInput(input: RoomLocationInput): NormalizedRoomLocation {
  const address = normalizeAddressText(input.address);
  const city = normalizeCityName(input.city);
  const district = normalizeDistrictName(input.district);

  return {
    address,
    city,
    district,
  };
}

export function buildRoomGeocodingQuery(input: RoomLocationInput): string {
  const normalized = normalizeRoomLocationInput(input);

  return [normalized.address, normalized.district, normalized.city]
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

async function fetchMapboxFeatures(query: string): Promise<MapboxFeature[]> {
  if (!MAPBOX_TOKEN || query.length < 3) {
    return [];
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      'country=vn&' +
      'language=vi&' +
      'types=address,district,locality,place,region&' +
      `bbox=${VIETNAM_BOUNDING_BOX}&` +
      'limit=1',
  );

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  return data.features ?? [];
}

export async function geocodeRoomLocation(
  input: RoomLocationInput,
): Promise<GeocodedRoomLocation | null> {
  const normalizedInput = normalizeRoomLocationInput(input);
  const query = buildRoomGeocodingQuery(normalizedInput);

  if (!query || !MAPBOX_TOKEN) {
    return null;
  }

  const [feature] = await fetchMapboxFeatures(query);
  if (!feature) {
    return null;
  }

  const place = mapboxFeatureToSelectedPlace(feature);

  return {
    address: normalizedInput.address,
    district: normalizeDistrictName(place.district ?? normalizedInput.district),
    city: normalizeCityName(place.city ?? normalizedInput.city),
    latitude: place.lat,
    longitude: place.lng,
    placeName: feature.place_name,
  };
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<SelectedMapboxPlace | null> {
  if (!MAPBOX_TOKEN) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
      `access_token=${MAPBOX_TOKEN}&` +
      'country=vn&' +
      'language=vi&' +
      'types=address,district,locality,place,region,neighborhood&' +
      `bbox=${VIETNAM_BOUNDING_BOX}&` +
      'limit=1',
  );

  if (!response.ok) {
    throw new Error(`Mapbox reverse geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  const [feature] = data.features ?? [];

  if (!feature) {
    return null;
  }

  return mapboxFeatureToSelectedPlace(feature);
}
