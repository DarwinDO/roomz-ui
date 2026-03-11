import { supabase } from '@/lib/supabase';

export type CrawlEntityType = 'partner' | 'location';
export type CrawlJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';

export type PartnerCrawlReviewStatus =
  | 'pending'
  | 'ready'
  | 'duplicate_partner'
  | 'duplicate_lead'
  | 'imported'
  | 'rejected'
  | 'error';

export type LocationCrawlReviewStatus =
  | 'pending'
  | 'ready'
  | 'duplicate_location'
  | 'imported'
  | 'rejected'
  | 'error';

export interface CrawlSource {
  id: string;
  entity_type: CrawlEntityType;
  provider: 'firecrawl';
  name: string;
  source_url: string;
  source_domain: string | null;
  description: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  last_run_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrawlJob {
  id: string;
  source_id: string | null;
  entity_type: CrawlEntityType;
  provider: 'firecrawl' | 'admin_upload';
  trigger_type: 'source_run' | 'file_upload';
  status: CrawlJobStatus;
  source_name: string;
  source_url: string | null;
  provider_job_id: string | null;
  file_name: string | null;
  total_count: number;
  inserted_count: number;
  ready_count: number;
  duplicate_count: number;
  error_count: number;
  skipped_count: number;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  log: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PartnerCrawlReviewItem {
  id: string;
  source_type: string;
  source_name: string;
  source_url: string | null;
  source_domain: string | null;
  external_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  service_area: string | null;
  service_category: string | null;
  address: string | null;
  website: string | null;
  crawl_confidence: number | null;
  review_status: PartnerCrawlReviewStatus;
  import_error: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  matched_partner_id: string | null;
  matched_partner_lead_id: string | null;
  imported_partner_lead_id: string | null;
  matched_partner_name: string | null;
  matched_partner_lead_name: string | null;
}

export interface LocationCrawlReviewItem {
  id: string;
  source_type: string;
  source_name: string;
  source_url: string | null;
  source_domain: string | null;
  external_id: string | null;
  location_name: string | null;
  normalized_name: string | null;
  location_type: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  notes: string | null;
  crawl_confidence: number | null;
  review_status: LocationCrawlReviewStatus;
  import_error: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  matched_location_id: string | null;
  imported_location_id: string | null;
  matched_location_name: string | null;
}

export interface CrawlFunctionResult {
  jobId: string;
  status: CrawlJobStatus | 'running';
  providerJobId?: string;
  firecrawlStatus?: string;
  error?: string;
  summary?: {
    totalCount: number;
    insertedCount: number;
    readyCount: number;
    duplicateCount: number;
    errorCount: number;
    skippedCount: number;
    sampleIds: string[];
  };
}

export interface CreateCrawlSourceInput {
  entityType: CrawlEntityType;
  name: string;
  sourceUrl: string;
  description?: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateCrawlSourceInput {
  name?: string;
  sourceUrl?: string;
  description?: string | null;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export interface UploadCrawlRecordsInput {
  entityType: CrawlEntityType;
  sourceName: string;
  sourceUrl?: string;
  fileName?: string;
  records: unknown[];
}

type CrawlReviewStatus = PartnerCrawlReviewStatus | LocationCrawlReviewStatus;
type LocationCatalogType =
  | 'university'
  | 'district'
  | 'neighborhood'
  | 'poi'
  | 'campus'
  | 'station'
  | 'landmark';

interface PartnerUploadRow {
  source_type: 'admin_import';
  source_name: string;
  source_url?: string;
  source_domain?: string;
  external_id?: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  service_area?: string;
  service_category?: string;
  address?: string;
  website?: string;
  notes?: string;
  crawl_confidence?: number;
  dedupe_key?: string;
  normalized_payload: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
}

interface LocationUploadRow {
  source_type: 'admin_import';
  source_name: string;
  source_url?: string;
  source_domain?: string;
  external_id?: string;
  location_name?: string;
  normalized_name?: string;
  location_type?: LocationCatalogType;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  notes?: string;
  crawl_confidence?: number;
  dedupe_key?: string;
  normalized_payload: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
}

type QueryError = { message: string } | null;

type SelectManyResponse<T> = Promise<{ data: T[] | null; error: QueryError }>;
type SelectSingleResponse<T> = Promise<{ data: T | null; error: QueryError }>;
type MutationResponse = Promise<{ error: QueryError }>;

type TableApi = {
  select: (columns: string) => {
    order: (column: string, options: { ascending: boolean }) => SelectManyResponse<unknown>;
    eq: (column: string, value: string | boolean) => {
      maybeSingle: () => SelectSingleResponse<unknown>;
      single: () => SelectSingleResponse<unknown>;
      order: (sortColumn: string, options: { ascending: boolean }) => SelectManyResponse<unknown>;
      limit: (count: number) => SelectManyResponse<unknown>;
    };
    limit: (count: number) => { order: (column: string, options: { ascending: boolean }) => SelectManyResponse<unknown> };
  };
  insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => {
    select: (columns?: string) => { single: () => SelectSingleResponse<unknown> };
  };
  update: (payload: Record<string, unknown>) => {
    eq: (column: string, value: string) => MutationResponse;
  };
  delete: () => {
    eq: (column: string, value: string) => MutationResponse;
  };
};

type IngestionReviewClient = typeof supabase & {
  from: (relation: string) => TableApi;
  rpc: typeof supabase.rpc;
  auth: typeof supabase.auth;
  functions: typeof supabase.functions;
};

const client = supabase as unknown as IngestionReviewClient;
const LOCATION_TYPES = new Set<LocationCatalogType>([
  'university',
  'district',
  'neighborhood',
  'poi',
  'campus',
  'station',
  'landmark',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeWhitespace(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/,+$/g, '')
    .trim();
}

function firstDefined(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && normalizeWhitespace(value) !== '') {
      return value;
    }
  }

  return undefined;
}

function sanitizeEmail(value: unknown) {
  const normalized = normalizeWhitespace(value).toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return undefined;
  }

  return normalized;
}

function sanitizePhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 8) {
    return undefined;
  }

  return digits;
}

function sanitizeUrl(value: unknown) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    try {
      return new URL(`https://${normalized}`).toString();
    } catch {
      return undefined;
    }
  }
}

export function normalizeCrawlSourceUrl(value: unknown) {
  return sanitizeUrl(value);
}

function extractDomain(url?: string) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return undefined;
  }
}

function parseCoordinate(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue;
}

function normalizeLocationName(value: unknown) {
  return normalizeWhitespace(value).toLowerCase() || undefined;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((tag) => normalizeWhitespace(String(tag)))
    .filter(Boolean);
}

function inferLocationType(record: Record<string, unknown>) {
  const raw = normalizeWhitespace(firstDefined(
    record.location_type,
    record.locationType,
    record.type,
    record.category,
    record.kind,
  )).toLowerCase();

  if (!raw) {
    return undefined;
  }

  if (LOCATION_TYPES.has(raw as LocationCatalogType)) {
    return raw as LocationCatalogType;
  }

  const aliases = new Map<string, LocationCatalogType>([
    ['school', 'university'],
    ['college', 'university'],
    ['uni', 'university'],
    ['ward', 'neighborhood'],
    ['area', 'neighborhood'],
    ['place', 'poi'],
    ['point_of_interest', 'poi'],
    ['bus_station', 'station'],
    ['metro_station', 'station'],
  ]);

  return aliases.get(raw);
}

function inferUploadRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    return record.items;
  }
  if (Array.isArray(record.data)) {
    return record.data;
  }
  if (Array.isArray(record.results)) {
    return record.results;
  }
  return [];
}

export function extractUploadRecords(payload: unknown) {
  return inferUploadRecords(payload);
}

export function buildCrawlFunctionErrorMessage(rawMessage: string) {
  if (/invalid jwt/i.test(rawMessage)) {
    return `${rawMessage}. Edge Function crawl-ingestion phải được deploy với verify_jwt = false.`;
  }

  return rawMessage;
}

export function normalizePartnerUploadRecord(
  payload: Record<string, unknown>,
  sourceName: string,
  sourceUrl?: string,
): PartnerUploadRow {
  const metadata = asRecord(payload.metadata) ?? {};
  const canonicalSourceUrl = sanitizeUrl(firstDefined(
    sourceUrl,
    payload.source_url,
    payload.sourceUrl,
    payload.url,
    metadata.sourceURL,
    metadata.url,
    payload.website,
  ));
  const website = sanitizeUrl(firstDefined(payload.website, payload.website_url, payload.site, canonicalSourceUrl));
  const email = sanitizeEmail(firstDefined(payload.email, payload.contact_email, payload.contactEmail));
  const phone = sanitizePhone(firstDefined(payload.phone, payload.contact_phone, payload.contactPhone, payload.hotline));
  const companyName = normalizeWhitespace(firstDefined(
    payload.company_name,
    payload.companyName,
    payload.business_name,
    payload.businessName,
    payload.name,
    payload.title,
  ));
  const contactName = normalizeWhitespace(firstDefined(
    payload.contact_name,
    payload.contactName,
    payload.owner_name,
    payload.ownerName,
    payload.contact,
  ));
  const serviceArea = normalizeWhitespace(firstDefined(
    payload.service_area,
    payload.serviceArea,
    payload.city,
    payload.area,
    payload.location,
    payload.address,
  ));
  const address = normalizeWhitespace(firstDefined(payload.address, payload.full_address, payload.fullAddress));
  const serviceCategory = normalizeWhitespace(firstDefined(
    payload.service_category,
    payload.serviceCategory,
    payload.category,
    payload.service_type,
    payload.serviceType,
  ));
  const notes = normalizeWhitespace(firstDefined(
    payload.notes,
    payload.description,
    payload.summary,
    payload.snippet,
  ));
  const crawlConfidenceValue = Number(firstDefined(
    payload.crawl_confidence,
    payload.crawlConfidence,
    payload.confidence,
    payload.score,
    metadata.confidence,
  ));
  const crawlConfidence = Number.isFinite(crawlConfidenceValue)
    ? Math.max(0, Math.min(100, crawlConfidenceValue))
    : undefined;
  const externalId = normalizeWhitespace(firstDefined(payload.external_id, payload.externalId, payload.id));
  const sourceDomain = extractDomain(canonicalSourceUrl ?? website);
  const dedupeKey = email
    ? `email:${email}`
    : phone
      ? `phone:${phone}`
      : companyName
        ? `company:${companyName.toLowerCase()}|domain:${sourceDomain ?? 'unknown'}`
        : undefined;

  return {
    source_type: 'admin_import',
    source_name: sourceName,
    source_url: canonicalSourceUrl,
    source_domain: sourceDomain,
    external_id: externalId || undefined,
    company_name: companyName || undefined,
    contact_name: contactName || undefined,
    email,
    phone,
    service_area: serviceArea || undefined,
    service_category: serviceCategory || undefined,
    address: address || undefined,
    website,
    notes: notes || undefined,
    crawl_confidence: crawlConfidence,
    dedupe_key: dedupeKey,
    normalized_payload: {
      company_name: companyName || null,
      contact_name: contactName || null,
      email: email ?? null,
      phone: phone ?? null,
      service_area: serviceArea || null,
      service_category: serviceCategory || null,
      address: address || null,
      website: website ?? null,
      notes: notes || null,
      source_url: canonicalSourceUrl ?? null,
      source_domain: sourceDomain ?? null,
      external_id: externalId || null,
      crawl_confidence: crawlConfidence ?? null,
    },
    raw_payload: payload,
  };
}

export function normalizeLocationUploadRecord(
  payload: Record<string, unknown>,
  sourceName: string,
  sourceUrl?: string,
): LocationUploadRow {
  const metadata = asRecord(payload.metadata) ?? {};
  const coordinates = asRecord(payload.coordinates) ?? {};
  const location = asRecord(payload.location) ?? {};
  const canonicalSourceUrl = sanitizeUrl(firstDefined(
    sourceUrl,
    payload.source_url,
    payload.sourceUrl,
    payload.url,
    metadata.sourceURL,
    metadata.url,
    payload.website,
  ));
  const locationName = normalizeWhitespace(firstDefined(
    payload.location_name,
    payload.locationName,
    payload.name,
    payload.title,
  ));
  const locationType = inferLocationType(payload);
  const city = normalizeWhitespace(firstDefined(payload.city, payload.province, payload.region));
  const district = normalizeWhitespace(firstDefined(payload.district, payload.area));
  const address = normalizeWhitespace(firstDefined(payload.address, payload.full_address, payload.fullAddress));
  const latitude = parseCoordinate(firstDefined(payload.latitude, payload.lat, coordinates.lat, location.lat));
  const longitude = parseCoordinate(firstDefined(payload.longitude, payload.lng, payload.lon, coordinates.lng, location.lng));
  const notes = normalizeWhitespace(firstDefined(payload.notes, payload.description, payload.summary, payload.snippet));
  const crawlConfidenceValue = Number(firstDefined(
    payload.crawl_confidence,
    payload.crawlConfidence,
    payload.confidence,
    payload.score,
    metadata.confidence,
  ));
  const crawlConfidence = Number.isFinite(crawlConfidenceValue)
    ? Math.max(0, Math.min(100, crawlConfidenceValue))
    : undefined;
  const externalId = normalizeWhitespace(firstDefined(payload.external_id, payload.externalId, payload.id));
  const sourceDomain = extractDomain(canonicalSourceUrl);
  const normalizedName = normalizeLocationName(locationName);
  const tags = normalizeTags(firstDefined(payload.tags, payload.labels, metadata.tags));
  const dedupeKey = normalizedName
    ? `${locationType ?? 'unknown'}|${normalizedName}|${city.toLowerCase()}|${district.toLowerCase()}`
    : undefined;

  return {
    source_type: 'admin_import',
    source_name: sourceName,
    source_url: canonicalSourceUrl,
    source_domain: sourceDomain,
    external_id: externalId || undefined,
    location_name: locationName || undefined,
    normalized_name: normalizedName,
    location_type: locationType,
    city: city || undefined,
    district: district || undefined,
    address: address || undefined,
    latitude,
    longitude,
    tags,
    notes: notes || undefined,
    crawl_confidence: crawlConfidence,
    dedupe_key: dedupeKey,
    normalized_payload: {
      location_name: locationName || null,
      location_type: locationType ?? null,
      city: city || null,
      district: district || null,
      address: address || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      tags,
      source_url: canonicalSourceUrl ?? null,
      source_domain: sourceDomain ?? null,
      external_id: externalId || null,
      crawl_confidence: crawlConfidence ?? null,
    },
    raw_payload: payload,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

async function invokeCrawlFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const invoke = async (functionName: 'crawl-ingestion' | 'ai-chatbot') => client.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let response = await invoke('crawl-ingestion');
  if (response.error) {
    const context = (response.error as { context?: Response }).context;
    const payload = context
      ? await context.clone().json().catch(() => null) as
        | { error?: string; message?: string; code?: string | number; details?: string | null }
        | null
      : null;
    const rawMessage = payload?.error || payload?.message || response.error.message || '';
    if (/invalid jwt/i.test(rawMessage)) {
      response = await invoke('ai-chatbot');
    }
  }

  const { data, error } = response;
  if (error) {
    const context = (error as { context?: Response }).context;
    let detailedMessage: string | null = null;

    if (context) {
      const payload = await context.clone().json().catch(() => null) as
        | { error?: string; message?: string; code?: string | number; details?: string | null }
        | null;
      const serverMessage = payload?.error || payload?.message;
      if (serverMessage) {
        detailedMessage = payload.code ? `${serverMessage} (${payload.code})` : serverMessage;
        if (payload.details) {
          detailedMessage = `${detailedMessage}: ${payload.details}`;
        }
      }
    }

    throw new Error(buildCrawlFunctionErrorMessage(detailedMessage || error.message || 'Không thể thực thi crawl function'));
  }

  return data as T;
}

export async function getPartnerCrawlReviewQueue(): Promise<PartnerCrawlReviewItem[]> {
  const { data, error } = await client
    .from('partner_crawl_review_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Không thể tải hàng đợi crawl đối tác: ${error.message}`);
  }

  return (data ?? []) as PartnerCrawlReviewItem[];
}

export async function getLocationCrawlReviewQueue(): Promise<LocationCrawlReviewItem[]> {
  const { data, error } = await client
    .from('location_crawl_review_queue')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Không thể tải hàng đợi crawl location: ${error.message}`);
  }

  return (data ?? []) as LocationCrawlReviewItem[];
}

export async function getCrawlSources(entityType?: CrawlEntityType): Promise<CrawlSource[]> {
  const response = entityType
    ? await client
      .from('crawl_sources')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
    : await client
      .from('crawl_sources')
      .select('*')
      .order('created_at', { ascending: false });

  const { data, error } = response;
  if (error) {
    throw new Error(`Không thể tải nguồn crawl: ${error.message}`);
  }

  return (data ?? []) as CrawlSource[];
}

export async function createCrawlSource(input: CreateCrawlSourceInput): Promise<CrawlSource> {
  const userId = await getCurrentUserId();
  const sourceUrl = normalizeCrawlSourceUrl(input.sourceUrl);
  if (!sourceUrl) {
    throw new Error('Source URL là bắt buộc và phải hợp lệ');
  }
  const { data, error } = await client
    .from('crawl_sources')
    .insert({
      entity_type: input.entityType,
      provider: 'firecrawl',
      name: normalizeWhitespace(input.name),
      source_url: sourceUrl,
      source_domain: (() => {
        try {
          return new URL(sourceUrl).hostname.replace(/^www\./, '').toLowerCase();
        } catch {
          return null;
        }
      })(),
      description: normalizeWhitespace(input.description) || null,
      is_active: input.isActive ?? true,
      config: input.config ?? {},
      created_by: userId,
      updated_by: userId,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Không thể tạo nguồn crawl: ${error?.message ?? 'Unknown error'}`);
  }

  return data as CrawlSource;
}

export async function updateCrawlSource(id: string, input: UpdateCrawlSourceInput): Promise<void> {
  const userId = await getCurrentUserId();
  const sourceUrl = input.sourceUrl !== undefined
    ? normalizeCrawlSourceUrl(input.sourceUrl)
    : undefined;
  if (input.sourceUrl !== undefined && !sourceUrl) {
    throw new Error('Source URL là bắt buộc và phải hợp lệ');
  }
  const sourceDomain = sourceUrl
    ? (() => {
      try {
        return new URL(sourceUrl).hostname.replace(/^www\./, '').toLowerCase();
      } catch {
        return null;
      }
    })()
    : undefined;

  const { error } = await client
    .from('crawl_sources')
    .update({
      ...(input.name !== undefined ? { name: normalizeWhitespace(input.name) } : {}),
      ...(sourceUrl !== undefined ? { source_url: sourceUrl, source_domain: sourceDomain } : {}),
      ...(input.description !== undefined ? { description: normalizeWhitespace(input.description) || null } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Không thể cập nhật nguồn crawl: ${error.message}`);
  }
}

export async function deleteCrawlSource(id: string): Promise<void> {
  const { error } = await client.from('crawl_sources').delete().eq('id', id);
  if (error) {
    throw new Error(`Không thể xóa nguồn crawl: ${error.message}`);
  }
}

export async function getCrawlJobs(entityType?: CrawlEntityType): Promise<CrawlJob[]> {
  const response = entityType
    ? await client
      .from('crawl_jobs')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
    : await client
      .from('crawl_jobs')
      .select('*')
      .order('created_at', { ascending: false });

  const { data, error } = response;
  if (error) {
    throw new Error(`Không thể tải crawl jobs: ${error.message}`);
  }

  return (data ?? []) as CrawlJob[];
}

export async function refreshPartnerCrawlClassification(id: string): Promise<void> {
  const { error } = await client.rpc('classify_partner_crawl_ingestion' as never, {
    p_ingestion_id: id,
  } as never);

  if (error) {
    throw new Error(`Không thể phân loại lại crawl đối tác: ${error.message}`);
  }
}

export async function refreshLocationCrawlClassification(id: string): Promise<void> {
  const { error } = await client.rpc('classify_location_crawl_ingestion' as never, {
    p_ingestion_id: id,
  } as never);

  if (error) {
    throw new Error(`Không thể phân loại lại crawl location: ${error.message}`);
  }
}

export async function promotePartnerCrawlIngestion(id: string): Promise<string> {
  const { data, error } = await client.rpc('promote_partner_crawl_ingestion' as never, {
    p_ingestion_id: id,
  } as never);

  if (error) {
    throw new Error(`Không thể promote crawl đối tác: ${error.message}`);
  }

  return String(data);
}

export async function promoteLocationCrawlIngestion(id: string): Promise<string> {
  const { data, error } = await client.rpc('promote_location_crawl_ingestion' as never, {
    p_ingestion_id: id,
  } as never);

  if (error) {
    throw new Error(`Không thể promote crawl location: ${error.message}`);
  }

  return String(data);
}

export async function rejectPartnerCrawlIngestion(id: string, reason?: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await client
    .from('partner_crawl_ingestions')
    .update({
      review_status: 'rejected',
      import_error: reason ?? null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Không thể từ chối crawl đối tác: ${error.message}`);
  }
}

export async function rejectLocationCrawlIngestion(id: string, reason?: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await client
    .from('location_crawl_ingestions')
    .update({
      review_status: 'rejected',
      import_error: reason ?? null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Không thể từ chối crawl location: ${error.message}`);
  }
}

export async function runCrawlSource(sourceId: string): Promise<CrawlFunctionResult> {
  return invokeCrawlFunction<CrawlFunctionResult>({
    action: 'run_source',
    sourceId,
  });
}

export async function syncCrawlJob(jobId: string): Promise<CrawlFunctionResult> {
  return invokeCrawlFunction<CrawlFunctionResult>({
    action: 'sync_job',
    jobId,
  });
}

function isUniqueConstraintError(message: string) {
  return /duplicate key value|23505/i.test(message);
}

function summarizeUploadStatus(summary: CrawlFunctionResult['summary']): CrawlJobStatus {
  if (!summary) {
    return 'failed';
  }

  if (summary.insertedCount === 0 && summary.errorCount > 0) {
    return 'failed';
  }

  if (summary.errorCount > 0 || summary.skippedCount > 0) {
    return 'partial';
  }

  return 'succeeded';
}

async function createUploadJob(input: UploadCrawlRecordsInput, userId: string | null) {
  const { data, error } = await client
    .from('crawl_jobs')
    .insert({
      entity_type: input.entityType,
      provider: 'admin_upload',
      trigger_type: 'file_upload',
      status: 'running',
      source_name: normalizeWhitespace(input.sourceName),
      source_url: input.sourceUrl ? sanitizeUrl(input.sourceUrl) ?? normalizeWhitespace(input.sourceUrl) : null,
      file_name: input.fileName ? normalizeWhitespace(input.fileName) : null,
      total_count: input.records.length,
      created_by: userId,
      started_at: new Date().toISOString(),
      log: {
        mode: 'direct_admin_upload',
      },
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Không thể tạo crawl job upload: ${error?.message ?? 'Unknown error'}`);
  }

  return data as CrawlJob;
}

async function finalizeUploadJob(jobId: string, status: CrawlJobStatus, summary: NonNullable<CrawlFunctionResult['summary']>, errorMessage?: string) {
  const { error } = await client
    .from('crawl_jobs')
    .update({
      status,
      inserted_count: summary.insertedCount,
      ready_count: summary.readyCount,
      duplicate_count: summary.duplicateCount,
      error_count: summary.errorCount,
      skipped_count: summary.skippedCount,
      finished_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
      log: {
        summary,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    throw new Error(`Không thể cập nhật crawl job upload: ${error.message}`);
  }
}

async function classifyUploadedRecord(entityType: CrawlEntityType, ingestionId: string) {
  const functionName = entityType === 'partner'
    ? 'classify_partner_crawl_ingestion'
    : 'classify_location_crawl_ingestion';

  const { error } = await client.rpc(functionName as never, {
    p_ingestion_id: ingestionId,
  } as never);

  if (error) {
    throw new Error(error.message);
  }
}

async function getUploadedRecordStatus(entityType: CrawlEntityType, ingestionId: string): Promise<CrawlReviewStatus | null> {
  const tableName = entityType === 'partner' ? 'partner_crawl_ingestions' : 'location_crawl_ingestions';
  const { data, error } = await client
    .from(tableName)
    .select('review_status')
    .eq('id', ingestionId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Không thể đọc review_status của crawl record');
  }

  const record = data as { review_status?: CrawlReviewStatus | null };
  return record.review_status ?? null;
}

export async function uploadCrawlRecords(input: UploadCrawlRecordsInput): Promise<CrawlFunctionResult> {
  const userId = await getCurrentUserId();
  const job = await createUploadJob(input, userId);
  const summary: NonNullable<CrawlFunctionResult['summary']> = {
    totalCount: input.records.length,
    insertedCount: 0,
    readyCount: 0,
    duplicateCount: 0,
    errorCount: 0,
    skippedCount: 0,
    sampleIds: [],
  };

  try {
    for (const record of input.records) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        summary.skippedCount += 1;
        continue;
      }

      try {
        const normalizedRecord = input.entityType === 'partner'
          ? normalizePartnerUploadRecord(
            record as Record<string, unknown>,
            normalizeWhitespace(input.sourceName),
            input.sourceUrl,
          )
          : normalizeLocationUploadRecord(
            record as Record<string, unknown>,
            normalizeWhitespace(input.sourceName),
            input.sourceUrl,
          );
        const tableName = input.entityType === 'partner'
          ? 'partner_crawl_ingestions'
          : 'location_crawl_ingestions';
        const { data, error } = await client
          .from(tableName)
          .insert(normalizedRecord as unknown as Record<string, unknown>)
          .select('id')
          .single();

        if (error || !data) {
          if (error && isUniqueConstraintError(error.message)) {
            summary.skippedCount += 1;
            continue;
          }

          summary.errorCount += 1;
          continue;
        }

        const insertedRecord = data as { id: string };
        summary.insertedCount += 1;
        if (summary.sampleIds.length < 10) {
          summary.sampleIds.push(insertedRecord.id);
        }

        await classifyUploadedRecord(input.entityType, insertedRecord.id);
        const reviewStatus = await getUploadedRecordStatus(input.entityType, insertedRecord.id);

        if (reviewStatus === 'ready') {
          summary.readyCount += 1;
        } else if (reviewStatus === 'duplicate_partner'
          || reviewStatus === 'duplicate_lead'
          || reviewStatus === 'duplicate_location') {
          summary.duplicateCount += 1;
        } else if (reviewStatus === 'error') {
          summary.errorCount += 1;
        }
      } catch {
        summary.errorCount += 1;
      }
    }

    const status = summarizeUploadStatus(summary);
    await finalizeUploadJob(job.id, status, summary);

    return {
      jobId: job.id,
      status,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    await finalizeUploadJob(job.id, 'failed', summary, message);
    throw new Error(message);
  }
}
