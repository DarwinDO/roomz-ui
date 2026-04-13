---
phase: testing
feature: ai-chatbot
title: AI Chatbot - Testing Strategy
description: Validation plan and current results for ROMI v3 web concierge and knowledge-only RAG
---

# AI Chatbot - Testing Strategy

## Coverage Goals

- Validate shared intake and journey-state extraction.
- Validate planner precedence and selection-memory updates for follow-up turns.
- Validate reducer behavior for ROMI streaming events.
- Validate parity for guest and signed-in viewers across web and mobile request contracts.
- Validate web build quality after the `/romi` rebuild.
- Validate that guest/public ROMI flows no longer depend on Supabase auth at request time.
- Validate that partner and deal search filtering does not drop valid matches due to premature limiting.

## Automated Coverage Landed

### Shared / unit-style checks

- `packages/web/src/services/romi.test.ts`
  - ROMI branding and experience version
  - premium copy and curated knowledge alignment
  - Vietnamese intake extraction and journey summary
  - POI parsing without budget pollution
  - terse budget reply recovery
  - soft-cap and range parsing
  - explicit budget-clear handling
  - session preview repair preference

### Workspace reducer checks

- `packages/web/src/pages/romi/reducer.test.ts`
  - token merge behavior
  - tool result merge behavior
  - final metadata merge behavior
  - clarification state handling
  - handoff state handling
  - selection metadata propagation through stored and streamed assistant turns

### Edge planner and rate-limit checks

- `supabase/functions/ai-chatbot/catalog-search_test.ts`
  - partner filtering before limit slicing
  - deal filtering before limit slicing
  - expired or inactive deal removal before the response limit
- `supabase/functions/ai-chatbot/planner_test.ts`
  - explicit UUID selection resolution
  - ordinal follow-up resolution against ordered shortlist memory
  - invalid ordinal clarification fallback
  - ordered result memory patching
  - collection context not collapsing into the first result item
- `supabase/functions/ai-chatbot/guest-rate-limit_test.ts`
  - request fingerprint construction
  - deterministic hashing
  - Postgres RPC enforcement result handling
- `supabase/functions/ai-chatbot/viewer-mode_test.ts`
  - authenticated requests overriding guest payload claims

## Validation Commands

- `npm run typecheck --workspace=@roomz/shared`
- `npm run lint --workspace=@roomz/web`
- `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts src/services/romi.test.ts`
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`
- `npm run build --workspace=@roomz/web`
- `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/guest-rate-limit_test.ts supabase/functions/ai-chatbot/catalog-search_test.ts`
- `deno check supabase/functions/ai-chatbot/index.ts`
- `npx ai-devkit@latest lint`

## Latest Results (2026-04-11)

- `npx ai-devkit@latest lint`: pass
- `npm run typecheck --workspace=@roomz/shared`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts src/services/romi.test.ts`: pass
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: pass
- `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/guest-rate-limit_test.ts supabase/functions/ai-chatbot/catalog-search_test.ts`: pass
- `deno check supabase/functions/ai-chatbot/index.ts`: pass
- `npx tsc -p packages/mobile/tsconfig.json --noEmit`: fail
  - blocker: pre-existing missing type definition file `mapbox__point-geometry`

### Browser coverage added for `/romi`

- chat-first collapse after first turn
- repair clarification label
- mixed-intent search-first reply with appended product knowledge
- follow-up detail selection via ordered shortlist memory
- action and clarification lifecycle after the stabilization pass

## Manual Follow-Up

- Verify guest `/romi` flow in a live environment:
  - onboarding prompts should work without login
  - login handoff should appear only when the flow becomes personalized or gated
- Verify signed-in `/romi` flow live:
  - new sessions should persist under `romi_v3`
  - old sessions should not be mixed into the new workspace
  - search, clarification, and action cards should remain readable across long conversations
- Verify knowledge retrieval after migration deploy:
  - embeddings should populate successfully
  - vector retrieval should return meaningful sources
  - lexical fallback should still produce usable answers if embeddings are unavailable
- Verify mobile parity live:
  - guest suggested prompts should submit successfully
  - clarification and action banners should render with the same metadata semantics as web
  - unsupported action routes should degrade cleanly to web fallback URLs

## Known Testing Gaps

- The larger transcript-regression suite from the stabilization plan is still incomplete; coverage today is planner-focused rather than a full 25-case conversation corpus.
- The room-search hardening metrics still need real post-deploy sample analysis before `romi_auto_broaden_v1` can roll out broadly.
