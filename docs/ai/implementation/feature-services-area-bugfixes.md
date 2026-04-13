---
phase: implementation
feature: services-area-bugfixes
title: Services Area Bugfixes - Implementation Guide
description: Implementation notes for the 2026-04-11 services-area stabilization pass
---

# Services Area Bugfixes - Implementation Guide

## Scope Implemented On 2026-04-11

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

## Booking Flow Changes

- `BookMovingModal.tsx`
  - collects floor, elevator, item-list, contact-phone, and notes detail so admin no longer receives empty moving metadata
  - applies heuristic estimate logic plus verified-student discount handling
  - supports partner-bound booking through `partnerId` and `partnerName`
- `CleaningScheduleModal.tsx`
  - replaces the raw `select` with shadcn `Select`
  - calculates total from cleaning type, room count, bathroom count, and add-ons
  - rebuilds the type selector as a responsive card grid that survives narrow modal widths
  - supports partner-bound booking and verified-student discount handling
- `serviceBookingPricing.ts`
  - centralizes moving and cleaning estimate logic plus reusable option metadata

## New Request Flow

- `ServiceRequestModal.tsx`
  - creates real service leads for `repair`, `laundry`, and `setup`
  - reuses auth/profile data for contact defaults and partner linkage
- `serviceRequestRouting.ts`
  - infers a booking target from partner category and specialization text so partner CTAs can open the correct modal

## Supporting Surface Changes

- `PartnerDetailModal.tsx`
  - fetches real reviews with query loading, populated, and empty states
  - books directly against the selected partner when the parent page provides a contextual handler
- `ServicesHubPage.tsx`
  - fixes testimonial star rendering
  - disables the empty-deals voucher CTA
  - swaps repair/laundry away from the hardcoded chat drawer
- `SupportServicesPage.tsx`
  - routes the third support service into the new request modal
  - improves the empty-state visual treatment
- `ServiceLeadsPage.tsx`
  - uses the signed-in admin identity for notes
  - adds support-category labels, `confirmed` stats, and `cancelled` action support
- `SettingsTab.tsx`
  - lets users enter profile editing when a phone number is missing instead of disabling the action
- `ShopDetailModal.tsx`
  - surfaces an invalid voucher-code state when QR payload is missing
