---
phase: implementation
task: profile-stability-pass
date: 2026-03-21
owner: codex
---

# Task Log: Profile Stability Pass

## Goal

Address the next live-review issues on the protected `/profile` route by:

- fixing the visible text-encoding regression
- removing the navbar shift triggered by the avatar dropdown
- replacing the preferred-area placeholder with a live mini-map whenever coordinates are available

## Changes

### Profile content recovery

- Repaired the user-visible `/profile` strings in `packages/web/src/pages/ProfilePage.tsx`
- Restored readable RommZ copy for the premium card, recent activity, settings, saved rooms, bookings, roommate matches, and preferred-area card
- Kept the Stitch-first layout intact while removing the mojibake regression

### Dropdown stability

- Updated `packages/web/src/components/ui/dropdown-menu.tsx` so dropdown menus default to `modal={false}`
- This prevents the avatar dropdown in the fixed web shell from forcing scroll-lock and shifting the navbar horizontally

### Preferred-area map preview

- Added coordinate recovery in `packages/web/src/pages/ProfilePage.tsx`:
  - use the saved preferred search-area coordinates when they exist
  - otherwise try resolving the saved preferred-area label through `searchLocationCatalog`
- Replaced the static preferred-area image shell with a lazy-loaded `ShopMiniMapbox` preview when coordinates are available
- Kept the static Stitch-style fallback only for contexts where no usable coordinates can be inferred

### Premium CTA contrast follow-up

- Updated the premium CTA in `packages/web/src/pages/ProfilePage.tsx` to use `variant="outline"` plus `bg-none bg-white text-primary`
- This removes the shared gradient background image that was bleeding through the button and making the label `Xem quyền lợi hiện có` unreadable

## Validation

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`: pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass
- Re-ran after the premium CTA follow-up:
  - `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
  - `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass

## Known Limits

- `/profile` still requires a live authenticated visual review in the browser because anonymous automation cannot remain on the protected route
- If a preferred-area snapshot contains only free text and cannot be matched to a location-catalog entry, the preferred-area card will continue to show the static fallback artwork
