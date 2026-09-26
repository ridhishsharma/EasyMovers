import {
  Prisma,
  UserRole,
  VendorChangeAction,
  VendorChangeEntityType,
  VendorChangeSource,
  VendorChangeStatus,
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
        select: { id: true, vendorId: true, status: true, submittedByUserId: true },
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
    const result = await transaction.vendorChangeRequest.updateMany({
      where: { id: change.id, status: VendorChangeStatus.PENDING },
      data: { status, reviewedByUserId: input.reviewerUserId, reviewedAt: new Date(), reviewNote },
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
