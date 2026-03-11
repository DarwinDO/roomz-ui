export interface MapboxFeatureContext {
  id: string;
  text: string;
}

export interface MapboxFeature {
  id: string;
  text?: string;
  place_name: string;
  center: [number, number];
  place_type?: string[];
  context?: MapboxFeatureContext[];
}

export interface SelectedMapboxPlace {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
}

type MapboxFeatureType =
  | 'address'
  | 'district'
  | 'locality'
  | 'place'
  | 'region'
  | 'neighborhood'
  | 'unknown';

function getContextText(
  context: MapboxFeatureContext[] | undefined,
  prefixes: string[],
): string | undefined {
  if (!context?.length) return undefined;

  const match = context.find((entry) =>
    prefixes.some((prefix) => entry.id.startsWith(prefix)),
  );

  return match?.text;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isCountryLabel(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = normalizeSearchText(value);
  return normalized === 'viet nam' || normalized === 'vietnam';
}

function sanitizePlacePart(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || isCountryLabel(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function stripCountrySuffix(placeName: string): string {
  const segments = placeName
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  while (segments.length > 0 && isCountryLabel(segments[segments.length - 1])) {
    segments.pop();
  }

  return segments.join(', ');
}

export function sanitizeRoomSearchInput(query: string): string {
  return stripCountrySuffix(query).trim();
}

function getFeatureType(feature: MapboxFeature): MapboxFeatureType {
  const placeTypes = feature.place_type ?? [];
  const priority: MapboxFeatureType[] = ['address', 'district', 'locality', 'place', 'region', 'neighborhood'];

  for (const type of priority) {
    if (placeTypes.includes(type)) {
      return type;
    }
  }

  const inferredType = feature.id.split('.')[0];
  if (priority.includes(inferredType as MapboxFeatureType)) {
    return inferredType as MapboxFeatureType;
  }

  return 'unknown';
}

function composePlaceLabel(...parts: Array<string | undefined>): string {
  const uniqueParts: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const sanitized = sanitizePlacePart(part);
    if (!sanitized) continue;

    const key = normalizeSearchText(sanitized);
    if (seen.has(key)) continue;

    seen.add(key);
    uniqueParts.push(sanitized);
  }

  return uniqueParts.join(', ');
}

function getFeatureMatchText(feature: MapboxFeature): string[] {
  return [feature.text, feature.place_name, stripCountrySuffix(feature.place_name)]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .map(normalizeSearchText);
}

export function shouldUseAddressSuggestions(query: string): boolean {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return false;
  }

  return (
    /\d/.test(query) ||
    ['duong', 'street', 'road', 'ngo', 'ngach', 'hem', 'so nha', 'ward', 'phuong'].some((keyword) =>
      normalized.includes(keyword),
    )
  );
}

export function filterMapboxSuggestions(
  features: MapboxFeature[],
  query: string,
): MapboxFeature[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const exactOrPrefixMatches = features.filter((feature) =>
    getFeatureMatchText(feature).some(
      (text) => text === normalizedQuery || text.startsWith(`${normalizedQuery},`) || text.startsWith(`${normalizedQuery} `),
    ),
  );

  const containsMatches = features.filter((feature) =>
    getFeatureMatchText(feature).some((text) => text.includes(normalizedQuery)),
  );

  const candidates = exactOrPrefixMatches.length > 0 ? exactOrPrefixMatches : containsMatches;

  return candidates.filter((feature) => !isCountryLabel(feature.text));
}

export function mapboxFeatureToSelectedPlace(feature: MapboxFeature): SelectedMapboxPlace {
  const [lng, lat] = feature.center;
  const featureType = getFeatureType(feature);
  const featureText = sanitizePlacePart(feature.text) || sanitizePlacePart(stripCountrySuffix(feature.place_name).split(',')[0]);
  const contextDistrict = sanitizePlacePart(getContextText(feature.context, ['district.']));
  const contextLocality = sanitizePlacePart(getContextText(feature.context, ['locality.', 'neighborhood.']));
  const contextPlace = sanitizePlacePart(getContextText(feature.context, ['place.']));
  const contextRegion = sanitizePlacePart(getContextText(feature.context, ['region.']));

  let district: string | undefined;
  let city: string | undefined;
  let address = stripCountrySuffix(feature.place_name);

  switch (featureType) {
    case 'place':
    case 'region':
      city = featureText || contextPlace || contextRegion;
      address = city || address;
      break;
    case 'district':
    case 'locality':
    case 'neighborhood':
      district = featureText || contextDistrict || contextLocality;
      city = contextPlace || contextRegion;
      address = composePlaceLabel(district, city) || address;
      break;
    case 'address':
    case 'unknown':
    default:
      district = contextDistrict || contextLocality;
      city = contextPlace || contextRegion;
      break;
  }

  return {
    address,
    lat,
    lng,
    city,
    district,
  };
}

export function buildRoomSearchQuery(
  place: Pick<SelectedMapboxPlace, 'address' | 'city' | 'district'>,
): string {
  const areaQuery = composePlaceLabel(place.district, place.city);

  return areaQuery || sanitizePlacePart(place.city) || sanitizeRoomSearchInput(place.address);
}
