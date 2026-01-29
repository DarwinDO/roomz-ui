/**
 * Vietnam Locations Service
 * Fetches provinces and districts from API with local fallback
 */

import { PROVINCES, DISTRICTS_FALLBACK, type Province, type District } from "@/data/vietnam-locations";
export type { Province, District };

const API_BASE = "https://provinces.open-api.vn/api";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ApiProvince {
    code: number;
    name: string;
    districts?: ApiDistrict[];
}

interface ApiDistrict {
    code: number;
    name: string;
}

/**
 * Get all provinces
 * Tries API first, falls back to local data
 */
export async function getProvinces(): Promise<Province[]> {
    try {
        // Check cache first
        const cached = getCachedData<Province[]>("provinces");
        if (cached) return cached;

        // Fetch from API
        const response = await fetch(`${API_BASE}/p/`, {
            signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!response.ok) throw new Error("API request failed");

        const data: ApiProvince[] = await response.json();
        const provinces = data.map(p => ({
            code: p.code,
            name: p.name,
        }));

        // Cache the result
        setCachedData("provinces", provinces);
        return provinces;
    } catch (error) {
        console.warn("Failed to fetch provinces from API, using local data:", error);
        return PROVINCES;
    }
}

/**
 * Get districts for a specific province
 * Tries API first, falls back to local data
 */
export async function getDistricts(provinceCode: number, provinceName: string): Promise<District[]> {
    try {
        // Check cache first
        const cacheKey = `districts_${provinceCode}`;
        const cached = getCachedData<District[]>(cacheKey);
        if (cached) return cached;

        // Fetch from API with detailed province data
        const response = await fetch(`${API_BASE}/p/${provinceCode}?depth=2`, {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) throw new Error("API request failed");

        const data: ApiProvince = await response.json();
        const districts = (data.districts || []).map(d => ({
            code: d.code,
            name: d.name,
            provinceCode: provinceCode,
        }));

        // Cache the result
        setCachedData(cacheKey, districts);
        return districts;
    } catch (error) {
        console.warn(`Failed to fetch districts for ${provinceName}, using local fallback:`, error);
        // Return fallback data if available
        return DISTRICTS_FALLBACK[provinceName] || [];
    }
}

/**
 * Search provinces by name
 */
export function searchProvinces(query: string, provinces: Province[]): Province[] {
    if (!query) return provinces;

    const lowerQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return provinces.filter(p => {
        const normalized = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalized.includes(lowerQuery);
    });
}

// Cache helpers
function getCachedData<T>(key: string): T | null {
    try {
        const item = localStorage.getItem(`vn_locations_${key}`);
        if (!item) return null;

        const { data, timestamp } = JSON.parse(item);

        // Check if cache is still valid
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(`vn_locations_${key}`);
            return null;
        }

        return data as T;
    } catch {
        return null;
    }
}

function setCachedData<T>(key: string, data: T): void {
    try {
        const item = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(`vn_locations_${key}`, JSON.stringify(item));
    } catch (error) {
        console.warn("Failed to cache data:", error);
    }
}
