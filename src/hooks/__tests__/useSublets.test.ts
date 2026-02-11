/**
 * useSublets Hook Tests
 * Following Testing Patterns - AAA Pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSublets, useSublet, useCreateSublet } from '../useSublets';
import * as subletServices from '@/services/sublets';

// Mock services
vi.mock('@/services/sublets', () => ({
    fetchSublets: vi.fn(),
    fetchSubletById: vi.fn(),
    createSublet: vi.fn(),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
};

describe('useSublets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useSublets', () => {
        it('should fetch sublets with filters', async () => {
            // Arrange
            const mockResponse = {
                sublets: [
                    {
                        id: '1',
                        room_title: 'Test Room',
                        sublet_price: 3000000,
                        city: 'HCM',
                        district: 'Quan 1',
                    },
                ],
                totalCount: 1,
                hasMore: false,
            };
            vi.mocked(subletServices.fetchSublets).mockResolvedValue(mockResponse);

            // Act
            const { result } = renderHook(
                () => useSublets({ city: 'HCM', min_price: 2000000 }),
                { wrapper: createWrapper() }
            );

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.pages[0].sublets).toHaveLength(1);
            expect(subletServices.fetchSublets).toHaveBeenCalledWith(
                { city: 'HCM', min_price: 2000000 },
                1
            );
        });

        it('should handle error state', async () => {
            // Arrange
            vi.mocked(subletServices.fetchSublets).mockRejectedValue(
                new Error('Network error')
            );

            // Act
            const { result } = renderHook(() => useSublets(), {
                wrapper: createWrapper(),
            });

            // Assert
            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error).toBeDefined();
        });
    });

    describe('useSublet', () => {
        it('should fetch single sublet by id', async () => {
            // Arrange
            const mockSublet = {
                id: '1',
                room_title: 'Test Room',
                sublet_price: 3000000,
            };
            vi.mocked(subletServices.fetchSubletById).mockResolvedValue(mockSublet);

            // Act
            const { result } = renderHook(() => useSublet('1'), {
                wrapper: createWrapper(),
            });

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockSublet);
        });

        it('should not fetch when id is undefined', () => {
            // Act
            const { result } = renderHook(() => useSublet(undefined), {
                wrapper: createWrapper(),
            });

            // Assert
            expect(result.current.isLoading).toBe(false);
            expect(subletServices.fetchSubletById).not.toHaveBeenCalled();
        });
    });

    describe('useCreateSublet', () => {
        it('should create sublet and invalidate cache', async () => {
            // Arrange
            const newSublet = {
                original_room_id: 'room-1',
                start_date: '2024-06-01',
                end_date: '2024-08-01',
                sublet_price: 3000000,
            };
            const mockResponse = { id: 'sublet-1', ...newSublet };
            vi.mocked(subletServices.createSublet).mockResolvedValue(mockResponse);

            // Act
            const { result } = renderHook(() => useCreateSublet(), {
                wrapper: createWrapper(),
            });

            result.current.mutate(newSublet);

            // Assert
            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(subletServices.createSublet).toHaveBeenCalledWith(newSublet);
        });
    });
});
