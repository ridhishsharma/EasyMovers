import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authorizeCrmPermission, CRM_PERMISSIONS } from "@/lib/crm-authorization";
import { prisma } from "@/lib/prisma";

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
        quotations: { orderBy: { createdAt: "desc" }, select: { id: true, quotationNumber: true, status: true, totalAmount: true, currency: true, validUntil: true, createdAt: true, vendor: { select: { vendorCode: true, companyName: true } } } },
        bookings: { orderBy: { createdAt: "desc" }, select: { id: true, bookingNumber: true, bookingStatus: true, paymentStatus: true, totalAmount: true, currency: true, createdAt: true } },
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
