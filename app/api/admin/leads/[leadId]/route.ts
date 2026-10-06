import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";
import { canonicalState, postalLocationCandidates } from "@/lib/india-location-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function readNotes(value: string | null) {
  if (!value) return {} as Record<string, unknown>;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {} as Record<string, unknown>;
  }
}

async function signInventoryPhotos(photos: Array<{ id: string; imageUrl: string; roomType: string | null; createdAt: Date }>) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.INVENTORY_PHOTO_BUCKET;
  if (!url || !key || !bucket)
    return photos.map(photo => ({ id: photo.id, roomType: photo.roomType, createdAt: photo.createdAt, url: null }));
  const storage = createClient(url, key, { auth: { persistSession: false } }).storage.from(bucket);
  return Promise.all(photos.map(async ({ imageUrl, ...photo }) => {
    try {
      const { data, error } = await storage.createSignedUrl(imageUrl, 300);
      return { ...photo, url: error ? null : data?.signedUrl || null };
    } catch {
      return { ...photo, url: null };
    }
  }));
}

export async function GET(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.LEAD_READ);
  if (!access.authorized)
    return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  const { leadId } = await context.params;
  if (!leadId || leadId.length > 100)
    return reply({ success: false, error: { code: "INVALID_LEAD", message: "Choose a valid lead." } }, 400);
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true, referenceId: true, name: true, mobile: true, email: true,
        pickupCity: true, pickupState: true, pickupPincode: true, pickupDigipin: true,
        destinationCity: true, destinationState: true, destinationPincode: true, destinationDigipin: true,
        shiftingType: true, shiftingDate: true, houseType: true, officeSize: true,
        pickupFloor: true, liftAvailable: true, packingRequired: true,
        bikeCount: true, carCount: true, vehicleCount: true, vehicleType: true, plantsIncluded: true,
        source: true, status: true, createdAt: true, lastUpdatedAt: true, notes: true,
        inventory: { select: {
          id: true, status: true, completionPercentage: true, updatedAt: true,
          callbackRequested: true, callbackSlot: true, photoInventoryRequested: true,
          pickupFloor: true, pickupLiftAvailable: true, pickupParkingDistance: true, pickupPropertyType: true,
          destinationFloor: true, destinationLiftAvailable: true, destinationParkingDistance: true, destinationPropertyType: true,
          packingType: true, surveyType: true, remarks: true,
          items: { orderBy: [{ category: "asc" }, { itemName: "asc" }], select: { id: true, category: true, itemName: true, quantity: true, fragile: true, requiresPacking: true, remarks: true } },
          photos: { orderBy: { createdAt: "asc" }, select: { id: true, imageUrl: true, roomType: true, createdAt: true } },
        } },
        quotations: { orderBy: { createdAt: "desc" }, select: {
          id: true, quotationNumber: true, status: true, currency: true,
          transportationCost: true, packingCost: true, unpackingCost: true,
          labourCost: true, insuranceCost: true, otherCost: true,
          discountAmount: true, taxAmount: true, totalAmount: true,
          pickupDate: true, deliveryDate: true, transitDays: true,
          validUntil: true, inclusionsJson: true, exclusionsJson: true,
          remarks: true, createdAt: true, updatedAt: true,
          vendor: { select: {
            vendorCode: true, companyName: true,
            ratingSummary: { select: {
              averageRating: true, totalReviews: true, completedBookings: true,
              onTimeDeliveryScore: true, recommendationRate: true,
            } },
          } },
        } },
        bookings: { orderBy: { createdAt: "desc" }, select: { id: true, bookingNumber: true, bookingStatus: true, paymentStatus: true, totalAmount: true, currency: true, createdAt: true } },
        moveSurveys: { orderBy: { version: "desc" }, select: {
          id: true, surveyNumber: true, version: true, status: true, mode: true,
          assignedToUserId: true, assignedToVendorId: true, scheduledAt: true,
          customerConfirmedAt: true, submittedAt: true, reviewedAt: true,
          approvedAt: true, sharedAt: true, reviewRemarks: true,
          _count: { select: { rooms: true, media: true } },
        } },
      },
    });
    if (!lead)
      return reply({ success: false, error: { code: "LEAD_NOT_FOUND", message: "Lead not found." } }, 404);
    const notes = readNotes(lead.notes);
    const photos = await signInventoryPhotos(lead.inventory?.photos || []);
    const { notes: _notes, inventory, ...summary } = lead;
    void _notes;
    return reply({ success: true, data: {
      ...summary,
      request: {
        pickupAddress: typeof notes.pickupAddress === "string" ? notes.pickupAddress : null,
        destinationAddress: typeof notes.destinationAddress === "string" ? notes.destinationAddress : null,
        destinationFloor: typeof notes.destinationFloor === "string" ? notes.destinationFloor : null,
        destinationLift: typeof notes.destinationLift === "string" ? notes.destinationLift : null,
        parking: typeof notes.parking === "string" ? notes.parking : null,
        specialItems: typeof notes.specialItems === "string" ? notes.specialItems : null,
        additionalServices: typeof notes.additionalServices === "string" ? notes.additionalServices : null,
        submittedAt: typeof notes.submittedAt === "string" ? notes.submittedAt : null,
        pricingDecision: notes.pricingDecision && typeof notes.pricingDecision === "object" ? notes.pricingDecision : null,
      },
      assistance: {
        callbackRequested: inventory?.callbackRequested || false,
        callbackSlot: inventory?.callbackSlot || null,
        surveyPreference: notes.surveyPreference === "REQUESTED" ? "REQUESTED" : "VENDOR_DECIDES",
        surveyStatus: notes.surveyPreference === "REQUESTED" ? "PENDING" : "NOT_REQUESTED",
      },
      inventory: inventory ? { ...inventory, photos } : null,
    } });
  } catch (error) {
    const reference = crypto.randomUUID();
    console.error(`[CRM_LEAD_DETAIL_UNAVAILABLE:${reference}]`, error);
    return reply({ success: false, error: { code: "CRM_LEAD_DETAIL_UNAVAILABLE", message: `Lead details are temporarily unavailable. Reference: ${reference}` } }, 503);
  }
}

const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export async function PATCH(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const access = await authorizeCrmPermission(request, CRM_PERMISSIONS.LEAD_ASSIGN);
  if (!access.authorized) return reply({ success: false, error: { code: access.code, message: access.message } }, access.status);
  try {
    const { leadId } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const pickupPincode = typeof body.pickupPincode === "string" ? body.pickupPincode.trim() : "";
    const destinationPincode = typeof body.destinationPincode === "string" ? body.destinationPincode.trim() : "";
    if (!/^[1-9]\d{5}$/.test(pickupPincode) || !/^[1-9]\d{5}$/.test(destinationPincode)) return reply({ success: false, error: { code: "INVALID_RFQ_PIN_CODES", message: "Enter valid six-digit pickup and destination PIN codes." } }, 400);
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, pickupCity: true, pickupState: true, destinationCity: true, destinationState: true, notes: true, _count: { select: { bookings: true, quotations: true } } } });
    if (!lead) return reply({ success: false, error: { code: "LEAD_NOT_FOUND", message: "Lead not found." } }, 404);
    if (lead._count.bookings || lead._count.quotations) return reply({ success: false, error: { code: "RFQ_ADDRESS_LOCKED", message: "The RFQ address cannot be changed after a booking or quotation exists." } }, 409);
    const [pickupCandidates, destinationCandidates] = await Promise.all([postalLocationCandidates(pickupPincode), postalLocationCandidates(destinationPincode)]);
    const matches = (candidates: Awaited<ReturnType<typeof postalLocationCandidates>>, city: string | null, state: string | null) => {
      const canonical = canonicalState(state);
      return Boolean(city && canonical && candidates.some(candidate => candidate.stateCode === canonical.code && normalized(candidate.city) === normalized(city)));
    };
    if (!matches(pickupCandidates, lead.pickupCity, lead.pickupState)) return reply({ success: false, error: { code: "PICKUP_PIN_MISMATCH", message: `Pickup PIN does not match ${lead.pickupCity || "the pickup city"}, ${lead.pickupState || "the pickup state"}.` } }, 400);
    if (!matches(destinationCandidates, lead.destinationCity, lead.destinationState)) return reply({ success: false, error: { code: "DESTINATION_PIN_MISMATCH", message: `Destination PIN does not match ${lead.destinationCity || "the destination city"}, ${lead.destinationState || "the destination state"}.` } }, 400);
    const notes = readNotes(lead.notes);
    const pickupAddress = typeof body.pickupAddress === "string" ? body.pickupAddress.trim().slice(0, 300) : "";
    const destinationAddress = typeof body.destinationAddress === "string" ? body.destinationAddress.trim().slice(0, 300) : "";
    const updated = await prisma.$transaction(async tx => {
      const record = await tx.lead.update({ where: { id: lead.id }, data: { pickupPincode, destinationPincode, notes: JSON.stringify({ ...notes, ...(pickupAddress ? { pickupAddress } : {}), ...(destinationAddress ? { destinationAddress } : {}), rfqAddressCompletedAt: new Date().toISOString() }), lastUpdatedAt: new Date() }, select: { pickupPincode: true, destinationPincode: true } });
      await tx.crmAuditLog.create({ data: { actorUserId: access.userId, action: "LEAD_RFQ_ADDRESS_COMPLETED", entityType: "Lead", entityId: lead.id, metadata: { pickupPincode, destinationPincode } } });
      return record;
    });
    return reply({ success: true, data: updated, message: "RFQ address verified and saved." });
  } catch (error) {
    if (error instanceof SyntaxError) return reply({ success: false, error: { code: "INVALID_JSON", message: "Provide valid RFQ address details." } }, 400);
    if (error instanceof Error && ["INVALID_POSTAL_CODE", "POSTAL_CODE_NOT_FOUND"].includes(error.message)) return reply({ success: false, error: { code: error.message, message: "One or both PIN codes could not be verified." } }, 400);
    const reference = crypto.randomUUID(); console.error(`[CRM_LEAD_ADDRESS_UPDATE_FAILED:${reference}]`, error);
    return reply({ success: false, error: { code: "CRM_LEAD_ADDRESS_UPDATE_FAILED", message: `Unable to save RFQ address. Reference: ${reference}` } }, 503);
  }
}
