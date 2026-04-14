---
phase: implementation
title: Become Landlord Pending Contrast Fix
date: 2026-04-14
owner: Codex
status: completed
---

# Become Landlord Pending Contrast Fix

## Summary

- Fixed the color contrast on the pending host application screen so the main heading and supporting copy are readable again.

## Problem

- The screen used `text-warning-foreground` on top of a very light `bg-warning/5` card.
- That token pairing made the title and description appear washed out instead of clearly readable.

## Changes

- Updated `packages/web/src/pages/become-landlord/components/BecomeLandlordPending.tsx`:
  - changed the title color from `text-warning-foreground` to `text-warning`
  - changed the subtitle color from `text-warning-foreground/80` to `text-slate-600`
- Kept the existing layout, content, icon, and CTA structure unchanged.

## Validation

- `npx eslint packages/web/src/pages/become-landlord/components/BecomeLandlordPending.tsx`
- `npx tsc -p packages/web/tsconfig.json --noEmit`
- `npx ai-devkit@latest lint`
