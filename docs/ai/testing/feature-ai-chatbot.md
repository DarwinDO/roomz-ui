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
- `npm run build --workspace=@roomz/web`
- `npx ai-devkit@latest lint`

## Latest Results (2026-03-27)

- `npm run typecheck --workspace=@roomz/shared`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`: pass
- `npm run build --workspace=@roomz/web`: pass
- Supabase migration `romi_v3_knowledge_rag` on project `vevnoxlgwisdottaifdn`: pass
- Supabase edge function deploy `ai-chatbot` on project `vevnoxlgwisdottaifdn`: pass
- Direct guest smoke request to the live function: pass
  - returned `sessionId: null`
  - returned guest metadata
  - returned onboarding knowledge sources for the ASCII onboarding smoke query

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
- No Playwright end-to-end spec was added yet for public guest `/romi`.
- The migration and retrieval RPC were not exercised against a live Supabase environment in this task.
