/**
 * Bookings API Service
 */
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate, Database } from '@/lib/database.types';

export type Booking = Tables<'bookings'>;
export type BookingInsert = TablesInsert<'bookings'>;
export type BookingUpdate = TablesUpdate<'bookings'>;
export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export interface CreateBookingData {
  roomId: string;
  landlordId: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime?: string;
  message?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  durationMinutes?: number;
}

export interface BookingWithDetails extends Booking {
  room: Tables<'rooms'> & { room_images: Tables<'room_images'>[] };
  landlord: Tables<'users'>;
  renter: Tables<'users'>;
}

/**
 * Create a new booking
 */
export async function createBooking(booking: BookingInsert) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get bookings for the current user (as renter)
 */
export async function getTenantBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms (
        *,
        room_images (*)
      ),
      landlord:users!bookings_landlord_id_fkey (*)
    `)
    .eq('renter_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as BookingWithDetails[];
}

/**
 * Get bookings for the current user (as landlord)
 */
export async function getLandlordBookings(userId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms (*),
      renter:users!bookings_renter_id_fkey (*)
    `)
    .eq('landlord_id', userId)
    .order('booking_date', { ascending: true });

  if (error) throw error;
  return data as unknown as BookingWithDetails[];
}

/**
 * Get single booking by ID
 */
export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms (
        *,
        room_images (*)
      ),
      landlord:users!bookings_landlord_id_fkey (*),
      renter:users!bookings_renter_id_fkey (*)
    `)
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data as unknown as BookingWithDetails;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(id: string, status: Booking['status'], note?: string) {
  const updates: BookingUpdate = { status };
  if (note) updates.note = note; // Note: schema has 'note', not 'landlord_notes' anymore

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelBooking(id: string, reason?: string) {
  return updateBookingStatus(id, 'cancelled', reason);
}

// Mock available slots for now
export async function getAvailableTimeSlots(roomId: string, date: string): Promise<string[]> {
  // In real app, query existing bookings for this room & date
  // and exclude them from a generated list of slots (e.g. 8am to 8pm)
  return ["08:00", "09:00", "10:00", "14:00", "15:00", "16:00", "19:00"];
}

export async function getBookingStats(userId: string) {
  // Simple mock or count query
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('landlord_id', userId);

  if (error) return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  const stats = {
    total: data.length,
    pending: data.filter(b => b.status === 'pending').length,
    confirmed: data.filter(b => b.status === 'confirmed').length,
    completed: data.filter(b => b.status === 'completed').length,
    cancelled: data.filter(b => b.status === 'cancelled').length,
  };
  return stats;
}
