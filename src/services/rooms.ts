/**
 * Rooms API Service
 * CRUD operations for rooms
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

// Use database types
export type Room = Tables<'rooms'>;
export type RoomImage = Tables<'room_images'>;
export type RoomAmenity = Tables<'room_amenities'>;

export interface RoomWithDetails extends Room {
  landlord?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    email: string;
  };
  images?: RoomImage[];
  amenities?: RoomAmenity | null;
}

export interface RoomFilters {
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: Room['room_type'];
  searchQuery?: string;
  isVerified?: boolean;
}

export interface CreateRoomData {
  landlordId: string;
  title: string;
  description?: string;
  address: string;
  district?: string;
  city: string;
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

/**
 * Get all active rooms with optional filters
 */
export async function getRooms(filters: RoomFilters = {}): Promise<RoomWithDetails[]> {
  let query = supabase
    .from('rooms')
    .select(`
      *,
      landlord:users!landlord_id(id, full_name, avatar_url, phone, email),
      images:room_images(*),
      amenities:room_amenities(*)
    `)
    .eq('status', 'active')
    .is('deleted_at', null);

  // Apply filters
  if (filters.district) {
    query = query.eq('district', filters.district);
  }
  if (filters.minPrice) {
    query = query.gte('price_per_month', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('price_per_month', filters.maxPrice);
  }
  if (filters.roomType) {
    query = query.eq('room_type', filters.roomType);
  }
  if (filters.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,address.ilike.%${filters.searchQuery}%,district.ilike.%${filters.searchQuery}%`);
  }
  if (filters.isVerified !== undefined) {
    query = query.eq('is_verified', filters.isVerified);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Transform the data to handle the array result from room_amenities
  return (data || []).map(room => ({
    ...room,
    amenities: Array.isArray(room.amenities) ? room.amenities[0] : room.amenities,
  })) as RoomWithDetails[];
}

/**
 * Get a single room by ID with full details
 */
export async function getRoomById(id: string): Promise<RoomWithDetails | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      landlord:users!landlord_id(id, full_name, avatar_url, phone, email),
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
export async function createRoom(data: CreateRoomData): Promise<RoomWithDetails> {
  // Prepare room data
  const roomData = {
    landlord_id: data.landlordId,
    title: data.title,
    description: data.description,
    address: data.address,
    district: data.district,
    city: data.city,
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
  const roomWithDetails = await getRoomById(room.id);
  if (!roomWithDetails) {
    throw new Error('Failed to fetch created room');
  }
  return roomWithDetails;
}

/**
 * Update a room
 */
export async function updateRoom(
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

  const roomWithDetails = await getRoomById(id);
  if (!roomWithDetails) {
    throw new Error('Failed to fetch updated room');
  }
  return roomWithDetails;
}

/**
 * Update a room using structured data (similar to CreateRoomData)
 */
export async function updateRoomWithData(
  id: string,
  data: UpdateRoomData
): Promise<RoomWithDetails> {
  const roomData: Partial<Room> = {};

  if (data.title !== undefined) roomData.title = data.title;
  if (data.description !== undefined) roomData.description = data.description;
  if (data.address !== undefined) roomData.address = data.address;
  if (data.district !== undefined) roomData.district = data.district;
  if (data.city !== undefined) roomData.city = data.city;
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

  return updateRoom(id, roomData, data.amenities);
}

/**
 * Delete a room (soft delete)
 */
export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' } as never)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get rooms by landlord
 */
export async function getRoomsByLandlord(landlordId: string): Promise<RoomWithDetails[]> {
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
