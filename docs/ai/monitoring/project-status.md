---
phase: monitoring
title: Project Status Snapshot
description: Living project memory for RoomZ product scope, architecture, roadmap, and current implementation state
updated: 2026-03-21
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
- Search, swap, profile, landlord dashboard, Atlas Plus, admin, motion, and 3D are outside the current Stitch-first desktop scope
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

## Audit Baseline (2026-03-21)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- Playwright local preview review: complete for all six Stitch-first desktop routes
- Playwright desktop stabilization review: complete for `/`, `/login`, `/services`, and `/room/:id` at `1024`, `1280`, and `1440`
- Stitch source review: complete for all six in-scope screens
- UX audit: fail, 70 issues
- Accessibility checker: pass, 0 issues
- SEO checker: pass, 0 issues

## Latest Validation Notes (2026-03-21)

- Re-ran `npx ai-devkit@latest lint` via `C:\nvm4w\nodejs\npx.cmd`: pass
- Re-ran `npm run lint --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass with the same 3 pre-existing hook warnings
- Re-ran `npm run build --workspace=@roomz/web` via `C:\nvm4w\nodejs\npm.cmd`: pass, with existing chunk-size warnings only
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
- Search, short-stay, profile, and landlord dashboard still need dedicated Stitch screens before they should receive the same direct-port treatment
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
- Short-stay
- Community
- Host flows
- Signature visual / hero differentiation pass
- Atlas-heavy design system groundwork
- Stitch-first desktop port for `/`, `/login`, `/services`, `/community`, `/roommates`, `/room/:id`
- **Status:** in progress; the six in-scope desktop routes are complete, mobile mapping is still pending

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
