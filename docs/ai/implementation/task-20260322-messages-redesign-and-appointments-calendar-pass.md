---
phase: implementation
task: messages-redesign-and-appointments-calendar-pass
date: 2026-03-22
status: complete
---

# Task Log: Messages Redesign And Appointments Calendar Pass

## Goal

- Redesign the shared `/messages` route so it works for both room-context inquiry threads and direct user-to-user conversations.
- Make the host appointments calendar at `/host?tab=appointments` feel less cramped without removing the interactive month/day behavior shipped earlier.

## Files

- Redesigned shared inbox:
  - `packages/web/src/pages/MessagesPage.tsx`
- Relaxed the host appointments rail:
  - `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Replaced the older generic messages layout with a Stitch-first multi-context inbox:
  - searchable conversation rail
  - context filters for all, unread, room-linked, and direct threads
  - central chat workspace with quick replies and inline composer
  - desktop context rail that adapts to the active thread type
- Kept room-aware host/renter conversations readable without forcing renter-to-renter chats into the same room-inquiry treatment.
- Widened the host appointments calendar rail and added a selected-day summary so the calendar reads as an active planning surface instead of a tight decorative strip.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Review `/messages` live with both thread types:
  - room-context thread
  - direct user-to-user thread
- Review `/host?tab=appointments` live with a landlord account to confirm the widened calendar rail feels less rigid.
- If the user accepts both surfaces, lock the host + messaging stack and move to the broader desktop review sweep.
