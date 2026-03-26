---
phase: implementation
title: Become Host Stitch Port
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

Ported `/become-host` to the generated Stitch host-registration screen while preserving the live RommZ host-application flow for non-landlord accounts.

# Changes

- Replaced the old registration shell in [BecomeLandlordPage.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/BecomeLandlordPage.tsx)
  - kept the current `useMyHostApplication` and `useSubmitHostApplication` hooks
  - preserved the pending, rejected, and approved redirect states instead of flattening the route into a static marketing form
  - added local draft persistence with `rommz.host-application-draft.v1` so users can save and resume the form on the same device
- Reworked the Stitch-first hero and conversion framing in [BecomeLandlordIntro.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/become-landlord/components/BecomeLandlordIntro.tsx)
  - aligned the header, icon badge, and benefit cards with the reviewed host-registration screen
- Rebuilt the registration form surface in [BecomeLandlordForm.tsx](e:/RoomZ/roomz-ui/packages/web/src/pages/become-landlord/components/BecomeLandlordForm.tsx)
  - enlarged the main card and field rhythm to match the new host-conversion shell
  - added a real `Lưu tạm` action and save timestamp
  - kept only the fields supported by the current host-application service contract

# Validation

- `npx ai-devkit@latest lint`: pass
- `npm run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `npm run build --workspace=@roomz/web`: pass

# Notes

- Authenticated manual review is still required for `/become-host` because anonymous automation cannot enter the protected non-landlord flow.
- Future host-tab ports must still keep the shared `/host` top navbar + horizontal tab pattern even if any generated Stitch concept drifts toward a sidebar.
