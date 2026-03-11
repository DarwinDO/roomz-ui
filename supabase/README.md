# Supabase Setup Guide

## Quick Start

### 1. Run Migrations

Go to **Supabase Dashboard** > **SQL Editor** > **New Query**

Copy and paste the contents of `migrations/001_rpc_functions.sql` and click **Run**.

### 2. Verify Setup

After running, you should see:
- RPC functions: `increment_favorite_count`, `decrement_favorite_count`, `increment_view_count`
- RLS policies on: `favorites`, `rooms`, `users`, `bookings`, `messages`

For the checkout/service-leads/swap contracts added in March 2026, run:

```sql
-- Paste the contents of supabase/verification/checkout_service_leads_swap_contract.sql
```

For the geo-search contract added in March 2026, the same verification script now also checks:
- `search_rooms(... p_lat, p_lng, p_radius_km ...)`
- `distance_km` support
- `calculate_distance_km(...)`

For the partner crawl ingestion pipeline added in March 2026, the same verification script now also checks:
- `partner_crawl_ingestions`
- `classify_partner_crawl_ingestion(...)`
- `promote_partner_crawl_ingestion(...)`

For the location crawl ingestion pipeline added in March 2026, the same verification script now also checks:
- `location_catalog`
- `location_crawl_ingestions`
- `classify_location_crawl_ingestion(...)`
- `promote_location_crawl_ingestion(...)`

For the admin one-click crawl workflow added in March 2026:
- `crawl_sources`
- `crawl_jobs`
- Edge Function `crawl-ingestion`

Important deploy note:
- `crawl-ingestion` must run with `verify_jwt = false`
- `ai-chatbot` must also stay on `verify_jwt = false`
- this is configured in [config.toml](/e:/RoomZ/roomz-ui/supabase/config.toml)
- the function performs admin auth inside the handler, not at the edge gateway
- on this workspace, the reliable deploy command was:

```powershell
npx supabase functions deploy ai-chatbot --project-ref vevnoxlgwisdottaifdn --no-verify-jwt
npx supabase functions deploy crawl-ingestion --project-ref vevnoxlgwisdottaifdn --no-verify-jwt
```

## Staging Demo Seed

Use [staging_demo.sql](/e:/RoomZ/roomz-ui/supabase/seeds/staging_demo.sql) when you need a denser non-production dataset for:
- search inventory
- roommate matching
- partners and deals
- service leads admin flows

This seed is separate from [seed.sql](/e:/RoomZ/roomz-ui/supabase/seed.sql) on purpose:
- `seed.sql`: lightweight bootstrap
- `seeds/staging_demo.sql`: staging/demo dataset

Run it in one of these ways:

```sql
-- Option 1: Supabase SQL Editor
-- Paste the contents of supabase/seeds/staging_demo.sql
```

```powershell
# Option 2: linked local/dev database
supabase db query < supabase/seeds/staging_demo.sql
```

Expected demo volume:
- `125` users
- `300` rooms
- `100` roommate profiles
- `60` partners
- `150` service leads

Implementation note:
- `staging_demo.sql` seeds app-domain data only in `public.*`
- the demo dataset is meant to support search, roommate, partners, and admin flows, not real login testing

### 3. Test Functions

```sql
-- Test increment_favorite_count
SELECT increment_favorite_count('your-room-uuid-here');

-- Test increment_view_count  
SELECT increment_view_count('your-room-uuid-here');
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

## Room Coordinate Backfill

Use [backfill_room_coordinates.mjs](/e:/RoomZ/roomz-ui/supabase/scripts/backfill_room_coordinates.mjs) when you need to geocode existing `rooms` rows that are missing coordinates.

Default behavior:
- scans `active` and `pending` rooms
- targets rows where `latitude` or `longitude` is `NULL`
- normalizes `city` and `district`
- geocodes through Mapbox

Run it from the repo root:

```powershell
npm run backfill:room-coordinates
```

Dry-run preview:

```powershell
npm run backfill:room-coordinates -- --dry-run --limit=20
```

## Partner Crawl Import

Use [import_partner_crawl_json.mjs](/e:/RoomZ/roomz-ui/supabase/scripts/import_partner_crawl_json.mjs) when you have public business data exported from Firecrawl, CSV-to-JSON, or another crawler and want to stage it safely before creating real partner leads.

Pipeline:
- raw JSON import into `partner_crawl_ingestions`
- automatic duplicate classification against `partners` and `partner_leads`
- optional promotion into `partner_leads` after review

Supported JSON shapes:
- array of objects
- `{ "data": [...] }`
- `{ "items": [...] }`
- `{ "results": [...] }`

Run a dry-run first:

```powershell
npm run import:partner-crawl -- --file=.\tmp\partner-crawl.json --source-name="hanoi-moving-services" --dry-run
```

Import for real:

```powershell
npm run import:partner-crawl -- --file=.\tmp\partner-crawl.json --source-name="hanoi-moving-services"
```

Optional flags:
- `--source-type=firecrawl|manual_json|csv_import|admin_import`
- `--limit=50`

Required fields for promotion into `partner_leads`:
- `company_name`
- `email`
- `phone`

Rows missing promotion-ready data remain in `partner_crawl_ingestions` with `review_status = 'error'` so they can be fixed manually instead of polluting `partner_leads`.

Admin UI alternative:
- open `/admin/ingestion-review`
- go to `Partner Crawl`
- use `Upload JSON crawl`
- this path inserts directly into the staging queue and classifies rows without terminal access

## Location Crawl Import

Use [import_location_crawl_json.mjs](/e:/RoomZ/roomz-ui/supabase/scripts/import_location_crawl_json.mjs) when you have public location metadata from Firecrawl or another crawler and want to stage it safely before promoting it into the curated `location_catalog`.

This is intended for:
- universities
- districts / neighborhoods
- POIs
- landmarks
- campuses / stations

Dry-run first:

```powershell
npm run import:location-crawl -- --file=.\tmp\location-crawl.json --source-name="hanoi-universities" --dry-run
```

Import for real:

```powershell
npm run import:location-crawl -- --file=.\tmp\location-crawl.json --source-name="hanoi-universities"
```

Required fields for promotion into `location_catalog`:
- `location_name`
- `location_type`

Rows missing those fields remain in `location_crawl_ingestions` with `review_status = 'error'`.

Admin UI alternative:
- open `/admin/ingestion-review`
- go to `Location Crawl`
- use `Upload JSON crawl`
- this path inserts directly into the staging queue and classifies rows without terminal access

## One-Click Crawl Sources

When you want admin users to press `Chạy crawl` from `/admin/ingestion-review`, the runtime path is:
- admin UI
- Edge Function `crawl-ingestion`
- Firecrawl
- `crawl_jobs`
- staging queue

Requirements:
- Firecrawl API key stored in Supabase Edge Function secrets
- `crawl-ingestion` deployed with `verify_jwt = false`
- `ai-chatbot` deployed with `verify_jwt = false`

If the button returns `Invalid JWT`, redeploy the functions with `--no-verify-jwt`.

## Troubleshooting

### Error: "Could not find the function"
Run the SQL migration again or check if the function exists:
```sql
SELECT * FROM pg_proc WHERE proname LIKE '%favorite%';
```

### Error: "Permission denied"
Check RLS policies are enabled and correct:
```sql
SELECT * FROM pg_policies WHERE tablename = 'favorites';
```
