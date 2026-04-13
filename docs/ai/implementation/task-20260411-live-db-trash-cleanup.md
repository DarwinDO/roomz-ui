---
phase: implementation
task: live-db-trash-cleanup
date: 2026-04-11
status: complete
---

# Task Log: Live DB Trash Cleanup

## Goal

- Remove obviously noisy room and partner data from the live Supabase project without touching the user-approved room whitelist captured from the admin screenshots.
- Delete the partner cluster that reused the same room-photo avatar instead of keeping placeholder catalog entries alive.
- Shrink the room inventory down to the `30` rooms explicitly approved to keep.

## Files

- Updated live database data in:
  - `public.partners`
  - `public.service_leads`
  - `public.rooms`
- Room deletion cascaded through:
  - `public.room_images`
  - `public.room_amenities`
  - `public.favorites`
  - `public.bookings`
  - `public.reviews`
  - `public.phone_number_views`
  - `public.sublet_listings`
  - `public.sublet_applications`
- Updated docs:
  - `docs/ai/monitoring/project-status.md`
  - `docs/ai/implementation/task-20260411-live-db-trash-cleanup.md`

## Validation

- Verified the room whitelist resolves to exactly `30` live `room_id` values before deletion.
- Deleted partner placeholder-image cluster:
  - `50` partners removed
  - `112` service leads removed first
  - `14` deals cascaded
  - `10` reviews cascaded
- Deleted non-whitelisted rooms:
  - `283` rooms removed
  - `576` room images cascaded
  - `282` room amenities cascaded
  - `110` favorites cascaded
  - `48` bookings cascaded
  - `34` reviews cascaded
  - `6` phone-number views cascaded
  - `1` sublet listing cascaded
  - `2` sublet applications cascaded
  - `2` conversations had `room_id` cleared by FK `SET NULL`
- Post-delete SQL checks:
  - `remaining_partners_with_target_image = 0`
  - `remaining_service_leads_with_missing_partner = 0`
  - `partners_remaining_total = 26`
  - `service_leads_remaining_total = 41`
  - `rooms_remaining_total = 30`

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Added `docs/ai/implementation/task-20260411-live-db-trash-cleanup.md`

## Follow-ups

- Review the remaining `41` service leads and decide whether old demo/service-history rows should also be pruned.
- Review the remaining non-auth `users` separately; many still look like staging/demo identities even after room cleanup.
- Decide whether the preserved `30` rooms should remain permanent seed content or move into a smaller curated demo set later.
