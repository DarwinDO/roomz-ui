/**
 * Favorites API Service
 * CRUD operations for user favorites
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';
import type { RoomWithDetails } from './rooms';

export type Favorite = Tables<'favorites'>;

export interface FavoriteWithRoom extends Favorite {
  room?: RoomWithDetails;
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(userId: string): Promise<FavoriteWithRoom[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      room:rooms(
        *,
        landlord:users!landlord_id(id, full_name, avatar_url, phone, email),
        images:room_images(*),
        amenities:room_amenities(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform room data
  return (data || []).map(fav => ({
    ...fav,
    room: fav.room ? {
      ...fav.room,
      amenities: Array.isArray(fav.room.amenities) ? fav.room.amenities[0] : fav.room.amenities,
    } : undefined,
  })) as FavoriteWithRoom[];
}

/**
 * Check if a room is favorited by user
 */
export async function isRoomFavorited(userId: string, roomId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('room_id', roomId)
    .maybeSingle();

  // maybeSingle returns null if no rows found, data if exactly 1 row
  // It only throws error if more than 1 row found or other DB error
  if (error) {
    console.warn('Error checking favorite status:', error.message);
    return false; // Return false on error to allow retry
  }

  return !!data;
}

/**
 * Add a room to favorites
 */
export async function addFavorite(userId: string, roomId: string): Promise<Favorite> {
  // Check if already favorited
  const exists = await isRoomFavorited(userId, roomId);
  if (exists) {
    throw new Error('Room is already in favorites');
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, room_id: roomId })
    .select()
    .single();

  if (error) throw error;

  // Update room favorite count (best effort)
  supabase.rpc('increment_favorite_count' as never, { p_room_id: roomId } as never).then(({ error: rpcError }) => {
    if (rpcError && rpcError.code !== 'PGRST202' && rpcError.code !== '42501' && rpcError.code !== '42883') {
      console.warn('Failed to increment favorite count:', rpcError.message);
    }
  });

  return data;
}

/**
 * Remove a room from favorites
 */
export async function removeFavorite(userId: string, roomId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('room_id', roomId);

  if (error) throw error;

  // Decrement room favorite count (best effort)
  supabase.rpc('decrement_favorite_count' as never, { p_room_id: roomId } as never).then(({ error: rpcError }) => {
    if (rpcError && rpcError.code !== 'PGRST202' && rpcError.code !== '42501' && rpcError.code !== '42883') {
      console.warn('Failed to decrement favorite count:', rpcError.message);
    }
  });
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(userId: string, roomId: string): Promise<{ favorited: boolean }> {
  const isFavorited = await isRoomFavorited(userId, roomId);

  if (isFavorited) {
    await removeFavorite(userId, roomId);
    return { favorited: false };
  } else {
    await addFavorite(userId, roomId);
    return { favorited: true };
  }
}

/**
 * Get favorite count for a room
 */
export async function getFavoriteCount(roomId: string): Promise<number> {
  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) throw error;

  return count || 0;
}
