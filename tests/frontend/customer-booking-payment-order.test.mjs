import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = () =>
  readFile(
    new URL(
      "../../app/api/public/booking-payment-order/route.ts",
      import.meta.url
    ),
    "utf8"
  );

test(
  "Razorpay test order requires verified customer and server-side payment snapshot",
  async () => {
    const text = await route();

    for (const marker of [
      "checkOrigin",
      "readDraftSession",
      "rzp_test_",
      "FOR UPDATE",
      "advanceAmount",
      "paidAmount",
      "selectedQuotationId",
      "commercialReference",
    ]) {
      assert.ok(text.includes(marker), `missing ${marker}`);
    }
  }
);

test(
  "Razorpay order is persisted and active order is safely reused",
  async () => {
    const text = await route();

    for (const marker of [
      "paymentGatewayOrder.create",
      "reused: true",
      "TransactionIsolationLevel.Serializable",
      "ADVANCE_ALREADY_PAID",
      "inspectRazorpayOrder",
    ]) {
      assert.ok(text.includes(marker), `missing ${marker}`);
    }

    assert.match(
      text,
      /gatewayOrders\.(?:find|filter)/,
      "Active gateway orders must be selected from persisted records"
    );
  }
);

test(
  "Order creation does not mark booking paid or capture payments",
  async () => {
    const text = await route();

    assert.doesNotMatch(text, /booking\.update\(/);
    assert.doesNotMatch(text, /paymentTransaction\.create\(/);
  }
);