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

function parseArgs(argv) {
  const args = {
    file: '',
    sourceType: 'firecrawl',
    sourceName: 'manual-import',
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

function sanitizeEmail(value) {
  const normalized = normalizeWhitespace(value).toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return undefined;
  }

  return normalized;
}

function sanitizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 8) {
    return undefined;
  }

  return digits;
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

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      return value;
    }
  }

  return undefined;
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

function normalizePartnerCrawlItem(item, sourceType, sourceName) {
  const metadata = item.metadata ?? {};
  const sourceUrl = sanitizeUrl(firstDefined(
    item.source_url,
    item.sourceUrl,
    item.url,
    metadata.sourceURL,
    metadata.url,
    item.website,
  ));
  const website = sanitizeUrl(firstDefined(item.website, item.website_url, item.site, sourceUrl));
  const email = sanitizeEmail(firstDefined(item.email, item.contact_email, item.contactEmail));
  const phone = sanitizePhone(firstDefined(item.phone, item.contact_phone, item.contactPhone, item.hotline));
  const companyName = normalizeWhitespace(firstDefined(
    item.company_name,
    item.companyName,
    item.business_name,
    item.businessName,
    item.name,
    item.title,
  ) ?? '');
  const contactName = normalizeWhitespace(firstDefined(
    item.contact_name,
    item.contactName,
    item.owner_name,
    item.ownerName,
    item.contact,
  ) ?? '');
  const serviceArea = normalizeWhitespace(firstDefined(
    item.service_area,
    item.serviceArea,
    item.city,
    item.area,
    item.location,
    item.address,
  ) ?? '');
  const address = normalizeWhitespace(firstDefined(item.address, item.full_address, item.fullAddress) ?? '');
  const serviceCategory = normalizeWhitespace(firstDefined(
    item.service_category,
    item.serviceCategory,
    item.category,
    item.service_type,
    item.serviceType,
  ) ?? '');
  const notes = normalizeWhitespace(firstDefined(
    item.notes,
    item.description,
    item.summary,
    item.snippet,
  ) ?? '');
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
    raw_payload: item,
  };
}

async function main() {
  await loadEnvFiles();

  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('Missing required --file=/path/to/crawl.json');
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
    throw new Error('No crawl items found in the provided JSON file');
  }

  const summary = {
    scanned: selectedItems.length,
    inserted: 0,
    skipped: 0,
    ready: 0,
    duplicatePartner: 0,
    duplicateLead: 0,
    error: 0,
  };

  for (const item of selectedItems) {
    const normalized = normalizePartnerCrawlItem(item, args.sourceType, args.sourceName);

    if (!normalized.company_name && !normalized.email && !normalized.phone) {
      summary.skipped += 1;
      console.log('SKIP :: item has no usable company/contact data');
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
        .from('partner_crawl_ingestions')
        .select('id')
        .eq('source_type', normalized.source_type)
        .or(duplicateChecks.join(','))
        .limit(1);

      if (existing && existing.length > 0) {
        summary.skipped += 1;
        console.log(`SKIP :: existing ingestion ${existing[0].id}`);
        continue;
      }
    }

    if (args.dryRun) {
      summary.inserted += 1;
      console.log('DRY', JSON.stringify(normalized.normalized_payload));
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('partner_crawl_ingestions')
      .insert(normalized)
      .select('id')
      .single();

    if (insertError) {
      throw insertError;
    }

    summary.inserted += 1;

    const { data: classifyResult, error: classifyError } = await supabase.rpc(
      'classify_partner_crawl_ingestion',
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
      case 'duplicate_partner':
        summary.duplicatePartner += 1;
        break;
      case 'duplicate_lead':
        summary.duplicateLead += 1;
        break;
      default:
        summary.error += 1;
        break;
    }

    console.log(
      `OK ${inserted.id} :: ${classification?.review_status ?? 'pending'} :: ${normalized.company_name ?? 'unknown'}`,
    );
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
