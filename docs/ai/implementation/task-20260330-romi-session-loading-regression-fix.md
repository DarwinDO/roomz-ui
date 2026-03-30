---
phase: implementation
title: ROMI Session Loading Regression Fix
date: 2026-03-30
---

# ROMI Session Loading Regression Fix

## Scope

- Stop `/romi` from visually dropping into a blank loading skeleton right after the first user message
- Preserve the active session selection while the session rail hydrates in the background

## Root Cause

- The initial session-list load path still captured an older `selectedSessionId` value and could overwrite a freshly created or selected thread once the async fetch resolved.
- The chat viewport rendered the loading skeleton whenever `messagesLoading` became `true`, even if the active workspace already had hydrated messages to show.

## Changes

- Updated `packages/web/src/pages/RomiPage.tsx`
  - changed the session-hydration selection update to use a functional setter so an already-selected session is not replaced by stale closure state
  - gated the center-panel loading skeleton so it only appears when the workspace truly has no messages yet

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
  - recorded the `/romi` session-hydration regression fix and its validation status

## Follow-up Manual Review

- Confirm on a signed-in browser session that the first sent message stays visible while session hydration finishes
- Confirm background session refresh no longer swaps an active thread out for placeholder skeleton cards
