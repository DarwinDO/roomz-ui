---
phase: implementation
task: messaging-scroll-containment-pass
date: 2026-03-22
status: complete
---

# Task Log: Messaging Scroll Containment Pass

## Goal

- Fix the host inline inbox so older messages do not disappear from the preview lane.
- Fix the shared `/messages` route so long conversations scroll inside the chat workspace instead of stretching the full page.

## Files

- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Removed the host preview truncation that only showed the latest 6 messages.
- Added independent scroll containers to the host preview lane and the shared inbox chat workspace.
- Constrained desktop chat card heights with `min-h-0` layout chains so the composer stays visible while the message history scrolls.
- Added more defensive text wrapping for long message content.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Review `/host?tab=messages` with a landlord account and confirm older messages remain reachable by scrolling.
- Review `/messages` with a long thread and confirm the chat panel scrolls internally while the composer stays visible.
