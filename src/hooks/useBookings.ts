/**
 * useBookings Hook
 * React hooks for managing bookings
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts';
import {
  createBooking,
  getTenantBookings,
  getLandlordBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getAvailableTimeSlots,
  getBookingStats,
  type BookingWithDetails,
  type CreateBookingData,
  type BookingStatus,
} from '@/services/bookings';

interface UseBookingsReturn {
  bookings: BookingWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createNewBooking: (data: CreateBookingData) => Promise<BookingWithDetails>;
  cancelUserBooking: (bookingId: string, reason?: string) => Promise<void>;
}

/**
 * Hook for tenant bookings (user who books rooms)
 */
export function useTenantBookings(): UseBookingsReturn {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getTenantBookings(user.id);
      setBookings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      console.error('Error fetching tenant bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createNewBooking = useCallback(async (data: CreateBookingData): Promise<BookingWithDetails> => {
    if (!user?.id) {
      throw new Error('User must be logged in to create bookings');
    }

    const booking = await createBooking(user.id, data);
    // Refetch to get full booking details
    await fetchBookings();
    
    // Return the booking with details
    const fullBooking = await getBookingById(booking.id);
    if (!fullBooking) {
      throw new Error('Failed to fetch created booking');
    }
    return fullBooking;
  }, [user?.id, fetchBookings]);

  const cancelUserBooking = useCallback(async (bookingId: string, reason?: string): Promise<void> => {
    await cancelBooking(bookingId, reason);
    await fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createNewBooking,
    cancelUserBooking,
  };
}

interface UseLandlordBookingsReturn {
  bookings: BookingWithDetails[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  refetch: () => Promise<void>;
  confirmBooking: (bookingId: string, notes?: string) => Promise<void>;
  rejectBooking: (bookingId: string, reason?: string) => Promise<void>;
  completeBooking: (bookingId: string, notes?: string) => Promise<void>;
}

/**
 * Hook for landlord bookings (room owner)
 */
export function useLandlordBookings(): UseLandlordBookingsReturn {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const fetchBookings = useCallback(async () => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [bookingsData, statsData] = await Promise.all([
        getLandlordBookings(user.id),
        getBookingStats(user.id),
      ]);
      setBookings(bookingsData);
      setStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      console.error('Error fetching landlord bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = useCallback(async (
    bookingId: string, 
    status: BookingStatus, 
    notes?: string
  ): Promise<void> => {
    await updateBookingStatus(bookingId, status, notes);
    await fetchBookings();
  }, [fetchBookings]);

  const confirmBooking = useCallback(async (bookingId: string, notes?: string): Promise<void> => {
    await updateStatus(bookingId, 'confirmed', notes);
  }, [updateStatus]);

  const rejectBooking = useCallback(async (bookingId: string, reason?: string): Promise<void> => {
    await updateStatus(bookingId, 'cancelled', reason);
  }, [updateStatus]);

  const completeBooking = useCallback(async (bookingId: string, notes?: string): Promise<void> => {
    await updateStatus(bookingId, 'completed', notes);
  }, [updateStatus]);

  return {
    bookings,
    loading,
    error,
    stats,
    refetch: fetchBookings,
    confirmBooking,
    rejectBooking,
    completeBooking,
  };
}

interface UseTimeSlots {
  slots: string[];
  loading: boolean;
  error: string | null;
  refetch: (date: string) => Promise<void>;
}

/**
 * Hook to get available time slots for a room
 */
export function useAvailableTimeSlots(roomId: string, initialDate?: string): UseTimeSlots {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: string) => {
    if (!roomId || !date) {
      setSlots([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const availableSlots = await getAvailableTimeSlots(roomId, date);
      setSlots(availableSlots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch time slots';
      setError(message);
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (initialDate) {
      fetchSlots(initialDate);
    }
  }, [initialDate, fetchSlots]);

  return {
    slots,
    loading,
    error,
    refetch: fetchSlots,
  };
}

/**
 * Hook to get a single booking by ID
 */
export function useBooking(bookingId: string | undefined): {
  booking: BookingWithDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setBooking(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch booking';
      setError(message);
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
  };
}
