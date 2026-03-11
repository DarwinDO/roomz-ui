import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';

interface ShopMiniMapboxProps {
  latitude: number;
  longitude: number;
  partnerName: string;
  category?: string;
  userPosition?: GeoPosition | null;
}

const MAP_HEIGHT = 200;
const DEFAULT_ZOOM = 15;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function MapErrorFallback() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30"
      style={{ height: MAP_HEIGHT }}
    >
      <MapPin className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Chưa có tọa độ</p>
    </div>
  );
}

function TokenError() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted/30"
      style={{ height: MAP_HEIGHT }}
    >
      <p className="mb-1 text-sm font-medium text-destructive">Mapbox chưa được cấu hình</p>
      <p className="px-4 text-center text-xs text-muted-foreground">
        Vui lòng thêm `VITE_MAPBOX_ACCESS_TOKEN` vào file `.env`
      </p>
    </div>
  );
}

export function ShopMiniMapbox({
  latitude,
  longitude,
  partnerName,
  category,
  userPosition,
}: ShopMiniMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const isValidCoords = useMemo(
    () =>
      latitude !== null &&
      longitude !== null &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180,
    [latitude, longitude],
  );

  const hasMapToken = Boolean(MAPBOX_TOKEN);

  useEffect(() => {
    if (!hasMapToken || !isValidCoords || !mapContainer.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
      return;
    }

    const partnerPosition: [number, number] = [longitude, latitude];
    const userPos: [number, number] | null = userPosition ? [userPosition.lng, userPosition.lat] : null;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: partnerPosition,
      zoom: userPos ? 14 : DEFAULT_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;

      const partnerEl = document.createElement('div');
      partnerEl.className = 'cursor-pointer';
      partnerEl.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0284C7" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `;

      const partnerMarker = new mapboxgl.Marker(partnerEl)
        .setLngLat(partnerPosition)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; min-width: 140px;">
              <h4 style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #111827;">
                ${partnerName}
              </h4>
              ${category ? `<p style="font-size: 11px; color: #6B7280; text-transform: capitalize; margin: 0;">${category}</p>` : ''}
            </div>
          `),
        )
        .addTo(map.current);

      markersRef.current.push(partnerMarker);

      if (userPos) {
        const userEl = document.createElement('div');
        userEl.className = 'cursor-pointer';
        userEl.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `;

        const userMarker = new mapboxgl.Marker(userEl)
          .setLngLat(userPos)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <p style="font-weight: 600; font-size: 12px; color: #111827; margin: 0;">Vị trí của bạn</p>
              </div>
            `),
          )
          .addTo(map.current);

        markersRef.current.push(userMarker);

        map.current.addSource('connection', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [userPos, partnerPosition],
            },
            properties: {},
          },
        });

        map.current.addLayer({
          id: 'connection-line',
          type: 'line',
          source: 'connection',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': '#0284C7',
            'line-width': 2,
            'line-opacity': 0.6,
            'line-dasharray': [2, 2],
          },
        });

        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(userPos);
        bounds.extend(partnerPosition);
        map.current.fitBounds(bounds, {
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          maxZoom: 16,
        });
      }
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [category, hasMapToken, isValidCoords, latitude, longitude, partnerName, userPosition]);

  if (!isValidCoords) {
    return <MapErrorFallback />;
  }

  if (!hasMapToken) {
    return <TokenError />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border" style={{ height: MAP_HEIGHT }}>
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
