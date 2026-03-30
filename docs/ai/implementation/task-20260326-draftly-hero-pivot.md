---
phase: implementation
title: Draftly-like Hero Pivot For Landing And Login
date: 2026-03-26
owner: codex
feature: roomz-ui-refresh
---

# Task Summary

- Pivot the landing/login hero direction away from runtime Three.js scenes.
- Replace the old WebGL pilot with a Draftly-like layered illustration approach.
- Keep the entry routes memorable, light, and readable without introducing a heavy runtime 3D dependency.

# Changes Made

- Added `packages/web/src/components/common/HeroIllustrationPilot.tsx`
  - shared layered hero system for `/` and `/login`
  - soft pointer-driven parallax
  - atmospheric blobs, stacked image slabs, and floating info cards
- Updated `packages/web/src/pages/LandingPage.tsx`
  - removed the old lazy R3F pilot wiring
  - mounted `LandingHeroIllustration`
- Updated `packages/web/src/pages/LoginPage.tsx`
  - removed the old lazy R3F pilot wiring
  - mounted `LoginHeroIllustration`
- Removed obsolete runtime pilot files
  - `packages/web/src/components/3d/HeroAccentPilot.tsx`
  - `packages/web/src/lib/threePilot.ts`
- Removed old runtime dependencies from `packages/web/package.json`
  - `three`
  - `@react-three/fiber`
  - `@react-three/drei`
- Refreshed `package-lock.json` to drop the removed dependencies

# Why This Pivot

- The earlier runtime pilot read more like a low-poly WebGL prototype than a polished Draftly-like hero.
- The new direction keeps the memorable, premium fold treatment while avoiding:
  - heavy WebGL runtime cost
  - device gating complexity
  - art-direction mismatch between login and landing

# Validation

- `npx ai-devkit@latest lint`
- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`

# Review Target

- `/`
- `/login`

# Notes

- This pivot changes the hero medium, not the overall brand direction.
- The product remains Stitch-first across desktop routes; only the entry hero treatment is now closer to a Draftly-like layered illustration style.
