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

  // Increment view count (non-blocking, log error if fails)
  supabase
    .from('rooms')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', id)
    .then(({ error: viewError }) => {
      if (viewError) {
        console.error('Failed to increment view count:', viewError);
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
  roomData: Partial<Room>,
  amenities?: Partial<RoomAmenity>,
  imageUrls?: string[]
): Promise<RoomWithDetails> {
  // Insert room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert(roomData as never)
    .select()
    .single();

  if (roomError) throw roomError;

  // Insert amenities if provided
  if (amenities) {
    await supabase
      .from('room_amenities')
      .insert({ ...amenities, room_id: room.id } as never);
  }

  // Insert images if provided
  if (imageUrls && imageUrls.length > 0) {
    const images = imageUrls.map((url, index) => ({
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
