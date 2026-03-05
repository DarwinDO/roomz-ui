/**
 * ShopMiniMapbox - Mini Mapbox map for ShopDetailModal
 * Replaces ShopMiniMap (OpenStreetMap) with Mapbox GL JS
 * 
 * Features:
 * - Clean Mapbox streets style
 * - Custom marker for partner location
 * - Optional user position marker
 * - Connecting line between user and partner
 * - Compact size for modal display
 */
import { useEffect, useRef, useMemo } from 'react';
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

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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

/** Token check fallback */
function TokenError() {
    return (
        <div
            className="flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border"
            style={{ height: MAP_HEIGHT }}
        >
            <p className="text-destructive font-medium text-sm mb-1">Mapbox chưa được cấu hình</p>
            <p className="text-muted-foreground text-xs text-center px-4">
                Vui lòng thêm VITE_MAPBOX_ACCESS_TOKEN vào file .env
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

    // Check token
    if (!MAPBOX_TOKEN) {
        return <TokenError />;
    }

    useEffect(() => {
        if (!mapContainer.current) return;

        const partnerPosition: [number, number] = [longitude, latitude];
        const userPos: [number, number] | null = userPosition
            ? [userPosition.lng, userPosition.lat]
            : null;

        // Calculate zoom to fit both markers if user position exists
        const zoom = userPos ? 14 : DEFAULT_ZOOM;

        // Initialize map
        mapboxgl.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: partnerPosition,
            zoom: zoom,
            interactive: false, // Disable interactions for mini map
            attributionControl: false, // Hide attribution for cleaner look
        });

        // Add small attribution in corner
        map.current.addControl(new mapboxgl.AttributionControl({
            compact: true
        }), 'bottom-right');

        // Wait for map to load before adding markers
        map.current.on('load', () => {
            if (!map.current) return;

            // Add partner marker with custom element
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
                    `)
                )
                .addTo(map.current);

            markersRef.current.push(partnerMarker);

            // Add user marker if available (blue color)
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
                        `)
                    )
                    .addTo(map.current);

                markersRef.current.push(userMarker);

                // Add connecting line between user and partner
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

                // Fit bounds to show both markers
                const bounds = new mapboxgl.LngLatBounds();
                bounds.extend(userPos);
                bounds.extend(partnerPosition);
                map.current.fitBounds(bounds, {
                    padding: { top: 40, bottom: 40, left: 40, right: 40 },
                    maxZoom: 16
                });
            }
        });

        return () => {
            // Cleanup
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            map.current?.remove();
        };
    }, [latitude, longitude, partnerName, category, userPosition]);

    return (
        <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ height: MAP_HEIGHT }}
        >
            <div ref={mapContainer} className="w-full h-full" />
        </div>
    );
}
