import { supabase } from '@/lib/supabase';

export type AdminLocationStatus = 'active' | 'inactive';
export type AdminLocationType =
  | 'university'
  | 'district'
  | 'neighborhood'
  | 'poi'
  | 'campus'
  | 'station'
  | 'landmark';

export interface AdminLocation {
  id: string;
  name: string;
  normalized_name: string;
  location_type: AdminLocationType;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  source_name: string | null;
  source_url: string | null;
  source_domain: string | null;
  external_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  status: AdminLocationStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminLocationUpdateDraft {
  name: string;
  location_type: AdminLocationType;
  city: string;
  district: string;
  address: string;
  latitude: string;
  longitude: string;
  source_name: string;
  source_url: string;
  tags: string;
  status: AdminLocationStatus;
}

type AdminLocationsClient = typeof supabase & {
  from: (relation: 'location_catalog') => {
    select: (columns: string) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: unknown | null; error: { message: string } | null }>;
      };
    };
    update: (
      values: Record<string, unknown>,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
};

const adminLocationsClient = supabase as unknown as AdminLocationsClient;

function toNullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeLocationCatalogName(value: string): string {
  return value
    .replace(/[Đđ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseLocationTags(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildAdminLocationUpdateInput(draft: AdminLocationUpdateDraft) {
  return {
    name: draft.name.trim(),
    normalized_name: normalizeLocationCatalogName(draft.name),
    location_type: draft.location_type,
    city: toNullableText(draft.city),
    district: toNullableText(draft.district),
    address: toNullableText(draft.address),
    latitude: toNullableNumber(draft.latitude),
    longitude: toNullableNumber(draft.longitude),
    source_name: toNullableText(draft.source_name),
    source_url: toNullableText(draft.source_url),
    tags: parseLocationTags(draft.tags),
    status: draft.status,
  };
}

export async function getAdminLocations(): Promise<AdminLocation[]> {
  const { data, error } = await adminLocationsClient
    .from('location_catalog')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminLocation[];
}

export async function updateAdminLocation(id: string, draft: AdminLocationUpdateDraft): Promise<void> {
  const payload = buildAdminLocationUpdateInput(draft);

  const { error } = await adminLocationsClient
    .from('location_catalog')
    .update(payload)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleAdminLocationStatus(id: string, nextStatus: AdminLocationStatus): Promise<void> {
  const { error } = await adminLocationsClient
    .from('location_catalog')
    .update({ status: nextStatus })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
