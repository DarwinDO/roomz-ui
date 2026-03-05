/**
 * MapWrapper - Wrapper component kết hợp Provider và Map
 * Giúp sử dụng Google Maps dễ dàng hơn trong các trang
 */
import type { ReactNode } from 'react';
import { GoogleMapsProvider } from './GoogleMapsProvider';
import { MapErrorBoundary } from './MapErrorBoundary';

interface MapWrapperProps {
    children: ReactNode;
}

/**
 * Wrapper component cung cấp Google Maps context
 * Sử dụng ở cấp cao nhất (App hoặc Layout) để load Google Maps API một lần
 */
export function MapWrapper({ children }: MapWrapperProps) {
    return (
        <MapErrorBoundary>
            <GoogleMapsProvider>
                {children}
            </GoogleMapsProvider>
        </MapErrorBoundary>
    );
}

// Re-export map components để dễ sử dụng
export { GoogleRoomMap } from './GoogleRoomMap';
export { PlacesAutocomplete } from './PlacesAutocomplete';