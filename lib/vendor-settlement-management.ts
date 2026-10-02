import { Prisma, VendorSettlementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VendorSettlementError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorSettlementError";
  }
}

type CommercialReference = {
  vendorQuotedAmount?: unknown;
  platformCommissionAmount?: unknown;
};

const money = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const note = (value: unknown, required = false) => {
  const result = typeof value === "string" ? value.trim().slice(0, 1000) : "";
  if (required && !result) throw new VendorSettlementError("NOTE_REQUIRED", "Enter a reason for this action.", 400);
  return result || null;
};

const paymentFinancials = (payment: {
  paidAmount: Prisma.Decimal;
  commercialReference: Prisma.JsonValue | null;
  quotation: { totalAmount: Prisma.Decimal; vendorId: string } | null;
}) => {
  const snapshot = payment.commercialReference && typeof payment.commercialReference === "object" && !Array.isArray(payment.commercialReference)
    ? payment.commercialReference as CommercialReference
    : {};
  const vendorQuoted = money(snapshot.vendorQuotedAmount) ?? (payment.quotation ? Number(payment.quotation.totalAmount) : null);
  const commission = money(snapshot.platformCommissionAmount);
  if (vendorQuoted === null || commission === null)
    throw new VendorSettlementError("COMMISSION_NOT_LOCKED", "Lock the vendor quotation and EasyMovers commission before creating a settlement.", 409);
  const vendorNet = Math.max(0, vendorQuoted - commission);
  const fundedPayable = Math.max(0, Math.min(vendorNet, Number(payment.paidAmount) - commission));
  return { vendorQuoted, commission, vendorNet, fundedPayable };
};

async function audit(transaction: Prisma.TransactionClient, actorUserId: string, action: string, entityId: string, metadata?: Prisma.InputJsonValue) {
  await transaction.crmAuditLog.create({ data: { actorUserId, action, entityType: "VendorSettlement", entityId, metadata } });
}

export async function listVendorSettlements(status?: VendorSettlementStatus) {
  return prisma.vendorSettlement.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, vendorId: true, paymentId: true, amount: true, currency: true, status: true,
      settlementReference: true, expectedAt: true, settledAt: true, failureReason: true,
      remarks: true, createdBy: true, reviewedBy: true, reviewedAt: true, reviewNote: true,
      statusUpdatedBy: true, createdAt: true, updatedAt: true,
      vendor: { select: { vendorCode: true, companyName: true } },
      payment: { select: { paymentNumber: true, paidAmount: true, booking: { select: { bookingNumber: true } } } },
    },
  });
}

export async function listSettlementCandidates() {
  const payments = await prisma.payment.findMany({
    where: { OR: [{ vendorId: { not: null } }, { quotationId: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true, paymentNumber: true, currency: true, paidAmount: true, commercialReference: true, vendorId: true,
      vendor: { select: { vendorCode: true, companyName: true } },
      quotation: { select: { vendorId: true, totalAmount: true, vendor: { select: { vendorCode: true, companyName: true } } } },
      booking: { select: { bookingNumber: true } },
      vendorSettlements: { where: { status: { in: [VendorSettlementStatus.PENDING, VendorSettlementStatus.PROCESSING, VendorSettlementStatus.SETTLED] } }, select: { vendorId: true, amount: true } },
    },
  });
  return payments.flatMap((payment) => {
    const vendorId = payment.quotation?.vendorId || payment.vendorId;
    const vendor = payment.quotation?.vendor || payment.vendor;
    if (!vendorId || !vendor || (payment.quotation && payment.vendorId && payment.vendorId !== payment.quotation.vendorId)) return [];
    try {
      const financials = paymentFinancials(payment);
      const committed = payment.vendorSettlements.filter(item => item.vendorId === vendorId).reduce((total, item) => total + Number(item.amount), 0);
      const available = Math.max(0, financials.fundedPayable - committed);
      if (available <= 0.005) return [];
      return [{ id: payment.id, paymentNumber: payment.paymentNumber, bookingNumber: payment.booking.bookingNumber, vendorId, vendor, currency: payment.currency, customerReceived: Number(payment.paidAmount), vendorNetPayable: financials.vendorNet, available }];
    } catch { return []; }
  });
}

export async function createVendorSettlement(input: {
  vendorId: string;
  paymentId: string;
  amount: unknown;
  expectedAt?: unknown;
  remarks?: unknown;
  actorUserId: string;
}) {
  const requestedAmount = Number(input.amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0)
    throw new VendorSettlementError("INVALID_AMOUNT", "Settlement amount must be greater than zero.", 400);
  const expectedAt = input.expectedAt ? new Date(String(input.expectedAt)) : null;
  if (expectedAt && !Number.isFinite(expectedAt.getTime()))
    throw new VendorSettlementError("INVALID_EXPECTED_DATE", "Expected settlement date is invalid.", 400);

  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findFirst({
      where: { id: input.paymentId, OR: [{ vendorId: input.vendorId }, { quotation: { vendorId: input.vendorId } }] },
      select: { id: true, currency: true, paidAmount: true, commercialReference: true, quotation: { select: { vendorId: true, totalAmount: true } } },
    });
    if (!payment || (payment.quotation && payment.quotation.vendorId !== input.vendorId))
      throw new VendorSettlementError("PAYMENT_NOT_FOUND", "The selected vendor payment was not found.", 404);
    const financials = paymentFinancials(payment);
    const committed = await transaction.vendorSettlement.aggregate({
      where: { paymentId: payment.id, vendorId: input.vendorId, status: { in: [VendorSettlementStatus.PENDING, VendorSettlementStatus.PROCESSING, VendorSettlementStatus.SETTLED] } },
      _sum: { amount: true },
    });
    const available = Math.max(0, financials.fundedPayable - Number(committed._sum.amount || 0));
    if (requestedAmount > available + 0.005)
      throw new VendorSettlementError("SETTLEMENT_EXCEEDS_AVAILABLE", `Only ${payment.currency} ${available.toFixed(2)} is currently available for settlement.`, 409);
    const settlement = await transaction.vendorSettlement.create({
      data: {
        vendorId: input.vendorId,
        paymentId: payment.id,
        amount: new Prisma.Decimal(requestedAmount.toFixed(2)),
        currency: payment.currency,
        status: VendorSettlementStatus.PENDING,
        expectedAt,
        remarks: note(input.remarks),
        createdBy: input.actorUserId,
      },
    });
    await audit(transaction, input.actorUserId, "VENDOR_SETTLEMENT_SUBMITTED", settlement.id, { vendorId: input.vendorId, paymentId: payment.id, amount: requestedAmount, currency: payment.currency });
    return settlement;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reviewVendorSettlement(input: { settlementId: string; decision: "APPROVED" | "REJECTED"; reviewNote?: unknown; actorUserId: string }) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.vendorSettlement.findUnique({ where: { id: input.settlementId } });
    if (!current) throw new VendorSettlementError("SETTLEMENT_NOT_FOUND", "Settlement request was not found.", 404);
    if (current.status !== VendorSettlementStatus.PENDING)
      throw new VendorSettlementError("SETTLEMENT_ALREADY_REVIEWED", "This settlement request has already been reviewed.", 409);
    if (current.createdBy === input.actorUserId)
      throw new VendorSettlementError("MAKER_CANNOT_APPROVE", "The maker cannot approve their own settlement request.", 403);
    const reviewNote = note(input.reviewNote, input.decision === "REJECTED");
    const nextStatus = input.decision === "APPROVED" ? VendorSettlementStatus.PROCESSING : VendorSettlementStatus.REJECTED;
    const result = await transaction.vendorSettlement.updateMany({
      where: { id: current.id, status: VendorSettlementStatus.PENDING },
      data: { status: nextStatus, reviewedBy: input.actorUserId, reviewedAt: new Date(), reviewNote, statusUpdatedBy: input.actorUserId },
    });
    if (!result.count) throw new VendorSettlementError("SETTLEMENT_ALREADY_REVIEWED", "This settlement request was reviewed by another checker.", 409);
    await audit(transaction, input.actorUserId, `VENDOR_SETTLEMENT_${input.decision}`, current.id, { fromStatus: "PENDING", toStatus: nextStatus });
    return transaction.vendorSettlement.findUniqueOrThrow({ where: { id: current.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function completeVendorSettlement(input: {
  settlementId: string;
  outcome: "SETTLED" | "FAILED";
  settlementReference?: unknown;
  failureReason?: unknown;
  remarks?: unknown;
  actorUserId: string;
}) {
  const reference = typeof input.settlementReference === "string" ? input.settlementReference.trim().slice(0, 120) : "";
  const failureReason = note(input.failureReason, input.outcome === "FAILED");
  if (input.outcome === "SETTLED" && !reference)
    throw new VendorSettlementError("REFERENCE_REQUIRED", "Enter the bank or gateway settlement reference.", 400);
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.vendorSettlement.findUnique({ where: { id: input.settlementId }, select: { remarks: true } });
    if (!current) throw new VendorSettlementError("SETTLEMENT_NOT_FOUND", "Settlement request was not found.", 404);
    const result = await transaction.vendorSettlement.updateMany({
      where: { id: input.settlementId, status: VendorSettlementStatus.PROCESSING },
      data: {
        status: input.outcome === "SETTLED" ? VendorSettlementStatus.SETTLED : VendorSettlementStatus.FAILED,
        settlementReference: input.outcome === "SETTLED" ? reference : null,
        settledAt: input.outcome === "SETTLED" ? new Date() : null,
        failureReason,
        remarks: note(input.remarks) ?? current.remarks,
        statusUpdatedBy: input.actorUserId,
      },
    });
    if (!result.count) throw new VendorSettlementError("SETTLEMENT_NOT_PROCESSING", "Only an approved processing settlement can be completed.", 409);
    await audit(transaction, input.actorUserId, `VENDOR_SETTLEMENT_${input.outcome}`, input.settlementId, { settlementReference: reference || null, failureReason });
    return transaction.vendorSettlement.findUniqueOrThrow({ where: { id: input.settlementId } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
