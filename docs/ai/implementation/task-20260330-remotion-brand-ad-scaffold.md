---
phase: implementation
title: Remotion Brand Ad Scaffold for RommZ
date: 2026-03-30
---

# Remotion Brand Ad Scaffold for RommZ

## Scope

- Move from dependency-only bootstrap into a usable first Remotion composition
- Keep the first ad template desktop-first at `16:9`
- Include voiceover and soundtrack timeline scaffolding, but keep real audio assets optional
- Stay local-render-first and keep upstream data ownership in the existing app/API layer

## Decisions

- Keep the Remotion surface inside `packages/web/src/remotion` for now instead of creating a separate package
- Model the composition around a serializable `RommzBrandAdProps` contract validated by `zod`
- Compute ad duration from copy density and scene timing via `calculateMetadata`
- Keep voiceover text in the payload so captions and timeline logic work even before real audio files exist
- Support optional soundtrack ducking and optional voiceover track attachment, rather than forcing assets into the repo now

## Implementation

- Added Remotion entry and root:
  - `packages/web/src/remotion/index.ts`
  - `packages/web/src/remotion/Root.tsx`
- Added the first marketing composition:
  - `packages/web/src/remotion/compositions/RommzBrandAd.tsx`
  - `packages/web/src/remotion/compositions/rommzBrandAd.schema.ts`
  - `packages/web/src/remotion/compositions/rommzBrandAd.timeline.ts`
  - `packages/web/src/remotion/compositions/rommzBrandAd.metadata.ts`
- Added local workflow scripts in `packages/web/package.json`:
  - `remotion:studio`
  - `remotion:compositions`
  - `remotion:render`
  - `remotion:render:brand`
  - `remotion:still:brand`

## Template Characteristics

- Visual direction:
  - editorial, asymmetric layout instead of a standard split-screen promo
  - existing RommZ palette from `packages/web/src/index.css`
  - existing RommZ fonts and public assets reused directly
- Runtime structure:
  - intro lead-in
  - three brand scenes: `discover`, `trust`, `move`
  - overlapping sequencing for smoother scene transitions
  - outro with CTA hold window
- Audio scaffolding:
  - payload carries `voiceoverText` per scene and outro
  - bottom caption strip follows active cue timing
  - optional full-track voiceover can be attached later through `audio.voiceover.src`
  - optional soundtrack can be ducked automatically while voiceover cues are active

## Data Contract

- Source of truth stays outside Remotion:
  - existing API
  - existing server actions
- Remotion should only consume normalized props such as:
  - copy
  - logo/image sources
  - stat cards
  - scene palette
  - timing knobs
  - optional audio asset paths
- The current fixture is intentionally serializable so it can later be replaced by a real payload mapper without reworking the composition shape

## Validation

- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npm run remotion:compositions --workspace=@roomz/web`: pass
  - detected composition `RommzBrandAd16x9`
  - resolved metadata `1920x1080`, `30fps`, `994 frames`
- `npm run remotion:still:brand --workspace=@roomz/web`: pass
- `npx remotion still src/remotion/index.ts RommzBrandAd16x9 remotion-renders/rommz-brand-ad-scene-01-v3.png --frame=48`: pass
- `npx ai-devkit@latest lint`: pass

## Follow-up

- Add a real payload normalizer from API or server action into `RommzBrandAdProps`
- Introduce a real voiceover asset and optional soundtrack asset
- Add a small renderer helper so payload selection and local output paths become repeatable
- Decide whether the next template should be:
  - listing ad
  - RommZ+ promo ad
  - service/deal spotlight ad
