---
phase: implementation
task: messaging-stability-pass
date: 2026-03-23
status: complete
---

# Task Log: Messaging Stability Pass

## Goal

- Fix two live messaging regressions:
  - long participant emails overflowing the shared inbox context rail
  - host preview threads snapping to the bottom on every passive refresh

## Files

- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Added defensive wrapping for participant emails in the shared inbox context card.
- Added the same defensive wrapping for landlord thread metadata.
- Changed both message auto-scroll effects to key off the active conversation id and latest message id instead of the whole refreshed message array.

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npx ai-devkit@latest lint`: pending final rerun after docs update

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Retest `/messages` with a very long email and confirm the context rail stays intact.
- Retest `/host?tab=messages` during background polling and confirm the preview thread no longer snaps to the bottom unless a new last message arrives.
