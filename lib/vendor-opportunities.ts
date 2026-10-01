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
  HOUSEHOLD_SHIFTING: VendorServiceType.HOUSEHOLD_RELOCATION,
  HOUSEHOLD_RELOCATION: VendorServiceType.HOUSEHOLD_RELOCATION,
  OFFICE_SHIFTING: VendorServiceType.OFFICE_RELOCATION,
  OFFICE_RELOCATION: VendorServiceType.OFFICE_RELOCATION,
  CORPORATE_RELOCATION: VendorServiceType.CORPORATE_RELOCATION,
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
  const accepting = vendor.enquiryPreference?.acceptingQuotationEnquiries ?? true;
  const pausedUntil = vendor.enquiryPreference?.pausedUntil;
  if (!accepting || (pausedUntil && pausedUntil > new Date()))
    throw new VendorOpportunityError("ENQUIRIES_PAUSED", "Quotation enquiries are currently paused.", 409);
  return vendor;
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
      quotations: { none: { vendorId, status: { in: [QuotationStatus.DRAFT, QuotationStatus.SUBMITTED, QuotationStatus.REVISED, QuotationStatus.SHORTLISTED, QuotationStatus.ACCEPTED] } } },
    },
    orderBy: [{ moveDate: "asc" }, { createdAt: "asc" }],
    take: 100,
    select: {
      id: true, bookingNumber: true, leadId: true, serviceType: true, moveType: true, moveDate: true,
      pickupCity: true, pickupState: true, pickupPincode: true,
      dropCity: true, dropState: true, dropPincode: true,
      inventorySummaryJson: true, servicesJson: true, requirementsJson: true, createdAt: true,
    },
  });
  return bookings.filter(booking => matchesService(booking.serviceType, vendor.serviceOfferings) && matchesArea(booking, vendor.serviceAreas));
}

export async function submitVendorOpportunityQuotation(input: {
  vendorId: string; userId: string; bookingId: string; body: Record<string, unknown>; requestId: string; ipAddress?: string; userAgent?: string;
}) {
  const opportunities = await listVendorOpportunities(input.vendorId);
  const booking = opportunities.find(item => item.id === input.bookingId);
  if (!booking) throw new VendorOpportunityError("OPPORTUNITY_NOT_AVAILABLE", "This enquiry is not available to the linked vendor.", 404);
  const quotationModule = getOrCreateQuotationModule({ prisma });
  return quotationModule.controller.create({
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
}
