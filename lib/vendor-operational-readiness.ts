import { prisma } from "@/lib/prisma";

export class VendorOperationsError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "VendorOperationsError";
  }
}

export async function getVendorOperationalReadiness(vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
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
  });
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
