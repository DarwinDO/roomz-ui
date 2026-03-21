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
- [ ] Milestone 7: Generate missing Stitch screens before expanding the port scope
- [ ] Milestone 8: Add motion polish and 3D accents on approved surfaces only

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

- [x] Port `/` against `Trang Chủ - Living Atlas`
- [x] Port `/login` against `Đăng Nhập - Living Atlas`
- [x] Port `/services` against `Dịch vụ & Ưu đãi - Living Atlas (Updated)`
- [x] Port `/community` against `Cộng đồng - Living Atlas (Updated)`
- [x] Port `/roommates` against `Tìm Bạn Cùng Phòng - Living Atlas`
- [x] Port `/room/:id` against `Chi Tiết Phòng Trọ - Living Atlas`
- [x] Capture Playwright desktop parity screenshots for the six in-scope routes
- [x] Stabilize typography roles and desktop breakpoints for `/`, `/login`, `/services`, and `/room/:id` after the first Stitch port review
- [ ] Generate dedicated Stitch screens for `Search`, `Short-stay / Swap`, `Profile`, and `Landlord Dashboard` before coding them
- [ ] Map the refined token system to mobile / MD3 surfaces
- [ ] Add Framer Motion polish where it improves hierarchy
- [ ] Pilot 3D accents on landing and login only

## Risks

- Exact 1:1 Stitch parity is bounded by live RoomZ data, existing auth flows, and route contracts
- UX and bundle-size debt still span unrelated legacy surfaces, so this port is not the final polish pass
- The static UX audit remains noisy and can move independently of real visual improvements
- `stitch.generate_variants` currently returns an invalid-argument error in this workspace, so `generate_screen_from_text` is the fallback path for future concept generation
