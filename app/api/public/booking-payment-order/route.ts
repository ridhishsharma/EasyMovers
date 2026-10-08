import { NextResponse } from "next/server";
import { PaymentGatewayOrderStatus, PaymentProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkOrigin, readDraftSession } from "@/lib/enquiry-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const active = [PaymentGatewayOrderStatus.CREATED, PaymentGatewayOrderStatus.PENDING];

class OrderError extends Error {
  constructor(readonly code: string, message: string, readonly status = 409) { super(message); }
}

function paise(value: Prisma.Decimal): number {
  const n = Number(value.mul(100).toFixed(0));
  if (!Number.isSafeInteger(n) || n <= 0) throw new OrderError("INVALID_ADVANCE", "Booking advance is invalid.");
  return n;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    checkOrigin(request);
    const body: unknown = await request.json();
    const reference = body && typeof body === "object" && "reference" in body && typeof body.reference === "string"
      ? body.reference.trim() : "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference)) return reply({ success: false, message: "Invalid reference." }, 400);
    const session = readDraftSession(request, reference);
    if (!session) return reply({ success: false, verificationRequired: true, message: "Verify your registered mobile first." }, 401);

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    if (!keyId.startsWith("rzp_test_") || !keySecret) {
      throw new OrderError("RAZORPAY_TEST_NOT_CONFIGURED", "Razorpay Test Mode is not configured.", 503);
    }

    // Lock the canonical Payment row while checking/reusing/creating an order.
    // This prevents concurrent customer clicks from generating multiple active orders.
    const order = await prisma.$transaction(async tx => {
      const booking = await tx.booking.findFirst({
        where: { leadId: session.id, leadReferenceId: reference },
        orderBy: { createdAt: "desc" },
        select: { id: true, selectedQuotationId: true, bookingNumber: true },
      });
      if (!booking?.selectedQuotationId) throw new OrderError("BOOKING_NOT_READY", "Select and prepare a quotation first.");

      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Payment" WHERE "bookingId" = ${booking.id} FOR UPDATE
      `;
      if (rows.length !== 1) throw new OrderError("PAYMENT_NOT_PREPARED", "Prepare booking confirmation before payment.");

      const payment = await tx.payment.findUnique({
        where: { bookingId: booking.id },
        select: {
          id: true, quotationId: true, paymentStatus: true, currency: true,
          advanceAmount: true, paidAmount: true, totalAmount: true, commercialReference: true,
          gatewayOrders: { where: { provider: PaymentProvider.RAZORPAY }, orderBy: { createdAt: "desc" },
            select: { gatewayOrderId: true, amount: true, currency: true, status: true } },
        },
      });
      if (!payment || payment.quotationId !== booking.selectedQuotationId ||
          !payment.commercialReference || payment.currency !== "INR" || !payment.advanceAmount) {
        throw new OrderError("PAYMENT_SNAPSHOT_INVALID", "Booking payment requires staff review.");
      }
      const advance = paise(payment.advanceAmount);
      const paid = Number(payment.paidAmount.mul(100).toFixed(0));
      if (!Number.isSafeInteger(paid) || paid < 0 || paid > advance) {
        throw new OrderError("PAYMENT_BALANCE_INVALID", "Payment balance requires staff review.");
      }
      if (paid >= advance) throw new OrderError("ADVANCE_ALREADY_PAID", "Booking advance is already collected.");
      const due = advance - paid;
      const existing = payment.gatewayOrders.find( item => item.status === "CREATED" || item.status === "PENDING")
      if (existing) {
        if (existing.currency !== "INR" || Number(existing.amount.mul(100).toFixed(0)) !== due) {
          throw new OrderError("ORDER_REVIEW_REQUIRED", "An existing order requires staff review.");
        }
        return { orderId: existing.gatewayOrderId, amount: due, currency: "INR", keyId, reused: true };
      }
      if (payment.gatewayOrders.some(item => item.status === PaymentGatewayOrderStatus.PAID)) {
        throw new OrderError("ORDER_RECONCILIATION_REQUIRED", "Payment confirmation is being reconciled.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      let gateway: Response;
      try {
        gateway = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
          body: JSON.stringify({ amount: due, currency: "INR", receipt: booking.bookingNumber.slice(0, 40),
            notes: { bookingId: booking.id, paymentId: payment.id, milestone: "BOOKING_ADVANCE" } }),
        });
      } finally { clearTimeout(timeout); }
      if (!gateway.ok) throw new OrderError("GATEWAY_ORDER_FAILED", "Payment gateway could not create an order.", 502);
      const result: unknown = await gateway.json();
      if (!result || typeof result !== "object" || !("id" in result) ||
          typeof result.id !== "string" || !result.id.startsWith("order_") ||
          !("amount" in result) || result.amount !== due ||
          !("currency" in result) || result.currency !== "INR") {
        throw new OrderError("GATEWAY_RESPONSE_INVALID", "Payment gateway returned an invalid order.", 502);
      }
      await tx.paymentGatewayOrder.create({ data: {
        paymentId: payment.id, provider: PaymentProvider.RAZORPAY,
        gatewayOrderId: result.id, amount: new Prisma.Decimal(due).div(100), currency: "INR",
        status: PaymentGatewayOrderStatus.CREATED, receiptReference: booking.bookingNumber,
        metadata: { milestone: "BOOKING_ADVANCE", source: "CUSTOMER_WEB" },
      } });
      return { orderId: result.id, amount: due, currency: "INR", keyId, reused: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 5000 });
    return reply({ success: true, data: order });
  } catch (error) {
    if (error instanceof OrderError) return reply({ success: false, code: error.code, message: error.message }, error.status);
    if (error instanceof SyntaxError) return reply({ success: false, message: "Invalid JSON body." }, 400);
    if (error instanceof Error && error.message === "Invalid origin") return reply({ success: false, message: "Origin not permitted." }, 403);
    console.error(`[RAZORPAY_ORDER_CREATE_FAILED:${requestId}]`, error);
    return reply({ success: false, message: `Unable to create payment order. Reference: ${requestId}` }, 503);
  }
}
