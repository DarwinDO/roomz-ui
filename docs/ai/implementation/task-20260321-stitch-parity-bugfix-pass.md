---
phase: implementation
title: Stitch Parity Bugfix Pass
date: 2026-03-21
feature: roomz-ui-refresh
---

# Task Summary

Fix the first round of user-reported Stitch parity regressions on the desktop web port:

- landing search clipping and manual location entry
- landing community grid gap
- room detail gallery spacing and fake map presentation
- roommate location filter, action button visibility, and top nav legibility
- services misnavigation around partner deals
- community featured posts missing imagery
- public branding drift from `RommZ` back to `RoomZ`

# Files Updated

- `packages/web/src/pages/LandingPage.tsx`
- `packages/web/src/pages/RoomDetailPage.tsx`
- `packages/web/src/pages/roommates/components/results/RoommateResults.tsx`
- `packages/web/src/pages/roommates/components/common/RoommateNav.tsx`
- `packages/web/src/pages/CommunityPage.tsx`
- `packages/web/src/router/AppShell.tsx`
- `packages/web/src/components/common/StitchFooter.tsx`
- `packages/web/src/pages/LoginPage.tsx`
- `packages/web/src/pages/SearchPage.tsx`
- `packages/web/src/pages/SupportServicesPage.tsx`
- `packages/web/src/pages/profile/components/ProfileHeader.tsx`
- `packages/web/src/pages/profile/components/UpgradeBanner.tsx`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/implementation/feature-roomz-ui-refresh.md`
- `docs/ai/testing/feature-roomz-ui-refresh.md`

# Implementation Notes

## Landing

- Replaced the mixed search controls with dropdown-based selection for location, budget, and room type.
- Tightened trigger truncation handling to prevent search labels from clipping.
- Kept the already-patched community discussion card at `md:col-span-2` so the grid no longer leaves an empty fourth slot.

## Room Detail

- Changed the gallery to a `large-left + two-top + one-wide-bottom` layout to match Stitch more closely.
- Fixed the `+N ảnh` overlay so it counts only real room images, not Stitch fallback images.
- Replaced the fake static map hero with inline `MapboxRoomMap` rendering while preserving the existing modal flow for expanded map viewing.
- Updated fallback host branding to `Chủ nhà RommZ`.

## Roommates

- Added a real location dropdown using profile/match district-city combinations.
- Made the primary action button readable again by restoring a high-contrast filled style.
- Fixed inactive top nav pills so `Tìm kiếm / Yêu cầu / Profile` remain visible on light backgrounds.

## Community

- Added a visual image block to featured discussion cards using post media first and Stitch fallbacks second.
- Updated the hero branding to `Cộng đồng RommZ`.

## Branding

- Normalized remaining public-facing `RoomZ` strings in the web app to `RommZ`.

# Verification

## Completed

- `eslint` via bundled Cursor `node.exe`: pass with 3 pre-existing hook warnings
- `tsc -b` via bundled Cursor `node.exe`: pass
- `rg -n "RoomZ" packages/web/src -g "*.ts*"`: no remaining matches

## Blocked In This Sandbox

- `npx ai-devkit@latest lint`: `npx` / `npm` unavailable in `PATH`
- `python ...accessibility_checker.py`: `python` unavailable in `PATH`
- `python ...seo_checker.py`: `python` unavailable in `PATH`
- `vite build`: bundled Node available in-session is `20.18.2`, but this repo's Vite build requires `20.19+`; config loading also hit `spawn EPERM`

# Recommended Next Step

Re-open the affected routes with the user and verify the reported issues visually on:

- `/`
- `/services`
- `/community`
- `/roommates`
- `/room/:id`
