---
phase: implementation
task: room-view-count-guard-fix
date: 2026-04-18
status: complete
---

# Task Log: Room View Count Guard Fix

## Goal

- Stop room detail fetches from inflating `view_count`.
- Ensure admin previews, landlord self-previews, and non-active room previews do not count as public room views.

## Files

- `packages/shared/src/services/rooms.ts`
- `packages/web/src/services/rooms.ts`
- `packages/web/src/services/index.ts`
- `packages/web/src/pages/RoomDetailPage.tsx`
- `packages/web/src/services/rooms.shared.test.ts`
- `packages/web/src/utils/roomViewTracking.ts`
- `packages/web/src/utils/roomViewTracking.test.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Removed the `increment_view_count` side effect from shared `getRoomById(...)` so plain room fetches no longer mutate data.
- Added a dedicated `incrementRoomView(...)` helper in the shared room service and exposed it through the web wrappers.
- Updated `RoomDetailPage` to trigger room-view counting only after auth state is resolved and only when the viewer is eligible:
  - room status must be `active`
  - admin users are excluded
  - the room owner is excluded from self-preview counts
- Kept room-view analytics on the same guarded path so product telemetry stays aligned with the visible listing counter.
- Added regression coverage for:
  - `getRoomById(...)` no longer calling the view-count RPC
  - `incrementRoomView(...)` calling the RPC explicitly
  - public-room-view eligibility rules for anonymous viewers, auth-loading state, admin previews, landlord self-previews, and pending listings

## Root Cause

- `packages/shared/src/services/rooms.ts` incremented `view_count` inside `getRoomById(...)`.
- That service is reused beyond the public detail page, including landlord edit / preview flows and post-create / post-update reloads.
- Because the mutation lived inside a fetch function, repeated query execution or non-public fetches could inflate `view_count`, which explains:
  - one apparent page open sometimes increasing the listing counter by `2`
  - admin and landlord previews of pending rooms also being counted

## Validation

- `npx eslint packages/shared/src/services/rooms.ts packages/web/src/services/rooms.ts packages/web/src/services/index.ts packages/web/src/pages/RoomDetailPage.tsx packages/web/src/services/rooms.shared.test.ts packages/web/src/utils/roomViewTracking.ts packages/web/src/utils/roomViewTracking.test.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/rooms.shared.test.ts src/utils/roomViewTracking.test.ts`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260418-room-view-count-guard-fix.md`

## Follow-ups

- If product wants stricter deduplication, add a server-side per-user/session throttle so rapid reloads of the same active room do not count as separate views.
