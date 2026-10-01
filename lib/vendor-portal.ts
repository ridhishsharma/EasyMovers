import {
  VendorBusinessType,
  VendorEngagementMode,
  VendorOperatorPresenceState,
  VendorChangeStatus,
  VehicleStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VendorPortalError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorPortalError";
  }
}

const isInstantMode = (mode: VendorEngagementMode) =>
  mode === VendorEngagementMode.INSTANT_RATE || mode === VendorEngagementMode.HYBRID;

const isQuotationMode = (mode: VendorEngagementMode) =>
  mode === VendorEngagementMode.QUOTATION || mode === VendorEngagementMode.HYBRID;

async function linkedVendor(userId: string, vendorId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, vendorId, role: "VENDOR", isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      mobile: true,
      vendor: {
        select: {
          id: true,
          vendorCode: true,
          companyName: true,
          ownerName: true,
          businessType: true,
          engagementMode: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });
  if (!user?.vendor || user.vendor.deletedAt)
    throw new VendorPortalError("VENDOR_ACCESS_DENIED", "This account is not linked to an active vendor profile.", 403);
  return { user, vendor: user.vendor };
}

export async function getVendorPortalOverview(userId: string, vendorId: string) {
  const { user, vendor } = await linkedVendor(userId, vendorId);
  const [availability, enquiryPreference, pendingChanges, activeVehicles] = await Promise.all([
    prisma.vendorOperatorAvailability.findUnique({ where: { userId } }),
    prisma.vendorEnquiryPreference.findUnique({ where: { vendorId } }),
    prisma.vendorChangeRequest.count({ where: { vendorId, status: VendorChangeStatus.PENDING } }),
    prisma.vendorVehicle.count({ where: { vendorId, isActive: true } }),
  ]);
  return {
    user,
    vendor,
    capabilities: {
      instantAvailability: vendor.businessType === VendorBusinessType.INDIVIDUAL_OWNER_DRIVER && isInstantMode(vendor.engagementMode),
      quotationEnquiries: isQuotationMode(vendor.engagementMode),
    },
    availability: availability ?? {
      state: VendorOperatorPresenceState.OFFLINE,
      lastHeartbeatAt: null,
      stateChangedAt: null,
      currentLatitude: null,
      currentLongitude: null,
    },
    enquiryPreference: enquiryPreference ?? {
      acceptingQuotationEnquiries: vendor.status === "ACTIVE",
      pausedUntil: null,
    },
    summary: { pendingChanges, activeVehicles },
  };
}

export async function setOperatorAvailability(
  userId: string,
  vendorId: string,
  input: { state: VendorOperatorPresenceState; latitude?: number; longitude?: number },
) {
  const { vendor } = await linkedVendor(userId, vendorId);
  if (vendor.businessType !== VendorBusinessType.INDIVIDUAL_OWNER_DRIVER || !isInstantMode(vendor.engagementMode))
    throw new VendorPortalError("AVAILABILITY_NOT_APPLICABLE", "Online availability is available only to individual instant-rate operators.", 409);

  const now = new Date();
  if (input.state === VendorOperatorPresenceState.ONLINE) {
    if (vendor.status !== "ACTIVE")
      throw new VendorPortalError("VENDOR_NOT_ACTIVE", "Complete verification and activate the vendor before going online.", 409);
    const eligibleVehicle = await prisma.vendorVehicle.findFirst({
      where: {
        vendorId,
        isActive: true,
        status: VehicleStatus.AVAILABLE,
        insuranceNumber: { not: null },
        insuranceExpiry: { gt: now },
      },
      select: { id: true },
    });
    if (!eligibleVehicle)
      throw new VendorPortalError("ELIGIBLE_VEHICLE_REQUIRED", "A verified operational vehicle with current insurance is required before going online.", 409);
  }

  const latitude = Number.isFinite(input.latitude) && Math.abs(input.latitude!) <= 90 ? input.latitude : undefined;
  const longitude = Number.isFinite(input.longitude) && Math.abs(input.longitude!) <= 180 ? input.longitude : undefined;
  if ((latitude === undefined) !== (longitude === undefined))
    throw new VendorPortalError("LOCATION_PAIR_REQUIRED", "Provide both latitude and longitude together.", 400);

  return prisma.$transaction(async transaction => {
    const availability = await transaction.vendorOperatorAvailability.upsert({
      where: { userId },
      create: {
        userId,
        vendorId,
        state: input.state,
        stateChangedAt: now,
        lastHeartbeatAt: input.state === VendorOperatorPresenceState.ONLINE ? now : null,
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
      update: {
        vendorId,
        state: input.state,
        stateChangedAt: now,
        lastHeartbeatAt: input.state === VendorOperatorPresenceState.ONLINE ? now : null,
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
    });
    await transaction.vendorAvailabilityEvent.create({
      data: { vendorId, userId, state: input.state, latitude, longitude },
    });
    return availability;
  });
}

export async function heartbeatOperatorAvailability(
  userId: string,
  vendorId: string,
  latitude: number,
  longitude: number,
) {
  await linkedVendor(userId, vendorId);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180)
    throw new VendorPortalError("VALID_LOCATION_REQUIRED", "A valid current location is required.", 400);
  const result = await prisma.vendorOperatorAvailability.updateMany({
    where: { userId, vendorId, state: VendorOperatorPresenceState.ONLINE },
    data: { currentLatitude: latitude, currentLongitude: longitude, lastHeartbeatAt: new Date() },
  });
  if (!result.count)
    throw new VendorPortalError("OPERATOR_NOT_ONLINE", "Go online before sending availability updates.", 409);
  return { state: VendorOperatorPresenceState.ONLINE, lastHeartbeatAt: new Date() };
}

export async function setQuotationEnquiries(
  userId: string,
  vendorId: string,
  accepting: boolean,
  pausedUntil?: Date | null,
) {
  const { vendor } = await linkedVendor(userId, vendorId);
  if (!isQuotationMode(vendor.engagementMode))
    throw new VendorPortalError("QUOTATION_MODE_NOT_ENABLED", "Quotation enquiries are not enabled for this vendor.", 409);
  if (accepting && vendor.status !== "ACTIVE")
    throw new VendorPortalError("VENDOR_NOT_ACTIVE", "Activate the vendor before accepting quotation enquiries.", 409);
  return prisma.vendorEnquiryPreference.upsert({
    where: { vendorId },
    create: { vendorId, acceptingQuotationEnquiries: accepting, pausedUntil: accepting ? null : pausedUntil, updatedByUserId: userId },
    update: { acceptingQuotationEnquiries: accepting, pausedUntil: accepting ? null : pausedUntil, updatedByUserId: userId },
  });
}
