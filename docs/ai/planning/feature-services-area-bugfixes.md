---
phase: planning
feature: services-area-bugfixes
title: Services Area Bugfixes - Planning
description: Execution plan for the services-area stabilization pass
---

# Services Area Bugfixes - Planning

## Milestones

- [x] Milestone 1: Verify the reported bugs against the current service code
- [x] Milestone 2: Rebuild moving and cleaning modal data collection and estimate logic
- [x] Milestone 3: Replace fake fallback service flows with real lead-request modals
- [x] Milestone 4: Fix partner detail booking context and review rendering
- [x] Milestone 5: Tighten admin lead actions, settings handoff, and voucher error states
- [x] Milestone 6: Validate the web workspace and sync lifecycle docs

## Task Breakdown

### Booking UX

- [x] Fix the wrong testimonial icon on `/services`
- [x] Disable the hero voucher CTA when no deals are available
- [x] Expand moving-form details to match admin expectations
- [x] Rework cleaning estimate logic and responsive service-type UI
- [x] Gate student discount messaging on verified profile state

### Missing service flows

- [x] Add a generic request modal for `repair`, `laundry`, and `setup`
- [x] Wire `/services` and `/support-services` into the new modal instead of the chat fallback
- [x] Preserve partner-specific booking context across modal entry points

### Admin and supporting surfaces

- [x] Fetch and render real partner reviews
- [x] Add support-category formatting, `confirmed` stats, and `cancelled` admin actions
- [x] Replace the phone-verification dead end in profile settings
- [x] Show an explicit invalid-QR state in voucher detail

## Risks

- Estimate logic is still heuristic and may need tuning once business pricing rules are finalized.
- Partner booking target inference depends on current partner metadata; misclassified partner records can still route to the wrong request modal until catalog data is normalized.
- Manual UI review is still required on real device widths because build/lint/unit checks cannot prove interaction comfort.
