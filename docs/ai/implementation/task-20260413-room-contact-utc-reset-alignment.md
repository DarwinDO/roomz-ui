---
phase: implementation
task: room-contact-utc-reset-alignment
date: 2026-04-13
status: complete
---

# Task Log: Room Contact UTC Reset Alignment

## Goal

- Align the backend phone-reveal daily reset boundary with the UTC-based roommate quota contract so both limited-view features use the same day rollover rule.

## Files

- `supabase/migrations/20260413133000_align_room_contact_daily_reset_to_utc.sql`
- `packages/web/src/services/rooms.shared.test.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Added a new Supabase migration that replaces `public.get_room_contact(uuid)` with the same UTC-day counting model already used by roommate quotas.
- The function now counts `phone_number_views` inside an explicit `[utc_day_start, utc_next_day_start)` window instead of relying on `CURRENT_DATE`, which depends on the database session timezone.
- Kept the existing product behavior unchanged outside the reset boundary:
  - free users still get `3` phone reveals per day
  - premium users still get `100` phone reveals per day
  - masked/unmasked response behavior remains the same
- Added a focused service-level test to keep the web/shared room-contact RPC contract covered.

## Root Cause

- The client-side rollover fix already assumed UTC day boundaries, but `get_room_contact` still counted daily usage through `CURRENT_DATE`.
- That meant the backend reset boundary for phone reveals could drift from roommate limits depending on the active database timezone/session settings.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/rooms.shared.test.ts`: pass
- `npx eslint packages/web/src/services/rooms.shared.test.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, `public.get_room_contact(uuid)` now uses `[utc_day_start, utc_next_day_start)` and `plan = 'rommz_plus'`
- direct SQL verification on `vevnoxlgwisdottaifdn`: pass, `supabase_migrations.schema_migrations.version = 20260413133000`

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260413-room-contact-utc-reset-alignment.md`

## Follow-ups

- The repo root `.env.local` still contains a UTF-8 BOM that breaks some Supabase CLI linked commands; continue using a temporary external workdir or fix the BOM before the next linked CLI operation.
