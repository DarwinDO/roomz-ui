/**
 * ShopMiniMap - Mini Leaflet map for ShopDetailModal
 * Shows partner location with marker and optional user position
 */
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from '@/lib/leaflet-setup';
import { MapPin } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';

interface ShopMiniMapProps {
    latitude: number;
    longitude: number;
    partnerName: string;
    category?: string;
    userPosition?: GeoPosition | null;
}

const MAP_HEIGHT = 200;
const DEFAULT_ZOOM = 15;

/** Custom user icon for user's position */
const userIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-180', // Blue tint for user marker
});

/** Fallback UI when coordinates are invalid */
function MapErrorFallback() {
    return (
        <div
            className="flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border"
            style={{ height: MAP_HEIGHT }}
        >
            <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có tọa độ</p>
        </div>
    );
}

export function ShopMiniMap({
    latitude,
    longitude,
    partnerName,
    category,
    userPosition,
}: ShopMiniMapProps) {
    // Validate coordinates
    const isValidCoords = useMemo(() => {
        return (
            latitude !== null &&
            longitude !== null &&
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }, [latitude, longitude]);

    // Don't render if invalid coordinates
    if (!isValidCoords) {
        return <MapErrorFallback />;
    }

    const partnerPosition: [number, number] = [latitude, longitude];
    const userPos: [number, number] | null = userPosition
        ? [userPosition.lat, userPosition.lng]
        : null;

    // Calculate initial zoom to fit both markers if user position exists
    const initialZoom = userPos ? 14 : DEFAULT_ZOOM;

    return (
        <div className="rounded-2xl overflow-hidden border border-border" style={{ height: MAP_HEIGHT }}>
            <MapContainer
                center={partnerPosition}
                zoom={initialZoom}
                className="h-full w-full"
                scrollWheelZoom={false}
                dragging={false}
                touchZoom={false}
                doubleClickZoom={false}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Partner marker */}
                <Marker position={partnerPosition}>
                    <Popup minWidth={180}>
                        <div style={{ minWidth: 160 }}>
                            <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                                {partnerName}
                            </h4>
                            {category && (
                                <p style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>
                                    {category}
                                </p>
                            )}
                        </div>
                    </Popup>
                </Marker>

                {/* User marker if available */}
                {userPos && (
                    <Marker position={userPos} icon={userIcon}>
                        <Popup minWidth={150}>
                            <div style={{ minWidth: 130 }}>
                                <p style={{ fontWeight: 600, fontSize: 12 }}>Vị trí của bạn</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Polyline connecting user to partner */}
                {userPos && (
                    <Polyline
                        positions={[userPos, partnerPosition]}
                        color="#0284C7"
                        weight={2}
                        opacity={0.7}
                        dashArray="5, 10"
                    />
                )}
            </MapContainer>
        </div>
    );
}
