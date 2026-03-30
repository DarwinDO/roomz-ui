---
phase: testing
feature: ai-chatbot
title: AI Chatbot - Testing Strategy
description: Validation plan and current results for ROMI v3 web concierge and knowledge-only RAG
---

# AI Chatbot - Testing Strategy

## Coverage Goals

- Validate shared intake and journey-state extraction.
- Validate reducer behavior for ROMI streaming events.
- Validate web build quality after the `/romi` rebuild.
- Validate that guest/public ROMI flows no longer depend on Supabase auth at request time.

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

## Validation Commands

- `npm run typecheck --workspace=@roomz/shared`
- `npm run lint --workspace=@roomz/web`
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`
- `npm run build --workspace=@roomz/web`
- `deno check supabase/functions/ai-chatbot/index.ts`
- `npx ai-devkit@latest lint`

## Latest Results (2026-03-30)

- `npm run typecheck --workspace=@roomz/shared`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`: pass
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: pass
- `deno check supabase/functions/ai-chatbot/index.ts`: pass
- Supabase migration `romi_v3_knowledge_rag` on project `vevnoxlgwisdottaifdn`: pass
- Supabase migration `add_romi_feature_flags` on project `vevnoxlgwisdottaifdn`: pass
- Supabase edge function deploy `ai-chatbot` on project `vevnoxlgwisdottaifdn`: pass
  - latest live version after follow-up hardening fix: `51`
- Direct guest smoke requests to the live function: pass
  - returned `sessionId: null`
  - returned guest metadata
  - returned search-first mixed-intent replies with appended RommZ+ knowledge
  - returned resolved POI-based room results for `gần đại học ... và từ 5 triệu trở xuống`
  - returned room results for `TP.HCM dưới 5 triệu` after city alias canonicalization
  - returned `room_search` metadata for terse budget replies in clarification context

### Browser coverage added for `/romi`

- chat-first collapse after first turn
- repair clarification label
- mixed-intent search-first reply with appended product knowledge

## Manual Follow-Up

- Verify guest `/romi` flow in a live environment:
  - onboarding prompts should work without login
  - login handoff should appear only when the flow becomes personalized or gated
- Verify signed-in `/romi` flow live:
  - new sessions should persist under `romi_v3`
  - old sessions should not be mixed into the new workspace
  - search / clarification / action cards should remain readable across long conversations
- Verify knowledge retrieval after migration deploy:
  - embeddings should populate successfully
  - vector retrieval should return meaningful sources
  - lexical fallback should still produce usable answers if embeddings are unavailable

## Known Testing Gaps

- No dedicated edge-function test harness was added for Deno runtime behavior.
- The room-search hardening metrics still need real post-deploy sample analysis before `romi_auto_broaden_v1` can roll out broadly.
