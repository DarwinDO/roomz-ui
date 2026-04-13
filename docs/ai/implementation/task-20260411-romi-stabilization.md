---
phase: implementation
task: romi-stabilization
date: 2026-04-11
status: completed
---

# Task Log: ROMI Stabilization

## Goal

- Stop fixing ROMI one prompt at a time and stabilize the existing chatbot architecture around a single routing source of truth.
- Make follow-up detail turns deterministic for rooms, deals, and partners.
- Bring guest flow, telemetry, and web/mobile state handling back into contract parity.

## Files

- `packages/shared/src/services/ai-chatbot/types.ts`
- `packages/shared/src/services/ai-chatbot/api.ts`
- `packages/shared/src/services/ai-chatbot/index.ts`
- `packages/shared/src/services/ai-chatbot/journey.ts`
- `packages/shared/src/services/ai-chatbot/workspace.ts`
- `packages/shared/src/services/analytics.ts`
- `packages/web/src/components/common/Chatbot.tsx`
- `packages/web/src/pages/RomiPage.tsx`
- `packages/web/src/pages/romi/reducer.ts`
- `packages/web/src/pages/romi/reducer.test.ts`
- `packages/web/src/services/analyticsTracking.ts`
- `packages/mobile/src/hooks/useAIChatbot.ts`
- `packages/mobile/components/AIChatbot.tsx`
- `packages/mobile/components/AIChatMessage.tsx`
- `supabase/functions/ai-chatbot/index.ts`
- `supabase/functions/ai-chatbot/catalog-search.ts`
- `supabase/functions/ai-chatbot/catalog-search_test.ts`
- `supabase/functions/ai-chatbot/planner.ts`
- `supabase/functions/ai-chatbot/planner_test.ts`
- `supabase/functions/ai-chatbot/guest-rate-limit.ts`
- `supabase/functions/ai-chatbot/guest-rate-limit_test.ts`
- `supabase/migrations/20260411123000_romi_guest_rate_limit.sql`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/implementation/feature-ai-chatbot.md`
- `docs/ai/testing/feature-ai-chatbot.md`

## Summary

- Added a single ROMI planner on the edge so each turn now resolves one authoritative combination of:
  - `primary intent`
  - `turn mode`
  - `target entity`
  - `tool list`
- Extended `journey_state` memory with:
  - `activeEntityType`
  - `activeEntityId`
  - `lastResultSetType`
  - `lastResultIds`
  - `lastResultSourceIntent`
- Enforced follow-up precedence so explicit UUIDs, ordered shortlist references, and active-detail phrases resolve before any fresh search refinement can run.
- Added deterministic detail tooling for partners and deals, then wired ROMI detail replies to carry the selected entity as real context instead of defaulting to the first search result.
- Fixed partner and deal search correctness by filtering and sorting active rows before applying the response limit.
- Replaced the in-memory guest rate-limit map with a Postgres-backed minute bucket keyed by a hashed guest fingerprint.
- Extracted the ROMI workspace reducer and stream-event mapper into `packages/shared` so web and mobile now consume the same clarification, handoff, action, journey, and selection contract.
- Promoted mobile guest ROMI to a first-class path that can submit prompts, render clarification and handoff banners, and surface action CTAs from metadata.
- Split launcher tracking from page-open tracking and added selection success/failure telemetry for follow-up debugging.

## Validation

- `npx ai-devkit@latest lint`
- `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/guest-rate-limit_test.ts supabase/functions/ai-chatbot/catalog-search_test.ts`
- `deno check supabase/functions/ai-chatbot/index.ts`
- `npm run typecheck --workspace=@roomz/shared`
- `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts src/services/romi.test.ts`
- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`

## Known Follow-Up

- `npx tsc -p packages/mobile/tsconfig.json --noEmit` still fails because the workspace is missing the pre-existing type definition file `mapbox__point-geometry`.
- The broader transcript-regression suite from the stabilization plan is still not fully implemented; current coverage is centered on planner, reducer, and `/romi` browser flows.
