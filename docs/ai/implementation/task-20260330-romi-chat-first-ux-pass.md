---
phase: implementation
title: ROMI Chat-First UX Pass
date: 2026-03-30
---

# ROMI Chat-First UX Pass

## Scope

- Reduce `/romi` from a visibly tool-heavy workspace into a chat-first surface after the first turn
- Keep clarification and handoff visible only when they help the user continue the conversation
- Add a focused browser test for the guest `/romi` flow

## Root Cause

- `ROMI v3` exposed too much internal structure on first use:
  - an oversized intro hero stayed visible even after the conversation had clearly started
  - the right context rail surfaced journey and knowledge scaffolding that felt more like debug or operator UI than renter-facing chat
  - the left history rail still appeared too early and visually over-explained a single fresh thread

## Changes

- Updated `packages/web/src/pages/RomiPage.tsx`
  - the intro hero now behaves like an empty state and disappears after the first user turn
  - the main header now compresses journey context into a short summary plus compact chips instead of a full side rail
  - the history rail now only appears when a signed-in user has meaningful session history to manage
  - clarification and handoff are now rendered inline near the composer instead of in a dedicated right rail
  - removed the always-visible `Journey` and `Knowledge đã dùng` side surfaces from the default user-facing layout
- Added `packages/web/tests/e2e/romi.spec.ts`
  - verifies the guest `/romi` flow collapses into a chat-first layout after the first message
  - verifies the old intro and side-panel labels are no longer present after the first streamed response

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"`: pass
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
  - recorded the new chat-first UX direction for `/romi`
  - recorded the new `/romi` guest E2E coverage

## Follow-up Manual Review

- Review signed-in `/romi` with multiple real sessions to confirm the history rail only appears when it is genuinely useful
- Decide whether the inline clarification card should stay or be reduced further into a lighter composer hint
