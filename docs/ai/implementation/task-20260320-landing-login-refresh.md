---
phase: implementation
task: landing-login-refresh
date: 2026-03-20
status: completed
---

# Task Log: Landing And Login Refresh

## Goal

- Redesign the public landing and login experience with a stronger rental-marketplace identity
- Reuse the new token and typography system from the foundation phase
- Improve CTA hierarchy, trust signals, and baseline UX / accessibility on both pages

## Files

- `packages/web/src/pages/LandingPage.tsx`
- `packages/web/src/pages/LoginPage.tsx`

## Outcomes

- Landing now leads with a stronger housing-specific hero, guided search entry, local-context affordances, and clearer quick paths
- Login now frames RoomZ as a housing workflow instead of a generic auth screen while keeping OTP and Google flows intact
- Landing now reuses the canonical `Dịch vụ & Ưu đãi` hub through `ServicesBanner`
- Input labeling on landing is now explicit, reducing one known accessibility gap

## Validation

- `npm run lint --workspace=@roomz/web` passed with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web` passed
- UX audit still fails with 78 issues
- Accessibility checker improved to 47 issues across 36 files
- SEO checker still fails with 4 issues

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md` to reflect that landing and login are now refreshed

## Follow-ups

- Redesign `search`, `room detail`, and `profile` with the same visual language
- Continue cutting baseline accessibility debt, especially keyboard parity and global skip-link work
- Hold 3D work until landing/login shell direction is approved and search/detail/profile are aligned
