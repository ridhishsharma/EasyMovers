import {
  BankAccountType,
  Prisma,
  UserRole,
  VehicleOwnership,
  VehicleStatus,
  VehicleType,
  VendorChangeAction,
  VendorChangeEntityType,
  VendorChangeSource,
  VendorChangeStatus,
  VendorDocumentType,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class VendorChangeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "VendorChangeError";
  }
}

type SubmissionInput = {
  vendorId: string;
  entityType: VendorChangeEntityType;
  action: VendorChangeAction;
  entityId?: string | null;
  source: VendorChangeSource;
  proposedData: Prisma.InputJsonValue;
  previousData?: Prisma.InputJsonValue;
  submissionNote?: string | null;
  submittedByUserId: string;
};

function boundedNote(value: string | null | undefined, required: boolean) {
  const note = value?.trim().slice(0, 1000) || null;
  if (required && !note)
    throw new VendorChangeError(
      "REVIEW_NOTE_REQUIRED",
      "A reason is required when rejecting a vendor change.",
      400,
    );
  return note;
}

function validatePayload(value: Prisma.InputJsonValue) {
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new VendorChangeError(
      "INVALID_CHANGE_PAYLOAD",
      "Vendor change data must be a JSON object.",
      400,
    );
  if (JSON.stringify(value).length > 50_000)
    throw new VendorChangeError(
      "CHANGE_PAYLOAD_TOO_LARGE",
      "Vendor change data is too large.",
      413,
    );
}

function record(value: Prisma.JsonValue) {
  if (!value || Array.isArray(value) || typeof value !== "object")
    throw new VendorChangeError("INVALID_CHANGE_PAYLOAD", "Vendor change data must be a JSON object.", 400);
  return value as Record<string, Prisma.JsonValue>;
}

function requiredText(data: Record<string, Prisma.JsonValue>, key: string, max = 200) {
  const value = typeof data[key] === "string" ? data[key].trim().slice(0, max) : "";
  if (!value)
    throw new VendorChangeError("INVALID_CHANGE_PAYLOAD", `${key} is required.`, 400);
  return value;
}

function optionalText(data: Record<string, Prisma.JsonValue>, key: string, max = 200) {
  return typeof data[key] === "string" ? data[key].trim().slice(0, max) || null : null;
}

function enumField<T extends string>(data: Record<string, Prisma.JsonValue>, key: string, values: readonly T[]) {
  const value = data[key];
  if (typeof value !== "string" || !values.includes(value as T))
    throw new VendorChangeError("INVALID_CHANGE_PAYLOAD", `${key} is invalid.`, 400);
  return value as T;
}

function optionalDate(data: Record<string, Prisma.JsonValue>, key: string) {
  if (!data[key]) return null;
  const value = new Date(String(data[key]));
  if (!Number.isFinite(value.getTime()))
    throw new VendorChangeError("INVALID_CHANGE_PAYLOAD", `${key} is invalid.`, 400);
  return value;
}

async function applyApprovedChange(
  transaction: Prisma.TransactionClient,
  change: {
    id: string;
    vendorId: string;
    entityType: VendorChangeEntityType;
    action: VendorChangeAction;
    entityId: string | null;
    proposedData: Prisma.JsonValue;
  },
  reviewerUserId: string,
) {
  const data = record(change.proposedData);
  if (change.entityType === VendorChangeEntityType.VEHICLE) {
    if (change.action === VendorChangeAction.DEACTIVATE) {
      if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Vehicle ID is required.", 400);
      const result = await transaction.vendorVehicle.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: { isActive: false, status: VehicleStatus.INACTIVE } });
      if (!result.count) throw new VendorChangeError("VEHICLE_NOT_FOUND", "Active vehicle was not found.", 404);
      return change.entityId;
    }
    const registrationNumber = requiredText(data, "registrationNumber", 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[A-Z0-9]{6,15}$/.test(registrationNumber)) throw new VendorChangeError("INVALID_CHANGE_PAYLOAD", "registrationNumber is invalid.", 400);
    const vehicleData = {
      registrationNumber,
      vehicleType: enumField(data, "vehicleType", Object.values(VehicleType)),
      ownership: enumField(data, "ownership", Object.values(VehicleOwnership)),
      currentCity: optionalText(data, "currentCity", 100),
      insuranceNumber: optionalText(data, "insuranceNumber", 100)?.toUpperCase() ?? null,
      insuranceExpiry: optionalDate(data, "insuranceExpiry"),
    };
    if (change.action === VendorChangeAction.CREATE) {
      const created = await transaction.vendorVehicle.create({ data: { vendorId: change.vendorId, ...vehicleData, status: VehicleStatus.AVAILABLE, isActive: true }, select: { id: true } });
      return created.id;
    }
    if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Vehicle ID is required.", 400);
    const result = await transaction.vendorVehicle.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: vehicleData });
    if (!result.count) throw new VendorChangeError("VEHICLE_NOT_FOUND", "Active vehicle was not found.", 404);
    return change.entityId;
  }
  if (change.entityType === VendorChangeEntityType.DOCUMENT) {
    if (change.action === VendorChangeAction.DEACTIVATE) {
      if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Document ID is required.", 400);
      const result = await transaction.vendorDocument.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: { isActive: false } });
      if (!result.count) throw new VendorChangeError("DOCUMENT_NOT_FOUND", "Active document was not found.", 404);
      return change.entityId;
    }
    const documentData = {
      documentType: enumField(data, "documentType", Object.values(VendorDocumentType)),
      documentNumber: optionalText(data, "documentNumber", 100),
      fileName: optionalText(data, "fileName", 200),
      fileUrl: optionalText(data, "fileUrl", 1000),
      expiryDate: optionalDate(data, "expiryDate"),
      isMandatory: data.isMandatory !== false,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedBy: reviewerUserId,
      verifiedAt: new Date(),
      rejectionReason: null,
      isActive: true,
    };
    if (change.action === VendorChangeAction.CREATE) {
      const created = await transaction.vendorDocument.create({ data: { vendorId: change.vendorId, ...documentData }, select: { id: true } });
      return created.id;
    }
    if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Document ID is required.", 400);
    const result = await transaction.vendorDocument.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: documentData });
    if (!result.count) throw new VendorChangeError("DOCUMENT_NOT_FOUND", "Active document was not found.", 404);
    return change.entityId;
  }
  if (change.entityType === VendorChangeEntityType.BANK_ACCOUNT) {
    if (change.action === VendorChangeAction.DEACTIVATE) {
      if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Bank account ID is required.", 400);
      const result = await transaction.vendorBankAccount.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: { isActive: false, isPrimary: false } });
      if (!result.count) throw new VendorChangeError("BANK_ACCOUNT_NOT_FOUND", "Active bank account was not found.", 404);
      return change.entityId;
    }
    const bankData = {
      accountHolderName: requiredText(data, "accountHolderName"),
      bankName: requiredText(data, "bankName"),
      accountNumber: requiredText(data, "accountNumber", 40),
      ifscCode: requiredText(data, "ifscCode", 20).toUpperCase(),
      accountType: enumField(data, "accountType", Object.values(BankAccountType)),
      verified: true,
      verifiedBy: reviewerUserId,
      verifiedAt: new Date(),
      isActive: true,
    };
    if (change.action === VendorChangeAction.CREATE) {
      await transaction.vendorBankAccount.updateMany({ where: { vendorId: change.vendorId, isActive: true }, data: { isPrimary: false } });
      const created = await transaction.vendorBankAccount.create({ data: { vendorId: change.vendorId, ...bankData, isPrimary: true }, select: { id: true } });
      return created.id;
    }
    if (!change.entityId) throw new VendorChangeError("ENTITY_ID_REQUIRED", "Bank account ID is required.", 400);
    const result = await transaction.vendorBankAccount.updateMany({ where: { id: change.entityId, vendorId: change.vendorId, isActive: true }, data: bankData });
    if (!result.count) throw new VendorChangeError("BANK_ACCOUNT_NOT_FOUND", "Active bank account was not found.", 404);
    return change.entityId;
  }
  throw new VendorChangeError("CHANGE_TYPE_NOT_SUPPORTED", "This change type is not enabled for controlled application yet.", 400);
}

export async function listVendorChanges(status: VendorChangeStatus, take = 100) {
  return prisma.vendorChangeRequest.findMany({
    where: { status },
    take: Math.min(Math.max(take, 1), 100),
    orderBy: { submittedAt: "asc" },
    select: {
      id: true, vendorId: true, entityType: true, action: true, entityId: true,
      source: true, status: true, proposedData: true, previousData: true,
      submissionNote: true, reviewNote: true, submittedAt: true, reviewedAt: true,
      vendor: { select: { vendorCode: true, companyName: true } },
      submittedBy: { select: { id: true, fullName: true, email: true } },
      reviewedBy: { select: { id: true, fullName: true, email: true } },
    },
  });
}

export async function submitVendorChange(input: SubmissionInput) {
  validatePayload(input.proposedData);
  return prisma.$transaction(async (transaction) => {
    const [vendor, submitter] = await Promise.all([
      transaction.vendor.findFirst({
        where: { id: input.vendorId, deletedAt: null },
        select: { id: true },
      }),
      transaction.user.findFirst({
        where: { id: input.submittedByUserId, isActive: true },
        select: { id: true, role: true, vendorId: true },
      }),
    ]);
    if (!vendor)
      throw new VendorChangeError("VENDOR_NOT_FOUND", "Vendor was not found.", 404);
    if (!submitter)
      throw new VendorChangeError("SUBMITTER_NOT_FOUND", "Active submitter was not found.", 403);
    if (
      input.source === VendorChangeSource.VENDOR_PORTAL &&
      (submitter.role !== UserRole.VENDOR || submitter.vendorId !== input.vendorId)
    )
      throw new VendorChangeError(
        "VENDOR_OWNERSHIP_REQUIRED",
        "A vendor user may submit changes only for their linked vendor profile.",
        403,
      );
    if (
      input.source === VendorChangeSource.EM_STAFF &&
      submitter.role !== UserRole.ADMIN &&
      submitter.role !== UserRole.SUPER_ADMIN
    )
      throw new VendorChangeError(
        "OFFICE_USER_REQUIRED",
        "Only an active EasyMovers office user may submit a staff change.",
        403,
      );

    const pending = input.entityId || input.entityType === VendorChangeEntityType.PROFILE
      ? await transaction.vendorChangeRequest.findFirst({
          where: {
            vendorId: input.vendorId,
            entityType: input.entityType,
            entityId: input.entityId ?? null,
            status: VendorChangeStatus.PENDING,
          },
          select: { id: true },
        })
      : null;
    if (pending)
      throw new VendorChangeError(
        "CHANGE_ALREADY_PENDING",
        "A change for this record is already awaiting verification.",
        409,
      );

    const change = await transaction.vendorChangeRequest.create({
      data: {
        vendorId: input.vendorId,
        entityType: input.entityType,
        action: input.action,
        entityId: input.entityId ?? null,
        source: input.source,
        proposedData: input.proposedData,
        previousData: input.previousData,
        submissionNote: boundedNote(input.submissionNote, false),
        submittedByUserId: input.submittedByUserId,
      },
      select: { id: true, status: true, submittedAt: true },
    });
    await transaction.crmAuditLog.create({
      data: {
        actorUserId: input.submittedByUserId,
        action: "VENDOR_CHANGE_SUBMITTED",
        entityType: "VendorChangeRequest",
        entityId: change.id,
        metadata: {
          vendorId: input.vendorId,
          changeEntityType: input.entityType,
          changeAction: input.action,
          source: input.source,
        },
      },
    });
    return change;
  });
}

export async function reviewVendorChange(input: {
  changeRequestId: string;
  reviewerUserId: string;
  decision: "APPROVED" | "REJECTED";
  reviewNote?: string | null;
}) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.changeRequestId}))`;
    const [change, reviewer] = await Promise.all([
      transaction.vendorChangeRequest.findUnique({
        where: { id: input.changeRequestId },
        select: { id: true, vendorId: true, entityType: true, action: true, entityId: true, proposedData: true, status: true, submittedByUserId: true },
      }),
      transaction.user.findFirst({
        where: {
          id: input.reviewerUserId,
          isActive: true,
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        },
        select: { id: true },
      }),
    ]);
    if (!change)
      throw new VendorChangeError("CHANGE_NOT_FOUND", "Vendor change was not found.", 404);
    if (!reviewer)
      throw new VendorChangeError("REVIEWER_NOT_FOUND", "Active reviewer was not found.", 403);
    if (change.status !== VendorChangeStatus.PENDING)
      throw new VendorChangeError("CHANGE_ALREADY_REVIEWED", "This vendor change is no longer pending.", 409);
    if (change.submittedByUserId === input.reviewerUserId)
      throw new VendorChangeError(
        "MAKER_CHECKER_CONFLICT",
        "The user who submitted this change cannot verify it.",
        403,
      );
    const status = input.decision === "APPROVED"
      ? VendorChangeStatus.APPROVED
      : VendorChangeStatus.REJECTED;
    const reviewNote = boundedNote(input.reviewNote, status === VendorChangeStatus.REJECTED);
    const appliedEntityId = status === VendorChangeStatus.APPROVED
      ? await applyApprovedChange(transaction, change, input.reviewerUserId)
      : null;
    const result = await transaction.vendorChangeRequest.updateMany({
      where: { id: change.id, status: VendorChangeStatus.PENDING },
      data: {
        status,
        entityId: change.entityId ?? appliedEntityId,
        reviewedByUserId: input.reviewerUserId,
        reviewedAt: new Date(),
        appliedAt: status === VendorChangeStatus.APPROVED ? new Date() : null,
        reviewNote,
      },
    });
    if (!result.count)
      throw new VendorChangeError("CHANGE_ALREADY_REVIEWED", "This vendor change is no longer pending.", 409);
    await transaction.crmAuditLog.create({
      data: {
        actorUserId: input.reviewerUserId,
        action: status === VendorChangeStatus.APPROVED
          ? "VENDOR_CHANGE_APPROVED"
          : "VENDOR_CHANGE_REJECTED",
        entityType: "VendorChangeRequest",
        entityId: change.id,
        metadata: { vendorId: change.vendorId, status },
      },
    });
    return { id: change.id, status };
  });
}
