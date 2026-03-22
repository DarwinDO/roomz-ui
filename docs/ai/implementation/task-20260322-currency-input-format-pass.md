---
phase: implementation
task: currency-input-format-pass
date: 2026-03-22
owner: codex
---

# Task Log: Currency Input Format Pass

## Goal

Make user-facing money inputs easier to read by showing grouped VND values such as `3.000.000` instead of raw digit strings, without breaking validation or submit payloads.

## Changes

### Shared currency helpers

- Added `packages/web/src/lib/currency.ts`
- Added:
  - `sanitizeCurrencyInput`
  - `formatCurrencyInput`
  - `parseCurrencyInput`

### Shared UI input

- Added `packages/web/src/components/ui/currency-input.tsx`
- The component:
  - renders grouped VND input display
  - keeps raw digits through `onValueChange`
  - uses `inputMode="numeric"` instead of raw `type="number"`

### Applied to user-facing forms

- Updated `packages/web/src/pages/post-room/components/StepDetailsPricing.tsx`
  - `Giá thuê/tháng`
  - `Tiền cọc`
- Updated `packages/web/src/pages/PostSubletPage.tsx`
  - `Giá gốc/tháng`
  - `Giá ở ngắn hạn`
  - `Tiền cọc`
- Updated `packages/web/src/pages/EditSubletPage.tsx`
  - `Giá ở ngắn hạn`
- Updated `packages/web/src/components/modals/PostListingModal.tsx`
  - `Giá thuê`
- Updated `packages/web/src/components/modals/CreateSubletDialog.tsx`
  - `Giá theo tháng`

### Numeric parsing safety

- Updated `packages/web/src/hooks/usePostSubletForm.ts` to parse formatted money strings through `parseCurrencyInput`
- Updated `packages/web/src/pages/PostRoomPage.tsx` to parse `pricePerMonth` and `depositAmount` through the shared helper
- Updated `packages/web/src/pages/EditSubletPage.tsx` to validate and submit the formatted sublet price safely
- Updated `packages/web/src/components/modals/PostListingModal.tsx` to parse the grouped rent input safely

## Validation

- `cmd /c "C:\nvm4w\nodejs\npx.cmd ai-devkit@latest lint"`
  - pass
- `C:\nvm4w\nodejs\npm.cmd run lint --workspace=@roomz/web`
  - pass with the same 3 pre-existing hook warnings in unrelated files
- `C:\nvm4w\nodejs\npm.cmd run build --workspace=@roomz/web`
  - pass

## Follow-up Convention

- For future user-facing VND inputs in this repo:
  - use `packages/web/src/components/ui/currency-input.tsx`
  - keep raw digits in form state
  - use `parseCurrencyInput` before validation or submit if the field can be stored with formatting
