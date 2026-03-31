---
phase: implementation
title: Remotion Hybrid Product Launch Preview Audio Pack
date: 2026-03-31
---

# Remotion Hybrid Product Launch Preview Audio Pack

## Scope

- Extend the renter-first hybrid product-launch ad with local preview audio instead of leaving the composition visual-only
- Keep the workflow local-first and dependency-light, using repo scripts instead of external render orchestration
- Preserve the existing Remotion contract where audio stays an asset concern outside the composition logic

## Decisions

- Preview audio is treated as a local fixture pack, not a final production asset
- Voiceover generation should prefer Vietnamese `edge-tts` on the local workstation and only fall back to PowerShell `System.Speech` when that provider is unavailable
- The generated Vietnamese voiceover is good enough for timing and local review, but it is still treated as a preview/prototyping asset rather than the guaranteed final production delivery
- The soundtrack should be generated directly in Node so the repo keeps a zero-extra-dependency fallback even if TTS is unavailable
- The default product render command should now prefer generated preview audio automatically

## Implementation

- Added the local preview audio generator:
  - `packages/web/scripts/remotion/generateProductLaunchHybridAudio.ts`
- Added a tracked ignore boundary for generated preview assets:
  - `packages/web/public/remotion/audio/.gitignore`
- Updated `packages/web/scripts/remotion/renderProductLaunchHybrid.ts` so it can:
  - generate preview audio before render
  - attach generated voiceover and soundtrack automatically when requested
  - keep user-supplied `--voiceover=` and `--soundtrack=` overrides as higher priority
- Updated `packages/web/package.json`:
  - added `remotion:audio:product`
  - upgraded `remotion:render:product` to generate preview audio before rendering

## Generated Assets

- Preview voiceover script text now writes to:
  - `packages/web/public/remotion/audio/rommz-product-launch-hybrid-preview-voiceover.txt`
- Preview audio manifest now writes to:
  - `packages/web/public/remotion/audio/rommz-product-launch-hybrid-preview-audio.json`
- Preview soundtrack now writes to:
  - `packages/web/public/remotion/audio/rommz-product-launch-hybrid-preview-bed.wav`
- Preview voiceover now writes to:
  - `packages/web/public/remotion/audio/rommz-product-launch-hybrid-preview-voiceover.vi.mp3`
- If Vietnamese `edge-tts` is unavailable, the fallback voiceover writes to:
  - `packages/web/public/remotion/audio/rommz-product-launch-hybrid-preview-voiceover.fallback.wav`

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npm run remotion:audio:product --workspace=@roomz/web`: pass
  - current provider: `edge-tts`
  - current voice: `vi-VN-HoaiMyNeural`
- `npm run remotion:render:product --workspace=@roomz/web`: pass
  - Playwright capture step: `5/5` passed
  - preview audio pack generated successfully
  - hybrid MP4 rendered successfully with Vietnamese preview audio

## Follow-up

- Decide whether to keep `vi-VN-HoaiMyNeural` for the internal product-review cut or replace it with a human voice / higher-directability TTS for the final delivery
- Review whether the current generated bed is too present or too subtle under the caption-driven pacing
- If the preview voiceover remains useful, keep the generator as a fallback path and add a second “production asset” profile rather than removing it
