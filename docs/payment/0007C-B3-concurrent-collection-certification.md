# 0007C-B3 — PostgreSQL concurrent collection certification

## Baseline
- B1 Serializable lost-update test: PASS (local)
- B2 real PostgreSQL collection + booking sync: PASS (local, 2026-10-10)
- B2 migration `20261010120000_add_payment_reconciliation_financial_snapshot_columns`: applied to isolated local test DB

## Non-negotiable safety
- Test only `127.0.0.1:5432/easymovers_payment_test`, user `easymovers_test_user`, schema `public`.
- Run via the existing guarded integration runner; never fall back to staging/production URLs.
- No production push, merge, deployment, or external gateway charges.
- No credentials, payment payloads, or personally identifying information in logs.

## Required B3 scenarios
1. **Competing collections:** Seed a fresh payment with total INR 1,000 and zero paid. Release two genuinely concurrent INR 700 collection calls using a barrier. Exactly one may commit; the other must fail with a bounded domain error (not a raw Prisma exception). Verify durable paid=700, balance=300, exactly one successful transaction, one booking-sync financial snapshot.
2. **Distinct concurrent collections within balance:** Two concurrent INR 400 and INR 600 requests on a fresh INR 1,000 payment. Both should commit or a retryable conflict should be handled transparently; durable paid=1,000, balance=0, exactly two successful transactions, sync reflects 1,000. No lost update.
3. **Duplicate gateway payment ID:** Concurrent requests carrying the same gateway payment ID must not double credit. Verify unique constraint, durable single successful transaction and paid amount counted once. Classify duplicate according to existing API contract (idempotent replay or explicit duplicate error).
4. **Rollback/recovery:** Inject a controlled failure after the transaction insert but before financial summary/sync, assert all writes rolled back. Retry without injection and verify a single correct collection.
5. **Replay after completion:** Repeating the same gateway ID after success must not change totals, transaction count, or booking sync.
6. **Isolation:** Test-created leads/bookings/payments/transactions/sync records are cleaned up without deleting unrelated records.

## Evidence for signoff
- Runner explicitly prints safe database identity (never credentials).
- Tests show real overlap; `Promise.all` alone without a synchronization barrier is insufficient proof of a race.
- Assertions query fresh Prisma state after both promises settle, not just in-memory return values.
- All failure paths assert financial invariants and avoid raw P2002/P2034/P2028 leakage.
- `git diff --check`, TypeScript/build and regression tests pass locally.

## Integration constraints
The remote branch currently lacks the user's uncommitted `tests/payment-integration/payment-collection-postgres.test.ts` and modified `scripts/run-payment-integration-tests.cjs`. Reuse those exact local fixtures and runner for B3; do not invent fixture factories or assume the GitHub copy matches the Windows working tree. Before writing the runnable B3 test, review these two local files and the current local `payment.service.ts` changes.

## Release gate
B3 is NOT certified until the local guarded test output confirms all cases. Keep the main working branch unpushed until review.
