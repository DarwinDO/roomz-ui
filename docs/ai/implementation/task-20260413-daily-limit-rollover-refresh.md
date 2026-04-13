---
phase: implementation
task: daily-limit-rollover-refresh
date: 2026-04-13
status: complete
---

# Task Log: Daily Limit Rollover Refresh

## Goal

- Fix limited-view UI flows that looked stuck after a new day started even though the backend quota logic had already reset.

## Files

- `packages/web/src/hooks/useRoommatesQuery.ts`
- `packages/web/src/components/PhoneRevealButton.tsx`
- `packages/web/src/components/PhoneRevealButton.test.tsx`
- `packages/web/src/utils/dailyReset.ts`
- `packages/web/src/utils/dailyReset.test.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Added `packages/web/src/utils/dailyReset.ts` so the web package has one shared UTC-day rollover helper instead of duplicating midnight math in each feature.
- Updated `useRoommateLimits()` to remember the last successful UTC sync date for the limits query and invalidate the active roommate-limits query when:
  - the next UTC midnight passes while the page is still open
  - the tab regains focus after the UTC day has already rolled over
  - the document becomes visible again after being backgrounded across the reset boundary
- Updated `PhoneRevealButton` so a previously masked phone result no longer stays frozen forever in local component state:
  - masked phone state now records the UTC day it was resolved
  - the component clears that stale masked state on the next UTC day rollover or when the user returns to the tab after rollover
  - once cleared, the normal `Xem số điện thoại` action becomes available again without forcing a full page reload
- Added regression coverage for the rollover helpers and the masked-phone UI reset path.

## Root Cause

- The backend daily-limit logic was already resetting by day, but the client had no corresponding rollover refresh behavior.
- `useRoommateLimits()` cached `canViewMore` and `limits` in React Query, so the UI could keep yesterday's exhausted state until some later refetch happened.
- `PhoneRevealButton` stored the masked response in local component state and offered no retry/remount path after the day changed.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npx eslint packages/web/src/hooks/useRoommatesQuery.ts packages/web/src/components/PhoneRevealButton.tsx packages/web/src/components/PhoneRevealButton.test.tsx packages/web/src/utils/dailyReset.ts packages/web/src/utils/dailyReset.test.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/components/PhoneRevealButton.test.tsx src/utils/dailyReset.test.ts src/services/roommates.test.ts`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260413-daily-limit-rollover-refresh.md`

## Follow-ups

- If the product later wants rollovers based on local user timezone instead of UTC, move the backend reset contract first, then align the shared web helper to the new server-side boundary in one place.
