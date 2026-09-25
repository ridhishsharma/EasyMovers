import { PrismaVendorRepository } from "@/domains/vendor/repositories/prisma-vendor.repository";
import { createInitialVendorRepositoryInput } from "@/domains/vendor/services/vendor.service";
import { validateCompleteVendorOnboardingInput } from "@/domains/vendor/validators/vendor.validator";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapVendorApplicationToOnboardingInput } from "@/lib/vendor-application-approval";

export type VendorApplicationReviewAction =
  | "START_REVIEW"
  | "REQUEST_INFORMATION"
  | "REJECT";

export class VendorApplicationReviewError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "VendorApplicationReviewError";
  }
}

function requiredReason(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 3) {
    throw new VendorApplicationReviewError(
      "REVIEW_REASON_REQUIRED",
      "A review reason containing at least 3 characters is required.",
      400
    );
  }

  if (value.trim().length > 1000) {
    throw new VendorApplicationReviewError(
      "REVIEW_REASON_TOO_LONG",
      "The review reason cannot exceed 1000 characters.",
      400
    );
  }

  return value.trim();
}

function applicationWhere(identifier: string): Prisma.VendorApplicationWhereInput {
  const normalized = identifier.trim();

  if (!normalized || normalized.length > 100) {
    throw new VendorApplicationReviewError(
      "INVALID_APPLICATION_IDENTIFIER",
      "A valid Vendor application identifier is required.",
      400
    );
  }

  return {
    OR: [{ id: normalized }, { referenceId: normalized }],
  };
}

async function lockApplication(
  transaction: Prisma.TransactionClient,
  applicationId: string
) {
  await transaction.$queryRaw<Array<{ lockAcquired: number }>>`
  SELECT 1::int AS "lockAcquired"
  FROM (
    SELECT pg_advisory_xact_lock(hashtext(${applicationId}))
  ) AS acquired
`;
}
async function findAndLockApplication(
  transaction: Prisma.TransactionClient,
  identifier: string
) {
  const candidate = await transaction.vendorApplication.findFirst({
    where: applicationWhere(identifier),
    select: { id: true },
  });

  if (!candidate) {
    throw new VendorApplicationReviewError(
      "VENDOR_APPLICATION_NOT_FOUND",
      "Vendor application was not found.",
      404
    );
  }

  // Always lock the canonical database ID. Requests using either the
  // internal ID or public reference therefore serialize on the same key.
  await lockApplication(transaction, candidate.id);

  const application = await transaction.vendorApplication.findUnique({
    where: { id: candidate.id },
  });

  if (!application) {
    throw new VendorApplicationReviewError(
      "VENDOR_APPLICATION_NOT_FOUND",
      "Vendor application was not found.",
      404
    );
  }

  return application;
}

export async function reviewVendorApplication(input: {
  applicationId: string;
  action: VendorApplicationReviewAction;
  administratorUserId: string;
  reason?: unknown;
}) {
  return prisma.$transaction(async transaction => {
    const application = await findAndLockApplication(
      transaction,
      input.applicationId
    );

    if (application.status === "APPROVED" || application.status === "WITHDRAWN") {
      throw new VendorApplicationReviewError(
        "VENDOR_APPLICATION_FINALIZED",
        "This Vendor application can no longer be reviewed.",
        409
      );
    }

    const now = new Date();
    let status: "UNDER_REVIEW" | "NEEDS_INFORMATION" | "REJECTED";
    let reviewNotes: string | null = null;
    let reviewedAt: Date | null = null;

    switch (input.action) {
      case "START_REVIEW":
        if (application.status === "REJECTED") {
          throw new VendorApplicationReviewError(
            "VENDOR_APPLICATION_FINALIZED",
            "A rejected Vendor application cannot be reopened by this operation.",
            409
          );
        }
        status = "UNDER_REVIEW";
        break;

      case "REQUEST_INFORMATION":
        if (application.status === "REJECTED") {
          throw new VendorApplicationReviewError(
            "VENDOR_APPLICATION_FINALIZED",
            "A rejected Vendor application cannot request more information.",
            409
          );
        }
        status = "NEEDS_INFORMATION";
        reviewNotes = requiredReason(input.reason);
        break;

      case "REJECT":
        status = "REJECTED";
        reviewNotes = requiredReason(input.reason);
        reviewedAt = now;
        break;

      default:
        throw new VendorApplicationReviewError(
          "INVALID_REVIEW_ACTION",
          "The requested Vendor application review action is invalid.",
          400
        );
    }

    if (
      application.status === status &&
      (reviewNotes === null || application.reviewNotes === reviewNotes)
    ) {
      return application;
    }

    return transaction.vendorApplication.update({
      where: { id: application.id },
      data: {
        status,
        reviewNotes,
        reviewedAt,
        reviewedBy: input.administratorUserId,
        reviewedByUserId: input.administratorUserId,
      },
    });
  });
}

export async function approveVendorApplication(input: {
  applicationId: string;
  administratorUserId: string;
  notes?: unknown;
}) {
  return prisma.$transaction(async transaction => {
    const application = await findAndLockApplication(
      transaction,
      input.applicationId
    );

    if (application.status === "APPROVED") {
      if (!application.vendorId) {
        throw new VendorApplicationReviewError(
          "APPROVED_APPLICATION_VENDOR_MISSING",
          "The approved application is not linked to a Vendor.",
          409
        );
      }

      const existingVendor = await transaction.vendor.findUnique({
        where: { id: application.vendorId },
        select: { id: true, vendorCode: true, status: true },
      });

      if (!existingVendor) {
        throw new VendorApplicationReviewError(
          "APPROVED_APPLICATION_VENDOR_MISSING",
          "The Vendor linked to this approved application was not found.",
          409
        );
      }

      return {
        applicationId: application.id,
        applicationReference: application.referenceId,
        vendor: existingVendor,
        idempotent: true,
      };
    }

    if (application.status !== "UNDER_REVIEW") {
      throw new VendorApplicationReviewError(
        "VENDOR_APPLICATION_NOT_UNDER_REVIEW",
        "Move the Vendor application to UNDER_REVIEW before approval.",
        409
      );
    }

    const onboarding = mapVendorApplicationToOnboardingInput(
      application,
      input.administratorUserId
    );
    const validation = validateCompleteVendorOnboardingInput(onboarding);

    if (!validation.valid) {
      throw new VendorApplicationReviewError(
        "VENDOR_APPLICATION_CONVERSION_INVALID",
        validation.errors.map(error => error.message).join(" "),
        422
      );
    }

    const repository = new PrismaVendorRepository(transaction);
    const repositoryInput = createInitialVendorRepositoryInput(onboarding);
    const uniqueness = await repository.checkUniqueness({
      companyName: repositoryInput.businessDetails.companyName,
      email: repositoryInput.contact.email,
      phone: repositoryInput.ownerDetails.phone,
      gstNumber: repositoryInput.businessDetails.gstNumber,
      panNumber:
        repositoryInput.businessDetails.panNumber ??
        repositoryInput.ownerDetails.panNumber,
    });

    if (uniqueness.exists) {
      throw new VendorApplicationReviewError(
        "VENDOR_ALREADY_EXISTS",
        "A Vendor already exists with matching unique details.",
        409
      );
    }

    const vendor = await repository.create(repositoryInput);
    await transaction.vendor.update({
      where: { id: vendor.id },
      data: { engagementMode: application.engagementMode },
    });
    const reviewNotes =
      typeof input.notes === "string" && input.notes.trim()
        ? input.notes.trim().slice(0, 1000)
        : null;

    await transaction.vendorApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        vendorId: vendor.id,
        reviewedAt: new Date(),
        reviewedBy: input.administratorUserId,
        reviewedByUserId: input.administratorUserId,
        reviewNotes,
      },
    });

    return {
      applicationId: application.id,
      applicationReference: application.referenceId,
      vendor: {
        id: vendor.id,
        vendorCode: vendor.vendorCode,
        status: vendor.active ? "ACTIVE" : "INACTIVE",
      },
      idempotent: false,
    };
  }, {
    maxWait: 10_000,
    timeout: 30_000,
  });
}
