import { describe, expect, test } from 'vitest';
import { getRoomContact, searchRooms } from '@roomz/shared/services/rooms';

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

  test('maps landlord premium metadata from the search_rooms RPC into the room contract', async () => {
    const supabase = {
      rpc: async () => ({
        data: [
          {
            id: 'room-1',
            landlord_id: 'landlord-1',
            title: 'Studio room',
            description: 'Nice place',
            room_type: 'studio',
            address: '123 Street',
            district: 'District 1',
            city: 'HCMC',
            latitude: 10.1,
            longitude: 106.1,
            price_per_month: 5000000,
            deposit_amount: 1000000,
            area_sqm: 24,
            bedroom_count: 1,
            bathroom_count: 1,
            max_occupants: 2,
            furnished: true,
            pet_allowed: false,
            gender_restriction: null,
            is_available: true,
            is_verified: true,
            has_360_photos: false,
            view_count: 12,
            favorite_count: 3,
            status: 'active',
            min_lease_term: 1,
            available_from: '2026-04-20',
            created_at: '2026-04-01T00:00:00.000Z',
            updated_at: '2026-04-02T00:00:00.000Z',
            deleted_at: null,
            landlord_name: 'Premium Host',
            landlord_avatar: 'https://example.com/avatar.jpg',
            landlord_email: 'host@example.com',
            landlord_phone: '0912345678',
            landlord_is_premium: true,
            landlord_trust_score: 9.2,
            total_count: 1,
            search_rank: 0.9,
            primary_image_url: 'https://example.com/room.jpg',
            distance_km: 1.5,
          },
        ],
        error: null,
      }),
    };

    const result = await searchRooms(supabase as never, { page: 1, pageSize: 12 });

    expect(result.totalCount).toBe(1);
    expect(result.rooms[0]?.landlord).toMatchObject({
      id: 'landlord-1',
      full_name: 'Premium Host',
      avatar_url: 'https://example.com/avatar.jpg',
      email: 'host@example.com',
      is_premium: true,
      trust_score: 9.2,
    });
    expect(result.rooms[0]?.landlord?.phone).toBe('0912 xxx 5678');
  });

  test('maps the get_room_contact RPC result into the room contact contract', async () => {
    const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const supabase = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });
        return {
          data: [{ phone: '0912345678', is_masked: false }],
          error: null,
        };
      },
    };

    const result = await getRoomContact(supabase as never, 'room-123');

    expect(rpcCalls).toEqual([
      {
        name: 'get_room_contact',
        args: {
          p_room_id: 'room-123',
        },
      },
    ]);
    expect(result).toEqual({
      phone: '0912345678',
      isMasked: false,
    });
  });
});
