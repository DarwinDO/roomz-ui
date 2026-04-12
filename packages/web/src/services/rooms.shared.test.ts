import { describe, expect, test } from 'vitest';
import { searchRooms } from '@roomz/shared/services/rooms';

describe('shared rooms search service', () => {
  test('passes geo filters through to the search_rooms RPC', async () => {
    const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const supabase = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });
        return {
          data: [],
          error: null,
        };
      },
    };

    await searchRooms(supabase as never, {
      searchQuery: 'Quan Cau Giay, Thanh pho Ha Noi',
      latitude: 21.036805,
      longitude: 105.782639,
      radiusKm: 5,
      sortBy: 'newest',
      page: 2,
      pageSize: 24,
    });

    expect(rpcCalls).toEqual([
      {
        name: 'search_rooms',
        args: {
          p_search_query: 'Quan Cau Giay, Thanh pho Ha Noi',
          p_district: null,
          p_min_price: null,
          p_max_price: null,
          p_room_types: null,
          p_is_verified: null,
          p_pet_allowed: null,
          p_furnished: null,
          p_amenities: null,
          p_lat: 21.036805,
          p_lng: 105.782639,
          p_radius_km: 5,
          p_sort_by: 'newest',
          p_page: 2,
          p_page_size: 24,
        },
      },
    ]);
  });
});
