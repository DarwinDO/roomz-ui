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
const VIETNAM_BOUNDING_BOX = '102.0,8.0,110.5,24.5';

function parseArgs(argv) {
  const args = {
    limit: 50,
    dryRun: false,
  };

  for (const entry of argv) {
    if (entry === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (entry.startsWith('--limit=')) {
      const value = Number(entry.split('=')[1]);
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

function simplifyText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWhitespace(value) {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/,+$/g, '')
    .trim();
}

const cityAliases = new Map([
  ['ha noi', 'Thành phố Hà Nội'],
  ['hanoi', 'Thành phố Hà Nội'],
  ['thanh pho ha noi', 'Thành phố Hà Nội'],
  ['tp ha noi', 'Thành phố Hà Nội'],
  ['ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['ho chi minh city', 'Thành phố Hồ Chí Minh'],
  ['thanh pho ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['tp ho chi minh', 'Thành phố Hồ Chí Minh'],
  ['tphcm', 'Thành phố Hồ Chí Minh'],
  ['sai gon', 'Thành phố Hồ Chí Minh'],
  ['da nang', 'Thành phố Đà Nẵng'],
  ['thanh pho da nang', 'Thành phố Đà Nẵng'],
  ['tp da nang', 'Thành phố Đà Nẵng'],
  ['can tho', 'Thành phố Cần Thơ'],
  ['thanh pho can tho', 'Thành phố Cần Thơ'],
  ['tp can tho', 'Thành phố Cần Thơ'],
]);

function capitalizeWords(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeCityName(value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return undefined;
  return cityAliases.get(simplifyText(normalized)) ?? normalized;
}

function normalizeDistrictName(value) {
  let normalized = normalizeWhitespace(value);
  if (!normalized) return undefined;

  normalized = normalized
    .replace(/^q\.?\s+/i, 'Quận ')
    .replace(/^quan\s+/i, 'Quận ')
    .replace(/^h\.?\s+/i, 'Huyện ')
    .replace(/^huyen\s+/i, 'Huyện ')
    .replace(/^tp\.?\s+/i, 'Thành phố ')
    .replace(/^thanh pho\s+/i, 'Thành phố ')
    .replace(/^tx\.?\s+/i, 'Thị xã ')
    .replace(/^thi xa\s+/i, 'Thị xã ');

  return capitalizeWords(normalized);
}

function buildGeocodingQuery(room) {
  return [
    normalizeWhitespace(room.address),
    normalizeDistrictName(room.district),
    normalizeCityName(room.city),
  ].filter(Boolean).join(', ');
}

function mapboxFeatureToLocation(feature) {
  const context = feature.context ?? [];
  const getContextText = (prefixes) => {
    const match = context.find((entry) => prefixes.some((prefix) => entry.id.startsWith(prefix)));
    return match?.text;
  };

  return {
    latitude: feature.center?.[1] ?? null,
    longitude: feature.center?.[0] ?? null,
    city: normalizeCityName(getContextText(['place.', 'region.']) ?? getContextText(['country.'])),
    district: normalizeDistrictName(getContextText(['district.', 'locality.']) ?? getContextText(['place.'])),
  };
}

async function geocodeRoom(room, mapboxToken) {
  const query = buildGeocodingQuery(room);
  if (!query) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${mapboxToken}&` +
      'country=vn&' +
      'language=vi&' +
      'types=address,district,locality,place,region&' +
      `bbox=${VIETNAM_BOUNDING_BOX}&` +
      'limit=1',
  );

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`);
  }

  const payload = await response.json();
  const feature = payload.features?.[0];
  if (!feature) {
    return null;
  }

  return mapboxFeatureToLocation(feature);
}

async function main() {
  await loadEnvFiles();

  const options = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!supabaseUrl || !serviceRoleKey || !mapboxToken) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or MAPBOX_ACCESS_TOKEN/VITE_MAPBOX_ACCESS_TOKEN');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, address, district, city, latitude, longitude, status, deleted_at')
    .in('status', ['active', 'pending'])
    .is('deleted_at', null)
    .or('latitude.is.null,longitude.is.null')
    .limit(options.limit);

  if (error) {
    throw error;
  }

  const summary = {
    scanned: rooms.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const room of rooms) {
    try {
      const geocoded = await geocodeRoom(room, mapboxToken);
      if (!geocoded?.latitude || !geocoded?.longitude) {
        summary.skipped += 1;
        console.log(`SKIP ${room.id} :: no geocoding result`);
        continue;
      }

      const payload = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        city: geocoded.city ?? normalizeCityName(room.city) ?? room.city,
        district: geocoded.district ?? normalizeDistrictName(room.district) ?? room.district,
        updated_at: new Date().toISOString(),
      };

      if (options.dryRun) {
        summary.updated += 1;
        console.log(`DRY ${room.id}`, payload);
        continue;
      }

      const { error: updateError } = await supabase
        .from('rooms')
        .update(payload)
        .eq('id', room.id);

      if (updateError) {
        throw updateError;
      }

      summary.updated += 1;
      console.log(`OK ${room.id} :: ${payload.city ?? ''} / ${payload.district ?? ''}`);
    } catch (roomError) {
      summary.failed += 1;
      console.error(`FAIL ${room.id}`, roomError);
    }
  }

  console.log('\nSummary:', summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
