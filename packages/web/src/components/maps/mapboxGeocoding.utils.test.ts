import { describe, expect, test } from 'vitest';
import {
  buildRoomSearchQuery,
  filterMapboxSuggestions,
  mapboxFeatureToSelectedPlace,
  sanitizeRoomSearchInput,
  shouldUseAddressSuggestions,
  type MapboxFeature,
} from './mapboxGeocoding.utils';

describe('mapbox geocoding utils', () => {
  test('buildRoomSearchQuery prefers district and city over the full street address', () => {
    expect(
      buildRoomSearchQuery({
        address: '12 Duy Tan, Cau Giay, Ha Noi',
        district: 'Quan Cau Giay',
        city: 'Thanh pho Ha Noi',
      }),
    ).toBe('Quan Cau Giay, Thanh pho Ha Noi');
  });

  test('buildRoomSearchQuery strips Vietnam suffix when city and district are missing', () => {
    expect(
      buildRoomSearchQuery({
        address: 'Thanh pho Ho Chi Minh, Viet Nam',
      }),
    ).toBe('Thanh pho Ho Chi Minh');
  });

  test('sanitizeRoomSearchInput removes the Vietnam suffix from raw manual queries', () => {
    expect(sanitizeRoomSearchInput('Thanh pho Ho Chi Minh, Viet Nam')).toBe(
      'Thanh pho Ho Chi Minh',
    );
    expect(sanitizeRoomSearchInput('Ha Noi')).toBe('Ha Noi');
  });

  test('buildRoomSearchQuery falls back to city or address when finer-grained area data is missing', () => {
    expect(
      buildRoomSearchQuery({
        address: '12 Duy Tan, Ha Noi',
        city: 'Thanh pho Ha Noi',
      }),
    ).toBe('Thanh pho Ha Noi');

    expect(
      buildRoomSearchQuery({
        address: '12 Duy Tan, Ha Noi',
      }),
    ).toBe('12 Duy Tan, Ha Noi');
  });

  test('mapboxFeatureToSelectedPlace extracts lat/lng and best-effort city and district context', () => {
    const place = mapboxFeatureToSelectedPlace({
      id: 'feature-1',
      text: '12 Duy Tan',
      place_name: '12 Duy Tan, Cau Giay, Ha Noi, Viet Nam',
      center: [105.783, 21.036],
      place_type: ['address'],
      context: [
        { id: 'district.1', text: 'Quan Cau Giay' },
        { id: 'place.1', text: 'Thanh pho Ha Noi' },
        { id: 'country.1', text: 'Viet Nam' },
      ],
    });

    expect(place).toEqual({
      address: '12 Duy Tan, Cau Giay, Ha Noi',
      lat: 21.036,
      lng: 105.783,
      city: 'Thanh pho Ha Noi',
      district: 'Quan Cau Giay',
    });
  });

  test('mapboxFeatureToSelectedPlace keeps city-level selections anchored to the city instead of the country', () => {
    const place = mapboxFeatureToSelectedPlace({
      id: 'place.17652',
      text: 'Ha Noi',
      place_name: 'Ha Noi, Viet Nam',
      center: [105.854444, 21.02945],
      place_type: ['region', 'place'],
      context: [{ id: 'country.8948', text: 'Viet Nam' }],
    });

    expect(place).toEqual({
      address: 'Ha Noi',
      lat: 21.02945,
      lng: 105.854444,
      city: 'Ha Noi',
      district: undefined,
    });
  });

  test('shouldUseAddressSuggestions only opts into address search for address-like queries', () => {
    expect(shouldUseAddressSuggestions('12 Duy Tan')).toBe(true);
    expect(shouldUseAddressSuggestions('bach khoa')).toBe(false);
    expect(shouldUseAddressSuggestions('ha noi')).toBe(false);
  });

  test('filterMapboxSuggestions keeps only exact semantic matches and drops fuzzy lookalikes', () => {
    const features: MapboxFeature[] = [
      {
        id: 'place.17652',
        text: 'Ha Noi',
        place_name: 'Ha Noi, Viet Nam',
        center: [105.854444, 21.02945],
        place_type: ['region', 'place'],
      },
      {
        id: 'locality.1',
        text: 'Noi Thon',
        place_name: 'Noi Thon, Cao Bang, Viet Nam',
        center: [106, 22],
        place_type: ['locality'],
      },
      {
        id: 'locality.2',
        text: 'Ma Noi',
        place_name: 'Ma Noi, Khanh Hoa, Viet Nam',
        center: [108, 11],
        place_type: ['locality'],
      },
    ];

    expect(filterMapboxSuggestions(features, 'ha noi').map((feature) => feature.id)).toEqual([
      'place.17652',
    ]);
    expect(filterMapboxSuggestions(features, 'bach khoa')).toEqual([]);
  });
});
