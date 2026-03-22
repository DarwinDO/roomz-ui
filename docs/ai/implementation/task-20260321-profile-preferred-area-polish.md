---
phase: implementation
task: profile-preferred-area-polish
date: 2026-03-21
owner: codex
---

# Task Log: Profile Preferred Area Polish

## Goal

Address the latest live-review feedback on the Stitch-first `/profile` route by:

- improving the readability and branding of the premium promo card
- tightening overly loose micro-typography
- integrating the `Vung tim kiem uu tien` card with the real search journey instead of leaving it as a static placeholder

## Changes

### Search-to-profile integration

- Added `packages/web/src/lib/preferredSearchArea.ts` to persist the latest preferred search context in local storage
- Wired `/search` to save preferred-area state from:
  - explicit location selection
  - current-location search
  - quick area chips
  - submitted free-text search
- Reused the stored search path and area metadata inside `/profile`

### Profile polish

- Updated the premium promo card styling in `packages/web/src/pages/ProfilePage.tsx`
- Swapped the stale `Atlas Plus` label to `RommZ+`
- Increased contrast on the promo card shell and button treatment
- Tightened several over-tracked micro-labels in the profile dashboard
- Reworked the preferred-area card so it now points back to the last relevant `/search` state

## Validation

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`: pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass

## Known Limits

- `/profile` still needs a live authenticated visual review because anonymous automation cannot stay on the protected route
- The 3 existing hook warnings remain outside the scope of this task:
  - `packages/web/src/hooks/useConfirm.tsx`
  - `packages/web/src/pages/ResetPasswordPage.tsx`
  - `packages/web/src/pages/admin/RevenuePage.tsx`
