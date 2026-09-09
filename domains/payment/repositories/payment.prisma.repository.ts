/**
 * ============================================================================
 * EasyMovers
 * Prisma Payment Repository
 * Part A
 * ============================================================================
 *
 * File:
 * domains/payment/repositories/payment.prisma.repository.ts
 *
 * Responsibilities of Part A:
 * - Define Prisma Payment repository client type
 * - Define canonical Payment relation include
 * - Define hydrated Prisma Payment record types
 * - Define Prisma -> Payment-domain mapping bridge
 * - Define Prisma PaymentTransaction -> domain mapping bridge
 * - Define repository defaults
 * - Define identifier/pagination helpers
 * - Normalize Prisma repository errors
 * - Establish persistence foundations for later CRUD/query parts
 *
 * This file does not yet:
 * - Create Payments
 * - Update Payments
 * - Delete Payments
 * - Search/list Payments
 * - Persist gateway orders
 * - Process webhooks
 * - Perform reconciliation
 *
 * Those operations will be added in subsequent parts.
 * ============================================================================
 */
/* ============================================================================
 * Prisma runtime
 * ============================================================================
 */

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

/* ============================================================================
 * Payment-domain runtime values
 * ============================================================================
 */

import {
  PaymentProvider,
  PaymentSortDirection,
  PaymentSortField,
} from "../models/payment.model";
/* ============================================================================
 * Payment-domain types
 * ============================================================================
 */

import type {
  Payment,
  PaymentListResult,
  PaymentSearchCriteria,
  PaymentTransaction,
  PaymentTransactionListResult,
  PaymentTransactionSearchCriteria,
} from "../models/payment.model";
/* ============================================================================
 * Payment mapper runtime
 * ============================================================================
 */
import {
  mapPaymentFromPersistence,
  mapPaymentJsonToPrisma,
  mapPaymentProvider,
  mapPaymentsToStatistics,
  mapPaymentToPersistence,
  mapPaymentToSummary,
  mapPaymentTransactionsToStatistics,
  mapPaymentTransactionFromRecord,
  mapPaymentTransactionToPersistenceRecord,
} from "../mappers/payment.mapper";

/* ============================================================================
 * Payment mapper types
 * ============================================================================
 */

import type {
  PaymentPersistenceRecord,
} from "../mappers/payment.mapper";

/* ============================================================================
 * Payment repository runtime
 * ============================================================================
 */

import {
  createDefaultPaymentRepositoryCapabilityReport,
  createHealthyPaymentRepositoryResult,
  createPaymentRepositoryPage,
  createUnhealthyPaymentRepositoryResult,
  createValidPaymentRepositoryConfiguration,
  DEFAULT_PAYMENT_REPOSITORY_PAGE,
  DEFAULT_PAYMENT_REPOSITORY_PAGE_SIZE,
  DEFAULT_PAYMENT_REPOSITORY_SORT,
  mapPaymentSearchCriteriaToRepositoryQuery,
  mapPaymentTransactionSearchCriteriaToRepositoryQuery,
  MAX_PAYMENT_REPOSITORY_PAGE_SIZE,
  normalizePaymentRepositoryIds,
  PaymentRepositoryError,
} from "./payment.repository";

/* ============================================================================
 * Payment repository types
 * ============================================================================
 */

import type {
  CompleteExtendedPaymentRepository,
  CreatePaymentGatewayOrderRepositoryInput,
  CreatePaymentRepositoryInput,
  CreatePaymentTransactionRepositoryInput,
  CreatePaymentWebhookRepositoryInput,
ClaimRetryablePaymentBookingSyncsRepositoryInput,
  ExtendedPaymentRepository,
  ExtendedPaymentRepositoryTransactionCallback,
  ExtendedPaymentRepositoryTransactionManager,
  MarkPaymentWebhookFailedRepositoryInput,
  MarkPaymentWebhookProcessedRepositoryInput,
  PaymentGatewayOrderRepositoryRecord,
  PaymentReconciliationHistoryQuery,
  PaymentReconciliationHistoryResult,
  PaymentRepositoryBulkLookupInput,
  PaymentRepositoryBulkLookupResult,
  PaymentRepositoryBulkStatusUpdateInput,
  PaymentRepositoryBulkStatusUpdateResult,
  PaymentRepositoryCapabilityReport,
  PaymentRepositoryConfigurationValidation,
  PaymentRepositoryErrorCode,
  PaymentRepositoryFilter,
  PaymentRepositoryHealth,
  PaymentRepositoryListQuery,
 PaymentBookingSyncFinancialSnapshot,
 PaymentBookingSyncRepositoryRecord,
  PaymentRepositoryPage,
  PaymentRepositoryPagination,
  PaymentRepositorySort,
  PaymentTransactionRepositoryFilter,
  PaymentTransactionRepositoryListQuery,
  PaymentWebhookRepositoryRecord,
  SavePaymentReconciliationRepositoryInput,
  UpdatePaymentFinancialSummaryRepositoryInput,
  UpdatePaymentGatewayOrderRepositoryInput,
  UpdatePaymentRepositoryInput,
  UpdatePaymentStatusRepositoryInput,
  UpdatePaymentTransactionRepositoryInput,
UpsertPendingPaymentBookingSyncRepositoryInput,
FindRetryablePaymentBookingSyncsRepositoryInput,
GetPaymentBookingSyncStatisticsRepositoryInput,
MarkPaymentBookingSyncFailedRepositoryInput,
MarkPaymentBookingSyncRetryPendingRepositoryInput,
PaymentBookingSyncStatisticsRepositoryResult,
MarkPaymentBookingSyncSynchronizedRepositoryInput,
} from "./payment.repository";
/*
============================================================================
 * Prisma repository client
 * ============================================================================
 */

/**
 * Payment repository operations must work with:
 *
 * - the normal PrismaClient
 * - Prisma transaction clients
 *
 * This allows exactly the same repository methods to be used inside:
 *
 * prisma.$transaction(...)
 */
export type PrismaPaymentRepositoryClient =
  PrismaClient |
  Prisma.TransactionClient;

/* ============================================================================
 * Canonical Payment relation include
 * ============================================================================
 */

/**
 * Relations required by the Payment aggregate.
 *
 * transactions
 *   -> normalized financial transaction history
 *
 * gatewayOrders
 *   -> provider-side payment-order history
 *
 * webhooks
 *   -> provider webhook/idempotency history
 *
 * reconciliations
 *   -> reconciliation history
 *
 * booking
 *   -> authoritative Booking relation
 *
 * quotation
 *   -> selected/commercial quotation reference when available
 *
 * user
 *   -> optional payer/user relation
 *
 * vendor
 *   -> optional Vendor relation
 */
export const PAYMENT_REPOSITORY_INCLUDE = {
  booking:
    true,

  quotation:
    true,

  user:
    true,

  vendor:
    true,

  transactions: {
    orderBy: {
      initiatedAt:
        "asc",
    },
  },

  gatewayOrders: {
    orderBy: {
      createdAt:
        "asc",
    },
  },

  webhooks: {
    orderBy: {
      receivedAt:
        "asc",
    },
  },

  reconciliations: {
    orderBy: {
      reconciledAt:
        "asc",
    },
  },
} satisfies Prisma.PaymentInclude;

/* ============================================================================
 * Hydrated Prisma record types
 * ============================================================================
 */

/**
 * Canonical hydrated Payment record.
 */
export type PrismaPaymentRecord =
  Prisma.PaymentGetPayload<{
    include:
      typeof PAYMENT_REPOSITORY_INCLUDE;
  }>;

/**
 * Normalized PaymentTransaction record.
 */
export type PrismaPaymentTransactionRecord =
  Prisma.PaymentTransactionGetPayload<object>;

/**
 * Gateway-order persistence record.
 */
export type PrismaPaymentGatewayOrderRecord =
  Prisma.PaymentGatewayOrderGetPayload<object>;

/**
 * Webhook persistence record.
 */
export type PrismaPaymentWebhookRecord =
  Prisma.PaymentWebhookGetPayload<object>;

/**
 * Reconciliation persistence record.
 */
export type PrismaPaymentReconciliationRecord =
  Prisma.PaymentReconciliationGetPayload<object>;

/**
 * Persistent Payment -> Booking synchronization state.
 */
export type PrismaPaymentBookingSyncRecord =
  Prisma.PaymentBookingSyncGetPayload<object>;
/* ============================================================================
 * Repository defaults
 * ============================================================================
 */

export const PRISMA_PAYMENT_DEFAULT_PAGE =
  DEFAULT_PAYMENT_REPOSITORY_PAGE;

export const PRISMA_PAYMENT_DEFAULT_PAGE_SIZE =
  DEFAULT_PAYMENT_REPOSITORY_PAGE_SIZE;

export const PRISMA_PAYMENT_MAX_PAGE_SIZE =
  MAX_PAYMENT_REPOSITORY_PAGE_SIZE;

export const PRISMA_PAYMENT_DEFAULT_SORT:
  PaymentRepositorySort = {
  ...DEFAULT_PAYMENT_REPOSITORY_SORT,
};

/* ============================================================================
 * Identifier helpers
 * ============================================================================
 */

/**
 * Trims one optional repository identifier.
 */
export function normalizePrismaPaymentString(
  value:
    unknown
): string | undefined {
  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}

/**
 * Requires a non-empty repository identifier.
 */
export function requirePrismaPaymentIdentifier(
  value:
    unknown,
  field:
    string
): string {
  const normalized =
    normalizePrismaPaymentString(
      value
    );

  if (
    !normalized
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} is required.`,
      {
        field,
        value,
      }
    );
  }

  return normalized;
}

/* ============================================================================
 * Amount helpers
 * ============================================================================
 */

/**
 * Converts Prisma Decimal / number compatible values to number.
 */
export function prismaPaymentDecimalToNumber(
  value:
    Prisma.Decimal |
    number |
    string |
    null |
    undefined,
  fallback =
    0
): number {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return fallback;
  }

  if (
    typeof value ===
      "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : fallback;
  }

  if (
    typeof value ===
      "string"
  ) {
    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : fallback;
  }

  const parsed =
    value.toNumber();

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

/* ============================================================================
 * JSON helpers
 * ============================================================================
 */

function prismaPaymentJsonObject(
  value:
    Prisma.JsonValue |
    null |
    undefined
): Record<
  string,
  unknown
> | undefined {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    return undefined;
  }

  return value as Record<
    string,
    unknown
  >;
}

/* ============================================================================
 * Prisma transaction -> domain transaction
 * ============================================================================
 */

/**
 * Converts a normalized Prisma PaymentTransaction record into the
 * Payment-domain transaction contract.
 */
export function mapPrismaPaymentTransactionToDomain(
  record:
    PrismaPaymentTransactionRecord
): PaymentTransaction {
  const gateway =
    record.gatewayOrderId ||
    record.gatewayPaymentId ||
    record.gatewayReferenceId
      ? {
          provider:
            record.provider,

          gatewayOrderId:
            record.gatewayOrderId ??
            undefined,

          gatewayPaymentId:
            record.gatewayPaymentId ??
            undefined,

          gatewayReferenceId:
            record.gatewayReferenceId ??
            undefined,
        }
      : undefined;

  const failure =
    record.failureReason ||
    record.failureMessage ||
    record.providerErrorCode ||
    record.failedAt
      ? {
          reason:
            record.failureReason ??
            undefined,

          message:
            record.failureMessage ??
            undefined,

          providerCode:
            record.providerErrorCode ??
            undefined,

          failedAt:
            record.failedAt
              ?.toISOString(),
        }
      : undefined;

  const recordedBy =
    record.recordedByType
      ? {
          actorType:
            record.recordedByType,

          actorId:
            record.recordedById ??
            undefined,

          displayName:
            record.recordedByName ??
            undefined,
        }
      : undefined;

  const mapped =
    mapPaymentTransactionFromRecord({
      transactionId:
        record.id,

      paymentId:
        record.paymentId,

      transactionType:
        record.transactionType,

      purpose:
        record.purpose,

      amount: {
        amount:
          prismaPaymentDecimalToNumber(
            record.amount
          ),

        currency:
          record.currency,
      },

      status:
        record.status,

      method:
        record.method,

      provider:
        record.provider,

      gateway,

      failure,

      initiatedAt:
        record.initiatedAt,

      authorizedAt:
        record.authorizedAt,

      capturedAt:
        record.capturedAt,

      completedAt:
        record.completedAt,

      failedAt:
        record.failedAt,

      remarks:
        record.remarks,

      recordedBy,
    });

  if (
    !mapped
  ) {
    throw new PaymentRepositoryError(
      "REPOSITORY_READ_FAILED",
      "Failed to map Prisma Payment transaction.",
      {
        paymentId:
          record.paymentId,

        transactionId:
          record.id,
      }
    );
  }

  return mapped;
}

/* ============================================================================
 * Prisma transaction collection -> domain
 * ============================================================================
 */

export function mapPrismaPaymentTransactionsToDomain(
  records:
    PrismaPaymentTransactionRecord[]
): PaymentTransaction[] {
  return records.map(
    (
      record
    ) =>
      mapPrismaPaymentTransactionToDomain(
        record
      )
  );
}

/* ============================================================================
 * Prisma Payment -> mapper persistence bridge
 * ============================================================================
 */

/**
 * Converts the strongly typed Prisma Payment record into the persistence-neutral
 * record understood by payment.mapper.ts.
 *
 * This keeps Prisma details isolated in this repository adapter.
 */
export function mapPrismaPaymentToPersistenceRecord(
  record:
    PrismaPaymentRecord
): PaymentPersistenceRecord {
  const transactions =
    mapPrismaPaymentTransactionsToDomain(
      record.transactions
    );

  const storedAudit =
    prismaPaymentJsonObject(
      record.auditJson
    );

  const auditJson:
    Record<
      string,
      unknown
    > = {
    ...(storedAudit ??
      {}),

    createdAt:
      record.createdAt
        .toISOString(),

    updatedAt:
      record.updatedAt
        .toISOString(),

    source:
      record.source,
  };

  return {
    id:
      record.id,

    paymentNumber:
      record.paymentNumber,

    /**
     * referenceId was intentionally introduced nullable during the migration
     * phase so old Payment records remain valid.
     *
     * paymentNumber is the safe legacy fallback until all historic records are
     * backfilled with canonical referenceId values.
     */
    referenceId:
      record.referenceId ??
      record.paymentNumber,

    bookingId:
      record.bookingId,

    bookingNumber:
      record.booking
        ?.bookingNumber ??
      null,

    /**
     * The current Prisma Payment model has userId rather than a dedicated
     * customerId column.
     *
     * For the current domain bridge, userId is therefore the persisted
     * customer identity.
     */
    customerId:
      record.userId,

    vendorId:
      record.vendorId,

    quotationId:
      record.quotationId,

    status:
      record.paymentStatus,

    totalAmount:
      record.totalAmount,

    advanceAmount:
      record.advanceAmount,

    paidAmount:
      record.paidAmount,

    balanceAmount:
      record.balanceAmount,

    paymentPending:
      record.paymentPending,

    currency:
      record.currency,

    payableJson:
      record.payableJson,

    commercialReferenceJson:
      record.commercialReference,

    /**
     * Transactions now live in their normalized table.
     *
     * We pass the reconstructed domain transactions through the existing
     * mapper bridge so the core Payment mapper remains persistence-neutral.
     */
    transactionsJson:
      transactions,

    refundSummaryJson:
      record.refundSummaryJson,

    latestSuccessfulTransactionId:
      record.latestSuccessfulTransactionId,

    remarks:
      record.remarks,

    internalRemarks:
      record.internalRemarks,

    metadataJson:
      record.metadata,

    auditJson,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,
  };
}

/* ============================================================================
 * Prisma Payment -> domain aggregate
 * ============================================================================
 */

/**
 * Canonical Prisma Payment -> Payment domain mapping function.
 */
export function mapPrismaPaymentToDomain(
  record:
    PrismaPaymentRecord
): Payment {
  return mapPaymentFromPersistence(
    mapPrismaPaymentToPersistenceRecord(
      record
    )
  );
}

/* ============================================================================
 * Prisma Payment collection -> domain
 * ============================================================================
 */

export function mapPrismaPaymentsToDomain(
  records:
    PrismaPaymentRecord[]
): Payment[] {
  return records.map(
    (
      record
    ) =>
      mapPrismaPaymentToDomain(
        record
      )
  );
}

/* ============================================================================
 * Prisma Payment -> Booking synchronization mapping
 * ============================================================================
 */

function requirePrismaPaymentBookingSyncNumber(
  value:
    unknown,
  field:
    string
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    throw new PaymentRepositoryError(
      "REPOSITORY_READ_FAILED",
      `Persisted ${field} must be a finite number.`,
      {
        field,
        value,
      }
    );
  }

  return value;
}

function requirePrismaPaymentBookingSyncCurrency(
  value:
    unknown,
  field:
    string
): PaymentBookingSyncFinancialSnapshot["currency"] {
  const currency =
    normalizePrismaPaymentString(
      value
    );

  if (
    !currency
  ) {
    throw new PaymentRepositoryError(
      "REPOSITORY_READ_FAILED",
      `Persisted ${field} is required.`,
      {
        field,
        value,
      }
    );
  }

  return currency as
    PaymentBookingSyncFinancialSnapshot["currency"];
}

function mapPrismaPaymentBookingSyncSnapshot(
  value:
    Prisma.JsonValue |
    null |
    undefined,
  field:
    string
): PaymentBookingSyncFinancialSnapshot {
  const snapshot =
    prismaPaymentJsonObject(
      value
    );

  if (
    !snapshot
  ) {
    throw new PaymentRepositoryError(
      "REPOSITORY_READ_FAILED",
      `Persisted ${field} must be a JSON object.`,
      {
        field,
        value,
      }
    );
  }

  return {
    totalAmount:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.totalAmount,
        `${field}.totalAmount`
      ),

    paidAmount:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.paidAmount,
        `${field}.paidAmount`
      ),

    balanceAmount:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.balanceAmount,
        `${field}.balanceAmount`
      ),

    paymentPending:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.paymentPending,
        `${field}.paymentPending`
      ),

    refundedAmount:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.refundedAmount,
        `${field}.refundedAmount`
      ),

    refundPendingAmount:
      requirePrismaPaymentBookingSyncNumber(
        snapshot.refundPendingAmount,
        `${field}.refundPendingAmount`
      ),

    currency:
      requirePrismaPaymentBookingSyncCurrency(
        snapshot.currency,
        `${field}.currency`
      ),
  };
}

export function mapPrismaPaymentBookingSyncToRepositoryRecord(
  record:
    PrismaPaymentBookingSyncRecord
): PaymentBookingSyncRepositoryRecord {
  const bookingSnapshot =
    record.bookingSnapshotJson
      ? mapPrismaPaymentBookingSyncSnapshot(
          record.bookingSnapshotJson,
          "bookingSnapshotJson"
        )
      : undefined;

  return {
    id:
      record.id,

    paymentId:
      record.paymentId,

    bookingId:
      record.bookingId,

    status:
      record.status,

    paymentUpdatedAt:
      record.paymentUpdatedAt
        .toISOString(),

    paymentSnapshot:
      mapPrismaPaymentBookingSyncSnapshot(
        record.paymentSnapshotJson,
        "paymentSnapshotJson"
      ),

    ...(bookingSnapshot
      ? {
          bookingSnapshot,
        }
      : {}),

    attemptCount:
      record.attemptCount,

    ...(record.lastAttemptAt
      ? {
          lastAttemptAt:
            record.lastAttemptAt
              .toISOString(),
        }
      : {}),

    ...(record.nextRetryAt
      ? {
          nextRetryAt:
            record.nextRetryAt
              .toISOString(),
        }
      : {}),

    ...(record.synchronizedAt
      ? {
          synchronizedAt:
            record.synchronizedAt
              .toISOString(),
        }
      : {}),

    ...(record.lastErrorCode
      ? {
          lastErrorCode:
            record.lastErrorCode,
        }
      : {}),

    ...(record.lastErrorMessage
      ? {
          lastErrorMessage:
            record.lastErrorMessage,
        }
      : {}),

    requestedBy:
      record.requestedBy,

    createdAt:
      record.createdAt
        .toISOString(),

    updatedAt:
      record.updatedAt
        .toISOString(),
  };
}

export function mapPrismaPaymentBookingSyncsToRepositoryRecords(
  records:
    PrismaPaymentBookingSyncRecord[]
): PaymentBookingSyncRepositoryRecord[] {
  return records.map(
    (
      record
    ) =>
      mapPrismaPaymentBookingSyncToRepositoryRecord(
        record
      )
  );
}
/* ============================================================================
 * Pagination normalization
 * ============================================================================
 */

export function normalizePrismaPaymentPagination(
  pagination?:
    PaymentRepositoryPagination
): Required<
  PaymentRepositoryPagination
> {
  const page =
    Number.isInteger(
      pagination?.page
    ) &&
    (
      pagination?.page ??
      0
    ) >
      0
      ? pagination!.page
      : PRISMA_PAYMENT_DEFAULT_PAGE;

  const requestedPageSize =
    Number.isInteger(
      pagination?.pageSize
    ) &&
    (
      pagination?.pageSize ??
      0
    ) >
      0
      ? pagination!.pageSize
      : PRISMA_PAYMENT_DEFAULT_PAGE_SIZE;

  const pageSize =
    Math.min(
      requestedPageSize,
      PRISMA_PAYMENT_MAX_PAGE_SIZE
    );

  return {
    page,

    pageSize,
  };
}

/* ============================================================================
 * Pagination skip/take
 * ============================================================================
 */

export interface PrismaPaymentPagination {
  page:
    number;

  pageSize:
    number;

  skip:
    number;

  take:
    number;
}

export function createPrismaPaymentPagination(
  pagination?:
    PaymentRepositoryPagination
): PrismaPaymentPagination {
  const normalized =
    normalizePrismaPaymentPagination(
      pagination
    );

  return {
    page:
      normalized.page,

    pageSize:
      normalized.pageSize,

    skip:
      (
        normalized.page -
        1
      ) *
      normalized.pageSize,

    take:
      normalized.pageSize,
  };
}

/* ============================================================================
 * Prisma error detection
 * ============================================================================
 */

function isPrismaKnownRequestError(
  error:
    unknown
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  );
}

/* ============================================================================
 * Prisma repository error normalization
 * ============================================================================
 */

/**
 * Maps known Prisma failures into stable PaymentRepository errors.
 */
export function normalizePrismaPaymentRepositoryError(
  error:
    unknown,
  fallbackCode:
    PaymentRepositoryErrorCode =
      "REPOSITORY_READ_FAILED"
): PaymentRepositoryError {
  if (
    error instanceof
      PaymentRepositoryError
  ) {
    return error;
  }

  if (
    isPrismaKnownRequestError(
      error
    )
  ) {
    switch (
      error.code
    ) {
      case "P2002": {
        const target =
          Array.isArray(
            error.meta
              ?.target
          )
            ? error.meta
                ?.target
                .map(
                  String
                )
            : [];

        if (
          target.includes(
            "paymentNumber"
          )
        ) {
          return new PaymentRepositoryError(
            "DUPLICATE_PAYMENT_NUMBER",
            "A Payment with this paymentNumber already exists.",
            {
              field:
                "paymentNumber",
            }
          );
        }

        if (
          target.includes(
            "referenceId"
          )
        ) {
          return new PaymentRepositoryError(
            "DUPLICATE_PAYMENT_REFERENCE",
            "A Payment with this referenceId already exists.",
            {
              field:
                "referenceId",
            }
          );
        }

        if (
          target.includes(
            "gatewayPaymentId"
          )
        ) {
          return new PaymentRepositoryError(
            "DUPLICATE_GATEWAY_PAYMENT",
            "A Payment transaction with this gatewayPaymentId already exists.",
            {
              field:
                "gateway.gatewayPaymentId",
            }
          );
        }

        return new PaymentRepositoryError(
          "DUPLICATE_PAYMENT",
          "A duplicate Payment persistence record already exists."
        );
      }

      case "P2003":
        return new PaymentRepositoryError(
          "REPOSITORY_WRITE_FAILED",
          "Payment relation constraint failed."
        );

      case "P2025":
        return new PaymentRepositoryError(
          "PAYMENT_NOT_FOUND",
          "Payment record was not found."
        );

      default:
        return new PaymentRepositoryError(
          fallbackCode,
          "Payment repository operation failed."
        );
    }
  }

  return new PaymentRepositoryError(
    fallbackCode,
    "Payment repository operation failed."
  );
}

/* ============================================================================
 * Core Prisma Payment record lookup helpers
 * ============================================================================
 */

/**
 * Internal strongly typed Payment lookup.
 *
 * Later repository methods reuse this function so every read uses the same
 * aggregate relation graph.
 */
export async function findPrismaPaymentRecordById(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  PrismaPaymentRecord | null
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    return await prisma
      .payment
      .findUnique({
        where: {
          id:
            normalizedPaymentId,
        },

        include:
          PAYMENT_REPOSITORY_INCLUDE,
      });
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/**
 * Internal strongly typed lookup by Payment number.
 */
export async function findPrismaPaymentRecordByNumber(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentNumber:
    string
): Promise<
  PrismaPaymentRecord | null
> {
  const normalizedPaymentNumber =
    requirePrismaPaymentIdentifier(
      paymentNumber,
      "paymentNumber"
    );

  try {
    return await prisma
      .payment
      .findUnique({
        where: {
          paymentNumber:
            normalizedPaymentNumber,
        },

        include:
          PAYMENT_REPOSITORY_INCLUDE,
      });
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/**
 * Internal strongly typed lookup by canonical Payment reference.
 */
export async function findPrismaPaymentRecordByReferenceId(
  prisma:
    PrismaPaymentRepositoryClient,
  referenceId:
    string
): Promise<
  PrismaPaymentRecord | null
> {
  const normalizedReferenceId =
    requirePrismaPaymentIdentifier(
      referenceId,
      "referenceId"
    );

  try {
    return await prisma
      .payment
      .findUnique({
        where: {
          referenceId:
            normalizedReferenceId,
        },

        include:
          PAYMENT_REPOSITORY_INCLUDE,
      });
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Part A facade
 * ============================================================================
 */

export const PrismaPaymentRepositoryFoundation = {
  include:
    PAYMENT_REPOSITORY_INCLUDE,

  map: {
    payment:
      mapPrismaPaymentToDomain,

    payments:
      mapPrismaPaymentsToDomain,

    transaction:
      mapPrismaPaymentTransactionToDomain,

    transactions:
      mapPrismaPaymentTransactionsToDomain,
  },

  lookup: {
    recordById:
      findPrismaPaymentRecordById,

    recordByNumber:
      findPrismaPaymentRecordByNumber,

    recordByReferenceId:
      findPrismaPaymentRecordByReferenceId,
  },

  pagination: {
    normalize:
      normalizePrismaPaymentPagination,

    create:
      createPrismaPaymentPagination,
  },

  normalizeError:
    normalizePrismaPaymentRepositoryError,
} as const;

/* ============================================================================
 * End of Prisma Payment Repository - Part A
 * ============================================================================
 */
/* ============================================================================
 * Prisma Payment write mapping
 * ============================================================================
 */

/**
 * Maps a Payment-domain aggregate into Prisma create data.
 *
 * The normalized PaymentTransaction records are persisted separately.
 * This keeps aggregate-level Payment fields and transaction history distinct.
 */
export function mapPaymentToPrismaCreateData(
  payment:
    Payment
): Prisma.PaymentUncheckedCreateInput {
  const persistence =
    mapPaymentToPersistence(
      payment
    );

  return {
    id:
      persistence.id,

    paymentNumber:
      persistence.paymentNumber,

    referenceId:
      persistence.referenceId,

    bookingId:
      persistence.bookingId,

    quotationId:
      persistence.quotationId,

    userId:
      persistence.customerId,

    vendorId:
      persistence.vendorId,

    /**
     * Legacy compatibility:
     * amount remains populated from totalAmount.
     */
    amount:
      new Prisma.Decimal(
        persistence.totalAmount
      ),

    currency:
      persistence.currency,

    paymentMethod:
      payment.transactions.length >
        0
        ? payment.transactions[
            payment.transactions.length -
            1
          ].method ??
          null
        : null,

    paymentType:
      payment.commercialReference
        ?.customerPayableAmount !==
        undefined
        ? null
        : null,

    paymentStatus:
      payment.status,

    transactionId:
      null,

    gatewayTransactionId:
      null,

    gatewayOrderId:
      null,

    gatewayPaymentId:
      null,

    gatewaySignature:
      null,

    bankReference:
      null,

    remarks:
      persistence.remarks,

    paidAt:
      payment.status ===
        "PAID"
        ? new Date(
            payment.audit
              .updatedAt
          )
        : null,

    refundAmount:
      payment.refundSummary
        ?.totalRefundedAmount !==
        undefined
        ? new Prisma.Decimal(
            payment.refundSummary
              .totalRefundedAmount
          )
        : null,

    refundReason:
      null,

    refundedAt:
      payment.refundSummary
        ?.lastRefundedAt
        ? new Date(
            payment.refundSummary
              .lastRefundedAt
          )
        : null,

    metadata:
      persistence.metadataJson,

    createdAt:
      persistence.createdAt,

    updatedAt:
      persistence.updatedAt,

    totalAmount:
      new Prisma.Decimal(
        persistence.totalAmount
      ),

    advanceAmount:
      persistence.advanceAmount !==
        null
        ? new Prisma.Decimal(
            persistence.advanceAmount
          )
        : null,

    paidAmount:
      new Prisma.Decimal(
        persistence.paidAmount
      ),

    balanceAmount:
      new Prisma.Decimal(
        persistence.balanceAmount
      ),

    paymentPending:
      new Prisma.Decimal(
        persistence.paymentPending
      ),

    refundPendingAmount:
      new Prisma.Decimal(
        payment.refundSummary
          ?.refundPendingAmount ??
        0
      ),

    payableJson:
      persistence.payableJson,

    commercialReference:
      persistence
        .commercialReferenceJson,

    refundSummaryJson:
      persistence
        .refundSummaryJson,

    latestSuccessfulTransactionId:
      persistence
        .latestSuccessfulTransactionId,

    internalRemarks:
      persistence.internalRemarks,

    source:
      payment.audit.source,

    auditJson:
      persistence.auditJson,
  };
}

/* ============================================================================
 * Prisma Payment update mapping
 * ============================================================================
 */

export function mapPaymentToPrismaUpdateData(
  payment:
    Payment
): Prisma.PaymentUncheckedUpdateInput {
  const persistence =
    mapPaymentToPersistence(
      payment
    );

  return {
    referenceId:
      persistence.referenceId,

    quotationId:
      persistence.quotationId,

    userId:
      persistence.customerId,

    vendorId:
      persistence.vendorId,

    amount:
      new Prisma.Decimal(
        persistence.totalAmount
      ),

    currency:
      persistence.currency,

    paymentStatus:
      payment.status,

    remarks:
      persistence.remarks,

    refundAmount:
      payment.refundSummary
        ?.totalRefundedAmount !==
        undefined
        ? new Prisma.Decimal(
            payment.refundSummary
              .totalRefundedAmount
          )
        : null,

    refundedAt:
      payment.refundSummary
        ?.lastRefundedAt
        ? new Date(
            payment.refundSummary
              .lastRefundedAt
          )
        : null,

    metadata:
      persistence.metadataJson,

    totalAmount:
      new Prisma.Decimal(
        persistence.totalAmount
      ),

    advanceAmount:
      persistence.advanceAmount !==
        null
        ? new Prisma.Decimal(
            persistence.advanceAmount
          )
        : null,

    paidAmount:
      new Prisma.Decimal(
        persistence.paidAmount
      ),

    balanceAmount:
      new Prisma.Decimal(
        persistence.balanceAmount
      ),

    paymentPending:
      new Prisma.Decimal(
        persistence.paymentPending
      ),

    refundPendingAmount:
      new Prisma.Decimal(
        payment.refundSummary
          ?.refundPendingAmount ??
        0
      ),

    payableJson:
      persistence.payableJson,

    commercialReference:
      persistence
        .commercialReferenceJson,

    refundSummaryJson:
      persistence
        .refundSummaryJson,

    latestSuccessfulTransactionId:
      persistence
        .latestSuccessfulTransactionId,

    internalRemarks:
      persistence.internalRemarks,

    source:
      payment.audit.source,

    auditJson:
      persistence.auditJson,

    updatedAt:
      persistence.updatedAt,
  };
}

/* ============================================================================
 * Payment create
 * ============================================================================
 */

export async function createPrismaPayment(
  prisma:
    PrismaPaymentRepositoryClient,
  payment:
    Payment
): Promise<
  Payment
> {
  try {
    const record =
      await prisma
        .payment
        .create({
          data:
            mapPaymentToPrismaCreateData(
              payment
            ),

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPrismaPaymentToDomain(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment update
 * ============================================================================
 */

export async function updatePrismaPayment(
  prisma:
    PrismaPaymentRepositoryClient,
  payment:
    Payment
): Promise<
  Payment
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      payment.paymentId,
      "paymentId"
    );

  try {
    const record =
      await prisma
        .payment
        .update({
          where: {
            id:
              paymentId,
          },

          data:
            mapPaymentToPrismaUpdateData(
              payment
            ),

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPrismaPaymentToDomain(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment status update
 * ============================================================================
 */

export async function updatePrismaPaymentStatus(
  prisma:
    PrismaPaymentRepositoryClient,
  input: {
    paymentId:
      string;

    status:
      Payment["status"];

    updatedAt?:
      string;

    updatedBy?:
      string;
  }
): Promise<
  Payment
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const updatedAt =
    input.updatedAt
      ? new Date(
          input.updatedAt
        )
      : new Date();

  try {
    const current =
      await findPrismaPaymentRecordById(
        prisma,
        paymentId
      );

    if (
      !current
    ) {
      throw new PaymentRepositoryError(
        "PAYMENT_NOT_FOUND",
        "Payment not found.",
        {
          paymentId,
        }
      );
    }

    const storedAudit =
      prismaPaymentJsonObject(
        current.auditJson
      ) ??
      {};

    const auditJson =
      mapPaymentJsonToPrisma({
        ...storedAudit,

        updatedAt:
          updatedAt
            .toISOString(),

        updatedBy:
          input.updatedBy ??
          storedAudit.updatedBy,

        source:
          current.source,
      });

    const record =
      await prisma
        .payment
        .update({
          where: {
            id:
              paymentId,
          },

          data: {
            paymentStatus:
              input.status,

            auditJson,

            updatedAt,
          },

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPrismaPaymentToDomain(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment financial summary update
 * ============================================================================
 */

export async function updatePrismaPaymentFinancialSummary(
  prisma:
    PrismaPaymentRepositoryClient,
  input: {
    paymentId:
      string;

    totalAmount?:
      number;

    advanceAmount?:
      number;

    paidAmount?:
      number;

    balanceAmount?:
      number;

    paymentPending?:
      number;

    refundedAmount?:
      number;

    refundPendingAmount?:
      number;

    latestSuccessfulTransactionId?:
      string;

    updatedAt?:
      string;

    updatedBy?:
      string;
  }
): Promise<
  Payment
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  try {
    const current =
      await findPrismaPaymentRecordById(
        prisma,
        paymentId
      );

    if (
      !current
    ) {
      throw new PaymentRepositoryError(
        "PAYMENT_NOT_FOUND",
        "Payment not found.",
        {
          paymentId,
        }
      );
    }

    const totalAmount =
      input.totalAmount ??
      prismaPaymentDecimalToNumber(
        current.totalAmount
      );

    const paidAmount =
      input.paidAmount ??
      prismaPaymentDecimalToNumber(
        current.paidAmount
      );

    const balanceAmount =
      input.balanceAmount ??
      Math.max(
        0,
        totalAmount -
          paidAmount
      );

    const paymentPending =
      input.paymentPending ??
      balanceAmount;

    const refundAmount =
      input.refundedAmount ??
      prismaPaymentDecimalToNumber(
        current.refundAmount
      );

    const refundPendingAmount =
      input.refundPendingAmount ??
      prismaPaymentDecimalToNumber(
        current.refundPendingAmount
      );

    const updatedAt =
      input.updatedAt
        ? new Date(
            input.updatedAt
          )
        : new Date();

    const storedAudit =
      prismaPaymentJsonObject(
        current.auditJson
      ) ??
      {};

    const auditJson =
      mapPaymentJsonToPrisma({
        ...storedAudit,

        updatedAt:
          updatedAt
            .toISOString(),

        updatedBy:
          input.updatedBy ??
          storedAudit.updatedBy,

        source:
          current.source,
      });

    const payableJson =
      mapPaymentJsonToPrisma({
        totalAmount,

        advanceAmount:
          input.advanceAmount ??
          (
            current.advanceAmount
              ? prismaPaymentDecimalToNumber(
                  current.advanceAmount
                )
              : undefined
          ),

        paidAmount,

        balanceAmount,

        paymentPending,

        currency:
          current.currency,
      });

    const refundSummaryJson =
      mapPaymentJsonToPrisma({
        totalRefundedAmount:
          refundAmount,

        refundPendingAmount,

        currency:
          current.currency,

        lastRefundedAt:
          current.refundedAt
            ?.toISOString(),
      });

    const record =
      await prisma
        .payment
        .update({
          where: {
            id:
              paymentId,
          },

          data: {
            amount:
              new Prisma.Decimal(
                totalAmount
              ),

            totalAmount:
              new Prisma.Decimal(
                totalAmount
              ),

            ...(input.advanceAmount !==
              undefined
              ? {
                  advanceAmount:
                    new Prisma.Decimal(
                      input.advanceAmount
                    ),
                }
              : {}),

            paidAmount:
              new Prisma.Decimal(
                paidAmount
              ),

            balanceAmount:
              new Prisma.Decimal(
                balanceAmount
              ),

            paymentPending:
              new Prisma.Decimal(
                paymentPending
              ),

            refundAmount:
              new Prisma.Decimal(
                refundAmount
              ),

            refundPendingAmount:
              new Prisma.Decimal(
                refundPendingAmount
              ),

            latestSuccessfulTransactionId:
              input
                .latestSuccessfulTransactionId ??
              current
                .latestSuccessfulTransactionId,

            payableJson,

            refundSummaryJson,

            auditJson,

            updatedAt,
          },

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPrismaPaymentToDomain(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment delete
 * ============================================================================
 */

export async function deletePrismaPayment(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  boolean
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    await prisma
      .payment
      .delete({
        where: {
          id:
            normalizedPaymentId,
        },
      });

    return true;
  } catch (
    error
  ) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2025"
    ) {
      return false;
    }

    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment uniqueness checks
 * ============================================================================
 */

export async function prismaPaymentNumberExists(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentNumber:
    string
): Promise<
  boolean
> {
  const normalizedPaymentNumber =
    requirePrismaPaymentIdentifier(
      paymentNumber,
      "paymentNumber"
    );

  try {
    const count =
      await prisma
        .payment
        .count({
          where: {
            paymentNumber:
              normalizedPaymentNumber,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

export async function prismaPaymentReferenceIdExists(
  prisma:
    PrismaPaymentRepositoryClient,
  referenceId:
    string
): Promise<
  boolean
> {
  const normalizedReferenceId =
    requirePrismaPaymentIdentifier(
      referenceId,
      "referenceId"
    );

  try {
    const count =
      await prisma
        .payment
        .count({
          where: {
            referenceId:
              normalizedReferenceId,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

export async function prismaBookingPaymentExists(
  prisma:
    PrismaPaymentRepositoryClient,
  bookingId:
    string
): Promise<
  boolean
> {
  const normalizedBookingId =
    requirePrismaPaymentIdentifier(
      bookingId,
      "bookingId"
    );

  try {
    const count =
      await prisma
        .payment
        .count({
          where: {
            bookingId:
              normalizedBookingId,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

export async function prismaGatewayPaymentIdExists(
  prisma:
    PrismaPaymentRepositoryClient,
  gatewayPaymentId:
    string
): Promise<
  boolean
> {
  const normalizedGatewayPaymentId =
    requirePrismaPaymentIdentifier(
      gatewayPaymentId,
      "gatewayPaymentId"
    );

  try {
    const count =
      await prisma
        .paymentTransaction
        .count({
          where: {
            gatewayPaymentId:
              normalizedGatewayPaymentId,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Mutation facade
 * ============================================================================
 */

export const PrismaPaymentMutationRepository = {
  create:
    createPrismaPayment,

  update:
    updatePrismaPayment,

  updateStatus:
    updatePrismaPaymentStatus,

  updateFinancialSummary:
    updatePrismaPaymentFinancialSummary,

  delete:
    deletePrismaPayment,

  paymentNumberExists:
    prismaPaymentNumberExists,

  referenceIdExists:
    prismaPaymentReferenceIdExists,

  bookingPaymentExists:
    prismaBookingPaymentExists,

  gatewayPaymentIdExists:
    prismaGatewayPaymentIdExists,
} as const;

/* ============================================================================
 * End of Prisma Payment Repository - Part B
 * ============================================================================
 */
/* ============================================================================
 * Prisma Payment query mapping
 * ============================================================================
 */

/**
 * Builds a strongly typed Prisma PaymentWhereInput from repository filters.
 */
export function buildPrismaPaymentWhere(
  filter?:
    PaymentRepositoryFilter
): Prisma.PaymentWhereInput {
  if (
    !filter
  ) {
    return {};
  }

  const where:
    Prisma.PaymentWhereInput = {};

  const paymentId =
    normalizePrismaPaymentString(
      filter.paymentId
    );

  if (
    paymentId
  ) {
    where.id =
      paymentId;
  }

  const paymentNumber =
    normalizePrismaPaymentString(
      filter.paymentNumber
    );

  if (
    paymentNumber
  ) {
    where.paymentNumber =
      paymentNumber;
  }

  const referenceId =
    normalizePrismaPaymentString(
      filter.referenceId
    );

  if (
    referenceId
  ) {
    where.referenceId =
      referenceId;
  }

  const bookingId =
    normalizePrismaPaymentString(
      filter.bookingId
    );

  if (
    bookingId
  ) {
    where.bookingId =
      bookingId;
  }

  const quotationId =
    normalizePrismaPaymentString(
      filter.quotationId
    );

  if (
    quotationId
  ) {
    where.quotationId =
      quotationId;
  }

  const customerId =
    normalizePrismaPaymentString(
      filter.customerId
    );

  if (
    customerId
  ) {
    /**
     * Domain customerId currently maps to Prisma Payment.userId.
     */
    where.userId =
      customerId;
  }

  const vendorId =
    normalizePrismaPaymentString(
      filter.vendorId
    );

  if (
    vendorId
  ) {
    where.vendorId =
      vendorId;
  }

  if (
    filter.status
  ) {
    where.paymentStatus =
      filter.status;
  }

  if (
    filter.statuses &&
    filter.statuses.length >
      0
  ) {
    where.paymentStatus = {
      in:
        filter.statuses,
    };
  }

  if (
    filter.currency
  ) {
    where.currency =
      filter.currency;
  }

  const totalAmount:
    Prisma.DecimalFilter = {};

  if (
    typeof filter.minimumAmount ===
      "number" &&
    Number.isFinite(
      filter.minimumAmount
    )
  ) {
    totalAmount.gte =
      new Prisma.Decimal(
        filter.minimumAmount
      );
  }

  if (
    typeof filter.maximumAmount ===
      "number" &&
    Number.isFinite(
      filter.maximumAmount
    )
  ) {
    totalAmount.lte =
      new Prisma.Decimal(
        filter.maximumAmount
      );
  }

  if (
    Object.keys(
      totalAmount
    ).length >
      0
  ) {
    where.totalAmount =
      totalAmount;
  }

  const paidAmount:
    Prisma.DecimalFilter = {};

  if (
    typeof filter.minimumPaidAmount ===
      "number" &&
    Number.isFinite(
      filter.minimumPaidAmount
    )
  ) {
    paidAmount.gte =
      new Prisma.Decimal(
        filter.minimumPaidAmount
      );
  }

  if (
    typeof filter.maximumPaidAmount ===
      "number" &&
    Number.isFinite(
      filter.maximumPaidAmount
    )
  ) {
    paidAmount.lte =
      new Prisma.Decimal(
        filter.maximumPaidAmount
      );
  }

  if (
    Object.keys(
      paidAmount
    ).length >
      0
  ) {
    where.paidAmount =
      paidAmount;
  }

  const createdAt:
    Prisma.DateTimeFilter = {};

  if (
    filter.createdFrom
  ) {
    const parsed =
      new Date(
        filter.createdFrom
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      createdAt.gte =
        parsed;
    }
  }

  if (
    filter.createdUntil
  ) {
    const parsed =
      new Date(
        filter.createdUntil
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      createdAt.lte =
        parsed;
    }
  }

  if (
    Object.keys(
      createdAt
    ).length >
      0
  ) {
    where.createdAt =
      createdAt;
  }

  const updatedAt:
    Prisma.DateTimeFilter = {};

  if (
    filter.updatedFrom
  ) {
    const parsed =
      new Date(
        filter.updatedFrom
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      updatedAt.gte =
        parsed;
    }
  }

  if (
    filter.updatedUntil
  ) {
    const parsed =
      new Date(
        filter.updatedUntil
      );

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      updatedAt.lte =
        parsed;
    }
  }

  if (
    Object.keys(
      updatedAt
    ).length >
      0
  ) {
    where.updatedAt =
      updatedAt;
  }

  if (
    filter.hasOutstandingBalance ===
      true
  ) {
    where.balanceAmount = {
      gt:
        new Prisma.Decimal(
          0
        ),
    };
  }

  if (
    filter.hasOutstandingBalance ===
      false
  ) {
    where.balanceAmount = {
      equals:
        new Prisma.Decimal(
          0
        ),
    };
  }

  if (
    filter.hasRefund ===
      true
  ) {
    where.OR = [
      {
        refundAmount: {
          gt:
            new Prisma.Decimal(
              0
            ),
        },
      },

      {
        refundPendingAmount: {
          gt:
            new Prisma.Decimal(
              0
            ),
        },
      },
    ];
  }

  if (
    filter.hasRefund ===
      false
  ) {
    where.AND = [
      {
        OR: [
          {
            refundAmount:
              null,
          },

          {
            refundAmount: {
              equals:
                new Prisma.Decimal(
                  0
                ),
            },
          },
        ],
      },

      {
        refundPendingAmount: {
          equals:
            new Prisma.Decimal(
              0
            ),
        },
      },
    ];
  }

  if (
    filter.provider
  ) {
    where.transactions = {
      some: {
        provider:
          filter.provider,
      },
    };
  }

  if (
    filter.transactionStatus
  ) {
    /**
     * If provider and transactionStatus are both supplied, they should match
     * the same transaction rather than two unrelated transaction rows.
     */
    where.transactions = {
      some: {
        ...(filter.provider
          ? {
              provider:
                filter.provider,
            }
          : {}),

        status:
          filter.transactionStatus,
      },
    };
  }

  if (
    filter.source
  ) {
    where.source =
      filter.source;
  }

  /**
   * leadId does not currently exist as a direct field on Prisma Payment.
   *
   * Payment is linked to Booking, and Booking owns leadId.
   */
  const leadId =
    normalizePrismaPaymentString(
      filter.leadId
    );

  if (
    leadId
  ) {
    where.booking = {
      is: {
        leadId,
      },
    };
  }

  return where;
}

/* ============================================================================
 * Prisma Payment sort mapping
 * ============================================================================
 */

export function buildPrismaPaymentOrderBy(
  sort?:
    PaymentRepositorySort
): Prisma.PaymentOrderByWithRelationInput {
  const resolvedSort =
    sort ??
    PRISMA_PAYMENT_DEFAULT_SORT;

  const direction =
    resolvedSort.direction ===
      PaymentSortDirection.ASC
      ? "asc"
      : "desc";

  switch (
    resolvedSort.field
  ) {
    case PaymentSortField.UPDATED_AT:
      return {
        updatedAt:
          direction,
      };

    case PaymentSortField.TOTAL_AMOUNT:
      return {
        totalAmount:
          direction,
      };

    case PaymentSortField.PAID_AMOUNT:
      return {
        paidAmount:
          direction,
      };

    case PaymentSortField.BALANCE_AMOUNT:
      return {
        balanceAmount:
          direction,
      };

    case PaymentSortField.STATUS:
      return {
        paymentStatus:
          direction,
      };

    case PaymentSortField.CREATED_AT:
    default:
      return {
        createdAt:
          direction,
      };
  }
}

/* ============================================================================
 * Find Payment by ID
 * ============================================================================
 */

export async function findPrismaPaymentById(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  Payment | null
> {
  const record =
    await findPrismaPaymentRecordById(
      prisma,
      paymentId
    );

  return record
    ? mapPrismaPaymentToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find Payment by number
 * ============================================================================
 */

export async function findPrismaPaymentByNumber(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentNumber:
    string
): Promise<
  Payment | null
> {
  const record =
    await findPrismaPaymentRecordByNumber(
      prisma,
      paymentNumber
    );

  return record
    ? mapPrismaPaymentToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find Payment by reference
 * ============================================================================
 */

export async function findPrismaPaymentByReferenceId(
  prisma:
    PrismaPaymentRepositoryClient,
  referenceId:
    string
): Promise<
  Payment | null
> {
  const record =
    await findPrismaPaymentRecordByReferenceId(
      prisma,
      referenceId
    );

  return record
    ? mapPrismaPaymentToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find Payment by Booking
 * ============================================================================
 */

/**
 * Repository contract currently returns one Payment for booking lookup.
 *
 * Because the database technically permits multiple Payment records for one
 * Booking, the most recently created Payment is returned.
 */
export async function findPrismaPaymentByBookingId(
  prisma:
    PrismaPaymentRepositoryClient,
  bookingId:
    string
): Promise<
  Payment | null
> {
  const normalizedBookingId =
    requirePrismaPaymentIdentifier(
      bookingId,
      "bookingId"
    );

  try {
    const record =
      await prisma
        .payment
        .findFirst({
          where: {
            bookingId:
              normalizedBookingId,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return record
      ? mapPrismaPaymentToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find Payment by Quotation
 * ============================================================================
 */

export async function findPrismaPaymentByQuotationId(
  prisma:
    PrismaPaymentRepositoryClient,
  quotationId:
    string
): Promise<
  Payment | null
> {
  const normalizedQuotationId =
    requirePrismaPaymentIdentifier(
      quotationId,
      "quotationId"
    );

  try {
    const record =
      await prisma
        .payment
        .findFirst({
          where: {
            quotationId:
              normalizedQuotationId,
          },

          orderBy: {
            createdAt:
              "desc",
          },

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return record
      ? mapPrismaPaymentToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Count Payments
 * ============================================================================
 */

export async function countPrismaPayments(
  prisma:
    PrismaPaymentRepositoryClient,
  filter?:
    PaymentRepositoryFilter
): Promise<
  number
> {
  try {
    return await prisma
      .payment
      .count({
        where:
          buildPrismaPaymentWhere(
            filter
          ),
      });
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Payment list
 * ============================================================================
 */

export async function listPrismaPayments(
  prisma:
    PrismaPaymentRepositoryClient,
  query?:
    PaymentRepositoryListQuery
): Promise<
  PaymentRepositoryPage<
    Payment
  >
> {
  const pagination =
    createPrismaPaymentPagination(
      query?.pagination
    );

  const where =
    buildPrismaPaymentWhere(
      query?.filter
    );

  const orderBy =
    buildPrismaPaymentOrderBy(
      query?.sort
    );

  try {
    const [
      records,
      totalItems,
    ] =
      await Promise.all([
        prisma.payment.findMany({
          where,

          orderBy,

          skip:
            pagination.skip,

          take:
            pagination.take,

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        }),

        prisma.payment.count({
          where,
        }),
      ]);

    return createPaymentRepositoryPage(
      mapPrismaPaymentsToDomain(
        records
      ),
      {
        page:
          pagination.page,

        pageSize:
          pagination.pageSize,
      },
      totalItems
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Payment search
 * ============================================================================
 */

/**
 * Service-facing Payment search using the canonical domain search contract.
 */
export async function searchPrismaPayments(
  prisma:
    PrismaPaymentRepositoryClient,
  criteria:
    PaymentSearchCriteria
): Promise<
  PaymentListResult
> {
  const query =
    mapPaymentSearchCriteriaToRepositoryQuery(
      criteria
    );

  const page =
    await listPrismaPayments(
      prisma,
      query
    );

  return {
    items:
      page.items.map(
        (
          payment
        ) =>
          mapPaymentToSummary(
            payment
          )
      ),

    pagination: {
      page:
        page.pagination
          .page,

      pageSize:
        page.pagination
          .pageSize,

      totalItems:
        page.pagination
          .totalItems,

      totalPages:
        page.pagination
          .totalPages,

      hasNextPage:
        page.pagination
          .hasNextPage,

      hasPreviousPage:
        page.pagination
          .hasPreviousPage,
    },
  };
}

/* ============================================================================
 * Search by raw repository query
 * ============================================================================
 */

export async function findManyPrismaPayments(
  prisma:
    PrismaPaymentRepositoryClient,
  query?:
    PaymentRepositoryListQuery
): Promise<
  Payment[]
> {
  const pagination =
    createPrismaPaymentPagination(
      query?.pagination
    );

  try {
    const records =
      await prisma
        .payment
        .findMany({
          where:
            buildPrismaPaymentWhere(
              query?.filter
            ),

          orderBy:
            buildPrismaPaymentOrderBy(
              query?.sort
            ),

          skip:
            pagination.skip,

          take:
            pagination.take,

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPrismaPaymentsToDomain(
      records
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Query facade
 * ============================================================================
 */

export const PrismaPaymentQueryRepository = {
  findById:
    findPrismaPaymentById,

  findByPaymentNumber:
    findPrismaPaymentByNumber,

  findByReferenceId:
    findPrismaPaymentByReferenceId,

  findByBookingId:
    findPrismaPaymentByBookingId,

  findByQuotationId:
    findPrismaPaymentByQuotationId,

  list:
    listPrismaPayments,

  search:
    searchPrismaPayments,

  findMany:
    findManyPrismaPayments,

  count:
    countPrismaPayments,

  buildWhere:
    buildPrismaPaymentWhere,

  buildOrderBy:
    buildPrismaPaymentOrderBy,
} as const;

/* ============================================================================
 * End of Prisma Payment Repository - Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Payment Repository
 * Part D
 * ============================================================================
 *
 * Normalized PaymentTransaction persistence:
 *
 * - Domain -> Prisma transaction mapping
 * - Create transaction
 * - Update transaction
 * - Find by transaction ID
 * - Find all transactions for Payment
 * - Find by gateway payment ID
 * - Find by gateway order ID
 * - Transaction filtering
 * - Transaction pagination
 * - Transaction list/search
 * - Transaction count
 *
 * IMPORTANT:
 * - Financial business rules remain in PaymentService
 * - Repository persists already-validated transactions
 * - Gateway idempotency is enforced through gatewayPaymentId uniqueness
 * ============================================================================
 */

/* ============================================================================
 * Domain transaction -> Prisma create mapping
 * ============================================================================
 */

export function mapPaymentTransactionToPrismaCreateData(
  transaction:
    PaymentTransaction
): Prisma.PaymentTransactionUncheckedCreateInput {
  const persistence =
    mapPaymentTransactionToPersistenceRecord(
      transaction
    );

  return {
    id:
      persistence.id,

    paymentId:
      persistence.paymentId,

    transactionType:
      transaction.transactionType,

    purpose:
      transaction.purpose ??
      null,

    amount:
      new Prisma.Decimal(
        persistence.amount
      ),

    currency:
      persistence.currency,

    status:
      transaction.status,

    method:
      transaction.method ??
      null,

    provider:
      transaction.provider,

    gatewayOrderId:
      transaction.gateway
        ?.gatewayOrderId ??
      null,

    gatewayPaymentId:
      transaction.gateway
        ?.gatewayPaymentId ??
      null,

    gatewayReferenceId:
      transaction.gateway
        ?.gatewayReferenceId ??
      null,

    bankReference:
      null,

    failureReason:
      transaction.failure
        ?.reason ??
      null,

    failureMessage:
      transaction.failure
        ?.message ??
      null,

    providerErrorCode:
      transaction.failure
        ?.providerCode ??
      null,

    initiatedAt:
      persistence.initiatedAt,

    authorizedAt:
      persistence.authorizedAt,

    capturedAt:
      persistence.capturedAt,

    completedAt:
      persistence.completedAt,

    failedAt:
      persistence.failedAt,

    remarks:
      persistence.remarks,

    recordedByType:
      transaction.recordedBy
        ?.actorType ??
      null,

    recordedById:
      transaction.recordedBy
        ?.actorId ??
      null,

    recordedByName:
      transaction.recordedBy
        ?.displayName ??
      null,

    metadata:
      Prisma.JsonNull,
  };
}

/* ============================================================================
 * Domain transaction -> Prisma update mapping
 * ============================================================================
 */

export function mapPaymentTransactionToPrismaUpdateData(
  transaction:
    PaymentTransaction
): Prisma.PaymentTransactionUncheckedUpdateInput {
  const persistence =
    mapPaymentTransactionToPersistenceRecord(
      transaction
    );

  return {
    transactionType:
      transaction.transactionType,

    purpose:
      transaction.purpose ??
      null,

    amount:
      new Prisma.Decimal(
        persistence.amount
      ),

    currency:
      persistence.currency,

    status:
      transaction.status,

    method:
      transaction.method ??
      null,

    provider:
      transaction.provider,

    gatewayOrderId:
      transaction.gateway
        ?.gatewayOrderId ??
      null,

    gatewayPaymentId:
      transaction.gateway
        ?.gatewayPaymentId ??
      null,

    gatewayReferenceId:
      transaction.gateway
        ?.gatewayReferenceId ??
      null,

    failureReason:
      transaction.failure
        ?.reason ??
      null,

    failureMessage:
      transaction.failure
        ?.message ??
      null,

    providerErrorCode:
      transaction.failure
        ?.providerCode ??
      null,

    authorizedAt:
      persistence.authorizedAt,

    capturedAt:
      persistence.capturedAt,

    completedAt:
      persistence.completedAt,

    failedAt:
      persistence.failedAt,

    remarks:
      persistence.remarks,

    recordedByType:
      transaction.recordedBy
        ?.actorType ??
      null,

    recordedById:
      transaction.recordedBy
        ?.actorId ??
      null,

    recordedByName:
      transaction.recordedBy
        ?.displayName ??
      null,
  };
}

/* ============================================================================
 * Create Payment transaction
 * ============================================================================
 */

export async function createPrismaPaymentTransaction(
  prisma:
    PrismaPaymentRepositoryClient,
  transaction:
    PaymentTransaction
): Promise<
  PaymentTransaction
> {
  requirePrismaPaymentIdentifier(
    transaction.transactionId,
    "transactionId"
  );

  requirePrismaPaymentIdentifier(
    transaction.paymentId,
    "paymentId"
  );

  try {
    const record =
      await prisma
        .paymentTransaction
        .create({
          data:
            mapPaymentTransactionToPrismaCreateData(
              transaction
            ),
        });

    return mapPrismaPaymentTransactionToDomain(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Update Payment transaction
 * ============================================================================
 */

export async function updatePrismaPaymentTransaction(
  prisma:
    PrismaPaymentRepositoryClient,
  transaction:
    PaymentTransaction
): Promise<
  PaymentTransaction
> {
  const transactionId =
    requirePrismaPaymentIdentifier(
      transaction.transactionId,
      "transactionId"
    );

  try {
    const record =
      await prisma
        .paymentTransaction
        .update({
          where: {
            id:
              transactionId,
          },

          data:
            mapPaymentTransactionToPrismaUpdateData(
              transaction
            ),
        });

    return mapPrismaPaymentTransactionToDomain(
      record
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2025"
    ) {
      throw new PaymentRepositoryError(
        "PAYMENT_TRANSACTION_NOT_FOUND",
        "Payment transaction not found.",
        {
          transactionId,
        }
      );
    }

    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Find transaction by ID
 * ============================================================================
 */

export async function findPrismaPaymentTransactionById(
  prisma:
    PrismaPaymentRepositoryClient,
  transactionId:
    string
): Promise<
  PaymentTransaction | null
> {
  const normalizedTransactionId =
    requirePrismaPaymentIdentifier(
      transactionId,
      "transactionId"
    );

  try {
    const record =
      await prisma
        .paymentTransaction
        .findUnique({
          where: {
            id:
              normalizedTransactionId,
          },
        });

    return record
      ? mapPrismaPaymentTransactionToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find transactions by Payment ID
 * ============================================================================
 */

export async function findPrismaPaymentTransactionsByPaymentId(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  PaymentTransaction[]
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    const records =
      await prisma
        .paymentTransaction
        .findMany({
          where: {
            paymentId:
              normalizedPaymentId,
          },

          orderBy: {
            initiatedAt:
              "asc",
          },
        });

    return mapPrismaPaymentTransactionsToDomain(
      records
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find transaction by gatewayPaymentId
 * ============================================================================
 */

export async function findPrismaPaymentTransactionByGatewayPaymentId(
  prisma:
    PrismaPaymentRepositoryClient,
  gatewayPaymentId:
    string
): Promise<
  PaymentTransaction | null
> {
  const normalizedGatewayPaymentId =
    requirePrismaPaymentIdentifier(
      gatewayPaymentId,
      "gatewayPaymentId"
    );

  try {
    const record =
      await prisma
        .paymentTransaction
        .findUnique({
          where: {
            gatewayPaymentId:
              normalizedGatewayPaymentId,
          },
        });

    return record
      ? mapPrismaPaymentTransactionToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find transactions by gatewayOrderId
 * ============================================================================
 */

export async function findPrismaPaymentTransactionsByGatewayOrderId(
  prisma:
    PrismaPaymentRepositoryClient,
  gatewayOrderId:
    string
): Promise<
  PaymentTransaction[]
> {
  const normalizedGatewayOrderId =
    requirePrismaPaymentIdentifier(
      gatewayOrderId,
      "gatewayOrderId"
    );

  try {
    const records =
      await prisma
        .paymentTransaction
        .findMany({
          where: {
            gatewayOrderId:
              normalizedGatewayOrderId,
          },

          orderBy: {
            initiatedAt:
              "asc",
          },
        });

    return mapPrismaPaymentTransactionsToDomain(
      records
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Transaction where mapping
 * ============================================================================
 */

export function buildPrismaPaymentTransactionWhere(
  filter?:
    PaymentTransactionRepositoryFilter
): Prisma.PaymentTransactionWhereInput {
  if (
    !filter
  ) {
    return {};
  }

  const where:
    Prisma.PaymentTransactionWhereInput = {};

  const paymentId =
    normalizePrismaPaymentString(
      filter.paymentId
    );

  if (
    paymentId
  ) {
    where.paymentId =
      paymentId;
  }

  const transactionId =
    normalizePrismaPaymentString(
      filter.transactionId
    );

  if (
    transactionId
  ) {
    where.id =
      transactionId;
  }

  if (
    filter.transactionType
  ) {
    where.transactionType =
      filter.transactionType;
  }

  if (
    filter.purpose
  ) {
    where.purpose =
      filter.purpose;
  }

  if (
    filter.status
  ) {
    where.status =
      filter.status;
  }

  if (
    filter.provider
  ) {
    where.provider =
      filter.provider;
  }

  const gatewayOrderId =
    normalizePrismaPaymentString(
      filter.gatewayOrderId
    );

  if (
    gatewayOrderId
  ) {
    where.gatewayOrderId =
      gatewayOrderId;
  }

  const gatewayPaymentId =
    normalizePrismaPaymentString(
      filter.gatewayPaymentId
    );

  if (
    gatewayPaymentId
  ) {
    where.gatewayPaymentId =
      gatewayPaymentId;
  }

  const amount:
    Prisma.DecimalFilter = {};

  if (
    typeof filter.minimumAmount ===
      "number" &&
    Number.isFinite(
      filter.minimumAmount
    )
  ) {
    amount.gte =
      new Prisma.Decimal(
        filter.minimumAmount
      );
  }

  if (
    typeof filter.maximumAmount ===
      "number" &&
    Number.isFinite(
      filter.maximumAmount
    )
  ) {
    amount.lte =
      new Prisma.Decimal(
        filter.maximumAmount
      );
  }

  if (
    Object.keys(
      amount
    ).length >
      0
  ) {
    where.amount =
      amount;
  }

  const initiatedAt:
    Prisma.DateTimeFilter = {};

  if (
    filter.initiatedFrom
  ) {
    const date =
      new Date(
        filter.initiatedFrom
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      initiatedAt.gte =
        date;
    }
  }

  if (
    filter.initiatedUntil
  ) {
    const date =
      new Date(
        filter.initiatedUntil
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      initiatedAt.lte =
        date;
    }
  }

  if (
    Object.keys(
      initiatedAt
    ).length >
      0
  ) {
    where.initiatedAt =
      initiatedAt;
  }

  return where;
}

/* ============================================================================
 * Count Payment transactions
 * ============================================================================
 */

export async function countPrismaPaymentTransactions(
  prisma:
    PrismaPaymentRepositoryClient,
  filter?:
    PaymentTransactionRepositoryFilter
): Promise<
  number
> {
  try {
    return await prisma
      .paymentTransaction
      .count({
        where:
          buildPrismaPaymentTransactionWhere(
            filter
          ),
      });
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * List Payment transactions
 * ============================================================================
 */

export async function listPrismaPaymentTransactions(
  prisma:
    PrismaPaymentRepositoryClient,
  query?:
    PaymentTransactionRepositoryListQuery
): Promise<
  PaymentRepositoryPage<
    PaymentTransaction
  >
> {
  const pagination =
    createPrismaPaymentPagination(
      query?.pagination
    );

  const where =
    buildPrismaPaymentTransactionWhere(
      query?.filter
    );

  try {
    const [
      records,
      totalItems,
    ] =
      await Promise.all([
        prisma
          .paymentTransaction
          .findMany({
            where,

            orderBy: {
              initiatedAt:
                "desc",
            },

            skip:
              pagination.skip,

            take:
              pagination.take,
          }),

        prisma
          .paymentTransaction
          .count({
            where,
          }),
      ]);

    return createPaymentRepositoryPage(
      mapPrismaPaymentTransactionsToDomain(
        records
      ),
      {
        page:
          pagination.page,

        pageSize:
          pagination.pageSize,
      },
      totalItems
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Search Payment transactions
 * ============================================================================
 */

export async function searchPrismaPaymentTransactions(
  prisma:
    PrismaPaymentRepositoryClient,
  criteria:
    PaymentTransactionSearchCriteria
): Promise<
  PaymentTransactionListResult
> {
  const query =
    mapPaymentTransactionSearchCriteriaToRepositoryQuery(
      criteria
    );

  const page =
    await listPrismaPaymentTransactions(
      prisma,
      query
    );

  return {
    items:
      page.items,

    pagination: {
      page:
        page.pagination
          .page,

      pageSize:
        page.pagination
          .pageSize,

      totalItems:
        page.pagination
          .totalItems,

      totalPages:
        page.pagination
          .totalPages,

      hasNextPage:
        page.pagination
          .hasNextPage,

      hasPreviousPage:
        page.pagination
          .hasPreviousPage,
    },
  };
}

/* ============================================================================
 * Require transaction after persistence
 * ============================================================================
 */

export async function requirePrismaPaymentTransaction(
  prisma:
    PrismaPaymentRepositoryClient,
  transactionId:
    string
): Promise<
  PaymentTransaction
> {
  const transaction =
    await findPrismaPaymentTransactionById(
      prisma,
      transactionId
    );

  if (
    !transaction
  ) {
    throw new PaymentRepositoryError(
      "PAYMENT_TRANSACTION_NOT_FOUND",
      "Payment transaction was not found.",
      {
        transactionId,
      }
    );
  }

  return transaction;
}

/* ============================================================================
 * Transaction existence
 * ============================================================================
 */

export async function prismaPaymentTransactionExists(
  prisma:
    PrismaPaymentRepositoryClient,
  transactionId:
    string
): Promise<
  boolean
> {
  const normalizedTransactionId =
    requirePrismaPaymentIdentifier(
      transactionId,
      "transactionId"
    );

  try {
    const count =
      await prisma
        .paymentTransaction
        .count({
          where: {
            id:
              normalizedTransactionId,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Transaction repository facade
 * ============================================================================
 */

export const PrismaPaymentTransactionRepository = {
  create:
    createPrismaPaymentTransaction,

  update:
    updatePrismaPaymentTransaction,

  findById:
    findPrismaPaymentTransactionById,

  findByPaymentId:
    findPrismaPaymentTransactionsByPaymentId,

  findByGatewayPaymentId:
    findPrismaPaymentTransactionByGatewayPaymentId,

  findByGatewayOrderId:
    findPrismaPaymentTransactionsByGatewayOrderId,

  list:
    listPrismaPaymentTransactions,

  search:
    searchPrismaPaymentTransactions,

  count:
    countPrismaPaymentTransactions,

  exists:
    prismaPaymentTransactionExists,

  require:
    requirePrismaPaymentTransaction,

  buildWhere:
    buildPrismaPaymentTransactionWhere,
} as const;

/* ============================================================================
 * End of Prisma Payment Repository - Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Payment Repository
 * Part E
 * ============================================================================
 *
 * Final persistence operations:
 *
 * - Gateway orders
 * - Webhook idempotency
 * - Reconciliation + history
 * - Statistics
 * - Bulk operations
 * - Health check
 * - Prisma transaction manager
 * - Final repository class
 * - Repository factory/module
 * ============================================================================
 */

/* ============================================================================
 * Repository record date helper
 * ============================================================================
 */

function prismaPaymentDateToIso(
  value:
    Date
): string {
  return value
    .toISOString();
}

/* ============================================================================
 * Gateway-order record mapping
 * ============================================================================
 */

export function mapPrismaGatewayOrderToRepositoryRecord(
  record:
    PrismaPaymentGatewayOrderRecord
): PaymentGatewayOrderRepositoryRecord {
  return {
    paymentId:
      record.paymentId,

   provider:
  mapPaymentProvider(
    record.provider
  ),

    gatewayOrderId:
      record.gatewayOrderId,

    amount:
      prismaPaymentDecimalToNumber(
        record.amount
      ),

    currency:
      record.currency as
        PaymentGatewayOrderRepositoryRecord[
          "currency"
        ],

    status:
      record.status,

    ...(record.receiptReference
      ? {
          receiptReference:
            record.receiptReference,
        }
      : {}),

    ...(prismaPaymentJsonObject(
      record.metadata
    )
      ? {
          metadata:
            prismaPaymentJsonObject(
              record.metadata
            ),
        }
      : {}),

    createdAt:
      prismaPaymentDateToIso(
        record.createdAt
      ),

    updatedAt:
      prismaPaymentDateToIso(
        record.updatedAt
      ),
  };
}

/* ============================================================================
 * Create gateway order
 * ============================================================================
 */

export async function createPrismaPaymentGatewayOrder(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    CreatePaymentGatewayOrderRepositoryInput
): Promise<
  PaymentGatewayOrderRepositoryRecord
> {
  const {
    order,
  } =
    input;

  requirePrismaPaymentIdentifier(
    order.paymentId,
    "paymentId"
  );

  requirePrismaPaymentIdentifier(
    order.gatewayOrderId,
    "gatewayOrderId"
  );

  try {
    const record =
      await prisma
        .paymentGatewayOrder
        .create({
          data: {
            paymentId:
              order.paymentId,

            provider:
              order.provider,

            gatewayOrderId:
              order.gatewayOrderId,

            amount:
              new Prisma.Decimal(
                order.amount
              ),

            currency:
              order.currency,

            status:
              order.status,

            receiptReference:
              order.receiptReference ??
              null,

            metadata:
              order.metadata
                ? mapPaymentJsonToPrisma(
                    order.metadata
                  )
                : Prisma.JsonNull,

            createdAt:
              new Date(
                order.createdAt
              ),

            updatedAt:
              new Date(
                order.updatedAt
              ),
          },
        });

    return mapPrismaGatewayOrderToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Update gateway order
 * ============================================================================
 */

export async function updatePrismaPaymentGatewayOrder(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    UpdatePaymentGatewayOrderRepositoryInput
): Promise<
  PaymentGatewayOrderRepositoryRecord
> {
  const gatewayOrderId =
    requirePrismaPaymentIdentifier(
      input.gatewayOrderId,
      "gatewayOrderId"
    );

  try {
    const record =
      await prisma
        .paymentGatewayOrder
        .update({
          where: {
            gatewayOrderId,
          },

          data: {
            ...(input.status
              ? {
                  status:
                    input.status,
                }
              : {}),

            ...(input.metadata
              ? {
                  metadata:
                    mapPaymentJsonToPrisma(
                      input.metadata
                    ),
                }
              : {}),

            ...(input.updatedAt
              ? {
                  updatedAt:
                    new Date(
                      input.updatedAt
                    ),
                }
              : {}),
          },
        });

    return mapPrismaGatewayOrderToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Find gateway order by provider order ID
 * ============================================================================
 */

export async function findPrismaPaymentGatewayOrderById(
  prisma:
    PrismaPaymentRepositoryClient,
  gatewayOrderId:
    string
): Promise<
  PaymentGatewayOrderRepositoryRecord |
  null
> {
  const normalized =
    requirePrismaPaymentIdentifier(
      gatewayOrderId,
      "gatewayOrderId"
    );

  try {
    const record =
      await prisma
        .paymentGatewayOrder
        .findUnique({
          where: {
            gatewayOrderId:
              normalized,
          },
        });

    return record
      ? mapPrismaGatewayOrderToRepositoryRecord(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Gateway orders by Payment
 * ============================================================================
 */

export async function findPrismaPaymentGatewayOrdersByPaymentId(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  PaymentGatewayOrderRepositoryRecord[]
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    const records =
      await prisma
        .paymentGatewayOrder
        .findMany({
          where: {
            paymentId:
              normalizedPaymentId,
          },

          orderBy: {
            createdAt:
              "asc",
          },
        });

    return records.map(
      (
        record
      ) =>
        mapPrismaGatewayOrderToRepositoryRecord(
          record
        )
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Webhook record mapping
 * ============================================================================
 */

export function mapPrismaWebhookToRepositoryRecord(
  record:
    PrismaPaymentWebhookRecord
): PaymentWebhookRepositoryRecord {
  return {
    webhookId:
      record.webhookId,

    provider:
  mapPaymentProvider(
    record.provider
  ),

    eventType:
      record.eventType,

    ...(record.gatewayOrderId
      ? {
          gatewayOrderId:
            record.gatewayOrderId,
        }
      : {}),

    ...(record.gatewayPaymentId
      ? {
          gatewayPaymentId:
            record.gatewayPaymentId,
        }
      : {}),

    ...(record.providerEventId
      ? {
          providerEventId:
            record.providerEventId,
        }
      : {}),

    ...(record.payloadHash
      ? {
          payloadHash:
            record.payloadHash,
        }
      : {}),

    processed:
      record.processed,

    duplicate:
      record.duplicate,

    receivedAt:
      record.receivedAt
        .toISOString(),

    ...(record.processedAt
      ? {
          processedAt:
            record.processedAt
              .toISOString(),
        }
      : {}),

    ...(record.paymentId
      ? {
          paymentId:
            record.paymentId,
        }
      : {}),

    ...(record.transactionId
      ? {
          transactionId:
            record.transactionId,
        }
      : {}),

    ...(record.errorCode
      ? {
          errorCode:
            record.errorCode,
        }
      : {}),

    ...(record.errorMessage
      ? {
          errorMessage:
            record.errorMessage,
        }
      : {}),
  };
}

/* ============================================================================
 * Create webhook record
 * ============================================================================
 */

export async function createPrismaPaymentWebhookRecord(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    CreatePaymentWebhookRepositoryInput
): Promise<
  PaymentWebhookRepositoryRecord
> {
  const webhook =
    input.webhook;

  requirePrismaPaymentIdentifier(
    webhook.webhookId,
    "webhookId"
  );

  try {
    const record =
      await prisma
        .paymentWebhook
        .create({
          data: {
            webhookId:
              webhook.webhookId,

            provider:
              webhook.provider,

            eventType:
              webhook.eventType,

            providerEventId:
              webhook.providerEventId ??
              null,

            payloadHash:
              webhook.payloadHash ??
              null,

            gatewayOrderId:
              webhook.gatewayOrderId ??
              null,

            gatewayPaymentId:
              webhook.gatewayPaymentId ??
              null,

            processed:
              webhook.processed,

            duplicate:
              webhook.duplicate,

            receivedAt:
              new Date(
                webhook.receivedAt
              ),

            processedAt:
              webhook.processedAt
                ? new Date(
                    webhook.processedAt
                  )
                : null,

            paymentId:
              webhook.paymentId ??
              null,

            transactionId:
              webhook.transactionId ??
              null,

            errorCode:
              webhook.errorCode ??
              null,

            errorMessage:
              webhook.errorMessage ??
              null,
          },
        });

    return mapPrismaWebhookToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Find webhook by internal webhook ID
 * ============================================================================
 */

export async function findPrismaPaymentWebhookById(
  prisma:
    PrismaPaymentRepositoryClient,
  webhookId:
    string
): Promise<
  PaymentWebhookRepositoryRecord |
  null
> {
  const normalized =
    requirePrismaPaymentIdentifier(
      webhookId,
      "webhookId"
    );

  try {
    const record =
      await prisma
        .paymentWebhook
        .findUnique({
          where: {
            webhookId:
              normalized,
          },
        });

    return record
      ? mapPrismaWebhookToRepositoryRecord(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find webhook by provider event
 * ============================================================================
 */

export async function findPrismaPaymentWebhookByProviderEventId(
  prisma:
    PrismaPaymentRepositoryClient,
  provider:
    PaymentProvider,
  providerEventId:
    string
): Promise<
  PaymentWebhookRepositoryRecord |
  null
> {
  const normalized =
    requirePrismaPaymentIdentifier(
      providerEventId,
      "providerEventId"
    );

  try {
    const record =
      await prisma
        .paymentWebhook
        .findFirst({
          where: {
            provider,

            providerEventId:
              normalized,
          },
        });

    return record
      ? mapPrismaWebhookToRepositoryRecord(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Webhook event existence
 * ============================================================================
 */

export async function prismaPaymentWebhookProviderEventExists(
  prisma:
    PrismaPaymentRepositoryClient,
  provider:
    PaymentProvider,
  providerEventId:
    string
): Promise<
  boolean
> {
  const normalized =
    requirePrismaPaymentIdentifier(
      providerEventId,
      "providerEventId"
    );

  try {
    const count =
      await prisma
        .paymentWebhook
        .count({
          where: {
            provider,

            providerEventId:
              normalized,
          },
        });

    return count >
      0;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Mark webhook processed
 * ============================================================================
 */

export async function markPrismaPaymentWebhookProcessed(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    MarkPaymentWebhookProcessedRepositoryInput
): Promise<
  PaymentWebhookRepositoryRecord
> {
  const webhookId =
    requirePrismaPaymentIdentifier(
      input.webhookId,
      "webhookId"
    );

  try {
    const record =
      await prisma
        .paymentWebhook
        .update({
          where: {
            webhookId,
          },

          data: {
            processed:
              true,

            duplicate:
              false,

            processedAt:
              new Date(
                input.processedAt
              ),

            paymentId:
              input.paymentId ??
              undefined,

            transactionId:
              input.transactionId ??
              undefined,

            errorCode:
              null,

            errorMessage:
              null,
          },
        });

    return mapPrismaWebhookToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Mark webhook failed
 * ============================================================================
 */

export async function markPrismaPaymentWebhookFailed(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    MarkPaymentWebhookFailedRepositoryInput
): Promise<
  PaymentWebhookRepositoryRecord
> {
  const webhookId =
    requirePrismaPaymentIdentifier(
      input.webhookId,
      "webhookId"
    );

  try {
    const record =
      await prisma
        .paymentWebhook
        .update({
          where: {
            webhookId,
          },

          data: {
            processed:
              false,

            processedAt:
              new Date(
                input.processedAt
              ),

            errorCode:
              input.errorCode ??
              null,

            errorMessage:
              input.errorMessage ??
              null,
          },
        });

    return mapPrismaWebhookToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Reconciliation identity helper
 * ============================================================================
 */

export function createPrismaPaymentReconciliationId():
  string {
  return [
    "EMR",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(
        2,
        10
      )
      .toUpperCase(),
  ].join(
    "-"
  );
}

/* ============================================================================
 * Persist reconciliation
 * ============================================================================
 */

export async function savePrismaPaymentReconciliation(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    SavePaymentReconciliationRepositoryInput
): Promise<
  SavePaymentReconciliationRepositoryInput[
    "result"
  ]
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const provider =
    (
      input.observed as
        typeof input.observed & {
          provider?:
            PaymentProvider;
        }
    ).provider ??
    PaymentProvider.OTHER;

  try {
    await prisma
      .paymentReconciliation
      .create({
        data: {
          reconciliationId:
            createPrismaPaymentReconciliationId(),

          paymentId,

          provider,

          expectedTotalAmount:
  new Prisma.Decimal(
    input.result
      .expected
      .totalAmount
  ),

expectedCollectedAmount:
  new Prisma.Decimal(
    input.result
      .expected
      .paidAmount
  ),

expectedRefundedAmount:
  new Prisma.Decimal(
    input.result
      .expected
      .refundedAmount
  ),

expectedBalanceAmount:
  new Prisma.Decimal(
    input.result
      .expected
      .balanceAmount
  ),

observedCollectedAmount:
  new Prisma.Decimal(
    input.result
      .observed
      .collectedAmount
  ),

observedRefundedAmount:
  new Prisma.Decimal(
    input.result
      .observed
      .refundedAmount
  ),

          currency:
            input.result
              .expected
              .currency,

          reconciled:
            input.result
              .reconciled,

          differences:
            mapPaymentJsonToPrisma(
              input.result
                .differences
            ),

          providerReference:
            input.observed
              .providerReference ??
            null,

          observedAt:
            new Date(
              input.observed
                .observedAt
            ),

          reconciledAt:
            new Date(
              input.result
                .reconciledAt
            ),

          reconciledBy:
            input.result
              .reconciledBy ??
            null,
        },
      });

    return input.result;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "RECONCILIATION_FAILED"
    );
  }
}

/* ============================================================================
 * Prisma reconciliation -> domain result
 * ============================================================================
 */

export function mapPrismaReconciliationToDomain(
  record:
    PrismaPaymentReconciliationRecord
): SavePaymentReconciliationRepositoryInput[
  "result"
] {
  const differences =
    Array.isArray(
      record.differences
    )
      ? record.differences
          .filter(
            (
              item
            ): item is Prisma.JsonObject =>
              typeof item ===
                "object" &&
              item !==
                null &&
              !Array.isArray(
                item
              )
          )
          .map(
            (
              item
            ) => ({
              field:
                String(
                  item.field ??
                    ""
                ),

              expected:
                Number(
                  item.expected ??
                    0
                ),

              observed:
                Number(
                  item.observed ??
                    0
                ),

              difference:
                Number(
                  item.difference ??
                    0
                ),
            })
          )
      : [];

  return {
    paymentId:
      record.paymentId,

    reconciled:
      record.reconciled,

    expected: {
      paymentId:
        record.paymentId,

      totalAmount:
        record.expectedTotalAmount !==
        null
          ? prismaPaymentDecimalToNumber(
              record.expectedTotalAmount
            )
          : prismaPaymentDecimalToNumber(
              record.expectedCollectedAmount
            ),

      paidAmount:
        prismaPaymentDecimalToNumber(
          record.expectedCollectedAmount
        ),

      refundedAmount:
        prismaPaymentDecimalToNumber(
          record.expectedRefundedAmount
        ),

      balanceAmount:
        record.expectedBalanceAmount !==
        null
          ? prismaPaymentDecimalToNumber(
              record.expectedBalanceAmount
            )
          : 0,

      currency:
        record.currency as
          SavePaymentReconciliationRepositoryInput[
            "result"
          ]["expected"]["currency"],
    },

    observed: {
      provider:
        mapPaymentProvider(
          record.provider
        ),

      collectedAmount:
        prismaPaymentDecimalToNumber(
          record.observedCollectedAmount
        ),

      refundedAmount:
        prismaPaymentDecimalToNumber(
          record.observedRefundedAmount
        ),

      currency:
        record.currency as
          SavePaymentReconciliationRepositoryInput[
            "result"
          ]["observed"]["currency"],

      ...(record.providerReference
        ? {
            providerReference:
              record.providerReference,
          }
        : {}),

      observedAt:
        record.observedAt
          .toISOString(),
    },

    differences,

    reconciledAt:
      record.reconciledAt
        .toISOString(),

    ...(record.reconciledBy
      ? {
          reconciledBy:
            record.reconciledBy,
        }
      : {}),
  };
}

/* ============================================================================
 * Latest reconciliation
 * ============================================================================
 */

export async function getLatestPrismaPaymentReconciliation(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  SavePaymentReconciliationRepositoryInput[
    "result"
  ] |
  null
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    const record =
      await prisma
        .paymentReconciliation
        .findFirst({
          where: {
            paymentId:
              normalizedPaymentId,
          },

          orderBy: {
            reconciledAt:
              "desc",
          },
        });

    return record
      ? mapPrismaReconciliationToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "RECONCILIATION_FAILED"
    );
  }
}

/* ============================================================================
 * Reconciliation history
 * ============================================================================
 */

export async function listPrismaPaymentReconciliations(
  prisma:
    PrismaPaymentRepositoryClient,
  query:
    PaymentReconciliationHistoryQuery
): Promise<
  PaymentReconciliationHistoryResult
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      query.paymentId,
      "paymentId"
    );

  const pagination =
    createPrismaPaymentPagination({
      page:
        query.page ??
        PRISMA_PAYMENT_DEFAULT_PAGE,

      pageSize:
        query.pageSize ??
        PRISMA_PAYMENT_DEFAULT_PAGE_SIZE,
    });

  try {
    const [
      records,
      totalItems,
    ] =
      await Promise.all([
        prisma
          .paymentReconciliation
          .findMany({
            where: {
              paymentId,
            },

            orderBy: {
              reconciledAt:
                "desc",
            },

            skip:
              pagination.skip,

            take:
              pagination.take,
          }),

        prisma
          .paymentReconciliation
          .count({
            where: {
              paymentId,
            },
          }),
      ]);

    return {
      items:
        records.map(
          (
            record
          ) => ({
            reconciliationId:
              record.reconciliationId,

            paymentId:
              record.paymentId,

            provider:
  mapPaymentProvider(
    record.provider
  ),

            expectedCollectedAmount:
              prismaPaymentDecimalToNumber(
                record.expectedCollectedAmount
              ),

            observedCollectedAmount:
              prismaPaymentDecimalToNumber(
                record.observedCollectedAmount
              ),

            expectedRefundedAmount:
              prismaPaymentDecimalToNumber(
                record.expectedRefundedAmount
              ),

            observedRefundedAmount:
              prismaPaymentDecimalToNumber(
                record.observedRefundedAmount
              ),

            currency:
              record.currency as
                PaymentReconciliationHistoryResult[
                  "items"
                ][number]["currency"],

            reconciled:
              record.reconciled,

            differences:
              Array.isArray(
                record.differences
              )
                ? (
                    record.differences as unknown as
                      PaymentReconciliationHistoryResult[
                        "items"
                      ][number]["differences"]
                  )
                : [],

            ...(record.providerReference
              ? {
                  providerReference:
                    record.providerReference,
                }
              : {}),

            observedAt:
              record.observedAt
                .toISOString(),

            reconciledAt:
              record.reconciledAt
                .toISOString(),

            ...(record.reconciledBy
              ? {
                  reconciledBy:
                    record.reconciledBy,
                }
              : {}),
          })
        ),

      pagination:
        createPaymentRepositoryPage(
          [],
          {
            page:
              pagination.page,

            pageSize:
              pagination.pageSize,
          },
          totalItems
        ).pagination,
    };
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "RECONCILIATION_FAILED"
    );
  }
}

/* ============================================================================
 * Payment statistics
 * ============================================================================
 */

export async function getPrismaPaymentStatistics(
  prisma:
    PrismaPaymentRepositoryClient,
  criteria?:
    PaymentSearchCriteria
) {
  try {
    const query =
      criteria
        ? mapPaymentSearchCriteriaToRepositoryQuery(
            criteria
          )
        : undefined;

    const records =
      await prisma
        .payment
        .findMany({
          where:
            buildPrismaPaymentWhere(
              query?.filter
            ),

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    return mapPaymentsToStatistics(
      mapPrismaPaymentsToDomain(
        records
      )
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "STATISTICS_FAILED"
    );
  }
}

/* ============================================================================
 * Transaction statistics
 * ============================================================================
 */

export async function getPrismaPaymentTransactionStatistics(
  prisma:
    PrismaPaymentRepositoryClient,
  criteria?:
    PaymentTransactionSearchCriteria
) {
  try {
    const query =
      criteria
        ? mapPaymentTransactionSearchCriteriaToRepositoryQuery(
            criteria
          )
        : undefined;

    const records =
      await prisma
        .paymentTransaction
        .findMany({
          where:
            buildPrismaPaymentTransactionWhere(
              query?.filter
            ),
        });

    return mapPaymentTransactionsToStatistics(
      mapPrismaPaymentTransactionsToDomain(
        records
      )
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "STATISTICS_FAILED"
    );
  }
}

/* ============================================================================
 * Bulk Payment lookup
 * ============================================================================
 */

export async function findManyPrismaPaymentsByIds(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    PaymentRepositoryBulkLookupInput
): Promise<
  PaymentRepositoryBulkLookupResult
> {
  const paymentIds =
    normalizePaymentRepositoryIds(
      input.paymentIds
    );

  if (
    paymentIds.length ===
      0
  ) {
    return {
      payments:
        [],

      missingPaymentIds:
        [],
    };
  }

  try {
    const records =
      await prisma
        .payment
        .findMany({
          where: {
            id: {
              in:
                paymentIds,
            },
          },

          include:
            PAYMENT_REPOSITORY_INCLUDE,
        });

    const payments =
      mapPrismaPaymentsToDomain(
        records
      );

    const foundIds =
      new Set(
        payments.map(
          (
            payment
          ) =>
            payment.paymentId
        )
      );

    return {
      payments,

      missingPaymentIds:
        paymentIds.filter(
          (
            paymentId
          ) =>
            !foundIds.has(
              paymentId
            )
        ),
    };
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Bulk Payment status update
 * ============================================================================
 */

export async function updateManyPrismaPaymentStatuses(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    PaymentRepositoryBulkStatusUpdateInput
): Promise<
  PaymentRepositoryBulkStatusUpdateResult
> {
  const updated:
    Payment[] =
      [];

  const failedPaymentIds:
    string[] =
      [];

  for (
    const item
    of input.items
  ) {
    try {
      const payment =
        await updatePrismaPaymentStatus(
          prisma,
          {
            paymentId:
              item.paymentId,

            status:
              item.status,

            updatedBy:
              item.updatedBy,
          }
        );

      updated.push(
        payment
      );
    } catch {
      failedPaymentIds.push(
        item.paymentId
      );
    }
  }

  return {
    updated,

    failedPaymentIds,
  };
}

/* ============================================================================
 * Payment -> Booking synchronization persistence
 * ============================================================================
 */

function mapPaymentBookingSyncSnapshotToPrisma(
  snapshot:
    PaymentBookingSyncFinancialSnapshot
): Prisma.InputJsonValue {
  return {
    totalAmount:
      snapshot.totalAmount,

    paidAmount:
      snapshot.paidAmount,

    balanceAmount:
      snapshot.balanceAmount,

    paymentPending:
      snapshot.paymentPending,

    refundedAmount:
      snapshot.refundedAmount,

    refundPendingAmount:
      snapshot.refundPendingAmount,

    currency:
      snapshot.currency,
  };
}

/* ============================================================================
 * Find synchronization state by Payment
 * ============================================================================
 */

export async function findPrismaPaymentBookingSyncByPaymentId(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string
): Promise<
  PaymentBookingSyncRepositoryRecord | null
> {
  const normalizedPaymentId =
    requirePrismaPaymentIdentifier(
      paymentId,
      "paymentId"
    );

  try {
    const record =
      await prisma
        .paymentBookingSync
        .findUnique({
          where: {
            paymentId:
              normalizedPaymentId,
          },
        });

    return record
      ? mapPrismaPaymentBookingSyncToRepositoryRecord(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_READ_FAILED"
    );
  }
}

/* ============================================================================
 * Create or refresh pending synchronization state
 * ============================================================================
 */

export async function upsertPendingPrismaPaymentBookingSync(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    UpsertPendingPaymentBookingSyncRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const bookingId =
    requirePrismaPaymentIdentifier(
      input.bookingId,
      "bookingId"
    );

  const requestedBy =
    requirePrismaPaymentIdentifier(
      input.requestedBy,
      "requestedBy"
    );

  const paymentUpdatedAt =
    new Date(
      input.paymentUpdatedAt
    );

  if (
    Number.isNaN(
      paymentUpdatedAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "paymentUpdatedAt must be a valid ISO timestamp.",
      {
        field:
          "paymentUpdatedAt",

        value:
          input.paymentUpdatedAt,

        paymentId,
      }
    );
  }

  const paymentSnapshotJson =
    mapPaymentBookingSyncSnapshotToPrisma(
      input.paymentSnapshot
    );

  try {
    const existing =
      await prisma
        .paymentBookingSync
        .findUnique({
          where: {
            paymentId,
          },

          select: {
            paymentUpdatedAt:
              true,
          },
        });

    /**
     * Never allow an older Payment projection to replace a newer pending or
     * synchronized projection.
     */
    if (
      existing &&
      existing.paymentUpdatedAt
        .getTime() >
        paymentUpdatedAt
          .getTime()
    ) {
      const current =
        await prisma
          .paymentBookingSync
          .findUnique({
            where: {
              paymentId,
            },
          });

      if (
        !current
      ) {
        throw new PaymentRepositoryError(
          "REPOSITORY_READ_FAILED",
          "Payment Booking synchronization record disappeared during version validation.",
          {
            paymentId,
          }
        );
      }

      return mapPrismaPaymentBookingSyncToRepositoryRecord(
        current
      );
    }

    const record =
      await prisma
        .paymentBookingSync
        .upsert({
          where: {
            paymentId,
          },

          create: {
            paymentId,

            bookingId,

            status:
              "PENDING",

            paymentUpdatedAt,

            paymentSnapshotJson,

            attemptCount:
              0,

            requestedBy,
          },

          update: {
            bookingId,

            status:
              "PENDING",

            paymentUpdatedAt,

            paymentSnapshotJson,

            /**
             * A new authoritative projection starts a fresh synchronization
             * attempt lifecycle.
             */
            bookingSnapshotJson:
              Prisma.JsonNull,

            attemptCount:
              0,

            lastAttemptAt:
              null,

            nextRetryAt:
              null,

            synchronizedAt:
              null,

            lastErrorCode:
              null,

            lastErrorMessage:
              null,

            requestedBy,
          },
        });

    return mapPrismaPaymentBookingSyncToRepositoryRecord(
      record
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Payment -> Booking synchronization guarded update helper
 * ============================================================================
 */

async function findGuardedPrismaPaymentBookingSync(
  prisma:
    PrismaPaymentRepositoryClient,
  paymentId:
    string,
  paymentUpdatedAt:
    Date
): Promise<
  PaymentBookingSyncRepositoryRecord | null
> {
  const record =
    await prisma
      .paymentBookingSync
      .findFirst({
        where: {
          paymentId,

          paymentUpdatedAt,
        },
      });

  return record
    ? mapPrismaPaymentBookingSyncToRepositoryRecord(
        record
      )
    : null;
}

/* ============================================================================
 * Mark synchronization successful
 * ============================================================================
 */

export async function markPrismaPaymentBookingSyncSynchronized(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    MarkPaymentBookingSyncSynchronizedRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord | null
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const paymentUpdatedAt =
    new Date(
      input.paymentUpdatedAt
    );

  const attemptedAt =
    new Date(
      input.attemptedAt
    );

  const synchronizedAt =
    new Date(
      input.synchronizedAt
    );

  if (
    Number.isNaN(
      paymentUpdatedAt.getTime()
    ) ||
    Number.isNaN(
      attemptedAt.getTime()
    ) ||
    Number.isNaN(
      synchronizedAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Synchronization timestamps must be valid ISO timestamps.",
      {
        paymentId,
      }
    );
  }

  try {
    const result =
      await prisma
        .paymentBookingSync
        .updateMany({
          where: {
            paymentId,

            paymentUpdatedAt,
          },

          data: {
            status:
              "SYNCHRONIZED",

            bookingSnapshotJson:
              mapPaymentBookingSyncSnapshotToPrisma(
                input.bookingSnapshot
              ),

            attemptCount: {
              increment:
                1,
            },

            lastAttemptAt:
              attemptedAt,

            nextRetryAt:
              null,

            synchronizedAt,

            lastErrorCode:
              null,

            lastErrorMessage:
              null,
          },
        });

    if (
      result.count ===
        0
    ) {
      return null;
    }

    return findGuardedPrismaPaymentBookingSync(
      prisma,
      paymentId,
      paymentUpdatedAt
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Mark synchronization retry pending
 * ============================================================================
 */

export async function markPrismaPaymentBookingSyncRetryPending(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    MarkPaymentBookingSyncRetryPendingRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord | null
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const errorCode =
    requirePrismaPaymentIdentifier(
      input.errorCode,
      "errorCode"
    );

  const errorMessage =
    requirePrismaPaymentIdentifier(
      input.errorMessage,
      "errorMessage"
    );

  const paymentUpdatedAt =
    new Date(
      input.paymentUpdatedAt
    );

  const attemptedAt =
    new Date(
      input.attemptedAt
    );

  const nextRetryAt =
    new Date(
      input.nextRetryAt
    );

  if (
    Number.isNaN(
      paymentUpdatedAt.getTime()
    ) ||
    Number.isNaN(
      attemptedAt.getTime()
    ) ||
    Number.isNaN(
      nextRetryAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Retry timestamps must be valid ISO timestamps.",
      {
        paymentId,
      }
    );
  }

  try {
    const result =
      await prisma
        .paymentBookingSync
        .updateMany({
          where: {
            paymentId,

            paymentUpdatedAt,

            /**
             * A delayed failed attempt must never move an already
             * synchronized or terminally failed record backwards.
             */
            status: {
              in: [
                "PENDING",
                "RETRY_PENDING",
              ],
            },
          },

          data: {
            status:
              "RETRY_PENDING",

            ...(input.bookingSnapshot
              ? {
                  bookingSnapshotJson:
                    mapPaymentBookingSyncSnapshotToPrisma(
                      input.bookingSnapshot
                    ),
                }
              : {}),

            attemptCount: {
              increment:
                1,
            },

            lastAttemptAt:
              attemptedAt,

            nextRetryAt,

            synchronizedAt:
              null,

            lastErrorCode:
              errorCode,

            lastErrorMessage:
              errorMessage,
          },
        });

    if (
      result.count ===
        0
    ) {
      return null;
    }

    return findGuardedPrismaPaymentBookingSync(
      prisma,
      paymentId,
      paymentUpdatedAt
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Mark synchronization permanently failed
 * ============================================================================
 */

export async function markPrismaPaymentBookingSyncFailed(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    MarkPaymentBookingSyncFailedRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord | null
> {
  const paymentId =
    requirePrismaPaymentIdentifier(
      input.paymentId,
      "paymentId"
    );

  const errorCode =
    requirePrismaPaymentIdentifier(
      input.errorCode,
      "errorCode"
    );

  const errorMessage =
    requirePrismaPaymentIdentifier(
      input.errorMessage,
      "errorMessage"
    );

  const paymentUpdatedAt =
    new Date(
      input.paymentUpdatedAt
    );

  const attemptedAt =
    new Date(
      input.attemptedAt
    );

  if (
    Number.isNaN(
      paymentUpdatedAt.getTime()
    ) ||
    Number.isNaN(
      attemptedAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Failure timestamps must be valid ISO timestamps.",
      {
        paymentId,
      }
    );
  }

  try {
    const result =
      await prisma
        .paymentBookingSync
        .updateMany({
          where: {
            paymentId,

            paymentUpdatedAt,

            /**
             * Terminal failure is allowed only while the record is still
             * pending or retryable. A delayed failure cannot overwrite a
             * successful synchronization.
             */
            status: {
              in: [
                "PENDING",
                "RETRY_PENDING",
              ],
            },
          },

          data: {
            status:
              "FAILED",

            ...(input.bookingSnapshot
              ? {
                  bookingSnapshotJson:
                    mapPaymentBookingSyncSnapshotToPrisma(
                      input.bookingSnapshot
                    ),
                }
              : {}),

            attemptCount: {
              increment:
                1,
            },

            lastAttemptAt:
              attemptedAt,

            nextRetryAt:
              null,

            synchronizedAt:
              null,

            lastErrorCode:
              errorCode,

            lastErrorMessage:
              errorMessage,
          },
        });

    if (
      result.count ===
        0
    ) {
      return null;
    }

    return findGuardedPrismaPaymentBookingSync(
      prisma,
      paymentId,
      paymentUpdatedAt
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}

/* ============================================================================
 * Find synchronization records eligible for retry
 * ============================================================================
 */

export async function findRetryablePrismaPaymentBookingSyncs(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    FindRetryablePaymentBookingSyncsRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord[]
> {
  const dueAt =
    new Date(
      input.dueAt
    );

  if (
    Number.isNaN(
      dueAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "dueAt must be a valid ISO timestamp.",
      {
        field:
          "dueAt",

        value:
          input.dueAt,
      }
    );
  }

  if (
    !Number.isInteger(
      input.limit
    ) ||
    input.limit <
      1 ||
    input.limit >
      100
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "limit must be an integer between 1 and 100.",
      {
        field:
          "limit",

        value:
          input.limit,
      }
    );
  }

  try {
       const records =
      await prisma
        .paymentBookingSync
        .findMany({
          where: {
            OR: [
              /**
               * A PENDING record may represent a Payment mutation that
               * committed immediately before the process stopped.
               */
                           {
                status:
                  "PENDING",

                createdAt: {
                  lte:
                    dueAt,
                },

                /**
                 * nextRetryAt also acts as the temporary processing lease for
                 * PENDING crash-recovery records.
                 */
                OR: [
                  {
                    nextRetryAt:
                      null,
                  },
                  {
                    nextRetryAt: {
                      lte:
                        dueAt,
                    },
                  },
                ],
              },

              /**
               * A previously attempted synchronization becomes eligible when
               * its scheduled retry time arrives.
               */
              {
                status:
                  "RETRY_PENDING",

                nextRetryAt: {
                  lte:
                    dueAt,
                },
              },
            ],
          },

          orderBy: [
            {
              nextRetryAt:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],

          take:
            input.limit,
        });

    return mapPrismaPaymentBookingSyncsToRepositoryRecords(
      records
    );
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_READ_FAILED"
    );
  }
}

/* ============================================================================
 * Claim synchronization records for retry processing
 * ============================================================================
 */

export async function claimRetryablePrismaPaymentBookingSyncs(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    ClaimRetryablePaymentBookingSyncsRepositoryInput
): Promise<
  PaymentBookingSyncRepositoryRecord[]
> {
  const dueAt =
    new Date(
      input.dueAt
    );

  const leaseUntil =
    new Date(
      input.leaseUntil
    );

  if (
    Number.isNaN(
      dueAt.getTime()
    ) ||
    Number.isNaN(
      leaseUntil.getTime()
    )
  ) {    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "dueAt and leaseUntil must be valid ISO timestamps.",
      {
        field:
          "dueAt,leaseUntil",

        value: {
          dueAt:
            input.dueAt,

          leaseUntil:
            input.leaseUntil,
        },
      }
    );
  }

  if (
    leaseUntil.getTime() <=
      dueAt.getTime()
  ) {
       throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "leaseUntil must occur after dueAt.",
      {
        field:
          "leaseUntil",

        value: {
          dueAt:
            input.dueAt,

          leaseUntil:
            input.leaseUntil,
        },
      }
    );
  }

  if (
    !Number.isInteger(
      input.limit
    ) ||
    input.limit <
      1 ||
    input.limit >
      100
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "limit must be an integer between 1 and 100.",
      {
        field:
          "limit",

        value:
          input.limit,
      }
    );
  }

  try {
    const candidates =
      await findRetryablePrismaPaymentBookingSyncs(
        prisma,
        {
          dueAt:
            dueAt.toISOString(),

          limit:
            input.limit,
        }
      );

    const claimed:
      PaymentBookingSyncRepositoryRecord[] =
        [];

    for (
      const candidate of
        candidates
    ) {
      const result =
        candidate.status ===
          "PENDING"
          ? await prisma
              .paymentBookingSync
              .updateMany({
                where: {
                  id:
                    candidate.id,

                                   paymentUpdatedAt:
                    new Date(
                      candidate.paymentUpdatedAt
                    ),

                  status:
                    "PENDING",

                  createdAt: {
                    lte:
                      dueAt,
                  },

                  OR: [
                    {
                      nextRetryAt:
                        null,
                    },
                    {
                      nextRetryAt: {
                        lte:
                          dueAt,
                      },
                    },
                  ],
                },

                data: {
                  nextRetryAt:
                    leaseUntil,
                },
              })
          : await prisma
              .paymentBookingSync
              .updateMany({
                where: {
                  id:
                    candidate.id,

                  paymentUpdatedAt:
                    new Date(
                      candidate.paymentUpdatedAt
                    ),

                  status:
                    "RETRY_PENDING",

                  nextRetryAt: {
                    lte:
                      dueAt,
                  },
                },

                data: {
                  nextRetryAt:
                    leaseUntil,
                },
              });

      /**
       * Another worker claimed this record first.
       */
      if (
        result.count ===
          0
      ) {
        continue;
      }

      const claimedRecord =
        await prisma
          .paymentBookingSync
          .findUnique({
            where: {
              id:
                candidate.id,
            },
          });

      if (
        claimedRecord
      ) {
        claimed.push(
          mapPrismaPaymentBookingSyncToRepositoryRecord(
            claimedRecord
          )
        );
      }
    }

    return claimed;
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_WRITE_FAILED"
    );
  }
}
/* ============================================================================
 * Payment -> Booking synchronization statistics
 * ============================================================================
 */

export async function getPrismaPaymentBookingSyncStatistics(
  prisma:
    PrismaPaymentRepositoryClient,
  input:
    GetPaymentBookingSyncStatisticsRepositoryInput
): Promise<
  PaymentBookingSyncStatisticsRepositoryResult
> {
  const observedAt =
    new Date(
      input.observedAt
    );

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "observedAt must be a valid ISO timestamp.",
      {
        field:
          "observedAt",

        value:
          input.observedAt,
      }
    );
  }

  try {
    const [
      total,
      pending,
      retryPending,
      synchronized,
      failed,
      duePending,
      dueRetryPending,
    ] =
      await Promise.all([
        prisma
          .paymentBookingSync
          .count(),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "PENDING",
            },
          }),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "RETRY_PENDING",
            },
          }),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "SYNCHRONIZED",
            },
          }),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "FAILED",
            },
          }),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "PENDING",

              createdAt: {
                lte:
                  observedAt,
              },
            },
          }),

        prisma
          .paymentBookingSync
          .count({
            where: {
              status:
                "RETRY_PENDING",

              nextRetryAt: {
                lte:
                  observedAt,
              },
            },
          }),
      ]);

    return {
      total,

      pending,

      retryPending,

      synchronized,

      failed,

      duePending,

      dueRetryPending,

      due:
        duePending +
        dueRetryPending,

      observedAt:
        observedAt
          .toISOString(),
    };
  } catch (
    error
  ) {
    throw normalizePrismaPaymentRepositoryError(
      error,
      "REPOSITORY_READ_FAILED"
    );
  }
}

/* ============================================================================
 * Repository health
 * ============================================================================
 */

export async function checkPrismaPaymentRepositoryHealth(
  prisma:
    PrismaPaymentRepositoryClient
): Promise<
  PaymentRepositoryHealth
> {
  try {
    await prisma
      .$queryRaw<
        Array<{
          value:
            number;
        }>
      >`
        SELECT 1 AS value
      `;

    return createHealthyPaymentRepositoryResult();
    } catch {
    return createUnhealthyPaymentRepositoryResult(
      "Payment repository health check failed."
    );
  }
}

/* ============================================================================
 * Prisma transaction manager
 * ============================================================================
 */

export class PrismaPaymentRepositoryTransactionManager
  implements
    ExtendedPaymentRepositoryTransactionManager {
  constructor(
    private readonly prisma:
      PrismaClient
  ) {}

  async runInTransaction<T>(
    callback:
      ExtendedPaymentRepositoryTransactionCallback<T>
  ): Promise<T> {
    const maximumAttempts =
      3;

    for (
      let attempt = 1;
      attempt <=
        maximumAttempts;
      attempt +=
        1
    ) {
      try {
        return await this.prisma
          .$transaction(
            async (
              tx
            ) => {
              const repository =
                new PrismaPaymentRepository(
                  tx
                );

              return callback({
                repository,
              });
            },
            {
              /**
               * Financial mutations must serialize concurrent reads and
               * writes of the same Payment aggregate.
               */
              isolationLevel:
                Prisma
                  .TransactionIsolationLevel
                  .Serializable,

              /**
               * Allow bounded time to acquire a transaction connection.
               */
              maxWait:
                10000,

              /**
               * Keep interactive transactions bounded.
               */
              timeout:
                30000,
            }
          );
            } catch (
        error
      ) {
        /**
         * Retryable Prisma transaction failures:
         *
         * P2034:
         * Serializable write conflict or database deadlock.
         *
         * P2028:
         * Interactive transaction expired or was closed before completion.
         *
         * Repository operations may wrap the original Prisma error inside
         * PaymentRepositoryError.details.cause, so both direct and wrapped
         * forms must be recognized.
         */
        const retryablePrismaCodes =
          new Set([
            "P2034",
            "P2028",
          ]);

        /**
         * Handle a Prisma error received directly from $transaction().
         */
        const directPrismaConflict =
          error instanceof
            Prisma
              .PrismaClientKnownRequestError &&
          retryablePrismaCodes
            .has(
              error.code
            );

        /**
         * Handle a Prisma error already normalized by a repository operation.
         */
        const repositoryCause =
          error instanceof
            PaymentRepositoryError
            ? error.details
                ?.cause
            : undefined;

        const wrappedPrismaConflict =
          repositoryCause instanceof
            Prisma
              .PrismaClientKnownRequestError &&
          retryablePrismaCodes
            .has(
              repositoryCause
                .code
            );

        const retryableConflict =
          directPrismaConflict ||
          wrappedPrismaConflict;

        /**
         * Non-transactional errors, including domain validation failures,
         * must leave immediately and must not be retried.
         */
        if (
          !retryableConflict
        ) {
          throw error;
        }

        /**
         * Never expose Prisma P2034/P2028 details after retry exhaustion.
         */
        if (
          attempt ===
            maximumAttempts
        ) {
          throw new PaymentRepositoryError(
            "TRANSACTION_FAILED",
            "Payment transaction could not be completed because of concurrent modification.",
            {}
          );
        }

        /**
         * Continue the loop and retry the complete transaction callback.
         *
         * The failed transaction was rolled back, so none of its partial
         * transaction, financial-summary or status writes were committed.
         */
      }
    }

    /**
     * Defensive unreachable guard required by TypeScript.
     */
    throw new Error(
      "Payment transaction retry loop ended unexpectedly."
    );
  }
}

/* ============================================================================
 * Final Prisma Payment Repository
 * ============================================================================
 */

export class PrismaPaymentRepository
  implements
    CompleteExtendedPaymentRepository {
  constructor(
    private readonly prisma:
      PrismaPaymentRepositoryClient
  ) {}

  /* ------------------------------------------------------------------------
   * Core Payment reads
   * ------------------------------------------------------------------------
   */

  findById(
    paymentId:
      string
  ) {
    return findPrismaPaymentById(
      this.prisma,
      paymentId
    );
  }

  findByPaymentNumber(
    paymentNumber:
      string
  ) {
    return findPrismaPaymentByNumber(
      this.prisma,
      paymentNumber
    );
  }

  findByReferenceId(
    referenceId:
      string
  ) {
    return findPrismaPaymentByReferenceId(
      this.prisma,
      referenceId
    );
  }

  findByBookingId(
    bookingId:
      string
  ) {
    return findPrismaPaymentByBookingId(
      this.prisma,
      bookingId
    );
  }

  findByQuotationId(
    quotationId:
      string
  ) {
    return findPrismaPaymentByQuotationId(
      this.prisma,
      quotationId
    );
  }

  list(
    query?:
      PaymentRepositoryListQuery
  ) {
    return listPrismaPayments(
      this.prisma,
      query
    );
  }

  search(
    criteria:
      PaymentSearchCriteria
  ) {
    return searchPrismaPayments(
      this.prisma,
      criteria
    );
  }

  /* ------------------------------------------------------------------------
   * Core Payment writes
   * ------------------------------------------------------------------------
   */

  create(
    input:
      CreatePaymentRepositoryInput
  ) {
    return createPrismaPayment(
      this.prisma,
      input.payment
    );
  }

  update(
    input:
      UpdatePaymentRepositoryInput
  ) {
    return updatePrismaPayment(
      this.prisma,
      input.payment
    );
  }

  delete(
    paymentId:
      string
  ) {
    return deletePrismaPayment(
      this.prisma,
      paymentId
    );
  }

  /* ------------------------------------------------------------------------
   * Uniqueness
   * ------------------------------------------------------------------------
   */

  paymentNumberExists(
    paymentNumber:
      string
  ) {
    return prismaPaymentNumberExists(
      this.prisma,
      paymentNumber
    );
  }

  referenceIdExists(
    referenceId:
      string
  ) {
    return prismaPaymentReferenceIdExists(
      this.prisma,
      referenceId
    );
  }

  bookingPaymentExists(
    bookingId:
      string
  ) {
    return prismaBookingPaymentExists(
      this.prisma,
      bookingId
    );
  }

  gatewayPaymentIdExists(
    gatewayPaymentId:
      string
  ) {
    return prismaGatewayPaymentIdExists(
      this.prisma,
      gatewayPaymentId
    );
  }

  /* ------------------------------------------------------------------------
   * Transactions
   * ------------------------------------------------------------------------
   */

  findTransactionById(
    transactionId:
      string
  ) {
    return findPrismaPaymentTransactionById(
      this.prisma,
      transactionId
    );
  }

  findTransactionsByPaymentId(
    paymentId:
      string
  ) {
    return findPrismaPaymentTransactionsByPaymentId(
      this.prisma,
      paymentId
    );
  }

  findTransactionByGatewayPaymentId(
    gatewayPaymentId:
      string
  ) {
    return findPrismaPaymentTransactionByGatewayPaymentId(
      this.prisma,
      gatewayPaymentId
    );
  }

  findTransactionsByGatewayOrderId(
    gatewayOrderId:
      string
  ) {
    return findPrismaPaymentTransactionsByGatewayOrderId(
      this.prisma,
      gatewayOrderId
    );
  }

  listTransactions(
    query?:
      PaymentTransactionRepositoryListQuery
  ) {
    return listPrismaPaymentTransactions(
      this.prisma,
      query
    );
  }

  searchTransactions(
    criteria:
      PaymentTransactionSearchCriteria
  ) {
    return searchPrismaPaymentTransactions(
      this.prisma,
      criteria
    );
  }

  createTransaction(
    input:
      CreatePaymentTransactionRepositoryInput
  ) {
    return createPrismaPaymentTransaction(
      this.prisma,
      input.transaction
    );
  }

  updateTransaction(
    input:
      UpdatePaymentTransactionRepositoryInput
  ) {
    return updatePrismaPaymentTransaction(
      this.prisma,
      input.transaction
    );
  }

  /* ------------------------------------------------------------------------
   * Status / financial summary
   * ------------------------------------------------------------------------
   */

  updateStatus(
    input:
      UpdatePaymentStatusRepositoryInput
  ) {
    return updatePrismaPaymentStatus(
      this.prisma,
      input
    );
  }

  updateFinancialSummary(
    input:
      UpdatePaymentFinancialSummaryRepositoryInput
  ) {
    return updatePrismaPaymentFinancialSummary(
      this.prisma,
      input
    );
  }
  /* ------------------------------------------------------------------------
   * Payment -> Booking synchronization state
   * ------------------------------------------------------------------------
   */

  upsertPendingBookingSync(
    input:
      UpsertPendingPaymentBookingSyncRepositoryInput
  ) {
    return upsertPendingPrismaPaymentBookingSync(
      this.prisma,
      input
    );
  }

  findBookingSyncByPaymentId(
    paymentId:
      string
  ) {
    return findPrismaPaymentBookingSyncByPaymentId(
      this.prisma,
      paymentId
    );
  }

  markBookingSyncSynchronized(
    input:
      MarkPaymentBookingSyncSynchronizedRepositoryInput
  ) {
    return markPrismaPaymentBookingSyncSynchronized(
      this.prisma,
      input
    );
  }

  markBookingSyncRetryPending(
    input:
      MarkPaymentBookingSyncRetryPendingRepositoryInput
  ) {
    return markPrismaPaymentBookingSyncRetryPending(
      this.prisma,
      input
    );
  }

  markBookingSyncFailed(
    input:
      MarkPaymentBookingSyncFailedRepositoryInput
  ) {
    return markPrismaPaymentBookingSyncFailed(
      this.prisma,
      input
    );
  }

    findRetryableBookingSyncs(
    input:
      FindRetryablePaymentBookingSyncsRepositoryInput
  ) {
    return findRetryablePrismaPaymentBookingSyncs(
      this.prisma,
      input
    );
  }

  getBookingSyncStatistics(
    input:
      GetPaymentBookingSyncStatisticsRepositoryInput
  ) {
    return getPrismaPaymentBookingSyncStatistics(
      this.prisma,
      input
    );
  }
  claimRetryableBookingSyncs(
    input:
      ClaimRetryablePaymentBookingSyncsRepositoryInput
  ) {
    return claimRetryablePrismaPaymentBookingSyncs(
      this.prisma,
      input
    );
  }
  /* ------------------------------------------------------------------------
   * Gateway orders
   * ------------------------------------------------------------------------
   */

  createGatewayOrder(
    input:
      CreatePaymentGatewayOrderRepositoryInput
  ) {
    return createPrismaPaymentGatewayOrder(
      this.prisma,
      input
    );
  }

  updateGatewayOrder(
    input:
      UpdatePaymentGatewayOrderRepositoryInput
  ) {
    return updatePrismaPaymentGatewayOrder(
      this.prisma,
      input
    );
  }

  findGatewayOrderById(
    gatewayOrderId:
      string
  ) {
    return findPrismaPaymentGatewayOrderById(
      this.prisma,
      gatewayOrderId
    );
  }

  findGatewayOrdersByPaymentId(
    paymentId:
      string
  ) {
    return findPrismaPaymentGatewayOrdersByPaymentId(
      this.prisma,
      paymentId
    );
  }

  /* ------------------------------------------------------------------------
   * Webhooks
   * ------------------------------------------------------------------------
   */

  createWebhookRecord(
    input:
      CreatePaymentWebhookRepositoryInput
  ) {
    return createPrismaPaymentWebhookRecord(
      this.prisma,
      input
    );
  }

  findWebhookById(
    webhookId:
      string
  ) {
    return findPrismaPaymentWebhookById(
      this.prisma,
      webhookId
    );
  }

  findWebhookByProviderEventId(
    provider:
      PaymentProvider,
    providerEventId:
      string
  ) {
    return findPrismaPaymentWebhookByProviderEventId(
      this.prisma,
      provider,
      providerEventId
    );
  }

  webhookProviderEventExists(
    provider:
      PaymentProvider,
    providerEventId:
      string
  ) {
    return prismaPaymentWebhookProviderEventExists(
      this.prisma,
      provider,
      providerEventId
    );
  }

  markWebhookProcessed(
    input:
      MarkPaymentWebhookProcessedRepositoryInput
  ) {
    return markPrismaPaymentWebhookProcessed(
      this.prisma,
      input
    );
  }

  markWebhookFailed(
    input:
      MarkPaymentWebhookFailedRepositoryInput
  ) {
    return markPrismaPaymentWebhookFailed(
      this.prisma,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Statistics
   * ------------------------------------------------------------------------
   */

  getPaymentStatistics(
    criteria?:
      PaymentSearchCriteria
  ) {
    return getPrismaPaymentStatistics(
      this.prisma,
      criteria
    );
  }

  getTransactionStatistics(
    criteria?:
      PaymentTransactionSearchCriteria
  ) {
    return getPrismaPaymentTransactionStatistics(
      this.prisma,
      criteria
    );
  }

  /* ------------------------------------------------------------------------
   * Reconciliation
   * ------------------------------------------------------------------------
   */

  saveReconciliation(
    input:
      SavePaymentReconciliationRepositoryInput
  ) {
    return savePrismaPaymentReconciliation(
      this.prisma,
      input
    );
  }

  getLatestReconciliation(
    paymentId:
      string
  ) {
    return getLatestPrismaPaymentReconciliation(
      this.prisma,
      paymentId
    );
  }

  listReconciliations(
    query:
      PaymentReconciliationHistoryQuery
  ) {
    return listPrismaPaymentReconciliations(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Bulk
   * ------------------------------------------------------------------------
   */

  findManyByIds(
    input:
      PaymentRepositoryBulkLookupInput
  ) {
    return findManyPrismaPaymentsByIds(
      this.prisma,
      input
    );
  }

  updateManyStatuses(
    input:
      PaymentRepositoryBulkStatusUpdateInput
  ) {
    return updateManyPrismaPaymentStatuses(
      this.prisma,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Health
   * ------------------------------------------------------------------------
   */

  checkHealth() {
    return checkPrismaPaymentRepositoryHealth(
      this.prisma
    );
  }
}

/* ============================================================================
 * Repository factory
 * ============================================================================
 */

export function createPrismaPaymentRepository(
  prisma:
    PrismaPaymentRepositoryClient
): CompleteExtendedPaymentRepository {
  return new PrismaPaymentRepository(
    prisma
  );
}

/* ============================================================================
 * Prisma Payment repository module
 * ============================================================================
 */

export interface PrismaPaymentRepositoryModule {
  repository:
    CompleteExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  capabilityReport:
    PaymentRepositoryCapabilityReport;

  configuration:
    PaymentRepositoryConfigurationValidation;
}
/* ============================================================================
 * Repository module factory
 * ============================================================================
 */

export function createPrismaPaymentRepositoryModule(
  prisma:
    PrismaClient
): PrismaPaymentRepositoryModule {
  const repository:
    CompleteExtendedPaymentRepository =
      new PrismaPaymentRepository(
        prisma
      );

  const transactionManager:
    ExtendedPaymentRepositoryTransactionManager =
      new PrismaPaymentRepositoryTransactionManager(
        prisma
      );

  const capabilityReport:
    PaymentRepositoryCapabilityReport =
      createDefaultPaymentRepositoryCapabilityReport();

  const configuration:
    PaymentRepositoryConfigurationValidation =
      createValidPaymentRepositoryConfiguration();

  return {
    repository,

    transactionManager,

    capabilityReport,

    configuration,
  };
}
/* ============================================================================
 * Final facade
 * ============================================================================
 */

export const CompletePrismaPaymentRepository = {
  foundation:
    PrismaPaymentRepositoryFoundation,

  mutations:
    PrismaPaymentMutationRepository,

  queries:
    PrismaPaymentQueryRepository,

  transactions:
    PrismaPaymentTransactionRepository,

  gatewayOrders: {
    create:
      createPrismaPaymentGatewayOrder,

    update:
      updatePrismaPaymentGatewayOrder,

    findById:
      findPrismaPaymentGatewayOrderById,

    findByPaymentId:
      findPrismaPaymentGatewayOrdersByPaymentId,
  },

  webhooks: {
    create:
      createPrismaPaymentWebhookRecord,

    findById:
      findPrismaPaymentWebhookById,

    findByProviderEventId:
      findPrismaPaymentWebhookByProviderEventId,

    providerEventExists:
      prismaPaymentWebhookProviderEventExists,

    markProcessed:
      markPrismaPaymentWebhookProcessed,

    markFailed:
      markPrismaPaymentWebhookFailed,
  },

  reconciliation: {
    save:
      savePrismaPaymentReconciliation,

    latest:
      getLatestPrismaPaymentReconciliation,

    list:
      listPrismaPaymentReconciliations,
  },

  statistics: {
    payments:
      getPrismaPaymentStatistics,

    transactions:
      getPrismaPaymentTransactionStatistics,
  },

  bulk: {
    findManyByIds:
      findManyPrismaPaymentsByIds,

    updateManyStatuses:
      updateManyPrismaPaymentStatuses,
  },

  health:
    checkPrismaPaymentRepositoryHealth,

  createRepository:
    createPrismaPaymentRepository,

  createModule:
    createPrismaPaymentRepositoryModule,
} as const;

/* ============================================================================
 * End of Prisma Payment Repository - Part E
 * ============================================================================
 */