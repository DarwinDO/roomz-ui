/**
 * Bookings API Service (Shared)
 * CRUD operations for room bookings and viewings
 * Platform agnostic with SupabaseClient injection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingType = 'viewing' | 'moving' | 'deposit';

export interface Booking {
    id: string;
    user_id: string;
    room_id: string;
    type: BookingType;
    scheduled_date: string;
    scheduled_time: string;
    status: BookingStatus;
    notes: string | null;
    contact_phone: string | null;
    created_at: string;
    updated_at: string;
    room?: {
        id: string;
        title: string;
        address: string;
        landlord_id: string;
    };
}

// ============================================
// API Functions
// ============================================

/**
 * Get user's bookings
 */
export async function getUserBookings(
    supabase: SupabaseClient,
    userId: string
): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            room:rooms(id, title, address, landlord_id)
        `)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

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
        .select('*')
        .eq('room_id', roomId)
        .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return (data || []) as Booking[];
}

/**
 * Create a booking
 */
export async function createBooking(
    supabase: SupabaseClient,
    data: {
        user_id: string;
        room_id: string;
        type: BookingType;
        scheduled_date: string;
        scheduled_time: string;
        notes?: string;
        contact_phone?: string;
    }
): Promise<Booking> {
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert(data)
        .select()
        .single();

    if (error) throw error;

    return booking as Booking;
}

/**
 * Update a booking
 */
export async function updateBooking(
    supabase: SupabaseClient,
    id: string,
    data: Partial<{
        scheduled_date: string;
        scheduled_time: string;
        status: BookingStatus;
        notes: string;
    }>
): Promise<Booking> {
    const { data: booking, error } = await supabase
        .from('bookings')
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
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
    id: string
): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
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
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}
