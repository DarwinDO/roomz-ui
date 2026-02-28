/**
 * Vietnam Locations Service (Shared)
 * Fetches provinces and districts from API with local fallback
 * Platform agnostic with StorageAdapter injection
 */

import type { StorageAdapter } from '../adapters';

// Types (inline - these are specific to Vietnam locations)
export interface Province {
    code: number;
    name: string;
}

export interface District {
    code: number;
    name: string;
    provinceCode: number;
}

// Local fallback data
const PROVINCES: Province[] = [
    { code: 1, name: 'Hà Nội' },
    { code: 79, name: 'Hồ Chí Minh' },
    { code: 48, name: 'Đà Nẵng' },
    { code: 72, name: 'Cần Thơ' },
    { code: 92, name: 'Kiên Giang' },
    { code: 52, name: 'Khánh Hòa' },
    { code: 60, name: 'Bà Rịa - Vũng Tàu' },
    { code: 2, name: 'Hà Giang' },
    { code: 4, name: 'Cao Bằng' },
    { code: 6, name: 'Bắc Kạn' },
    { code: 8, name: 'Tuyên Quang' },
    { code: 10, name: 'Lào Cai' },
    { code: 11, name: 'Điện Biên' },
    { code: 12, name: 'Lai Chau' },
    { code: 14, name: 'Sơn La' },
    { code: 15, name: 'Yên Bái' },
    { code: 17, name: 'Hoà Bình' },
    { code: 19, name: 'Thái Nguyên' },
    { code: 20, name: 'Lạng Sơn' },
    { code: 22, name: 'Quảng Ninh' },
    { code: 24, name: 'Bắc Giang' },
    { code: 25, name: 'Phú Thọ' },
    { code: 26, name: 'Vĩnh Phúc' },
    { code: 27, name: 'Bắc Ninh' },
    { code: 30, name: 'Hải Dương' },
    { code: 31, name: 'Hải Phòng' },
    { code: 33, name: 'Hưng Yên' },
    { code: 34, name: 'Thái Bình' },
    { code: 35, name: 'Hà Nam' },
    { code: 36, name: 'Nam Định' },
    { code: 37, name: 'Ninh Bình' },
    { code: 40, name: 'Thanh Hóa' },
    { code: 42, name: 'Nghệ An' },
    { code: 44, name: 'Hà Tĩnh' },
    { code: 45, name: 'Quảng Bình' },
    { code: 46, name: 'Quảng Trị' },
    { code: 47, name: 'Thừa Thiên Huế' },
    { code: 49, name: 'Quảng Nam' },
    { code: 51, name: 'Quảng Ngãi' },
    { code: 54, name: 'Bình Định' },
    { code: 56, name: 'Phú Yên' },
    { code: 58, name: 'Khánh Hòa' },
    { code: 62, name: 'Ninh Thuận' },
    { code: 64, name: 'Bình Thuận' },
    { code: 66, name: 'Kon Tum' },
    { code: 67, name: 'Gia Lai' },
    { code: 68, name: 'Đắk Lắk' },
    { code: 69, name: 'Đắk Nông' },
    { code: 70, name: 'Lâm Đồng' },
    { code: 74, name: 'Vĩnh Long' },
    { code: 75, name: 'Bến Tre' },
    { code: 76, name: 'Trà Vinh' },
    { code: 77, name: 'Sóc Trăng' },
    { code: 78, name: 'Bạc Liêu' },
    { code: 80, name: 'Tiền Giang' },
    { code: 81, name: 'Đồng Tháp' },
    { code: 82, name: 'An Giang' },
    { code: 83, name: 'Kiên Giang' },
    { code: 84, name: 'Hậu Giang' },
    { code: 86, name: 'Sơn La' },
    { code: 91, name: 'Bắc Kạn' },
    { code: 93, name: 'Hồng Ngự' },
];

const DISTRICTS_FALLBACK: Record<string, District[]> = {};

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

// Cache helpers using StorageAdapter
async function getCachedData<T>(
    storageAdapter: StorageAdapter,
    key: string
): Promise<T | null> {
    try {
        const item = await storageAdapter.getItem(`vn_locations_${key}`);
        if (!item) return null;

        const { data, timestamp } = JSON.parse(item);

        // Check if cache is still valid
        if (Date.now() - timestamp > CACHE_DURATION) {
            await storageAdapter.removeItem(`vn_locations_${key}`);
            return null;
        }

        return data as T;
    } catch {
        return null;
    }
}

async function setCachedData<T>(
    storageAdapter: StorageAdapter,
    key: string,
    data: T
): Promise<void> {
    try {
        const item = {
            data,
            timestamp: Date.now(),
        };
        await storageAdapter.setItem(`vn_locations_${key}`, JSON.stringify(item));
    } catch (error) {
        console.warn("Failed to cache data:", error);
    }
}

// ============================================
// API Functions
// ============================================

/**
 * Get all provinces
 * Tries API first, falls back to local data
 */
export async function getProvinces(
    storageAdapter: StorageAdapter
): Promise<Province[]> {
    try {
        // Check cache first
        const cached = await getCachedData<Province[]>(storageAdapter, "provinces");
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
        await setCachedData(storageAdapter, "provinces", provinces);
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
export async function getDistricts(
    storageAdapter: StorageAdapter,
    provinceCode: number,
    provinceName: string
): Promise<District[]> {
    try {
        // Check cache first
        const cacheKey = `districts_${provinceCode}`;
        const cached = await getCachedData<District[]>(storageAdapter, cacheKey);
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
        await setCachedData(storageAdapter, cacheKey, districts);
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
