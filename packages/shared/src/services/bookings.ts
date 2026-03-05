/**
 * Bookings API Service (Shared)
 * CRUD operations for room bookings and viewings
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types - Aligned with Database Schema
// ============================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
    id: string;
    renter_id: string;
    landlord_id: string;
    room_id: string;
    booking_date: string; // ISO timestamp
    status: BookingStatus;
    note: string | null;
    created_at: string | null;
    updated_at: string | null;
    room?: {
        id: string;
        title: string;
        address: string;
        landlord_id: string;
    };
    renter?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    landlord?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface CreateBookingInput {
    renter_id: string;
    landlord_id: string;
    room_id: string;
    booking_date: string; // ISO timestamp
    note?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get bookings for a renter
 */
export async function getRenterBookings(
    supabase: SupabaseClient,
    renterId: string
): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      room:rooms(id, title, address, landlord_id)
    `)
        .eq('renter_id', renterId)
        .order('booking_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Booking[];
}

/**
 * Get bookings for a landlord
 */
export async function getLandlordBookings(
    supabase: SupabaseClient,
    landlordId: string
): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      room:rooms(id, title, address, landlord_id),
      renter:users!bookings_renter_id_fkey(id, full_name, avatar_url)
    `)
        .eq('landlord_id', landlordId)
        .order('booking_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Booking[];
}

/**
 * Get bookings for a room
 */
export async function getRoomBookings(
    supabase: SupabaseClient,
    roomId: string
): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      renter:users!bookings_renter_id_fkey(id, full_name, avatar_url)
    `)
        .eq('room_id', roomId)
        .order('booking_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Booking[];
}

/**
 * Create a booking
 */
export async function createBooking(
    supabase: SupabaseClient,
    input: CreateBookingInput
): Promise<Booking> {
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
            renter_id: input.renter_id,
            landlord_id: input.landlord_id,
            room_id: input.room_id,
            booking_date: input.booking_date,
            note: input.note || null,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;

    return booking as Booking;
}

/**
 * Update a booking status
 */
export async function updateBookingStatus(
    supabase: SupabaseClient,
    id: string,
    status: BookingStatus,
    note?: string
): Promise<Booking> {
    const updates: { status: BookingStatus; note?: string; updated_at: string } = {
        status,
        updated_at: new Date().toISOString(),
    };
    if (note) updates.note = note;

    const { data: booking, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return booking as Booking;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
    supabase: SupabaseClient,
    id: string,
    reason?: string
): Promise<void> {
    const updates: { status: 'cancelled'; note?: string; updated_at: string } = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
    };
    if (reason) updates.note = reason;

    const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}

/**
 * Confirm a booking
 */
export async function confirmBooking(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({
            status: 'confirmed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Complete a booking
 */
export async function completeBooking(
    supabase: SupabaseClient,
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get single booking by ID
 */
export async function getBookingById(
    supabase: SupabaseClient,
    bookingId: string
): Promise<Booking | null> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      room:rooms(*),
      landlord:users!bookings_landlord_id_fkey(id, full_name, avatar_url),
      renter:users!bookings_renter_id_fkey(id, full_name, avatar_url)
    `)
        .eq('id', bookingId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    return data as Booking;
}
