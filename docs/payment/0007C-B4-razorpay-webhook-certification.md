# B4 — Razorpay Test Mode webhook certification

Status: PLAN ONLY; no test execution or production deployment authorized.
Baseline: B3.1–B3.5 passed locally. Local test files/runner must be preserved and committed before B4 work.

## Current implementation (reviewed)
- Route: `app/api/payments/razorpay/webhook/route.ts` (POST `/api/payments/razorpay/webhook`).
- Reads raw request body, caps it at 128 KiB, verifies `x-razorpay-signature`, ignores non-`payment.captured` events.
- Reconciles order and payment with Razorpay server-side, then records a successful collection and synchronizes booking.
- `PaymentWebhook` uses provider + event ID; the route compares payload hash and payment/order IDs for replay conflicts.
- Existing financial transaction with gateway payment ID is checked before collection; sync replay is supported.
- Open review point: error logging must not expose credentials, raw webhook payload, or customer data.
- Open review point: receipt inserted before financial collection must be recoverable after a 503.

## Safety and preparation
1. Do not use production Railway, production Razorpay keys, or default DATABASE_URL.
2. Restore/commit B2/B3 tests and guarded runner, then recover any deleted untracked application files from IDE/OS backups.
3. Use only local `easymovers_payment_test` with `.env.payment-test` and existing runner guard.
4. Keep Razorpay credentials in ignored environment files; never print or commit secrets.
5. Never acknowledge a failed financial write or booking sync as processed.

## Certification cases
B4.1 Authentication and parsing:
- Valid raw-body HMAC signature; invalid/missing signature => 401 and no DB writes.
- Tampered body => 401; invalid JSON => 400; >128 KiB => 413.
- Non-capture event => ignored, no financial mutation.
- Missing Razorpay test configuration => 503.

B4.2 Replay and concurrency:
- First valid capture records exactly one SUCCESS transaction, correct balance and booking sync.
- Same signed event delivered again: no double-credit; processed receipt remains correct.
- Different event IDs for same gateway payment: no double-credit.
- Same event ID with changed hash/order/payment: 409, no financial mutation.
- Concurrent delivery of same event: at most one financial credit; retries converge.

B4.3 Interrupted processing and recovery:
- Inject failure after receipt insert but before financial write; assert 503, zero financial credit.
- Retry same event; assert one credit and processed receipt.
- Inject failure after financial commit but before booking sync; retry must sync booking without another credit.
- Inject failure before marking receipt processed; retry must finish and mark processed.

B4.4 Booking sync:
- Validate booking ID, quotation linkage, advance amount, payment status and sync status.
- Simulate sync failure; webhook returns retryable 503 and eventually converges.
- Check no stale sync snapshot overwrites newer payment state.

B4.5 Reconciliation and release gates:
- Wrong order, amount, currency, or captured status must never credit payment.
- Verify provider lookup failure returns retryable status.
- Verify unique constraints, durable receipt state and failure audit.
- Run isolated suite repeatedly, full payment regression, `npm run build`, and review log redaction.
- No merge/push to release branch or deployment without explicit approval.

## Execution order
A. Preserve current local work, review recovery state and B3 tests.
B. Add isolated B4 test suite and runner entry, then run B4.1.
C. Implement B4.2 through B4.5 incrementally; fix production code only on a separate development branch after failing tests prove the defect.
D. Remove temporary `[B2-ROOT-CAUSE]` logs, rerun regression/build, review before any release.
