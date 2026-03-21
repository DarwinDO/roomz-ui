---
phase: implementation
title: Stitch Parity Bugfix Pass 2
date: 2026-03-21
feature: roomz-ui-refresh
---

# Task Summary

Fix the second round of user-reported Stitch parity regressions on the desktop web port:

- landing search rail still looked misaligned and only exposed a tiny hardcoded location set
- roommate desktop filter still had a cramped `Khu vuc` field
- community featured posts needed a better media treatment and a scalable answer for multi-image posts
- services deals still looked like `Xem toan bo uu dai` did nothing visible
- login still had an oversized floating copy card plus confusing public account copy

# Files Updated

- `packages/web/src/pages/LandingPage.tsx`
- `packages/web/src/pages/roommates/components/results/RoommateResults.tsx`
- `packages/web/src/pages/CommunityPage.tsx`
- `packages/web/src/pages/ServicesHubPage.tsx`
- `packages/web/src/pages/LoginPage.tsx`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/implementation/feature-roomz-ui-refresh.md`
- `docs/ai/testing/feature-roomz-ui-refresh.md`

# Implementation Notes

## Landing

- Switched the location source to the full `PROVINCES` dataset from `vietnam-locations.ts`.
- Kept the search controls dropdown-based, widened the first filter column, and locked the CTA width so the Stitch search shell stays aligned.
- Preserved the previously fixed community grid span pattern.

## Roommates

- Compacted long city labels such as `Thanh pho Ho Chi Minh` into `TP.HCM` so the filter trigger fits the desktop layout.
- Rebalanced the four-column filter rail so the location control gets more width than age and occupation.

## Community

- Added a media-aware renderer for featured posts.
- Single-image posts now show a contained hero image instead of a narrow cropped strip.
- Multi-image posts now switch to a small gallery with a `+N anh` overlay on the last visible tile.

## Services

- Added an in-place expand/collapse flow for `Xem toan bo uu dai`.
- Expanded state now reveals the full voucher catalog plus a dedicated `Doi tac gan ban` section so the action reads as a real content change.

## Login

- Reduced the size of the floating editorial card and pushed it further off the main image.
- Removed the public admin-login shortcut.
- Replaced the ambiguous `Tao ho so` CTA with explanatory copy about first-time account creation after successful sign-in.

# Verification

- `C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint`: pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\Program Files\cursor\resources\app\resources\helpers\node.exe ..\..\node_modules\typescript\bin\tsc -b`: pass
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass
- Playwright preview check:
  - `/`: landing search bar renders the widened filter shell
  - `/services`: `Xem toan bo uu dai` expands and toggles to `Thu gon uu dai`
  - `/community`: featured card now shows a near-full image block
  - `/login`: public admin login link is gone and the floating copy card is smaller

# Recommended Next Step

Re-review the affected routes with the user:

- `/`
- `/services`
- `/community`
- `/roommates`
- `/room/:id`
- `/login`

If accepted, the next real implementation step should be generating the missing Stitch screens for `Search`, `Short-stay / Swap`, `Profile`, and `Landlord Dashboard` before porting more surfaces.
