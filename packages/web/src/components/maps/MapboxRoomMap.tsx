/**
 * MapboxRoomMap - Hiển thị phòng trọ trên Mapbox
 * Thay thế GoogleRoomMap với Mapbox GL JS
 * 
 * Features:
 * - Hiển thị markers cho tất cả phòng
 * - Popup khi click marker
 * - Custom map styles (dark/light)
 * - Auto-fit bounds
 * - Performance tốt với nhiều markers
 */
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { RoomWithDetails } from '@/services/rooms';
import { formatPriceInMillions } from '@roomz/shared/utils/format';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

// Default center (Ho Chi Minh City)
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 12;

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapboxRoomMapProps {
    rooms: RoomWithDetails[];
    className?: string;
    singleRoom?: boolean;
    interactive?: boolean;
    showRadius?: boolean;
    radiusKm?: number;
    center?: [number, number];
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

/** Token check */
function TokenError() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-muted/30 rounded-2xl border border-border p-4">
            <p className="text-destructive font-medium mb-2">Mapbox chưa được cấu hình</p>
            <p className="text-muted-foreground text-sm text-center">
                Vui lòng thêm VITE_MAPBOX_ACCESS_TOKEN vào file .env
            </p>
        </div>
    );
}

export function MapboxRoomMap({
    rooms,
    className = '',
    singleRoom = false,
    interactive = true,
    showRadius = false,
    radiusKm = 2,
    center,
}: MapboxRoomMapProps) {
    const navigate = useNavigate();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);

    // Filter rooms có tọa độ hợp lệ
    const roomsWithCoords = useMemo(
        () => rooms.filter((r): r is RoomWithDetails & { latitude: number; longitude: number } =>
            typeof r.latitude === 'number' && typeof r.longitude === 'number'
        ),
        [rooms]
    );

    // Kiểm tra token
    if (!MAPBOX_TOKEN) {
        return <TokenError />;
    }

    // Không có tọa độ
    if (roomsWithCoords.length === 0) {
        return <MapPlaceholder />;
    }

    useEffect(() => {
        if (!mapContainer.current) return;

        // Tính center
        const mapCenter = center || (singleRoom && roomsWithCoords.length > 0
            ? [roomsWithCoords[0].longitude, roomsWithCoords[0].latitude] as [number, number]
            : DEFAULT_CENTER);

        const zoom = singleRoom ? 15 : DEFAULT_ZOOM;

        // Khởi tạo map
        mapboxgl.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12', // Hoặc 'mapbox://styles/mapbox/dark-v11'
            center: mapCenter,
            zoom: zoom,
            interactive: interactive,
        });

        // Add navigation controls
        if (interactive) {
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        // Fit bounds nếu multi-room
        if (!singleRoom && roomsWithCoords.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            roomsWithCoords.forEach((room) => {
                bounds.extend([room.longitude, room.latitude]);
            });
            map.current.fitBounds(bounds, { padding: 50 });
        }

        // Add markers
        roomsWithCoords.forEach((room) => {
            // Tạo custom marker element
            const el = document.createElement('div');
            el.className = 'cursor-pointer';
            el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0284C7" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `;

            const marker = new mapboxgl.Marker(el)
                .setLngLat([room.longitude, room.latitude])
                .addTo(map.current!);

            // Click handler
            el.addEventListener('click', () => {
                setSelectedRoom(room);
            });

            markersRef.current.push(marker);
        });

        // Radius circle nếu có center
        if (showRadius && center) {
            map.current.on('load', () => {
                map.current!.addSource('radius', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: center,
                        },
                        properties: {},
                    },
                });

                map.current!.addLayer({
                    id: 'radius-circle',
                    type: 'circle',
                    source: 'radius',
                    paint: {
                        'circle-radius': {
                            stops: [
                                [0, 0],
                                [20, radiusKm * 1000], // meters at max zoom
                            ],
                            base: 2,
                        },
                        'circle-color': '#0284C7',
                        'circle-opacity': 0.1,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#0284C7',
                        'circle-stroke-opacity': 0.5,
                    },
                });
            });
        }

        return () => {
            // Cleanup
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            map.current?.remove();
        };
    }, [roomsWithCoords, singleRoom, interactive, showRadius, radiusKm, center]);

    return (
        <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`}>
            <div ref={mapContainer} className="w-full h-full min-h-[300px]" />

            {/* Selected room popup */}
            {selectedRoom && (
                <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 max-w-[280px] z-10">
                    <button
                        onClick={() => setSelectedRoom(null)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                    {selectedRoom.images?.[0]?.image_url && (
                        <img
                            src={selectedRoom.images[0].image_url}
                            alt={selectedRoom.title}
                            className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                    )}
                    <h4 className="font-semibold text-sm mb-1 pr-4">{selectedRoom.title}</h4>
                    <p className="text-xs text-gray-500 mb-1">
                        {[selectedRoom.district, selectedRoom.city].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-sm font-bold text-sky-600 mb-2">
                        {formatPriceInMillions(Number(selectedRoom.price_per_month))}tr/tháng
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/room/${selectedRoom.id}`)}
                            className="flex-1 bg-sky-600 text-white text-xs py-2 rounded-lg hover:bg-sky-700"
                        >
                            Xem chi tiết
                        </button>
                        <button
                            onClick={() => {
                                const dest = `${selectedRoom.latitude},${selectedRoom.longitude}`;
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                        >
                            Chỉ đường
                        </button>
                    </div>
                </div>
            )}

            {/* Stats footer */}
            {rooms.length > 0 && roomsWithCoords.length < rooms.length && !singleRoom && (
                <div className="absolute bottom-0 left-0 right-0 bg-muted/50 text-center py-2 text-xs text-muted-foreground">
                    Hiển thị {roomsWithCoords.length}/{rooms.length} phòng có tọa độ
                </div>
            )}
        </div>
    );
}