import { Prisma, VendorServiceScope, VendorServiceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VendorOperationsError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorOperationsError";
  }
}

export async function getVendorOperationalReadiness(vendorId: string) {
  const [vendor, locationOptions] = await Promise.all([prisma.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
    select: {
      id: true, vendorCode: true, companyName: true, ownerName: true, ownerMobile: true,
      ownerEmail: true, businessType: true, city: true, state: true, pincode: true,
      status: true, createdAt: true, updatedAt: true,
      serviceAreas: { orderBy: [{ scope: "asc" }, { originState: "asc" }, { originCity: "asc" }] },
      serviceOfferings: { orderBy: { serviceType: "asc" } },
      vehicles: { orderBy: { createdAt: "desc" }, select: { id: true, registrationNumber: true, vehicleType: true, ownership: true, status: true, currentCity: true, isActive: true } },
      documents: { orderBy: [{ isMandatory: "desc" }, { documentType: "asc" }], select: { id: true, documentType: true, fileName: true, verificationStatus: true, isMandatory: true, isActive: true, expiryDate: true, rejectionReason: true } },
      bankAccounts: { where: { isActive: true }, select: { id: true, bankName: true, accountType: true, verified: true, isPrimary: true } },
      sourceApplication: { select: { id: true, referenceId: true } },
      _count: { select: { assignedBookings: true, quotations: true, payments: true } },
    },
  }), prisma.serviceLocation.findMany({
    where: { status: { not: "SUSPENDED" } },
    select: { id: true, code: true, city: true, state: true, status: true },
    orderBy: [{ state: "asc" }, { city: "asc" }],
  })]);
  if (!vendor) throw new VendorOperationsError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);

  const activeAreas = vendor.serviceAreas.filter(area => area.active);
  const activeOfferings = vendor.serviceOfferings.filter(offering => offering.active);
  const activeVehicles = vendor.vehicles.filter(vehicle => vehicle.isActive && vehicle.status !== "INACTIVE");
  const mandatoryDocuments = vendor.documents.filter(document => document.isActive && document.isMandatory);
  const verifiedMandatoryDocuments = mandatoryDocuments.filter(document => document.verificationStatus === "VERIFIED");
  const verifiedBankAccounts = vendor.bankAccounts.filter(account => account.verified);
  const blockers = [
    ...(!activeAreas.length ? [{ code: "SERVICE_AREA_REQUIRED", message: "Add at least one active service area." }] : []),
    ...(!activeOfferings.length ? [{ code: "SERVICE_OFFERING_REQUIRED", message: "Add at least one active service offering." }] : []),
    ...(!activeVehicles.length ? [{ code: "ACTIVE_VEHICLE_REQUIRED", message: "Add at least one operational vehicle." }] : []),
    ...(mandatoryDocuments.length !== verifiedMandatoryDocuments.length ? [{ code: "MANDATORY_DOCUMENTS_PENDING", message: `${mandatoryDocuments.length - verifiedMandatoryDocuments.length} mandatory document${mandatoryDocuments.length - verifiedMandatoryDocuments.length === 1 ? " is" : "s are"} not verified.` }] : []),
    ...(!verifiedBankAccounts.length ? [{ code: "BANK_VERIFICATION_REQUIRED", message: "Verify at least one active bank account." }] : []),
  ];

  return {
    vendor,
    locationOptions,
    readiness: {
      activeServiceAreas: activeAreas.length,
      activeServiceOfferings: activeOfferings.length,
      activeVehicles: activeVehicles.length,
      verifiedMandatoryDocuments: verifiedMandatoryDocuments.length,
      mandatoryDocuments: mandatoryDocuments.length,
      verifiedBankAccounts: verifiedBankAccounts.length,
      blockers,
      operationallyReady: blockers.length === 0,
    },
  };
}

function enumValue<T extends string>(value: unknown, values: readonly T[], name: string): T {
  if (typeof value !== "string" || !values.includes(value.toUpperCase() as T)) throw new VendorOperationsError("INVALID_VENDOR_CONFIGURATION", `${name} is invalid.`, 400);
  return value.toUpperCase() as T;
}

export async function replaceVendorServiceConfiguration(vendorId: string, body: Record<string, unknown>, actorUserId: string, ipAddress?: string | null) {
  if (!Array.isArray(body.areas) || body.areas.length > 50 || !Array.isArray(body.serviceTypes) || body.serviceTypes.length > Object.values(VendorServiceType).length) {
    throw new VendorOperationsError("INVALID_VENDOR_CONFIGURATION", "Provide up to 50 service areas and supported service offerings.", 400);
  }
  const locations = await prisma.serviceLocation.findMany({ where: { status: { not: "SUSPENDED" } }, select: { id: true, city: true, state: true } });
  const locationById = new Map(locations.map(location => [location.id, location]));
  const areas = body.areas.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new VendorOperationsError("INVALID_VENDOR_CONFIGURATION", `Service area ${index + 1} is invalid.`, 400);
    const input = item as Record<string, unknown>;
    const scope = enumValue(input.scope, Object.values(VendorServiceScope), "Service area scope");
    if (scope === VendorServiceScope.PAN_INDIA) return { scope, originCity: null, originState: null, serviceablePostalCodes: [] as string[], active: true };
    const location = typeof input.locationId === "string" ? locationById.get(input.locationId) : undefined;
    if (!location) throw new VendorOperationsError("INVALID_VENDOR_CONFIGURATION", `Choose a registered service location for area ${index + 1}.`, 400);
    const pins = Array.isArray(input.serviceablePostalCodes) ? [...new Set(input.serviceablePostalCodes.map(value => String(value).trim()).filter(Boolean))] : [];
    if (pins.some(pin => !/^[1-9][0-9]{5}$/.test(pin))) throw new VendorOperationsError("INVALID_VENDOR_CONFIGURATION", `Service area ${index + 1} contains an invalid PIN code.`, 400);
    return { scope, originCity: scope === VendorServiceScope.WITHIN_CITY ? location.city : null, originState: location.state, serviceablePostalCodes: pins, active: true };
  });
  const areaKeys = areas.map(area => `${area.scope}|${area.originState || ""}|${area.originCity || ""}`);
  if (new Set(areaKeys).size !== areaKeys.length) throw new VendorOperationsError("DUPLICATE_SERVICE_AREA", "Each service area must be unique.", 409);
  const serviceTypes = [...new Set(body.serviceTypes.map(value => enumValue(value, Object.values(VendorServiceType), "Service offering")))];
  return prisma.$transaction(async transaction => {
    const vendor = await transaction.vendor.findFirst({ where: { id: vendorId, deletedAt: null }, select: { id: true, status: true } });
    if (!vendor) throw new VendorOperationsError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);
    if (vendor.status === "ACTIVE") throw new VendorOperationsError("ACTIVE_VENDOR_CONFIGURATION_LOCKED", "Suspend the vendor before changing service areas or offerings.", 409);
    await transaction.vendorServiceArea.deleteMany({ where: { vendorId: vendor.id } });
    if (areas.length) await transaction.vendorServiceArea.createMany({ data: areas.map(area => ({ vendorId: vendor.id, ...area })) });
    await transaction.vendorServiceOffering.updateMany({ where: { vendorId: vendor.id }, data: { active: false } });
    for (const serviceType of serviceTypes) {
      await transaction.vendorServiceOffering.upsert({
        where: { vendorId_serviceType: { vendorId: vendor.id, serviceType } },
        create: { vendorId: vendor.id, serviceType, title: serviceType.replaceAll("_", " ").toLowerCase().replace(/^./, letter => letter.toUpperCase()), active: true },
        update: { active: true },
      });
    }
    await transaction.crmAuditLog.create({ data: { actorUserId, action: "VENDOR_SERVICE_CONFIGURATION_REPLACED", entityType: "Vendor", entityId: vendor.id, ipAddress: ipAddress ?? null, metadata: { areaCount: areas.length, serviceTypes } as Prisma.InputJsonValue } });
    return { vendorId: vendor.id, areaCount: areas.length, offeringCount: serviceTypes.length };
  });
}
