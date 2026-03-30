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
- direct guest smoke request against the live function returned a real ROMI reply with guest metadata and onboarding knowledge sources

## Known Gaps

- No direct Deno/edge-function test suite was added in this task.
- Guest rate limiting is still in-memory.
- Knowledge seeding currently happens on first request rather than through a dedicated seed job.
- Browser-side Vietnamese unicode prompts still need a real `/romi` UI verification pass after the live rollout.
