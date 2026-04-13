---
phase: implementation
feature: ai-chatbot
title: AI Chatbot - Implementation Guide
description: ROMI v3 implementation notes for shared contracts, web workspace, and knowledge-only RAG
---

# AI Chatbot - Implementation Guide

## Scope Implemented On 2026-03-27

- `packages/shared`
- `packages/web`
- `supabase/functions/ai-chatbot`
- `supabase/migrations`
- `docs/ai/*`

Mobile was intentionally left unchanged in this phase.

## Stabilization On 2026-04-11

- ROMI routing is now stabilized around a single turn planner instead of letting multiple intent helpers infer independently.
- Web and mobile now consume the same reducer and stream-event contract from `packages/shared`.
- Room, partner, and deal follow-up detail turns now use deterministic entity resolution before any model-driven tool choice.
- Guest throttling is now backed by Postgres minute buckets instead of process memory.

## Incident Hardening On 2026-04-12

- Live session review exposed two separate ROMI trust-breakers:
  - short meta reactions like `"ngáo à?"` could still inherit the previous `find_room` goal and be misclassified back into a room-search tool path
  - when the model looped the same tool repeatedly with identical input, the fallback formatter could dump every repeated tool result into the saved assistant message as `Kết quả 1 ... Kết quả N`
- Local hardening now covers both failure modes:
  - `packages/shared/src/services/ai-chatbot/intake.ts`
    - narrows room-intent carry-forward so only genuine search/detail/refinement cues inherit `find_room`
    - prevents generic meta reactions from being re-routed into `room_search`
    - repairs likely UTF-8 mojibake before Vietnamese normalization so accented runtime prompts still classify correctly
    - tightens room follow-up hint matching with word boundaries so short complaints like `ngáo à?` no longer trigger the `ga` location token by substring accident
  - `supabase/functions/ai-chatbot/tool-result-utils.ts`
    - adds exact tool-result deduplication for repeated model/tool loops
  - `supabase/functions/ai-chatbot/index.ts`
    - caches identical tool executions inside a single request
    - deduplicates identical tool results before fallback response assembly, persisted metadata, action derivation, and telemetry tracking
- Live-vs-local caveat:
  - the incident telemetry captured from `2026-04-12` initially did not fully match the repo planner behavior; `ai-chatbot` has now been redeployed to `vevnoxlgwisdottaifdn`, and the live stream room flow matches the hardened local behavior again

### Shared stabilization details

- `packages/shared/src/services/ai-chatbot/types.ts`
  - adds persistent selection memory on `RomiJourneyState`:
    - `activeEntityType`
    - `activeEntityId`
    - `lastResultSetType`
    - `lastResultIds`
    - `lastResultSourceIntent`
  - adds `selection` metadata to `AIChatMessageMetadata` so clients can explain why ROMI entered a detail turn
  - makes `viewerMode` explicit in the shared request contract instead of silently defaulting to `user`
- `packages/shared/src/services/ai-chatbot/journey.ts`
  - merges the new selection memory fields into persisted journey state
  - includes active-entity context in the user-facing journey summary
- `packages/shared/src/services/ai-chatbot/workspace.ts`
  - centralizes the ROMI workspace reducer, stored-message mapping, guest-history builder, and stream-event application logic
- `packages/shared/src/services/ai-chatbot/api.ts`
  - requires callers to send `viewerMode` explicitly for both normal and streaming requests

### Edge stabilization details

- `supabase/functions/ai-chatbot/planner.ts`
  - introduces `planRomiTurn(...)` as the routing source of truth for `primary intent`, `turn mode`, `target entity`, and selected tools
  - enforces follow-up precedence in this order:
    - explicit UUID
    - ordinal reference against `lastResultIds`
    - active-entity detail phrase
    - search refinement fallback
  - produces deterministic clarification prompts when a selection reference is invalid or out of range
  - records ordered result memory and active entity selection through `buildJourneySelectionPatch(...)`
- `supabase/functions/ai-chatbot/index.ts`
  - executes room, partner, and deal detail turns through a deterministic detail path when the planner already resolved the target entity
  - adds `get_partner_details` and `get_deal_details` so `list -> select -> detail` parity no longer exists only for rooms
  - stops using the first item in a search collection as implicit detail context when the turn is not actually a detail turn
  - emits selection telemetry for resolved and failed follow-up turns
  - fixes `search_partners` and `search_deals` correctness by filtering and sorting active rows before applying the response limit
- `supabase/functions/ai-chatbot/catalog-search.ts`
  - extracts pure partner and deal catalog filtering so search correctness can be regression-tested independently of the edge request handler
- `supabase/functions/ai-chatbot/guest-rate-limit.ts`
  - hashes request-derived guest fingerprints and delegates enforcement to Postgres
- `supabase/migrations/20260411123000_romi_guest_rate_limit.sql`
  - creates durable guest rate-limit buckets and the `consume_romi_guest_rate_limit(...)` helper

### Client stabilization details

- `packages/web/src/components/common/Chatbot.tsx`
  - launcher analytics now fire a dedicated `romi_launcher_clicked` event instead of double-counting `romi_opened`
- `packages/web/src/pages/RomiPage.tsx`
  - analytics payloads now keep chat-session identifiers inside properties instead of leaving a mismatched top-level `session_id`
- `packages/mobile/src/hooks/useAIChatbot.ts`
  - now uses the shared workspace reducer and stream contract
  - sends explicit `viewerMode` for every request
  - allows guest prompting as a first-class flow instead of blocking unauthenticated users
- `packages/mobile/components/AIChatbot.tsx`
  - renders clarification banners, handoff banners, and action CTAs from edge metadata
  - routes supported action chips natively and falls back to the web route for unsupported mobile destinations
- `packages/mobile/components/AIChatMessage.tsx`
  - renders structured action buttons beneath assistant turns

## Stability Hardening On 2026-03-30

- `P0` trust-breaker hardening now landed for ROMI room-search turns:
  - safe merge semantics for persisted journey state
  - POI-aware parsing and normalization
  - budget constraint typing
  - repair-vs-clarify distinction
  - deterministic same-district zero-result recovery
  - feature-flagged auto-broaden guardrails

### Shared hardening details

- `packages/shared/src/services/ai-chatbot/types.ts`
  - added `poiHint`, `budgetConstraintType`, `lastAskedField`, `lastAskedTurnIndex`, `clarificationLoopCounts`, `resolutionOutcome`
  - added hardening metadata such as `searchAttempts`, `searchNormalizationWarnings`, `normalizationConfidence`, and `autoBroadenApplied`
- `packages/shared/src/services/ai-chatbot/journey.ts`
  - now keeps prior values on `undefined`
  - only clears on explicit `null`
  - preserves per-field clarification loop counters
- `packages/shared/src/services/ai-chatbot/intake.ts`
  - splits `poiHint` from `areaHint`
  - strips malformed trailing budget clauses from POI text before normalization tries to resolve the location
  - supports `gần`, `gan`, and `near` style POI prefixes more deterministically
  - parses terse and malformed Vietnamese budget phrases more reliably
  - treats contextual `không` as explicit budget-clear instead of forcing the same clarification loop

### Edge hardening details

- `supabase/functions/ai-chatbot/index.ts`
  - loads hybrid env + DB feature flags
  - forces `search_locations` before `search_rooms` when `poiHint` is present
  - canonicalizes city aliases such as `TP.HCM` to `Thành phố Hồ Chí Minh` before room search execution
  - keeps room-search deterministic with `exact -> broaden_location -> broaden_budget`
  - blocks budget broadening for anything except `soft_cap`
  - infers final intent from executed tool results as well as selected tool names so terse contextual replies keep the correct room-search metadata
  - tracks loop and recovery metadata for later rollout measurement
- `supabase/migrations/20260330183000_add_romi_feature_flags.sql`
  - adds `romi_feature_flags`
  - seeds:
    - `romi_normalization_v2 = true`
    - `romi_knowledge_gating_v1 = true`
    - `romi_auto_broaden_v1 = false`

### Web hardening details

- `packages/web/src/pages/RomiPage.tsx`
  - session preview now prefers repaired or resolved journey summaries over stale assistant clarification prompts
  - inline clarification UI distinguishes repair mode from first-pass clarification

## External Skills Applied

- `inferen-sh/skills@ai-rag-pipeline`
- `wshobson/agents@rag-implementation`
- `wshobson/agents@prompt-engineering-patterns`
- `vercel-labs/vercel-plugin@ai-sdk`
- `ancoleman/ai-design-components@building-ai-chat`

Local repo skills applied during implementation:

- `ai-sdk`
- `frontend-design`
- `react-best-practices`
- `api-patterns`
- `testing-patterns`
- `systematic-debugging`

## Shared Layer Changes

### Contracts

Updated `packages/shared/src/services/ai-chatbot/types.ts` to add:

- `viewerMode`
- `entryPoint`
- `pageContext`
- `journeyState`
- `history`
- knowledge source metadata
- clarification metadata
- handoff metadata
- new stream events for journey updates, clarifications, and handoff

### Helpers

Added:

- `packages/shared/src/services/ai-chatbot/intake.ts`
- `packages/shared/src/services/ai-chatbot/journey.ts`

These shared helpers now centralize:

- Vietnamese intake extraction
- room-search clarification rules
- product-topic detection
- journey summary generation
- state merge logic

### Shared API client

Updated `packages/shared/src/services/ai-chatbot/api.ts` so the web client can:

- send guest requests without requiring a JWT
- send signed-in requests with JWT
- pass guest history locally
- stream from the edge function with the extended contract
- filter sessions by `ROMI_EXPERIENCE_VERSION`

## Knowledge Layer

### Curated corpus

Added `packages/shared/src/constants/romiKnowledge.ts` as the first curated knowledge source of truth.

Current sections include:

- onboarding
- RommZ+ pricing
- verification
- services and deals
- roommate matching
- short-stay / swap

### Database

Added migration:

- `supabase/migrations/20260327160000_romi_v3_knowledge_rag.sql`

This migration:

- extends `ai_chat_sessions` with `experience_version` and `journey_state`
- backfills existing sessions to `romi_legacy`
- creates `romi_knowledge_documents`
- creates `romi_knowledge_chunks`
- adds pgvector indexing
- adds `match_romi_knowledge_chunks(...)`

### Edge retrieval

Added:

- `supabase/functions/ai-chatbot/knowledge.ts`

Key behavior:

- lazily upserts curated docs and chunks
- lazily embeds missing chunks through the AI Gateway embedding model
- uses vector retrieval when embeddings exist
- falls back to lexical ranking when embeddings or retrieval are unavailable

## Edge Function Changes

The public entrypoint remains:

- `supabase/functions/ai-chatbot/index.ts`

Key runtime changes:

- guest mode is now supported
- signed-in mode remains persistent
- old sessions are rejected if they do not match `romi_v3`
- guest rate limiting is handled separately from authenticated rate limiting
- clarification can short-circuit tool execution
- knowledge sources can be injected before or alongside live tools
- final message metadata now carries journey, knowledge, clarification, and handoff state

Added supporting modules:

- `supabase/functions/ai-chatbot/fallback-policy.ts`
- `supabase/functions/ai-chatbot/response-composer.ts`

## Web Workspace Changes

### Route and launcher

- `/romi` is now public in `packages/web/src/router/router.tsx`
- `packages/web/src/components/common/Chatbot.tsx` now routes guests into `/romi` instead of hiding the launcher entirely

### New reducer-driven ROMI page

Added:

- `packages/web/src/pages/romi/reducer.ts`
- `packages/web/src/pages/RomiPage.tsx`

The new workspace introduces:

- guest rail
- signed-in session rail
- reducer-driven streamed message updates
- context rail for journey summary, clarification, handoff, and sources
- action cards inside the thread instead of plain CTA text

## Validation Completed

- `npm run typecheck --workspace=@roomz/shared`
- `npm run lint --workspace=@roomz/web`
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`
- `npm run build --workspace=@roomz/web`
- live Supabase migration applied on `vevnoxlgwisdottaifdn`
- live `ai-chatbot` function deployed on `vevnoxlgwisdottaifdn`
- follow-up live redeploy moved `ai-chatbot` to version `51`
- direct live UTF-8 smokes now confirm:
  - POI parsing no longer swallows malformed budget clauses
  - terse budget replies in clarification context stay on the room-search path
  - mixed-intent room-search + RommZ+ requests remain search-first and append knowledge after the room answer
  - `TP.HCM` alias now resolves into live room results instead of a false `0 results` branch

## Known Gaps

- Knowledge seeding currently still happens on first request rather than through a dedicated seed job.
- The broader transcript-regression suite from the stabilization plan is only partially covered today by planner tests, shared reducer tests, and web E2E.
- Mobile TypeScript validation is currently blocked by a pre-existing workspace issue: missing `mapbox__point-geometry` type definitions.
- Post-deploy hardening metrics still need real sample collection before `romi_auto_broaden_v1` can roll out broadly.
