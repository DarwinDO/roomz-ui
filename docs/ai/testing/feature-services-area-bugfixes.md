---
phase: testing
feature: services-area-bugfixes
title: Services Area Bugfixes - Testing Strategy
description: Validation coverage and remaining manual QA for the services-area stabilization pass
---

# Services Area Bugfixes - Testing

## Coverage Goals

- Prove the modified service pages, booking modals, and admin lead board still build and type-check cleanly.
- Add unit coverage for the new pricing helpers because estimate logic now affects visible totals.
- Manually verify the narrow cleaning-modal layout and partner-bound booking UX because those behaviors are interaction-heavy.

## Unit Coverage

- `serviceBookingPricing.test.ts`
  - validates moving estimate composition
  - validates cleaning estimate composition
  - validates student discount application

## Manual Scenarios

- Open the cleaning modal at narrow widths and verify service-type cards stack without overlap.
- Submit moving, cleaning, repair, laundry, and setup requests and confirm the admin lead details remain readable.
- Open a partner with reviews and a partner without reviews to confirm both populated and empty states feel intentional.
- Open a voucher with no QR payload and confirm the invalid-code state is explicit.
- Visit profile settings without a phone number and confirm the CTA leads into profile editing instead of dead-ending.

## Validation Commands

- `npx ai-devkit@latest lint`
- `npx eslint packages/web/src/pages/ServicesHubPage.tsx packages/web/src/pages/SupportServicesPage.tsx packages/web/src/pages/admin/ServiceLeadsPage.tsx packages/web/src/pages/profile/components/SettingsTab.tsx packages/web/src/components/modals/BookMovingModal.tsx packages/web/src/components/modals/CleaningScheduleModal.tsx packages/web/src/components/modals/PartnerDetailModal.tsx packages/web/src/components/modals/ShopDetailModal.tsx packages/web/src/components/modals/ServiceRequestModal.tsx packages/web/src/components/modals/serviceBookingPricing.ts packages/web/src/components/modals/serviceBookingPricing.test.ts packages/web/src/components/modals/serviceRequestRouting.ts`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npm run test:unit --workspace=@roomz/web -- src/components/modals/serviceBookingPricing.test.ts`
- `npm run build --workspace=@roomz/web`

## Latest Results (2026-04-11)

- `npx ai-devkit@latest lint`: pass
- `npx eslint ...`: pass on all modified service-area files
- `npx tsc -p packages/web/tsconfig.json --noEmit`: pass
- `npm run test:unit --workspace=@roomz/web -- src/components/modals/serviceBookingPricing.test.ts`: pass
- `npm run build --workspace=@roomz/web`: pass
- Manual QA is still recommended for touch comfort and live booking semantics on actual device widths
