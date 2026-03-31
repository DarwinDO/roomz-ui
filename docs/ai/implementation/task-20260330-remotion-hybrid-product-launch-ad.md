---
phase: implementation
title: Remotion Hybrid Product-Launch Ad 16:9
date: 2026-03-30
---

# Remotion Hybrid Product-Launch Ad 16:9

## Scope

- Add a second desktop-first Remotion composition for a renter-facing RommZ product-launch ad
- Keep the composition `33s`, `1920x1080`, `30fps`, Vietnamese-first, and hybrid fake-UI-first
- Use deterministic Playwright captures for trusted product inserts on `/`, `/search`, `/romi`, `/services`, and `/payment`
- Keep the existing brand-ad composition intact and reuse only the parts that are actually shared

## Decisions

- The main ad is renter-first; `/host` is intentionally excluded from this cut
- The hybrid composition stays pure and serializable; capture, payload assembly, and rendering remain outside the React tree
- Captures are deterministic local PNG artifacts under `packages/web/.tmp/remotion/captures/`, then embedded into the payload as data URLs
- Fake UI remains the primary visual language so the ad can move like a product launch film instead of a screenshot slideshow
- Logged-in `/payment` and guided `/romi` states use mocked renter-auth and mocked API flows instead of real login, real checkout, or live DB state

## Implementation

- Added the hybrid capture manifest and placeholder system:
  - `packages/web/src/remotion/captures/rommzProductLaunchHybridCaptures.ts`
- Added the new product-launch composition stack:
  - `packages/web/src/remotion/compositions/RommzProductLaunchHybrid.tsx`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.schema.ts`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.timeline.ts`
  - `packages/web/src/remotion/compositions/rommzProductLaunchHybrid.metadata.ts`
- Registered the composition in `packages/web/src/remotion/Root.tsx` as `RommzProductLaunchHybrid16x9`
- Added the payload builder and unit coverage:
  - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.ts`
  - `packages/web/src/remotion/payloads/buildRommzProductLaunchHybridPayload.test.ts`
- Added the local render helper:
  - `packages/web/scripts/remotion/renderProductLaunchHybrid.ts`
- Added web-package scripts in `packages/web/package.json`:
  - `remotion:capture:product`
  - `remotion:payload:product`
  - `remotion:still:product`
  - `remotion:render:product`

## Capture Subsystem

- Extended the existing E2E mock layer in `packages/web/tests/e2e/helpers/mockApi.ts` instead of creating a second mocking system
- Added deterministic capture coverage in `packages/web/tests/e2e/remotion-product-launch-capture.spec.ts`
- Capture manifest is fixed in v1:
  - `landing-hero` -> `/`
  - `search-results` -> `/search`
  - `romi-chat` -> `/romi`
  - `services-deals` -> `/services`
  - `payment-pricing` -> `/payment`
- Capture viewport is fixed at `1440x900`
- The helper fails fast if any required capture is missing or if a protected route redirects unexpectedly
- Supporting E2E specs were refreshed to match the current UI and shared mocks:
  - `packages/web/tests/e2e/otp-login.spec.ts`
  - `packages/web/tests/e2e/search-location.spec.ts`
  - `packages/web/tests/e2e/services.spec.ts`

## Creative Contract

- Scene map is fixed at `990` frames:
  - `hook` `75`
  - `reveal` `120`
  - `search` `180`
  - `listings` `150`
  - `romi` `150`
  - `services` `180`
  - `cta` `135`
- On-screen copy and voiceover are Vietnamese-first
- The composition emphasizes these RommZ-specific messages:
  - tìm phòng theo khu vực
  - lọc giá, diện tích, tiện ích
  - xem listing và map cùng lúc
  - chi tiết rõ ràng, verified
  - Romi hỗ trợ shortlist
  - dịch vụ và giá trị RommZ+

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- src/remotion/payloads/buildRommzProductLaunchHybridPayload.test.ts`: pass
- `npm run test:e2e --workspace=@roomz/web -- remotion-product-launch-capture.spec.ts`: pass
- `npm run test:e2e --workspace=@roomz/web -- otp-login.spec.ts search-location.spec.ts services.spec.ts`: pass
- `npm run build --workspace=@roomz/web`: pass
- `npm run remotion:compositions --workspace=@roomz/web`: pass
  - `RommzProductLaunchHybrid16x9` -> `990` frames
  - `RommzBrandAd16x9` -> `994` frames
- `npm run remotion:capture:product --workspace=@roomz/web`: pass
- `npm run remotion:payload:product --workspace=@roomz/web`: pass
- Representative still renders: pass at frames `48`, `240`, `420`, `600`, `780`, `930`
- Full local MP4 render: pass
- Existing brand still render regression: pass via `npm run remotion:still:brand --workspace=@roomz/web`

## Follow-up

- Attach real Vietnamese voiceover and soundtrack assets, then retime the ducking envelope against the real waveform
- Review the hybrid cut live for pacing, especially the `services + payment` block and Romi readability at ad speed
- Build a second landlord-facing variant later if `/host` needs its own product film instead of being crowded into the renter-first ad
