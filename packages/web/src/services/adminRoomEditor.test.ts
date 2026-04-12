import { describe, expect, test } from 'vitest';
import type { AdminRoom } from '@/services/admin';
import {
  buildAdminRoomDraft,
  buildAdminRoomUpdateInput,
  collectRemovedManagedRoomImageUrls,
} from './adminRoomEditor';

const baseRoom: AdminRoom = {
  id: 'room-1',
  landlord_id: 'user-1',
  title: 'Phòng riêng gần trường',
  description: 'Nội thất cơ bản',
  address: '1 Đại Cồ Việt',
  district: 'Quận Hai Bà Trưng',
  city: 'Thành phố Hà Nội',
  latitude: 21.003,
  longitude: 105.846,
  price_per_month: 4500000,
  deposit_amount: 1000000,
  area_sqm: 24,
  bedroom_count: 1,
  bathroom_count: 1,
  max_occupants: 2,
  min_lease_term: 6,
  electricity_cost: '3500/kWh',
  water_cost: '120k/người',
  room_type: 'private',
  gender_restriction: 'female_only',
  status: 'pending',
  furnished: true,
  is_available: true,
  is_verified: false,
  utilities_included: false,
  pet_allowed: false,
  smoking_allowed: false,
  has_360_photos: false,
  available_from: '2026-03-15',
  verification_date: null,
  rejection_reason: null,
  furniture_details: { wardrobe: true },
  view_count: 12,
  favorite_count: 4,
  created_at: '2026-03-10T00:00:00.000Z',
  updated_at: '2026-03-11T00:00:00.000Z',
  deleted_at: null,
  images: [
    {
      id: 'img-2',
      room_id: 'room-1',
      image_url: 'https://example.com/2.jpg',
      image_type: 'photo',
      is_primary: false,
      display_order: 1,
      caption: 'Second',
      created_at: null,
    },
    {
      id: 'img-1',
      room_id: 'room-1',
      image_url: 'https://example.com/1.jpg',
      image_type: 'photo',
      is_primary: true,
      display_order: 0,
      caption: 'Primary',
      created_at: null,
    },
  ],
  amenities: {
    id: 'amenity-1',
    room_id: 'room-1',
    wifi: true,
    air_conditioning: true,
    parking: false,
    washing_machine: true,
    refrigerator: false,
    heater: false,
    security_camera: true,
    balcony: false,
    dryer: false,
    elevator: true,
    fingerprint_lock: false,
    gym: false,
    kitchen: true,
    microwave: false,
    security_guard: false,
    swimming_pool: false,
    tv: true,
    created_at: null,
    updated_at: null,
  },
  landlord: {
    id: 'user-1',
    full_name: 'Nguyễn A',
    email: 'a@example.com',
    phone: null,
    avatar_url: null,
  },
};

describe('admin room editor helpers', () => {
  test('buildAdminRoomDraft maps room rows into a full editor draft', () => {
    const draft = buildAdminRoomDraft(baseRoom);

    expect(draft.landlord_id).toBe('user-1');
    expect(draft.images[0].image_url).toBe('https://example.com/1.jpg');
    expect(draft.images[0].is_primary).toBe(true);
    expect(draft.amenities.elevator).toBe(true);
    expect(draft.furniture_details).toContain('"wardrobe": true');
  });

  test('buildAdminRoomUpdateInput trims fields and guarantees one primary image', () => {
    const input = buildAdminRoomUpdateInput({
      ...buildAdminRoomDraft(baseRoom),
      title: '  Phòng riêng gần trường  ',
      district: '  Quận Hai Bà Trưng ',
      city: ' Thành phố Hà Nội ',
      images: [
        {
          image_url: ' https://example.com/a.jpg ',
          image_type: 'photo',
          is_primary: false,
          display_order: '',
          caption: ' Ảnh A ',
        },
        {
          image_url: 'https://example.com/b.jpg',
          image_type: '360',
          is_primary: false,
          display_order: '5',
          caption: '',
        },
      ],
    });

    expect(input.room.title).toBe('Phòng riêng gần trường');
    expect(input.room.district).toBe('Quận Hai Bà Trưng');
    expect(input.room.city).toBe('Thành phố Hà Nội');
    expect(input.images).toHaveLength(2);
    expect(input.images[0].is_primary).toBe(true);
    expect(input.images[0].caption).toBe('Ảnh A');
    expect(input.images[1].image_type).toBe('360');
  });

  test('buildAdminRoomUpdateInput rejects invalid furniture JSON', () => {
    expect(() =>
      buildAdminRoomUpdateInput({
        ...buildAdminRoomDraft(baseRoom),
        furniture_details: '{invalid json}',
      }),
    ).toThrow('Furniture details phải là JSON hợp lệ');
  });

  test('collectRemovedManagedRoomImageUrls only returns removed storage-backed room images', () => {
    const removedStorageUrls = collectRemovedManagedRoomImageUrls(
      [
        {
          image_url:
            'https://vevnoxlgwisdottaifdn.supabase.co/storage/v1/object/public/room-images/room-1/original.jpg',
        },
        {
          image_url: 'https://cdn.example.com/external.jpg',
        },
      ],
      [
        {
          image_url: 'https://cdn.example.com/replacement.jpg',
          image_type: 'photo',
          is_primary: true,
          display_order: '0',
          caption: '',
        },
      ],
    );

    expect(removedStorageUrls).toEqual([
      'https://vevnoxlgwisdottaifdn.supabase.co/storage/v1/object/public/room-images/room-1/original.jpg',
    ]);
  });
});
