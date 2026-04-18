---
phase: implementation
task: user-facing-copy-cleanup
date: 2026-04-18
status: complete
---

# Task Log: User-Facing Copy Cleanup

## Goal

- Remove internal/dev-facing wording from public and host-facing UI copy.
- Rewrite ROMI summaries so they read like product copy instead of stitched-together state fragments.

## Files

- `packages/shared/src/services/ai-chatbot/journey.ts`
- `packages/shared/src/services/ai-chatbot/api.ts`
- `packages/web/src/pages/RomiPage.tsx`
- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/LandlordDashboardPage.tsx`
- `packages/web/src/pages/SearchPage.tsx`
- `packages/web/src/pages/LocalPassportPage.tsx`
- `packages/web/src/components/listings/ListingLocationContext.tsx`
- `packages/web/src/services/romi.test.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Rewrote ROMI page copy to replace `thread / session / workspace` wording with `cuộc trò chuyện`, `lịch sử trò chuyện`, and other end-user-facing labels.
- Removed ROMI empty-state and error copy that exposed internal terminology like `session` or streaming/data-pipeline concepts.
- Reworked shared `buildJourneySummary(...)` so it now returns full Vietnamese sentences instead of bullet-separated state fragments such as `Đang hỏi về sản phẩm • khu vực ... • đang mở room`.
- Added a shared room-type label formatter so ROMI no longer shows raw values like `private` or `shared` to end users.
- Updated ROMI session preview fallback copy to stay user-facing even when no stronger summary is available.
- Cleaned user-facing messaging and host dashboard copy to remove `thread`, `listing`, `room context`, `console`, `lane`, and `live` jargon where it surfaced in the UI.
- Renamed search and location labels that exposed internal catalog wording such as `Gợi ý khu vực nội bộ`, `Catalog nội bộ`, and `Local context`.
- Added regression coverage in `packages/web/src/services/romi.test.ts` to lock the new natural-language summary style and prevent the old bullet-fragment summary from returning.

## Root Cause

- During previous implementation passes, copy was written too close to internal model/state names used in code.
- Those internal concepts leaked directly into user-facing surfaces, especially ROMI, inbox, host dashboard, and location-based suggestion modules.
- The biggest offender was `buildJourneySummary(...)`, which assembled UI copy as a developer-readable status string instead of a sentence a renter or landlord would naturally read.

## Validation

- `npx eslint packages/shared/src/services/ai-chatbot/journey.ts packages/shared/src/services/ai-chatbot/api.ts packages/web/src/pages/RomiPage.tsx packages/web/src/pages/MessagesPage.tsx packages/web/src/pages/LandlordDashboardPage.tsx packages/web/src/pages/SearchPage.tsx packages/web/src/components/listings/ListingLocationContext.tsx packages/web/src/pages/LocalPassportPage.tsx packages/web/src/services/romi.test.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/romi.test.ts`: pass
- `npx ai-devkit@latest lint`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260418-user-facing-copy-cleanup.md`

## Follow-ups

- Run the same copy audit on any future new host/admin surfaces before release so internal product terms do not leak back into end-user UI.
- Keep new ROMI summary copy sentence-based even if more journey fields are added later; do not reintroduce fragment joins or status-dump formatting.
