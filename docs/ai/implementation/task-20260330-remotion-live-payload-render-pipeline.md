---
phase: implementation
title: Remotion Live Payload and Local Render Pipeline
date: 2026-03-30
---

# Remotion Live Payload and Local Render Pipeline

## Scope

- Move the first RommZ brand-ad template from fixture-only preview toward repeatable local rendering from real app data
- Keep Remotion compositions pure and serializable instead of letting them fetch API or DB data directly
- Add a local script that can snapshot live data, persist the payload, and drive either still or MP4 rendering
- Keep the phase local-first, with production render orchestration deferred to a later phase

## Decisions

- The composition contract remains `API/server action -> normalized payload -> Remotion props`
- A Node-side helper owns env loading, Supabase reads, payload writing, and Remotion CLI execution
- The payload mapper falls back to the existing fixture so local preview still works when env vars or DB access are unavailable
- Featured-room creative only trusts known RommZ market labels before using live city/district data in the headline or hero region
- Generated outputs are treated as local artifacts and are now ignored at the repo level for the web package

## Implementation

- Added the live payload builder:
  - `packages/web/src/remotion/payloads/buildRommzBrandAdPayload.ts`
  - `packages/web/src/remotion/payloads/buildRommzBrandAdPayload.test.ts`
- Added the local render entrypoint:
  - `packages/web/scripts/remotion/renderBrandAd.ts`
- Updated web-package scripts in `packages/web/package.json`:
  - `remotion:payload:brand`
  - `remotion:still:brand:live`
  - `remotion:render:brand:live`
- Updated `packages/web/tsconfig.node.json` so the new `scripts/**/*.ts` entry compiles under the existing node-side TypeScript setup
- Updated `.gitignore` so package-local Remotion outputs and payload snapshots do not stay in git status

## Data Mapping Notes

- The local snapshot currently pulls signal counts from:
  - `rooms`
  - `deals`
  - `partners`
  - `community_posts`
- Featured-room image selection now prefers primary room images and recent active rooms
- The mapper keeps live counts even when featured-room creative falls back to the fixture, so noisy room metadata does not block useful stats
- Optional `--voiceover=` and `--soundtrack=` flags can now inject audio asset paths into the payload without changing the composition

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run test:unit --workspace=@roomz/web -- src/remotion/payloads/buildRommzBrandAdPayload.test.ts`: pass
- `npm run remotion:payload:brand --workspace=@roomz/web`: pass
  - payload snapshot written under `packages/web/.tmp/remotion/`
  - source resolved as `database`
- `npm run remotion:still:brand:live --workspace=@roomz/web`: pass
- `npm run build --workspace=@roomz/web`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings

## Validation Notes

- A one-off `ENOENT` lint run against `packages/web/test-results` appeared once immediately after test execution, but the next unchanged rerun passed cleanly; this looks like transient workspace state rather than a config defect
- The root ESLint config still only globally ignores `dist`; no Remotion-specific lint exclusion was required after rerun confirmation

## Follow-up

- Replace direct local DB querying with the final server-owned payload source when the render job moves beyond local development
- Attach real voiceover and soundtrack assets to validate the ducking timeline against actual audio duration
- Add a higher-level render command or job runner once the payload source and output storage strategy are finalized
