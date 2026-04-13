---
phase: implementation
task: host-legacy-messaging-premium-avatar
date: 2026-04-13
status: complete
---

# Task Log: Host Legacy Messaging Premium Avatar Coverage

## Goal

- Propagate `is_premium` through the legacy host messaging data path and replace the remaining live host-dashboard avatars with `PremiumAvatar` where the data already exists.

## Files

- `packages/shared/src/services/messages.ts`
- `packages/web/src/hooks/useMessages.ts`
- `packages/web/src/pages/LandlordDashboardPage.tsx`

## What Changed

- Updated the shared legacy messaging service so conversation participants and message senders now carry premium metadata:
  - `conversation_participants` now select `is_premium` from `users`
  - `Conversation.participant` now includes `is_premium`
  - `getConversationMessages()` now selects `is_premium` for each message sender
  - `MessageWithUsers.sender` and `MessageWithUsers.receiver` now allow premium metadata in the typed contract
- Kept the React hook path consistent with the new data shape:
  - `useConversationMessages()` now keeps `is_premium` on the optimistic sender object when the host sends a message from the dashboard
- Replaced the remaining live host-dashboard avatar renderers in `LandlordDashboardPage`:
  - booking queue renter avatar
  - conversation list participant avatar
  - conversation detail participant avatar
  - all three now use `PremiumAvatar` so premium users keep the ring in the legacy host messaging path

## Root Cause

- The legacy messaging service was still selecting only `id`, `full_name`, `avatar_url`, and `email`, so premium state was lost before it reached the dashboard UI.
- The host dashboard still rendered raw `Avatar` components in the inbox lane, so premium metadata would not have been visible even after the shared data path was widened.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npx eslint packages/shared/src/services/messages.ts packages/web/src/hooks/useMessages.ts packages/web/src/pages/LandlordDashboardPage.tsx`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260413-host-legacy-messaging-premium-avatar.md`

## Follow-ups

- No test file was added in this task because there was no nearby messaging-specific test pattern inside the approved file scope.
