/**
 * Geo Utilities
 * Pure functions for distance calculation and formatting
 */

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param km Distance in kilometers
 * @returns Formatted string like "Cách 300m" or "Cách 1.2 km"
 */
export function formatDistance(km: number): string {
    if (km < 0.001) {
        // Less than 1 meter
        return "Cách 1m";
    } else if (km < 1) {
        // Less than 1 km - show in meters
        const meters = Math.round(km * 1000);
        return `Cách ${meters}m`;
    } else if (km < 10) {
        // Less than 10 km - show with 1 decimal
        return `Cách ${km.toFixed(1)} km`;
    } else {
        // 10 km or more - show without decimal
        return `Cách ${Math.round(km)} km`;
    }
}
