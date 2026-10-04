import { QuotationStatus, VendorEngagementMode, VendorServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateQuotationModule } from "@/domains/quotation/quotation.module";

export class VendorOpportunityError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorOpportunityError";
  }
}

const serviceAliases: Record<string, VendorServiceType> = {
  HOUSEHOLD: VendorServiceType.HOUSEHOLD_RELOCATION,
  HOUSEHOLD_SHIFTING: VendorServiceType.HOUSEHOLD_RELOCATION,
  HOUSEHOLD_RELOCATION: VendorServiceType.HOUSEHOLD_RELOCATION,
  OFFICE: VendorServiceType.OFFICE_RELOCATION,
  OFFICE_SHIFTING: VendorServiceType.OFFICE_RELOCATION,
  OFFICE_RELOCATION: VendorServiceType.OFFICE_RELOCATION,
  CORPORATE_RELOCATION: VendorServiceType.CORPORATE_RELOCATION,
  VEHICLE: VendorServiceType.VEHICLE_TRANSPORT,
  VEHICLE_TRANSPORT: VendorServiceType.VEHICLE_TRANSPORT,
  COMMERCIAL_GOODS: VendorServiceType.COMMERCIAL_GOODS,
  WAREHOUSING: VendorServiceType.WAREHOUSING,
  PACKING_ONLY: VendorServiceType.PACKING_ONLY,
  LOADING_UNLOADING: VendorServiceType.LOADING_UNLOADING,
  INSTALLATION_UNINSTALLATION: VendorServiceType.INSTALLATION_UNINSTALLATION,
};

async function vendorContext(vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
    select: {
      id: true, status: true, engagementMode: true,
      enquiryPreference: { select: { acceptingQuotationEnquiries: true, pausedUntil: true } },
      serviceOfferings: { where: { active: true }, select: { serviceType: true } },
      serviceAreas: { where: { active: true }, select: { scope: true, originCity: true, originState: true, destinationCity: true, destinationState: true } },
    },
  });
  if (!vendor) throw new VendorOpportunityError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);
  if (vendor.status !== "ACTIVE") throw new VendorOpportunityError("VENDOR_NOT_ACTIVE", "The vendor must be active before receiving enquiries.", 409);
  if (vendor.engagementMode === VendorEngagementMode.INSTANT_RATE)
    throw new VendorOpportunityError("QUOTATION_MODE_NOT_ENABLED", "This vendor is configured only for instant-rate work.", 409);
  return vendor;
}

const hiddenRequirementKey = /(customer|contact|mobile|phone|email|full.?name|user.?name|address|latitude|longitude|digipin|photo|image|url)/i;
function anonymousRequirement(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(anonymousRequirement);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !hiddenRequirementKey.test(key))
      .map(([key, item]) => [key, anonymousRequirement(item)]),
  );
}

function quotationView(quotation: {
  id: string; quotationNumber: string; status: QuotationStatus;
  transportationCost: unknown; packingCost: unknown; unpackingCost: unknown;
  labourCost: unknown; insuranceCost: unknown; otherCost: unknown;
  discountAmount: unknown; taxAmount: unknown; totalAmount: unknown;
  validUntil: Date | null; remarks: string | null; createdAt: Date; updatedAt: Date;
}) {
  const money = (value: unknown) => Number(value);
  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    status: quotation.status,
    transportationCost: money(quotation.transportationCost),
    packingCost: money(quotation.packingCost),
    unpackingCost: money(quotation.unpackingCost),
    labourCost: money(quotation.labourCost),
    insuranceCost: money(quotation.insuranceCost),
    otherCost: money(quotation.otherCost),
    discountAmount: money(quotation.discountAmount),
    taxAmount: money(quotation.taxAmount),
    totalAmount: money(quotation.totalAmount),
    validUntil: quotation.validUntil,
    remarks: quotation.remarks,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    editable:
      quotation.status === QuotationStatus.DRAFT ||
      quotation.status === QuotationStatus.SUBMITTED ||
      quotation.status === QuotationStatus.REVISED,
  };
}

function matchesService(serviceType: string, offerings: Array<{ serviceType: VendorServiceType }>) {
  const mapped = serviceAliases[serviceType.toUpperCase()];
  return mapped ? offerings.some(item => item.serviceType === mapped) : false;
}

function matchesArea(booking: { moveType: string; pickupCity: string; pickupState: string; dropCity: string; dropState: string }, areas: Array<{ scope: string; originCity: string | null; originState: string | null; destinationCity: string | null; destinationState: string | null }>) {
  const same = (left: string | null, right: string) => !left || left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
  return areas.some(area => {
    if (area.scope === "PAN_INDIA") return true;
    if (area.scope === "WITHIN_STATE") return same(area.originState, booking.pickupState) && booking.pickupState.toLowerCase() === booking.dropState.toLowerCase();
    if (area.scope === "WITHIN_CITY") return booking.moveType === "WITHIN_CITY" && same(area.originCity, booking.pickupCity) && same(area.originState, booking.pickupState) && booking.pickupCity.toLowerCase() === booking.dropCity.toLowerCase();
    return false;
  });
}

export async function listVendorOpportunities(vendorId: string) {
  const vendor = await vendorContext(vendorId);
  const bookings = await prisma.booking.findMany({
    where: {
      bookingStatus: { in: ["QUOTATION_PENDING", "QUOTATION_RECEIVED"] },
      selectedQuotationId: null,
      OR: [
        { quotationInvitations: { some: { vendorId, status: { in: ["INVITED", "VIEWED", "RESPONDED"] }, expiresAt: { gt: new Date() } } } },
        { quotations: { some: { vendorId } } },
      ],
    },
    orderBy: [{ moveDate: "asc" }, { createdAt: "asc" }],
    take: 100,
    select: {
      id: true, bookingNumber: true, leadId: true, serviceType: true, moveType: true, moveDate: true,
      pickupCity: true, pickupState: true, pickupPincode: true,
      dropCity: true, dropState: true, dropPincode: true,
      inventoryJson: true, inventorySummaryJson: true, servicesJson: true, requirementsJson: true,
      scheduleJson: true, pickupAddressJson: true, dropAddressJson: true, deliveryDate: true, createdAt: true,
      quotations: {
        where: { vendorId },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true, quotationNumber: true, status: true,
          transportationCost: true, packingCost: true, unpackingCost: true,
          labourCost: true, insuranceCost: true, otherCost: true,
          discountAmount: true, taxAmount: true, totalAmount: true,
          validUntil: true, remarks: true, createdAt: true, updatedAt: true,
        },
      },
      quotationInvitations: {
        where: { vendorId }, take: 1,
        select: { id: true, status: true, invitedAt: true, expiresAt: true, viewedAt: true },
      },
    },
  });
  const visible = bookings.filter(booking =>
    booking.quotations.length > 0 ||
    (booking.quotationInvitations.length > 0 && matchesService(booking.serviceType, vendor.serviceOfferings) && matchesArea(booking, vendor.serviceAreas)),
  );
  const newlyViewed = visible.flatMap(booking => booking.quotationInvitations.filter(invitation => invitation.status === "INVITED").map(invitation => invitation.id));
  if (newlyViewed.length) await prisma.vendorQuotationInvitation.updateMany({ where: { id: { in: newlyViewed }, vendorId, status: "INVITED" }, data: { status: "VIEWED", viewedAt: new Date() } });
  return visible
    .map(({ quotations, quotationInvitations, pickupAddressJson, dropAddressJson, inventoryJson, inventorySummaryJson, servicesJson, requirementsJson, scheduleJson, ...booking }) => ({
      ...booking,
      pickupDetails: anonymousRequirement(pickupAddressJson),
      dropDetails: anonymousRequirement(dropAddressJson),
      inventory: anonymousRequirement(inventoryJson),
      inventorySummary: anonymousRequirement(inventorySummaryJson),
      requestedServices: anonymousRequirement(servicesJson),
      requirements: anonymousRequirement(requirementsJson),
      schedule: anonymousRequirement(scheduleJson),
      invitation: quotationInvitations[0] ? { ...quotationInvitations[0], status: quotationInvitations[0].status === "INVITED" ? "VIEWED" : quotationInvitations[0].status, viewedAt: quotationInvitations[0].viewedAt || new Date() } : null,
      myQuotation: quotations[0] ? quotationView(quotations[0]) : null,
    }));
}

export async function submitVendorOpportunityQuotation(input: {
  vendorId: string; userId: string; bookingId: string; body: Record<string, unknown>; requestId: string; ipAddress?: string; userAgent?: string;
}) {
  const opportunities = await listVendorOpportunities(input.vendorId);
  const booking = opportunities.find(item => item.id === input.bookingId && !item.myQuotation);
  if (!booking) throw new VendorOpportunityError("OPPORTUNITY_NOT_AVAILABLE", "This enquiry is not available to the linked vendor.", 404);
  const quotationModule = getOrCreateQuotationModule({ prisma });
  const result = await quotationModule.controller.create({
    body: {
      leadId: booking.leadId,
      bookingId: booking.id,
      vendorId: input.vendorId,
      userId: input.userId,
      transportationCost: input.body.transportationCost,
      packingCost: input.body.packingCost,
      unpackingCost: input.body.unpackingCost,
      labourCost: input.body.labourCost,
      insuranceCost: input.body.insuranceCost,
      otherCost: input.body.otherCost,
      discountAmount: input.body.discountAmount,
      taxAmount: input.body.taxAmount,
      totalAmount: input.body.totalAmount,
      currency: "INR",
      pickupDate: input.body.pickupDate,
      deliveryDate: input.body.deliveryDate,
      transitDays: input.body.transitDays,
      validUntil: input.body.validUntil,
      remarks: input.body.remarks,
      status: QuotationStatus.SUBMITTED,
      createdBy: input.userId,
    } as never,
    method: "POST",
    path: `/api/vendor/opportunities/${booking.id}/quotation`,
    requestId: input.requestId,
    authenticatedUserId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
  if (result.status >= 200 && result.status < 300)
    await prisma.vendorQuotationInvitation.updateMany({ where: { bookingId: booking.id, vendorId: input.vendorId, status: { in: ["INVITED", "VIEWED"] } }, data: { status: "RESPONDED", respondedAt: new Date() } });
  return result;
}

export async function reviseVendorOpportunityQuotation(input: {
  vendorId: string; userId: string; bookingId: string; body: Record<string, unknown>;
  requestId: string; ipAddress?: string; userAgent?: string;
}) {
  await vendorContext(input.vendorId);
  const quotation = await prisma.quotation.findFirst({
    where: {
      bookingId: input.bookingId,
      vendorId: input.vendorId,
      status: { in: [QuotationStatus.DRAFT, QuotationStatus.SUBMITTED, QuotationStatus.REVISED] },
      booking: { selectedQuotationId: null, bookingStatus: { in: ["QUOTATION_PENDING", "QUOTATION_RECEIVED"] } },
    },
    select: { id: true, status: true },
  });
  if (!quotation) throw new VendorOpportunityError("QUOTATION_NOT_EDITABLE", "This quotation can no longer be modified.", 409);
  const quotationModule = getOrCreateQuotationModule({ prisma });
  const result = await quotationModule.service.update({
    quotationId: quotation.id as never,
    changes: {
      transportationCost: input.body.transportationCost,
      packingCost: input.body.packingCost,
      unpackingCost: input.body.unpackingCost,
      labourCost: input.body.labourCost,
      insuranceCost: input.body.insuranceCost,
      otherCost: input.body.otherCost,
      discountAmount: input.body.discountAmount,
      taxAmount: input.body.taxAmount,
      totalAmount: input.body.totalAmount,
      validUntil: input.body.validUntil,
      remarks: input.body.remarks,
      updatedBy: input.userId,
    } as never,
    context: { audit: { performedBy: input.userId, requestId: input.requestId, source: "API", ipAddress: input.ipAddress, userAgent: input.userAgent } },
  });
  if (!result.success) throw new VendorOpportunityError(result.error.code, result.error.message, 400);
  if (quotation.status === QuotationStatus.SUBMITTED) {
    const revised = await quotationModule.service.markRevised({ quotationId: quotation.id as never, revisedBy: input.userId, reason: "Vendor revised commercial quotation." });
    if (!revised.success) throw new VendorOpportunityError(revised.error.code, revised.error.message, 409);
    return quotationView(revised.data as never);
  }
  return quotationView(result.data as never);
}

export async function declineVendorOpportunity(input: { vendorId: string; bookingId: string; reason: string }) {
  await vendorContext(input.vendorId);
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500)
    throw new VendorOpportunityError("INVALID_DECLINE_REASON", "Provide a decline reason from 3 to 500 characters.", 400);
  const result = await prisma.vendorQuotationInvitation.updateMany({
    where: { bookingId: input.bookingId, vendorId: input.vendorId, status: { in: ["INVITED", "VIEWED"] }, expiresAt: { gt: new Date() } },
    data: { status: "DECLINED", declinedAt: new Date(), declineReason: reason },
  });
  if (result.count !== 1)
    throw new VendorOpportunityError("OPPORTUNITY_NOT_DECLINABLE", "This quotation invitation is no longer available to decline.", 409);
  return { bookingId: input.bookingId, status: "DECLINED" as const };
}
