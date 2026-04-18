/**
 * Rooms API Service (Web Wrapper)
 * Re-exports from shared with SupabaseClient injection
 */

import { supabase } from '@/lib/supabase';
import * as roomsService from '@roomz/shared/services/rooms';

export const searchRooms = (filters?: roomsService.RoomFilters) =>
  roomsService.searchRooms(supabase, filters);

export const getRoomById = (id: string) =>
  roomsService.getRoomById(supabase, id);

export const incrementRoomView = (id: string) =>
  roomsService.incrementRoomView(supabase, id);

export const createRoom = (data: roomsService.CreateRoomData) =>
  roomsService.createRoom(supabase, data);

export const updateRoom = (
  id: string,
  roomData: Partial<roomsService.Room>,
  amenities?: Partial<roomsService.RoomAmenity>
) => roomsService.updateRoom(supabase, id, roomData, amenities);

export const updateRoomWithData = (
  id: string,
  data: roomsService.UpdateRoomData
) => roomsService.updateRoomWithData(supabase, id, data);

export const deleteRoom = (id: string) =>
  roomsService.deleteRoom(supabase, id);

export const getRoomsByLandlord = (landlordId: string) =>
  roomsService.getRoomsByLandlord(supabase, landlordId);

export const getRoomContact = (roomId: string) =>
  roomsService.getRoomContact(supabase, roomId);

// Re-export types
export type { Room, RoomImage, RoomAmenity, RoomWithDetails, RoomFilters, RoomSearchResponse, CreateRoomData, UpdateRoomData, RoomContactResult, SortOption } from '@roomz/shared/services/rooms';
