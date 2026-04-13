---
phase: requirements
feature: services-area-bugfixes
title: Services Area Bugfixes - Requirements & Problem Understanding
description: Requirements for stabilizing service booking, partner detail, admin leads, and related settings flows
---

# Services Area Bugfixes - Requirements

## Problem Statement

- The service hub and support-service surfaces had multiple trust-breaking issues across booking, pricing, partner booking, and admin visibility.
- Users could hit dead-end or misleading UI states such as the wrong review icon, a silent voucher CTA, fake student discounts, fixed estimates, and a cleaning modal layout that broke down on narrow widths.
- Admins received incomplete lead detail for moving requests and lacked visibility or actions for some real service states.

## Goals

- Make service booking flows submit the detail fields that admin actually needs.
- Keep service pricing and discount messaging aligned with the data the user enters.
- Remove hardcoded fallback chat flows for `repair`, `laundry`, and `setup` requests and replace them with real service-lead creation.
- Keep partner detail booking contextual to the chosen partner and surface real review content.
- Fix the narrow-screen cleaning modal layout so it remains readable and tappable.

## Non-Goals

- Full quote-engine integration with live distance or inventory pricing
- New backend schema changes for service leads
- Reworking unrelated marketplace or profile surfaces outside the touched service flows

## User Stories

- As a renter, I want moving and cleaning booking forms to reflect the information that changes my estimate so the total feels credible.
- As a renter, I want partner booking to stay attached to the partner I selected so the CTA does not throw me back into a generic catalog.
- As a renter, I want repair, laundry, and setup requests to create real leads so support follow-up is trackable.
- As an admin, I want service leads to include the fields defined in the admin detail schema so the lead can be actioned without guessing.
- As an admin, I want lead stats and actions to cover `confirmed` and `cancelled` states so the board matches real workflow.

## Success Criteria

- Moving leads populate the previously missing floor, elevator, and item details.
- Cleaning totals change when room count, bathroom count, service type, or add-ons change.
- Student discount messaging only appears for verified student profiles.
- Repair, laundry, and setup requests create leads from UI instead of opening the fake chat fallback.
- The cleaning modal service-type selector remains usable on narrow layouts without label overlap.
- Partner review areas show fetched review content or a deliberate empty state.

## Constraints & Assumptions

- The current web stack remains React + Vite + Tailwind + shadcn/Radix primitives.
- Existing service-lead backend contracts remain unchanged, so richer detail is sent through the current `details` payload.
- Estimate logic remains heuristic and UI-facing, not a binding billing calculation.
