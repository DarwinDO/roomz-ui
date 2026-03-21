---
phase: testing
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Testing Strategy
description: Validation plan and current audit status for the RoomZ Stitch-first desktop port
---

# RoomZ UI Refresh - Testing

## Coverage Goals

- Validate the six Stitch-first desktop routes against the current router and live RoomZ logic
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

## Latest Results (2026-03-21)

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass
- Playwright local preview review: complete for `/`, `/login`, `/services`, `/community`, `/roommates`, and `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe`
- Playwright desktop stabilization pass: complete for `/`, `/login`, `/services`, and `/room/5b0888d3-6a90-4d5c-a4da-68873b8280fe` at `1024`, `1280`, and `1440`
- Playwright computed headline font: `Plus Jakarta Sans` on `/`, `/login`, `/services`, and `/room/:id`
- Playwright document overflow check: no document-level horizontal overflow on `/`, `/login`, `/services`, and `/room/:id`
- Stitch source review: complete for the six in-scope screens in project `17849223603191498901`
- Playwright preview re-check: `/`, `/services`, `/community`, and `/login` all render the new parity fixes without document-level overflow
- Playwright preview re-check: `Xem toan bo uu dai` on `/services` now expands the catalog and toggles to `Thu gon uu dai`
- Playwright preview re-check: the featured community card now renders a near-full media block instead of the earlier clipped strip
- Playwright preview re-check: `/` now exposes the full province list through a searchable landing combobox while keeping the trigger label compact
- Playwright preview re-check: `/services` now renders stronger deal category tags over card imagery
- Playwright preview re-check: `/community` post detail now opens a larger lightbox viewer from image thumbnails
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

- The six in-scope desktop routes feel like direct Stitch siblings rather than a restyled RoomZ shell
- Shared tokens and primitives do not break RoomZ routing, auth, or modal behavior
- Accessibility and SEO remain passing
- Mobile is intentionally excluded from the current acceptance target
- Remaining UX and performance debt is documented and not hidden
