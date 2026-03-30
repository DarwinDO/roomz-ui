---
phase: implementation
task: community-feed-animation-fix
date: 2026-03-26
status: complete
---

# Task Log: Community Feed Animation Fix

## Goal

- Fix the `/community` regression where fetched posts existed in the DOM but the main left feed still looked empty.

## Files

- `packages/web/src/pages/CommunityPage.tsx`
- `packages/web/tests/e2e/community.spec.ts`
- `docs/ai/monitoring/project-status.md`

## What Changed

- Wrapped the left feed column in `/community` with `motion.div` so the section keeps a stable motion context.
- Switched the async-fed featured cards and story cards to `initial="hidden"` plus direct `animate="show"` on mount, with per-card delays, so slow network responses no longer leave the cards stuck in the inherited hidden state at `opacity: 0`.
- Added a Playwright regression test that delays the mocked community feed response and asserts the fetched post titles are still visibly rendered after the async load completes.

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:e2e --workspace=@roomz/web -- community.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: fail due pre-existing unrelated TypeScript errors in `src/components/common/HeroIllustrationPilot.tsx` and `src/pages/LandingPage.tsx`
- `npx ai-devkit@latest lint`: pass

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260326-community-feed-animation-fix.md`

## Follow-ups

- Check `/community` once with a signed-in account and confirm the create-post flow still reveals the new post card immediately after mutation invalidates the feed query.
- If more public pages use a `motion` parent plus a plain `div` column wrapper, review them for the same hidden-card failure mode.
