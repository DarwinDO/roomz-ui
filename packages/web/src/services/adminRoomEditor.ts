import { supabase } from '@/lib/supabase';
import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/lib/database.types';
import type { AdminRoom } from '@/services/admin';

type RoomRow = Tables<'rooms'>;

type RoomUpdate = TablesUpdate<'rooms'>;
type RoomAmenityInsert = TablesInsert<'room_amenities'>;
type RoomImageInsert = TablesInsert<'room_images'>;
const ROOM_IMAGE_STORAGE_SEGMENT = '/room-images/';

export type AdminRoomStatus = RoomRow['status'];
export type AdminRoomType = RoomRow['room_type'];
export type AdminGenderRestriction = RoomRow['gender_restriction'];
export type AdminImageType = Enums<'image_type'>;

const ROOM_AMENITY_FIELDS = [
  'wifi',
  'air_conditioning',
  'parking',
  'washing_machine',
  'refrigerator',
  'heater',
  'security_camera',
  'balcony',
  'dryer',
  'elevator',
  'fingerprint_lock',
  'gym',
  'kitchen',
  'microwave',
  'security_guard',
  'swimming_pool',
  'tv',
] as const;

type AmenityField = (typeof ROOM_AMENITY_FIELDS)[number];

export interface AdminRoomImageDraft {
  image_url: string;
  image_type: AdminImageType;
  is_primary: boolean;
  display_order: string;
  caption: string;
}

export type AdminRoomAmenityDraft = Record<AmenityField, boolean>;

export interface AdminRoomUpdateDraft {
  landlord_id: string;
  title: string;
  description: string;
  address: string;
  district: string;
  city: string;
  latitude: string;
  longitude: string;
  price_per_month: string;
  deposit_amount: string;
  area_sqm: string;
  bedroom_count: string;
  bathroom_count: string;
  max_occupants: string;
  min_lease_term: string;
  electricity_cost: string;
  water_cost: string;
  room_type: AdminRoomType;
  gender_restriction: AdminGenderRestriction;
  status: AdminRoomStatus;
  furnished: boolean;
  is_available: boolean;
  is_verified: boolean;
  utilities_included: boolean;
  pet_allowed: boolean;
  smoking_allowed: boolean;
  has_360_photos: boolean;
  available_from: string;
  verification_date: string;
  rejection_reason: string;
  furniture_details: string;
  amenities: AdminRoomAmenityDraft;
  images: AdminRoomImageDraft[];
}

export interface AdminRoomUpdateInput {
  room: RoomUpdate;
  amenities: Omit<RoomAmenityInsert, 'room_id'>;
  images: Omit<RoomImageInsert, 'room_id'>[];
}

const DEFAULT_AMENITIES: AdminRoomAmenityDraft = {
  wifi: false,
  air_conditioning: false,
  parking: false,
  washing_machine: false,
  refrigerator: false,
  heater: false,
  security_camera: false,
  balcony: false,
  dryer: false,
  elevator: false,
  fingerprint_lock: false,
  gym: false,
  kitchen: false,
  microwave: false,
  security_guard: false,
  swimming_pool: false,
  tv: false,
};

function trimOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function trimOrNull(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function parseNullableNumber(value: string, fieldLabel: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldLabel} không hợp lệ`);
  }

  return parsed;
}

function parseRequiredNumber(value: string, fieldLabel: string): number {
  const parsed = parseNullableNumber(value, fieldLabel);
  if (parsed === null) {
    throw new Error(`${fieldLabel} là bắt buộc`);
  }

  return parsed;
}

function parseNullableJson(value: string): unknown | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error('Furniture details phải là JSON hợp lệ');
  }
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function toDateTimeInput(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function parseNullableDate(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseNullableDateTime(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Ngày xác thực không hợp lệ');
  }

  return parsed.toISOString();
}

function normalizeImages(images: AdminRoomImageDraft[]): Omit<RoomImageInsert, 'room_id'>[] {
  const normalized = images
    .map((image, index) => ({
      image_url: image.image_url.trim(),
      image_type: image.image_type,
      is_primary: image.is_primary,
      display_order: parseNullableNumber(image.display_order, 'Thứ tự ảnh') ?? index,
      caption: trimOrNull(image.caption),
    }))
    .filter((image) => image.image_url.length > 0);

  if (normalized.length === 0) {
    return [];
  }

  if (!normalized.some((image) => image.is_primary)) {
    normalized[0].is_primary = true;
  }

  return normalized.map((image, index) => ({
    ...image,
    display_order: image.display_order ?? index,
    is_primary: index === normalized.findIndex((candidate) => candidate.is_primary),
  }));
}

function isManagedRoomStorageUrl(url: string): boolean {
  return url.includes(ROOM_IMAGE_STORAGE_SEGMENT);
}

export function collectRemovedManagedRoomImageUrls(
  originalImages: Pick<NonNullable<AdminRoom['images']>[number], 'image_url'>[] | null | undefined,
  nextImages: AdminRoomImageDraft[],
): string[] {
  const nextImageUrls = new Set(
    nextImages
      .map((image) => image.image_url.trim())
      .filter((imageUrl) => imageUrl.length > 0),
  );

  return (originalImages ?? [])
    .map((image) => image.image_url.trim())
    .filter(
      (imageUrl, index, imageUrls) =>
        imageUrl.length > 0 &&
        isManagedRoomStorageUrl(imageUrl) &&
        !nextImageUrls.has(imageUrl) &&
        imageUrls.indexOf(imageUrl) === index,
    );
}

export function buildAdminRoomDraft(room: AdminRoom): AdminRoomUpdateDraft {
  const amenitiesSource = room.amenities ?? null;
  const images = [...(room.images ?? [])].sort(
    (left, right) => (left.display_order ?? 0) - (right.display_order ?? 0),
  );

  const amenities = ROOM_AMENITY_FIELDS.reduce<AdminRoomAmenityDraft>((accumulator, field) => {
    accumulator[field] = Boolean(amenitiesSource?.[field]);
    return accumulator;
  }, { ...DEFAULT_AMENITIES });

  return {
    landlord_id: room.landlord_id,
    title: room.title ?? '',
    description: room.description ?? '',
    address: room.address ?? '',
    district: room.district ?? '',
    city: room.city ?? '',
    latitude: room.latitude?.toString() ?? '',
    longitude: room.longitude?.toString() ?? '',
    price_per_month: room.price_per_month?.toString() ?? '',
    deposit_amount: room.deposit_amount?.toString() ?? '',
    area_sqm: room.area_sqm?.toString() ?? '',
    bedroom_count: room.bedroom_count?.toString() ?? '',
    bathroom_count: room.bathroom_count?.toString() ?? '',
    max_occupants: room.max_occupants?.toString() ?? '',
    min_lease_term: room.min_lease_term?.toString() ?? '',
    electricity_cost: room.electricity_cost ?? '',
    water_cost: room.water_cost ?? '',
    room_type: room.room_type,
    gender_restriction: room.gender_restriction ?? 'none',
    status: room.status ?? 'pending',
    furnished: Boolean(room.furnished),
    is_available: room.is_available ?? true,
    is_verified: Boolean(room.is_verified),
    utilities_included: Boolean(room.utilities_included),
    pet_allowed: Boolean(room.pet_allowed),
    smoking_allowed: Boolean(room.smoking_allowed),
    has_360_photos: Boolean(room.has_360_photos),
    available_from: toDateInput(room.available_from),
    verification_date: toDateTimeInput(room.verification_date),
    rejection_reason: room.rejection_reason ?? '',
    furniture_details: room.furniture_details
      ? JSON.stringify(room.furniture_details, null, 2)
      : '',
    amenities,
    images: images.map((image) => ({
      image_url: image.image_url,
      image_type: image.image_type ?? 'photo',
      is_primary: Boolean(image.is_primary),
      display_order: image.display_order?.toString() ?? '',
      caption: image.caption ?? '',
    })),
  };
}

export function buildAdminRoomUpdateInput(draft: AdminRoomUpdateDraft): AdminRoomUpdateInput {
  const landlordId = trimOrEmpty(draft.landlord_id);
  const title = trimOrEmpty(draft.title);
  const address = trimOrEmpty(draft.address);

  if (!landlordId) {
    throw new Error('Landlord ID là bắt buộc');
  }
  if (!title) {
    throw new Error('Tiêu đề phòng là bắt buộc');
  }
  if (!address) {
    throw new Error('Địa chỉ là bắt buộc');
  }

  const room: RoomUpdate = {
    landlord_id: landlordId,
    title,
    description: trimOrNull(draft.description),
    address,
    district: trimOrNull(draft.district),
    city: trimOrNull(draft.city),
    latitude: parseNullableNumber(draft.latitude, 'Latitude'),
    longitude: parseNullableNumber(draft.longitude, 'Longitude'),
    price_per_month: parseRequiredNumber(draft.price_per_month, 'Giá thuê'),
    deposit_amount: parseNullableNumber(draft.deposit_amount, 'Tiền cọc'),
    area_sqm: parseNullableNumber(draft.area_sqm, 'Diện tích'),
    bedroom_count: parseNullableNumber(draft.bedroom_count, 'Số phòng ngủ'),
    bathroom_count: parseNullableNumber(draft.bathroom_count, 'Số phòng tắm'),
    max_occupants: parseNullableNumber(draft.max_occupants, 'Số người tối đa'),
    min_lease_term: parseNullableNumber(draft.min_lease_term, 'Thời hạn thuê tối thiểu'),
    electricity_cost: trimOrNull(draft.electricity_cost),
    water_cost: trimOrNull(draft.water_cost),
    room_type: draft.room_type,
    gender_restriction: draft.gender_restriction,
    status: draft.status,
    furnished: draft.furnished,
    is_available: draft.is_available,
    is_verified: draft.is_verified,
    utilities_included: draft.utilities_included,
    pet_allowed: draft.pet_allowed,
    smoking_allowed: draft.smoking_allowed,
    has_360_photos: draft.has_360_photos,
    available_from: parseNullableDate(draft.available_from),
    verification_date: parseNullableDateTime(draft.verification_date),
    rejection_reason: trimOrNull(draft.rejection_reason),
    furniture_details: parseNullableJson(draft.furniture_details) as RoomUpdate['furniture_details'],
    updated_at: new Date().toISOString(),
  };

  const amenities = ROOM_AMENITY_FIELDS.reduce<Omit<RoomAmenityInsert, 'room_id'>>(
    (accumulator, field) => {
      accumulator[field] = draft.amenities[field];
      return accumulator;
    },
    {
      updated_at: new Date().toISOString(),
    },
  );

  return {
    room,
    amenities,
    images: normalizeImages(draft.images),
  };
}

async function refreshSession(): Promise<void> {
  await supabase.auth.refreshSession();
}

export async function updateAdminRoom(roomId: string, draft: AdminRoomUpdateDraft): Promise<void> {
  await refreshSession();

  const input = buildAdminRoomUpdateInput(draft);

  const { error: roomError } = await supabase
    .from('rooms')
    .update(input.room as never)
    .eq('id', roomId);

  if (roomError) {
    throw new Error(roomError.message);
  }

  const { error: amenitiesError } = await supabase
    .from('room_amenities')
    .upsert(
      {
        room_id: roomId,
        ...input.amenities,
      } as never,
      { onConflict: 'room_id' },
    );

  if (amenitiesError) {
    throw new Error(amenitiesError.message);
  }

  const { error: deleteImagesError } = await supabase
    .from('room_images')
    .delete()
    .eq('room_id', roomId);

  if (deleteImagesError) {
    throw new Error(deleteImagesError.message);
  }

  if (input.images.length === 0) {
    return;
  }

  const { error: imageInsertError } = await supabase.from('room_images').insert(
    input.images.map((image) => ({
      room_id: roomId,
      ...image,
    })) as never,
  );

  if (imageInsertError) {
    throw new Error(imageInsertError.message);
  }
}

export type RoomEditorAmenityField = AmenityField;
export const roomEditorAmenityFields = ROOM_AMENITY_FIELDS;
