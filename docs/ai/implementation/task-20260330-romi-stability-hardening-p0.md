---
title: ROMI Stability Hardening P0
date: 2026-03-30
owner: Codex
---

# ROMI Stability Hardening P0

## Scope

- `packages/shared`
- `packages/web`
- `supabase/functions/ai-chatbot`
- `supabase/migrations`
- `docs/ai/*`

## Why

- ROMI was still breaking trust in the first 1 to 3 turns:
  - terse budget replies like `5 triệu nha` were not always captured
  - malformed phrases like `từ 5 triệu trở xuống` could produce bad budget signals
  - POI hints could swallow budget clauses
  - room-search orchestration could still drift into wrong-result or zero-result loops
  - signed-in previews could remain stuck on stale clarification wording

## Implemented

### Shared parser and journey state

- Extended `RomiJourneyState` and `AIChatMessageMetadata` with:
  - `poiHint`
  - `budgetConstraintType`
  - `lastAskedField`
  - `lastAskedTurnIndex`
  - `clarificationLoopCounts`
  - `normalizationConfidence`
  - `searchNormalizationWarnings`
  - `searchAttempts`
  - `autoBroadenApplied`
  - `resolutionOutcome`
- Reworked `mergeJourneyState(...)` so `undefined` keeps existing values, explicit `null` clears values, and per-field loop counts persist safely.
- Hardened intake extraction:
  - split `poiHint` from `areaHint`
  - stop POI parsing before trailing budget clauses, including malformed phrases like `và từ 5 triệu trở xuống`
  - support `gần`, `gan`, and `near` prefixes without depending on Unicode regex boundaries
  - parse `tầm 5 triệu`, `3 đến 5 triệu`, `từ 5 triệu trở xuống`
  - map bare budget replies to `budgetMax + soft_cap` only in budget-reply context
  - treat contextual `không` as explicit budget clear via `budgetConstraintType = unspecified`
  - distinguish `needs_clarification` from `repair_after_failed_extraction`

### Edge orchestration

- Added ROMI feature flags with hybrid env + DB lookup:
  - `romi_normalization_v2`
  - `romi_knowledge_gating_v1`
  - `romi_auto_broaden_v1`
- Added TTL-cached flag lookup from `romi_feature_flags`.
- Introduced deterministic room-search execution path:
  - resolve `poiHint` with `search_locations` before `search_rooms`
  - canonicalize city aliases like `TP.HCM` into `Thành phố Hồ Chí Minh` before room search execution
  - safe-fail unresolved POI into clarification unless clear admin area already exists
  - exact search first
  - same-district `broaden_location` second
  - guarded `broaden_budget` only for `soft_cap` and only when flag-enabled
- Final response metadata now infers intent from executed tool results as well as planned tool selection, so terse contextual replies like `5 triệu nha` remain tagged as `room_search`.
- Added hardening metadata and analytics hooks for:
  - clarification loops
  - terse budget recovery
  - normalization warnings
  - exact zero-result
  - broaden success / fail
  - repair-after-failed-extraction
- Tightened knowledge retrieval gating so room-search turns only append knowledge when the user truly adds a product/help side-question in the same turn.

### Web `/romi`

- Session preview now prefers repaired or resolved journey summaries over stale clarification prompts.
- Inline clarification card now distinguishes:
  - generic clarification
  - repair-after-failed-extraction
- Fixed a signed-in new-thread regression on `/romi`:
  - clicking `Luồng mới` now keeps the workspace in an explicit fresh draft state instead of snapping back to the most recent saved session
  - session-list reload no longer depends on `selectedSessionId`
  - fresh-draft session selection is now covered by a dedicated unit regression around `resolveLoadedSessionSelection(...)`
- Tightened the chat-first surface so default `/romi` no longer renders extra panels in the main layout:
  - the large concierge hero is removed from the default route surface instead of merely collapsing after the first turn
  - signed-in history is now an on-demand sheet opened from a header action instead of a permanent left rail
  - the main route now opens directly into the chat workspace for both guest and signed-in users

### Schema

- Added `supabase/migrations/20260330183000_add_romi_feature_flags.sql`
- Seeded defaults:
  - `romi_normalization_v2 = true`
  - `romi_knowledge_gating_v1 = true`
  - `romi_auto_broaden_v1 = false`

## Validation

- `deno check supabase/functions/ai-chatbot/index.ts`
- `npm run typecheck --workspace=@roomz/shared`
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`
- `npm run test:unit --workspace=@roomz/web -- src/pages/romi/sessionSelection.test.ts`
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`
- `npm run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings outside ROMI scope
- `npm run build --workspace=@roomz/web`
- `npx ai-devkit@latest lint`
- live Supabase deploy + smoke follow-up:
  - migration `add_romi_feature_flags` applied on `vevnoxlgwisdottaifdn`
  - `ai-chatbot` redeployed to live version `51`
  - direct UTF-8 smokes now pass for:
    - POI + malformed budget clause
    - terse budget reply in clarification context
    - city alias `TP.HCM`
    - mixed-intent room-search + RommZ+ append flow

## Remaining

- `P1` still pending:
  - full signed-in history preview strategy
  - broader analytics dashboards and runbooks
  - post-deploy metric interpretation against real sample thresholds
- No dedicated Deno edge-function test harness was added in this pass.
- `romi_auto_broaden_v1` remains default-off until rollout metrics are ready.
- The shared test command still emits the existing `npm warn Unknown cli config "--grep"` wrapper warning even though the Playwright unit run itself passes.
