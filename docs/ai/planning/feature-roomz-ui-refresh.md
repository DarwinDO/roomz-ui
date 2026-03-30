---
phase: planning
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Planning
description: Execution plan for the RoomZ Stitch-first desktop port
---

# RoomZ UI Refresh - Planning

## Milestones

- [x] Milestone 1: Install core UI / motion / 3D skills
- [x] Milestone 2: Establish docs governance and living project memory
- [x] Milestone 3: Refactor tokens and primitives
- [x] Milestone 4: Merge `Dich vu + Uu dai` into `/services`
- [x] Milestone 5: Refresh public and secondary web shells
- [x] Milestone 6: Clear the scripted accessibility backlog
- [x] Milestone 6.5: Atlas-heavy groundwork and hero differentiation
- [x] Milestone 6.9: Port the six in-scope desktop routes directly from Stitch instead of restyling the prior RoomZ UI
- [x] Milestone 7: Generate missing Stitch screens before expanding the port scope
- [x] Milestone 7.1: Port reviewed Stitch utility surfaces for Romi and RommZ+
- [x] Milestone 7.2: Tighten `/romi` and `/payment` parity after the first live review
- [x] Milestone 7.3: Add global RommZ+ discoverability and rebuild Romi as a stream-first assistant workspace
- [x] Milestone 7.4: Rebuild `/romi` into `ROMI v3` with guest access, journey-aware streaming, and knowledge-only RAG
- [x] Milestone 8: Add motion polish and entry-hero accents on approved surfaces only

## Task Breakdown

### Phase 1: Foundation

- [x] Install approved skills
- [x] Update `AGENTS.md`
- [x] Add `project-status.md`
- [x] Add task log convention

### Phase 2: System groundwork

- [x] Refactor tokens
- [x] Refactor primitives
- [x] Update nav labels and route mapping

### Phase 3: Stitch-first desktop integration

- [x] Port `/` against `Trang Chu - Living Atlas`
- [x] Port `/login` against `Dang Nhap - Living Atlas`
- [x] Port `/services` against `Dich vu & Uu dai - Living Atlas (Updated)`
- [x] Port `/community` against `Cong dong - Living Atlas (Updated)`
- [x] Port `/roommates` against `Tim Ban Cung Phong - Living Atlas`
- [x] Port `/room/:id` against `Chi Tiet Phong Tro - Living Atlas`
- [x] Capture Playwright desktop parity screenshots for the six in-scope routes
- [x] Stabilize typography roles and desktop breakpoints for `/`, `/login`, `/services`, and `/room/:id` after the first Stitch port review
- [x] Generate dedicated Stitch screens for `Search`, `Short-stay / Swap`, `Profile`, and `Landlord Dashboard` before coding them
- [x] Port `/search` against `Tim Phong - Living Atlas (Refined)`
- [ ] Map the refined token system to mobile / MD3 surfaces
- [x] Add Framer Motion polish where it improves hierarchy
- [x] Pilot entry-route hero accents on landing and login only
- [x] Port `/romi` against `Tro Ly AI RommZ - Living Atlas`
- [x] Port `/payment` against `Hoi Vien RommZ+ - Nang Tam Trai Nghiem`
- [x] Keep `/payment` visible for active premium users instead of hiding the purchase page after activation
- [x] Update RommZ+ pricing baseline to `39.000d/thang` in both UI and backend checkout logic
- [x] Add a global RommZ+ desktop utility pill in `AppShell`
- [x] Keep RommZ+ discoverable from avatar menu and mobile quick access
- [x] Rebuild `/romi` into a chat-first workspace with a lighter left rail and optional context rail
- [x] Upgrade Romi transport from one-shot-only replies to a stream-first assistant contract
- [x] Keep Romi session previews optimistic and avoid full session/message refetches after each turn
- [x] Add guest entry into `/romi` instead of hiding the launcher for signed-out users
- [x] Add knowledge-only RAG for curated product guidance while keeping room/deal/service answers tool-first

## Risks

- Exact 1:1 Stitch parity is bounded by live RoomZ data, existing auth flows, and route contracts
- UX and bundle-size debt still span unrelated legacy surfaces, so this port is not the final polish pass
- The static UX audit remains noisy and can move independently of real visual improvements
- `stitch.generate_variants` currently returns an invalid-argument error in this workspace, so `generate_screen_from_text` is the fallback path for future concept generation
- The original runtime WebGL hero experiment has now been replaced by a Draftly-like layered illustration approach; future hero work should refine art direction first instead of reintroducing procedural Three.js scenes by default
- RommZ+ pricing now depends on both frontend config and the live Supabase checkout function; future price changes must update both layers together
- Romi now depends on a stream-first edge-function contract; future AI work should preserve the `start/status/tool_call/tool_result/token/final/error` event model instead of regressing to blocking one-shot responses
- ROMI now also depends on the new `journey_update`, `clarification_request`, and `handoff` stream events plus `experience_version = romi_v3`; future AI work should not regress these additions
