---
phase: implementation
title: Stitch Parity Bugfix Pass 4
date: 2026-03-21
feature: roomz-ui-refresh
---

# Task Summary

Fix the final landing filter rail regression where the `Vi tri` label and trigger collapsed into a broken stacked layout at certain desktop widths.

# Files Updated

- `packages/web/src/pages/LandingPage.tsx`
- `docs/ai/monitoring/project-status.md`

# Implementation Notes

- Added a real desktop `min-width` to the first landing filter segment.
- Tightened the desktop grid column minima for the three filter segments.
- Forced the three small uppercase labels to stay on one line.
- Kept the searchable location combobox and compact trigger labels from the previous pass intact.

# Verification

- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`: pass with 3 pre-existing hook warnings
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`: pass
- Playwright preview check:
  - `/`: landing `Vi tri` label stays on one line and the trigger still shows `TP.HCM`

# Recommended Next Step

Reload the landing page and verify the filter rail visually one more time. If it passes, the current Stitch-first desktop parity pass can be considered stable enough to move on.
