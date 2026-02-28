/**
 * RoomMap — Leaflet map with room markers and popups
 * Supports both multi-room (Search) and single-room (Detail) modes
 */
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from '@/lib/leaflet-setup';
import type { RoomWithDetails } from '@/services/rooms';
import { formatPriceInMillions } from '@roomz/shared/utils/format';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [10.82, 106.63];
const DEFAULT_ZOOM = 12;
const SINGLE_ROOM_ZOOM = 15;

interface RoomMapProps {
    rooms: RoomWithDetails[];
    className?: string;
    /** Single room mode: disable fitBounds, use fixed zoom */
    singleRoom?: boolean;
    /** Allow scroll wheel zoom (disable for inline to prevent scroll hijack) */
    interactive?: boolean;
}

/** Auto-fit map bounds to show all markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    const fitted = useRef(false);

    // Create stable key from all positions to detect content changes
    const positionKey = positions.map(p => `${p[0]},${p[1]}`).join('|');

    useEffect(() => {
        if (positions.length === 0 || fitted.current) return;
        const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        fitted.current = true;
    }, [positions, map]);

    // Re-fit when position content changes (not just length)
    useEffect(() => {
        fitted.current = false;
    }, [positionKey]);

    return null;
}

/** Fallback UI when no coordinates available */
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

/** 
 * Room popup content 
 * Note: Uses inline styles because Leaflet Popup renders content outside React's scope,
 * making Tailwind classes ineffective due to Shadow DOM isolation.
 */
function RoomPopup({ room }: { room: RoomWithDetails }) {
    const navigate = useNavigate();
    const imageUrl = room.images?.[0]?.image_url;

    return (
        <div style={{ minWidth: 200 }}>
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={room.title}
                    style={{
                        width: 'calc(100% + 40px)',
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0',
                        margin: '-14px -20px 8px -20px',
                    }}
                />
            )}
            <h4 style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>
                {room.title}
            </h4>
            <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                {[room.district, room.city].filter(Boolean).join(', ')}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0284C7', marginBottom: 8 }}>
                {formatPriceInMillions(Number(room.price_per_month))}tr/tháng
            </p>
            <button
                onClick={() => navigate(`/room/${room.id}`)}
                style={{
                    width: '100%',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: '#0284C7',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                Xem chi tiết
            </button>
        </div>
    );
}

export function RoomMap({
    rooms,
    className = '',
    singleRoom = false,
    interactive = true
}: RoomMapProps) {
    const roomsWithCoords = useMemo(
        () => rooms.filter(r => r.latitude != null && r.longitude != null),
        [rooms]
    );

    // Check if we have valid coordinates
    const hasValidCoords = roomsWithCoords.length > 0;

    // For single room mode, get the first room's coordinates
    const singleRoomData = singleRoom && roomsWithCoords.length > 0 ? roomsWithCoords[0] : null;

    const positions = useMemo(
        () => roomsWithCoords.map(r => [Number(r.latitude), Number(r.longitude)] as [number, number]),
        [roomsWithCoords]
    );

    // Determine center and zoom
    const center = singleRoomData
        ? [Number(singleRoomData.latitude), Number(singleRoomData.longitude)] as [number, number]
        : positions.length > 0
            ? positions[0]
            : DEFAULT_CENTER;

    const zoom = singleRoom ? SINGLE_ROOM_ZOOM : DEFAULT_ZOOM;
    const minHeight = singleRoom ? 300 : 500;

    // Show placeholder if no coordinates
    if (!hasValidCoords) {
        return (
            <div className={className}>
                <MapPlaceholder />
            </div>
        );
    }

    return (
        <div className={`rounded-2xl overflow-hidden border border-border ${className}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full"
                style={{ minHeight }}
                scrollWheelZoom={interactive}
                dragging={interactive}
                touchZoom={interactive}
                doubleClickZoom={interactive}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Only use FitBounds for multi-room search mode */}
                {!singleRoom && <FitBounds positions={positions} />}

                {roomsWithCoords.map((room) => (
                    <Marker
                        key={room.id}
                        position={[Number(room.latitude), Number(room.longitude)]}
                    >
                        <Popup minWidth={220} maxWidth={280}>
                            <RoomPopup room={room} />
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {roomsWithCoords.length < rooms.length && !singleRoom && (
                <div className="bg-muted/50 text-center py-2 text-xs text-muted-foreground">
                    Hiển thị {roomsWithCoords.length}/{rooms.length} phòng có tọa độ trên bản đồ
                </div>
            )}
        </div>
    );
}
