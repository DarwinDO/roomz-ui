---
phase: requirements
feature: roomz-ui-refresh
title: RoomZ UI Refresh - Requirements & Problem Understanding
description: Stitch-first desktop port requirements for the Living Atlas phase
---

# RoomZ UI Refresh - Requirements

## Problem Statement

- The user no longer wants another reinterpretation of the current RoomZ UI.
- The current phase must port the approved Stitch visual language directly into the repo for the six desktop routes already available in Stitch.
- RoomZ behavior, auth, routing, data flow, and API contracts must remain intact while the presentation layer changes.

## Goals

- Make the six in-scope desktop routes read like direct Stitch siblings, not a restyled RoomZ shell.
- Use Stitch project `17849223603191498901` as the single visual source of truth for this phase.
- Preserve RoomZ logic while replacing layout, hierarchy, and styling with Stitch-first implementations.
- Keep accessibility and SEO passing throughout the port.
- Keep Stitch typography roles intact: `Plus Jakarta Sans` for headline and CTA, `Manrope` for body, form, and label text.
- Stabilize the `1024-1440` desktop range on the stitched routes that showed visual breakage after the first port review.

## In-Scope Routes

- `/`
- `/login`
- `/services`
- `/community`
- `/roommates`
- `/room/:id`

## Non-Goals

- Mobile redesign in the same phase
- Search / swap / profile / landlord dashboard generation in the same phase
- Motion polish or 3D accents in the same phase
- Backend, schema, auth-flow, or route-contract changes

## Success Criteria

- The six desktop routes match Stitch closely in section order, hierarchy, spacing cadence, and CTA emphasis.
- Landing, login, services, and room detail no longer show document-level horizontal overflow in the `1024-1440` desktop band.
- Computed `h1` typography on the key stitched routes matches the Stitch headline font.
- RoomZ logic still works on top of the new UI.
- Accessibility checker passes.
- SEO checker passes.
- Desktop parity screenshots exist for all six routes.

## Constraints

- Existing web stack remains React + Vite + Tailwind + Radix
- Production UI must still be authored in repo code, not shipped as raw Stitch HTML
- If Stitch visuals conflict with RoomZ logic, Stitch wins for layout and RoomZ wins for behavior
