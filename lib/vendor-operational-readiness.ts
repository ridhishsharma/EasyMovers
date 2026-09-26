import {
  BankAccountType,
  Prisma,
  VehicleOwnership,
  VehicleStatus,
  VehicleType,
  VendorDocumentType,
  VendorServiceScope,
  VendorServiceType,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VendorOperationsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "VendorOperationsError";
  }
}

export async function getVendorOperationalReadiness(vendorId: string) {
  const [vendor, locationOptions] = await Promise.all([
    prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: {
        id: true,
        vendorCode: true,
        companyName: true,
        ownerName: true,
        ownerMobile: true,
        ownerEmail: true,
        businessType: true,
        engagementMode: true,
        city: true,
        state: true,
        pincode: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        serviceAreas: {
          orderBy: [
            { scope: "asc" },
            { originState: "asc" },
            { originCity: "asc" },
          ],
        },
        serviceOfferings: { orderBy: { serviceType: "asc" } },
        vehicles: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            registrationNumber: true,
            vehicleType: true,
            ownership: true,
            status: true,
            currentCity: true,
            insuranceNumber: true,
            insuranceExpiry: true,
            isActive: true,
          },
        },
        documents: {
          orderBy: [{ isMandatory: "desc" }, { documentType: "asc" }],
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            fileName: true,
            fileUrl: true,
            verificationStatus: true,
            isMandatory: true,
            isActive: true,
            expiryDate: true,
            rejectionReason: true,
          },
        },
        bankAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            bankName: true,
            accountHolderName: true,
            accountType: true,
            ifscCode: true,
            verified: true,
            isPrimary: true,
          },
        },
        sourceApplication: { select: { id: true, referenceId: true } },
        _count: {
          select: { assignedBookings: true, quotations: true, payments: true },
        },
      },
    }),
    prisma.serviceLocation.findMany({
      where: { status: { not: "SUSPENDED" } },
      select: { id: true, code: true, city: true, state: true, status: true },
      orderBy: [{ state: "asc" }, { city: "asc" }],
    }),
  ]);
  if (!vendor)
    throw new VendorOperationsError(
      "VENDOR_NOT_FOUND",
      "Vendor was not found.",
      404,
    );

  const activeAreas = vendor.serviceAreas.filter((area) => area.active);
  const activeOfferings = vendor.serviceOfferings.filter(
    (offering) => offering.active,
  );
  const activeVehicles = vendor.vehicles.filter(
    (vehicle) => vehicle.isActive && vehicle.status === VehicleStatus.AVAILABLE,
  );
  const mandatoryDocuments = vendor.documents.filter(
    (document) => document.isActive && document.isMandatory,
  );
  const verifiedMandatoryDocuments = mandatoryDocuments.filter(
    (document) => document.verificationStatus === "VERIFIED",
  );
  const verifiedPan = vendor.documents.some(
    (document) =>
      document.isActive &&
      document.documentType === "PAN" &&
      document.verificationStatus === "VERIFIED",
  );
  const verifiedBankAccounts = vendor.bankAccounts.filter(
    (account) => account.verified,
  );
  const transportRequired = activeOfferings.some((offering) =>
    [
      "HOUSEHOLD_RELOCATION",
      "OFFICE_RELOCATION",
      "CORPORATE_RELOCATION",
      "VEHICLE_TRANSPORT",
      "COMMERCIAL_GOODS",
    ].includes(offering.serviceType),
  );
  const registeredFleetRequired =
    vendor.businessType === "INDIVIDUAL_OWNER_DRIVER" ||
    vendor.engagementMode !== "QUOTATION";
  const normalizeEvidence = (value: string | null | undefined) =>
    value?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
  const eligibleTransportVehicle = activeVehicles.some((vehicle) => {
    const registration = normalizeEvidence(vehicle.registrationNumber);
    const insurance = normalizeEvidence(vehicle.insuranceNumber);
    return (
      vendor.documents.some(
        (document) =>
          document.isActive &&
          document.documentType === "VEHICLE_RC" &&
          document.verificationStatus === "VERIFIED" &&
          normalizeEvidence(document.documentNumber) === registration,
      ) &&
      Boolean(
        insurance &&
        vehicle.insuranceExpiry &&
        vehicle.insuranceExpiry.getTime() > Date.now(),
      ) &&
      vendor.documents.some(
        (document) =>
          document.isActive &&
          document.documentType === "VEHICLE_INSURANCE" &&
          document.verificationStatus === "VERIFIED" &&
          normalizeEvidence(document.documentNumber) === insurance &&
          document.expiryDate instanceof Date &&
          document.expiryDate.getTime() > Date.now(),
      )
    );
  });
  const blockers = [
    ...(!activeAreas.length
      ? [
          {
            code: "SERVICE_AREA_REQUIRED",
            message: "Add at least one active service area.",
          },
        ]
      : []),
    ...(!activeOfferings.length
      ? [
          {
            code: "SERVICE_OFFERING_REQUIRED",
            message: "Add at least one active service offering.",
          },
        ]
      : []),
    ...(registeredFleetRequired && !activeVehicles.length
      ? [
          {
            code: "ACTIVE_VEHICLE_REQUIRED",
            message: "Add at least one operational vehicle.",
          },
        ]
      : []),
    ...(registeredFleetRequired && transportRequired && !eligibleTransportVehicle
      ? [
          {
            code: "TRANSPORT_EVIDENCE_REQUIRED",
            message:
              "Verify matching vehicle RC and unexpired insurance evidence.",
          },
        ]
      : []),
    ...(!verifiedPan
      ? [
          {
            code: "PAN_VERIFICATION_REQUIRED",
            message: "Verify the vendor PAN document.",
          },
        ]
      : []),
    ...(mandatoryDocuments.length !== verifiedMandatoryDocuments.length
      ? [
          {
            code: "MANDATORY_DOCUMENTS_PENDING",
            message: `${mandatoryDocuments.length - verifiedMandatoryDocuments.length} mandatory document${mandatoryDocuments.length - verifiedMandatoryDocuments.length === 1 ? " is" : "s are"} not verified.`,
          },
        ]
      : []),
    ...(!verifiedBankAccounts.length
      ? [
          {
            code: "BANK_VERIFICATION_REQUIRED",
            message: "Verify at least one active bank account.",
          },
        ]
      : []),
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
      quotationEligible: blockers.every((blocker) => !["SERVICE_AREA_REQUIRED", "SERVICE_OFFERING_REQUIRED", "PAN_VERIFICATION_REQUIRED", "MANDATORY_DOCUMENTS_PENDING", "BANK_VERIFICATION_REQUIRED"].includes(blocker.code)),
      instantRateEligible: registeredFleetRequired && blockers.length === 0,
      blockers,
      operationallyReady: blockers.length === 0,
    },
  };
}

function textValue(value: unknown, name: string, maximum = 120) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maximum
  )
    throw new VendorOperationsError(
      "INVALID_VENDOR_OPERATION",
      `${name} is required and cannot exceed ${maximum} characters.`,
      400,
    );
  return value.trim();
}

async function requireEditableVendor(
  transaction: Prisma.TransactionClient,
  vendorId: string,
) {
  const vendor = await transaction.vendor.findFirst({
    where: { id: vendorId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!vendor)
    throw new VendorOperationsError(
      "VENDOR_NOT_FOUND",
      "Vendor was not found.",
      404,
    );
  return vendor;
}

async function audit(
  transaction: Prisma.TransactionClient,
  actorUserId: string,
  action: string,
  vendorId: string,
  metadata: Prisma.InputJsonValue,
  ipAddress?: string | null,
) {
  await transaction.crmAuditLog.create({
    data: {
      actorUserId,
      action,
      entityType: "Vendor",
      entityId: vendorId,
      metadata,
      ipAddress: ipAddress ?? null,
    },
  });
}

export async function performVendorOperationalAction(
  vendorId: string,
  body: Record<string, unknown>,
  actorUserId: string,
  ipAddress?: string | null,
) {
  const action = textValue(body.action, "Action", 50).toUpperCase();
  try {
    return await prisma.$transaction(async (transaction) => {
      if (action === "ADD_VEHICLE") {
        await requireEditableVendor(transaction, vendorId);
        const registrationNumber = textValue(
          body.registrationNumber,
          "Registration number",
          20,
        )
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        if (!/^[A-Z0-9]{6,15}$/.test(registrationNumber))
          throw new VendorOperationsError(
            "INVALID_VENDOR_OPERATION",
            "Enter a valid vehicle registration number.",
            400,
          );
        const vehicleType = enumValue(
          body.vehicleType,
          Object.values(VehicleType),
          "Vehicle type",
        );
        const ownership = enumValue(
          body.ownership,
          Object.values(VehicleOwnership),
          "Vehicle ownership",
        );
        const insuranceExpiry = body.insuranceExpiry
          ? new Date(String(body.insuranceExpiry))
          : null;
        if (insuranceExpiry && !Number.isFinite(insuranceExpiry.getTime()))
          throw new VendorOperationsError(
            "INVALID_VENDOR_OPERATION",
            "Insurance expiry date is invalid.",
            400,
          );
        const vehicle = await transaction.vendorVehicle.create({
          data: {
            vendorId,
            registrationNumber,
            vehicleType,
            ownership,
            status: VehicleStatus.AVAILABLE,
            currentCity:
              typeof body.currentCity === "string"
                ? body.currentCity.trim().slice(0, 100) || null
                : null,
            insuranceNumber:
              typeof body.insuranceNumber === "string"
                ? body.insuranceNumber.trim().toUpperCase().slice(0, 100) ||
                  null
                : null,
            insuranceExpiry,
            isActive: true,
          },
        });
        await audit(
          transaction,
          actorUserId,
          "VENDOR_VEHICLE_ADDED",
          vendorId,
          { vehicleId: vehicle.id, registrationNumber, vehicleType },
          ipAddress,
        );
        return { action, vehicleId: vehicle.id };
      }
      if (action === "ADD_DOCUMENT") {
        await requireEditableVendor(transaction, vendorId);
        const documentType = enumValue(
          body.documentType,
          Object.values(VendorDocumentType),
          "Document type",
        );
        const fileName = textValue(body.fileName, "File name", 200);
        const fileUrl = textValue(body.fileUrl, "Document URL", 1000);
        const expiryDate = body.expiryDate
          ? new Date(String(body.expiryDate))
          : null;
        if (expiryDate && !Number.isFinite(expiryDate.getTime()))
          throw new VendorOperationsError(
            "INVALID_VENDOR_OPERATION",
            "Document expiry date is invalid.",
            400,
          );
        try {
          const url = new URL(fileUrl);
          if (url.protocol !== "https:") throw new Error();
        } catch {
          throw new VendorOperationsError(
            "INVALID_VENDOR_OPERATION",
            "Document URL must be a valid HTTPS URL.",
            400,
          );
        }
        const document = await transaction.vendorDocument.create({
          data: {
            vendorId,
            documentType,
            documentNumber:
              typeof body.documentNumber === "string"
                ? body.documentNumber.trim().slice(0, 100) || null
                : null,
            fileName,
            fileUrl,
            expiryDate,
            isMandatory: body.isMandatory !== false,
            verificationStatus: VerificationStatus.PENDING,
            isActive: true,
          },
        });
        await audit(
          transaction,
          actorUserId,
          "VENDOR_DOCUMENT_ADDED",
          vendorId,
          { documentId: document.id, documentType },
          ipAddress,
        );
        return { action, documentId: document.id };
      }
      if (action === "REVIEW_DOCUMENT") {
        await requireEditableVendor(transaction, vendorId);
        const documentId = textValue(body.documentId, "Document ID", 100);
        const verificationStatus = enumValue(
          body.verificationStatus,
          [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
          "Verification status",
        );
        const rejectionReason =
          verificationStatus === VerificationStatus.REJECTED
            ? textValue(body.rejectionReason, "Rejection reason", 500)
            : null;
        const result = await transaction.vendorDocument.updateMany({
          where: { id: documentId, vendorId, isActive: true },
          data: {
            verificationStatus,
            verifiedBy: actorUserId,
            verifiedAt: new Date(),
            rejectionReason,
          },
        });
        if (!result.count)
          throw new VendorOperationsError(
            "VENDOR_DOCUMENT_NOT_FOUND",
            "Vendor document was not found.",
            404,
          );
        await audit(
          transaction,
          actorUserId,
          "VENDOR_DOCUMENT_REVIEWED",
          vendorId,
          { documentId, verificationStatus },
          ipAddress,
        );
        return { action, documentId, verificationStatus };
      }
      if (action === "ADD_BANK_ACCOUNT") {
        await requireEditableVendor(transaction, vendorId);
        const accountHolderName = textValue(
          body.accountHolderName,
          "Account holder name",
        );
        const bankName = textValue(body.bankName, "Bank name");
        const accountNumber = textValue(
          body.accountNumber,
          "Account number",
          30,
        ).replace(/\s/g, "");
        const ifscCode = textValue(
          body.ifscCode,
          "IFSC code",
          11,
        ).toUpperCase();
        if (
          !/^[0-9]{6,20}$/.test(accountNumber) ||
          !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)
        )
          throw new VendorOperationsError(
            "INVALID_VENDOR_OPERATION",
            "Enter a valid bank account number and IFSC code.",
            400,
          );
        const accountType = enumValue(
          body.accountType,
          Object.values(BankAccountType),
          "Account type",
        );
        const duplicate = await transaction.vendorBankAccount.findFirst({
          where: { vendorId, accountNumber, isActive: true },
          select: { id: true },
        });
        if (duplicate)
          throw new VendorOperationsError(
            "DUPLICATE_BANK_ACCOUNT",
            "This bank account is already registered for the vendor.",
            409,
          );
        const account = await transaction.vendorBankAccount.create({
          data: {
            vendorId,
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
            accountType,
            verified: false,
            isPrimary: false,
            isActive: true,
          },
        });
        await audit(
          transaction,
          actorUserId,
          "VENDOR_BANK_ACCOUNT_ADDED",
          vendorId,
          { bankAccountId: account.id, bankName, ifscCode },
          ipAddress,
        );
        return { action, bankAccountId: account.id };
      }
      if (action === "VERIFY_BANK_ACCOUNT") {
        await requireEditableVendor(transaction, vendorId);
        const bankAccountId = textValue(
          body.bankAccountId,
          "Bank account ID",
          100,
        );
        await transaction.vendorBankAccount.updateMany({
          where: { vendorId, isActive: true },
          data: { isPrimary: false },
        });
        const result = await transaction.vendorBankAccount.updateMany({
          where: { id: bankAccountId, vendorId, isActive: true },
          data: {
            verified: true,
            verifiedBy: actorUserId,
            verifiedAt: new Date(),
            isPrimary: true,
          },
        });
        if (!result.count)
          throw new VendorOperationsError(
            "VENDOR_BANK_ACCOUNT_NOT_FOUND",
            "Vendor bank account was not found.",
            404,
          );
        await audit(
          transaction,
          actorUserId,
          "VENDOR_BANK_ACCOUNT_VERIFIED",
          vendorId,
          { bankAccountId },
          ipAddress,
        );
        return { action, bankAccountId };
      }
      if (action === "DEACTIVATE_VEHICLE") {
        await requireEditableVendor(transaction, vendorId);
        const vehicleId = textValue(body.vehicleId, "Vehicle ID", 100);
        const result = await transaction.vendorVehicle.updateMany({
          where: { id: vehicleId, vendorId, isActive: true },
          data: { isActive: false, status: VehicleStatus.INACTIVE },
        });
        if (!result.count)
          throw new VendorOperationsError(
            "VENDOR_VEHICLE_NOT_FOUND",
            "Active vendor vehicle was not found.",
            404,
          );
        await audit(
          transaction,
          actorUserId,
          "VENDOR_VEHICLE_DEACTIVATED",
          vendorId,
          { vehicleId },
          ipAddress,
        );
        return { action, vehicleId };
      }
      if (action === "DEACTIVATE_DOCUMENT") {
        await requireEditableVendor(transaction, vendorId);
        const documentId = textValue(body.documentId, "Document ID", 100);
        const result = await transaction.vendorDocument.updateMany({
          where: { id: documentId, vendorId, isActive: true },
          data: { isActive: false },
        });
        if (!result.count)
          throw new VendorOperationsError(
            "VENDOR_DOCUMENT_NOT_FOUND",
            "Active vendor document was not found.",
            404,
          );
        await audit(
          transaction,
          actorUserId,
          "VENDOR_DOCUMENT_DEACTIVATED",
          vendorId,
          { documentId },
          ipAddress,
        );
        return { action, documentId };
      }
      if (action === "DEACTIVATE_BANK_ACCOUNT") {
        await requireEditableVendor(transaction, vendorId);
        const bankAccountId = textValue(
          body.bankAccountId,
          "Bank account ID",
          100,
        );
        const result = await transaction.vendorBankAccount.updateMany({
          where: { id: bankAccountId, vendorId, isActive: true },
          data: { isActive: false, verified: false, isPrimary: false },
        });
        if (!result.count)
          throw new VendorOperationsError(
            "VENDOR_BANK_ACCOUNT_NOT_FOUND",
            "Active vendor bank account was not found.",
            404,
          );
        await audit(
          transaction,
          actorUserId,
          "VENDOR_BANK_ACCOUNT_DEACTIVATED",
          vendorId,
          { bankAccountId },
          ipAddress,
        );
        return { action, bankAccountId };
      }
      throw new VendorOperationsError(
        "INVALID_VENDOR_OPERATION",
        "Unsupported vendor operational action.",
        400,
      );
    });
  } catch (error) {
    if (error instanceof VendorOperationsError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new VendorOperationsError(
        "DUPLICATE_VENDOR_RECORD",
        "This vendor operational record already exists.",
        409,
      );
    throw error;
  }
}

export async function changeVendorOperationalStatus(
  vendorId: string,
  activate: boolean,
  actorUserId: string,
  ipAddress?: string | null,
) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<
      Array<{ lockAcquired: number }>
    >`SELECT 1::int AS "lockAcquired" FROM (SELECT pg_advisory_xact_lock(hashtext(${vendorId}))) AS acquired`;
    const vendor = await transaction.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: {
        id: true,
        status: true,
        businessType: true,
        engagementMode: true,
        serviceAreas: { where: { active: true }, select: { id: true } },
        serviceOfferings: {
          where: { active: true },
          select: { id: true, serviceType: true },
        },
        vehicles: {
          where: { isActive: true, status: VehicleStatus.AVAILABLE },
          select: {
            id: true,
            registrationNumber: true,
            insuranceNumber: true,
            insuranceExpiry: true,
          },
        },
        documents: {
          where: { isActive: true },
          select: {
            documentType: true,
            documentNumber: true,
            verificationStatus: true,
            isMandatory: true,
            expiryDate: true,
          },
        },
        bankAccounts: {
          where: { isActive: true, verified: true },
          select: { id: true },
        },
      },
    });
    if (!vendor)
      throw new VendorOperationsError(
        "VENDOR_NOT_FOUND",
        "Vendor was not found.",
        404,
      );
    if (activate) {
      const blockers: string[] = [];
      if (vendor.businessType === "UNSPECIFIED")
        blockers.push("Establish the vendor business type.");
      if (!vendor.serviceAreas.length)
        blockers.push("Add an active service area.");
      if (!vendor.serviceOfferings.length)
        blockers.push("Add an active service offering.");
      const registeredFleetRequired =
        vendor.businessType === "INDIVIDUAL_OWNER_DRIVER" ||
        vendor.engagementMode !== "QUOTATION";
      if (registeredFleetRequired && !vendor.vehicles.length)
        blockers.push("Add an operational vehicle for instant-rate eligibility.");
      if (
        !vendor.documents.some(
          (document) =>
            document.documentType === VendorDocumentType.PAN &&
            document.verificationStatus === VerificationStatus.VERIFIED,
        )
      )
        blockers.push("Verify the PAN document.");
      if (
        vendor.documents.some(
          (document) =>
            document.isMandatory &&
            document.verificationStatus !== VerificationStatus.VERIFIED,
        )
      )
        blockers.push("Verify every mandatory document.");
      const transportRequired = vendor.serviceOfferings.some((offering) =>
        [
          "HOUSEHOLD_RELOCATION",
          "OFFICE_RELOCATION",
          "CORPORATE_RELOCATION",
          "VEHICLE_TRANSPORT",
          "COMMERCIAL_GOODS",
        ].includes(offering.serviceType),
      );
      const normalize = (value: string | null) =>
        value?.toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
      const eligibleVehicle = vendor.vehicles.some((vehicle) => {
        const registration = normalize(vehicle.registrationNumber);
        const insurance = normalize(vehicle.insuranceNumber);
        return Boolean(
          registration &&
          insurance &&
          vehicle.insuranceExpiry &&
          vehicle.insuranceExpiry.getTime() > Date.now() &&
          vendor.documents.some(
            (document) =>
              document.documentType === VendorDocumentType.VEHICLE_RC &&
              document.verificationStatus === VerificationStatus.VERIFIED &&
              normalize(document.documentNumber) === registration,
          ) &&
          vendor.documents.some(
            (document) =>
              document.documentType === VendorDocumentType.VEHICLE_INSURANCE &&
              document.verificationStatus === VerificationStatus.VERIFIED &&
              normalize(document.documentNumber) === insurance &&
              document.expiryDate &&
              document.expiryDate.getTime() > Date.now(),
          ),
        );
      });
      if (registeredFleetRequired && transportRequired && !eligibleVehicle)
        blockers.push(
          "Verify matching vehicle RC and unexpired insurance evidence.",
        );
      if (!vendor.bankAccounts.length)
        blockers.push("Verify an active bank account.");
      if (blockers.length)
        throw new VendorOperationsError(
          "VENDOR_NOT_READY",
          blockers.join(" "),
          409,
        );
    }
    const status = activate ? "ACTIVE" : "INACTIVE";
    await transaction.vendor.update({
      where: { id: vendor.id },
      data: { status },
    });
    await audit(
      transaction,
      actorUserId,
      activate ? "VENDOR_ACTIVATED" : "VENDOR_SUSPENDED",
      vendor.id,
      { previousStatus: vendor.status, status },
      ipAddress,
    );
    return {
      vendorId: vendor.id,
      status,
      idempotent: vendor.status === status,
    };
  });
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  name: string,
): T {
  if (typeof value !== "string" || !values.includes(value.toUpperCase() as T))
    throw new VendorOperationsError(
      "INVALID_VENDOR_CONFIGURATION",
      `${name} is invalid.`,
      400,
    );
  return value.toUpperCase() as T;
}

export async function replaceVendorServiceConfiguration(
  vendorId: string,
  body: Record<string, unknown>,
  actorUserId: string,
  ipAddress?: string | null,
) {
  if (
    !Array.isArray(body.areas) ||
    body.areas.length > 50 ||
    !Array.isArray(body.serviceTypes) ||
    body.serviceTypes.length > Object.values(VendorServiceType).length
  ) {
    throw new VendorOperationsError(
      "INVALID_VENDOR_CONFIGURATION",
      "Provide up to 50 service areas and supported service offerings.",
      400,
    );
  }
  const locations = await prisma.serviceLocation.findMany({
    where: { status: { not: "SUSPENDED" } },
    select: { id: true, city: true, state: true },
  });
  const locationById = new Map(
    locations.map((location) => [location.id, location]),
  );
  const areas = body.areas.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new VendorOperationsError(
        "INVALID_VENDOR_CONFIGURATION",
        `Service area ${index + 1} is invalid.`,
        400,
      );
    const input = item as Record<string, unknown>;
    const scope = enumValue(
      input.scope,
      Object.values(VendorServiceScope),
      "Service area scope",
    );
    if (scope === VendorServiceScope.PAN_INDIA)
      return {
        scope,
        originCity: null,
        originState: null,
        serviceablePostalCodes: [] as string[],
        active: true,
      };
    const location =
      typeof input.locationId === "string"
        ? locationById.get(input.locationId)
        : undefined;
    if (!location)
      throw new VendorOperationsError(
        "INVALID_VENDOR_CONFIGURATION",
        `Choose a registered service location for area ${index + 1}.`,
        400,
      );
    const pins = Array.isArray(input.serviceablePostalCodes)
      ? [
          ...new Set(
            input.serviceablePostalCodes
              .map((value) => String(value).trim())
              .filter(Boolean),
          ),
        ]
      : [];
    if (pins.some((pin) => !/^[1-9][0-9]{5}$/.test(pin)))
      throw new VendorOperationsError(
        "INVALID_VENDOR_CONFIGURATION",
        `Service area ${index + 1} contains an invalid PIN code.`,
        400,
      );
    return {
      scope,
      originCity:
        scope === VendorServiceScope.WITHIN_CITY ? location.city : null,
      originState: location.state,
      serviceablePostalCodes: pins,
      active: true,
    };
  });
  const areaKeys = areas.map(
    (area) =>
      `${area.scope}|${area.originState || ""}|${area.originCity || ""}`,
  );
  if (new Set(areaKeys).size !== areaKeys.length)
    throw new VendorOperationsError(
      "DUPLICATE_SERVICE_AREA",
      "Each service area must be unique.",
      409,
    );
  const serviceTypes = [
    ...new Set(
      body.serviceTypes.map((value) =>
        enumValue(value, Object.values(VendorServiceType), "Service offering"),
      ),
    ),
  ];
  return prisma.$transaction(async (transaction) => {
    const vendor = await transaction.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!vendor)
      throw new VendorOperationsError(
        "VENDOR_NOT_FOUND",
        "Vendor was not found.",
        404,
      );
    if (vendor.status === "ACTIVE" && (!areas.length || !serviceTypes.length))
      throw new VendorOperationsError(
        "ACTIVE_VENDOR_MINIMUM_CONFIGURATION_REQUIRED",
        "An active vendor must retain at least one service area and one service offering.",
        400,
      );
    await transaction.vendorServiceArea.deleteMany({
      where: { vendorId: vendor.id },
    });
    if (areas.length)
      await transaction.vendorServiceArea.createMany({
        data: areas.map((area) => ({ vendorId: vendor.id, ...area })),
      });
    await transaction.vendorServiceOffering.updateMany({
      where: { vendorId: vendor.id },
      data: { active: false },
    });
    for (const serviceType of serviceTypes) {
      await transaction.vendorServiceOffering.upsert({
        where: { vendorId_serviceType: { vendorId: vendor.id, serviceType } },
        create: {
          vendorId: vendor.id,
          serviceType,
          title: serviceType
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/^./, (letter) => letter.toUpperCase()),
          active: true,
        },
        update: { active: true },
      });
    }
    await transaction.crmAuditLog.create({
      data: {
        actorUserId,
        action: "VENDOR_SERVICE_CONFIGURATION_REPLACED",
        entityType: "Vendor",
        entityId: vendor.id,
        ipAddress: ipAddress ?? null,
        metadata: {
          areaCount: areas.length,
          serviceTypes,
        } as Prisma.InputJsonValue,
      },
    });
    return {
      vendorId: vendor.id,
      areaCount: areas.length,
      offeringCount: serviceTypes.length,
    };
  });
}
