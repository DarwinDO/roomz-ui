---
phase: implementation
title: Swap Navigation and Clarity Pass
date: 2026-03-22
owner: Codex
status: completed
---

# Summary

- Added the missing `Ở ngắn hạn` entry to the desktop top navigation
- Clarified the two most confusing browse-surface blocks on `/swap`
- Replaced the unrelated vehicle fallback in the secondary short-stay card with a room image fallback
- Reworked the lower-left swap lane so it explains the flow when the user has no own listing, instead of showing an ambiguous pseudo-progress state

# Files

- Updated `packages/web/src/router/AppShell.tsx`
- Updated `packages/web/src/pages/SwapRoomPage.tsx`
- Updated `docs/ai/monitoring/project-status.md`

# Validation

- `cmd /c "C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint"`
  - pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass

# Notes

- The secondary right-side browse card on `/swap` is intended to represent `Nhượng phòng nhanh`
- The lower-left card in `Cơ hội dời đến sớm` is intended to represent the `Hoán đổi lịch ở` lane:
  - when the user already has a short-stay listing, it summarizes the listing context used for matching
  - when the user has no own listing yet, it now acts as an onboarding explainer with concrete next steps
