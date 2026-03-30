---
phase: requirements
feature: ai-chatbot
title: AI Chatbot - Requirements & Problem Understanding
description: ROMI v3 concierge requirements for public discovery, signed-in workspace, and knowledge-only RAG
---

# AI Chatbot - Requirements & Problem Understanding

## Problem Statement

- The earlier ROMI flow mixed support, search orchestration, and UI state into one oversized web surface and one monolithic edge function.
- The old runtime had no retrieval layer for curated product knowledge, so onboarding, pricing, policy, and entitlement answers depended on static constants or prompt memory.
- Signed-out users could not meaningfully access ROMI, which made discovery and early trust-building weaker than the product needed.
- `/romi` needed to feel like a real concierge workspace instead of a dressed-up support drawer.

## Users Affected

- Signed-out visitors who need to understand what RommZ is, where to start, and whether the product fits their needs.
- Signed-in room seekers who need guided clarification before room, deal, or service suggestions become useful.
- Support and growth flows that depend on accurate pricing, policy, and onboarding answers.

## Primary Goals

1. Rebuild ROMI into a web-first concierge that supports both `guest` and signed-in `user` journeys.
2. Add knowledge-only RAG for curated RommZ information:
   - onboarding
   - pricing
   - policies
   - feature eligibility
   - verification
   - premium / services / roommate / short-stay explanations
3. Keep live room, deal, service, and location discovery tool-first so answers remain current.
4. Persist new-version sessions only for signed-in users while allowing guests to use ROMI without DB persistence.
5. Make `/romi` readable as a guided workspace with clearer intake, context summary, and next actions.

## Non-Goals

- Mobile chatbot parity in this phase.
- Replacing live room inventory with RAG.
- Automatic booking, payment, or destructive account actions by the assistant.
- Migrating old ROMI session history into the new experience version.

## User Stories

- As a guest, I want to ask where to start on RommZ so I can understand the platform before logging in.
- As a guest, I want ROMI to explain pricing, verification, and premium benefits from trustworthy product knowledge.
- As a signed-in user, I want ROMI to clarify my room needs before jumping into search results.
- As a signed-in user, I want ROMI to combine live room/deal/service data with grounded policy or product explanations when needed.
- As a signed-in user, I want my new ROMI workspace to remember my journey context across turns.

## UX Requirements

- `/romi` must support two explicit states:
  - `discover / intake`
  - `concierge workspace`
- Guests must be allowed to use ROMI for public discovery without authentication.
- Guest flows must hand off to login only when the next step requires personalization, persistence, or gated access.
- The UI must expose:
  - what ROMI understood
  - what information sources it used
  - why a recommendation matches
  - what action the user should take next

## Runtime Requirements

- `AIChatRequest` must carry:
  - `viewerMode`
  - `entryPoint`
  - `pageContext`
  - partial `journeyState`
- `AIChatStreamEvent` must support:
  - `journey_update`
  - `clarification_request`
  - `handoff`
- `ai_chat_sessions` must store:
  - `experience_version`
  - `journey_state`
- Guest conversations must not create DB sessions or DB messages.
- Signed-in conversations must persist only under the new experience version.

## Knowledge Requirements

- RAG corpus must be curated, not open-ended.
- The first corpus must include:
  - onboarding guidance
  - RommZ+ pricing and entitlements
  - verification
  - services and deals
  - roommate matching
  - short-stay / sublet / swap guidance
- Retrieval must return source metadata so the UI can expose grounded sources.

## Success Criteria

- ROMI answers public product questions with curated knowledge instead of vague generic responses.
- Guest users can access ROMI from the web and receive meaningful onboarding value before login.
- Signed-in users receive clearer intake, clarification, and action-oriented recommendations.
- `/romi` no longer depends on a single page-level state blob for streaming updates.
- Shared request/stream contracts support the new workspace without breaking current web build quality.

## Constraints & Assumptions

- Scope is `packages/web`, `packages/shared`, `supabase/functions/ai-chatbot`, and the supporting Supabase migration only.
- Supabase/Postgres remains the storage layer for sessions and embeddings.
- Embeddings use the AI Gateway model configured server-side.
- Mobile remains on the older contract until a later phase.

## Open Items

- Apply the new migration in the target Supabase environment and verify pgvector availability there.
- Add broader runtime validation for the edge function outside the current web-focused unit/build checks.
- Decide whether lazy knowledge seeding on first request remains acceptable or should move to an explicit seed job.
