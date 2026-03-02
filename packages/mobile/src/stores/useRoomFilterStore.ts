import { create } from 'zustand';
import type { RoomFilters } from '@roomz/shared';

interface RoomFilterState {
    filters: RoomFilters;
    setFilters: (filters: Partial<RoomFilters>) => void;
    resetFilters: () => void;
}

const DEFAULT_FILTERS: RoomFilters = {
    sortBy: 'newest',
    pageSize: 12,
};

export const useRoomFilterStore = create<RoomFilterState>((set) => ({
    filters: DEFAULT_FILTERS,
    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),
    resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
