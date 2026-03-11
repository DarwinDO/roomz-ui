import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..', '..');
const ENV_FILES = [
  resolve(ROOT_DIR, '.env'),
  resolve(ROOT_DIR, '.env.local'),
  resolve(ROOT_DIR, 'packages', 'web', '.env'),
];
const LOCATION_TYPES = new Set([
  'university',
  'district',
  'neighborhood',
  'poi',
  'campus',
  'station',
  'landmark',
]);

function parseArgs(argv) {
  const args = {
    file: '',
    sourceType: 'firecrawl',
    sourceName: 'manual-location-import',
    dryRun: false,
    limit: undefined,
  };

  for (const entry of argv) {
    if (entry === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (entry.startsWith('--file=')) {
      args.file = entry.slice('--file='.length);
      continue;
    }
    if (entry.startsWith('--source-type=')) {
      args.sourceType = entry.slice('--source-type='.length);
      continue;
    }
    if (entry.startsWith('--source-name=')) {
      args.sourceName = entry.slice('--source-name='.length);
      continue;
    }
    if (entry.startsWith('--limit=')) {
      const value = Number(entry.slice('--limit='.length));
      if (!Number.isNaN(value) && value > 0) {
        args.limit = value;
      }
    }
  }

  return args;
}

async function loadEnvFiles() {
  for (const envFile of ENV_FILES) {
    if (!existsSync(envFile)) {
      continue;
    }

    const content = await readFile(envFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function normalizeWhitespace(value) {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/,+$/g, '')
    .trim();
}

function sanitizeUrl(value) {
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

function extractDomain(url) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return undefined;
  }
}

function normalizeLocationName(value) {
  return normalizeWhitespace(value).toLowerCase() || undefined;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }

  return undefined;
}

function parseCoordinate(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue;
}

function inferLocationType(item) {
  const raw = normalizeWhitespace(firstDefined(
    item.location_type,
    item.locationType,
    item.type,
    item.category,
    item.kind,
  ) ?? '').toLowerCase();

  if (!raw) {
    return undefined;
  }

  if (LOCATION_TYPES.has(raw)) {
    return raw;
  }

  const aliases = new Map([
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

function inferArrayPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((tag) => normalizeWhitespace(String(tag)))
    .filter(Boolean);
}

function normalizeLocationItem(item, sourceType, sourceName) {
  const metadata = item.metadata ?? {};
  const sourceUrl = sanitizeUrl(firstDefined(
    item.source_url,
    item.sourceUrl,
    item.url,
    metadata.sourceURL,
    metadata.url,
    item.website,
  ));
  const locationName = normalizeWhitespace(firstDefined(
    item.location_name,
    item.locationName,
    item.name,
    item.title,
  ) ?? '');
  const locationType = inferLocationType(item);
  const city = normalizeWhitespace(firstDefined(item.city, item.province, item.region) ?? '');
  const district = normalizeWhitespace(firstDefined(item.district, item.area) ?? '');
  const address = normalizeWhitespace(firstDefined(item.address, item.full_address, item.fullAddress) ?? '');
  const latitude = parseCoordinate(firstDefined(item.latitude, item.lat, item.coordinates?.lat, item.location?.lat));
  const longitude = parseCoordinate(firstDefined(item.longitude, item.lng, item.lon, item.coordinates?.lng, item.location?.lng));
  const notes = normalizeWhitespace(firstDefined(item.notes, item.description, item.summary, item.snippet) ?? '');
  const crawlConfidenceValue = Number(firstDefined(
    item.crawl_confidence,
    item.crawlConfidence,
    item.confidence,
    item.score,
    metadata.confidence,
  ));
  const crawlConfidence = Number.isFinite(crawlConfidenceValue)
    ? Math.max(0, Math.min(100, crawlConfidenceValue))
    : undefined;
  const externalId = normalizeWhitespace(firstDefined(item.external_id, item.externalId, item.id) ?? '');
  const sourceDomain = extractDomain(sourceUrl);
  const normalizedName = normalizeLocationName(locationName);
  const tags = normalizeTags(firstDefined(item.tags, item.labels, metadata.tags) ?? []);
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
    raw_payload: item,
  };
}

async function main() {
  await loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('Missing required --file=/path/to/location-crawl.json');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const rawContent = await readFile(resolve(process.cwd(), args.file), 'utf8');
  const payload = JSON.parse(rawContent);
  const items = inferArrayPayload(payload);
  const selectedItems = args.limit ? items.slice(0, args.limit) : items;

  if (selectedItems.length === 0) {
    throw new Error('No location crawl items found in the provided JSON file');
  }

  const summary = {
    scanned: selectedItems.length,
    inserted: 0,
    skipped: 0,
    ready: 0,
    duplicateLocation: 0,
    error: 0,
  };

  for (const item of selectedItems) {
    const normalized = normalizeLocationItem(item, args.sourceType, args.sourceName);
    if (!normalized.location_name) {
      summary.skipped += 1;
      console.log('SKIP :: location_name missing');
      continue;
    }

    const duplicateChecks = [];
    if (normalized.external_id) {
      duplicateChecks.push(`external_id.eq.${normalized.external_id}`);
    }
    if (normalized.source_url) {
      duplicateChecks.push(`source_url.eq.${normalized.source_url}`);
    }

    if (duplicateChecks.length > 0) {
      const { data: existing } = await supabase
        .from('location_crawl_ingestions')
        .select('id')
        .eq('source_type', normalized.source_type)
        .or(duplicateChecks.join(','))
        .limit(1);

      if (existing && existing.length > 0) {
        summary.skipped += 1;
        console.log(`SKIP :: existing location ingestion ${existing[0].id}`);
        continue;
      }
    }

    if (args.dryRun) {
      summary.inserted += 1;
      console.log('DRY', JSON.stringify(normalized.normalized_payload));
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('location_crawl_ingestions')
      .insert(normalized)
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    summary.inserted += 1;

    const { data: classifyResult, error: classifyError } = await supabase.rpc(
      'classify_location_crawl_ingestion',
      { p_ingestion_id: inserted.id },
    );

    if (classifyError) {
      throw classifyError;
    }

    const classification = Array.isArray(classifyResult) ? classifyResult[0] : classifyResult;
    switch (classification?.review_status) {
      case 'ready':
        summary.ready += 1;
        break;
      case 'duplicate_location':
        summary.duplicateLocation += 1;
        break;
      default:
        summary.error += 1;
        break;
    }

    console.log(
      `OK ${inserted.id} :: ${classification?.review_status ?? 'pending'} :: ${normalized.location_name}`,
    );
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
