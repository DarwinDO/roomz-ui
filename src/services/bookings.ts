/**
 * Bookings API Service
 * CRUD operations for room viewing bookings
 */

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type Booking = Tables<'bookings'>;

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingWithDetails extends Booking {
  room?: {
    id: string;
    title: string;
    address: string;
    price_per_month: number;
    images?: { image_url: string; is_primary: boolean }[];
  };
  tenant?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    email: string;
  };
  landlord?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    email: string;
  };
}

export interface CreateBookingData {
  roomId: string;
  landlordId: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM
  message?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  durationMinutes?: number;
}

/**
 * Create a new booking request
 */
export async function createBooking(
  tenantId: string,
  data: CreateBookingData
): Promise<Booking> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenantId,
      landlord_id: data.landlordId,
      room_id: data.roomId,
      booking_date: data.bookingDate,
      booking_time: data.bookingTime,
      message: data.message,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      duration_minutes: data.durationMinutes || 30,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return booking;
}

/**
 * Get bookings for a tenant (user who booked)
 */
export async function getTenantBookings(tenantId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(id, title, address, price_per_month, images:room_images(image_url, is_primary)),
      landlord:users!landlord_id(id, full_name, avatar_url, phone, email)
    `)
    .eq('tenant_id', tenantId)
    .order('booking_date', { ascending: true });

  if (error) throw error;
  return (data || []) as BookingWithDetails[];
}

/**
 * Get bookings for a landlord (room owner)
 */
export async function getLandlordBookings(landlordId: string): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(id, title, address, price_per_month, images:room_images(image_url, is_primary)),
      tenant:users!tenant_id(id, full_name, avatar_url, phone, email)
    `)
    .eq('landlord_id', landlordId)
    .order('booking_date', { ascending: true });

  if (error) throw error;
  return (data || []) as BookingWithDetails[];
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(id, title, address, price_per_month, images:room_images(image_url, is_primary)),
      tenant:users!tenant_id(id, full_name, avatar_url, phone, email),
      landlord:users!landlord_id(id, full_name, avatar_url, phone, email)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as BookingWithDetails;
}

/**
 * Update booking status (for landlords)
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  notes?: string
): Promise<Booking> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    updateData.landlord_notes = notes;
  }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel a booking (for tenants)
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      tenant_notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get available time slots for a room on a specific date
 */
export async function getAvailableTimeSlots(
  roomId: string,
  date: string
): Promise<string[]> {
  // Get existing bookings for the date
  const { data: existingBookings, error } = await supabase
    .from('bookings')
    .select('booking_time, duration_minutes')
    .eq('room_id', roomId)
    .eq('booking_date', date)
    .in('status', ['pending', 'confirmed']);

  if (error) throw error;

  // Define available time slots (9 AM to 8 PM)
  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  // Filter out booked slots
  const bookedTimes = new Set(existingBookings?.map(b => b.booking_time) || []);
  
  return allSlots.filter(slot => !bookedTimes.has(slot));
}

/**
 * Get booking statistics for landlord dashboard
 */
export async function getBookingStats(landlordId: string): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}> {
  const { data, error } = await supabase
    .from('bookings')
    .select('status')
    .eq('landlord_id', landlordId);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  data?.forEach(booking => {
    const status = booking.status as BookingStatus;
    if (status in stats) {
      stats[status]++;
    }
  });

  return stats;
}
