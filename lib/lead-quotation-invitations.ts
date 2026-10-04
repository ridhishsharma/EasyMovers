import { Prisma, VendorEngagementMode, VendorServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class LeadInvitationError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "LeadInvitationError";
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
};

function notes(value: string | null) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {} as Record<string, unknown>; }
}

const same = (left: string | null, right: string | null) =>
  !left || (!!right && left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0);

function matchesArea(lead: { pickupCity: string | null; pickupState: string | null; destinationCity: string | null; destinationState: string | null }, area: { scope: string; originCity: string | null; originState: string | null; destinationCity: string | null; destinationState: string | null }) {
  if (area.scope === "PAN_INDIA") return true;
  if (area.scope === "WITHIN_STATE")
    return same(area.originState, lead.pickupState) && !!lead.pickupState && !!lead.destinationState && lead.pickupState.toLowerCase() === lead.destinationState.toLowerCase();
  if (area.scope === "WITHIN_CITY")
    return same(area.originCity, lead.pickupCity) && same(area.originState, lead.pickupState) && !!lead.pickupCity && !!lead.destinationCity && lead.pickupCity.toLowerCase() === lead.destinationCity.toLowerCase();
  return false;
}

async function leadContext(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true, referenceId: true, name: true, mobile: true, email: true, userId: true,
      pickupCity: true, pickupState: true, pickupPincode: true, pickupDigipin: true,
      destinationCity: true, destinationState: true, destinationPincode: true, destinationDigipin: true,
      shiftingType: true, shiftingDate: true, status: true, notes: true,
      inventory: { select: { status: true, items: { select: { category: true, itemName: true, quantity: true, fragile: true, requiresPacking: true, remarks: true } } } },
      bookings: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, bookingNumber: true, bookingStatus: true } },
    },
  });
  if (!lead) throw new LeadInvitationError("LEAD_NOT_FOUND", "Lead not found.", 404);
  return lead;
}

async function eligibleVendors(lead: Awaited<ReturnType<typeof leadContext>>) {
  const serviceType = serviceAliases[(lead.shiftingType || "").toUpperCase()];
  if (!serviceType) return [];
  const now = new Date();
  const vendors = await prisma.vendor.findMany({
    where: {
      deletedAt: null, status: "ACTIVE",
      engagementMode: { in: [VendorEngagementMode.QUOTATION, VendorEngagementMode.HYBRID] },
      serviceOfferings: { some: { active: true, serviceType } },
      serviceAreas: { some: { active: true } },
      User: { some: { isActive: true, supabaseAuthId: { not: null } } },
    },
    orderBy: [{ rating: "desc" }, { completedMoves: "desc" }, { companyName: "asc" }],
    take: 100,
    select: {
      id: true, vendorCode: true, companyName: true, city: true, state: true, rating: true, completedMoves: true,
      engagementMode: true,
      enquiryPreference: { select: { acceptingQuotationEnquiries: true, pausedUntil: true } },
      serviceAreas: { where: { active: true }, select: { scope: true, originCity: true, originState: true, destinationCity: true, destinationState: true } },
      _count: { select: { quotations: true } },
    },
  });
  return vendors.filter(vendor => {
    const preference = vendor.enquiryPreference;
    const accepting = preference?.acceptingQuotationEnquiries ?? true;
    const available = accepting && (!preference?.pausedUntil || preference.pausedUntil <= now);
    return available && vendor.serviceAreas.some(area => matchesArea(lead, area));
  }).map((vendor, index) => ({
    id: vendor.id, vendorCode: vendor.vendorCode, companyName: vendor.companyName,
    city: vendor.city, state: vendor.state, rating: vendor.rating, completedMoves: vendor.completedMoves,
    quotationCount: vendor._count.quotations, engagementMode: vendor.engagementMode,
    recommended: index < 5,
    reasons: ["Active verified vendor", `${serviceType.replaceAll("_", " ").toLowerCase()} enabled`, "Service area matches this route", "Accepting quotation enquiries", "Portal access active"],
  }));
}

export async function getLeadQuotationInvitationWorkspace(leadId: string) {
  const lead = await leadContext(leadId);
  const candidates = await eligibleVendors(lead);
  const bookingId = lead.bookings[0]?.id;
  const invitations = bookingId ? await prisma.vendorQuotationInvitation.findMany({
    where: { bookingId }, orderBy: { invitedAt: "asc" },
    select: { id: true, status: true, invitedAt: true, expiresAt: true, viewedAt: true, respondedAt: true, declinedAt: true, declineReason: true, vendor: { select: { id: true, vendorCode: true, companyName: true } } },
  }) : [];
  return {
    lead: { id: lead.id, referenceId: lead.referenceId, status: lead.status, serviceType: lead.shiftingType, route: `${lead.pickupCity || "?"} → ${lead.destinationCity || "?"}` },
    booking: lead.bookings[0] || null,
    candidates,
    invitations,
    capabilities: { canInvite: lead.status === "QUOTATION_REQUESTED" && lead.inventory?.status === "COMPLETED" && candidates.length > 0 },
  };
}

function requiredLeadField(value: string | null, field: string) {
  if (!value) throw new LeadInvitationError("LEAD_REQUIREMENT_INCOMPLETE", `${field} is required before inviting vendors.`, 409);
  return value;
}

export async function inviteVendorsToLead(input: { leadId: string; vendorIds: string[]; expiresAt: Date; invitedByUserId: string }) {
  const uniqueVendorIds = [...new Set(input.vendorIds)];
  if (!uniqueVendorIds.length || uniqueVendorIds.length > 5)
    throw new LeadInvitationError("INVALID_VENDOR_SELECTION", "Select between one and five eligible vendors.", 400);
  if (!Number.isFinite(input.expiresAt.getTime()) || input.expiresAt <= new Date() || input.expiresAt > new Date(Date.now() + 14 * 86400000))
    throw new LeadInvitationError("INVALID_RFQ_DEADLINE", "Choose a quotation deadline within the next 14 days.", 400);
  const lead = await leadContext(input.leadId);
  if (lead.status !== "QUOTATION_REQUESTED" || lead.inventory?.status !== "COMPLETED")
    throw new LeadInvitationError("LEAD_NOT_READY_FOR_RFQ", "Complete and submit the customer requirement before inviting vendors.", 409);
  const candidates = await eligibleVendors(lead);
  const candidateIds = new Set(candidates.map(vendor => vendor.id));
  if (uniqueVendorIds.some(vendorId => !candidateIds.has(vendorId)))
    throw new LeadInvitationError("VENDOR_NOT_ELIGIBLE", "One or more selected vendors are no longer eligible for this enquiry.", 409);
  const metadata = notes(lead.notes);
  const pickupCity = requiredLeadField(lead.pickupCity, "Pickup city");
  const pickupState = requiredLeadField(lead.pickupState, "Pickup state");
  const pickupPincode = requiredLeadField(lead.pickupPincode, "Pickup PIN code");
  const dropCity = requiredLeadField(lead.destinationCity, "Destination city");
  const dropState = requiredLeadField(lead.destinationState, "Destination state");
  const dropPincode = requiredLeadField(lead.destinationPincode, "Destination PIN code");
  const moveDate = new Date(`${requiredLeadField(lead.shiftingDate, "Moving date")}T00:00:00.000Z`);
  if (!Number.isFinite(moveDate.getTime())) throw new LeadInvitationError("LEAD_REQUIREMENT_INCOMPLETE", "A valid moving date is required.", 409);
  const pickupAddress = String(metadata.pickupAddress || pickupCity);
  const dropAddress = String(metadata.destinationAddress || dropCity);
  const moveType = pickupCity.toLowerCase() === dropCity.toLowerCase() ? "WITHIN_CITY" : "INTERCITY";
  const serviceType = lead.shiftingType || "HOUSEHOLD_SHIFTING";
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT 1 FROM "public"."Lead" WHERE "id" = ${lead.id} FOR UPDATE`;
    let booking = await tx.booking.findFirst({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" }, select: { id: true, bookingNumber: true, bookingStatus: true } });
    if (!booking) {
      const dateCode = new Date().toISOString().slice(0, 10).replaceAll("-", "");
      booking = await tx.booking.create({
        data: {
          bookingNumber: `EM${dateCode}${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`,
          leadId: lead.id, leadReferenceId: lead.referenceId, userId: lead.userId,
          customerName: lead.name, customerMobile: lead.mobile, customerEmail: lead.email,
          serviceType, moveType, moveDate,
          pickupCity, pickupState, pickupPincode, pickupDigipin: lead.pickupDigipin,
          dropCity, dropState, dropPincode, dropDigipin: lead.destinationDigipin,
          pickupAddress, dropAddress,
          contactJson: { fullName: lead.name, mobileNumber: lead.mobile, email: lead.email },
          pickupAddressJson: { addressLine: pickupAddress, city: pickupCity, state: pickupState, postalCode: pickupPincode },
          dropAddressJson: { addressLine: dropAddress, city: dropCity, state: dropState, postalCode: dropPincode },
          scheduleJson: { preferredMoveDate: lead.shiftingDate },
          inventoryJson: lead.inventory?.items || [],
          inventorySummaryJson: { totalLineItems: lead.inventory?.items.length || 0 },
          servicesJson: { serviceType, additionalServices: metadata.additionalServices || null },
          requirementsJson: { specialItems: metadata.specialItems || null, surveyPreference: metadata.surveyPreference || "VENDOR_DECIDES" },
          timelineJson: [{ event: "RFQ_CREATED", occurredAt: new Date().toISOString(), performedBy: input.invitedByUserId }],
          auditJson: { createdBy: input.invitedByUserId, source: "CRM_LEAD_RFQ", createdAt: new Date().toISOString() },
          bookingStatus: "QUOTATION_PENDING",
        },
        select: { id: true, bookingNumber: true, bookingStatus: true },
      });
    } else if (!new Set(["QUOTATION_PENDING", "QUOTATION_RECEIVED"]).has(booking.bookingStatus)) {
      throw new LeadInvitationError("BOOKING_NOT_OPEN_FOR_RFQ", "The booking is no longer open for vendor quotations.", 409);
    }
    const [existingInvitationCount, existingSelectedCount] = await Promise.all([
      tx.vendorQuotationInvitation.count({ where: { bookingId: booking.id } }),
      tx.vendorQuotationInvitation.count({ where: { bookingId: booking.id, vendorId: { in: uniqueVendorIds } } }),
    ]);
    if (existingInvitationCount + uniqueVendorIds.length - existingSelectedCount > 5)
      throw new LeadInvitationError("RFQ_VENDOR_LIMIT_REACHED", "A lead may have at most five vendor quotation invitations.", 409);
    await tx.vendorQuotationInvitation.createMany({
      data: uniqueVendorIds.map(vendorId => ({ bookingId: booking!.id, vendorId, invitedByUserId: input.invitedByUserId, expiresAt: input.expiresAt })),
      skipDuplicates: true,
    });
    await tx.crmAuditLog.create({ data: { actorUserId: input.invitedByUserId, action: "LEAD_VENDOR_RFQ_SENT", entityType: "Booking", entityId: booking.id, metadata: { leadId: lead.id, vendorIds: uniqueVendorIds, expiresAt: input.expiresAt.toISOString() } } });
    return { booking, invited: await tx.vendorQuotationInvitation.findMany({ where: { bookingId: booking.id, vendorId: { in: uniqueVendorIds } }, select: { id: true, status: true, expiresAt: true, vendor: { select: { id: true, vendorCode: true, companyName: true } } } }) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
