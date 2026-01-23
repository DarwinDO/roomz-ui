/**
 * useRooms Hook
 * React hook for fetching and managing rooms data
 * 
 * IMPORTANT: When using useRooms with filters, make sure the filters object
 * is memoized or stable to prevent infinite re-fetching:
 * 
 * Good: const filters = useMemo(() => ({ district, minPrice }), [district, minPrice]);
 * Bad:  useRooms({ district, minPrice }) // Creates new object each render
 */

import { useState, useEffect, useCallback } from 'react';
import { getRooms, getRoomById, type RoomWithDetails, type RoomFilters } from '@/services/rooms';

interface UseRoomsReturn {
  rooms: RoomWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseRoomReturn {
  room: RoomWithDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch all rooms with optional filters
 */
export function useRooms(filters: RoomFilters = {}): UseRoomsReturn {
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRooms(filters);
      setRooms(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rooms';
      setError(errorMessage);
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [
    filters.district,
    filters.minPrice,
    filters.maxPrice,
    filters.roomType,
    filters.searchQuery,
    filters.isVerified,
  ]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
}

/**
 * Hook to fetch a single room by ID
 */
export function useRoom(id: string | undefined): UseRoomReturn {
  const [room, setRoom] = useState<RoomWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getRoomById(id);
      setRoom(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch room';
      setError(errorMessage);
      console.error('Error fetching room:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  return { room, loading, error, refetch: fetchRoom };
}

/**
 * Hook to fetch landlord's rooms (includes all statuses: pending, active, etc.)
 */
export function useLandlordRooms(landlordId: string | undefined) {
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!landlordId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { getRoomsByLandlord } = await import('@/services/rooms');
      const data = await getRoomsByLandlord(landlordId);
      setRooms(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rooms';
      setError(errorMessage);
      console.error('Error fetching landlord rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [landlordId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const stats = {
    total: rooms.length,
    pending: rooms.filter(r => r.status === 'pending').length,
    active: rooms.filter(r => r.status === 'active').length,
    totalViews: rooms.reduce((sum, r) => sum + (r.view_count || 0), 0),
    totalFavorites: rooms.reduce((sum, r) => sum + (r.favorite_count || 0), 0),
  };

  return { rooms, loading, error, stats, refetch: fetchRooms };
}
