/**
 * ============================================================================
 * EasyMovers
 * Prisma Quotation Repository
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/repositories/quotation.prisma.repository.ts
 *
 * Responsibilities:
 * - Define Prisma Quotation repository client contracts
 * - Define canonical relation includes
 * - Define hydrated Prisma Quotation record type
 * - Convert Prisma records into Quotation domain aggregates
 * - Normalize repository identifiers
 * - Normalize Prisma/database errors
 * - Provide pagination/query helper utilities
 * - Provide reusable persistence helper functions
 *
 * Later parts will implement:
 * - Create / update / status update
 * - Find by ID / number / reference
 * - Booking / Lead / Vendor queries
 * - Search / pagination
 * - Relation checks
 * - Uniqueness checks
 * - Booking quotation selection
 * - Aggregation / statistics
 * - Delete / health checks
 * - Repository class
 * - Transaction manager
 * - Repository factories
 *
 * IMPORTANT:
 * - Business validation belongs to quotation.service.ts
 * - HTTP handling belongs to quotation.controller.ts / routes
 * - Domain validation belongs to quotation.validator.ts
 * ============================================================================
 */

import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  CompleteQuotationMapper,
  mapQuotationPersistenceToDomain,
  mapQuotationSearchCriteriaToPrisma,
  mapQuotationSortToPrisma,
  mapQuotationStatus,
} from "../mappers/quotation.mapper";

import type {
  QuotationMapperPersistenceInput,
} from "../mappers/quotation.mapper";

import type {
  Quotation,
  QuotationId,
  QuotationListItem,
  QuotationStatus,
} from "../models/quotation.model";

import {
  COMPLETE_QUOTATION_REPOSITORY_CAPABILITIES,
  QuotationRepositoryError,
  createQuotationDatabaseRepositoryError,
} from "./quotation.repository";

import type {
  BookingQuotationSelectionRepositoryResult,
  CheckQuotationBookingRepositoryQuery,
  CheckQuotationLeadRepositoryQuery,
  CheckQuotationRelationsRepositoryQuery,
  CheckQuotationRelationsRepositoryResult,
  CheckQuotationUserRepositoryQuery,
  CheckQuotationVendorRepositoryQuery,
  CompleteQuotationRepository,
  CountBookingQuotationsRepositoryQuery,
  CountQuotationsRepositoryQuery,
  CreateQuotationRepositoryInput,
  DeleteQuotationRepositoryResult,
  FindQuotationsByBookingRepositoryQuery,
  FindQuotationsByLeadRepositoryQuery,
  FindQuotationsByVendorRepositoryQuery,
  FindSelectedQuotationRepositoryQuery,
  FindVendorBookingQuotationRepositoryQuery,
  GetBookingQuotationSummaryRepositoryQuery,
  GetQuotationRepositoryStatisticsQuery,
  QuotationBookingExistenceResult,
  QuotationLeadExistenceResult,
  QuotationRepositoryCapabilityReport,
  QuotationRepositoryExistenceQuery,
  QuotationRepositoryExistenceResult,
  QuotationRepositoryFilter,
  QuotationRepositoryHealthResult,
  QuotationRepositoryListQuery,
  QuotationRepositoryModule,
  QuotationRepositoryMutationContext,
  QuotationRepositoryPage,
  QuotationRepositoryPagination,
  QuotationRepositoryPaginationMetadata,
  QuotationRepositoryPort,
  QuotationRepositoryPortTransactionManager,
  QuotationRepositorySort,
  QuotationRepositoryStatistics,
  QuotationRepositoryStatusCount,
  QuotationRepositoryTransactionCallback,
  QuotationRepositoryTransactionManager,
  QuotationRepositoryUniquenessQuery,
  QuotationRepositoryUniquenessResult,
  QuotationRepositoryAmountSummary,
  QuotationUserExistenceResult,
  QuotationVendorExistenceResult,
  SelectBookingQuotationRepositoryInput,
  UnselectBookingQuotationRepositoryInput,
  UpdateQuotationRepositoryInput,
  UpdateQuotationStatusRepositoryInput,
} from "./quotation.repository";
/* ============================================================================
 * Prisma repository client
 * ============================================================================
 */

/**
 * Repository operations must work with both:
 *
 * - normal PrismaClient
 * - Prisma transaction client
 *
 * This allows the same repository class to be reused inside
 * prisma.$transaction().
 */
export type PrismaQuotationRepositoryClient =
  PrismaClient |
  Prisma.TransactionClient;

/* ============================================================================
 * Canonical Quotation relation include
 * ============================================================================
 */

/**
 * Complete relation graph needed by the current Quotation domain mapper.
 *
 * Why each relation is loaded:
 *
 * lead
 *   -> leadReferenceId is required by QuotationLeadReference
 *
 * booking
 *   -> bookingNumber is used by QuotationBookingReference
 *
 * vendor
 *   -> internal Vendor reference
 *
 * user
 *   -> optional quotation creator/submitting User reference
 *
 * selectedForBooking
 *   -> reverse side of Booking.selectedQuotation
 *   -> determines selectedForBooking boolean
 *
 * payments are intentionally NOT loaded because Payment belongs to its
 * own domain and is not part of the current Quotation aggregate.
 */
export const QUOTATION_REPOSITORY_INCLUDE = {
  lead:
    true,

  booking:
    true,

  vendor:
    true,

  user:
    true,

  selectedForBooking:
    true,
} satisfies Prisma.QuotationInclude;

/**
 * Hydrated Prisma Quotation record used throughout this repository.
 */
export type PrismaQuotationRecord =
  Prisma.QuotationGetPayload<{
    include:
      typeof QUOTATION_REPOSITORY_INCLUDE;
  }>;

/* ============================================================================
 * Repository defaults
 * ============================================================================
 */

export const PRISMA_QUOTATION_DEFAULT_PAGE =
  1;

export const PRISMA_QUOTATION_DEFAULT_PAGE_SIZE =
  20;

export const PRISMA_QUOTATION_MAX_PAGE_SIZE =
  100;

/**
 * Stable default ordering.
 */
export const PRISMA_QUOTATION_DEFAULT_SORT:
  QuotationRepositorySort = {
    field:
      "createdAt",

    direction:
      "desc",
  };

/* ============================================================================
 * Identifier helpers
 * ============================================================================
 */

/**
 * Trims one optional repository identifier.
 */
export function normalizePrismaQuotationString(
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
 * Requires one non-empty repository identifier.
 */
export function requirePrismaQuotationIdentifier(
  value:
    unknown,
  field:
    string
): string {
  const normalized =
    normalizePrismaQuotationString(
      value
    );

  if (
    !normalized
  ) {
    throw new QuotationRepositoryError(
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
 * Pagination normalization
 * ============================================================================
 */

export function normalizePrismaQuotationPagination(
  pagination?:
    QuotationRepositoryPagination
): QuotationRepositoryPagination {
  const page =
    pagination?.page;

  const pageSize =
    pagination?.pageSize;

  const normalizedPage =
    Number.isInteger(
      page
    ) &&
    (
      page as number
    ) >
      0
      ? (
          page as number
        )
      : PRISMA_QUOTATION_DEFAULT_PAGE;

  const normalizedPageSize =
    Number.isInteger(
      pageSize
    ) &&
    (
      pageSize as number
    ) >
      0
      ? Math.min(
          pageSize as number,
          PRISMA_QUOTATION_MAX_PAGE_SIZE
        )
      : PRISMA_QUOTATION_DEFAULT_PAGE_SIZE;

  return {
    page:
      normalizedPage,

    pageSize:
      normalizedPageSize,
  };
}

/**
 * Converts repository pagination into Prisma skip / take.
 */
export function mapPrismaQuotationPagination(
  pagination?:
    QuotationRepositoryPagination
): {
  skip:
    number;

  take:
    number;

  pagination:
    QuotationRepositoryPagination;
} {
  const normalized =
    normalizePrismaQuotationPagination(
      pagination
    );

  return {
    skip:
      (
        normalized.page -
        1
      ) *
      normalized.pageSize,

    take:
      normalized.pageSize,

    pagination:
      normalized,
  };
}

/* ============================================================================
 * Pagination metadata
 * ============================================================================
 */

export function createPrismaQuotationPaginationMetadata(
  pagination:
    QuotationRepositoryPagination,
  totalItems:
    number
): QuotationRepositoryPaginationMetadata {
  const safeTotalItems =
    Math.max(
      0,
      totalItems
    );

  const totalPages =
    pagination.pageSize >
      0
      ? Math.ceil(
          safeTotalItems /
          pagination.pageSize
        )
      : 0;

  return {
    page:
      pagination.page,

    pageSize:
      pagination.pageSize,

    totalItems:
      safeTotalItems,

    totalPages,

    hasNextPage:
      pagination.page <
      totalPages,

    hasPreviousPage:
      pagination.page >
      1,
  };
}

/* ============================================================================
 * Prisma record -> mapper contract
 * ============================================================================
 */

/**
 * Converts the concrete Prisma payload into the mapper's
 * persistence contract.
 *
 * Keeping this adapter explicit prevents Prisma-specific record
 * details from leaking further into the domain layer.
 */
export function mapPrismaQuotationRecordToPersistenceInput(
  record:
    PrismaQuotationRecord
): QuotationMapperPersistenceInput {
  return {
    id:
      record.id,

    quotationNumber:
      record.quotationNumber,

    referenceId:
      record.referenceId,

    leadId:
      record.leadId,

    bookingId:
      record.bookingId,

    vendorId:
      record.vendorId,

    userId:
      record.userId,

    transportationCost:
      record.transportationCost,

    packingCost:
      record.packingCost,

    unpackingCost:
      record.unpackingCost,

    labourCost:
      record.labourCost,

    insuranceCost:
      record.insuranceCost,

    otherCost:
      record.otherCost,

    discountAmount:
      record.discountAmount,

    taxAmount:
      record.taxAmount,

    totalAmount:
      record.totalAmount,

    currency:
      record.currency,

    pickupDate:
      record.pickupDate,

    deliveryDate:
      record.deliveryDate,

    transitDays:
      record.transitDays,

    status:
      record.status,

    validUntil:
      record.validUntil,

    pricingBreakdown:
      record.pricingBreakdown,

    termsJson:
      record.termsJson,

    inclusionsJson:
      record.inclusionsJson,

    exclusionsJson:
      record.exclusionsJson,

    remarks:
      record.remarks,

    internalRemarks:
      record.internalRemarks,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,

    lead: {
      id:
        record.lead.id,

      referenceId:
        record.lead.referenceId,
    },

    booking: {
      id:
        record.booking.id,

      bookingNumber:
        record.booking.bookingNumber,
    },

    vendor: {
  id:
    record.vendor.id,

  companyName:
    record.vendor.companyName,
},
    user:
      record.user
        ? {
            id:
              record.user.id,
          }
        : null,

    selectedForBooking:
      record.selectedForBooking
        ? {
            id:
              record.selectedForBooking.id,

            bookingNumber:
              record.selectedForBooking
                .bookingNumber,
          }
        : null,
  };
}

/* ============================================================================
 * Prisma record -> domain aggregate
 * ============================================================================
 */

export function mapPrismaQuotationToDomain(
  record:
    PrismaQuotationRecord
): Quotation {
  const persistenceInput =
    mapPrismaQuotationRecordToPersistenceInput(
      record
    );

  const mapped =
    mapQuotationPersistenceToDomain(
      persistenceInput
    );

  if (
    !mapped.success
  ) {
    throw new QuotationRepositoryError(
      "DATABASE_ERROR",
      `Unable to map persisted Quotation ${record.id}: ${mapped.error}`,
      {
        quotationId:
          record.id,
      }
    );
  }

  return mapped.value;
}

/**
 * Maps multiple Prisma Quotation records.
 */
export function mapPrismaQuotationsToDomain(
  records:
    PrismaQuotationRecord[]
): Quotation[] {
  return records.map(
    (
      record
    ) =>
      mapPrismaQuotationToDomain(
        record
      )
  );
}

/* ============================================================================
 * Prisma known-error structural guard
 * ============================================================================
 */

/**
 * We intentionally use structural error detection instead of depending on
 * Prisma runtime-internal error classes.
 *
 * This is more stable across Prisma client generation/runtime versions.
 */
export interface PrismaQuotationKnownErrorLike {
  code:
    string;

  message?:
    string;

  meta?:
    unknown;
}

export function isPrismaQuotationKnownError(
  error:
    unknown
): error is PrismaQuotationKnownErrorLike {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return false;
  }

  const candidate =
    error as Record<
      string,
      unknown
    >;

  return (
    typeof candidate.code ===
      "string" &&
    candidate.code.startsWith(
      "P"
    )
  );
}

/* ============================================================================
 * Prisma error metadata helpers
 * ============================================================================
 */

export function readPrismaQuotationErrorTarget(
  error:
    PrismaQuotationKnownErrorLike
): string[] {
  if (
    typeof error.meta !==
      "object" ||
    error.meta ===
      null
  ) {
    return [];
  }

  const meta =
    error.meta as Record<
      string,
      unknown
    >;

  const target =
    meta.target;

  if (
    Array.isArray(
      target
    )
  ) {
    return target.filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    );
  }

  if (
    typeof target ===
      "string"
  ) {
    return [
      target,
    ];
  }

  return [];
}

/* ============================================================================
 * Error normalization
 * ============================================================================
 */

/**
 * Maps Prisma/database failures into stable Quotation repository errors.
 */
export function normalizePrismaQuotationRepositoryError(
  error:
    unknown
): QuotationRepositoryError {
  if (
    error instanceof
    QuotationRepositoryError
  ) {
    return error;
  }

  if (
    isPrismaQuotationKnownError(
      error
    )
  ) {
    /* ----------------------------------------------------------------------
     * Unique constraint violation
     * ----------------------------------------------------------------------
     */

    if (
      error.code ===
        "P2002"
    ) {
      const target =
        readPrismaQuotationErrorTarget(
          error
        );

      if (
        target.includes(
          "quotationNumber"
        )
      ) {
        return new QuotationRepositoryError(
          "DUPLICATE_QUOTATION_NUMBER",
          "Quotation number already exists.",
          {
            field:
              "quotationNumber",

            cause:
              error,
          }
        );
      }

      if (
        target.includes(
          "referenceId"
        )
      ) {
        return new QuotationRepositoryError(
          "DUPLICATE_REFERENCE_ID",
          "Quotation reference ID already exists.",
          {
            field:
              "referenceId",

            cause:
              error,
          }
        );
      }

      return new QuotationRepositoryError(
        "DATABASE_ERROR",
        "A unique Quotation constraint was violated.",
        {
          cause:
            error,
        }
      );
    }

    /* ----------------------------------------------------------------------
     * Foreign-key constraint violation
     * ----------------------------------------------------------------------
     */

    if (
      error.code ===
        "P2003"
    ) {
      return new QuotationRepositoryError(
        "RELATION_MISMATCH",
        "A Quotation relation could not be persisted.",
        {
          cause:
            error,
        }
      );
    }

    /* ----------------------------------------------------------------------
     * Record required but not found
     * ----------------------------------------------------------------------
     */

    if (
      error.code ===
        "P2025"
    ) {
      return new QuotationRepositoryError(
        "QUOTATION_NOT_FOUND",
        "Quotation was not found.",
        {
          cause:
            error,
        }
      );
    }

    return new QuotationRepositoryError(
      "DATABASE_ERROR",
      `Prisma Quotation operation failed with ${error.code}.`,
      {
        cause:
          error,
      }
    );
  }

  if (
    error instanceof
      Error
  ) {
    return createQuotationDatabaseRepositoryError(
      error.message,
      error
    );
  }

  return new QuotationRepositoryError(
    "UNKNOWN_REPOSITORY_ERROR",
    "An unknown Quotation repository error occurred.",
    {
      cause:
        error,
    }
  );
}

/* ============================================================================
 * Repository filter -> mapper criteria
 * ============================================================================
 */

/**
 * The repository filter and domain QuotationSearchCriteria currently use
 * compatible fields.
 *
 * This helper keeps the dependency explicit so repository code does not
 * need to duplicate Prisma filter construction.
 */
export function mapQuotationRepositoryFilterToPrismaWhere(
  filter?:
    QuotationRepositoryFilter
): Prisma.QuotationWhereInput {
  if (
    !filter
  ) {
    return {};
  }

  return mapQuotationSearchCriteriaToPrisma({
    quotationId:
      filter.quotationId,

    quotationNumber:
      filter.quotationNumber,

    referenceId:
      filter.referenceId,

    leadId:
      filter.leadId,

    bookingId:
      filter.bookingId,

    vendorId:
      filter.vendorId,

    userId:
      filter.userId,

    status:
      filter.status,

    statuses:
      filter.statuses,

    selectedForBooking:
      filter.selectedForBooking,

    minimumAmount:
      filter.minimumAmount,

    maximumAmount:
      filter.maximumAmount,

    validFrom:
      filter.validFrom,

    validUntil:
      filter.validUntil,

    pickupDateFrom:
      filter.pickupDateFrom,

    pickupDateTo:
      filter.pickupDateTo,

    createdFrom:
      filter.createdFrom,

    createdUntil:
      filter.createdUntil,

    search:
      filter.search,
  });
}

/* ============================================================================
 * Repository sort -> Prisma orderBy
 * ============================================================================
 */

export function mapQuotationRepositorySortToPrisma(
  sort?:
    QuotationRepositorySort
): Prisma.QuotationOrderByWithRelationInput {
  return mapQuotationSortToPrisma(
    sort ??
      PRISMA_QUOTATION_DEFAULT_SORT
  );
}

/* ============================================================================
 * Status collection helper
 * ============================================================================
 */

export function mapQuotationStatusesToPrismaWhere(
  statuses?:
    QuotationStatus[]
): Prisma.QuotationWhereInput["status"] {
  if (
    !statuses ||
    statuses.length ===
      0
  ) {
    return undefined;
  }

  return {
    in:
      statuses.map(
        (
          status
        ) =>
          CompleteQuotationMapper
            .write
            .status(
              status
            )
      ),
  };
}

/* ============================================================================
 * Standard hydrated lookup helper
 * ============================================================================
 */

/**
 * Loads one Quotation using the canonical aggregate include.
 *
 * This helper will be reused by update/status/selection operations.
 */
export async function findPrismaQuotationRecordById(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationId:
    QuotationId
): Promise<
  PrismaQuotationRecord | null
> {
  const id =
    requirePrismaQuotationIdentifier(
      quotationId,
      "quotationId"
    );

  try {
    return await prisma.quotation.findUnique({
      where: {
        id,
      },

      include:
        QUOTATION_REPOSITORY_INCLUDE,
    });
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Lookup by quotation number
 * ============================================================================
 */

export async function findPrismaQuotationRecordByNumber(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationNumber:
    string
): Promise<
  PrismaQuotationRecord | null
> {
  const normalizedQuotationNumber =
    requirePrismaQuotationIdentifier(
      quotationNumber,
      "quotationNumber"
    );

  try {
    return await prisma.quotation.findUnique({
      where: {
        quotationNumber:
          normalizedQuotationNumber,
      },

      include:
        QUOTATION_REPOSITORY_INCLUDE,
    });
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Lookup by reference ID
 * ============================================================================
 */

export async function findPrismaQuotationRecordByReferenceId(
  prisma:
    PrismaQuotationRepositoryClient,
  referenceId:
    string
): Promise<
  PrismaQuotationRecord | null
> {
  const normalizedReferenceId =
    requirePrismaQuotationIdentifier(
      referenceId,
      "referenceId"
    );

  try {
    return await prisma.quotation.findUnique({
      where: {
        referenceId:
          normalizedReferenceId,
      },

      include:
        QUOTATION_REPOSITORY_INCLUDE,
    });
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Generic hydrated find-many
 * ============================================================================
 */

/**
 * Shared hydrated findMany helper.
 */
export async function findManyPrismaQuotationRecords(
  prisma:
    PrismaQuotationRepositoryClient,
  options?: {
    where?:
      Prisma.QuotationWhereInput;

    orderBy?:
      Prisma.QuotationOrderByWithRelationInput;

    skip?:
      number;

    take?:
      number;
  }
): Promise<
  PrismaQuotationRecord[]
> {
  try {
    return await prisma.quotation.findMany({
      where:
        options?.where,

      orderBy:
        options?.orderBy,

      skip:
        options?.skip,

      take:
        options?.take,

      include:
        QUOTATION_REPOSITORY_INCLUDE,
    });
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Generic count helper
 * ============================================================================
 */

export async function countPrismaQuotationRecords(
  prisma:
    PrismaQuotationRepositoryClient,
  where?:
    Prisma.QuotationWhereInput
): Promise<number> {
  try {
    return await prisma.quotation.count({
      where,
    });
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Generic repository-page helper
 * ============================================================================
 */

export function createPrismaQuotationRepositoryPage<
  T
>(
  items:
    T[],
  pagination:
    QuotationRepositoryPagination,
  totalItems:
    number
): QuotationRepositoryPage<T> {
  return {
    items,

    pagination:
      createPrismaQuotationPaginationMetadata(
        pagination,
        totalItems
      ),
  };
}

/* ============================================================================
 * Repository health timer helper
 * ============================================================================
 */

export function calculatePrismaQuotationLatency(
  startedAt:
    number
): number {
  return Math.max(
    0,
    Date.now() -
      startedAt
  );
}

/* ============================================================================
 * Part A capability notes
 * ============================================================================
 */

/**
 * The repository intentionally does not include payments in the canonical
 * Quotation query.
 *
 * Current Prisma relation:
 *
 *   payments Payment[]
 *
 * exists on Quotation, but Payment is not part of the current Quotation
 * domain aggregate. Loading it on every quotation query would create
 * unnecessary coupling and query overhead.
 */

/**
 * Selection is also intentionally READ here through:
 *
 *   selectedForBooking
 *
 * Actual selection mutation will be implemented later by updating
 * Booking.selectedQuotationId within a Prisma transaction.
 */

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Quotation Repository
 * Part B
 * ============================================================================
 *
 * Core mutation operations:
 *
 * - Create Quotation
 * - Update Quotation
 * - Update Quotation Status
 * - Delete Quotation
 *
 * IMPORTANT:
 * - Business validation remains in quotation.service.ts
 * - Mapper handles Prisma write-data conversion
 * - Repository handles persistence only
 * - Every successful mutation returns a hydrated domain aggregate
 * ============================================================================
 */

/* ============================================================================
 * Create Quotation
 * ============================================================================
 */

/**
 * Persists one new Quotation.
 *
 * Expected upstream responsibilities:
 *
 * - input already validated
 * - Lead exists
 * - Booking exists
 * - Vendor exists
 * - Booking belongs to supplied Lead
 * - Vendor is eligible to quote
 * - quotationNumber generated
 * - referenceId generated
 */
export async function createPrismaQuotation(
  prisma:
    PrismaQuotationRepositoryClient,
  input:
    CreateQuotationRepositoryInput
): Promise<
  Quotation
> {
  const quotationNumber =
    requirePrismaQuotationIdentifier(
      input.identity
        .quotationNumber,
      "quotationNumber"
    );

  const referenceId =
    requirePrismaQuotationIdentifier(
      input.identity
        .referenceId,
      "referenceId"
    );

  const leadId =
    requirePrismaQuotationIdentifier(
      input.quotation
        .leadId,
      "leadId"
    );

  const bookingId =
    requirePrismaQuotationIdentifier(
      input.quotation
        .bookingId,
      "bookingId"
    );

  const vendorId =
    requirePrismaQuotationIdentifier(
      input.quotation
        .vendorId,
      "vendorId"
    );

  /**
   * Reconstruct normalized relation IDs before mapping.
   */
  const normalizedQuotation = {
    ...input.quotation,

    leadId,

    bookingId,

    vendorId,

    ...(input.quotation
      .userId
      ? {
          userId:
            requirePrismaQuotationIdentifier(
              input.quotation
                .userId,
              "userId"
            ),
        }
      : {}),
  };

  try {
    const data =
      CompleteQuotationMapper
        .write
        .toCreateData(
          normalizedQuotation,
          {
            quotationNumber,

            referenceId,

            ...(input.identity
              .quotationId
              ? {
                  quotationId:
                    requirePrismaQuotationIdentifier(
                      input.identity
                        .quotationId,
                      "quotationId"
                    ),
                }
              : {}),
          }
        );

    const created =
      await prisma
        .quotation
        .create({
          data,

          include:
            QUOTATION_REPOSITORY_INCLUDE,
        });

    return mapPrismaQuotationToDomain(
      created
    );
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Update Quotation
 * ============================================================================
 */

/**
 * Updates editable Quotation fields.
 *
 * Identity and relationships are intentionally not editable here.
 */
export async function updatePrismaQuotation(
  prisma:
    PrismaQuotationRepositoryClient,
  input:
    UpdateQuotationRepositoryInput
): Promise<
  Quotation | null
> {
  const quotationId =
    requirePrismaQuotationIdentifier(
      input.quotationId,
      "quotationId"
    );

  try {
    /**
     * Avoid relying on Prisma update() throwing P2025 as the
     * only not-found mechanism.
     */
    const existing =
      await prisma
        .quotation
        .findUnique({
          where: {
            id:
              quotationId,
          },

          select: {
            id:
              true,
          },
        });

    if (
      !existing
    ) {
      return null;
    }

    const data =
      CompleteQuotationMapper
        .write
        .toUpdateData(
          input.changes
        );

    await prisma
      .quotation
      .update({
        where: {
          id:
            quotationId,
        },

        data,
      });

    /**
     * Re-read with the complete aggregate relation graph.
     */
    const updated =
      await findPrismaQuotationRecordById(
        prisma,
        quotationId
      );

    if (
      !updated
    ) {
      return null;
    }

    return mapPrismaQuotationToDomain(
      updated
    );
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Update Quotation Status
 * ============================================================================
 */

/**
 * Persists one already-approved Quotation status transition.
 *
 * Status-transition validation belongs to quotation.validator.ts /
 * quotation.service.ts.
 */
export async function updatePrismaQuotationStatus(
  prisma:
    PrismaQuotationRepositoryClient,
  input:
    UpdateQuotationStatusRepositoryInput
): Promise<
  Quotation | null
> {
  const quotationId =
    requirePrismaQuotationIdentifier(
      input.quotationId,
      "quotationId"
    );

  try {
    const existing =
      await prisma
        .quotation
        .findUnique({
          where: {
            id:
              quotationId,
          },

          select: {
            id:
              true,
          },
        });

    if (
      !existing
    ) {
      return null;
    }

    const data =
      CompleteQuotationMapper
        .write
        .toStatusUpdateData(
          input.status
        );

    await prisma
      .quotation
      .update({
        where: {
          id:
            quotationId,
        },

        data,
      });

    const updated =
      await findPrismaQuotationRecordById(
        prisma,
        quotationId
      );

    if (
      !updated
    ) {
      return null;
    }

    return mapPrismaQuotationToDomain(
      updated
    );
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Delete safety check
 * ============================================================================
 */

/**
 * Determines whether a Quotation currently exists before deletion.
 */
export async function prismaQuotationExistsById(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationId:
    QuotationId
): Promise<boolean> {
  const normalizedQuotationId =
    normalizePrismaQuotationString(
      quotationId
    );

  if (
    !normalizedQuotationId
  ) {
    return false;
  }

  try {
    const quotation =
      await prisma
        .quotation
        .findUnique({
          where: {
            id:
              normalizedQuotationId,
          },

          select: {
            id:
              true,
          },
        });

    return Boolean(
      quotation
    );
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Delete Quotation
 * ============================================================================
 */

/**
 * Physically deletes one Quotation.
 *
 * Current schema.prisma does not contain deletedAt / soft-delete fields.
 *
 * NOTE:
 * The service should decide whether deletion is commercially permitted.
 * The repository merely performs persistence.
 */
export async function deletePrismaQuotation(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationId:
    QuotationId
): Promise<
  DeleteQuotationRepositoryResult
> {
  const normalizedQuotationId =
    requirePrismaQuotationIdentifier(
      quotationId,
      "quotationId"
    );

  try {
    const existing =
      await prisma
        .quotation
        .findUnique({
          where: {
            id:
              normalizedQuotationId,
          },

          select: {
            id:
              true,
          },
        });

    if (
      !existing
    ) {
      return {
        quotationId:
          normalizedQuotationId,

        deleted:
          false,
      };
    }

    await prisma
      .quotation
      .delete({
        where: {
          id:
            normalizedQuotationId,
        },
      });

    return {
      quotationId:
        normalizedQuotationId,

      deleted:
        true,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Mutation helper - Create identity validation
 * ============================================================================
 */

/**
 * Lightweight persistence validation for generated identity.
 *
 * Full CreateQuotationInput validation remains in the domain validator.
 */
export function validatePrismaQuotationCreateIdentity(
  identity:
    CreateQuotationRepositoryInput[
      "identity"
    ]
): void {
  requirePrismaQuotationIdentifier(
    identity.quotationNumber,
    "quotationNumber"
  );

  requirePrismaQuotationIdentifier(
    identity.referenceId,
    "referenceId"
  );

  if (
    identity.quotationId !==
      undefined
  ) {
    requirePrismaQuotationIdentifier(
      identity.quotationId,
      "quotationId"
    );
  }
}

/* ============================================================================
 * Mutation helper - Create relations
 * ============================================================================
 */

/**
 * Persistence-level relationship identifiers required for creation.
 *
 * This does NOT prove the related database records exist.
 * Relation existence checks will be implemented in a later part.
 */
export function validatePrismaQuotationCreateRelationIds(
  input:
    CreateQuotationRepositoryInput
): void {
  requirePrismaQuotationIdentifier(
    input.quotation
      .leadId,
    "leadId"
  );

  requirePrismaQuotationIdentifier(
    input.quotation
      .bookingId,
    "bookingId"
  );

  requirePrismaQuotationIdentifier(
    input.quotation
      .vendorId,
    "vendorId"
  );

  if (
    input.quotation
      .userId !==
      undefined
  ) {
    requirePrismaQuotationIdentifier(
      input.quotation
        .userId,
      "userId"
    );
  }
}

/* ============================================================================
 * Safe hydrated mutation read
 * ============================================================================
 */

/**
 * Reusable helper for future mutation operations.
 */
export async function requirePrismaQuotationAfterMutation(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationId:
    QuotationId
): Promise<
  Quotation
> {
  const record =
    await findPrismaQuotationRecordById(
      prisma,
      quotationId
    );

  if (
    !record
  ) {
    throw new QuotationRepositoryError(
      "QUOTATION_NOT_FOUND",
      "Quotation was not found after persistence operation.",
      {
        quotationId,
      }
    );
  }

  return mapPrismaQuotationToDomain(
    record
  );
}

/* ============================================================================
 * Core mutation facade
 * ============================================================================
 */

export const PrismaQuotationMutationRepository = {
  create:
    createPrismaQuotation,

  update:
    updatePrismaQuotation,

  updateStatus:
    updatePrismaQuotationStatus,

  delete:
    deletePrismaQuotation,

  existsById:
    prismaQuotationExistsById,

  requireAfterMutation:
    requirePrismaQuotationAfterMutation,

  validateCreateIdentity:
    validatePrismaQuotationCreateIdentity,

  validateCreateRelationIds:
    validatePrismaQuotationCreateRelationIds,
} as const;

/* ============================================================================
 * End of Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Quotation Repository
 * Part C
 * ============================================================================
 *
 * Read/query operations:
 *
 * - Find by ID
 * - Find by quotation number
 * - Find by reference ID
 * - Find by Booking
 * - Find by Lead
 * - Find by Vendor
 * - Find Vendor quotation for Booking
 * - List/search quotations
 * - Count quotations
 * ============================================================================
 */

/* ============================================================================
 * Additional repository imports
 * ============================================================================
 */

/**
 * Add these types to the existing quotation.repository import block:
 *
 * FindQuotationsByBookingRepositoryQuery
 * FindQuotationsByLeadRepositoryQuery
 * FindQuotationsByVendorRepositoryQuery
 * FindVendorBookingQuotationRepositoryQuery
 * CountQuotationsRepositoryQuery
 */

/* ============================================================================
 * Find by ID
 * ============================================================================
 */

export async function findPrismaQuotationById(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationId:
    QuotationId
): Promise<
  Quotation | null
> {
  const record =
    await findPrismaQuotationRecordById(
      prisma,
      quotationId
    );

  return record
    ? mapPrismaQuotationToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find by quotation number
 * ============================================================================
 */

export async function findPrismaQuotationByNumber(
  prisma:
    PrismaQuotationRepositoryClient,
  quotationNumber:
    string
): Promise<
  Quotation | null
> {
  const record =
    await findPrismaQuotationRecordByNumber(
      prisma,
      quotationNumber
    );

  return record
    ? mapPrismaQuotationToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find by reference ID
 * ============================================================================
 */

export async function findPrismaQuotationByReferenceId(
  prisma:
    PrismaQuotationRepositoryClient,
  referenceId:
    string
): Promise<
  Quotation | null
> {
  const record =
    await findPrismaQuotationRecordByReferenceId(
      prisma,
      referenceId
    );

  return record
    ? mapPrismaQuotationToDomain(
        record
      )
    : null;
}

/* ============================================================================
 * Find Quotations by Booking
 * ============================================================================
 */

export async function findPrismaQuotationsByBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    FindQuotationsByBookingRepositoryQuery
): Promise<
  Quotation[]
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    bookingId,
  };

  const statuses =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statuses
  ) {
    where.status =
      statuses;
  }

  /**
   * includeExpired=false means:
   * validUntil is null OR validUntil >= now
   */
  if (
    query.includeExpired ===
      false
  ) {
    where.AND = [
      {
        OR: [
          {
            validUntil:
              null,
          },
          {
            validUntil: {
              gte:
                new Date(),
            },
          },
        ],
      },
    ];
  }

  const records =
    await findManyPrismaQuotationRecords(
      prisma,
      {
        where,

        orderBy:
          mapQuotationRepositorySortToPrisma(
            query.sort
          ),
      }
    );

  return mapPrismaQuotationsToDomain(
    records
  );
}

/* ============================================================================
 * Find Quotations by Lead
 * ============================================================================
 */

export async function findPrismaQuotationsByLead(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    FindQuotationsByLeadRepositoryQuery
): Promise<
  Quotation[]
> {
  const leadId =
    requirePrismaQuotationIdentifier(
      query.leadId,
      "leadId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    leadId,
  };

  const statuses =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statuses
  ) {
    where.status =
      statuses;
  }

  const records =
    await findManyPrismaQuotationRecords(
      prisma,
      {
        where,

        orderBy:
          mapQuotationRepositorySortToPrisma(
            query.sort
          ),
      }
    );

  return mapPrismaQuotationsToDomain(
    records
  );
}

/* ============================================================================
 * Find Quotations by Vendor
 * ============================================================================
 */

export async function findPrismaQuotationsByVendor(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    FindQuotationsByVendorRepositoryQuery
): Promise<
  QuotationRepositoryPage<
    QuotationListItem
  >
> {
  const vendorId =
    requirePrismaQuotationIdentifier(
      query.vendorId,
      "vendorId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    vendorId,
  };

  const statuses =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statuses
  ) {
    where.status =
      statuses;
  }

  const {
    skip,
    take,
    pagination,
  } =
    mapPrismaQuotationPagination(
      query.pagination
    );

  const [
    records,
    totalItems,
  ] =
    await Promise.all([
      findManyPrismaQuotationRecords(
        prisma,
        {
          where,

          orderBy:
            mapQuotationRepositorySortToPrisma(
              query.sort
            ),

          skip,

          take,
        }
      ),

      countPrismaQuotationRecords(
        prisma,
        where
      ),
    ]);

  const quotations =
    mapPrismaQuotationsToDomain(
      records
    );

  const items =
    quotations.map(
      (
        quotation
      ) =>
        CompleteQuotationMapper
          .read
          .toListItem(
            quotation
          )
    );

  return createPrismaQuotationRepositoryPage(
    items,
    pagination,
    totalItems
  );
}

/* ============================================================================
 * Find Vendor quotation for Booking
 * ============================================================================
 */

export async function findPrismaVendorBookingQuotation(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    FindVendorBookingQuotationRepositoryQuery
): Promise<
  Quotation | null
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  const vendorId =
    requirePrismaQuotationIdentifier(
      query.vendorId,
      "vendorId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    bookingId,
    vendorId,
  };

  const statuses =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statuses
  ) {
    where.status =
      statuses;
  }

  try {
    const record =
      await prisma
        .quotation
        .findFirst({
          where,

          orderBy: {
            createdAt:
              "desc",
          },

          include:
            QUOTATION_REPOSITORY_INCLUDE,
        });

    return record
      ? mapPrismaQuotationToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * List / Search Quotations
 * ============================================================================
 */

export async function listPrismaQuotations(
  prisma:
    PrismaQuotationRepositoryClient,
  query?:
    QuotationRepositoryListQuery
): Promise<
  QuotationRepositoryPage<
    QuotationListItem
  >
> {
  const where =
    mapQuotationRepositoryFilterToPrismaWhere(
      query?.filter
    );

  const {
    skip,
    take,
    pagination,
  } =
    mapPrismaQuotationPagination(
      query?.pagination
    );

  const orderBy =
    mapQuotationRepositorySortToPrisma(
      query?.sort
    );

  const [
    records,
    totalItems,
  ] =
    await Promise.all([
      findManyPrismaQuotationRecords(
        prisma,
        {
          where,
          orderBy,
          skip,
          take,
        }
      ),

      countPrismaQuotationRecords(
        prisma,
        where
      ),
    ]);

  const quotations =
    mapPrismaQuotationsToDomain(
      records
    );

  const items =
    quotations.map(
      (
        quotation
      ) =>
        CompleteQuotationMapper
          .read
          .toListItem(
            quotation
          )
    );

  return createPrismaQuotationRepositoryPage(
    items,
    pagination,
    totalItems
  );
}

/* ============================================================================
 * Count Quotations
 * ============================================================================
 */

export async function countPrismaQuotations(
  prisma:
    PrismaQuotationRepositoryClient,
  query?:
    CountQuotationsRepositoryQuery
): Promise<number> {
  const where =
    mapQuotationRepositoryFilterToPrismaWhere(
      query?.filter
    );

  return countPrismaQuotationRecords(
    prisma,
    where
  );
}

/* ============================================================================
 * Generic "any" helper
 * ============================================================================
 */

export async function anyPrismaQuotation(
  prisma:
    PrismaQuotationRepositoryClient,
  filter?:
    QuotationRepositoryFilter
): Promise<boolean> {
  const count =
    await countPrismaQuotationRecords(
      prisma,
      mapQuotationRepositoryFilterToPrismaWhere(
        filter
      )
    );

  return count >
    0;
}

/* ============================================================================
 * Lookup facade
 * ============================================================================
 */

export const PrismaQuotationQueryRepository = {
  findById:
    findPrismaQuotationById,

  findByQuotationNumber:
    findPrismaQuotationByNumber,

  findByReferenceId:
    findPrismaQuotationByReferenceId,

  findByBooking:
    findPrismaQuotationsByBooking,

  findByLead:
    findPrismaQuotationsByLead,

  findByVendor:
    findPrismaQuotationsByVendor,

  findVendorBookingQuotation:
    findPrismaVendorBookingQuotation,

  list:
    listPrismaQuotations,

  count:
    countPrismaQuotations,

  any:
    anyPrismaQuotation,
} as const;

/* ============================================================================
 * End of Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Quotation Repository
 * Part D
 * ============================================================================
 *
 * Relation and selection operations:
 *
 * - Check Lead
 * - Check Booking
 * - Check Vendor
 * - Check User
 * - Check all Quotation relations
 * - Check quotation identity uniqueness
 * - Select Quotation for Booking
 * - Unselect Quotation from Booking
 * - Find selected Quotation
 * - Count Booking quotations
 *
 * IMPORTANT:
 * - Vendor commercial eligibility remains a service concern
 * - Booking/Lead business compatibility remains a service concern
 * - Repository exposes persisted facts only
 * - Selection is owned by Booking.selectedQuotation relation
 * ============================================================================
 */

/* ============================================================================
 * Lead existence
 * ============================================================================
 */

export async function checkPrismaQuotationLead(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CheckQuotationLeadRepositoryQuery
): Promise<
  QuotationLeadExistenceResult
> {
  const leadId =
    requirePrismaQuotationIdentifier(
      query.leadId,
      "leadId"
    );

  try {
    const lead =
      await prisma.lead.findUnique({
        where: {
          id:
            leadId,
        },

        select: {
          id:
            true,

          referenceId:
            true,
        },
      });

    if (
      !lead
    ) {
      return {
        exists:
          false,

        leadId,
      };
    }

    return {
      exists:
        true,

      leadId:
        lead.id,

      referenceId:
        lead.referenceId,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Booking existence
 * ============================================================================
 */

export async function checkPrismaQuotationBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CheckQuotationBookingRepositoryQuery
): Promise<
  QuotationBookingExistenceResult
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  try {
    const booking =
      await prisma.booking.findUnique({
        where: {
          id:
            bookingId,
        },

        select: {
          id:
            true,

          leadId:
            true,

          bookingNumber:
            true,

          selectedQuotationId:
            true,
        },
      });

    if (
      !booking
    ) {
      return {
        exists:
          false,

        bookingId,
      };
    }

    return {
      exists:
        true,

      bookingId:
        booking.id,

      leadId:
        booking.leadId,

      bookingNumber:
        booking.bookingNumber,

      ...(booking.selectedQuotationId
        ? {
            selectedQuotationId:
              booking.selectedQuotationId,
          }
        : {}),
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Vendor existence
 * ============================================================================
 */

export async function checkPrismaQuotationVendor(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CheckQuotationVendorRepositoryQuery
): Promise<
  QuotationVendorExistenceResult
> {
  const vendorId =
    requirePrismaQuotationIdentifier(
      query.vendorId,
      "vendorId"
    );

  try {
    const vendor =
      await prisma.vendor.findUnique({
        where: {
          id:
            vendorId,
        },

        select: {
          id:
            true,

          companyName:
            true,
        },
      });

    if (
      !vendor
    ) {
      return {
        exists:
          false,

        vendorId,
      };
    }

    return {
      exists:
        true,

      vendorId:
        vendor.id,

      companyName:
        vendor.companyName,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * User existence
 * ============================================================================
 */

export async function checkPrismaQuotationUser(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CheckQuotationUserRepositoryQuery
): Promise<
  QuotationUserExistenceResult
> {
  const userId =
    requirePrismaQuotationIdentifier(
      query.userId,
      "userId"
    );

  try {
    const user =
      await prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id:
            true,
        },
      });

    return {
      exists:
        Boolean(
          user
        ),

      userId,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Combined relation checks
 * ============================================================================
 */

/**
 * Loads all persisted relation facts required before a Quotation
 * may be created.
 *
 * This function does NOT reject mismatches itself.
 *
 * Example:
 *
 * booking.leadId !== supplied leadId
 *
 * is returned as persisted information and the service layer decides
 * that the business relationship is invalid.
 */
export async function checkPrismaQuotationRelations(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CheckQuotationRelationsRepositoryQuery
): Promise<
  CheckQuotationRelationsRepositoryResult
> {
  const [
    lead,
    booking,
    vendor,
    user,
  ] =
    await Promise.all([
      checkPrismaQuotationLead(
        prisma,
        {
          leadId:
            query.leadId,
        }
      ),

      checkPrismaQuotationBooking(
        prisma,
        {
          bookingId:
            query.bookingId,
        }
      ),

      checkPrismaQuotationVendor(
        prisma,
        {
          vendorId:
            query.vendorId,
        }
      ),

      query.userId
        ? checkPrismaQuotationUser(
            prisma,
            {
              userId:
                query.userId,
            }
          )
        : Promise.resolve(
            undefined
          ),
    ]);

  return {
    lead,

    booking,

    vendor,

    ...(user
      ? {
          user,
        }
      : {}),
  };
}

/* ============================================================================
 * Quotation uniqueness
 * ============================================================================
 */

export async function checkPrismaQuotationUniqueness(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    QuotationRepositoryUniquenessQuery
): Promise<
  QuotationRepositoryUniquenessResult
> {
  const quotationNumber =
    normalizePrismaQuotationString(
      query.quotationNumber
    );

  const referenceId =
    normalizePrismaQuotationString(
      query.referenceId
    );

  const excludeQuotationId =
    normalizePrismaQuotationString(
      query.excludeQuotationId
    );

  if (
    !quotationNumber &&
    !referenceId
  ) {
    return {
      exists:
        false,
    };
  }

  const OR:
    Prisma.QuotationWhereInput[] =
      [];

  if (
    quotationNumber
  ) {
    OR.push({
      quotationNumber,
    });
  }

  if (
    referenceId
  ) {
    OR.push({
      referenceId,
    });
  }

  const where:
    Prisma.QuotationWhereInput = {
    OR,
  };

  if (
    excludeQuotationId
  ) {
    where.id = {
      not:
        excludeQuotationId,
    };
  }

  try {
    const quotation =
      await prisma.quotation.findFirst({
        where,

        select: {
          id:
            true,

          quotationNumber:
            true,

          referenceId:
            true,
        },
      });

    if (
      !quotation
    ) {
      return {
        exists:
          false,
      };
    }

    if (
      quotationNumber &&
      quotation.quotationNumber ===
        quotationNumber
    ) {
      return {
        exists:
          true,

        quotationId:
          quotation.id,

        matchedField:
          "quotationNumber",
      };
    }

    if (
      referenceId &&
      quotation.referenceId ===
        referenceId
    ) {
      return {
        exists:
          true,

        quotationId:
          quotation.id,

        matchedField:
          "referenceId",
      };
    }

    return {
      exists:
        true,

      quotationId:
        quotation.id,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Selection relationship verification
 * ============================================================================
 */

/**
 * Confirms that a Quotation belongs to the Booking that is attempting
 * to select it.
 *
 * This is persistence integrity, not quotation business eligibility.
 */
export async function verifyPrismaQuotationBelongsToBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  bookingId:
    string,
  quotationId:
    string
): Promise<boolean> {
  const normalizedBookingId =
    requirePrismaQuotationIdentifier(
      bookingId,
      "bookingId"
    );

  const normalizedQuotationId =
    requirePrismaQuotationIdentifier(
      quotationId,
      "quotationId"
    );

  try {
    const quotation =
      await prisma.quotation.findFirst({
        where: {
          id:
            normalizedQuotationId,

          bookingId:
            normalizedBookingId,
        },

        select: {
          id:
            true,
        },
      });

    return Boolean(
      quotation
    );
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Select Quotation for Booking
 * ============================================================================
 */

/**
 * Persists quotation selection.
 *
 * Prisma ownership:
 *
 * Booking.selectedQuotation
 *      ↓
 * Quotation.selectedForBooking
 *
 * The Booking side owns the foreign key.
 */
export async function selectPrismaQuotationForBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  input:
    SelectBookingQuotationRepositoryInput
): Promise<
  BookingQuotationSelectionRepositoryResult
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      input.bookingId,
      "bookingId"
    );

  const quotationId =
    requirePrismaQuotationIdentifier(
      input.quotationId,
      "quotationId"
    );

  try {
    const booking =
      await prisma.booking.findUnique({
        where: {
          id:
            bookingId,
        },

        select: {
          id:
            true,

          selectedQuotationId:
            true,
        },
      });

    if (
      !booking
    ) {
      throw new QuotationRepositoryError(
        "BOOKING_NOT_FOUND",
        "Booking was not found.",
        {
          bookingId,
        }
      );
    }

    const belongsToBooking =
      await verifyPrismaQuotationBelongsToBooking(
        prisma,
        bookingId,
        quotationId
      );

    if (
      !belongsToBooking
    ) {
      throw new QuotationRepositoryError(
        "RELATION_MISMATCH",
        "Quotation does not belong to the supplied Booking.",
        {
          bookingId,
          quotationId,
        }
      );
    }

    /**
     * Selecting the quotation already selected is idempotent.
     */
    if (
      booking.selectedQuotationId ===
        quotationId
    ) {
      return {
        bookingId,

        selectedQuotationId:
          quotationId,

        changed:
          false,
      };
    }

    await prisma.booking.update({
      where: {
        id:
          bookingId,
      },

      data: {
        selectedQuotation: {
          connect: {
            id:
              quotationId,
          },
        },
      },
    });

    return {
      bookingId,

      selectedQuotationId:
        quotationId,

      changed:
        true,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Unselect Quotation for Booking
 * ============================================================================
 */

export async function unselectPrismaQuotationForBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  input:
    UnselectBookingQuotationRepositoryInput
): Promise<
  BookingQuotationSelectionRepositoryResult
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      input.bookingId,
      "bookingId"
    );

  try {
    const booking =
      await prisma.booking.findUnique({
        where: {
          id:
            bookingId,
        },

        select: {
          id:
            true,

          selectedQuotationId:
            true,
        },
      });

    if (
      !booking
    ) {
      throw new QuotationRepositoryError(
        "BOOKING_NOT_FOUND",
        "Booking was not found.",
        {
          bookingId,
        }
      );
    }

    if (
      !booking.selectedQuotationId
    ) {
      return {
        bookingId,

        changed:
          false,
      };
    }

    await prisma.booking.update({
      where: {
        id:
          bookingId,
      },

      data: {
        selectedQuotation: {
          disconnect:
            true,
        },
      },
    });

    return {
      bookingId,

      changed:
        true,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Find selected Quotation for Booking
 * ============================================================================
 */

export async function findPrismaSelectedQuotationForBooking(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    FindSelectedQuotationRepositoryQuery
): Promise<
  Quotation | null
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  try {
    const record =
      await prisma.quotation.findFirst({
        where: {
          bookingId,

          selectedForBooking: {
            is: {
              id:
                bookingId,
            },
          },
        },

        include:
          QUOTATION_REPOSITORY_INCLUDE,
      });

    return record
      ? mapPrismaQuotationToDomain(
          record
        )
      : null;
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Count Booking Quotations
 * ============================================================================
 */

export async function countPrismaBookingQuotations(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    CountBookingQuotationsRepositoryQuery
): Promise<number> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    bookingId,
  };

  const statuses =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statuses
  ) {
    where.status =
      statuses;
  }

  return countPrismaQuotationRecords(
    prisma,
    where
  );
}

/* ============================================================================
 * Relation repository facade
 * ============================================================================
 */

export const PrismaQuotationRelationRepository = {
  checkLead:
    checkPrismaQuotationLead,

  checkBooking:
    checkPrismaQuotationBooking,

  checkVendor:
    checkPrismaQuotationVendor,

  checkUser:
    checkPrismaQuotationUser,

  checkRelations:
    checkPrismaQuotationRelations,

  checkUniqueness:
    checkPrismaQuotationUniqueness,

  quotationBelongsToBooking:
    verifyPrismaQuotationBelongsToBooking,

  countByBooking:
    countPrismaBookingQuotations,
} as const;

/* ============================================================================
 * Selection repository facade
 * ============================================================================
 */

export const PrismaQuotationSelectionRepository = {
  select:
    selectPrismaQuotationForBooking,

  unselect:
    unselectPrismaQuotationForBooking,

  findSelected:
    findPrismaSelectedQuotationForBooking,
} as const;

/* ============================================================================
 * End of Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Prisma Quotation Repository
 * Part E
 * ============================================================================
 *
 * Final Prisma repository implementation.
 *
 * Responsibilities:
 * - Generic Quotation existence checks
 * - Booking quotation amount summary
 * - Quotation statistics
 * - Repository health check
 * - Concrete PrismaQuotationRepository class
 * - Prisma transaction manager
 * - Repository factories/module composition
 *
 * This completes:
 *
 * domains/quotation/repositories/quotation.prisma.repository.ts
 * ============================================================================
 */

/* ============================================================================
 * Generic existence check
 * ============================================================================
 */

/**
 * Checks whether a Quotation exists by one of its supported unique
 * identifiers.
 *
 * Priority:
 *
 * quotationId
 * quotationNumber
 * referenceId
 */
export async function checkPrismaQuotationExistence(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    QuotationRepositoryExistenceQuery
): Promise<
  QuotationRepositoryExistenceResult
> {
  const quotationId =
    normalizePrismaQuotationString(
      query.quotationId
    );

  const quotationNumber =
    normalizePrismaQuotationString(
      query.quotationNumber
    );

  const referenceId =
    normalizePrismaQuotationString(
      query.referenceId
    );

  if (
    !quotationId &&
    !quotationNumber &&
    !referenceId
  ) {
    throw new QuotationRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "At least one Quotation identifier is required.",
      {
        field:
          "quotationId|quotationNumber|referenceId",
      }
    );
  }

  try {
    const OR:
      Prisma.QuotationWhereInput[] =
        [];

    if (
      quotationId
    ) {
      OR.push({
        id:
          quotationId,
      });
    }

    if (
      quotationNumber
    ) {
      OR.push({
        quotationNumber,
      });
    }

    if (
      referenceId
    ) {
      OR.push({
        referenceId,
      });
    }

    const quotation =
      await prisma.quotation.findFirst({
        where: {
          OR,
        },

        select: {
          id:
            true,
        },
      });

    if (
      !quotation
    ) {
      return {
        exists:
          false,
      };
    }

    return {
      exists:
        true,

      quotationId:
        quotation.id,
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Booking quotation amount summary
 * ============================================================================
 */

/**
 * Calculates persisted quotation summary information used by Booking.
 *
 * No business-status filtering is assumed automatically.
 *
 * The service may provide statuses when it wants only commercially active
 * quotations included.
 */
export async function getPrismaBookingQuotationSummary(
  prisma:
    PrismaQuotationRepositoryClient,
  query:
    GetBookingQuotationSummaryRepositoryQuery
): Promise<
  QuotationRepositoryAmountSummary
> {
  const bookingId =
    requirePrismaQuotationIdentifier(
      query.bookingId,
      "bookingId"
    );

  const where:
    Prisma.QuotationWhereInput = {
    bookingId,
  };

  const statusFilter =
    mapQuotationStatusesToPrismaWhere(
      query.statuses
    );

  if (
    statusFilter
  ) {
    where.status =
      statusFilter;
  }

  try {
    const records =
      await prisma.quotation.findMany({
        where,

        select: {
          id:
            true,

          totalAmount:
            true,

          selectedForBooking: {
            select: {
              id:
                true,
            },
          },
        },
      });

    const totalQuotations =
      records.length;

    if (
      totalQuotations ===
        0
    ) {
      return {
        bookingId,

        totalQuotations:
          0,
      };
    }

    const amounts =
      records.map(
        (
          record
        ) =>
          Number(
            record.totalAmount
          )
      );

    const lowestAmount =
      Math.min(
        ...amounts
      );

    const highestAmount =
      Math.max(
        ...amounts
      );

    const selected =
      records.find(
        (
          record
        ) =>
          Boolean(
            record.selectedForBooking
          )
      );

    return {
      bookingId,

      totalQuotations,

      lowestAmount,

      highestAmount,

      ...(selected
        ? {
            selectedQuotationId:
              selected.id,

            selectedAmount:
              Number(
                selected.totalAmount
              ),
          }
        : {}),
    };
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Quotation statistics
 * ============================================================================
 */

/**
 * Computes repository-level statistics.
 *
 * We intentionally calculate these values from a narrow select rather
 * than coupling the domain contract to Prisma aggregate return types.
 */
export async function getPrismaQuotationStatistics(
  prisma:
    PrismaQuotationRepositoryClient,
  query?:
    GetQuotationRepositoryStatisticsQuery
): Promise<
  QuotationRepositoryStatistics
> {
  const where =
    mapQuotationRepositoryFilterToPrismaWhere(
      query?.filter
    );

  try {
    const records =
      await prisma.quotation.findMany({
        where,

        select: {
          status:
            true,

          totalAmount:
            true,

          selectedForBooking: {
            select: {
              id:
                true,
            },
          },
        },
      });

    const total =
      records.length;

    let selected =
      0;

    const statusCounter =
      new Map<
        QuotationStatus,
        number
      >();

    const amounts:
      number[] =
        [];

    for (
      const record
      of records
    ) {
      if (
        record.selectedForBooking
      ) {
        selected +=
          1;
      }

      const domainStatus =
  mapQuotationStatus(
    record.status
  );

/**
 * Count every persisted quotation status.
 *
 * The previous implementation created statusCounter
 * but never incremented it, causing all domain
 * status statistics to return zero.
 */
statusCounter.set(
  domainStatus,
  (
    statusCounter.get(
      domainStatus
    ) ??
    0
  ) +
    1
);

const amount =
  Number(
    record.totalAmount
  );

      if (
        Number.isFinite(
          amount
        )
      ) {
        amounts.push(
          amount
        );
      }
    }

    const statusCounts:
      QuotationRepositoryStatusCount[] =
        Array.from(
          statusCounter.entries()
        ).map(
          (
            [
              status,
              count,
            ]
          ) => ({
            status,
            count,
          })
        );

    const result:
      QuotationRepositoryStatistics = {
      total,

      selected,

      unselected:
        Math.max(
          0,
          total -
            selected
        ),

      statusCounts,
    };

    if (
      amounts.length >
        0
    ) {
      const minimumAmount =
        Math.min(
          ...amounts
        );

      const maximumAmount =
        Math.max(
          ...amounts
        );

      const totalAmount =
        amounts.reduce(
          (
            sum,
            amount
          ) =>
            sum +
            amount,
          0
        );

      result.minimumAmount =
        Math.round(
          (
            minimumAmount +
            Number.EPSILON
          ) *
            100
        ) /
        100;

      result.maximumAmount =
        Math.round(
          (
            maximumAmount +
            Number.EPSILON
          ) *
            100
        ) /
        100;

      result.averageAmount =
        Math.round(
          (
            totalAmount /
              amounts.length +
            Number.EPSILON
          ) *
            100
        ) /
        100;
    }

    return result;
  } catch (
    error
  ) {
    throw normalizePrismaQuotationRepositoryError(
      error
    );
  }
}

/* ============================================================================
 * Repository health check
 * ============================================================================
 */

export async function checkPrismaQuotationRepositoryHealth(
  prisma:
    PrismaQuotationRepositoryClient
): Promise<
  QuotationRepositoryHealthResult
> {
  const startedAt =
    Date.now();

  try {
    /**
     * A lightweight count verifies that:
     *
     * - Prisma client is available
     * - database connection works
     * - Quotation table is queryable
     */
    await prisma.quotation.count({
      take:
        1,
    });

    return {
      healthy:
        true,

      checkedAt:
        new Date(),

      latencyMilliseconds:
        calculatePrismaQuotationLatency(
          startedAt
        ),

      message:
        "Quotation repository is healthy.",
    };
  } catch (
    error
  ) {
    return {
      healthy:
        false,

      checkedAt:
        new Date(),

      latencyMilliseconds:
        calculatePrismaQuotationLatency(
          startedAt
        ),

      message:
        error instanceof
          Error
          ? error.message
          : "Quotation repository health check failed.",
    };
  }
}

/* ============================================================================
 * Prisma repository capability report
 * ============================================================================
 */

export function getPrismaQuotationRepositoryCapabilityReport():
  QuotationRepositoryCapabilityReport {
  return {
    ...COMPLETE_QUOTATION_REPOSITORY_CAPABILITIES,

    transactionSupport:
      true,

    relationChecks:
      true,

    uniquenessChecks:
      true,

    bookingSelection:
      true,

    statistics:
      true,

    healthCheck:
      true,
  };
}

/* ============================================================================
 * Concrete PrismaQuotationRepository
 * ============================================================================
 */

/**
 * Concrete implementation of the Quotation persistence port.
 *
 * Service code should depend on QuotationRepositoryPort rather than
 * directly depending on this class.
 */
export class PrismaQuotationRepository
  implements CompleteQuotationRepository {
  constructor(
    private readonly prisma:
      PrismaQuotationRepositoryClient
  ) {}

  /* ------------------------------------------------------------------------
   * Create
   * ------------------------------------------------------------------------
   */

  create(
    input:
      CreateQuotationRepositoryInput
  ): Promise<
    Quotation
  > {
    return createPrismaQuotation(
      this.prisma,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Update
   * ------------------------------------------------------------------------
   */

  update(
    input:
      UpdateQuotationRepositoryInput
  ): Promise<
    Quotation | null
  > {
    return updatePrismaQuotation(
      this.prisma,
      input
    );
  }

  updateStatus(
    input:
      UpdateQuotationStatusRepositoryInput
  ): Promise<
    Quotation | null
  > {
    return updatePrismaQuotationStatus(
      this.prisma,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Find one
   * ------------------------------------------------------------------------
   */

  findById(
    quotationId:
      QuotationId
  ): Promise<
    Quotation | null
  > {
    return findPrismaQuotationById(
      this.prisma,
      quotationId
    );
  }

  findByQuotationNumber(
    quotationNumber:
      string
  ): Promise<
    Quotation | null
  > {
    return findPrismaQuotationByNumber(
      this.prisma,
      quotationNumber
    );
  }

  findByReferenceId(
    referenceId:
      string
  ): Promise<
    Quotation | null
  > {
    return findPrismaQuotationByReferenceId(
      this.prisma,
      referenceId
    );
  }

  /* ------------------------------------------------------------------------
   * Relations
   * ------------------------------------------------------------------------
   */

  findByBookingId(
    query:
      FindQuotationsByBookingRepositoryQuery
  ): Promise<
    Quotation[]
  > {
    return findPrismaQuotationsByBooking(
      this.prisma,
      query
    );
  }

  findByLeadId(
    query:
      FindQuotationsByLeadRepositoryQuery
  ): Promise<
    Quotation[]
  > {
    return findPrismaQuotationsByLead(
      this.prisma,
      query
    );
  }

  findByVendorId(
    query:
      FindQuotationsByVendorRepositoryQuery
  ): Promise<
    QuotationRepositoryPage<
      QuotationListItem
    >
  > {
    return findPrismaQuotationsByVendor(
      this.prisma,
      query
    );
  }

  findVendorBookingQuotation(
    query:
      FindVendorBookingQuotationRepositoryQuery
  ): Promise<
    Quotation | null
  > {
    return findPrismaVendorBookingQuotation(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * List / search
   * ------------------------------------------------------------------------
   */

  list(
    query?:
      QuotationRepositoryListQuery
  ): Promise<
    QuotationRepositoryPage<
      QuotationListItem
    >
  > {
    return listPrismaQuotations(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Existence / count
   * ------------------------------------------------------------------------
   */

  exists(
    query:
      QuotationRepositoryExistenceQuery
  ): Promise<
    QuotationRepositoryExistenceResult
  > {
    return checkPrismaQuotationExistence(
      this.prisma,
      query
    );
  }

  count(
    query?:
      CountQuotationsRepositoryQuery
  ): Promise<number> {
    return countPrismaQuotations(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Booking commercial aggregation
   * ------------------------------------------------------------------------
   */

  getBookingQuotationSummary(
    query:
      GetBookingQuotationSummaryRepositoryQuery
  ): Promise<
    QuotationRepositoryAmountSummary
  > {
    return getPrismaBookingQuotationSummary(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Delete
   * ------------------------------------------------------------------------
   */

  delete(
    quotationId:
      QuotationId
  ): Promise<
    DeleteQuotationRepositoryResult
  > {
    return deletePrismaQuotation(
      this.prisma,
      quotationId
    );
  }

  /* ------------------------------------------------------------------------
   * Relation checks
   * ------------------------------------------------------------------------
   */

  checkLead(
    query:
      CheckQuotationLeadRepositoryQuery
  ): Promise<
    QuotationLeadExistenceResult
  > {
    return checkPrismaQuotationLead(
      this.prisma,
      query
    );
  }

  checkBooking(
    query:
      CheckQuotationBookingRepositoryQuery
  ): Promise<
    QuotationBookingExistenceResult
  > {
    return checkPrismaQuotationBooking(
      this.prisma,
      query
    );
  }

  checkVendor(
    query:
      CheckQuotationVendorRepositoryQuery
  ): Promise<
    QuotationVendorExistenceResult
  > {
    return checkPrismaQuotationVendor(
      this.prisma,
      query
    );
  }

  checkUser(
    query:
      CheckQuotationUserRepositoryQuery
  ): Promise<
    QuotationUserExistenceResult
  > {
    return checkPrismaQuotationUser(
      this.prisma,
      query
    );
  }

  checkRelations(
    query:
      CheckQuotationRelationsRepositoryQuery
  ): Promise<
    CheckQuotationRelationsRepositoryResult
  > {
    return checkPrismaQuotationRelations(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Uniqueness
   * ------------------------------------------------------------------------
   */

  checkUniqueness(
    query:
      QuotationRepositoryUniquenessQuery
  ): Promise<
    QuotationRepositoryUniquenessResult
  > {
    return checkPrismaQuotationUniqueness(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Selection
   * ------------------------------------------------------------------------
   */

  selectForBooking(
    input:
      SelectBookingQuotationRepositoryInput,
    _context?:
      QuotationRepositoryMutationContext
  ): Promise<
    BookingQuotationSelectionRepositoryResult
  > {
    return selectPrismaQuotationForBooking(
      this.prisma,
      input
    );
  }

  unselectForBooking(
    input:
      UnselectBookingQuotationRepositoryInput,
    _context?:
      QuotationRepositoryMutationContext
  ): Promise<
    BookingQuotationSelectionRepositoryResult
  > {
    return unselectPrismaQuotationForBooking(
      this.prisma,
      input
    );
  }

  findSelectedForBooking(
    query:
      FindSelectedQuotationRepositoryQuery
  ): Promise<
    Quotation | null
  > {
    return findPrismaSelectedQuotationForBooking(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Booking quotation count
   * ------------------------------------------------------------------------
   */

  countByBooking(
    query:
      CountBookingQuotationsRepositoryQuery
  ): Promise<number> {
    return countPrismaBookingQuotations(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Statistics
   * ------------------------------------------------------------------------
   */

  getStatistics(
    query?:
      GetQuotationRepositoryStatisticsQuery
  ): Promise<
    QuotationRepositoryStatistics
  > {
    return getPrismaQuotationStatistics(
      this.prisma,
      query
    );
  }

  /* ------------------------------------------------------------------------
   * Health
   * ------------------------------------------------------------------------
   */

  checkHealth():
    Promise<
      QuotationRepositoryHealthResult
    > {
    return checkPrismaQuotationRepositoryHealth(
      this.prisma
    );
  }
}

/* ============================================================================
 * Prisma transaction manager
 * ============================================================================
 */

export class PrismaQuotationRepositoryTransactionManager
  implements
    QuotationRepositoryPortTransactionManager {
  constructor(
    private readonly prisma:
      PrismaClient
  ) {}

  async runInTransaction<T>(
  callback:
    QuotationRepositoryTransactionCallback<T>
): Promise<T> {
    try {
      return await this.prisma.$transaction(
  async (transaction) =>
    callback({
      repository:
        new PrismaQuotationRepository(
          transaction
      ),
        }),
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  } catch (
    error
  ) {
      /**
       * Service/domain errors may intentionally abort the transaction.
       *
       * Example:
       * SELECTED_QUOTATION_MUTATION_BLOCKED
       *
       * Preserve these errors so they can later map to the correct
       * HTTP/business response instead of being converted into 503.
       */
      if (
        error instanceof
          Error &&
        error.name ===
          "QuotationServiceError"
      ) {
        throw error;
      }

      /**
       * Already-classified repository errors should not be wrapped
       * again as TRANSACTION_FAILED.
       */
      if (
        error instanceof
          QuotationRepositoryError
      ) {
        throw error;
      }

      /**
       * Only genuine Prisma / infrastructure failures become
       * TRANSACTION_FAILED.
       */
      const normalizedError =
        normalizePrismaQuotationRepositoryError(
          error
        );

      throw new QuotationRepositoryError(
        "TRANSACTION_FAILED",
        normalizedError.message,
        {
          cause:
            error,
        }
      );
    }
  }
}
/* ============================================================================
 * Prisma repository dependencies
 * ============================================================================
 */

export interface PrismaQuotationRepositoryDependencies {
  prisma:
    PrismaClient;
}

/* ============================================================================
 * Dependency guard
 * ============================================================================
 */

export function requirePrismaQuotationRepositoryClient(
  dependencies:
    PrismaQuotationRepositoryDependencies
): PrismaClient {
  if (
    !dependencies.prisma
  ) {
    throw new QuotationRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "A PrismaClient instance is required to create the Quotation repository.",
      {
        field:
          "prisma",
      }
    );
  }

  return dependencies.prisma;
}

/* ============================================================================
 * Repository factory
 * ============================================================================
 */

export function createPrismaQuotationRepository(
  dependencies:
    PrismaQuotationRepositoryDependencies
): QuotationRepositoryPort {
  const prisma =
    requirePrismaQuotationRepositoryClient(
      dependencies
    );

  return new PrismaQuotationRepository(
    prisma
  );
}

/* ============================================================================
 * Transaction manager factory
 * ============================================================================
 */

export function createPrismaQuotationRepositoryTransactionManager(
  dependencies:
    PrismaQuotationRepositoryDependencies
): QuotationRepositoryPortTransactionManager {
  const prisma =
    requirePrismaQuotationRepositoryClient(
      dependencies
    );

  return new PrismaQuotationRepositoryTransactionManager(
    prisma
  );
}

/* ============================================================================
 * Prisma Quotation repository module
 * ============================================================================
 */

export function createPrismaQuotationRepositoryModule(
  dependencies:
    PrismaQuotationRepositoryDependencies
): QuotationRepositoryModule {
  const prisma =
    requirePrismaQuotationRepositoryClient(
      dependencies
    );

  return {
    repository:
      new PrismaQuotationRepository(
        prisma
      ),

    transactionManager:
      new PrismaQuotationRepositoryTransactionManager(
        prisma
      ),

    capabilities:
      getPrismaQuotationRepositoryCapabilityReport(),
  };
}

/* ============================================================================
 * Final repository facade
 * ============================================================================
 */

export const PrismaQuotationRepositoryFacade = {
  /* Mutation */

  create:
    createPrismaQuotation,

  update:
    updatePrismaQuotation,

  updateStatus:
    updatePrismaQuotationStatus,

  delete:
    deletePrismaQuotation,

  /* Read */

  findById:
    findPrismaQuotationById,

  findByQuotationNumber:
    findPrismaQuotationByNumber,

  findByReferenceId:
    findPrismaQuotationByReferenceId,

  findByBooking:
    findPrismaQuotationsByBooking,

  findByLead:
    findPrismaQuotationsByLead,

  findByVendor:
    findPrismaQuotationsByVendor,

  findVendorBookingQuotation:
    findPrismaVendorBookingQuotation,

  list:
    listPrismaQuotations,

  count:
    countPrismaQuotations,

  exists:
    checkPrismaQuotationExistence,

  /* Relations */

  checkLead:
    checkPrismaQuotationLead,

  checkBooking:
    checkPrismaQuotationBooking,

  checkVendor:
    checkPrismaQuotationVendor,

  checkUser:
    checkPrismaQuotationUser,

  checkRelations:
    checkPrismaQuotationRelations,

  checkUniqueness:
    checkPrismaQuotationUniqueness,

  /* Booking selection */

  selectForBooking:
    selectPrismaQuotationForBooking,

  unselectForBooking:
    unselectPrismaQuotationForBooking,

  findSelectedForBooking:
    findPrismaSelectedQuotationForBooking,

  countByBooking:
    countPrismaBookingQuotations,

  getBookingSummary:
    getPrismaBookingQuotationSummary,

  /* Reporting */

  getStatistics:
    getPrismaQuotationStatistics,

  checkHealth:
    checkPrismaQuotationRepositoryHealth,

  /* Factory */

  createRepository:
    createPrismaQuotationRepository,

  createTransactionManager:
    createPrismaQuotationRepositoryTransactionManager,

  createModule:
    createPrismaQuotationRepositoryModule,
} as const;

/* ============================================================================
 * End of quotation.prisma.repository.ts
 * ============================================================================
 */