---
phase: monitoring
title: Project Status Snapshot
description: Living project memory for RoomZ product scope, architecture, roadmap, and current implementation state
updated: 2026-03-20
---

# RoomZ Project Status

## Snapshot

- **Project name:** RoomZ / RommZ
- **Workspace type:** Monorepo
- **Packages:** `packages/web`, `packages/mobile`, `packages/shared`
- **Primary web stack:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + Radix UI + TanStack Query + Supabase
- **Primary mobile stack:** Expo / React Native with NativeWind
- **Current design direction:** `trust-first + youthful-second`
- **Current motion direction:** Framer Motion only
- **Current 3D direction:** `three.js + @react-three/fiber + @react-three/drei`, accent-only, web-first

## Product Surface

### Demand-side pillars

- `Tìm phòng` / room search
- `Tìm bạn cùng phòng` / roommate matching
- `Ở ngắn hạn` / short-stay, sublet, swap
- `Dịch vụ & Ưu đãi` / support services + local deals
- `Cộng đồng`

### Supply-side pillar

- `Host console`
- `Post room`
- `Host application / verification workflow`

### Platform layer

- Authentication via Supabase
- Verification
- Premium / payment flows
- Notifications and chat
- Admin quality / moderation

## Current Architecture Notes

- Web router uses React Router in `packages/web/src/router/router.tsx`
- App shell lives in `packages/web/src/router/AppShell.tsx`
- Global tokens and typography live in `packages/web/src/index.css`
- UI primitives live in `packages/web/src/components/ui`
- The canonical services route is now `/services`
- Legacy routes redirect as follows:
  - `/support-services` -> `/services?tab=services`
  - `/local-passport` -> `/services?tab=deals`
  - `/partners` -> `/services?tab=deals`
- Listing search/detail surfaces already exist and remain production-critical
- `docs/ai/` is initialized and validated with `npx ai-devkit@latest lint`

## Current Documentation Conventions

- **Project status:** this file
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

### Motion / 3D

- `framer-motion-animator`
- `react-three-fiber`
- `threejs-fundamentals`
- `threejs-animation`

### Notes

- The originally planned `material-design-3` repo was inaccessible during install.
- `google-material-design` is the current substitute until a better public MD3 skill is selected.
- Newly installed skills require a Codex restart before they become available to future sessions.

## Audit Baseline (2026-03-20)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- UX audit: fail, 78 issues
- Accessibility checker: fail, 51 issues across 38 files
- SEO checker: fail, 4 issues

### Main UX / design debt

- Visual language is still too close to generic SaaS across landing, login, search, detail, and profile
- Typography hierarchy is still inconsistent outside the newly updated token/primitives layer
- Trust signals are present but not yet consistently dominant on high-value pages
- Several surfaces still carry verbose copy and weak information grouping
- The project still needs a stronger rental-marketplace identity on first impression

### Main technical / structural debt

- Some existing components still use older styling or color accents outside the new token system
- Accessibility debt remains broad, especially keyboard parity, skip links, and unlabeled inputs
- SEO debt remains on a few specific pages with multiple H1 tags or empty image alt text
- Large Vite chunks still exist, especially around `mapbox-gl` and some admin bundles

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
- **Status:** next

### Phase 3: Cross-surface alignment

- Roommates
- Short-stay
- Community
- Host flows
- Mobile token mapping

### Phase 4: Motion + 3D accent

- Add Framer Motion polish only after the 2D shell is stable
- Add 3D accent only on landing/login
- Enforce reduced-motion and low-end fallback behavior

## Immediate Next Step

- Start page-level redesign on:
  - landing
  - login
  - search
  - room detail
  - profile
- Use the new token, typography, and `/services` decisions as the baseline
- Prioritize UX, accessibility, and SEO debt reduction while redesigning

## Update Rules

1. Read this file before repo-affecting work.
2. Update this file after each code task.
3. If a feature status, route, tech choice, or workflow changes, reflect it here immediately.
4. If the file becomes too long, summarize old items and keep the current state at the top.
