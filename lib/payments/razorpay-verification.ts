import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Server-only verification utilities. Never accept payment success from the browser alone. */
export class RazorpayVerificationError extends Error {
  constructor(readonly code: string, message: string, readonly status = 409) {
    super(message);
    this.name = "RazorpayVerificationError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const validId = (value: string, prefix: string) =>
  value.startsWith(prefix) && /^[A-Za-z0-9_]+$/.test(value) && value.length <= 100;

export function verifyRazorpayCheckoutSignature(
  orderId: string, paymentId: string, signature: string, keySecret: string,
): boolean {
  if (!validId(orderId, "order_") || !validId(paymentId, "pay_") ||
      !/^[a-fA-F0-9]{64}$/.test(signature) || !keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string, signature: string, webhookSecret: string,
): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(signature) || !webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

async function gatewayGet(path: string, keyId: string, keySecret: string): Promise<unknown> {
  if (!keyId.startsWith("rzp_test_") || !keySecret) {
    throw new RazorpayVerificationError("RAZORPAY_TEST_NOT_CONFIGURED", "Razorpay Test Mode is not configured.", 503);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method: "GET", signal: controller.signal,
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
      cache: "no-store",
    });
    if (!response.ok) throw new RazorpayVerificationError("RAZORPAY_LOOKUP_FAILED", "Unable to verify gateway payment state. Try again later.", 503);
    return await response.json() as unknown;
  } catch (error) {
    if (error instanceof RazorpayVerificationError) throw error;
    throw new RazorpayVerificationError("RAZORPAY_LOOKUP_FAILED", "Unable to verify gateway payment state. Try again later.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

export type VerifiedRazorpayPayment = {
  id: string; orderId: string; amount: number; currency: "INR"; captured: true;
};

/** Call only after signature verification. This does not write to the database. */
export async function fetchCapturedRazorpayPayment(
  paymentId: string, expectedOrderId: string, expectedAmountPaise: number,
  keyId: string, keySecret: string,
): Promise<VerifiedRazorpayPayment> {
  if (!validId(paymentId, "pay_") || !validId(expectedOrderId, "order_") ||
      !Number.isSafeInteger(expectedAmountPaise) || expectedAmountPaise <= 0) {
    throw new RazorpayVerificationError("INVALID_PAYMENT_DETAILS", "Invalid payment verification request.", 400);
  }
  const item = await gatewayGet(`payments/${paymentId}`, keyId, keySecret);
  if (!isRecord(item) || item.id !== paymentId || item.order_id !== expectedOrderId ||
      item.amount !== expectedAmountPaise || item.currency !== "INR" ||
      item.status !== "captured" || item.captured !== true) {
    throw new RazorpayVerificationError("PAYMENT_NOT_VERIFIED", "Payment is not captured or does not match the booking.");
  }
  return { id: paymentId, orderId: expectedOrderId, amount: expectedAmountPaise, currency: "INR", captured: true };
}

/** Check remote order AND payment attempts before reusing a locally pending order. */
export async function inspectRazorpayOrder(orderId: string, keyId: string, keySecret: string): Promise<{
  amount: number; currency: "INR"; requiresReconciliation: boolean;
}> {
  if (!validId(orderId, "order_")) {
    throw new RazorpayVerificationError("INVALID_ORDER_ID", "Invalid gateway order identifier.", 400);
  }
  const [order, payments] = await Promise.all([
    gatewayGet(`orders/${orderId}`, keyId, keySecret),
    gatewayGet(`orders/${orderId}/payments`, keyId, keySecret),
  ]);
  if (!isRecord(order) || order.id !== orderId || !Number.isSafeInteger(order.amount) ||
      (order.amount as number) <= 0 || order.currency !== "INR" ||
      !["created", "attempted", "paid"].includes(String(order.status))) {
    throw new RazorpayVerificationError("GATEWAY_ORDER_INVALID", "Gateway order requires manual review.");
  }
  if (!isRecord(payments) || !Array.isArray(payments.items) ||
      typeof payments.count !== "number" || payments.count !== payments.items.length) {
    // Incomplete/paginated responses must not be mistaken for no payments.
    throw new RazorpayVerificationError("GATEWAY_PAYMENTS_INCOMPLETE", "Gateway payment history requires review.");
  }
  const needsReview = payments.items.some(item => !isRecord(item) ||
    item.order_id !== orderId || !["failed", "refunded"].includes(String(item.status)));
  return { amount: order.amount as number, currency: "INR",
    requiresReconciliation: order.status === "paid" || needsReview };
}
