---
phase: implementation
task: messaging-layout-normalization-pass
date: 2026-03-23
status: complete
---

# Task Log: Messaging Layout Normalization Pass

## Goal

- Make the shared `/messages` route feel visually normal on desktop after the first inbox redesign.
- Fix the landlord `Tin nhắn` tab so the selected thread history is visible and the panel no longer feels empty or over-stretched.

## Files

- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Relaxed the shared inbox shell:
  - replaced the earlier rigid full-height desktop layout with a more natural center panel
  - kept side rails sticky but lighter so the whole route feels less “boxed in”
- Relaxed the landlord messaging console:
  - bounded the center thread viewport
  - preserved full thread history and internal scroll without leaving a giant blank area

## Validation

- `npx ai-devkit@latest lint`: pending final rerun after docs update
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Review `/messages` live for overall feel, not just overflow correctness.
- Review `/host?tab=messages` with a landlord account and confirm the selected thread no longer looks empty.
