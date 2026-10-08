import { FinancialBusinessSegment, Prisma, QuotationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const money = (value: number) => Math.round(value * 100) / 100;

// Booking deposit is credited toward the quotation total, not charged on top.
export function bookingAdvancePolicy(totalAmount: number) {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new CustomerBookingConfirmationError("INVALID_BOOKING_AMOUNT", "Invalid booking total.", 409);
  }
  const gstText = process.env.BOOKING_MINIMUM_GST_PERCENT;
  const gstPercent = gstText === undefined || gstText.trim() === "" ? NaN : Number(gstText);
  if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100) {
    throw new CustomerBookingConfirmationError("BOOKING_GST_NOT_CONFIGURED", "Booking minimum GST rate is not configured.", 503);
  }
  const percentage = 10;
  const minimum = 499;
  const minimumWithGst = money(minimum * (1 + gstPercent / 100));
  const amount = money(Math.min(totalAmount, Math.max(minimumWithGst, totalAmount * percentage / 100)));
  const pickupDue = money(Math.max(0, totalAmount * 0.5 - amount));
  const unpackingDue = money(Math.max(0, totalAmount - amount - pickupDue));
  return { percentage, minimum, gstPercent, minimumWithGst, amount, pickupDue, unpackingDue };
}

function businessSegment(moveType: string, serviceType: string): FinancialBusinessSegment {
  if (serviceType.includes("CORPORATE") || serviceType.includes("OFFICE")) return FinancialBusinessSegment.CORPORATE_RELOCATION;
  return moveType === "WITHIN_CITY" ? FinancialBusinessSegment.WITHIN_CITY_QUOTATION : FinancialBusinessSegment.INTERCITY_QUOTATION;
}

export async function prepareCustomerBookingConfirmation(leadId: string, reference: string, requestId: string) {
  return prisma.$transaction(async tx => {
    const booking = await tx.booking.findFirst({
      where: { leadId, leadReferenceId: reference }, orderBy: { createdAt: "desc" },
      select: { id: true, bookingNumber: true, selectedQuotationId: true, moveType: true, serviceType: true },
    });
    if (!booking?.selectedQuotationId) throw new CustomerBookingConfirmationError("QUOTATION_REQUIRED", "Choose a quotation before confirming the booking.", 409);
    const quotation = await tx.quotation.findFirst({
      where: { id: booking.selectedQuotationId, bookingId: booking.id, leadId },
      select: { id: true, quotationNumber: true, status: true, totalAmount: true, currency: true, pickupDate: true, deliveryDate: true, validUntil: true, vendorId: true, vendor: { select: { status: true, companyName: true } } },
    });
    if (!quotation) throw new CustomerBookingConfirmationError("QUOTATION_NOT_FOUND", "The selected quotation is unavailable.", 404);
    const confirmableStatuses = new Set<QuotationStatus>([QuotationStatus.SUBMITTED, QuotationStatus.REVISED, QuotationStatus.SHORTLISTED, QuotationStatus.ACCEPTED]);
    if (!confirmableStatuses.has(quotation.status)) throw new CustomerBookingConfirmationError("QUOTATION_UNAVAILABLE", "The selected quotation is no longer available.", 409);
    if (quotation.validUntil && quotation.validUntil.getTime() < Date.now()) throw new CustomerBookingConfirmationError("QUOTATION_EXPIRED", "The selected quotation has expired.", 409);
    if (!quotation.pickupDate || !quotation.deliveryDate || Number(quotation.totalAmount) <= 0 || quotation.vendor.status !== "ACTIVE") throw new CustomerBookingConfirmationError("QUOTATION_INCOMPLETE", "EasyMovers must validate the price, schedule and partner before payment.", 409);

    // Never mutate a previously prepared financial snapshot, even after retries.
    const existing = await tx.payment.findUnique({
      where: { bookingId: booking.id },
      select: {
        id: true, paymentNumber: true, paymentStatus: true, quotationId: true,
        vendorId: true, totalAmount: true, advanceAmount: true, currency: true,
        paidAmount: true, commercialReference: true,
      },
    });
    if (existing) {
      if (existing.quotationId !== quotation.id || existing.vendorId !== quotation.vendorId ||
          Number(existing.totalAmount) !== money(Number(quotation.totalAmount)) ||
          existing.currency !== quotation.currency) {
        throw new CustomerBookingConfirmationError(
          "PAYMENT_SNAPSHOT_LOCKED",
          "Booking payment terms are already prepared. Contact EasyMovers for an amendment.",
          409
        );
      }
      if (!existing.commercialReference || existing.advanceAmount === null) {
        throw new CustomerBookingConfirmationError(
          "PAYMENT_SNAPSHOT_REVIEW_REQUIRED",
          "Existing payment record needs staff review before checkout.",
          409
        );
      }
      return {
        bookingNumber: booking.bookingNumber, quotationNumber: quotation.quotationNumber,
        currency: existing.currency, totalAmount: Number(existing.totalAmount),
        advanceAmount: Number(existing.advanceAmount),
        balanceAfterAdvance: money(Number(existing.totalAmount) - Number(existing.advanceAmount)),
        paymentId: existing.id, paymentNumber: existing.paymentNumber,
        paymentStatus: existing.paymentStatus,
      };
    }

    if (quotation.currency !== "INR") {
      throw new CustomerBookingConfirmationError("UNSUPPORTED_CURRENCY", "Booking deposit currently supports INR only.", 409);
    }
    const totalAmount = money(Number(quotation.totalAmount));
    const policy = bookingAdvancePolicy(totalAmount);
    const commercialReference = {
      version: "CUSTOMER_BOOKING_V2", quotationId: quotation.id, quotationNumber: quotation.quotationNumber,
      vendorQuotedAmount: totalAmount, customerPayableAmount: totalAmount, currency: quotation.currency,
      advancePolicy: {
        percentage: policy.percentage, minimum: policy.minimum,
        gstPercent: policy.gstPercent, minimumWithGst: policy.minimumWithGst,
        pickupCumulativePercent: 50, unpackingCumulativePercent: 100,
      },
      pickupDate: quotation.pickupDate.toISOString(), deliveryDate: quotation.deliveryDate.toISOString(),
      preparedAt: new Date().toISOString(),
    } satisfies Prisma.InputJsonObject;
    const payment = await tx.payment.create({
      data: {
        paymentNumber: `PAY-${booking.bookingNumber}`, referenceId: `booking:${booking.id}`, bookingId: booking.id,
        quotationId: quotation.id, vendorId: quotation.vendorId, amount: totalAmount, totalAmount,
        advanceAmount: policy.amount, paidAmount: 0, balanceAmount: totalAmount, paymentPending: totalAmount,
        currency: quotation.currency, paymentType: "ADVANCE", paymentStatus: "PENDING", source: "WEB",
        businessSegment: businessSegment(booking.moveType, booking.serviceType), commercialReference,
        payableJson: {
          totalAmount, advanceDue: policy.amount, pickupDue: policy.pickupDue,
          unpackingDue: policy.unpackingDue, balanceAfterAdvance: money(totalAmount - policy.amount),
        },
      },
      select: { id: true, paymentNumber: true, paymentStatus: true },
    });
    await tx.quotation.update({ where: { id: quotation.id }, data: { status: QuotationStatus.ACCEPTED } });
    await tx.booking.update({ where: { id: booking.id }, data: {
      bookingStatus: "VENDOR_SELECTED", totalAmount, currency: quotation.currency, vendorId: quotation.vendorId,
      vendorName: quotation.vendor.companyName,
      paymentJson: { paymentId: payment.id, paymentNumber: payment.paymentNumber, advanceDue: policy.amount, status: payment.paymentStatus },
    } });
    await tx.crmAuditLog.create({ data: {
      action: "CUSTOMER_BOOKING_CONFIRMATION_PREPARED", entityType: "Booking", entityId: booking.id,
      metadata: { leadId, reference, quotationId: quotation.id, paymentId: payment.id, advanceAmount: policy.amount, requestId },
    } });
    return {
      bookingNumber: booking.bookingNumber, quotationNumber: quotation.quotationNumber, currency: quotation.currency,
      totalAmount, advanceAmount: policy.amount, balanceAfterAdvance: money(totalAmount - policy.amount),
      paymentId: payment.id, paymentNumber: payment.paymentNumber, paymentStatus: payment.paymentStatus,
    };

  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export class CustomerBookingConfirmationError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) { super(message); this.name = "CustomerBookingConfirmationError"; }
}
