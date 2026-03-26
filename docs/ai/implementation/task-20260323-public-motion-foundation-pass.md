---
phase: implementation
task: public-motion-foundation-pass
date: 2026-03-23
status: complete
---

# Task Log: Public Motion Foundation Pass

## Goal

- Add a shared Framer Motion foundation and a first public-motion polish pass for the Stitch-first public routes without introducing layout shift or heavy animation.

## Files

- `packages/web/src/lib/motion.ts`
- `packages/web/src/pages/LandingPage.tsx`
- `packages/web/src/pages/LoginPage.tsx`
- `packages/web/src/pages/ServicesHubPage.tsx`
- `packages/web/src/pages/CommunityPage.tsx`

## What Changed

- Added a shared `createPublicMotion` helper for reveal, stagger, hover, and tap states.
- Wired reduced-motion-safe entrance motion into:
  - `/`
  - `/login`
  - `/services`
  - `/community`
- Limited the motion layer to transform/opacity-based transitions so the public shell stays stable.
- Added light hover and press feedback to high-visibility public CTAs and cards instead of introducing page-scale transitions.

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npx ai-devkit@latest lint`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-roomz-ui-refresh.md`
- Updated `docs/ai/testing/feature-roomz-ui-refresh.md`

## Follow-ups

- Review the public motion feel on `/`, `/login`, `/services`, and `/community`
- If the public-motion pass is accepted, extend the same shared presets to `/search`, `/messages`, and `/host`
- Keep 3D deferred until both the public and product motion passes are approved
