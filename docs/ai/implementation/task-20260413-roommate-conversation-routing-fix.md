---
phase: implementation
title: Roommate Conversation Routing Fix
date: 2026-04-13
owner: Codex
status: completed
---

# Roommate Conversation Routing Fix

## Summary

- Fixed the `Nhắn tin` actions in the roommate experience so they open the exact direct conversation with the selected match instead of navigating to a generic inbox state.
- This confirmed the user's suspicion: the roommate messaging CTA was only partially implemented before this fix.

## Problem

- `RoommateResults` and `RequestsList` previously navigated with `/messages?user=<targetUserId>`.
- `MessagesPage` only uses that `user` query param as a best-effort search against existing conversations already loaded in the inbox.
- If no conversation existed yet, or if the lookup missed, the page fell back to the first available conversation.
- That produced a misleading flow where the roommate CTA looked like a direct-message action but could open the wrong thread entirely.

## Changes

- Added `packages/web/src/pages/roommates/utils/openRoommateConversation.ts`.
- Centralized the correct behavior in that helper:
  - validate the current user and target user ids
  - call `startConversation(otherUserId, currentUserId)` to create or reuse the direct thread
  - navigate to `/messages/<conversationId>`
- Updated `packages/web/src/pages/roommates/components/results/RoommateResults.tsx`:
  - connected matches now open the exact conversation id
  - profile-modal `Nhắn tin` uses the same helper path
  - added per-user loading state while the conversation is opening
- Updated `packages/web/src/pages/roommates/components/requests/RequestsList.tsx`:
  - accepted requests now open the exact conversation id instead of using `window.location.href`
  - added loading/disabled state for the accepted-request message button while opening
- Follow-up runtime correction:
  - fixed the relative import path in both roommate component entry points from `../utils/openRoommateConversation` to `../../utils/openRoommateConversation`
  - root cause of the Vite overlay was a path-depth mistake, not a missing helper file
- Added regression coverage in `packages/web/src/pages/roommates/utils/openRoommateConversation.test.ts`.

## Validation

- `npx eslint packages/web/src/pages/roommates/components/results/RoommateResults.tsx packages/web/src/pages/roommates/components/requests/RequestsList.tsx packages/web/src/pages/roommates/utils/openRoommateConversation.ts packages/web/src/pages/roommates/utils/openRoommateConversation.test.ts`
- `npm run test:unit --workspace=@roomz/web -- src/pages/roommates/utils/openRoommateConversation.test.ts`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npm run build --workspace=@roomz/web`
- `npx ai-devkit@latest lint`
