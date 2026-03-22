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
  selectedRoomId?: string | null;
  onSelectRoom?: (room: RoomWithDetails) => void;
  showPopup?: boolean;
  viewportMode?: 'fit-results' | 'selected-room';
  selectedZoom?: number;
}

function createMarkerMarkup(room: RoomWithDetails, isSelected: boolean) {
  const palette = isSelected
    ? "bg-[#8b5c24] text-white shadow-[0_12px_24px_rgba(139,92,36,0.28)] scale-105"
    : "bg-[#4f7df5] text-white shadow-[0_10px_20px_rgba(79,125,245,0.22)]";

  return `
    <div class="rounded-full border-2 border-white px-3 py-1 text-[11px] font-bold tracking-tight ${palette}">
      ${formatPriceInMillions(Number(room.price_per_month))}tr
    </div>
  `;
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
  selectedRoomId,
  onSelectRoom,
  showPopup = true,
  viewportMode = 'fit-results',
  selectedZoom = 13.2,
}: MapboxRoomMapProps) {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const onSelectRoomRef = useRef(onSelectRoom);
  const selectedRoomIdRef = useRef(selectedRoomId);
  const centerRef = useRef(center);
  const singleRoomRef = useRef(singleRoom);
  const viewportModeRef = useRef(viewportMode);
  const firstRoomWithCoordsRef = useRef<
    (RoomWithDetails & { latitude: number; longitude: number }) | null
  >(null);
  const selectedRoomWithCoordsRef = useRef<
    (RoomWithDetails & { latitude: number; longitude: number }) | null
  >(null);
  const selectedZoomRef = useRef(selectedZoom);
  const [internalSelectedRoom, setInternalSelectedRoom] = useState<RoomWithDetails | null>(null);

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
  const selectedRoom = useMemo(() => {
    if (selectedRoomId) {
      return rooms.find((room) => room.id === selectedRoomId) ?? null;
    }

    return internalSelectedRoom;
  }, [internalSelectedRoom, rooms, selectedRoomId]);
  const selectedRoomWithCoords = useMemo<
    (RoomWithDetails & { latitude: number; longitude: number }) | null
  >(
    () =>
      selectedRoom &&
      typeof selectedRoom.latitude === 'number' &&
      typeof selectedRoom.longitude === 'number'
        ? (selectedRoom as RoomWithDetails & { latitude: number; longitude: number })
        : null,
    [selectedRoom],
  );

  useEffect(() => {
    onSelectRoomRef.current = onSelectRoom;
  }, [onSelectRoom]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    centerRef.current = center;
    singleRoomRef.current = singleRoom;
    viewportModeRef.current = viewportMode;
    firstRoomWithCoordsRef.current = roomsWithCoords[0] ?? null;
    selectedRoomWithCoordsRef.current = selectedRoomWithCoords;
    selectedZoomRef.current = selectedZoom;
  }, [center, roomsWithCoords, selectedRoomWithCoords, selectedZoom, singleRoom, viewportMode]);

  useEffect(() => {
    if (!hasMapToken || !hasRoomsWithCoords || !mapContainer.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerElementsRef.current.clear();
      map.current?.remove();
      map.current = null;
      return;
    }

    if (map.current) {
      return;
    }

    const focusedSelectedRoom = selectedRoomWithCoordsRef.current;
    const focusedSelectedCenter = focusedSelectedRoom
      ? ([focusedSelectedRoom.longitude, focusedSelectedRoom.latitude] as [number, number])
      : null;
    const mapCenter =
      focusedSelectedCenter ||
      centerRef.current ||
      (singleRoomRef.current && firstRoomWithCoordsRef.current
        ? ([firstRoomWithCoordsRef.current.longitude, firstRoomWithCoordsRef.current.latitude] as [number, number])
        : DEFAULT_CENTER);

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const markerElements = markerElementsRef.current;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: mapCenter,
      zoom:
        singleRoomRef.current || viewportModeRef.current === 'selected-room'
          ? focusedSelectedRoom
            ? selectedZoomRef.current
            : DEFAULT_ZOOM
          : DEFAULT_ZOOM,
      interactive,
    });

    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerElements.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [hasMapToken, hasRoomsWithCoords, interactive]);

  useEffect(() => {
    if (!map.current) {
      return;
    }

    const sourceId = 'radius';
    const layerId = 'radius-circle';
    const mapInstance = map.current;

    const updateRadiusLayer = () => {
      if (!showRadius || !center) {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
        if (mapInstance.getSource(sourceId)) {
          mapInstance.removeSource(sourceId);
        }
        return;
      }

      const radiusData = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: center,
        },
        properties: {},
      };

      const source = mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData(radiusData);
      } else {
        mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: radiusData,
        });
      }

      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
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
      } else {
        mapInstance.setPaintProperty(layerId, 'circle-radius', {
          stops: [
            [0, 0],
            [20, radiusKm * 1000],
          ],
          base: 2,
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      updateRadiusLayer();
      return;
    }

    mapInstance.once('load', updateRadiusLayer);
    return () => {
      mapInstance.off('load', updateRadiusLayer);
    };
  }, [center, radiusKm, showRadius]);

  useEffect(() => {
    if (!map.current) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    markerElementsRef.current.clear();

    roomsWithCoords.forEach((room) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'cursor-pointer transition-transform';
      markerElement.innerHTML = createMarkerMarkup(room, room.id === selectedRoomIdRef.current);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([room.longitude, room.latitude])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        setInternalSelectedRoom(room);
        onSelectRoomRef.current?.(room);
      });

      markersRef.current.push(marker);
      markerElementsRef.current.set(room.id, markerElement);
    });
  }, [roomsWithCoords]);

  useEffect(() => {
    markerElementsRef.current.forEach((element, roomId) => {
      const room = rooms.find((entry) => entry.id === roomId);
      if (!room) {
        return;
      }

      element.innerHTML = createMarkerMarkup(room, roomId === selectedRoom?.id);
    });
  }, [rooms, selectedRoom]);

  useEffect(() => {
    if (!map.current || singleRoom || viewportMode !== 'selected-room') {
      return;
    }

    if (selectedRoomWithCoords) {
      map.current.easeTo({
        center: [selectedRoomWithCoords.longitude, selectedRoomWithCoords.latitude],
        zoom: selectedZoom,
        duration: 700,
        essential: true,
      });
      return;
    }

    if (center) {
      map.current.easeTo({
        center,
        zoom: DEFAULT_ZOOM,
        duration: 700,
        essential: true,
      });
    }
  }, [center, selectedRoomWithCoords, selectedZoom, singleRoom, viewportMode]);

  useEffect(() => {
    if (!map.current || !singleRoom || roomsWithCoords.length === 0) {
      return;
    }

    const [room] = roomsWithCoords;
    map.current.easeTo({
      center: [room.longitude, room.latitude],
      zoom: selectedZoom,
      duration: 700,
      essential: true,
    });
  }, [roomsWithCoords, selectedZoom, singleRoom]);

  useEffect(() => {
    if (!map.current || singleRoom || viewportMode !== 'fit-results' || roomsWithCoords.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    roomsWithCoords.forEach((room) => {
      bounds.extend([room.longitude, room.latitude]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      duration: 700,
      essential: true,
    });
  }, [roomsWithCoords, singleRoom, viewportMode]);

  if (!hasMapToken) {
    return <TokenError />;
  }

  if (!hasRoomsWithCoords) {
    return <MapPlaceholder />;
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
      <div ref={mapContainer} className="h-full min-h-[300px] w-full" />

      {selectedRoom && showPopup && (
        <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-xl bg-white p-4 shadow-lg">
          <button
            onClick={() => setInternalSelectedRoom(null)}
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
