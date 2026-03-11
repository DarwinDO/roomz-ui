import { supabase } from '@/lib/supabase';
import { getAnalyticsSessionId } from '@/lib/analyticsSession';
import {
  trackEvent,
  trackRoomView,
  trackSearch,
  type AnalyticsEventName,
} from '@roomz/shared/services/analytics';

type SearchAnalyticsPayload = {
  query: string;
  resultCount: number;
  filters: Record<string, unknown>;
};

type LocationSelectionPayload = {
  source: 'mapbox' | 'catalog';
  label: string;
  address: string;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationCatalogId?: string;
};

function getSessionId() {
  return getAnalyticsSessionId();
}

export async function trackSearchPerformed(userId: string | null, payload: SearchAnalyticsPayload) {
  await trackSearch(supabase, userId, getSessionId(), payload.query, payload.filters, payload.resultCount);
}

export async function trackRoomViewed(
  userId: string | null,
  roomId: string,
  roomTitle: string,
  price: number,
) {
  await trackRoomView(supabase, userId, getSessionId(), roomId, roomTitle, price);
}

export async function trackFeatureEvent(
  eventName: AnalyticsEventName,
  userId: string | null,
  properties: Record<string, unknown> = {},
) {
  await trackEvent(supabase, {
    event_name: eventName,
    user_id: userId,
    session_id: getSessionId(),
    properties,
  });
}

export async function trackLocationSelected(userId: string | null, payload: LocationSelectionPayload) {
  await trackFeatureEvent('location_selected', userId, {
    source: payload.source,
    label: payload.label,
    address: payload.address,
    city: payload.city ?? null,
    district: payload.district ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    location_catalog_id: payload.locationCatalogId ?? null,
  });
}
