import { CommercialTermRequestStatus, Prisma, QuotationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CommercialTermError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "CommercialTermError";
  }
}

const asRecord = (value: Prisma.JsonValue | null) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {};
const amount = (value: unknown) => { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; };
const boundedNote = (value: unknown, required = false) => {
  const result = typeof value === "string" ? value.trim().slice(0, 1000) : "";
  if (required && !result) throw new CommercialTermError("REVIEW_NOTE_REQUIRED", "Enter a reason before rejecting the commission request.", 400);
  return result || null;
};
const commissionLocked = (value: Prisma.JsonValue | null) => amount(asRecord(value).platformCommissionAmount) !== null;

async function audit(transaction: Prisma.TransactionClient, actorUserId: string, action: string, entityId: string, metadata?: Prisma.InputJsonValue) {
  await transaction.crmAuditLog.create({ data: { actorUserId, action, entityType: "PaymentCommercialTermRequest", entityId, metadata } });
}

export async function getCommercialTermWorkspace(status: CommercialTermRequestStatus = CommercialTermRequestStatus.PENDING) {
  const [payments, requests] = await Promise.all([
    prisma.payment.findMany({
      where: { quotationId: { not: null } }, orderBy: { updatedAt: "desc" }, take: 200,
      select: {
        id: true, paymentNumber: true, totalAmount: true, currency: true, commercialReference: true,
        booking: { select: { bookingNumber: true, selectedQuotationId: true } },
        quotation: { select: { id: true, quotationNumber: true, status: true, vendorId: true, totalAmount: true, currency: true, vendor: { select: { vendorCode: true, companyName: true } } } },
        commercialTermRequests: { where: { status: CommercialTermRequestStatus.PENDING }, select: { id: true } },
      },
    }),
    prisma.paymentCommercialTermRequest.findMany({
      where: { status }, orderBy: { submittedAt: "asc" }, take: 200,
      select: {
        id: true, paymentId: true, vendorId: true, quotationId: true, customerPayableAmount: true,
        vendorQuotedAmount: true, platformCommissionAmount: true, currency: true, status: true,
        submissionNote: true, reviewNote: true, submittedBy: true, reviewedBy: true,
        submittedAt: true, reviewedAt: true, appliedAt: true,
        vendor: { select: { vendorCode: true, companyName: true } },
        payment: { select: { paymentNumber: true, booking: { select: { bookingNumber: true } } } },
        quotation: { select: { quotationNumber: true } },
      },
    }),
  ]);
  const candidates = payments.flatMap(payment => {
    const quotation = payment.quotation;
    if (!quotation || quotation.status !== QuotationStatus.ACCEPTED || payment.booking.selectedQuotationId !== quotation.id || commissionLocked(payment.commercialReference) || payment.commercialTermRequests.length) return [];
    return [{
      paymentId: payment.id, paymentNumber: payment.paymentNumber, bookingNumber: payment.booking.bookingNumber,
      customerPayableAmount: Number(payment.totalAmount), currency: payment.currency,
      quotationId: quotation.id, quotationNumber: quotation.quotationNumber, vendorId: quotation.vendorId,
      vendorQuotedAmount: Number(quotation.totalAmount), vendor: quotation.vendor,
    }];
  });
  return { candidates, requests };
}

export async function submitCommercialTermRequest(input: { paymentId: string; platformCommissionAmount: unknown; submissionNote?: unknown; actorUserId: string }) {
  const commission = Number(input.platformCommissionAmount);
  if (!Number.isFinite(commission) || commission < 0) throw new CommercialTermError("INVALID_COMMISSION", "Commission must be a valid non-negative amount.", 400);
  return prisma.$transaction(async transaction => {
    const payment = await transaction.payment.findUnique({
      where: { id: input.paymentId },
      select: { id: true, paymentNumber: true, totalAmount: true, currency: true, commercialReference: true, booking: { select: { selectedQuotationId: true } }, quotation: { select: { id: true, quotationNumber: true, status: true, vendorId: true, totalAmount: true, currency: true } } },
    });
    if (!payment || !payment.quotation) throw new CommercialTermError("PAYMENT_NOT_ELIGIBLE", "Select a payment linked to an accepted vendor quotation.", 404);
    if (payment.quotation.status !== QuotationStatus.ACCEPTED || payment.booking.selectedQuotationId !== payment.quotation.id)
      throw new CommercialTermError("QUOTATION_NOT_ACCEPTED", "Commission can be locked only for the booking's accepted quotation.", 409);
    if (commissionLocked(payment.commercialReference)) throw new CommercialTermError("COMMISSION_ALREADY_LOCKED", "Commission is already locked for this payment.", 409);
    if (commission > Number(payment.quotation.totalAmount)) throw new CommercialTermError("COMMISSION_EXCEEDS_QUOTE", "Commission cannot exceed the vendor quotation amount.", 400);
    const pending = await transaction.paymentCommercialTermRequest.findFirst({ where: { paymentId: payment.id, status: CommercialTermRequestStatus.PENDING }, select: { id: true } });
    if (pending) throw new CommercialTermError("COMMISSION_REQUEST_PENDING", "A commission request is already awaiting checker approval.", 409);
    const request = await transaction.paymentCommercialTermRequest.create({ data: {
      paymentId: payment.id, vendorId: payment.quotation.vendorId, quotationId: payment.quotation.id,
      customerPayableAmount: payment.totalAmount, vendorQuotedAmount: payment.quotation.totalAmount,
      platformCommissionAmount: new Prisma.Decimal(commission.toFixed(2)), currency: payment.currency,
      submissionNote: boundedNote(input.submissionNote), submittedBy: input.actorUserId,
    } });
    await audit(transaction, input.actorUserId, "COMMISSION_TERMS_SUBMITTED", request.id, { paymentId: payment.id, vendorId: payment.quotation.vendorId, commission });
    return request;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reviewCommercialTermRequest(input: { requestId: string; decision: "APPROVED" | "REJECTED"; reviewNote?: unknown; actorUserId: string }) {
  return prisma.$transaction(async transaction => {
    const request = await transaction.paymentCommercialTermRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new CommercialTermError("COMMISSION_REQUEST_NOT_FOUND", "Commission request was not found.", 404);
    if (request.status !== CommercialTermRequestStatus.PENDING) throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED", "This commission request has already been reviewed.", 409);
    if (request.submittedBy === input.actorUserId) throw new CommercialTermError("MAKER_CANNOT_APPROVE", "The maker cannot approve their own commission request.", 403);
    const reviewNote = boundedNote(input.reviewNote, input.decision === "REJECTED");
    const now = new Date();
    if (input.decision === "REJECTED") {
      const changed = await transaction.paymentCommercialTermRequest.updateMany({ where: { id: request.id, status: CommercialTermRequestStatus.PENDING }, data: { status: CommercialTermRequestStatus.REJECTED, reviewNote, reviewedBy: input.actorUserId, reviewedAt: now } });
      if (!changed.count) throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED", "Another checker already reviewed this request.", 409);
      await audit(transaction, input.actorUserId, "COMMISSION_TERMS_REJECTED", request.id);
      return transaction.paymentCommercialTermRequest.findUniqueOrThrow({ where: { id: request.id } });
    }
    const payment = await transaction.payment.findUnique({ where: { id: request.paymentId }, select: { id: true, quotationId: true, totalAmount: true, currency: true, commercialReference: true, quotation: { select: { id: true, quotationNumber: true, vendorId: true, totalAmount: true, status: true } } } });
    if (!payment || !payment.quotation || payment.quotationId !== request.quotationId || payment.quotation.vendorId !== request.vendorId)
      throw new CommercialTermError("COMMERCIAL_CONTEXT_CHANGED", "Payment or quotation context changed; reject and submit a fresh request.", 409);
    if (payment.quotation.status !== QuotationStatus.ACCEPTED || Number(payment.totalAmount) !== Number(request.customerPayableAmount) || Number(payment.quotation.totalAmount) !== Number(request.vendorQuotedAmount) || payment.currency !== request.currency)
      throw new CommercialTermError("COMMERCIAL_CONTEXT_CHANGED", "Commercial amounts changed; reject and submit a fresh request.", 409);
    if (commissionLocked(payment.commercialReference)) throw new CommercialTermError("COMMISSION_ALREADY_LOCKED", "Commission was already locked by another approved request.", 409);
    const existing = asRecord(payment.commercialReference);
    await transaction.payment.update({ where: { id: payment.id }, data: { commercialReference: {
      ...existing, quotationId: payment.quotation.id, quotationNumber: payment.quotation.quotationNumber,
      customerPayableAmount: Number(request.customerPayableAmount), vendorQuotedAmount: Number(request.vendorQuotedAmount),
      platformCommissionAmount: Number(request.platformCommissionAmount), currency: request.currency,
    } } });
    const changed = await transaction.paymentCommercialTermRequest.updateMany({ where: { id: request.id, status: CommercialTermRequestStatus.PENDING }, data: { status: CommercialTermRequestStatus.APPROVED, reviewNote, reviewedBy: input.actorUserId, reviewedAt: now, appliedAt: now } });
    if (!changed.count) throw new CommercialTermError("COMMISSION_REQUEST_REVIEWED", "Another checker already reviewed this request.", 409);
    await audit(transaction, input.actorUserId, "COMMISSION_TERMS_APPROVED", request.id, { paymentId: payment.id, commission: Number(request.platformCommissionAmount) });
    return transaction.paymentCommercialTermRequest.findUniqueOrThrow({ where: { id: request.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
