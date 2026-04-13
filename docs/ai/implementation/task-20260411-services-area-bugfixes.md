---
phase: implementation
task: services-area-bugfixes
date: 2026-04-11
status: completed
---

# Task Log: Services Area Bugfixes

## Goal

- Fix the reported bugs and misleading UI states in the services area
- Replace fake support-service fallbacks with real lead-creation flows
- Repair the cleaning modal layout issue shown in the narrow-width screenshot

## Root Cause

- Service booking rules had drifted across pages and modals, so visible UI, lead payloads, and admin presentation no longer matched each other.
- Several service types still depended on a hardcoded chat fallback instead of a maintained request flow.
- The cleaning modal used a horizontally constrained service-type treatment that did not adapt to narrow modal widths.
- Supporting surfaces such as partner detail, voucher detail, admin notes, and profile settings contained placeholder or hardcoded behavior that broke trust.

## Files

- `packages/web/src/pages/ServicesHubPage.tsx`
- `packages/web/src/pages/SupportServicesPage.tsx`
- `packages/web/src/pages/admin/ServiceLeadsPage.tsx`
- `packages/web/src/pages/profile/components/SettingsTab.tsx`
- `packages/web/src/components/modals/BookMovingModal.tsx`
- `packages/web/src/components/modals/CleaningScheduleModal.tsx`
- `packages/web/src/components/modals/PartnerDetailModal.tsx`
- `packages/web/src/components/modals/ShopDetailModal.tsx`
- `packages/web/src/components/modals/ServiceRequestModal.tsx`
- `packages/web/src/components/modals/serviceBookingPricing.ts`
- `packages/web/src/components/modals/serviceBookingPricing.test.ts`
- `packages/web/src/components/modals/serviceRequestRouting.ts`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/requirements/feature-services-area-bugfixes.md`
- `docs/ai/design/feature-services-area-bugfixes.md`
- `docs/ai/planning/feature-services-area-bugfixes.md`
- `docs/ai/implementation/feature-services-area-bugfixes.md`
- `docs/ai/testing/feature-services-area-bugfixes.md`

## Validation

- `npx ai-devkit@latest lint`: pass
- `npx eslint packages/web/src/pages/ServicesHubPage.tsx packages/web/src/pages/SupportServicesPage.tsx packages/web/src/pages/admin/ServiceLeadsPage.tsx packages/web/src/pages/profile/components/SettingsTab.tsx packages/web/src/components/modals/BookMovingModal.tsx packages/web/src/components/modals/CleaningScheduleModal.tsx packages/web/src/components/modals/PartnerDetailModal.tsx packages/web/src/components/modals/ShopDetailModal.tsx packages/web/src/components/modals/ServiceRequestModal.tsx packages/web/src/components/modals/serviceBookingPricing.ts packages/web/src/components/modals/serviceBookingPricing.test.ts packages/web/src/components/modals/serviceRequestRouting.ts`: pass
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/components/modals/serviceBookingPricing.test.ts`: pass
- `npm run build --workspace=@roomz/web`: pass

## Summary

- Fixed the broken service-booking details, pricing trust issues, and narrow cleaning-modal layout.
- Added real request flows for `repair`, `laundry`, and `setup` instead of opening the fake support chat drawer.
- Repaired partner booking context, review rendering, admin lead controls, voucher QR fallback, and the profile phone CTA dead end.
