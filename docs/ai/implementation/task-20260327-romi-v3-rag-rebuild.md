---
phase: implementation
task: romi-v3-rag-rebuild
date: 2026-03-27
status: completed
---

# Task Log: ROMI v3 Rebuild + Knowledge-Only RAG

## Goal

- Rebuild `/romi` into a public-plus-signed-in concierge workspace.
- Add knowledge-only RAG for curated RommZ product information.
- Keep live room, deal, service, and location answers grounded by direct tools instead of RAG.

## Files

### Shared

- Updated `packages/shared/src/constants/index.ts`
- Updated `packages/shared/src/constants/romi.ts`
- Added `packages/shared/src/constants/romiKnowledge.ts`
- Updated `packages/shared/src/services/ai-chatbot/api.ts`
- Updated `packages/shared/src/services/ai-chatbot/index.ts`
- Added `packages/shared/src/services/ai-chatbot/intake.ts`
- Added `packages/shared/src/services/ai-chatbot/journey.ts`
- Updated `packages/shared/src/services/ai-chatbot/types.ts`

### Web

- Updated `packages/web/src/components/common/Chatbot.tsx`
- Updated `packages/web/src/pages/RomiPage.tsx`
- Added `packages/web/src/pages/romi/reducer.ts`
- Added `packages/web/src/pages/romi/reducer.test.ts`
- Updated `packages/web/src/router/router.tsx`
- Updated `packages/web/src/services/romi.test.ts`

### Supabase

- Updated `supabase/functions/ai-chatbot/index.ts`
- Added `supabase/functions/ai-chatbot/knowledge.ts`
- Added `supabase/functions/ai-chatbot/fallback-policy.ts`
- Added `supabase/functions/ai-chatbot/response-composer.ts`
- Added `supabase/migrations/20260327160000_romi_v3_knowledge_rag.sql`

### Docs

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/requirements/feature-ai-chatbot.md`
- Updated `docs/ai/design/feature-ai-chatbot.md`
- Updated `docs/ai/planning/feature-ai-chatbot.md`
- Updated `docs/ai/implementation/feature-ai-chatbot.md`
- Updated `docs/ai/testing/feature-ai-chatbot.md`
- Updated `docs/ai/planning/feature-roomz-ui-refresh.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## What Changed

- Added `ROMI_EXPERIENCE_VERSION = romi_v3` and versioned session filtering.
- Extended the shared AI chat contract to support guest mode, journey state, clarification, and handoff.
- Added shared intake extraction and journey summarization helpers for Vietnamese prompts.
- Added a curated RommZ knowledge corpus plus pgvector-backed retrieval schema and RPC.
- Reworked the edge function so guest chats do not persist, signed-in chats persist under the new version, and knowledge retrieval can ground product answers.
- Rebuilt `/romi` into a reducer-driven workspace with:
  - guest onboarding rail
  - signed-in session rail
  - journey summary rail
  - clarification and login handoff cards
  - grounded source display

## Skills Installed And Applied

- Installed:
  - `inferen-sh/skills@ai-rag-pipeline`
  - `wshobson/agents@rag-implementation`
  - `wshobson/agents@prompt-engineering-patterns`
  - `vercel-labs/vercel-plugin@ai-sdk`
  - `ancoleman/ai-design-components@building-ai-chat`
- Applied local skills:
  - `ai-sdk`
  - `frontend-design`
  - `react-best-practices`
  - `api-patterns`
  - `testing-patterns`
  - `systematic-debugging`

## Validation

- Ran `npx ai-devkit@latest lint` before repo work
- Ran `npm run typecheck --workspace=@roomz/shared`
- Ran `npm run lint --workspace=@roomz/web`
- Ran `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`
- Ran `npm run build --workspace=@roomz/web`
- Applied migration `romi_v3_knowledge_rag` to Supabase project `vevnoxlgwisdottaifdn`
- Deployed Supabase edge function `ai-chatbot` to project `vevnoxlgwisdottaifdn`
- Verified live guest request against `https://vevnoxlgwisdottaifdn.supabase.co/functions/v1/ai-chatbot`
  - `sessionId` stays `null` in guest mode
  - onboarding smoke query can now return `onboarding` knowledge sources

## Follow-Ups

- Add direct edge-function validation for the Deno runtime.
- Replace in-memory guest rate limiting with a durable strategy if guest usage becomes material.
- Verify browser-side Vietnamese unicode prompts end-to-end on `/romi` instead of only via local PowerShell smoke requests.
