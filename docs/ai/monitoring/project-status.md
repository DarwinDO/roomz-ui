---
phase: monitoring
title: Project Status Snapshot
description: Living project memory for RoomZ product scope, architecture, roadmap, and current implementation state
updated: 2026-03-22
---

# RommZ Project Status

## Snapshot

- **Project name:** RommZ
- **Workspace type:** Monorepo
- **Packages:** `packages/web`, `packages/mobile`, `packages/shared`
- **Primary web stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Radix UI + TanStack Query + Supabase
- **Primary mobile stack:** Expo / React Native with NativeWind
- **Current design direction:** `Stitch-first` Living Atlas direct port for six desktop routes
- **Motion direction:** Framer Motion only, still deferred for this phase
- **3D direction:** `three.js + @react-three/fiber + @react-three/drei`, accent-only, still deferred for this phase

## Product Surface

### Demand-side pillars

- Room search
- Roommate matching
- Short-stay / sublet / swap
- Services and deals
- Community

### Supply-side pillar

- Host console
- Post room
- Host application / verification workflow

### Platform layer

- Supabase authentication
- Verification
- Premium and payment flows
- Notifications and chat
- Admin quality and moderation

## Current Architecture Notes

- Web router uses React Router in `packages/web/src/router/router.tsx`
- App shell lives in `packages/web/src/router/AppShell.tsx`
- Global tokens and typography live in `packages/web/src/index.css`
- UI primitives live in `packages/web/src/components/ui`
- Shared Stitch asset registry lives in `packages/web/src/lib/stitchAssets.ts`
- Shared Stitch-first footer lives in `packages/web/src/components/common/StitchFooter.tsx`
- Stitch typography aliases now resolve globally via `font-display`, `font-headline`, `font-body`, and `font-label`
- Fixed and sticky top shells now use the shared `scroll-lock-shell` utility so Radix `Select` overlays do not shift the navbar when `react-remove-scroll` locks the body
- Global web layout now reserves a stable scrollbar gutter and clears Radix body compensation while scroll-locked, so centered forms no longer jump horizontally when a dropdown opens
- User-facing VND inputs now use the shared `CurrencyInput` helper:
  - inputs display grouped values such as `3.000.000`
  - form state still keeps raw digits so validation and submit payloads remain numeric-safe
- User-facing posting forms now prefer the shared `FormSelectPopover` over raw Radix `Select`:
  - `post-room` basic info step
  - `create-sublet`
  - quick post-listing modal
- The canonical services route is `/services`
- Legacy routes redirect as follows:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`
- Stitch project `17849223603191498901` is the active visual source of truth for the desktop port phase
- Stitch-first desktop routes now ported in repo:
  - `/` <- `Trang Chủ - Living Atlas`
  - `/login` <- `Đăng Nhập - Living Atlas`
  - `/services` <- `Dịch vụ & Ưu đãi - Living Atlas (Updated)`
  - `/community` <- `Cộng đồng - Living Atlas (Updated)`
  - `/roommates` <- `Tìm Bạn Cùng Phòng - Living Atlas`
  - `/room/:id` <- `Chi Tiết Phòng Trọ - Living Atlas`
- `/search` <- `Tìm Phòng - Living Atlas (Refined)`
- `/profile` <- `Hồ Sơ Cá Nhân - Living Atlas`
- Search route is now ported from the refined Stitch screen `screens/9c747e70493f43e2984e39691cc02b8f`
- `/search` mini-map now keeps the same Mapbox canvas when the room dataset changes through non-empty location switches (for example quick area chips), so the selected-room camera motion stays smooth instead of resetting
- `/search` no longer collapses into a `0 results` empty state while the user is still browsing internal location-catalog suggestions; the previous results and map stay visible until a catalog suggestion is actually chosen
- `/swap` is now ported directly from the generated Stitch screen `screens/354de64324a047a8b1bd6202aa8612de`
- The desktop top navigation now includes `/swap` as `Ở ngắn hạn`
- The `/swap` browse surface now separates `Nhượng phòng` from `Hoán đổi lịch ở` more clearly:
  - the secondary card uses a room fallback instead of an unrelated vehicle image
  - the lower-left swap lane now becomes an onboarding explainer when the user has no own listing, instead of showing a fake progress rail
- New UI convention for future work:
  - when a page has a fixed or sticky top shell and also uses Radix `Select`, that shell must include `scroll-lock-shell`
  - for inline user-facing forms and filters, prefer `FormSelectPopover` instead of raw Radix `Select`
  - avoid reintroducing raw modal-style dropdowns for inline filters when a popover/listbox pattern is more appropriate
  - for user-facing money fields in forms, use `packages/web/src/components/ui/currency-input.tsx` instead of raw `type="number"` inputs
- Landlord dashboard is the only remaining generated desktop screen that still needs direct-port implementation
- Atlas Plus, admin, motion, and 3D remain outside the current Stitch-first desktop scope
- Desktop parity is the acceptance target for the current phase; mobile is intentionally deferred
- The global web shell exposes a skip link target via `#main-content`
- `docs/ai/` is initialized and validates with `npx ai-devkit@latest lint`

## Documentation Conventions

- **Project status:** `docs/ai/monitoring/project-status.md`
- **Task execution logs:** `docs/ai/implementation/task-YYYYMMDD-<slug>.md`
- **Feature lifecycle docs:** `docs/ai/{phase}/feature-<name>.md`
- **Drift policy:** code and docs must be updated in the same task

## Installed Supplemental Skills

### Design / system

- `tailwind-design-system`
- `design-system-patterns`
- `ui-typography`
- `ux-principles`
- `accessibility-design-checklist`
- `google-material-design`
- `ui-ux-pro-max`

### Motion / 3D

- `framer-motion-animator`
- `react-three-fiber`
- `threejs-fundamentals`
- `threejs-animation`

### Notes

- The originally planned `material-design-3` repo was inaccessible during install
- `google-material-design` is the current substitute until a better public MD3 skill is selected
- Newly installed skills require a Codex restart before they become available to future sessions

## Review History

### Full Review (2026-02-15)

- Core finding: the web was `du de tin, chua du de nho`
- Strong trust-first fundamentals were present, but visual recall and surface differentiation were weak
- Follow-up backlog was created in `docs/ai/implementation/backlog-20250215-hero-redesign.md`

### Atlas Entry Review (2026-03-21)

- Landing and login moved away from the old warm-neutral shell and into the Living Atlas language
- Global tokens were aligned to lavender off-white surfaces, deep blue primary, amber secondary, and emerald tertiary
- App-surface typography was locked to `Plus Jakarta Sans + Manrope`

### Stitch-First Desktop Port Review (2026-03-21)

- Stitch is now the direct visual source of truth for the six desktop routes in scope, not just concept inspiration
- Local Playwright parity screenshots were captured for:
  - `/`
  - `/login`
  - `/services`
  - `/community`
  - `/roommates`
  - `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe`
- Screenshot outputs are stored at `C:\Users\LapHub\AppData\Local\Temp\roomz-playwright-stitch`
- The current result reads as one Stitch-led desktop product rather than a restyled RoomZ shell

### Typography + Breakpoint Stabilization Pass (2026-03-21)

- Stitch HTML was re-checked directly and confirmed the intended type roles are `Plus Jakarta Sans` for headlines and `Manrope` for body and labels
- Global typography and token aliases were patched so direct Stitch class names like `font-label` and `text-on-surface` resolve correctly in repo code
- Landing, login, services, and room detail were rebalanced for the `1024-1440` desktop band after the first user review flagged overflow and cramped composition
- Playwright now reports `Plus Jakarta Sans` as the computed `h1` font on `/`, `/login`, `/services`, and `/room/:id`

### Stitch Parity Bugfix Pass (2026-03-21)

- Landing search now uses dropdown-based controls for location, budget, and room type instead of clipped mixed inputs
- Landing community grid now matches the intended Stitch rhythm by letting the discussion card span the remaining two columns
- Room detail now uses a Stitch-like asymmetrical gallery, counts extra images from real room data only, and renders an inline map component instead of a fake static map card
- Roommates now exposes a real district/city dropdown, readable navigation pills, and a visible primary action button
- Community featured posts now render post imagery instead of text-only cards
- Public branding strings in the web app have been normalized from `RoomZ` to `RommZ`

### Stitch Parity Bugfix Pass 2 (2026-03-21)

- Landing search now pulls from the full province list in `vietnam-locations.ts`, widens the first filter column, and keeps the CTA aligned in the Stitch shell
- Roommate filtering now compresses long city labels like `Thanh pho Ho Chi Minh` to `TP.HCM` so the `Khu vuc` control stays legible in the desktop filter rail
- Community featured cards now support both single-image and multi-image posts; one image renders as a full contained media block, while multiple images switch to a grid with a `+N anh` overlay on the last visible tile
- Services and deals now expand in-place: `Xem toan bo uu dai` reveals the full voucher catalog and a dedicated `Doi tac gan ban` section instead of looking like a no-op
- Login reduced the floating copy card footprint, removed the public admin-login shortcut, and replaced the confusing `Tao ho so` CTA with explanatory account-creation copy

### Stitch Parity Bugfix Pass 3 (2026-03-21)

- Landing moved the `Vi tri` control from a cramped plain select to a searchable popover-combobox, while the trigger now shows a compact city label such as `TP.HCM` for better desktop parity
- Landing budget labels are compacted in the trigger (`2-5tr`, `5-10tr`, `>10tr`) so the hero filter rail reads cleanly without clipping
- Deal category tags on `/services` now use stronger Stitch-style capsule treatment with better contrast, uppercase short labels, and backdrop blur over photography
- Community post detail now supports an inline lightbox: clicking any thumbnail opens a larger viewer with next/previous navigation and a thumbnail strip

### Stitch Parity Bugfix Pass 4 (2026-03-21)

- Landing filter now locks a real minimum width for the `Vi tri` segment and forces all three small labels to stay on one line, preventing the broken stacked label seen in narrow desktop widths

### Stitch Parity Bugfix Pass 5 (2026-03-21)

- Landing `Ngan sach` and `Loai phong` controls no longer use Radix `Select`; both now use the same popover-style trigger pattern as `Vi tri`
- The landing desktop filter rail no longer triggers body scroll lock or scrollbar compensation when opening those two menus, so the fixed navbar no longer shifts horizontally

### Stitch Generation Pass (2026-03-21)

- Generated four additional desktop concept screens in Stitch for the next direct-port phase:
  - `Tìm Phòng - Living Atlas` (`screens/b63e095266a44b1492325b873fc0f635`)
  - `Ở Ngắn Hạn & Đổi Phòng - Living Atlas` (`screens/354de64324a047a8b1bd6202aa8612de`)
  - `Hồ Sơ Cá Nhân - Living Atlas` (`screens/f6a00e6c38db4c7d99603ea8caf51535`)
  - `Bảng Điều Khiển Chủ Nhà - Living Atlas` (`screens/fa32671321fa404fa707bcabfd826b4b`)
- These screens are now the visual review targets before any further desktop port work on `/search`, `/swap`, `/profile`, and `/landlord-dashboard`

### Stitch Search Refinement Pass (2026-03-21)

- Refined the generated search concept to change the first large listing from a disconnected premium editorial card into the selected listing state tied to the mini-map
- New refined Stitch screen:
  - `Tìm Phòng - Living Atlas (Refined)` (`screens/9c747e70493f43e2984e39691cc02b8f`)
- The original search concept (`screens/b63e095266a44b1492325b873fc0f635`) remains available for comparison

### Stitch Search Desktop Port Pass (2026-03-21)

- `/search` now ports directly from the refined Stitch screen `screens/9c747e70493f43e2984e39691cc02b8f`
- The old editorial search shell was replaced with a Stitch-first console, results overview, selected-listing hero card, split map column, and neighborhood insight card
- `MapboxRoomMap` now supports external selected-listing control, price-pill markers, and popup suppression for split-layout usage
- Playwright confirmed that clicking a map marker now swaps the selected listing card and the matching neighborhood insight panel

### Search Interaction Bugfix Pass (2026-03-21)

- `/search` now clears the fixed desktop navbar with explicit top spacing in the refined Stitch-first layout
- Secondary result cards now navigate directly to room detail on the first click instead of first promoting themselves into the selected-listing hero card
- `Xem tren ban do` now re-focuses the selected-listing hero card from deeper scroll positions so users do not need to manually scroll back up after choosing a room from the list
- The split map column now uses the same selected-listing focus flow when a price marker is clicked

### Search Map Focus Pass (2026-03-21)

- `MapboxRoomMap` now supports a `selected-room` viewport mode for search-driven flows
- The compact search mini-map now zooms into the currently selected room instead of fitting every result marker across Vietnam
- The full search map now also opens around the selected room's local context by default, which makes unfiltered nationwide result sets usable without an immediate manual zoom

### Search Map Animation Restore (2026-03-21)

- The search map no longer recreates its Mapbox instance every time the selected room changes
- Marker callbacks are now kept current through refs so selection changes do not force a full map teardown/rebuild
- Smooth `easeTo` camera motion is restored for selected-room transitions on `/search`

### Stitch Profile Desktop Port Pass (2026-03-21)

- `/profile` now ports from the generated Stitch screen `screens/f6a00e6c38db4c7d99603ea8caf51535`
- The old tab-first profile shell was replaced with a Stitch-first two-column dashboard built around the live RommZ auth profile, favorites, bookings, premium state, and roommate matches
- Full favorites, booking management, and account settings remain reachable through detail dialogs so the direct-port layout does not regress existing account flows
- The profile route now maps its location-style panels to the real `users` fields that exist in RoomZ today (`university`, `major`, `graduation_year`, and `role`) instead of assuming extra address fields that are not present in the schema

### Stitch Profile Polish Pass (2026-03-21)

- `/search` now persists the latest preferred search area into a small local storage snapshot so `/profile` can reopen the same search context
- `/profile` now reads that preferred-area snapshot and uses it inside the `Vung tim kiem uu tien` card instead of relying only on static profile-field fallbacks
- The premium upsell card on `/profile` now uses clearer `RommZ+` branding and stronger visual contrast after the live review flagged the old card as unreadable
- Several micro-labels on `/profile` were tightened to reduce overly loose tracking in the Stitch-first port

### Stitch Profile Stability Pass (2026-03-21)

- `/profile` text content was normalized back to valid UTF-8 after a source-encoding drift caused visible mojibake on the protected route
- The global dropdown-menu wrapper now defaults to `modal={false}`, which prevents the avatar profile menu from locking page scroll and shifting the fixed navbar horizontally
- `/profile` now resolves the preferred-area card into a live Mapbox mini-map whenever the stored preferred search area has coordinates, or when coordinates can be recovered from the internal location catalog
- The preferred-area card still falls back to the static Stitch-style placeholder only when no usable coordinates can be inferred from the saved search context
- The premium CTA on `/profile` now opts out of the shared gradient button treatment so the premium-state copy `Xem quyen loi hien co` stays readable against a solid white button background

### Stitch Swap Desktop Port Pass (2026-03-21)

- `/swap` now ports from the generated Stitch screen `screens/354de64324a047a8b1bd6202aa8612de`
- The old short-stay hub shell was replaced with a Stitch-first search console, editorial featured listing card, side utility cards, and lower `Co hoi doi den som` section
- Existing RoomZ flows remain reachable through the new surface:
  - `create-sublet`
  - `my-sublets`
  - `swap-matches`
  - `apply sublet`
  - `swap request`
- The route-local `Sublet` and `Doi phong` tabs now act as lightweight lanes that preserve access to current management flows without breaking the Stitch grammar
- Shared fallback imagery for the swap surface now lives under `stitchAssets.swap`

## Audit Baseline (2026-03-21)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- Playwright local preview review: complete for all six Stitch-first desktop routes
- Playwright local preview review: complete for `/search`
- Playwright desktop stabilization review: complete for `/`, `/login`, `/services`, and `/room/:id` at `1024`, `1280`, and `1440`
- Stitch source review: complete for all six in-scope screens
- UX audit: fail, 70 issues
- Accessibility checker: pass, 0 issues
- SEO checker: pass, 0 issues

## Latest Validation Notes (2026-03-21)

- Re-ran `npx ai-devkit@latest lint` via `C:\nvm4w\nodejs\npx.cmd`: pass
- Re-ran `npm run lint --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass, with existing chunk-size warnings only
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` Stitch port: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` Stitch port: pass, with the same existing chunk-size warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` CTA contrast fix: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` CTA contrast fix: pass, with the same existing chunk-size warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` preferred-area and promo-card polish pass: pass, with the same existing chunk-size warnings
- Re-ran `npm run lint --workspace=@roomz/web` after the `/profile` stability pass: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/profile` stability pass: pass, with the same existing chunk-size warnings
- Re-ran `npx ai-devkit@latest lint` after the `/profile` stability pass: pass
- Re-ran `npm run lint --workspace=@roomz/web` after the `/swap` Stitch port: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` after the `/swap` Stitch port: pass, with the same existing chunk-size warnings
- Captured a CLI Playwright smoke screenshot for `http://127.0.0.1:4181/swap` at `.tmp-swap-preview.png`
- `/profile` now compiles and ships in the Stitch-first desktop bundle, but still needs a live authenticated visual review because anonymous automation sessions redirect away from the account route
- Re-ran Playwright preview checks on `/search`
- Confirmed `/search` now renders the refined Stitch-first console, selected listing card, map column, and neighborhood insight panel
- Confirmed clicking a price marker on `/search` swaps the selected listing card and the insight panel without a full page reload
- Confirmed via Playwright automation that the refined search console now begins below the fixed desktop navbar (`inputTop: 177`, `headerBottom: 73`)
- Confirmed via Playwright automation that clicking the first secondary listing card on `/search` now navigates directly to its detail route on the first click
- Confirmed via Playwright automation that invoking `Xem tren ban do` from the lower results list scrolls the viewport back toward the selected-listing hero region (`scrollY: 2739 -> 337`)
- Confirmed via Playwright screenshot review on rebuilt preview `http://127.0.0.1:4175/search` that the compact split-map now opens around the selected room's local area rather than an all-Vietnam extent
- Confirmed via Playwright canvas-persistence check on rebuilt preview `http://127.0.0.1:4175/search` that the search mini-map keeps the same `.mapboxgl-canvas` node when switching room focus (`sameCanvas: true`)
- Re-ran Playwright preview checks on `/`, `/services`, `/community`, and `/login`
- Confirmed the community featured media card now renders a near-full image block in the live page instead of the earlier clipped strip
- Confirmed `Xem toan bo uu dai` now expands the services page in-place and switches the CTA state to `Thu gon uu dai`
- Confirmed the landing hero filter now shows compact trigger labels while still exposing the full province dataset in the searchable combobox
- Confirmed the services deal tags are now visually stronger in the live `/services` preview
- Confirmed community post detail now exposes a real lightbox viewer for attached images
- Confirmed the landing `Vi tri` label no longer wraps into a broken vertical stack in the live preview
- Confirmed via Playwright runtime inspection that opening the landing `Ngan sach` and `Loai phong` menus keeps `body` at `overflow: visible`, `margin-right: 0px`, and `clientWidth: 1425`, eliminating the earlier scrollbar-induced header shift
- `/roommates` still redirects to `/login` in an unauthenticated session, so this turn's visual check for the roommate filter relied on code review plus lint/build validation rather than a live screenshot

## Main Debt

### UX / design debt

- Mobile mapping has not started
- Landlord dashboard still needs direct-port implementation from its generated Stitch screen
- `/profile` still needs a live authenticated visual review against the Stitch concept before it can be considered parity-complete
- The static UX audit remains noisy and still reports 70 issues across the broader web package

### Technical / structural debt

- Large Vite chunks still exist, especially around `mapbox-gl` and admin bundles
- Several legacy surfaces outside the Stitch-first scope still need future polish
- Existing hook warnings remain in:
  - `packages/web/src/hooks/useConfirm.tsx`
  - `packages/web/src/pages/ResetPasswordPage.tsx`
  - `packages/web/src/pages/admin/RevenuePage.tsx`

## Active Roadmap

### Phase 1: Foundation

- Install core UI and 3D skills
- Establish living docs protocol
- Create `feature-roomz-ui-refresh` lifecycle docs
- Refactor initial tokens and primitives
- Launch canonical `/services` hub
- **Status:** complete

### Phase 2: Public flow redesign

- Landing
- Login
- Search
- Room detail
- Profile
- **Status:** complete

### Phase 3: Cross-surface alignment and Stitch-first desktop port

- Roommates
- Community
- Host flows
- Signature visual / hero differentiation pass
- Atlas-heavy design system groundwork
- Stitch-first desktop port for `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`
- **Status:** in progress; `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`, `/search`, `/profile`, and `/swap` are now complete, mobile mapping and landlord dashboard are still pending

### Phase 4: Motion + 3D accent

- Add Framer Motion polish only after the Stitch-first desktop shell is approved
- Add 3D accent only on landing and login
- Enforce reduced-motion and low-end fallback behavior
- **Status:** pending

## Immediate Next Step

- Review the latest parity bugfixes with the user on `/`, `/community`, `/room/:id`, `/roommates`, `/services`, and `/login`
- If approved, generate missing Stitch screens before more code:
  - `Search`
  - `Short-stay / Swap`
  - `Profile`
  - `Landlord Dashboard`
- Keep mobile, motion, and 3D deferred until the desktop parity pass is accepted

## Update Rules

1. Read this file before repo-affecting work.
2. Update this file after each code task.
3. If a feature status, route, tech choice, or workflow changes, reflect it here immediately.
4. If the file becomes too long, summarize old items and keep the current state at the top.
