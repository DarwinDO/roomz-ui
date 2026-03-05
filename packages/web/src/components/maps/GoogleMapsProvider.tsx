/**
 * GoogleMapsProvider - Load Google Maps JavaScript API
 * Sử dụng @react-google-maps/api với best practices từ Google Maps MCP
 */
import { LoadScript } from '@react-google-maps/api';
import type { ReactNode } from 'react';

// Libraries cần load - chỉ load một lần
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = [
    'places',    // Cho Places Autocomplete
    'geometry',  // Cho distance calculation
];

interface GoogleMapsProviderProps {
    children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình');
        return (
            <div className="p-4 text-center">
                <p className="text-muted-foreground">Google Maps chưa được cấu hình</p>
            </div>
        );
    }

    return (
        <LoadScript
            googleMapsApiKey={apiKey}
            libraries={libraries}
            loadingElement={
                <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="animate-pulse text-muted-foreground">Đang tải bản đồ...</div>
                </div>
            }
            // Internal attribution ID theo Google Maps MCP guidelines
            onLoad={() => {
                // Attribution tracking
                if (window.google?.maps) {
                    (window.google.maps as any).__internalUsageAttributionId = 'gmp_mcp_codeassist_v0.1_github';
                }
            }}
        >
            {children}
        </LoadScript>
    );
}