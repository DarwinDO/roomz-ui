---
phase: testing
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Testing Strategy
description: Validation plan and current audit status for the RoomZ Stitch-first desktop port
---

# RoomZ UI Refresh - Testing

## Coverage Goals

- Validate the Stitch-first desktop routes against the current router and live RoomZ logic
- Validate `/services` canonical routing and legacy redirects
- Keep accessibility and SEO fully passing during the port
- Use Playwright desktop screenshots as the main parity gate for this phase

## Manual Scenarios

- Open `/`, `/login`, `/services`, `/community`, `/roommates`, and `/room/:id`
- Confirm the canonical `/services` hub still works with RoomZ data and modal flows
- Visit `/support-services` and confirm redirect behavior remains intact
- Compare Playwright desktop screenshots against the corresponding Stitch screens
- Confirm the room detail view renders correctly with a live room ID, pricing, amenities, host CTA, and related rooms

## Validation Commands

- `npx ai-devkit@latest lint`
- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`
- `python .agents/skills/frontend-design/scripts/ux_audit.py packages/web`
- `python .agents/skills/frontend-design/scripts/accessibility_checker.py packages/web`
- `python .agents/skills/seo-fundamentals/scripts/seo_checker.py packages/web`

## Latest Results (2026-03-27)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- `npx ai-devkit@latest lint` after the RommZ+ discoverability + Romi v2 pass: pass
- `npm run lint --workspace=@roomz/web` after the RommZ+ discoverability + Romi v2 pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the RommZ+ discoverability + Romi v2 pass: pass
- `npm run typecheck --workspace=@roomz/shared` after the ROMI v3 rebuild: pass
- `npm run lint --workspace=@roomz/web` after the ROMI v3 rebuild: pass with the same 3 pre-existing hook warnings
- `npm run test:unit --workspace=@roomz/web -- --grep "ROMI|romi workspace reducer"` after the ROMI v3 rebuild: pass
- `npm run build --workspace=@roomz/web` after the ROMI v3 rebuild: pass
- `npm run lint --workspace=@roomz/web` after the Romi desktop scroll-containment fix: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the Romi desktop scroll-containment fix: pass
- `npx ai-devkit@latest lint` after the `/payment` hero-noise cleanup + Romi empty-bubble fix: pass
- `npm run lint --workspace=@roomz/web` after the `/payment` hero-noise cleanup + Romi empty-bubble fix: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/payment` hero-noise cleanup + Romi empty-bubble fix: pass
- `npm run lint --workspace=@roomz/web` after the Romi nested-button hydration fix: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the Romi nested-button hydration fix: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/payments.test.ts src/services/romi.test.ts`: blocked locally because `packages/web/src/lib/supabase.ts` requires `supabaseUrl` at import time and the current shell session did not expose the Supabase env vars
- `npm run lint --workspace=@roomz/web` after the `/profile` Stitch port: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/profile` Stitch port: pass
- `npm run lint --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass
- `npm run lint --workspace=@roomz/web` after the `/profile` stability pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/profile` stability pass: pass
- `npm run lint --workspace=@roomz/web` after the `/swap` Stitch port: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/swap` Stitch port: pass
- `npm run lint --workspace=@roomz/web` after the currency-input formatting pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the currency-input formatting pass: pass
- `npx ai-devkit@latest lint` after the currency-input formatting pass: pass
- `npm run lint --workspace=@roomz/web` after the posting-dropdown scroll-lock pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the posting-dropdown scroll-lock pass: pass
- `npx ai-devkit@latest lint` after the posting-dropdown scroll-lock pass: pass
- `npm run lint --workspace=@roomz/web` after the `/host` Stitch port: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/host` Stitch port: pass
- `npx ai-devkit@latest lint` after the `/host` Stitch port: pass
- `npm run lint --workspace=@roomz/web` after the host-entry navigation pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the host-entry navigation pass: pass
- `npx ai-devkit@latest lint` after the host-entry navigation pass: pass
- `npm run lint --workspace=@roomz/web` after the `/become-host` Stitch port: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/become-host` Stitch port: pass
- `npx ai-devkit@latest lint` after the `/become-host` Stitch port: pass
- `npm run lint --workspace=@roomz/web` after the `/host` sub-screen port pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/host` sub-screen port pass: pass
- `npx ai-devkit@latest lint` after the `/host` sub-screen port pass: pass
- CLI Playwright smoke screenshot for `/swap`: captured at `.tmp-swap-preview.png`
- Authenticated visual parity review for `/profile` is still pending; anonymous automation redirects away from the account route
- Authenticated visual parity review for `/host` is also pending; anonymous automation cannot pass the landlord guard
- Manual authenticated review is still required to confirm:
  - landlord accounts now see `Chủ nhà` in the desktop navbar
  - landlord avatar menus link to `/host`
  - non-landlord avatar menus link to `/become-host`
- Authenticated visual parity review for `/become-host` is also pending; anonymous automation cannot validate the protected non-landlord flow
- Manual authenticated review should also confirm that non-landlord accounts can open `/become-host`, save a draft, and submit the reviewed Stitch-first form without layout or auth regressions
- Manual authenticated review is now required for the deeper host tabs after repo porting:
  - `Tin đăng`
  - `Lịch hẹn`
  - `Tin nhắn`
  - `Thu nhập`
- Manual authenticated review must now also verify the room-context chat behavior:
  - contacting a host from `/room/:id` should create or reopen a conversation tied to that room
  - repeating contact on the same room should reopen the same conversation instead of creating a duplicate
  - `/host?tab=messages` should show the linked room title, image, and price context for the active thread
  - `Nhắn khách` from `/host?tab=appointments` should route into the matching room-context conversation
- Manual authenticated review must now also verify the host interaction pass:
  - `/host?tab=appointments` calendar should support previous / next month switching and day-specific focus
  - clicking a booking time chip should focus the matching day in the calendar rail
  - `/host?tab=messages` should allow sending a reply inline without leaving `/host`
  - host inbox preview should stay visually stable during idle polling instead of flashing back to a loading placeholder
- Manual review is now also required for the redesigned shared inbox:
  - `/messages` should feel correct for both room-linked host/renter threads and direct user-to-user conversations
  - room-linked conversations should show the correct room title, price, image, and room-detail CTA
  - direct conversations should not show irrelevant landlord-only inquiry framing
  - mobile list/chat switching should still let the user move cleanly between the thread rail and the active conversation
- Manual landlord review should re-check the widened appointments rail:
  - `/host?tab=appointments` should still switch months and select days correctly
  - the selected-day summary and wider calendar rail should feel less cramped than the previous version
- Manual review should also verify the messaging overflow fixes:
  - `/host?tab=messages` should let the landlord scroll back to older messages inside the preview panel
  - `/messages` should keep the message list scrollable inside the chat card instead of extending the whole page
  - long message content should wrap without blowing out the chat layout
- Manual review should also verify the messaging layout normalization:
  - `/messages` should feel visually natural, not like three rigid full-height columns fighting each other
  - `/host?tab=messages` should show visible thread history in the center panel without the earlier empty-block feel
- Manual review should verify the new quick-reply toggle on both messaging surfaces:
  - `/messages` should hide quick-reply chips by default and reveal them only after an explicit toggle
  - `/host?tab=messages` should do the same without pushing the active thread out of view
  - expanding and collapsing suggestions should not reset the current scroll position in the message viewport
  - opening the suggestions tray should not stretch the route or shift neighboring panels
- Manual review should verify the latest messaging stability fixes:
  - `/messages` should wrap very long participant emails inside the context rail instead of overflowing horizontally
  - `/host?tab=messages` should not snap back to the bottom of the thread during passive refresh when no new last message was added
- Stitch review is also pending for:
  - `Đăng Ký Làm Host - Living Atlas`
- Future host-tab parity review must compare against the repo host shell pattern first:
  - top navbar + horizontal tab bar stay canonical
  - any left sidebar shown in a host concept should be treated as non-portable concept drift unless re-approved
- Playwright local preview review: complete for `/search` with marker-to-card selection flow
- Playwright scripted search interaction re-check: pass
  - confirmed the refined search console now starts below the fixed desktop navbar (`inputTop: 177`, `headerBottom: 73`)
  - confirmed clicking the first secondary listing card now navigates directly to its detail route on the first click
  - confirmed triggering `Xem tren ban do` from the lower results list scrolls the page back toward the selected-listing hero region (`scrollY: 2739 -> 337`)
- Playwright split-map focus re-check on `http://127.0.0.1:4175/search`: pass
  - confirmed the rebuilt preview now centers the mini-map around the selected room's local area instead of fitting the entire country
  - confirmed the selected room's price marker remains visible inside the compact Stitch-side map card
- Playwright canvas-persistence check on `http://127.0.0.1:4175/search`: pass
  - confirmed the search mini-map keeps the same `.mapboxgl-canvas` node after switching focus to another room (`sameCanvas: true`)
  - confirmed marker count stays stable while the selected-room focus changes (`11 -> 11`)
- Playwright quick-location-switch check on `http://127.0.0.1:4177/search`: pass
  - confirmed a non-empty quick-chip location change (`TP.HCM` -> `Thủ Đức`) keeps the same `.mapboxgl-canvas` node mounted (`sameCanvas: true`)
  - confirmed the mini-map updates marker data in place instead of re-initializing the entire Mapbox instance
- Playwright catalog-selection continuity check on `http://127.0.0.1:4179/search`: pass
  - confirmed typing a catalog-oriented query (`Bach`) no longer collapses the current room results and map into an immediate `0 results` state
  - confirmed choosing the internal catalog suggestion for `Đại học Bách khoa Hà Nội` keeps the same `.mapboxgl-canvas` node mounted (`sameCanvas: true`) while the search transitions to the new dataset
- Playwright local preview review: complete for `/`, `/login`, `/services`, `/community`, `/roommates`, and `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe`
- Playwright desktop stabilization pass: complete for `/`, `/login`, `/services`, and `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe` at `1024`, `1280`, and `1440`
- Playwright computed headline font: `Plus Jakarta Sans` on `/`, `/login`, `/services`, and `/room/:id`
- Playwright document overflow check: no document-level horizontal overflow on `/`, `/login`, `/services`, and `/room/:id`
- Stitch source review: complete for the original six public screens in project `17849223603191498901`, then expanded with generated screens for search, swap, profile, and host
- Playwright preview re-check: `/`, `/services`, `/community`, and `/login` all render the new parity fixes without document-level overflow
- Playwright preview re-check: `Xem toan bo uu dai` on `/services` now expands the catalog and toggles to `Thu gon uu dai`
- Playwright preview re-check: the featured community card now renders a near-full media block instead of the earlier clipped strip
- Playwright preview re-check: `/` now exposes the full province list through a searchable landing combobox while keeping the trigger label compact
- Playwright preview re-check: `/services` now renders stronger deal category tags over card imagery
- Playwright preview re-check: `/community` post detail now opens a larger lightbox viewer from image thumbnails
- `npm run lint --workspace=@roomz/web` after the host room-context pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the host room-context pass: pass
- `npx ai-devkit@latest lint` after the host room-context pass: pass
- `npm run lint --workspace=@roomz/web` after the host interaction pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the host interaction pass: pass
- `npm run lint --workspace=@roomz/web` after the shared inbox redesign + appointments layout pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the shared inbox redesign + appointments layout pass: pass
- `npx ai-devkit@latest lint` before and after the shared inbox redesign + appointments layout pass: pass
- `npm run lint --workspace=@roomz/web` after the messaging scroll containment fix: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the messaging scroll containment fix: pass
- `npm run lint --workspace=@roomz/web` after the messaging layout normalization pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the messaging layout normalization pass: pass
- `npm run lint --workspace=@roomz/web` after the public motion foundation pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the public motion foundation pass: pass
- `npx ai-devkit@latest lint` after the public motion foundation pass: pass
- `npm run lint --workspace=@roomz/web` after the product motion pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the product motion pass: pass
- `npm run lint --workspace=@roomz/web` after the Draftly-like hero pivot: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the Draftly-like hero pivot: pass
- `npx ai-devkit@latest lint` after the Draftly-like hero pivot: pass
- `npm run lint --workspace=@roomz/web` after the `/romi` + `/payment` Stitch port: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/romi` + `/payment` Stitch port: pass
- `npx ai-devkit@latest lint` after the `/romi` + `/payment` Stitch port: pass
- `npm run lint --workspace=@roomz/web` after the `/romi` + `/payment` parity-tightening pass: pass with the same 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` after the `/romi` + `/payment` parity-tightening pass: pass
- `npx ai-devkit@latest lint` after the `/romi` + `/payment` parity-tightening pass: pass
- Live Supabase pricing migration check after the `/payment` port: pass
  - `public.create_checkout_order` now contains `39000` monthly pricing
  - `public.create_checkout_order` now contains `99000` quarterly pricing
- Manual review is now required for the layered entry-hero pivot:
  - `/` should feel more cinematic and polished than the old runtime low-poly scene
  - `/login` should keep the editorial card readable while the layered sanctuary hero sits behind it
  - the new hero should not create layout shift or dependency on WebGL support
- Manual review is now also required for the new Stitch-first utility surfaces:
  - `/romi` should keep session history, message sending, and room-context suggestions readable in the new full-page assistant layout
  - `/payment` should show the new `39.000đ/tháng` price, preserve the QR checkout flow, and remain visible even when the current user already has an active RommZ+ subscription
- Manual review is now required for the RommZ+ discoverability pass:
  - desktop navbar should always show the RommZ+ utility pill
  - avatar menu should still expose the premium route as a secondary entry
  - mobile quick access should provide a clear path into `/payment`
- Manual review is now required for the ROMI v3 runtime pass:
  - guest `/romi` should answer onboarding and product questions before login
  - login handoff should appear only when personalization or persistence is actually needed
  - sending a message should show `status` feedback almost immediately
  - long streamed answers should not reset the workspace or refetch the full session rail
  - clarification prompts should appear in the right rail when budget or area is still missing
  - room-context threads should reveal context in the right rail while general threads should keep that rail minimal or hidden
  - very long Romi threads should scroll inside the center panel instead of stretching the whole route
  - previously broken assistant rows that only contained `...` should no longer appear in old or newly streamed Romi threads
- UX audit: fail, 70 issues
- Accessibility checker: pass, 0 issues
- SEO checker: pass, 0 issues

## Session Constraints (2026-03-21)

- `C:\nvm4w\nodejs\npx.cmd` and `C:\nvm4w\nodejs\npm.cmd` are available even though `npm` / `npx` are not exposed directly in `PATH`
- Re-run status from the third parity bugfix pass:
  - `npx ai-devkit@latest lint`: pass
  - local `eslint`: pass with the same 3 pre-existing hook warnings
  - local `tsc -b`: pass
  - full `vite build`: pass via `C:\nvm4w\nodejs\npm.cmd`
  - Python accessibility / SEO scripts were not re-run in this turn

## Acceptance

- The ten in-scope desktop routes should feel like direct Stitch siblings rather than a restyled RoomZ shell
- Shared tokens and primitives do not break RoomZ routing, auth, or modal behavior
- Host messaging should now be reviewable per room context instead of per participant pair only
- Public motion should enhance hierarchy on `/`, `/login`, `/services`, and `/community` without introducing layout shift or requiring motion to understand the page
- Product motion should clarify state changes on `/search`, `/messages`, and `/host` without stretching the page, causing layout shift, or making navigation ambiguous
- Landing/login hero treatment should remain decorative only:
  - CTA, copy, search, and auth form readability must stay intact
  - reduced-motion should keep the hero calm and readable without layout shift
  - the entry routes should no longer depend on runtime WebGL support
- Accessibility and SEO remain passing
- Mobile is intentionally excluded from the current acceptance target
- Remaining UX and performance debt is documented and not hidden

