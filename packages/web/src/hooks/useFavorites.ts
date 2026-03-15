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
import { FREE_LIMITS } from '@roomz/shared/constants/premium';

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
      setFavoritedRoomIds(new Set(data.map((favorite) => favorite.room_id)));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites';
      setError(errorMessage);
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = useCallback(async (roomId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be logged in to favorite rooms');
    }

    if (pendingRoomIds.has(roomId)) {
      return favoritedRoomIds.has(roomId);
    }

    setPendingRoomIds((previous) => new Set([...previous, roomId]));

    const wasFavorited = favoritedRoomIds.has(roomId);
    const previousFavorites = favorites;

    if (!wasFavorited) {
      setFavoritedRoomIds((previous) => new Set([...previous, roomId]));
    } else {
      setFavoritedRoomIds((previous) => {
        const nextIds = new Set(previous);
        nextIds.delete(roomId);
        return nextIds;
      });
      setFavorites((previous) => previous.filter((favorite) => favorite.room_id !== roomId));
    }

    try {
      const result = await toggleFavorite(user.id, roomId);

      if (result.favorited !== !wasFavorited) {
        if (result.favorited) {
          setFavoritedRoomIds((previous) => new Set([...previous, roomId]));
        } else {
          setFavoritedRoomIds((previous) => {
            const nextIds = new Set(previous);
            nextIds.delete(roomId);
            return nextIds;
          });
          setFavorites((previous) => previous.filter((favorite) => favorite.room_id !== roomId));
        }
      }

      return result.favorited;
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'FAVORITE_LIMIT_REACHED') {
        toast.error(
          `Bạn đã đạt giới hạn ${FREE_LIMITS.FAVORITES_MAX} phòng yêu thích. Nâng cấp RommZ+ để lưu không giới hạn.`,
          {
            action: {
              label: 'Nâng cấp',
              onClick: () => {
                window.location.href = '/payment';
              },
            },
          },
        );
        setFavoritedRoomIds(new Set(Array.from(previousFavorites).map((favorite) => favorite.room_id)));
        setFavorites(previousFavorites);
        return false;
      }

      setFavoritedRoomIds(new Set(Array.from(previousFavorites).map((favorite) => favorite.room_id)));
      setFavorites(previousFavorites);
      console.error('Error toggling favorite:', err);
      throw err;
    } finally {
      setPendingRoomIds((previous) => {
        const nextIds = new Set(previous);
        nextIds.delete(roomId);
        return nextIds;
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
  }, [user?.id, roomId]);

  const toggle = useCallback(async () => {
    if (!user?.id || isPending) {
      return;
    }

    setIsPending(true);

    const previousState = isFavorited;
    setIsFavorited(!previousState);

    try {
      const result = await toggleFavorite(user.id, roomId);

      if (result.favorited !== !previousState) {
        setIsFavorited(result.favorited);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'FAVORITE_LIMIT_REACHED') {
        setIsFavorited(previousState);
        return;
      }

      setIsFavorited(previousState);
      console.error('Error toggling favorite:', err);
    } finally {
      setIsPending(false);
    }
  }, [user?.id, roomId, isPending, isFavorited]);

  return {
    isFavorited,
    loading,
    toggle,
  };
}
