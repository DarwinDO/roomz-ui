import { expect, test } from '@playwright/test';
import { supabase } from '@/lib/supabase';
import {
  getFeaturedLocations,
  getNearbyLocations,
  locationCatalogToSelectedPlace,
  searchLocationCatalog,
} from './locations';

const originalRpc = supabase.rpc.bind(supabase);
const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

test.beforeEach(() => {
  rpcCalls.length = 0;
  supabase.rpc = (async (name: string, args: Record<string, unknown>) => {
    rpcCalls.push({ name, args });
    return {
      data: [],
      error: null,
    };
  }) as typeof supabase.rpc;
});

test.afterEach(() => {
  supabase.rpc = originalRpc;
});

test.describe('locations service', () => {
  test('passes search filters through to search_location_catalog RPC', async () => {
    await searchLocationCatalog({
      query: 'Bach Khoa',
      city: 'Thành phố Hà Nội',
      types: ['university', 'campus'],
      limit: 4,
    });

    expect(rpcCalls).toEqual([
      {
        name: 'search_location_catalog',
        args: {
          p_query: 'Bach Khoa',
          p_city: 'Thành phố Hà Nội',
          p_types: ['university', 'campus'],
          p_limit: 4,
        },
      },
    ]);
  });

  test('passes radius filters through to get_nearby_locations RPC', async () => {
    await getNearbyLocations({
      lat: 21.0067,
      lng: 105.8431,
      city: 'Thành phố Hà Nội',
      radiusKm: 6,
      limit: 5,
      types: ['station', 'landmark'],
    });

    expect(rpcCalls).toEqual([
      {
        name: 'get_nearby_locations',
        args: {
          p_lat: 21.0067,
          p_lng: 105.8431,
          p_radius_km: 6,
          p_limit: 5,
          p_types: ['station', 'landmark'],
          p_city: 'Thành phố Hà Nội',
        },
      },
    ]);
  });

  test('fetches featured locations via dedicated RPC', async () => {
    await getFeaturedLocations({
      limit: 3,
      types: ['district'],
    });

    expect(rpcCalls).toEqual([
      {
        name: 'get_featured_locations',
        args: {
          p_city: null,
          p_types: ['district'],
          p_limit: 3,
        },
      },
    ]);
  });

  test('maps location catalog rows into a selected search place', () => {
    expect(
      locationCatalogToSelectedPlace({
        id: 'loc-1',
        name: 'Đại học Bách khoa Hà Nội',
        location_type: 'university',
        city: 'Thành phố Hà Nội',
        district: 'Quận Hai Bà Trưng',
        address: '1 Đại Cồ Việt',
        latitude: 21.0042,
        longitude: 105.8431,
        tags: [],
        source_name: 'seed',
        source_url: null,
      }),
    ).toEqual({
      address: 'Đại học Bách khoa Hà Nội, Quận Hai Bà Trưng, Thành phố Hà Nội',
      lat: 21.0042,
      lng: 105.8431,
      city: 'Thành phố Hà Nội',
      district: 'Quận Hai Bà Trưng',
    });
  });
});
