import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CrawlEntityType = 'partner' | 'location';
type CrawlProvider = 'firecrawl' | 'admin_upload';
type CrawlTriggerType = 'source_run' | 'file_upload';
type CrawlJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';
type FirecrawlStatus = 'scraping' | 'processing' | 'completed' | 'failed' | 'cancelled';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type CrawlSourceRow = {
  id: string;
  entity_type: CrawlEntityType;
  provider: 'firecrawl';
  name: string;
  source_url: string;
  source_domain: string | null;
  is_active: boolean;
  config: JsonObject | null;
};

type CrawlJobRow = {
  id: string;
  entity_type: CrawlEntityType;
  provider: CrawlProvider;
  source_name: string;
  provider_job_id: string | null;
  log: JsonObject | null;
};

type AuthenticatedUser = {
  id: string;
  email?: string;
};

type ProcessSummary = {
  totalCount: number;
  insertedCount: number;
  readyCount: number;
  duplicateCount: number;
  errorCount: number;
  skippedCount: number;
  sampleIds: string[];
};

type FirecrawlExtractResponse = {
  id?: string;
  error?: string;
};

type FirecrawlExtractStatusResponse = {
  status?: FirecrawlStatus;
  data?: JsonValue;
  error?: string;
  expiresAt?: string;
};

type RunSourceRequest = {
  action: 'run_source';
  sourceId: string;
};

type SyncJobRequest = {
  action: 'sync_job';
  jobId: string;
};

type ImportRecordsRequest = {
  action: 'import_records';
  entityType: CrawlEntityType;
  sourceName: string;
  sourceUrl?: string;
  fileName?: string;
  records: JsonValue[];
};

type RequestBody = RunSourceRequest | SyncJobRequest | ImportRecordsRequest;

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || '';
const FIRECRAWL_API_URL = (Deno.env.get('FIRECRAWL_API_URL') || 'https://api.firecrawl.dev').replace(/\/$/, '');
const EXPOSE_INTERNAL_ERRORS = Deno.env.get('EXPOSE_INTERNAL_ERRORS') === 'true';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://rommz.vn',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || DEFAULT_ALLOWED_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const LOCATION_TYPES = new Set([
  'university',
  'district',
  'neighborhood',
  'poi',
  'campus',
  'station',
  'landmark',
]);

const CORS_BASE_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPTS: Record<CrawlEntityType, string> = {
  partner: [
    'Extract partner businesses suitable for student housing support services.',
    'Focus on moving, cleaning, furniture, utilities, handyman, and related local support services.',
    'Return concrete contact details and keep all discovered businesses in items.',
  ].join(' '),
  location: [
    'Extract public location metadata useful for student housing discovery.',
    'Focus on universities, campuses, districts, neighborhoods, stations, landmarks, and points of interest.',
    'Return all discovered locations in items with city, district, address, coordinates, and tags when present.',
  ].join(' '),
};

const DEFAULT_SCHEMAS: Record<CrawlEntityType, JsonObject> = {
  partner: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            company_name: { type: 'string' },
            contact_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            service_area: { type: 'string' },
            service_category: { type: 'string' },
            address: { type: 'string' },
            website: { type: 'string' },
            notes: { type: 'string' },
            crawl_confidence: { type: 'number' },
            external_id: { type: 'string' },
            source_url: { type: 'string' },
          },
        },
      },
    },
    required: ['items'],
  },
  location: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            location_name: { type: 'string' },
            location_type: { type: 'string' },
            city: { type: 'string' },
            district: { type: 'string' },
            address: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            notes: { type: 'string' },
            crawl_confidence: { type: 'number' },
            external_id: { type: 'string' },
            source_url: { type: 'string' },
          },
        },
      },
    },
    required: ['items'],
  },
};

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    ...CORS_BASE_HEADERS,
    'Access-Control-Allow-Origin': allowOrigin,
    Vary: 'Origin',
  };
}

function jsonResponse(
  corsHeaders: Record<string, string>,
  payload: Record<string, JsonValue>,
  status = 200,
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function isCrawlIngestionRequestBody(value: unknown): value is RequestBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record.action === 'run_source'
    || record.action === 'sync_job'
    || record.action === 'import_records';
}

function toRecord(value: unknown): JsonObject {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }
  return value as JsonObject;
}

function normalizeWhitespace(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/,+$/g, '')
    .trim();
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

function firstDefined(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }
  return undefined;
}

function inferArrayPayload(payload: JsonValue) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = toRecord(payload);
  if (Array.isArray(record.items)) {
    return record.items;
  }
  if (Array.isArray(record.data)) {
    return record.data;
  }
  if (Array.isArray(record.results)) {
    return record.results;
  }
  return [] as JsonValue[];
}

function parseCoordinate(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }
  return numericValue;
}

function clampConfidence(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }
  return Math.max(0, Math.min(100, numericValue));
}

function normalizeLocationName(value: unknown) {
  return normalizeWhitespace(value).toLowerCase() || undefined;
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [] as string[];
  }

  return tags
    .map((tag) => normalizeWhitespace(tag))
    .filter(Boolean);
}

function inferLocationType(item: JsonObject) {
  const raw = normalizeWhitespace(firstDefined(
    item.location_type,
    item.locationType,
    item.type,
    item.category,
    item.kind,
  )).toLowerCase();

  if (!raw) {
    return undefined;
  }
  if (LOCATION_TYPES.has(raw)) {
    return raw;
  }

  const aliases = new Map<string, string>([
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
function normalizePartnerItem(item: JsonValue, sourceType: string, sourceName: string) {
  const record = toRecord(item);
  const metadata = toRecord(record.metadata);
  const sourceUrl = sanitizeUrl(firstDefined(
    record.source_url,
    record.sourceUrl,
    record.url,
    metadata.sourceURL,
    metadata.url,
    record.website,
  ));
  const website = sanitizeUrl(firstDefined(record.website, record.website_url, record.site, sourceUrl));
  const email = sanitizeEmail(firstDefined(record.email, record.contact_email, record.contactEmail));
  const phone = sanitizePhone(firstDefined(record.phone, record.contact_phone, record.contactPhone, record.hotline));
  const companyName = normalizeWhitespace(firstDefined(
    record.company_name,
    record.companyName,
    record.business_name,
    record.businessName,
    record.name,
    record.title,
  ));
  const contactName = normalizeWhitespace(firstDefined(
    record.contact_name,
    record.contactName,
    record.owner_name,
    record.ownerName,
    record.contact,
  ));
  const serviceArea = normalizeWhitespace(firstDefined(
    record.service_area,
    record.serviceArea,
    record.city,
    record.area,
    record.location,
    record.address,
  ));
  const address = normalizeWhitespace(firstDefined(record.address, record.full_address, record.fullAddress));
  const serviceCategory = normalizeWhitespace(firstDefined(
    record.service_category,
    record.serviceCategory,
    record.category,
    record.service_type,
    record.serviceType,
  ));
  const notes = normalizeWhitespace(firstDefined(
    record.notes,
    record.description,
    record.summary,
    record.snippet,
  ));
  const crawlConfidence = clampConfidence(firstDefined(
    record.crawl_confidence,
    record.crawlConfidence,
    record.confidence,
    record.score,
    metadata.confidence,
  ));
  const externalId = normalizeWhitespace(firstDefined(record.external_id, record.externalId, record.id));
  const sourceDomain = extractDomain(sourceUrl ?? website);
  const dedupeKey = email
    ? `email:${email}`
    : phone
      ? `phone:${phone}`
      : companyName
        ? `company:${companyName.toLowerCase()}|domain:${sourceDomain ?? 'unknown'}`
        : undefined;

  return {
    source_type: sourceType,
    source_name: sourceName,
    source_url: sourceUrl,
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
      source_url: sourceUrl ?? null,
      source_domain: sourceDomain ?? null,
      external_id: externalId || null,
      crawl_confidence: crawlConfidence ?? null,
    },
    raw_payload: record,
  };
}

function normalizeLocationItem(item: JsonValue, sourceType: string, sourceName: string) {
  const record = toRecord(item);
  const metadata = toRecord(record.metadata);
  const coordinates = toRecord(record.coordinates);
  const location = toRecord(record.location);
  const sourceUrl = sanitizeUrl(firstDefined(
    record.source_url,
    record.sourceUrl,
    record.url,
    metadata.sourceURL,
    metadata.url,
    record.website,
  ));
  const locationName = normalizeWhitespace(firstDefined(
    record.location_name,
    record.locationName,
    record.name,
    record.title,
  ));
  const locationType = inferLocationType(record);
  const city = normalizeWhitespace(firstDefined(record.city, record.province, record.region));
  const district = normalizeWhitespace(firstDefined(record.district, record.area));
  const address = normalizeWhitespace(firstDefined(record.address, record.full_address, record.fullAddress));
  const latitude = parseCoordinate(firstDefined(record.latitude, record.lat, coordinates.lat, location.lat));
  const longitude = parseCoordinate(firstDefined(record.longitude, record.lng, record.lon, coordinates.lng, location.lng));
  const notes = normalizeWhitespace(firstDefined(record.notes, record.description, record.summary, record.snippet));
  const crawlConfidence = clampConfidence(firstDefined(
    record.crawl_confidence,
    record.crawlConfidence,
    record.confidence,
    record.score,
    metadata.confidence,
  ));
  const externalId = normalizeWhitespace(firstDefined(record.external_id, record.externalId, record.id));
  const sourceDomain = extractDomain(sourceUrl);
  const normalizedName = normalizeLocationName(locationName);
  const tags = normalizeTags(firstDefined(record.tags, record.labels, metadata.tags));
  const dedupeKey = normalizedName
    ? `${locationType ?? 'unknown'}|${normalizedName}|${city.toLowerCase()}|${district.toLowerCase()}`
    : undefined;

  return {
    source_type: sourceType,
    source_name: sourceName,
    source_url: sourceUrl,
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
      source_url: sourceUrl ?? null,
      source_domain: sourceDomain ?? null,
      external_id: externalId || null,
      crawl_confidence: crawlConfidence ?? null,
    },
    raw_payload: record,
  };
}

async function verifyAdmin(authHeader: string) {
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await userClient.auth.getUser();
  if (authError || !userData.user) {
    throw new HttpError(401, 'AUTH_ERROR', 'Invalid token');
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error: profileError } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }
  if (!profile || profile.role !== 'admin') {
    throw new HttpError(403, 'FORBIDDEN', 'Admin access required');
  }

  return {
    adminClient,
    user: userData.user as AuthenticatedUser,
  };
}

async function createJob(
  adminClient: ReturnType<typeof createClient>,
  payload: {
    sourceId?: string;
    entityType: CrawlEntityType;
    provider: CrawlProvider;
    triggerType: CrawlTriggerType;
    sourceName: string;
    sourceUrl?: string;
    fileName?: string;
    createdBy: string;
    log?: JsonObject;
  },
) {
  const { data, error } = await adminClient
    .from('crawl_jobs')
    .insert({
      source_id: payload.sourceId ?? null,
      entity_type: payload.entityType,
      provider: payload.provider,
      trigger_type: payload.triggerType,
      source_name: payload.sourceName,
      source_url: payload.sourceUrl ?? null,
      file_name: payload.fileName ?? null,
      created_by: payload.createdBy,
      started_at: new Date().toISOString(),
      status: 'running',
      log: payload.log ?? {},
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create crawl job');
  }

  return data as CrawlJobRow;
}

async function updateJob(
  adminClient: ReturnType<typeof createClient>,
  jobId: string,
  patch: Record<string, JsonValue>,
) {
  const { error } = await adminClient
    .from('crawl_jobs')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

async function getSource(adminClient: ReturnType<typeof createClient>, sourceId: string) {
  const { data, error } = await adminClient
    .from('crawl_sources')
    .select('*')
    .eq('id', sourceId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Crawl source not found');
  }

  return data as CrawlSourceRow;
}

async function getJob(adminClient: ReturnType<typeof createClient>, jobId: string) {
  const { data, error } = await adminClient
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Crawl job not found');
  }

  return data as CrawlJobRow;
}

function getFirecrawlExtractPayload(source: CrawlSourceRow) {
  const config = toRecord(source.config);
  const schema = toRecord(config.schema).type
    ? toRecord(config.schema)
    : DEFAULT_SCHEMAS[source.entity_type];
  const prompt = typeof config.prompt === 'string' && config.prompt.trim()
    ? config.prompt.trim()
    : DEFAULT_PROMPTS[source.entity_type];

  return {
    urls: [source.source_url],
    prompt,
    schema,
    enableWebSearch: config.enableWebSearch === true,
    showSources: config.showSources === true,
    includeSubdomains: config.includeSubdomains === true,
    scrapeOptions: {
      onlyMainContent: true,
      formats: ['markdown'],
    },
  };
}

async function startFirecrawlExtract(source: CrawlSourceRow) {
  if (!FIRECRAWL_API_KEY) {
    throw new HttpError(500, 'CONFIG_ERROR', 'Missing FIRECRAWL_API_KEY secret');
  }

  const sourceUrl = sanitizeUrl(source.source_url);
  if (!sourceUrl) {
    throw new HttpError(400, 'INVALID_SOURCE', 'Crawl source must have a valid source_url');
  }

  const response = await fetch(`${FIRECRAWL_API_URL}/v2/extract`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(getFirecrawlExtractPayload({
      ...source,
      source_url: sourceUrl,
    })),
  });

  const payload = await response.json().catch(() => ({})) as FirecrawlExtractResponse;
  if (!response.ok || !payload.id) {
    throw new Error(payload.error || `Firecrawl extract failed with status ${response.status}`);
  }

  return payload.id;
}

async function getFirecrawlJobStatus(providerJobId: string) {
  if (!FIRECRAWL_API_KEY) {
    throw new HttpError(500, 'CONFIG_ERROR', 'Missing FIRECRAWL_API_KEY secret');
  }

  const response = await fetch(`${FIRECRAWL_API_URL}/v2/extract/${providerJobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json().catch(() => ({})) as FirecrawlExtractStatusResponse;
  if (!response.ok) {
    throw new Error(payload.error || `Firecrawl sync failed with status ${response.status}`);
  }

  return payload;
}
async function ingestionExists(
  adminClient: ReturnType<typeof createClient>,
  tableName: 'partner_crawl_ingestions' | 'location_crawl_ingestions',
  sourceType: string,
  externalId?: string,
  sourceUrl?: string,
) {
  const checks: string[] = [];
  if (externalId) {
    checks.push(`external_id.eq.${externalId}`);
  }
  if (sourceUrl) {
    checks.push(`source_url.eq.${sourceUrl}`);
  }
  if (checks.length === 0) {
    return false;
  }

  const { data, error } = await adminClient
    .from(tableName)
    .select('id')
    .eq('source_type', sourceType)
    .or(checks.join(','))
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

function classifyStatusToCounters(entityType: CrawlEntityType, reviewStatus?: string) {
  if (!reviewStatus) {
    return { ready: 0, duplicate: 0, error: 1 };
  }
  if (reviewStatus === 'ready') {
    return { ready: 1, duplicate: 0, error: 0 };
  }
  if (entityType === 'partner' && (reviewStatus === 'duplicate_partner' || reviewStatus === 'duplicate_lead')) {
    return { ready: 0, duplicate: 1, error: 0 };
  }
  if (entityType === 'location' && reviewStatus === 'duplicate_location') {
    return { ready: 0, duplicate: 1, error: 0 };
  }
  return { ready: 0, duplicate: 0, error: 1 };
}

async function processPartnerRecords(
  adminClient: ReturnType<typeof createClient>,
  records: JsonValue[],
  sourceType: string,
  sourceName: string,
) {
  const summary: ProcessSummary = {
    totalCount: records.length,
    insertedCount: 0,
    readyCount: 0,
    duplicateCount: 0,
    errorCount: 0,
    skippedCount: 0,
    sampleIds: [],
  };

  for (const record of records) {
    const normalized = normalizePartnerItem(record, sourceType, sourceName);
    if (!normalized.company_name && !normalized.email && !normalized.phone) {
      summary.skippedCount += 1;
      continue;
    }

    const exists = await ingestionExists(
      adminClient,
      'partner_crawl_ingestions',
      normalized.source_type,
      normalized.external_id,
      normalized.source_url,
    );
    if (exists) {
      summary.skippedCount += 1;
      continue;
    }

    const { data: inserted, error: insertError } = await adminClient
      .from('partner_crawl_ingestions')
      .insert(normalized)
      .select('id')
      .single();

    if (insertError || !inserted) {
      summary.errorCount += 1;
      continue;
    }

    summary.insertedCount += 1;
    if (summary.sampleIds.length < 10) {
      summary.sampleIds.push(String(inserted.id));
    }

    const { data: classifyResult, error: classifyError } = await adminClient.rpc(
      'classify_partner_crawl_ingestion',
      { p_ingestion_id: inserted.id },
    );

    if (classifyError) {
      summary.errorCount += 1;
      continue;
    }

    const row = Array.isArray(classifyResult)
      ? toRecord(classifyResult[0])
      : toRecord(classifyResult);
    const counters = classifyStatusToCounters('partner', String(row.review_status ?? ''));
    summary.readyCount += counters.ready;
    summary.duplicateCount += counters.duplicate;
    summary.errorCount += counters.error;
  }

  return summary;
}

async function processLocationRecords(
  adminClient: ReturnType<typeof createClient>,
  records: JsonValue[],
  sourceType: string,
  sourceName: string,
) {
  const summary: ProcessSummary = {
    totalCount: records.length,
    insertedCount: 0,
    readyCount: 0,
    duplicateCount: 0,
    errorCount: 0,
    skippedCount: 0,
    sampleIds: [],
  };

  for (const record of records) {
    const normalized = normalizeLocationItem(record, sourceType, sourceName);
    if (!normalized.location_name) {
      summary.skippedCount += 1;
      continue;
    }

    const exists = await ingestionExists(
      adminClient,
      'location_crawl_ingestions',
      normalized.source_type,
      normalized.external_id,
      normalized.source_url,
    );
    if (exists) {
      summary.skippedCount += 1;
      continue;
    }

    const { data: inserted, error: insertError } = await adminClient
      .from('location_crawl_ingestions')
      .insert(normalized)
      .select('id')
      .single();

    if (insertError || !inserted) {
      summary.errorCount += 1;
      continue;
    }

    summary.insertedCount += 1;
    if (summary.sampleIds.length < 10) {
      summary.sampleIds.push(String(inserted.id));
    }

    const { data: classifyResult, error: classifyError } = await adminClient.rpc(
      'classify_location_crawl_ingestion',
      { p_ingestion_id: inserted.id },
    );

    if (classifyError) {
      summary.errorCount += 1;
      continue;
    }

    const row = Array.isArray(classifyResult)
      ? toRecord(classifyResult[0])
      : toRecord(classifyResult);
    const counters = classifyStatusToCounters('location', String(row.review_status ?? ''));
    summary.readyCount += counters.ready;
    summary.duplicateCount += counters.duplicate;
    summary.errorCount += counters.error;
  }

  return summary;
}

async function processRecords(
  adminClient: ReturnType<typeof createClient>,
  entityType: CrawlEntityType,
  records: JsonValue[],
  sourceType: string,
  sourceName: string,
) {
  return entityType === 'partner'
    ? processPartnerRecords(adminClient, records, sourceType, sourceName)
    : processLocationRecords(adminClient, records, sourceType, sourceName);
}

function summaryToJobPatch(summary: ProcessSummary, log: JsonObject) {
  const status: CrawlJobStatus = summary.errorCount > 0 && summary.insertedCount > 0
    ? 'partial'
    : summary.errorCount > 0 && summary.insertedCount === 0 && summary.readyCount === 0 && summary.duplicateCount === 0
      ? 'failed'
      : 'succeeded';

  return {
    status,
    total_count: summary.totalCount,
    inserted_count: summary.insertedCount,
    ready_count: summary.readyCount,
    duplicate_count: summary.duplicateCount,
    error_count: summary.errorCount,
    skipped_count: summary.skippedCount,
    finished_at: new Date().toISOString(),
    log,
  };
}

async function handleRunSource(
  adminClient: ReturnType<typeof createClient>,
  user: AuthenticatedUser,
  body: RunSourceRequest,
) {
  const source = await getSource(adminClient, body.sourceId);
  if (!source.is_active) {
    throw new HttpError(400, 'INVALID_STATE', 'Crawl source is inactive');
  }

  const sourceUrl = sanitizeUrl(source.source_url);
  if (!sourceUrl) {
    throw new HttpError(400, 'INVALID_SOURCE', 'Crawl source must have a valid source_url');
  }

  const job = await createJob(adminClient, {
    sourceId: source.id,
    entityType: source.entity_type,
    provider: 'firecrawl',
    triggerType: 'source_run',
    sourceName: source.name,
    sourceUrl,
    createdBy: user.id,
    log: {
      mode: 'source_run',
      source_domain: source.source_domain ?? extractDomain(sourceUrl) ?? null,
    },
  });

  try {
    const providerJobId = await startFirecrawlExtract(source);
    await updateJob(adminClient, job.id, {
      provider_job_id: providerJobId,
      status: 'running',
      log: {
        ...(job.log ?? {}),
        firecrawl_job_id: providerJobId,
      },
    });

    await adminClient
      .from('crawl_sources')
      .update({
        last_run_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', source.id);

    return {
      jobId: job.id,
      providerJobId,
      status: 'running',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start crawl source';
    await updateJob(adminClient, job.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: message,
      log: {
        ...(job.log ?? {}),
        error: message,
      },
    });
    throw error;
  }
}

async function handleSyncJob(
  adminClient: ReturnType<typeof createClient>,
  body: SyncJobRequest,
) {
  const job = await getJob(adminClient, body.jobId);
  if (job.provider !== 'firecrawl' || !job.provider_job_id) {
    throw new HttpError(400, 'INVALID_STATE', 'Only firecrawl jobs can be synced');
  }

  const firecrawlResult = await getFirecrawlJobStatus(job.provider_job_id);
  const firecrawlStatus = firecrawlResult.status ?? 'processing';

  if (firecrawlStatus === 'scraping' || firecrawlStatus === 'processing') {
    await updateJob(adminClient, job.id, {
      status: 'running',
      log: {
        ...(job.log ?? {}),
        firecrawl_status: firecrawlStatus,
        expires_at: firecrawlResult.expiresAt ?? null,
      },
    });

    return {
      jobId: job.id,
      status: 'running',
      firecrawlStatus,
    };
  }

  if (firecrawlStatus === 'failed' || firecrawlStatus === 'cancelled') {
    const message = firecrawlResult.error || `Firecrawl job ${firecrawlStatus}`;
    await updateJob(adminClient, job.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: message,
      log: {
        ...(job.log ?? {}),
        firecrawl_status: firecrawlStatus,
        firecrawl_error: message,
      },
    });

    return {
      jobId: job.id,
      status: 'failed',
      firecrawlStatus,
      error: message,
    };
  }

  const records = inferArrayPayload(firecrawlResult.data ?? []);
  const summary = await processRecords(
    adminClient,
    job.entity_type,
    records,
    'firecrawl',
    job.source_name,
  );
  const patch = summaryToJobPatch(summary, {
    ...(job.log ?? {}),
    firecrawl_status: firecrawlStatus,
    expires_at: firecrawlResult.expiresAt ?? null,
    processed_samples: summary.sampleIds,
  });
  await updateJob(adminClient, job.id, patch);

  return {
    jobId: job.id,
    status: patch.status,
    firecrawlStatus,
    summary,
  };
}

async function handleImportRecords(
  adminClient: ReturnType<typeof createClient>,
  user: AuthenticatedUser,
  body: ImportRecordsRequest,
) {
  const sourceName = normalizeWhitespace(body.sourceName) || 'admin-upload';
  const fileName = normalizeWhitespace(body.fileName) || null;
  const sourceUrl = sanitizeUrl(body.sourceUrl);
  const records = Array.isArray(body.records) ? body.records : [];

  const job = await createJob(adminClient, {
    entityType: body.entityType,
    provider: 'admin_upload',
    triggerType: 'file_upload',
    sourceName,
    sourceUrl,
    fileName: fileName ?? undefined,
    createdBy: user.id,
    log: {
      mode: 'file_upload',
      file_name: fileName,
    },
  });

  try {
    const summary = await processRecords(
      adminClient,
      body.entityType,
      records,
      'admin_import',
      sourceName,
    );
    const patch = summaryToJobPatch(summary, {
      ...(job.log ?? {}),
      processed_samples: summary.sampleIds,
    });
    await updateJob(adminClient, job.id, patch);

    return {
      jobId: job.id,
      status: patch.status,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import crawl file';
    await updateJob(adminClient, job.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: message,
      log: {
        ...(job.log ?? {}),
        error: message,
      },
    });
    throw error;
  }
}

export async function handleCrawlIngestionRequest(req: Request) {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse(corsHeaders, {
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      }, 405);
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(corsHeaders, {
        error: 'Server configuration error',
        code: 'CONFIG_ERROR',
      }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(corsHeaders, {
        error: 'Missing authorization',
        code: 'AUTH_ERROR',
      }, 401);
    }

    const body = await req.json() as RequestBody;
    const adminUserAuthHeader = req.headers.get('x-admin-user-auth') || authHeader;
    const auth = await verifyAdmin(adminUserAuthHeader);

    switch (body.action) {
      case 'run_source': {
        if (!body.sourceId) {
          return jsonResponse(corsHeaders, {
            error: 'sourceId is required',
            code: 'INVALID_INPUT',
          }, 400);
        }
        const result = await handleRunSource(auth.adminClient, auth.user, body);
        return jsonResponse(corsHeaders, result as unknown as Record<string, JsonValue>);
      }

      case 'sync_job': {
        if (!body.jobId) {
          return jsonResponse(corsHeaders, {
            error: 'jobId is required',
            code: 'INVALID_INPUT',
          }, 400);
        }
        const result = await handleSyncJob(auth.adminClient, body);
        return jsonResponse(corsHeaders, result as unknown as Record<string, JsonValue>);
      }

      case 'import_records': {
        if (!body.entityType || !Array.isArray(body.records)) {
          return jsonResponse(corsHeaders, {
            error: 'entityType and records are required',
            code: 'INVALID_INPUT',
          }, 400);
        }
        const result = await handleImportRecords(auth.adminClient, auth.user, body);
        return jsonResponse(corsHeaders, result as unknown as Record<string, JsonValue>);
      }
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(corsHeaders, {
        error: error.message,
        code: error.code,
      }, error.status);
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('crawl-ingestion error:', message);

    const payload: Record<string, JsonValue> = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };
    if (EXPOSE_INTERNAL_ERRORS) {
      payload.details = message;
    }

    return jsonResponse(corsHeaders, payload, 500);
  }
}

if (import.meta.main) {
  Deno.serve(handleCrawlIngestionRequest);
}
