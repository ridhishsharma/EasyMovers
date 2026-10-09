import { NextResponse } from "next/server";
import { PaymentProvider as PrismaPaymentProvider, PaymentGatewayOrderStatus, Prisma } from "@prisma/client";
import { PaymentProvider, PaymentPurpose } from "@/domains/payment/models/payment.model";
import { prisma } from "@/lib/prisma";
import { checkOrigin, readDraftSession } from "@/lib/enquiry-session";
import {
  RazorpayVerificationError,
  fetchCapturedRazorpayPayment,
  verifyRazorpayCheckoutSignature,
} from "@/lib/payments/razorpay-verification";
import { resolvePaymentApiCollectionWorkflowService } from "@/app/api/payments/_lib/payment-api.module";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

class VerifyError extends Error {
  constructor(readonly code: string, message: string, readonly status = 409) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function decimalPaise(value: Prisma.Decimal): number {
  const n = Number(value.mul(100).toFixed(0));
  if (!Number.isSafeInteger(n) || n <= 0) throw new VerifyError("INVALID_ORDER_AMOUNT", "Payment amount requires review.");
  return n;
}

/** Checkout callback is only a trigger. Gateway capture and financial state are independently verified. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    checkOrigin(request);
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new VerifyError("INVALID_REQUEST", "Invalid payment verification request.", 400);
    const { reference, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
    if (typeof reference !== "string" || !/^EM-[A-Z0-9-]{6,80}$/i.test(reference) ||
        typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") {
      throw new VerifyError("INVALID_REQUEST", "Missing payment verification details.", 400);
    }
    const session = readDraftSession(request, reference);
    if (!session) return reply({ success: false, verificationRequired: true, message: "Verify your registered mobile again." }, 401);
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keyId.startsWith("rzp_test_") || !keySecret) {
      throw new VerifyError("RAZORPAY_TEST_NOT_CONFIGURED", "Razorpay Test Mode is not configured.", 503);
    }
    if (!verifyRazorpayCheckoutSignature(orderId, paymentId, signature, keySecret)) {
      throw new VerifyError("INVALID_RAZORPAY_SIGNATURE", "Payment verification signature is invalid.", 403);
    }

    const booking = await prisma.booking.findFirst({
      where: { leadId: session.id, leadReferenceId: reference },
      orderBy: { createdAt: "desc" },
      select: { id: true, selectedQuotationId: true },
    });
    if (!booking?.selectedQuotationId) throw new VerifyError("BOOKING_NOT_READY", "Booking is not ready for payment.");
    const order = await prisma.paymentGatewayOrder.findUnique({
      where: { gatewayOrderId: orderId },
      select: { paymentId: true, amount: true, currency: true, provider: true, status: true,
        payment: { select: { bookingId: true, quotationId: true, advanceAmount: true,
          paidAmount: true, currency: true, totalAmount: true, commercialReference: true } } },
    });
    if (!order || order.provider !== PrismaPaymentProvider.RAZORPAY || order.payment.bookingId !== booking.id ||
        order.payment.quotationId !== booking.selectedQuotationId || order.currency !== "INR" ||
        order.payment.currency !== "INR" || !order.payment.commercialReference ||
        !order.payment.advanceAmount) {
      throw new VerifyError("ORDER_MISMATCH", "Payment order does not match this booking.");
    }
    const amount = decimalPaise(order.amount);
    if (amount !== decimalPaise(order.payment.advanceAmount)) {
      throw new VerifyError("ADVANCE_MISMATCH", "Payment amount does not match the booking advance.");
    }

    // A signed checkout callback is not proof of capture: always fetch from Razorpay.
    await fetchCapturedRazorpayPayment(paymentId, orderId, amount, keyId, keySecret);

    // Gateway payment IDs have a database unique constraint. A replay is a success only
    // when it matches the same aggregate, order and amount.
    const prior = await prisma.paymentTransaction.findUnique({
      where: { gatewayPaymentId: paymentId },
      select: { paymentId: true, gatewayOrderId: true, amount: true, currency: true, status: true },
    });
    if (prior) {
      if (prior.paymentId !== order.paymentId || prior.gatewayOrderId !== orderId ||
          decimalPaise(prior.amount) !== amount || prior.currency !== "INR" || prior.status !== "SUCCESS") {
        throw new VerifyError("PAYMENT_REPLAY_CONFLICT", "Payment identity requires manual review.");
      }
      return reply({ success: true, data: { verified: true, recorded: true, duplicate: true,
        bookingConfirmed: false }, message: "Payment was previously recorded. Booking confirmation is being processed." });
    }
    if (order.status === PaymentGatewayOrderStatus.PAID || Number(order.payment.paidAmount) !== 0) {
      throw new VerifyError("PAYMENT_RECONCILIATION_REQUIRED", "Payment is being reconciled. Do not pay again.");
    }
    if (order.status !== PaymentGatewayOrderStatus.CREATED && order.status !== PaymentGatewayOrderStatus.PENDING) {
      throw new VerifyError("ORDER_NOT_PAYABLE", "Gateway order requires manual review.");
    }

    // The canonical collection workflow owns the transaction, financial summary,
    // gateway-order transition and Booking financial projection.
    const workflow = await resolvePaymentApiCollectionWorkflowService();
    await workflow.recordSuccessfulCollection({
      paymentId: order.paymentId,
      amount: amount / 100,
      currency: "INR",
      purpose: PaymentPurpose.ADVANCE,
      provider: PaymentProvider.RAZORPAY,
      gateway: { provider: PaymentProvider.RAZORPAY, gatewayOrderId: orderId, gatewayPaymentId: paymentId },
      updatedBy: "RAZORPAY_TEST_CHECKOUT",
      synchronizedBy: "RAZORPAY_TEST_CHECKOUT",
      remarks: "Razorpay Test Mode captured booking advance; verified server-side.",
    });
    return reply({ success: true, data: { verified: true, recorded: true, duplicate: false,
      bookingConfirmed: false }, message: "Advance payment verified and recorded. Booking confirmation is pending." });
  } catch (error) {
    if (error instanceof VerifyError || error instanceof RazorpayVerificationError) {
      return reply({ success: false, code: error.code, message: error.message }, error.status);
    }
    if (error instanceof SyntaxError) return reply({ success: false, message: "Invalid JSON body." }, 400);
    if (error instanceof Error && error.message === "Invalid origin") return reply({ success: false, message: "Origin not permitted." }, 403);
    console.error(`[RAZORPAY_ADVANCE_VERIFY_FAILED:${requestId}]`, error);
    return reply({ success: false, code: "PAYMENT_RECONCILIATION_REQUIRED",
      message: `Payment verification needs reconciliation. Do not pay again. Reference: ${requestId}` }, 503);
  }
}
