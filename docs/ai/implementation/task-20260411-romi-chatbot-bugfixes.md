---
phase: implementation
task: romi-chatbot-bugfixes
date: 2026-04-11
status: completed
---

# Task Log: ROMI Chatbot Bugfixes

## Goal

- Fix the ROMI bugs found in review across the web workspace and the `ai-chatbot` edge runtime
- Remove stale UI state that survived into later turns
- Close the auth/viewer-mode loophole where authenticated callers could still force guest behavior
- Add regression coverage for the repaired ROMI flows

## Files

- `supabase/functions/ai-chatbot/index.ts`
- `supabase/functions/ai-chatbot/viewer-mode.ts`
- `supabase/functions/ai-chatbot/viewer-mode_test.ts`
- `packages/web/src/pages/RomiPage.tsx`
- `packages/web/src/pages/romi/reducer.ts`
- `packages/web/src/pages/romi/reducer.test.ts`
- `packages/web/tests/e2e/romi.spec.ts`
- `docs/ai/monitoring/project-status.md`

## Summary

- Forced authenticated edge-function callers onto `user` mode even if the request payload tried to claim `guest`, so ROMI now uses the authenticated persistence and rate-limit path whenever a valid user token is present.
- Cleared stale clarification and handoff UI state when a new user turn starts and when a normal final reply resolves the prior follow-up.
- Reworked saved-session hydration so switching threads clears the old chat viewport instead of briefly showing the previous thread under the new session title.
- Converted ROMI stream failures into a real assistant error bubble instead of leaving the placeholder stuck in a fake “still typing” state.
- Replaced the nested session-row `button` pattern with a keyboard-accessible wrapper so the delete button no longer sits inside another button.

## Validation

- `deno test supabase/functions/ai-chatbot/viewer-mode_test.ts`
- `deno check supabase/functions/ai-chatbot/index.ts`
- `npm run test:unit --workspace=@roomz/web -- src/pages/romi/reducer.test.ts src/pages/romi/sessionSelection.test.ts`
- `npm run test:e2e --workspace=@roomz/web -- romi.spec.ts`
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings in unrelated files
- `npm run build --workspace=@roomz/web`

## Remaining Follow-Ups

- The web workspace still has the same unrelated hook warnings in `useConfirm.tsx`, `ResetPasswordPage.tsx`, and `admin/RevenuePage.tsx`.
- ROMI still does not have a larger dedicated Deno integration suite beyond the new viewer-mode helper test and existing browser coverage.
