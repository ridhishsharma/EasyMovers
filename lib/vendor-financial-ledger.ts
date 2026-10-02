import { VendorSettlementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CommercialReference = {
  customerPayableAmount?: unknown;
  vendorQuotedAmount?: unknown;
  platformCommissionAmount?: unknown;
  currency?: unknown;
};

const amount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const commercialSnapshot = (value: unknown): CommercialReference =>
  value && typeof value === "object" && !Array.isArray(value) ? value as CommercialReference : {};

export async function getVendorFinancialLedger(vendorId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { vendorId },
        { quotation: { vendorId } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      paymentNumber: true,
      paymentStatus: true,
      currency: true,
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true,
      commercialReference: true,
      createdAt: true,
      updatedAt: true,
      booking: {
        select: {
          bookingNumber: true,
          bookingStatus: true,
          serviceType: true,
          moveType: true,
          moveDate: true,
          pickupCity: true,
          pickupState: true,
          dropCity: true,
          dropState: true,
        },
      },
      quotation: {
        select: { quotationNumber: true, vendorId: true, totalAmount: true },
      },
      vendorSettlements: {
        where: { vendorId, status: { in: [VendorSettlementStatus.PENDING, VendorSettlementStatus.PROCESSING, VendorSettlementStatus.SETTLED, VendorSettlementStatus.FAILED] } },
        orderBy: { createdAt: "asc" },
        select: { id: true, amount: true, currency: true, status: true, settlementReference: true, expectedAt: true, settledAt: true, createdAt: true },
      },
    },
  });

  const rows = payments
    .filter((payment) => !payment.quotation || payment.quotation.vendorId === vendorId)
    .map((payment) => {
      const snapshot = commercialSnapshot(payment.commercialReference);
      const customerTotal = amount(snapshot.customerPayableAmount) ?? Number(payment.totalAmount);
      const customerReceived = Math.min(customerTotal, Number(payment.paidAmount));
      const customerOutstanding = Math.max(0, Number(payment.balanceAmount));
      const vendorQuotedAmount = amount(snapshot.vendorQuotedAmount) ?? (payment.quotation ? Number(payment.quotation.totalAmount) : null);
      const commissionAmount = amount(snapshot.platformCommissionAmount);
      const commissionConfigured = vendorQuotedAmount !== null && commissionAmount !== null;
      const vendorNetPayable = commissionConfigured ? Math.max(0, vendorQuotedAmount - commissionAmount) : null;
      const settledAmount = payment.vendorSettlements
        .filter((entry) => entry.status === VendorSettlementStatus.SETTLED)
        .reduce((total, entry) => total + Number(entry.amount), 0);
      const processingAmount = payment.vendorSettlements
        .filter((entry) => entry.status === VendorSettlementStatus.PENDING || entry.status === VendorSettlementStatus.PROCESSING)
        .reduce((total, entry) => total + Number(entry.amount), 0);
      const failedAmount = payment.vendorSettlements
        .filter((entry) => entry.status === VendorSettlementStatus.FAILED)
        .reduce((total, entry) => total + Number(entry.amount), 0);
      const vendorOutstanding = vendorNetPayable === null ? null : Math.max(0, vendorNetPayable - settledAmount);
      return {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        paymentStatus: payment.paymentStatus,
        currency: typeof snapshot.currency === "string" ? snapshot.currency : payment.currency,
        booking: payment.booking,
        quotationNumber: payment.quotation?.quotationNumber || null,
        customerTotal,
        customerReceived,
        customerOutstanding,
        vendorQuotedAmount,
        commissionAmount,
        commissionStatus: commissionConfigured ? "LOCKED" as const : "PENDING_CONFIGURATION" as const,
        vendorNetPayable,
        settledAmount,
        processingAmount,
        failedAmount,
        vendorOutstanding,
        settlements: payment.vendorSettlements.map((entry) => ({ ...entry, amount: Number(entry.amount) })),
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };
    });

  const sum = (selector: (row: typeof rows[number]) => number | null) =>
    rows.reduce((total, row) => total + (selector(row) ?? 0), 0);
  return {
    summary: {
      bookings: rows.length,
      customerTotal: sum((row) => row.customerTotal),
      customerReceived: sum((row) => row.customerReceived),
      customerOutstanding: sum((row) => row.customerOutstanding),
      commissionAmount: sum((row) => row.commissionAmount),
      vendorNetPayable: sum((row) => row.vendorNetPayable),
      settledAmount: sum((row) => row.settledAmount),
      failedAmount: sum((row) => row.failedAmount),
      vendorOutstanding: sum((row) => row.vendorOutstanding),
      commissionPendingBookings: rows.filter((row) => row.commissionStatus === "PENDING_CONFIGURATION").length,
    },
    rows,
  };
}
