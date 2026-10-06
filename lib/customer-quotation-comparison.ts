import { QuotationStatus, VendorDocumentType, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const RECOMMENDATION_VERSION = "EM_SAFE_MOVE_V1";
const weights = { price: 30, quality: 25, reliability: 20, compliance: 15, completeness: 10 } as const;
const number = (value: unknown) => Number(value || 0);
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

export async function customerQuotationComparison(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      referenceId: true, pickupCity: true, destinationCity: true, shiftingDate: true,
      bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, bookingNumber: true, selectedQuotationId: true } },
      quotations: {
        where: { status: { in: [QuotationStatus.SUBMITTED, QuotationStatus.REVISED, QuotationStatus.SHORTLISTED] } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, quotationNumber: true, status: true, currency: true,
          transportationCost: true, packingCost: true, unpackingCost: true, labourCost: true,
          insuranceCost: true, otherCost: true, discountAmount: true, taxAmount: true, totalAmount: true,
          pickupDate: true, deliveryDate: true, transitDays: true, validUntil: true,
          inclusionsJson: true, exclusionsJson: true, termsJson: true, remarks: true, createdAt: true,
          vendor: { select: {
            id: true, status: true,
            ratingSummary: { select: { averageRating: true, totalReviews: true, completedBookings: true, onTimeDeliveryScore: true, recommendationRate: true } },
            documents: { where: { isActive: true, verificationStatus: VerificationStatus.VERIFIED, documentType: { in: [VendorDocumentType.PAN, VendorDocumentType.COMPANY_REGISTRATION, VendorDocumentType.VEHICLE_INSURANCE] } }, select: { documentType: true, expiryDate: true } },
          } },
        },
      },
    },
  });
  if (!lead) return null;
  const today = Date.now();
  const eligible = lead.quotations.filter(item => !item.validUntil || item.validUntil.getTime() >= today);
  const totals = eligible.map(item => number(item.totalAmount)).filter(value => value > 0).sort((a, b) => a - b);
  const median = totals.length ? (totals[Math.floor((totals.length - 1) / 2)] + totals[Math.ceil((totals.length - 1) / 2)]) / 2 : 0;
  const scored = eligible.map((quotation, index) => {
    const total = number(quotation.totalAmount);
    const history = quotation.vendor.ratingSummary;
    const reviewed = Boolean(history && history.totalReviews > 0);
    const verifiedTypes = new Set(quotation.vendor.documents.filter(document => !document.expiryDate || document.expiryDate.getTime() >= today).map(document => document.documentType));
    const breakdownFields = [quotation.transportationCost, quotation.packingCost, quotation.unpackingCost, quotation.labourCost, quotation.insuranceCost, quotation.otherCost, quotation.discountAmount, quotation.taxAmount];
    const score = {
      price: median && total ? clamp((median / total) * 85) : 0,
      quality: reviewed ? clamp(number(history!.averageRating) / 5 * 100) : 60,
      reliability: reviewed ? clamp(number(history!.onTimeDeliveryScore)) : 60,
      compliance: clamp((quotation.vendor.status === "ACTIVE" ? 55 : 0) + (verifiedTypes.has(VendorDocumentType.PAN) || verifiedTypes.has(VendorDocumentType.COMPANY_REGISTRATION) ? 25 : 0) + (verifiedTypes.has(VendorDocumentType.VEHICLE_INSURANCE) ? 20 : 0)),
      completeness: clamp((breakdownFields.every(value => Number.isFinite(number(value))) ? 35 : 0) + (quotation.validUntil ? 20 : 0) + (quotation.pickupDate ? 15 : 0) + (quotation.deliveryDate || quotation.transitDays ? 15 : 0) + (quotation.remarks || quotation.termsJson || quotation.inclusionsJson ? 15 : 0)),
    };
    const recommendationScore = round(Object.entries(weights).reduce((sum, [key, weight]) => sum + score[key as keyof typeof score] * weight / 100, 0));
    const suspiciouslyLow = Boolean(median && total < median * .6);
    return {
      id: quotation.id, label: `Vendor ${String.fromCharCode(65 + index)}`,
      quotationNumber: quotation.quotationNumber, status: quotation.status, currency: quotation.currency,
      costs: { transportation: number(quotation.transportationCost), packing: number(quotation.packingCost), unpacking: number(quotation.unpackingCost), labour: number(quotation.labourCost), insurance: number(quotation.insuranceCost), other: number(quotation.otherCost), discount: number(quotation.discountAmount), tax: number(quotation.taxAmount), total },
      schedule: { pickupDate: quotation.pickupDate, deliveryDate: quotation.deliveryDate, transitDays: quotation.transitDays, validUntil: quotation.validUntil },
      inclusions: quotation.inclusionsJson, exclusions: quotation.exclusionsJson, terms: quotation.termsJson, remarks: quotation.remarks,
      performance: reviewed ? { status: "VERIFIED_HISTORY", averageRating: number(history!.averageRating), totalReviews: history!.totalReviews, completedBookings: history!.completedBookings, onTimeDelivery: number(history!.onTimeDeliveryScore), recommendationRate: number(history!.recommendationRate) } : { status: "NEW_PARTNER", averageRating: null, totalReviews: 0, completedBookings: history?.completedBookings || 0, onTimeDelivery: null, recommendationRate: null },
      compliance: { activePartner: quotation.vendor.status === "ACTIVE", identityVerified: verifiedTypes.has(VendorDocumentType.PAN) || verifiedTypes.has(VendorDocumentType.COMPANY_REGISTRATION), insuranceVerified: verifiedTypes.has(VendorDocumentType.VEHICLE_INSURANCE) },
      scoring: { ...Object.fromEntries(Object.entries(score).map(([key, value]) => [key, round(value)])), total: suspiciouslyLow ? null : recommendationScore, excludedReason: suspiciouslyLow ? "Price requires staff review because it is materially below comparable quotations." : null },
      createdAt: quotation.createdAt,
    };
  });
  const ranked = [...scored].filter(item => item.scoring.total !== null && item.compliance.activePartner).sort((a, b) => (b.scoring.total || 0) - (a.scoring.total || 0) || a.costs.total - b.costs.total);
  const recommendedId = ranked[0]?.id || null;
  const recommended = ranked[0] || null;
  const explanation = !recommended
    ? null
    : recommended.performance.status === "NEW_PARTNER"
      ? "Recommended from the available offers for its balance of quoted price, verified credentials, included services, availability and quotation completeness. This partner is still building its EasyMovers performance history."
      : "Recommended for the strongest overall balance of quoted price, verified credentials, included services, customer rating, successful moves and on-time performance.";
  return { reference: lead.referenceId, route: `${lead.pickupCity || "Pickup"} → ${lead.destinationCity || "Destination"}`, shiftingDate: lead.shiftingDate, booking: lead.bookings[0] || null, recommendation: { version: RECOMMENDATION_VERSION, weights, quotationId: recommendedId, explanation }, quotations: scored.map(item => ({ ...item, recommended: item.id === recommendedId })) };
}
