---
phase: implementation
title: Payment + Romi Utility Bugfix Pass
date: 2026-03-27
---

# Payment + Romi Utility Bugfix Pass

## Scope

- Remove redundant premium-page hero noise on `/payment`
- Stop Romi from rendering meaningless assistant replies like `...`

## Root Cause

- `/payment` still carried an extra explanatory badge in the hero chip row even though the active-premium state was already visible elsewhere on the page.
- `/romi` could hydrate old assistant rows whose stored content was only `...`, and the stream final handler also allowed effectively empty assistant text to fall through into the UI.

## Changes

- Updated `packages/web/src/pages/PaymentPage.tsx`
  - removed the redundant explanatory badge from the hero chip row
- Updated `packages/web/src/pages/RomiPage.tsx`
  - added a guard for meaningless assistant text (`""`, `...`, `…`)
  - filtered those rows out of stored-history hydration when they have no useful metadata
  - replaced empty streamed assistant finals with the existing fallback sentence
  - replaced the outer session-card `button` with a keyboard-accessible `div role="button"` wrapper so the inner delete control no longer creates invalid `button > button` HTML

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

## Follow-up Manual Review

- `/payment`
  - confirm the hero no longer feels like it has an extra redundant top notice
- `/romi`
  - confirm old `...` assistant bubbles no longer show up
  - confirm new streamed replies never settle into a dot-only bubble
