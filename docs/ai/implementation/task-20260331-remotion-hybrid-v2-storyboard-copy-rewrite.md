---
phase: implementation
title: Remotion Hybrid Product Launch V2 Storyboard and Copy Rewrite
date: 2026-03-31
---

# Remotion Hybrid Product Launch V2 Storyboard and Copy Rewrite

## Scope

- Rewrite the renter-first hybrid product-launch ad so its language speaks to end users rather than internal product or engineering audiences
- Keep the current seven-scene technical structure intact for now, while moving the creative direction closer to a user-facing ad
- Record the intended `v2` storyboard in docs so a later structural edit can shorten or recut the ad without redoing the thinking

## Decisions

- `V2` is renter-first and outcome-first: the main promise is now `Tìm phòng rõ hơn, chốt nhanh hơn`
- The current code structure keeps `ROMI` and `Support` scenes, but both must read as supporting proof points, not as the thesis
- The scene set is not shortened in code yet; this turn focuses on copy, caption, and narrative voice
- English/internal labels inside the composition should also be rewritten, otherwise the ad still feels like a product demo

## Implementation

- Added the design source of truth for `v2`:
  - `docs/ai/design/feature-remotion-hybrid-product-launch-v2.md`
- Rewrote the hybrid fixture copy in:
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.schema.ts`
- Rewrote supporting in-composition labels in:
  - `packages/web/src/remotion/compositions/RommzProductLaunchHybrid.tsx`
- Kept scene ids and durations unchanged so the current animation and capture pipeline remain valid

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npm run remotion:audio:product --workspace=@roomz/web`: pass
  - current provider: `edge-tts`
  - current voice: `vi-VN-HoaiMyNeural`
- `npm run remotion:render:product --workspace=@roomz/web`: pass
  - Playwright capture step: `5/5` passed
  - preview audio regenerated from the rewritten Vietnamese copy
  - hybrid MP4 rendered successfully after the rewrite

## Follow-up

- Review whether the new copy feels renter-first enough or still needs another pass toward more emotional / less descriptive language
- If the story still feels dense, the next structural cut should remove or compress the `Support` scene before touching the core `search -> listings -> shortlist` spine
- After copy approval, revisit durations and transitions instead of adding more features to the cut
