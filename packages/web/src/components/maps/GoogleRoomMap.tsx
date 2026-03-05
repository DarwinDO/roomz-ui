/**
 * GoogleRoomMap - Hiển thị phòng trọ trên Google Maps
 * Thay thế RoomMap (Leaflet) với Google Maps JavaScript API
 * 
 * Features:
 * - Hiển thị markers cho tất cả phòng
 * - InfoWindow khi click marker
 * - Satellite view (mapTypeId: hybrid)
 * - Street View control
 * - Radius circle cho search
 * - Auto-fit bounds để hiển thị tất cả markers
 */
import { useMemo, useRef, useState, useCallback } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    Circle,
} from '@react-google-maps/api';
import type { RoomWithDetails } from '@/services/rooms';
import { formatPriceInMillions } from '@roomz/shared/utils/format';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Default center (Ho Chi Minh City)
const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 };
const DEFAULT_ZOOM = 13;

// Map container style
const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

interface GoogleRoomMapProps {
    rooms: RoomWithDetails[];
    className?: string;
    /** Single room mode - disable fitBounds, fixed zoom */
    singleRoom?: boolean;
    /** Allow scroll wheel zoom */
    interactive?: boolean;
    /** Show radius circle around center */
    showRadius?: boolean;
    radiusKm?: number;
    /** Center position (for radius search) */
    center?: { lat: number; lng: number };
    /** Called when map is loaded */
    onMapLoad?: (map: google.maps.Map) => void;
}

/** Room Popup Content cho InfoWindow */
function RoomPopup({ room, onClose }: { room: RoomWithDetails; onClose: () => void }) {
    const navigate = useNavigate();
    const imageUrl = room.images?.[0]?.image_url;

    const handleViewDetails = () => {
        navigate(`/room/${room.id}`);
        onClose();
    };

    const handleGetDirections = () => {
        const destination = `${room.latitude},${room.longitude}`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    };

    return (
        <div className="min-w-[220px] max-w-[280px]">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={room.title}
                    className="w-full h-24 object-cover rounded-t-lg mb-2"
                />
            )}
            <h4 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                {room.title}
            </h4>
            <p className="text-xs text-gray-500 mb-1">
                {[room.district, room.city].filter(Boolean).join(', ')}
            </p>
            <p className="text-sm font-bold text-sky-600 mb-3">
                {formatPriceInMillions(Number(room.price_per_month))}tr/tháng
            </p>
            <div className="flex gap-2">
                <Button
                    onClick={handleViewDetails}
                    className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-700"
                >
                    Xem chi tiết
                </Button>
                <Button
                    onClick={handleGetDirections}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                >
                    <Navigation className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}

/** Fallback UI khi không có tọa độ */
function MapPlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-muted/30 rounded-2xl border border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Chưa có dữ liệu bản đồ chính xác</p>
        </div>
    );
}

export function GoogleRoomMap({
    rooms,
    className = '',
    singleRoom = false,
    interactive = true,
    showRadius = false,
    radiusKm = 2,
    center,
    onMapLoad,
}: GoogleRoomMapProps) {
    const navigate = useNavigate();
    const mapRef = useRef<google.maps.Map | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);

    // Filter rooms có tọa độ hợp lệ và convert sang number
    const roomsWithCoords = useMemo(
        () => rooms
            .filter((r): r is RoomWithDetails & { latitude: number; longitude: number } =>
                typeof r.latitude === 'number' && typeof r.longitude === 'number'
            )
            .map(r => ({
                ...r,
                latitude: Number(r.latitude),
                longitude: Number(r.longitude),
            })),
        [rooms]
    );

    // Kiểm tra có tọa độ hợp lệ không
    const hasValidCoords = roomsWithCoords.length > 0;

    // Single room data
    const singleRoomData = singleRoom && roomsWithCoords.length > 0 ? roomsWithCoords[0] : null;

    // Tính center
    const mapCenter = useMemo(() => {
        if (center) return center;
        if (singleRoomData) return { lat: singleRoomData.latitude, lng: singleRoomData.longitude };
        if (roomsWithCoords.length > 0) {
            return { lat: roomsWithCoords[0].latitude, lng: roomsWithCoords[0].longitude };
        }
        return DEFAULT_CENTER;
    }, [center, singleRoomData, roomsWithCoords]);

    // Zoom level
    const zoom = singleRoom ? 15 : DEFAULT_ZOOM;

    // Handle map load
    const handleMapLoad = useCallback(
        (map: google.maps.Map) => {
            mapRef.current = map;

            // Fit bounds cho tất cả markers (multi-room mode)
            if (!singleRoom && roomsWithCoords.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                roomsWithCoords.forEach((room) => {
                    bounds.extend({ lat: room.latitude, lng: room.longitude });
                });
                map.fitBounds(bounds);
            }

            onMapLoad?.(map);
        },
        [roomsWithCoords, singleRoom, onMapLoad]
    );

    // Custom marker icon
    const markerIcon = useMemo(() => {
        // SVG marker inline để không cần file external
        const svgMarker = {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: "#0284C7",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#FFFFFF",
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
        };
        return svgMarker;
    }, []);

    // Hiển thị placeholder nếu không có tọa độ
    if (!hasValidCoords) {
        return (
            <div className={className}>
                <MapPlaceholder />
            </div>
        );
    }

    return (
        <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={zoom}
                onLoad={handleMapLoad}
                options={{
                    mapTypeId: 'hybrid', // ⭐ Satellite view
                    streetViewControl: true, // ⭐ Street View
                    fullscreenControl: true,
                    zoomControl: true,
                    mapTypeControl: true,
                    scrollwheel: interactive,
                    draggable: interactive,
                    disableDefaultUI: !interactive,
                    gestureHandling: interactive ? 'auto' : 'none',
                }}
            >
                {/* Radius circle */}
                {showRadius && center && (
                    <Circle
                        center={center}
                        radius={radiusKm * 1000} // Convert km to meters
                        options={{
                            fillColor: '#0284C7',
                            fillOpacity: 0.1,
                            strokeColor: '#0284C7',
                            strokeOpacity: 0.5,
                            strokeWeight: 2,
                        }}
                    />
                )}

                {/* Room markers */}
                {roomsWithCoords.map((room) => (
                    <Marker
                        key={room.id}
                        position={{ lat: room.latitude, lng: room.longitude }}
                        onClick={() => setSelectedRoom(room)}
                        icon={markerIcon}
                    />
                ))}

                {/* InfoWindow */}
                {selectedRoom && selectedRoom.latitude && selectedRoom.longitude && (
                    <InfoWindow
                        position={{
                            lat: Number(selectedRoom.latitude),
                            lng: Number(selectedRoom.longitude)
                        }}
                        onCloseClick={() => setSelectedRoom(null)}
                    >
                        <RoomPopup room={selectedRoom} onClose={() => setSelectedRoom(null)} />
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Stats footer */}
            {rooms.length > 0 && roomsWithCoords.length < rooms.length && !singleRoom && (
                <div className="bg-muted/50 text-center py-2 text-xs text-muted-foreground">
                    Hiển thị {roomsWithCoords.length}/{rooms.length} phòng có tọa độ trên bản đồ
                </div>
            )}
        </div>
    );
}