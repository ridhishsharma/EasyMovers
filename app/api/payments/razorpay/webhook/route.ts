import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { PaymentProvider as PrismaPaymentProvider, Prisma } from "@prisma/client";
import { PaymentProvider, PaymentPurpose } from "@/domains/payment/models/payment.model";
import { prisma } from "@/lib/prisma";
import {
  fetchCapturedRazorpayPayment,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay-verification";
import { resolvePaymentApiCollectionWorkflowService } from "@/app/api/payments/_lib/payment-api.module";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const respond = (body: object, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const paise = (v: Prisma.Decimal) => Number(v.mul(100).toFixed(0));

/** Razorpay sends raw, signed JSON. This route must NOT use the normalized webhook endpoint. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret || !keyId.startsWith("rzp_test_") || !keySecret) {
    return respond({ success: false, code: "RAZORPAY_TEST_NOT_CONFIGURED" }, 503);
  }

  let raw: string;
  try {
    if (Number(request.headers.get("content-length") || 0) > 131072) return respond({ success: false }, 413);
    raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 131072) return respond({ success: false }, 413);
  } catch {
    return respond({ success: false }, 400);
  }
  if (!verifyRazorpayWebhookSignature(raw, request.headers.get("x-razorpay-signature") || "", secret)) {
    return respond({ success: false, code: "INVALID_WEBHOOK_SIGNATURE" }, 401);
  }

  let event: unknown;
  try { event = JSON.parse(raw) as unknown; } catch { return respond({ success: false }, 400); }
  if (!isRecord(event) || typeof event.event !== "string") return respond({ success: false }, 400);
  // Non-capture events must never change financial state.
  if (event.event !== "payment.captured") return respond({ success: true, ignored: true });

  const payload = event.payload;
  const entity = isRecord(payload) && isRecord(payload.payment) ? payload.payment.entity : null;
  if (!isRecord(entity) || typeof entity.id !== "string" || !/^pay_[A-Za-z0-9_]+$/.test(entity.id) ||
      typeof entity.order_id !== "string" || !/^order_[A-Za-z0-9_]+$/.test(entity.order_id)) {
    return respond({ success: false, code: "INVALID_CAPTURE_EVENT" }, 400);
  }
  const paymentId = entity.id;
  const orderId = entity.order_id;
  const hash = createHash("sha256").update(raw).digest("hex");
  const suppliedEventId = request.headers.get("x-razorpay-event-id")?.trim();
  const eventId = suppliedEventId && /^[A-Za-z0-9_:-]{1,160}$/.test(suppliedEventId)
    ? suppliedEventId : `sha256:${hash}`;

  try {
    const order = await prisma.paymentGatewayOrder.findUnique({
      where: { gatewayOrderId: orderId },
      select: {
        paymentId: true, provider: true, amount: true, currency: true,
        payment: { select: { id: true, bookingId: true, quotationId: true,
          advanceAmount: true, currency: true, commercialReference: true } },
      },
    });
    if (!order || order.provider !== PrismaPaymentProvider.RAZORPAY ||
        order.currency !== "INR" || order.payment.currency !== "INR" ||
        !order.payment.bookingId || !order.payment.quotationId || !order.payment.commercialReference ||
        !order.payment.advanceAmount) {
      // Unknown captured payments require investigation; never acknowledge as reconciled.
      return respond({ success: false, code: "ORDER_RECONCILIATION_REQUIRED" }, 503);
    }
    const amount = paise(order.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount !== paise(order.payment.advanceAmount)) {
      return respond({ success: false, code: "ADVANCE_MISMATCH" }, 503);
    }
    // The signed event is not proof of capture or of amount: independently query Razorpay.
    await fetchCapturedRazorpayPayment(paymentId, orderId, amount, keyId, keySecret);

    const prior = await prisma.paymentWebhook.findUnique({
      where: { provider_providerEventId: { provider: PrismaPaymentProvider.RAZORPAY, providerEventId: eventId } },
    });
    if (prior && (prior.payloadHash !== hash || prior.gatewayOrderId !== orderId ||
        prior.gatewayPaymentId !== paymentId || prior.paymentId !== order.paymentId)) {
      return respond({ success: false, code: "WEBHOOK_REPLAY_CONFLICT" }, 409);
    }
    if (!prior) {
      try {
        await prisma.paymentWebhook.create({ data: {
          webhookId: `RZP-${crypto.randomUUID()}`, provider: PrismaPaymentProvider.RAZORPAY,
          providerEventId: eventId, payloadHash: hash, eventType: "payment.captured",
          gatewayOrderId: orderId, gatewayPaymentId: paymentId, paymentId: order.paymentId,
        } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
        // Concurrent webhook delivery: the winning request owns the receipt.
        return respond({ success: false, code: "WEBHOOK_RETRY_REQUIRED" }, 503);
      }
    }

    const existing = await prisma.paymentTransaction.findUnique({
      where: { gatewayPaymentId: paymentId },
      select: { paymentId: true, gatewayOrderId: true, amount: true, currency: true, status: true },
    });
    if (existing && (existing.paymentId !== order.paymentId || existing.gatewayOrderId !== orderId ||
        existing.currency !== "INR" || existing.status !== "SUCCESS" || paise(existing.amount) !== amount)) {
      return respond({ success: false, code: "PAYMENT_REPLAY_CONFLICT" }, 409);
    }
    if (!existing) {
      const workflow = await resolvePaymentApiCollectionWorkflowService();
      await workflow.recordSuccessfulCollection({
        paymentId: order.paymentId, amount: amount / 100, currency: "INR",
        purpose: PaymentPurpose.ADVANCE, provider: PaymentProvider.RAZORPAY,
        gateway: { provider: PaymentProvider.RAZORPAY, gatewayOrderId: orderId, gatewayPaymentId: paymentId },
        updatedBy: "RAZORPAY_TEST_WEBHOOK", synchronizedBy: "RAZORPAY_TEST_WEBHOOK",
        remarks: "Razorpay Test Mode captured booking advance; verified server-side.",
      });
    }
    // Mark processed only after financial recording succeeded or an exact replay was verified.
    await prisma.paymentWebhook.updateMany({
      where: { provider: PrismaPaymentProvider.RAZORPAY, providerEventId: eventId,
        payloadHash: hash, gatewayOrderId: orderId, gatewayPaymentId: paymentId },
      data: { processed: true, processedAt: new Date(), errorCode: null, errorMessage: null },
    });
    return respond({ success: true, duplicate: Boolean(existing) });
  } catch (error) {
    // 5xx causes Razorpay to retry. Do not expose secrets or acknowledge failed recording.
    console.error(`[RAZORPAY_WEBHOOK_RECONCILIATION_FAILED:${requestId}]`, error);
    return respond({ success: false, code: "PAYMENT_RECONCILIATION_REQUIRED" }, 503);
  }
}
