/**
 * useFavorites Hook
 * React hook for managing user favorites
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';
import {
  getUserFavorites,
  toggleFavorite,
  isRoomFavorited,
  type FavoriteWithRoom,
} from '@/services/favorites';

interface UseFavoritesReturn {
  favorites: FavoriteWithRoom[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  toggleFavorite: (roomId: string) => Promise<boolean>;
  isFavorited: (roomId: string) => boolean;
}

/**
 * Hook to manage user favorites
 */
export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteWithRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritedRoomIds, setFavoritedRoomIds] = useState<Set<string>>(new Set());
  const [pendingRoomIds, setPendingRoomIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      setFavoritedRoomIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getUserFavorites(user.id);
      setFavorites(data);
      setFavoritedRoomIds(new Set(data.map(f => f.room_id)));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites';
      setError(errorMessage);
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Use user.id instead of user object

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = useCallback(async (roomId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be logged in to favorite rooms');
    }

    // Check if already pending - prevent race condition
    if (pendingRoomIds.has(roomId)) {
      return favoritedRoomIds.has(roomId);
    }

    // Mark as pending
    setPendingRoomIds(prev => new Set([...prev, roomId]));

    // Store previous state for rollback
    const wasFavorited = favoritedRoomIds.has(roomId);
    const previousFavorites = favorites;

    // Optimistic update
    if (!wasFavorited) {
      setFavoritedRoomIds(prev => new Set([...prev, roomId]));
    } else {
      setFavoritedRoomIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      });
      setFavorites(prev => prev.filter(f => f.room_id !== roomId));
    }

    try {
      const result = await toggleFavorite(user.id, roomId);

      // Verify optimistic update matches server response
      if (result.favorited !== !wasFavorited) {
        // Server state differs, sync with server
        if (result.favorited) {
          setFavoritedRoomIds(prev => new Set([...prev, roomId]));
        } else {
          setFavoritedRoomIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(roomId);
            return newSet;
          });
          setFavorites(prev => prev.filter(f => f.room_id !== roomId));
        }
      }

      return result.favorited;
    } catch (err: unknown) {
      // Handle favorite limit error
      if (err instanceof Error && err.message === 'FAVORITE_LIMIT_REACHED') {
        toast.error('Bạn đã đạt giới hạn 5 phòng yêu thích. Nâng cấp RommZ+ để lưu không giới hạn!', {
          action: {
            label: 'Nâng cấp',
            onClick: () => window.location.href = '/payment',
          },
        });
        // Rollback optimistic update
        setFavoritedRoomIds(new Set(Array.from(previousFavorites).map(f => f.room_id)));
        setFavorites(previousFavorites);
        return false;
      }
      // Rollback on other errors
      setFavoritedRoomIds(new Set(Array.from(previousFavorites).map(f => f.room_id)));
      setFavorites(previousFavorites);
      console.error('Error toggling favorite:', err);
      throw err;
    } finally {
      // Always remove from pending
      setPendingRoomIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      });
    }
  }, [user, favoritedRoomIds, favorites, pendingRoomIds]);

  const checkIsFavorited = useCallback((roomId: string): boolean => {
    return favoritedRoomIds.has(roomId);
  }, [favoritedRoomIds]);

  return {
    favorites,
    loading,
    error,
    refetch: fetchFavorites,
    toggleFavorite: handleToggleFavorite,
    isFavorited: checkIsFavorited,
  };
}

/**
 * Hook to check if a specific room is favorited
 */
export function useIsFavorited(roomId: string): {
  isFavorited: boolean;
  loading: boolean;
  toggle: () => Promise<void>;
} {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user?.id || !roomId) {
        setLoading(false);
        return;
      }

      try {
        const result = await isRoomFavorited(user.id, roomId);
        setIsFavorited(result);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkFavorite();
  }, [user?.id, roomId]); // Use user.id to prevent unnecessary refetch

  const toggle = useCallback(async () => {
    if (!user?.id) return;

    // Check if already pending - prevent race condition
    if (isPending) {
      return;
    }

    setIsPending(true);

    // Optimistic update
    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      const result = await toggleFavorite(user.id, roomId);

      // Verify with server response
      if (result.favorited !== !previousState) {
        setIsFavorited(result.favorited);
      }
    } catch (err: unknown) {
      // Handle favorite limit error
      if (err instanceof Error && err.message === 'FAVORITE_LIMIT_REACHED') {
        setIsFavorited(previousState);
        return;
      }
      // Rollback on other errors
      setIsFavorited(previousState);
      console.error('Error toggling favorite:', err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [user?.id, roomId, isFavorited, isPending]);

  return { isFavorited, loading, toggle };
}
