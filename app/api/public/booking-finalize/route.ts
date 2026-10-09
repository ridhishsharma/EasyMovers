import { NextResponse } from "next/server";
import {
  PaymentGatewayOrderStatus, PaymentProvider, PaymentTransactionStatus,
  PaymentTransactionType, Prisma,
} from "@prisma/client";
import { checkOrigin, readDraftSession } from "@/lib/enquiry-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const reply = (body: object, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});
const paise = (value: Prisma.Decimal) => Number(value.mul(100).toFixed(0));

/** Finalize only a recorded, verified advance; browser checkout state is never trusted. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    checkOrigin(request);
    const body: unknown = await request.json();
    const reference = body && typeof body === "object" && !Array.isArray(body) &&
      "reference" in body && typeof body.reference === "string" ? body.reference.trim() : "";
    if (!/^EM-[A-Z0-9-]{6,80}$/i.test(reference))
      return reply({ success: false, message: "Enter a valid customer reference." }, 400);
    const session = readDraftSession(request, reference);
    if (!session) return reply({ success: false, verificationRequired: true, message: "Verify your registered mobile first." }, 401);

    const result = await prisma.$transaction(async tx => {
      const booking = await tx.booking.findFirst({
        where: { leadId: session.id, leadReferenceId: reference },
        orderBy: { createdAt: "desc" },
        select: { id: true, bookingNumber: true, bookingStatus: true, selectedQuotationId: true },
      });
      if (!booking) return { code: "BOOKING_NOT_FOUND", status: 404 } as const;
      // Serialize finalization against another finalizer, and against payment aggregate updates.
      await tx.$queryRaw`SELECT "id" FROM "Booking" WHERE "id" = ${booking.id} FOR UPDATE`;
      const current = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id }, select: { bookingStatus: true, selectedQuotationId: true },
      });
      if (!["VENDOR_SELECTED", "CONFIRMED"].includes(current.bookingStatus) || !current.selectedQuotationId)
        return { code: "BOOKING_NOT_READY", status: 409 } as const;

      const paymentRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Payment" WHERE "bookingId" = ${booking.id} FOR UPDATE`;
      if (paymentRows.length !== 1) return { code: "PAYMENT_NOT_READY", status: 409 } as const;
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentRows[0].id },
        select: {
          quotationId: true, currency: true, advanceAmount: true, paidAmount: true,
          totalAmount: true, commercialReference: true,
          gatewayOrders: { where: { provider: PaymentProvider.RAZORPAY }, select: {
            gatewayOrderId: true, amount: true, currency: true, status: true,
          } },
          transactions: { where: { provider: PaymentProvider.RAZORPAY,
            transactionType: PaymentTransactionType.COLLECTION,
            status: PaymentTransactionStatus.SUCCESS }, select: {
              gatewayPaymentId: true, gatewayOrderId: true, amount: true, currency: true,
            } },
        },
      });
      if (payment.quotationId !== current.selectedQuotationId || !payment.commercialReference ||
          payment.currency !== "INR" || !payment.advanceAmount)
        return { code: "PAYMENT_NOT_READY", status: 409 } as const;
      const advance = paise(payment.advanceAmount);
      const paid = paise(payment.paidAmount);
      const total = paise(payment.totalAmount);
      if (![advance, paid, total].every(Number.isSafeInteger) || advance <= 0 ||
          paid < advance || paid > total || total < advance)
        return { code: "ADVANCE_NOT_VERIFIED", status: 409 } as const;

      const seen = new Set<string>();
      let verified = 0;
      for (const transaction of payment.transactions) {
        if (!transaction.gatewayPaymentId || !transaction.gatewayOrderId ||
            transaction.currency !== "INR" || seen.has(transaction.gatewayPaymentId))
          return { code: "PAYMENT_RECONCILIATION_REQUIRED", status: 409 } as const;
        const amount = paise(transaction.amount);
        const order = payment.gatewayOrders.find(item => item.gatewayOrderId === transaction.gatewayOrderId);
        if (!Number.isSafeInteger(amount) || amount <= 0 || !order ||
            order.status !== PaymentGatewayOrderStatus.PAID || order.currency !== "INR" ||
            paise(order.amount) !== amount)
          return { code: "PAYMENT_RECONCILIATION_REQUIRED", status: 409 } as const;
        seen.add(transaction.gatewayPaymentId);
        verified += amount;
      }
      if (verified < advance || verified !== paid)
        return { code: "PAYMENT_RECONCILIATION_REQUIRED", status: 409 } as const;

      if (current.bookingStatus === "CONFIRMED")
        return { confirmed: true, changed: false, bookingNumber: booking.bookingNumber } as const;
      const changed = await tx.booking.updateMany({
        where: { id: booking.id, bookingStatus: "VENDOR_SELECTED", selectedQuotationId: current.selectedQuotationId },
        data: { bookingStatus: "CONFIRMED" },
      });
      if (changed.count !== 1) return { code: "BOOKING_STATE_CHANGED", status: 409 } as const;
      await tx.crmAuditLog.create({ data: {
        action: "CUSTOMER_BOOKING_CONFIRMED_AFTER_VERIFIED_ADVANCE",
        entityType: "Booking", entityId: booking.id,
        metadata: { bookingNumber: booking.bookingNumber, reference, requestId,
          verifiedAdvancePaise: verified, remainingPaise: total - paid },
      } });
      return { confirmed: true, changed: true, bookingNumber: booking.bookingNumber } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 5000 });

    if ("code" in result) return reply({ success: false, code: result.code,
      message: "Booking confirmation is awaiting verified advance reconciliation." }, result.status);
    return reply({ success: true, data: result,
      message: "Your booking is confirmed. The remaining payment milestones are still due." });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, message: "Invalid confirmation request." }, 400);
    if (error instanceof Error && error.message === "Invalid origin")
      return reply({ success: false, message: "Request origin was not permitted." }, 403);
    console.error(`[BOOKING_FINALIZE_FAILED:${requestId}]`, error);
    return reply({ success: false, message: `Booking confirmation temporarily unavailable. Reference: ${requestId}` }, 503);
  }
}
