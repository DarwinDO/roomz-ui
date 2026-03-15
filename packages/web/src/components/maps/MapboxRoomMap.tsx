import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { RoomWithDetails } from '@/services/rooms';
import { formatPriceInMillions } from '@roomz/shared/utils/format';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 12;
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

function MapPlaceholder() {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-muted/30">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MapPin className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Chưa có dữ liệu bản đồ chính xác</p>
    </div>
  );
}

function TokenError() {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-muted/30 p-4">
      <p className="mb-2 font-medium text-destructive">Mapbox chưa được cấu hình</p>
      <p className="text-center text-sm text-muted-foreground">
        Vui lòng cấu hình `VITE_MAPBOX_ACCESS_TOKEN` cho môi trường hiện tại
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

  const roomsWithCoords = useMemo(
    () =>
      rooms.filter(
        (room): room is RoomWithDetails & { latitude: number; longitude: number } =>
          typeof room.latitude === 'number' && typeof room.longitude === 'number',
      ),
    [rooms],
  );

  const hasMapToken = Boolean(MAPBOX_TOKEN);
  const hasRoomsWithCoords = roomsWithCoords.length > 0;

  useEffect(() => {
    if (!hasMapToken || !hasRoomsWithCoords || !mapContainer.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
      return;
    }

    const mapCenter =
      center ||
      (singleRoom
        ? ([roomsWithCoords[0].longitude, roomsWithCoords[0].latitude] as [number, number])
        : DEFAULT_CENTER);

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom: singleRoom ? 15 : DEFAULT_ZOOM,
      interactive,
    });

    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    if (!singleRoom) {
      const bounds = new mapboxgl.LngLatBounds();
      roomsWithCoords.forEach((room) => {
        bounds.extend([room.longitude, room.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    roomsWithCoords.forEach((room) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'cursor-pointer';
      markerElement.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0284C7" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `;

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([room.longitude, room.latitude])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        setSelectedRoom(room);
      });

      markersRef.current.push(marker);
    });

    if (showRadius && center) {
      map.current.on('load', () => {
        if (!map.current || map.current.getSource('radius')) {
          return;
        }

        map.current.addSource('radius', {
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

        map.current.addLayer({
          id: 'radius-circle',
          type: 'circle',
          source: 'radius',
          paint: {
            'circle-radius': {
              stops: [
                [0, 0],
                [20, radiusKm * 1000],
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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [center, hasMapToken, hasRoomsWithCoords, interactive, radiusKm, roomsWithCoords, showRadius, singleRoom]);

  if (!hasMapToken) {
    return <TokenError />;
  }

  if (!hasRoomsWithCoords) {
    return <MapPlaceholder />;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
      <div ref={mapContainer} className="h-full min-h-[300px] w-full" />

      {selectedRoom && (
        <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-xl bg-white p-4 shadow-lg">
          <button
            onClick={() => setSelectedRoom(null)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
          {selectedRoom.images?.[0]?.image_url && (
            <img
              src={selectedRoom.images[0].image_url}
              alt={selectedRoom.title}
              className="mb-2 h-24 w-full rounded-lg object-cover"
            />
          )}
          <h4 className="mb-1 pr-4 text-sm font-semibold">{selectedRoom.title}</h4>
          <p className="mb-1 text-xs text-gray-500">
            {[selectedRoom.district, selectedRoom.city].filter(Boolean).join(', ')}
          </p>
          <p className="mb-2 text-sm font-bold text-sky-600">
            {formatPriceInMillions(Number(selectedRoom.price_per_month))}tr/tháng
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/room/${selectedRoom.id}`)}
              className="flex-1 rounded-lg bg-sky-600 py-2 text-xs text-white hover:bg-sky-700"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => {
                const destination = `${selectedRoom.latitude},${selectedRoom.longitude}`;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs hover:bg-gray-50"
            >
              Chỉ đường
            </button>
          </div>
        </div>
      )}

      {rooms.length > 0 && roomsWithCoords.length < rooms.length && !singleRoom && (
        <div className="absolute bottom-0 left-0 right-0 bg-muted/50 py-2 text-center text-xs text-muted-foreground">
          Hiển thị {roomsWithCoords.length}/{rooms.length} phòng có tọa độ
        </div>
      )}
    </div>
  );
}
