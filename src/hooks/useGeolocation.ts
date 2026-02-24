/**
 * useGeolocation Hook
 * Browser Geolocation API wrapper with error handling
 */
import { useState, useEffect } from "react";

export interface GeoPosition {
    lat: number;
    lng: number;
}

export interface UseGeolocationResult {
    position: GeoPosition | null;
    loading: boolean;
    error: string | null;
    denied: boolean;
}

/**
 * Hook to get user's current position
 * Only requests permission once on mount
 * Gracefully handles denial and errors
 */
export function useGeolocation(): UseGeolocationResult {
    const [position, setPosition] = useState<GeoPosition | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [denied, setDenied] = useState<boolean>(false);

    useEffect(() => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setError("Trình duyệt không hỗ trợ định vị");
            setLoading(false);
            return;
        }

        const handleSuccess = (pos: GeolocationPosition) => {
            setPosition({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            });
            setLoading(false);
            setError(null);
        };

        const handleError = (err: GeolocationPositionError) => {
            if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
                setDenied(true);
                setError(null); // Don't show error for denied - it's user's choice
            } else {
                setError("Không thể lấy vị trí hiện tại");
            }
            setPosition(null);
            setLoading(false);
        };

        // Request position only once on mount
        navigator.geolocation.getCurrentPosition(
            (pos) => handleSuccess(pos),
            (err) => handleError(err),
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes cache
            }
        );
    }, []);

    return { position, loading, error, denied };
}
