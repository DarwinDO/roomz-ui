---
phase: implementation
task: services-catalog-separation-fix
date: 2026-03-30
owner: codex
---

# Services Catalog Separation Fix

## Goal

Fix the `/services` catalog so:

- `Ưu đãi đối tác` only renders deal cards
- `Đối tác gần bạn` renders partner cards in its own section
- the expand CTA reflects whether there are more deals to show or only nearby partners to reveal

## Root Cause

- `ServicesHubPage` mixed `visibleDeals` and `visiblePartners` inside the same top catalog grid.
- The nearby-partners section then rendered partner cards again, creating a duplicated and visually broken expansion flow.
- When deals were already exhausted at 4 items, the CTA still implied more vouchers existed even though the only extra content was the partner catalog.

## Changes

- Added `servicesHubCatalog.ts` to centralize the catalog reveal state:
  - deal preview limit
  - CTA label
  - reveal target
  - expanded partner count
- Updated `ServicesHubPage.tsx` so:
  - the main deals grid no longer shows partner cards
  - the nearby partners section is revealed separately with its own grid hooks
  - the CTA changes to `Xem đối tác gần bạn` when there are no extra deals left
  - expanded partner cards stay clickable
  - expanded catalog cards no longer inherit a stuck hidden Framer Motion state after toggle; dynamic deal and partner cards now render with `initial={false}` so the expanded catalog cannot collapse into a blank white area
- Added regression coverage:
  - `packages/web/src/pages/servicesHubCatalog.test.ts`
  - `packages/web/tests/e2e/services.spec.ts`

## Validation

- `npm run test:unit --workspace=@roomz/web -- src/pages/servicesHubCatalog.test.ts`
- `npm run test:e2e --workspace=@roomz/web -- services.spec.ts`
- `npm run lint --workspace=@roomz/web`
- `npm run build --workspace=@roomz/web`
- `npx ai-devkit@latest lint`

## Notes

- This pass stays within the existing Stitch-first `/services` surface.
- The fix is intentionally structural, not cosmetic: the page now separates deals and partners at the render-model level so the bug cannot reappear from layout-only tweaks.
