---
phase: implementation
task: message-quick-replies-toggle-pass
date: 2026-03-23
status: complete
---

# Task Log: Message Quick-Replies Toggle Pass

## Goal

- Make the quick-reply chip strips optional in both shared and landlord messaging so they stop obstructing the reading area when they are not needed.

## Files

- `packages/web/src/pages/MessagesPage.tsx`
- `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Added a show/hide toggle to the shared `/messages` composer.
- Added a matching show/hide toggle to the landlord inline messaging console in `/host?tab=messages`.
- Set both quick-reply strips to start collapsed so the chat history gets more visible room by default.
- Converted both quick-reply strips into popovers so opening them no longer pushes the page or the chat panel taller.

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npx ai-devkit@latest lint`: pending final rerun after docs update

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Review `/messages` live and confirm the hidden-by-default composer feels less cramped on long conversations.
- Review `/host?tab=messages` with a landlord account and confirm toggling suggestions does not steal too much space from the active thread.
