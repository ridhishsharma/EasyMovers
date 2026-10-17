import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { transformSync } from "esbuild";
import {
  PaymentGatewayOrderStatus, PaymentProvider, PaymentTransactionStatus,
  PaymentTransactionType, Prisma,
} from "@prisma/client";

// Execute the real route with allowlisted imports; no database or network access.
const compiled = transformSync(readFileSync(resolve("app/api/public/booking-finalize/route.ts"), "utf8"), {
  loader: "ts", format: "cjs", target: "node20",
}).code;
const decimal = (value: number) => new Prisma.Decimal(value);
function harness() {
  const current = { bookingStatus: "VENDOR_SELECTED", selectedQuotationId: "quote-test", vendorId: "vendor-test" as string | null };
  let quotation: { vendorId: string; bookingId?: string; leadId?: string } | null = { vendorId: "vendor-test" };
  const payment = {
    quotationId: "quote-test", vendorId: "vendor-test" as string | null, currency: "INR",
    advanceAmount: decimal(100), paidAmount: decimal(100), totalAmount: decimal(1000),
    commercialReference: { version: "TEST" } as object | null,
    gatewayOrders: [{ gatewayOrderId: "order-test", amount: decimal(100), currency: "INR", status: PaymentGatewayOrderStatus.PAID as PaymentGatewayOrderStatus }],
    transactions: [{ gatewayPaymentId: "payment-test", gatewayOrderId: "order-test", amount: decimal(100), currency: "INR" }],
  };
  const events: string[] = [];
  const updates: unknown[] = [];
  const audits: unknown[] = [];
  const tx = {
    booking: {
      findFirst: async () => ({ id: "booking-test", bookingNumber: "EM-TEST123", ...current }),
      findUniqueOrThrow: async (args: { select: object }) => {
        assert.ok(events.includes("booking-lock"));
        assert.deepEqual(args.select, { bookingStatus: true, selectedQuotationId: true, vendorId: true });
        return { ...current };
      },
      updateMany: async (args: { where: object; data: { bookingStatus: string } }) => {
        assert.deepEqual(args.where, { id: "booking-test", bookingStatus: "VENDOR_SELECTED", selectedQuotationId: "quote-test", vendorId: "vendor-test" });
        assert.deepEqual(args.data, { bookingStatus: "CONFIRMED" });
        updates.push(args);
        current.bookingStatus = args.data.bookingStatus;
        return { count: 1 };
      },
    },
    quotation: {
      findFirst: async (args: { where: object; select: object }) => {
        assert.ok(events.includes("booking-lock"));
        // The real query excludes foreign-booking and foreign-lead quotations.
        assert.deepEqual(args.where, { id: "quote-test", bookingId: "booking-test", leadId: "lead-test" });
        assert.deepEqual(args.select, { vendorId: true });
        if (quotation?.bookingId && quotation.bookingId !== "booking-test") return null;
        if (quotation?.leadId && quotation.leadId !== "lead-test") return null;
        return quotation;
      },
    },
    payment: {
      findUniqueOrThrow: async (args: { select: Record<string, unknown> }) => {
        assert.ok(events.includes("payment-lock"));
        assert.equal(args.select.vendorId, true);
        assert.deepEqual(args.select.transactions, {
          where: { provider: PaymentProvider.RAZORPAY, transactionType: PaymentTransactionType.COLLECTION, status: PaymentTransactionStatus.SUCCESS },
          select: { gatewayPaymentId: true, gatewayOrderId: true, amount: true, currency: true },
        });
        return payment;
      },
    },
    $queryRaw: async (strings: TemplateStringsArray) => {
      const sql = strings.join("?");
      assert.match(sql, /FOR UPDATE/);
      if (sql.includes('FROM "Booking"')) { events.push("booking-lock"); return [{ id: "booking-test" }]; }
      assert.match(sql, /FROM "Payment"/);
      events.push("payment-lock");
      return [{ id: "payment-record-test" }];
    },
    crmAuditLog: { create: async (args: unknown) => { audits.push(args); } },
  };
  const dependencies: Record<string, unknown> = {
    "next/server": { NextResponse: { json: (body: unknown, init: ResponseInit) => Response.json(body, init) } },
    "@prisma/client": { PaymentGatewayOrderStatus, PaymentProvider, PaymentTransactionStatus, PaymentTransactionType, Prisma },
    "@/lib/enquiry-session": { checkOrigin: () => {}, readDraftSession: () => ({ id: "lead-test" }) },
    "@/lib/prisma": { prisma: { $transaction: async (callback: (client: typeof tx) => Promise<unknown>, options: object) => {
      assert.deepEqual(options, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 5000 });
      return callback(tx);
    } } },
  };
  const module = { exports: {} as { POST: (request: Request) => Promise<Response> } };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return {
    current, payment, updates, audits, events,
    setQuotation: (value: typeof quotation) => { quotation = value; },
    post: () => module.exports.POST(new Request("http://localhost/api/public/booking-finalize", {
      method: "POST", body: JSON.stringify({ reference: "EM-TEST123" }),
    })),
  };
}

test("matching identities finalize once and repeated valid finalization is idempotent", async () => {
  const h = harness();
  const first = await h.post();
  assert.equal(first.status, 200);
  assert.deepEqual((await first.json()).data, { confirmed: true, changed: true, bookingNumber: "EM-TEST123" });
  const replay = await h.post();
  assert.equal(replay.status, 200);
  assert.equal((await replay.json()).data.changed, false);
  assert.equal(h.updates.length, 1);
  assert.equal(h.audits.length, 1);
  assert.equal(h.current.vendorId, "vendor-test");
});

const identityCases: Array<[string, (h: ReturnType<typeof harness>) => void]> = [
  ["missing quotation", h => h.setQuotation(null)],
  ["foreign-booking quotation excluded by ownership query", h => h.setQuotation({ vendorId: "vendor-test", bookingId: "other-booking" })],
  ["foreign-lead quotation excluded by ownership query", h => h.setQuotation({ vendorId: "vendor-test", leadId: "other-lead" })],
  ["invalid quotation vendor", h => h.setQuotation({ vendorId: "  " })],
  ["mismatched payment vendor", h => { h.payment.vendorId = "other-vendor"; }],
  ["missing payment vendor", h => { h.payment.vendorId = null; }],
  ["mismatched booking vendor", h => { h.current.vendorId = "other-vendor"; }],
  ["null booking vendor requires review without repair", h => { h.current.vendorId = null; }],
];
for (const status of ["VENDOR_SELECTED", "CONFIRMED"]) {
  for (const [name, arrange] of identityCases) {
    test(`${status}: ${name} fails closed before writes or replay success`, async () => {
      const h = harness();
      h.current.bookingStatus = status;
      arrange(h);
      const response = await h.post();
      assert.equal(response.status, 409);
      const body = await response.json();
      assert.deepEqual(body, { success: false, code: "BOOKING_VENDOR_REVIEW_REQUIRED", message: "Booking confirmation requires staff review. Please contact EasyMovers." });
      assert.equal(h.updates.length, 0);
      assert.equal(h.audits.length, 0);
      assert.equal(h.current.bookingStatus, status);
      assert.doesNotMatch(JSON.stringify(body), /vendor-test|other-vendor|quote-test|booking-test|lead-test/);
    });
  }
}

const financialCases: Array<[string, string, (h: ReturnType<typeof harness>) => void]> = [
  ["different payment quotation", "PAYMENT_NOT_READY", h => { h.payment.quotationId = "other-quote"; }],
  ["missing commercial snapshot", "PAYMENT_NOT_READY", h => { h.payment.commercialReference = null; }],
  ["unsupported currency", "PAYMENT_NOT_READY", h => { h.payment.currency = "USD"; }],
  ["insufficient advance", "ADVANCE_NOT_VERIFIED", h => { h.payment.paidAmount = decimal(99); }],
  ["overpayment", "ADVANCE_NOT_VERIFIED", h => { h.payment.paidAmount = decimal(1001); }],
  ["zero advance", "ADVANCE_NOT_VERIFIED", h => { h.payment.advanceAmount = decimal(0); }],
  ["missing verified collections", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.transactions = []; }],
  ["duplicate collection", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.transactions.push({ ...h.payment.transactions[0] }); }],
  ["unpaid gateway order", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.gatewayOrders[0].status = PaymentGatewayOrderStatus.CREATED; }],
  ["missing gateway order", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.gatewayOrders = []; }],
  ["order amount mismatch", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.gatewayOrders[0].amount = decimal(101); }],
  ["collection amount mismatch", "PAYMENT_RECONCILIATION_REQUIRED", h => { h.payment.transactions[0].amount = decimal(99); }],
];
for (const status of ["VENDOR_SELECTED", "CONFIRMED"]) {
  for (const [name, code, arrange] of financialCases) {
    test(`${status}: ${name} retains reconciliation safeguard`, async () => {
      const h = harness();
      h.current.bookingStatus = status;
      arrange(h);
      const response = await h.post();
      assert.equal(response.status, 409);
      assert.equal((await response.json()).code, code);
      assert.equal(h.updates.length, 0);
      assert.equal(h.audits.length, 0);
    });
  }
}
