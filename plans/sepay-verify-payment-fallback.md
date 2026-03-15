# SePay Verify Payment Fallback

## Goal
- Implement `verifyPayment(...)` so the QR payment flow can confirm a transfer even when SePay does not dispatch a webhook.

## Scope
- Add a server-side verifier that queries SePay transaction history with a server-only API key.
- Match transactions by `orderCode`, `amount`, and recent order window.
- Reuse `process_payment_order(...)` for reconciliation.
- Wire the QR modal polling to trigger direct verification while the order remains `pending`.

## Assumptions
- The current checkout flow stays `VietQR static + internal payment_orders`.
- SePay API key remains server-only and must never move to `VITE_*`.
- The current account number `0363565884` remains the payment destination unless overridden by env.

## Verification
- Unit tests for `verifyPayment` client contract.
- Lint passes.
- Web build passes.
- Edge function deploys successfully.
