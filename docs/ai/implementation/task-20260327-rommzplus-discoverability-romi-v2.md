---
phase: implementation
task: rommzplus-discoverability-romi-v2
date: 2026-03-27
status: completed
---

# Task Log: RommZ+ Discoverability And Romi V2

## Goal

- Make RommZ+ discoverable globally instead of only through contextual upsells
- Rebuild `/romi` into a chat-first assistant workspace
- Upgrade Romi from one-shot replies to a stream-first, always-agentic runtime

## Files

- Updated `packages/web/src/router/AppShell.tsx`
- Updated `packages/web/src/components/common/BottomNav.tsx`
- Updated `packages/web/src/components/common/Chatbot.tsx`
- Updated `packages/shared/src/services/ai-chatbot/types.ts`
- Updated `packages/shared/src/services/ai-chatbot/api.ts`
- Updated `supabase/functions/ai-chatbot/index.ts`
- Updated `packages/web/src/pages/RomiPage.tsx`
- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/planning/feature-roomz-ui-refresh.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/payments.test.ts src/services/romi.test.ts`: blocked locally because `packages/web/src/lib/supabase.ts` requires `supabaseUrl` at import time and the current shell session did not expose the Supabase env vars

## Documentation Updates

- Refreshed the project status snapshot with the RommZ+ utility pill and Romi stream runtime notes
- Marked the discoverability + Romi v2 milestone complete in planning
- Recorded the latest validation results and the local unit-test env blocker in testing

## Follow-ups

- Manually review `/payment` in desktop and mobile shell entry points
- Manually review `/romi` with real streaming turns, room-context threads, and general assistant threads
- If Romi still needs another polish pass, keep the stream-first contract and refine composition instead of falling back to the earlier console-style layout
