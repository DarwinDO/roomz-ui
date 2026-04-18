---
phase: implementation
title: Outcome 1 MVP Product Brief
date: 2026-04-14
owner: Codex
status: completed
---

# Outcome 1 MVP Product Brief

## Summary

- Created a submission-ready product brief for `Outcome 1 / item 3` so the project has a concrete artifact covering `persona / ICP`, `core value proposition`, and `core metrics to measure`.
- Scoped the brief explicitly to the `current web-first RommZ MVP` instead of overclaiming future mobile parity or unvalidated business outcomes.

## Problem

- The repository already had enough product context to explain RommZ well, but that context was spread across `README`, `project-status`, premium docs, ROMI audit notes, and UI-refresh lifecycle docs.
- Without a single evaluator-facing brief, the team would risk presenting the product too vaguely, too broadly, or with claims that extend beyond the current implementation.

## Changes

- Added [docs/features/outcome-1-mvp-product-brief.md](/e:/RoomZ/roomz-ui/docs/features/outcome-1-mvp-product-brief.md)
  - frames RommZ as a `web-first` MVP for the current submission
  - defines the primary ICP and a concrete primary persona
  - states the core thesis as `Tìm phòng rõ hơn, chốt nhanh hơn`
  - explains why the current product scope supports that thesis
  - proposes a North Star metric and a core MVP metric tree
  - includes directional pilot targets and evaluator-safe wording
- Added [docs/features/outcome-1-mvp-product-brief-submission.md](/e:/RoomZ/roomz-ui/docs/features/outcome-1-mvp-product-brief-submission.md)
  - rewrote the short brief into a true submission artifact instead of a mixed template
  - removed placeholder sections for deploy links, video links, stack fill-ins, and unfinished checklists
  - corrected product-state mismatches so ROMI, RommZ+, and the current web surfaces are described consistently with project memory
  - normalized the wording toward Vietnamese-first product language and reduced unnecessary English mixing
  - applied one more polish pass after review feedback:
    - compressed the scope section so the short brief stays closer to the expected `1-2 page` range
    - clarified the RommZ+ sentence to distinguish live core entitlements from higher-tier planned benefits
    - kept the short brief focused on evaluator-facing content instead of turning it into a route-by-route status table
- Refreshed the project snapshot in `docs/ai/monitoring/project-status.md` to record the new Outcome 1 deliverable.

## Validation

- `npx ai-devkit@latest lint`
