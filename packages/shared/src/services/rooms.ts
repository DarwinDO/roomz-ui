/**
 * Rooms API Service (Shared)
 * CRUD operations for rooms - Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types - Minimal inline types for shared package
// ============================================

export interface Room {
    id: string;
    landlord_id: string;
    title: string;
    description: string | null;
    room_type: string;
    address: string;
    district: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    price_per_month: number;
    deposit_amount: number | null;
    area_sqm: number | null;
    bedroom_count: number | null;
    bathroom_count: number | null;
    max_occupants: number | null;
    furnished: boolean;
    pet_allowed: boolean;
    gender_restriction: string | null;
    is_available: boolean;
    is_verified: boolean;
    has_360_photos: boolean;
    view_count: number;
    favorite_count: number;
    status: string;
    rejection_reason: string | null;
    min_lease_term: number | null;
    available_from: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    distance_km?: number | null;
}

export interface RoomImage {
    id: string;
    room_id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number | null;
    created_at: string;
}

export interface RoomAmenity {
    id: string;
    room_id: string;
    wifi: boolean;
    air_conditioning: boolean;
    parking: boolean;
    washing_machine: boolean;
    refrigerator: boolean;
    heater: boolean;
    security_camera: boolean;
    balcony: boolean;
}

export interface RoomWithDetails extends Room {
    landlord?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        phone: string | null;
        email: string;
        trust_score: number | null;
        is_premium?: boolean | null;
    };
    images?: RoomImage[];
    amenities?: RoomAmenity | null;
}

export interface RoomFilters {
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    roomType?: Room['room_type'];
    roomTypes?: string[];
    searchQuery?: string;
    isVerified?: boolean;
    petAllowed?: boolean;
    furnished?: boolean;
    amenities?: string[];
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'most_viewed';
    page?: number;
    pageSize?: number;
}

export type SortOption = NonNullable<RoomFilters['sortBy']>;

/** Row returned by the search_rooms RPC */
interface SearchRoomRow {
    id: string;
    landlord_id: string;
    title: string;
    description: string | null;
    room_type: string;
    address: string;
    district: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    price_per_month: number;
    deposit_amount: number | null;
    area_sqm: number | null;
    bedroom_count: number | null;
    bathroom_count: number | null;
    max_occupants: number | null;
    furnished: boolean;
    pet_allowed: boolean;
    gender_restriction: string | null;
    is_available: boolean;
    is_verified: boolean;
    has_360_photos: boolean;
    view_count: number;
    favorite_count: number;
    status: string;
    min_lease_term: number | null;
    available_from: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    landlord_name: string | null;
    landlord_avatar: string | null;
    landlord_email: string | null;
    landlord_phone: string | null;
    landlord_is_premium: boolean | null;
    landlord_trust_score: number | null;
    total_count: number;
    search_rank: number;
    primary_image_url: string | null;
    distance_km: number | null;
}

export interface RoomSearchResponse {
    rooms: RoomWithDetails[];
    totalCount: number;
}

export interface CreateRoomData {
    landlordId: string;
    title: string;
    description?: string;
    address: string;
    district?: string;
    city: string;
    latitude?: number;
    longitude?: number;
    pricePerMonth: number;
    depositAmount?: number;
    areaSqm?: number;
    bedroomCount?: number;
    bathroomCount?: number;
    maxOccupants?: number;
    roomType?: 'private' | 'shared' | 'studio' | 'entire';
    furnished?: boolean;
    availableFrom?: string;
    minLeaseTerm?: number;
    amenities?: {
        wifi?: boolean;
        air_conditioning?: boolean;
        parking?: boolean;
        washing_machine?: boolean;
        refrigerator?: boolean;
        heater?: boolean;
        security_camera?: boolean;
        balcony?: boolean;
    };
    imageUrls?: string[];
}

export interface UpdateRoomData {
    title?: string;
    description?: string;
    address?: string;
    district?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    pricePerMonth?: number;
    depositAmount?: number;
    areaSqm?: number;
    bedroomCount?: number;
    bathroomCount?: number;
    maxOccupants?: number;
    roomType?: 'private' | 'shared' | 'studio' | 'entire';
    furnished?: boolean;
    availableFrom?: string;
    minLeaseTerm?: number;
    amenities?: {
        wifi?: boolean;
        air_conditioning?: boolean;
        parking?: boolean;
        washing_machine?: boolean;
        refrigerator?: boolean;
        heater?: boolean;
        security_camera?: boolean;
        balcony?: boolean;
    };
    status?: 'draft' | 'pending' | 'active' | 'rented' | 'inactive' | 'rejected';
}

// ============================================
// Helper Functions
// ============================================

/**
 * Transform a flat RPC row into RoomWithDetails shape
 */
function transformSearchRow(row: SearchRoomRow): RoomWithDetails {
    return {
        ...row,
        landlord: {
            id: row.landlord_id,
            full_name: row.landlord_name || '',
            avatar_url: row.landlord_avatar,
            // Security: Mask phone in search results - use get_room_contact RPC for full access
            phone: row.landlord_phone ? maskPhoneNumber(row.landlord_phone) : null,
            email: row.landlord_email || '',
            is_premium: row.landlord_is_premium,
            trust_score: row.landlord_trust_score,
        },
        images: row.primary_image_url
            ? [{ id: '', room_id: row.id, image_url: row.primary_image_url, is_primary: true, display_order: null, created_at: '' } as RoomImage]
            : [],
        amenities: null,
    } as unknown as RoomWithDetails;
}

/**
 * Mask phone number for privacy (e.g., 0912 xxx 345)
 */
function maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 8) return phone;
    const visible = phone.slice(-4);
    return `${phone.slice(0, 4)} xxx ${visible}`;
}

// ============================================
// API Functions
// ============================================

/**
 * Search rooms via server-side RPC (full-text search, amenity filtering, sort, pagination)
 */
export async function searchRooms(
    supabase: SupabaseClient,
    filters: RoomFilters = {}
): Promise<RoomSearchResponse> {
    const { data, error } = await supabase.rpc('search_rooms' as never, {
        p_search_query: filters.searchQuery || null,
        p_district: filters.district || null,
        p_min_price: filters.minPrice ?? null,
        p_max_price: filters.maxPrice ?? null,
        p_room_types: filters.roomTypes?.length ? filters.roomTypes : null,
        p_is_verified: filters.isVerified ?? null,
        p_pet_allowed: filters.petAllowed ?? null,
        p_furnished: filters.furnished ?? null,
        p_amenities: filters.amenities?.length ? filters.amenities : null,
        p_lat: filters.latitude ?? null,
        p_lng: filters.longitude ?? null,
        p_radius_km: filters.radiusKm ?? null,
        p_sort_by: filters.sortBy || 'newest',
        p_page: filters.page || 1,
        p_page_size: filters.pageSize || 12,
    } as never);

    if (error) throw error;

    const rows = (data || []) as SearchRoomRow[];
    const totalCount = rows.length > 0 ? rows[0].total_count : 0;

    return {
        rooms: rows.map(transformSearchRow),
        totalCount,
    };
}

/**
 * Get a single room by ID with full details
 */
export async function getRoomById(
    supabase: SupabaseClient,
    id: string
): Promise<RoomWithDetails | null> {
    const { data, error } = await supabase
        .from('rooms')
        .select(`
      *,
      landlord:users!landlord_id(id, full_name, avatar_url, phone, email, trust_score, is_premium),
      images:room_images(*),
      amenities:room_amenities(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    // Increment view count via RPC (non-blocking)
    supabase.rpc('increment_view_count' as never, { p_room_id: id } as never).then(({ error: rpcError }) => {
        if (rpcError && rpcError.code !== 'PGRST202' && rpcError.code !== '42501' && rpcError.code !== '42883') {
            console.warn('Failed to increment view count:', rpcError.message);
        }
    });

    return {
        ...data,
        amenities: Array.isArray(data.amenities) ? data.amenities[0] : data.amenities,
    } as RoomWithDetails;
}

/**
 * Create a new room
 */
export async function createRoom(
    supabase: SupabaseClient,
    data: CreateRoomData
): Promise<RoomWithDetails> {
    // Prepare room data
    const roomData = {
        landlord_id: data.landlordId,
        title: data.title,
        description: data.description,
        address: data.address,
        district: data.district,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        price_per_month: data.pricePerMonth,
        deposit_amount: data.depositAmount,
        area_sqm: data.areaSqm,
        bedroom_count: data.bedroomCount || 1,
        bathroom_count: data.bathroomCount || 1,
        max_occupants: data.maxOccupants || 1,
        room_type: data.roomType || 'private',
        furnished: data.furnished || false,
        available_from: data.availableFrom,
        min_lease_term: data.minLeaseTerm || 1,
        status: 'pending', // Pending approval
    };

    // Insert room
    const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData as never)
        .select()
        .single();

    if (roomError) throw roomError;

    // Insert amenities if provided
    if (data.amenities) {
        await supabase
            .from('room_amenities')
            .insert({ ...data.amenities, room_id: room.id } as never);
    }

    // Insert images if provided
    if (data.imageUrls && data.imageUrls.length > 0) {
        const images = data.imageUrls.map((url, index) => ({
            room_id: room.id,
            image_url: url,
            display_order: index,
            is_primary: index === 0,
        }));
        await supabase.from('room_images').insert(images as never);
    }

    // Return the created room with details
    const roomWithDetails = await getRoomById(supabase, room.id);
    if (!roomWithDetails) {
        throw new Error('Failed to fetch created room');
    }
    return roomWithDetails;
}

/**
 * Update a room
 */
export async function updateRoom(
    supabase: SupabaseClient,
    id: string,
    roomData: Partial<Room>,
    amenities?: Partial<RoomAmenity>
): Promise<RoomWithDetails> {
    // Update room
    const { error: roomError } = await supabase
        .from('rooms')
        .update({ ...roomData, updated_at: new Date().toISOString() } as never)
        .eq('id', id);

    if (roomError) throw roomError;

    // Update amenities if provided
    if (amenities) {
        await supabase
            .from('room_amenities')
            .upsert({ ...amenities, room_id: id } as never);
    }

    const roomWithDetails = await getRoomById(supabase, id);
    if (!roomWithDetails) {
        throw new Error('Failed to fetch updated room');
    }
    return roomWithDetails;
}

/**
 * Update a room using structured data (similar to CreateRoomData)
 */
export async function updateRoomWithData(
    supabase: SupabaseClient,
    id: string,
    data: UpdateRoomData
): Promise<RoomWithDetails> {
    const roomData: Partial<Room> = {};

    if (data.title !== undefined) roomData.title = data.title;
    if (data.description !== undefined) roomData.description = data.description;
    if (data.address !== undefined) roomData.address = data.address;
    if (data.district !== undefined) roomData.district = data.district;
    if (data.city !== undefined) roomData.city = data.city;
    if (data.latitude !== undefined) roomData.latitude = data.latitude;
    if (data.longitude !== undefined) roomData.longitude = data.longitude;
    if (data.pricePerMonth !== undefined) roomData.price_per_month = data.pricePerMonth;
    if (data.depositAmount !== undefined) roomData.deposit_amount = data.depositAmount;
    if (data.areaSqm !== undefined) roomData.area_sqm = data.areaSqm;
    if (data.bedroomCount !== undefined) roomData.bedroom_count = data.bedroomCount;
    if (data.bathroomCount !== undefined) roomData.bathroom_count = data.bathroomCount;
    if (data.maxOccupants !== undefined) roomData.max_occupants = data.maxOccupants;
    if (data.roomType !== undefined) roomData.room_type = data.roomType;
    if (data.furnished !== undefined) roomData.furnished = data.furnished;
    if (data.availableFrom !== undefined) roomData.available_from = data.availableFrom;
    if (data.status !== undefined) roomData.status = data.status;

    return updateRoom(supabase, id, roomData, data.amenities);
}

/**
 * Delete a room (soft delete)
 */
export async function deleteRoom(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
        .from('rooms')
        .update({ deleted_at: new Date().toISOString(), status: 'inactive' } as never)
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get rooms by landlord
 */
export async function getRoomsByLandlord(
    supabase: SupabaseClient,
    landlordId: string
): Promise<RoomWithDetails[]> {
    const { data, error } = await supabase
        .from('rooms')
        .select(`
      *,
      images:room_images(*),
      amenities:room_amenities(*)
    `)
        .eq('landlord_id', landlordId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(room => ({
        ...room,
        amenities: Array.isArray(room.amenities) ? room.amenities[0] : room.amenities,
    })) as RoomWithDetails[];
}

/**
 * Get room contact (phone number) with premium gate logic
 * Returns masked or unmasked phone based on user's subscription and daily view limit
 */
export interface RoomContactResult {
    phone: string;
    isMasked: boolean;
}

export async function getRoomContact(
    supabase: SupabaseClient,
    roomId: string
): Promise<RoomContactResult> {
    const { data, error } = await supabase.rpc('get_room_contact' as never, { p_room_id: roomId } as never);

    if (error) {
        console.error('Error fetching room contact:', error);
        return { phone: '', isMasked: true };
    }

    const result = data?.[0] as { phone?: string; is_masked?: boolean } | null;
    return {
        phone: result?.phone || '',
        isMasked: result?.is_masked ?? true,
    };
}
