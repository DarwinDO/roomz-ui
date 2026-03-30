---
phase: planning
feature: ai-chatbot
title: AI Chatbot - Project Planning & Task Breakdown
description: ROMI v3 execution plan for knowledge-only RAG, guest support, and web workspace rebuild
---

# AI Chatbot - Project Planning & Task Breakdown

## Milestones

- [x] Milestone 1: Confirm ROMI v3 scope and keep mobile out of phase 1
- [x] Milestone 2: Install requested external chatbot / RAG / prompt skills
- [x] Milestone 3: Extend shared contracts for viewer mode, journey state, and new stream events
- [x] Milestone 4: Add knowledge schema and retrieval layer in Supabase
- [x] Milestone 5: Rebuild `/romi` into a reducer-driven web workspace
- [x] Milestone 6: Add guest access, clarification flow, and login handoff behavior
- [x] Milestone 7: Update lifecycle docs and validation logs

## Delivery Breakdown

### Phase 1: Skill and repo preparation

- [x] Run `npx ai-devkit@latest lint`
- [x] Read current project status and existing AI chatbot lifecycle docs
- [x] Install requested external skills:
  - `inferen-sh/skills@ai-rag-pipeline`
  - `wshobson/agents@rag-implementation`
  - `wshobson/agents@prompt-engineering-patterns`
  - `vercel-labs/vercel-plugin@ai-sdk`
  - `ancoleman/ai-design-components@building-ai-chat`

### Phase 2: Shared contracts and ROMI state model

- [x] Extend `AIChatRequest`
- [x] Extend `AIChatStreamEvent`
- [x] Add shared journey-state helpers
- [x] Add shared intake analysis helpers
- [x] Update shared API transport for guest + signed-in flows

### Phase 3: Runtime and knowledge layer

- [x] Add migration for:
  - `experience_version`
  - `journey_state`
  - `romi_knowledge_documents`
  - `romi_knowledge_chunks`
  - retrieval RPC
- [x] Add curated knowledge corpus seed data
- [x] Add edge-function knowledge retrieval helpers
- [x] Add clarification and guest handoff helpers
- [x] Thread journey state and knowledge sources through streaming and non-streaming responses

### Phase 4: Web workspace rebuild

- [x] Make `/romi` public
- [x] Keep the launcher available for guests
- [x] Replace the prior page orchestration with a reducer-based workspace state
- [x] Add guest rail, signed-in session rail, context rail, and action cards
- [x] Pass guest history locally instead of persisting guest messages

### Phase 5: Validation and docs

- [x] Add reducer-focused ROMI unit tests
- [x] Add shared-intake / knowledge alignment tests
- [x] Re-run web lint, unit tests, and build
- [x] Re-run shared typecheck
- [x] Refresh project status and AI chatbot lifecycle docs

## Deferred Work

- [ ] Add dedicated edge-function tests or Deno-level validation
- [ ] Replace in-memory guest rate limiting with a durable shared strategy
- [ ] Bring mobile onto the ROMI v3 contract
- [ ] Extract more legacy orchestration out of `supabase/functions/ai-chatbot/index.ts`
- [ ] Run browser-level validation for Vietnamese guest prompts and signed-in persistence on the live `/romi` route

## Risks

- The edge runtime is only indirectly validated through shared typecheck and web-facing tests in this task.
- Lazy knowledge seeding may add latency to the first request after deploy or cold start.
- Guest flows depend on local browser memory until login, so refreshing the page drops guest history by design.

## Acceptance

- Guests can open `/romi` and receive grounded onboarding or product answers without authentication.
- Signed-in users receive versioned session persistence and structured journey carry-over.
- Product knowledge answers can cite curated sources from the new knowledge layer.
- Room, deal, and service discovery remain live-data-first.
- The web app still passes lint, relevant unit tests, build, and shared typecheck after the rebuild.
