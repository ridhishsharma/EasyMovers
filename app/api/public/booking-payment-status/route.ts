import { NextResponse } from "next/server";
import { PaymentProvider, PaymentTransactionStatus, PaymentTransactionType, PaymentGatewayOrderStatus, Prisma } from "@prisma/client";
import { readDraftSession } from "@/lib/enquiry-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (data: object, status = 200) => NextResponse.json(data, {
  status, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
});
const toPaise = (value: Prisma.Decimal) => Number(value.mul(100).toFixed(0));

/** Read-only authoritative projection; never confirm a booking from browser state. */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const reference = new URL(request.url).searchParams.get("reference")?.trim() || "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference)) {
      return reply({ success: false, message: "Invalid customer reference." }, 400);
    }
    const session = readDraftSession(request, reference);
    if (!session) return reply({ success: false, verificationRequired: true, message: "Verify your registered mobile first." }, 401);

    const booking = await prisma.booking.findFirst({
      where: { leadId: session.id, leadReferenceId: reference },
      orderBy: { createdAt: "desc" },
      select: { id: true, bookingNumber: true, bookingStatus: true, selectedQuotationId: true,
        payments: { select: { id: true, quotationId: true, paymentNumber: true, paymentStatus: true,
          currency: true, totalAmount: true, advanceAmount: true, paidAmount: true,
          commercialReference: true,
          gatewayOrders: { where: { provider: PaymentProvider.RAZORPAY }, select: {
            gatewayOrderId: true, amount: true, currency: true, status: true,
          } },
          transactions: { where: { provider: PaymentProvider.RAZORPAY,
            transactionType: PaymentTransactionType.COLLECTION, status: PaymentTransactionStatus.SUCCESS },
            select: { gatewayPaymentId: true, gatewayOrderId: true, amount: true, currency: true },
          },
        } },
      },
    });
    if (!booking) return reply({ success: false, message: "Booking not found." }, 404);
    const payment = booking.payments;
    if (!payment || !booking.selectedQuotationId || payment.quotationId !== booking.selectedQuotationId ||
        !payment.commercialReference || payment.currency !== "INR" || !payment.advanceAmount) {
      return reply({ success: true, data: { bookingNumber: booking.bookingNumber,
        bookingStatus: booking.bookingStatus, stage: "ADVANCE_NOT_PREPARED", advanceVerified: false,
        bookingConfirmed: false } });
    }
    const advance = toPaise(payment.advanceAmount);
    const paid = toPaise(payment.paidAmount);
    if (!Number.isSafeInteger(advance) || advance <= 0 || !Number.isSafeInteger(paid) || paid < 0) {
      return reply({ success: false, code: "FINANCIAL_REVIEW_REQUIRED", message: "Payment details require review." }, 409);
    }
    const verifiedCollections = payment.transactions.filter(t => t.gatewayPaymentId && t.gatewayOrderId &&
      t.currency === "INR" && payment.gatewayOrders.some(o => o.gatewayOrderId === t.gatewayOrderId &&
        o.status === PaymentGatewayOrderStatus.PAID && o.currency === "INR" && toPaise(o.amount) === toPaise(t.amount)));
    const verifiedAmount = verifiedCollections.reduce((sum, t) => sum + toPaise(t.amount), 0);
    const advanceVerified = paid >= advance && verifiedAmount >= advance;
    const hasCapturedOrder = payment.gatewayOrders.some(o => o.status === PaymentGatewayOrderStatus.PAID);
    const stage = advanceVerified ? "ADVANCE_VERIFIED" : hasCapturedOrder || paid > 0 ? "PAYMENT_RECONCILIATION" : "ADVANCE_PENDING";

    return reply({ success: true, data: {
      bookingNumber: booking.bookingNumber, bookingStatus: booking.bookingStatus,
      paymentNumber: payment.paymentNumber, paymentStatus: payment.paymentStatus,
      currency: "INR", totalAmount: Number(payment.totalAmount),
      advanceAmount: Number(payment.advanceAmount), paidAmount: Number(payment.paidAmount),
      stage: booking.bookingStatus === "CONFIRMED" && advanceVerified ? "BOOKING_CONFIRMED" : stage,
      advanceVerified, bookingConfirmed: booking.bookingStatus === "CONFIRMED" && advanceVerified,
    } });
  } catch (error) {
    console.error(`[CUSTOMER_PAYMENT_STATUS_FAILED:${requestId}]`, error);
    return reply({ success: false, message: `Payment status is temporarily unavailable. Reference: ${requestId}` }, 503);
  }
}
