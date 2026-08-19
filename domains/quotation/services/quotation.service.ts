/**
 * ============================================================================
 * EasyMovers
 * Quotation Service
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/services/quotation.service.ts
 *
 * Responsibilities in Part A:
 *
 * - Define Quotation service result/error contracts
 * - Define service dependencies
 * - Normalize repository errors
 * - Generate quotationNumber and referenceId
 * - Validate CreateQuotationInput
 * - Verify Lead / Booking / Vendor / User persistence relations
 * - Verify Booking belongs to supplied Lead
 * - Prevent duplicate active Vendor quotations for one Booking
 * - Check generated identity uniqueness
 * - Create the Quotation through the repository
 *
 * Later parts will implement:
 *
 * - Read operations
 * - Update quotation
 * - Status transitions
 * - Selection / unselection
 * - Withdrawal / rejection
 * - Booking quotation comparison
 * - Booking quotation summary synchronization
 * - Search / list
 * - Statistics
 *
 * IMPORTANT:
 *
 * This service owns BUSINESS rules.
 *
 * It must not:
 * - Import Prisma
 * - Perform direct database queries
 * - Handle Next.js Request / Response
 * - Expose Vendor identity through customer-safe responses
 * ============================================================================
 */

import {
  QuotationStatus,
  isEditableQuotationStatus,
} from "../models/quotation.model";

import type {
  BookingId,
  BookingQuotationComparison,
  CreateQuotationInput,
  CustomerSafeQuotation,
  PaginatedQuotationResult,
  Quotation,
  QuotationId,
  QuotationListItem,
  QuotationListQuery,
  QuotationNumber,
  QuotationReferenceId,
  QuotationSort,
QuotationStatistics,
  RejectQuotationInput,
  SelectQuotationInput,
  UnselectQuotationInput,
  UpdateQuotationInput,
  UpdateQuotationStatusInput,
  WithdrawQuotationInput,
} from "../models/quotation.model";

import {
  calculateQuotationTotal,
  validateCompleteCreateQuotationInput,
  validateQuotationListQuery,
  validateQuotationRejectableStatus,
  validateQuotationSelectableStatus,
  validateQuotationStatusTransition,
  validateQuotationWithdrawableStatus,
  validateRejectQuotationInput,
  validateSelectQuotationInput,
  validateUnselectQuotationInput,
  validateUpdateQuotationInput,
  validateUpdateQuotationStatusInput,
  validateWithdrawQuotationInput,
} from "../validators/quotation.validator";

import type {
  QuotationValidationError,
  QuotationValidationWarning,
} from "../validators/quotation.validator";

import {
  isQuotationRepositoryError,
  mapQuotationListQueryToRepositoryQuery,
  mapQuotationRepositoryPageToDomain,
} from "../repositories/quotation.repository";

import type {
  CheckQuotationRelationsRepositoryResult,
  CreateQuotationRepositoryInput,
  QuotationRepositoryError,
  QuotationRepositoryMutationContext,
  QuotationRepositoryPort,
  QuotationRepositoryPortTransactionManager,
QuotationRepositoryAmountSummary,
QuotationRepositoryHealthResult,
QuotationRepositoryStatistics,
} from "../repositories/quotation.repository";

import {
  CompleteQuotationMapper,
  mapBookingQuotationComparison,
} from "../mappers/quotation.mapper";

/* ============================================================================
 * Service error codes
 * ============================================================================
 */

export type QuotationServiceErrorCode =
  | "VALIDATION_FAILED"
  | "LEAD_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "VENDOR_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "BOOKING_LEAD_MISMATCH"
  | "DUPLICATE_VENDOR_QUOTATION"
  | "QUOTATION_NOT_FOUND"
  | "QUOTATION_NOT_EDITABLE"
  | "INVALID_STATUS_TRANSITION"
  | "QUOTATION_NOT_WITHDRAWABLE"
  | "QUOTATION_NOT_REJECTABLE"
  | "SELECTED_QUOTATION_MUTATION_BLOCKED"
  | "IDENTITY_GENERATION_FAILED"
  | "INVALID_SERVICE_INPUT"
  | "REPOSITORY_ERROR"
  | "TRANSACTION_FAILED"
  | "UNKNOWN_SERVICE_ERROR";

/* ============================================================================
 * Service error
 * ============================================================================
 */

export interface QuotationServiceErrorDetails {
  field?:
    string;

  value?:
    unknown;

  quotationId?:
    QuotationId;

  bookingId?:
    string;

  leadId?:
    string;

  vendorId?:
    string;

  userId?:
    string;

  validationErrors?:
    QuotationValidationError[];

  cause?:
    unknown;
}

export class QuotationServiceError
  extends Error {
  readonly code:
    QuotationServiceErrorCode;

  readonly details?:
    QuotationServiceErrorDetails;

  constructor(
    code:
      QuotationServiceErrorCode,
    message:
      string,
    details?:
      QuotationServiceErrorDetails
  ) {
    super(
      message
    );

    this.name =
      "QuotationServiceError";

    this.code =
      code;

    this.details =
      details;

    Object.setPrototypeOf(
      this,
      QuotationServiceError.prototype
    );
  }
}

export function isQuotationServiceError(
  error:
    unknown
): error is QuotationServiceError {
  return (
    error instanceof
      QuotationServiceError
  );
}

/* ============================================================================
 * Service result contracts
 * ============================================================================
 */

export interface QuotationServiceSuccess<
  T
> {
  success:
    true;

  data:
    T;

  warnings:
    QuotationValidationWarning[];
}

export interface QuotationServiceFailure {
  success:
    false;

  error: {
    code:
      QuotationServiceErrorCode;

    message:
      string;

    details?:
      QuotationServiceErrorDetails;
  };

  warnings:
    QuotationValidationWarning[];
}

export type QuotationServiceResult<
  T
> =
  | QuotationServiceSuccess<T>
  | QuotationServiceFailure;

/* ============================================================================
 * Result factories
 * ============================================================================
 */

export function createQuotationServiceSuccess<
  T
>(
  data:
    T,
  warnings:
    QuotationValidationWarning[] =
      []
): QuotationServiceSuccess<T> {
  return {
    success:
      true,

    data,

    warnings,
  };
}

export function createQuotationServiceFailure(
  code:
    QuotationServiceErrorCode,
  message:
    string,
  details?:
    QuotationServiceErrorDetails,
  warnings:
    QuotationValidationWarning[] =
      []
): QuotationServiceFailure {
  return {
    success:
      false,

    error: {
      code,

      message,

      ...(details
        ? {
            details,
          }
        : {}),
    },

    warnings,
  };
}

/* ============================================================================
 * Service dependencies
 * ============================================================================
 */

export interface QuotationServiceDependencies {
  repository:
    QuotationRepositoryPort;

  /**
   * Optional transaction manager.
   *
   * Not required for the simple Part A create operation, but later
   * selection/synchronization workflows will benefit from it.
   */
  transactionManager?:
    QuotationRepositoryPortTransactionManager;

  /**
   * Injectable clock makes service tests deterministic.
   */
  now?:
    () => Date;

  /**
   * Injectable random generator makes quotation identity generation
   * deterministic during tests.
   */
  random?:
    () => number;
}

/* ============================================================================
 * Service configuration
 * ============================================================================
 */

export interface QuotationServiceConfiguration {
  /**
   * Number of attempts allowed when generated quotationNumber /
   * referenceId collide with existing records.
   */
  identityGenerationAttempts:
    number;

  quotationNumberPrefix:
    string;

  referenceIdPrefix:
    string;
}

export const DEFAULT_QUOTATION_SERVICE_CONFIGURATION:
  QuotationServiceConfiguration = {
    identityGenerationAttempts:
      5,

    quotationNumberPrefix:
      "EMQ",

    referenceIdPrefix:
      "EMQ-REF",
  };

/* ============================================================================
 * Service runtime helpers
 * ============================================================================
 */

export function quotationServiceNow(
  dependencies:
    QuotationServiceDependencies
): Date {
  return dependencies.now
    ? dependencies.now()
    : new Date();
}

export function quotationServiceRandom(
  dependencies:
    QuotationServiceDependencies
): number {
  const value =
    dependencies.random
      ? dependencies.random()
      : Math.random();

  if (
    !Number.isFinite(
      value
    )
  ) {
    return Math.random();
  }

  return Math.max(
    0,
    Math.min(
      value,
      0.999999999
    )
  );
}

/* ============================================================================
 * Identity helpers
 * ============================================================================
 */

/**
 * Creates a compact YYYYMMDD string using UTC.
 */
export function formatQuotationIdentityDate(
  date:
    Date
): string {
  const year =
    date
      .getUTCFullYear()
      .toString()
      .padStart(
        4,
        "0"
      );

  const month =
    (
      date.getUTCMonth() +
      1
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  const day =
    date
      .getUTCDate()
      .toString()
      .padStart(
        2,
        "0"
      );

  return `${year}${month}${day}`;
}

/**
 * Creates a compact time component.
 */
export function formatQuotationIdentityTime(
  date:
    Date
): string {
  const hours =
    date
      .getUTCHours()
      .toString()
      .padStart(
        2,
        "0"
      );

  const minutes =
    date
      .getUTCMinutes()
      .toString()
      .padStart(
        2,
        "0"
      );

  const seconds =
    date
      .getUTCSeconds()
      .toString()
      .padStart(
        2,
        "0"
      );

  const milliseconds =
    date
      .getUTCMilliseconds()
      .toString()
      .padStart(
        3,
        "0"
      );

  return (
    hours +
    minutes +
    seconds +
    milliseconds
  );
}

/**
 * Six-digit random suffix.
 */
export function createQuotationRandomSuffix(
  dependencies:
    QuotationServiceDependencies
): string {
  const random =
    quotationServiceRandom(
      dependencies
    );

  return Math.floor(
    random *
      1_000_000
  )
    .toString()
    .padStart(
      6,
      "0"
    );
}

/* ============================================================================
 * Generated Quotation identity
 * ============================================================================
 */

export interface QuotationServiceGeneratedIdentity {
  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;
}

/**
 * Generates one candidate quotation identity.
 *
 * Example:
 *
 * EMQ-20260807-123456
 *
 * EMQ-REF-20260807-152945123-123456
 */
export function generateQuotationIdentityCandidate(
  dependencies:
    QuotationServiceDependencies,
  configuration:
    QuotationServiceConfiguration =
      DEFAULT_QUOTATION_SERVICE_CONFIGURATION
): QuotationServiceGeneratedIdentity {
  const now =
    quotationServiceNow(
      dependencies
    );

  const datePart =
    formatQuotationIdentityDate(
      now
    );

  const timePart =
    formatQuotationIdentityTime(
      now
    );

  const randomPart =
    createQuotationRandomSuffix(
      dependencies
    );

  return {
    quotationNumber:
      `${configuration.quotationNumberPrefix}-${datePart}-${randomPart}`,

    referenceId:
      `${configuration.referenceIdPrefix}-${datePart}-${timePart}-${randomPart}`,
  };
}

/* ============================================================================
 * Unique identity generation
 * ============================================================================
 */

/**
 * Generates quotationNumber/referenceId and checks them against the
 * repository's unique fields.
 */
export async function generateUniqueQuotationIdentity(
  dependencies:
    QuotationServiceDependencies,
  configuration:
    QuotationServiceConfiguration =
      DEFAULT_QUOTATION_SERVICE_CONFIGURATION
): Promise<
  QuotationServiceGeneratedIdentity
> {
  for (
    let attempt =
      0;
    attempt <
    configuration
      .identityGenerationAttempts;
    attempt +=
      1
  ) {
    const identity =
      generateQuotationIdentityCandidate(
        dependencies,
        configuration
      );

    const uniqueness =
      await dependencies
        .repository
        .checkUniqueness({
          quotationNumber:
            identity.quotationNumber,

          referenceId:
            identity.referenceId,
        });

    if (
      !uniqueness.exists
    ) {
      return identity;
    }
  }

  throw new QuotationServiceError(
    "IDENTITY_GENERATION_FAILED",
    "Unable to generate a unique quotation identity."
  );
}

/* ============================================================================
 * Repository error normalization
 * ============================================================================
 */

export function mapQuotationRepositoryErrorToServiceError(
  error:
    unknown
): QuotationServiceError {
  if (
    isQuotationServiceError(
      error
    )
  ) {
    return error;
  }

  if (
    isQuotationRepositoryError(
      error
    )
  ) {
    switch (
      error.code
    ) {
      case "QUOTATION_NOT_FOUND":
        return new QuotationServiceError(
          "QUOTATION_NOT_FOUND",
          error.message,
          {
            quotationId:
              error.details
                ?.quotationId,

            cause:
              error,
          }
        );

      case "LEAD_NOT_FOUND":
        return new QuotationServiceError(
          "LEAD_NOT_FOUND",
          error.message,
          {
            leadId:
              error.details
                ?.leadId,

            cause:
              error,
          }
        );

      case "BOOKING_NOT_FOUND":
        return new QuotationServiceError(
          "BOOKING_NOT_FOUND",
          error.message,
          {
            bookingId:
              error.details
                ?.bookingId,

            cause:
              error,
          }
        );

      case "VENDOR_NOT_FOUND":
        return new QuotationServiceError(
          "VENDOR_NOT_FOUND",
          error.message,
          {
            vendorId:
              error.details
                ?.vendorId,

            cause:
              error,
          }
        );

      case "DUPLICATE_QUOTATION_NUMBER":
      case "DUPLICATE_REFERENCE_ID":
        return new QuotationServiceError(
          "IDENTITY_GENERATION_FAILED",
          error.message,
          {
            cause:
              error,
          }
        );

      case "DUPLICATE_VENDOR_BOOKING_QUOTATION":
        return new QuotationServiceError(
          "DUPLICATE_VENDOR_QUOTATION",
          error.message,
          {
            bookingId:
              error.details
                ?.bookingId,

            vendorId:
              error.details
                ?.vendorId,

            cause:
              error,
          }
        );

      case "TRANSACTION_FAILED":
        return new QuotationServiceError(
          "TRANSACTION_FAILED",
          error.message,
          {
            cause:
              error,
          }
        );

      default:
        return new QuotationServiceError(
          "REPOSITORY_ERROR",
          error.message,
          {
            cause:
              error,
          }
        );
    }
  }

  if (
    error instanceof
      Error
  ) {
    return new QuotationServiceError(
      "UNKNOWN_SERVICE_ERROR",
      error.message,
      {
        cause:
          error,
      }
    );
  }

  return new QuotationServiceError(
    "UNKNOWN_SERVICE_ERROR",
    "An unknown Quotation service error occurred.",
    {
      cause:
        error,
    }
  );
}

/* ============================================================================
 * Relation business-rule checks
 * ============================================================================
 */

/**
 * Active states considered when checking whether a Vendor already has
 * an open quotation for a Booking.
 *
 * DRAFT is included because a second independent quotation should not
 * be created while the same Vendor already owns an editable draft.
 */
export const DUPLICATE_QUOTATION_CHECK_STATUSES:
  QuotationStatus[] = [
    QuotationStatus.DRAFT,
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
    QuotationStatus.SHORTLISTED,
  ];

/**
 * Verifies persisted relation facts required for creation.
 */
export function validateQuotationCreationRelations(
  input:
    CreateQuotationInput,
  relations:
    CheckQuotationRelationsRepositoryResult
): QuotationServiceError | null {
  if (
    !relations.lead
      .exists
  ) {
    return new QuotationServiceError(
      "LEAD_NOT_FOUND",
      "The Lead supplied for this quotation does not exist.",
      {
        leadId:
          input.leadId,
      }
    );
  }

  if (
    !relations.booking
      .exists
  ) {
    return new QuotationServiceError(
      "BOOKING_NOT_FOUND",
      "The Booking supplied for this quotation does not exist.",
      {
        bookingId:
          input.bookingId,
      }
    );
  }

  if (
    !relations.vendor
      .exists
  ) {
    return new QuotationServiceError(
      "VENDOR_NOT_FOUND",
      "The Vendor supplied for this quotation does not exist.",
      {
        vendorId:
          input.vendorId,
      }
    );
  }

  if (
    input.userId &&
    (
      !relations.user ||
      !relations.user
        .exists
    )
  ) {
    return new QuotationServiceError(
      "USER_NOT_FOUND",
      "The User supplied for this quotation does not exist.",
      {
        userId:
          input.userId,
      }
    );
  }

  /**
   * Fundamental EasyMovers integrity rule:
   *
   * Quotation.leadId must be the same Lead owned by Booking.
   */
  if (
    relations.booking
      .leadId &&
    relations.booking
      .leadId !==
      input.leadId
  ) {
    return new QuotationServiceError(
      "BOOKING_LEAD_MISMATCH",
      "The Booking does not belong to the supplied Lead.",
      {
        bookingId:
          input.bookingId,

        leadId:
          input.leadId,
      }
    );
  }

  return null;
}

/* ============================================================================
 * Duplicate Vendor quotation check
 * ============================================================================
 */

/**
 * Prevents creation of a second active quotation for the same
 * Vendor + Booking pair.
 *
 * Revision workflow will be handled separately rather than creating
 * uncontrolled duplicate active quotations.
 */
export async function checkDuplicateVendorQuotation(
  repository:
    QuotationRepositoryPort,
  input:
    CreateQuotationInput
): Promise<
  Quotation | null
> {
  return repository
    .findVendorBookingQuotation({
      bookingId:
        input.bookingId,

      vendorId:
        input.vendorId,

      statuses:
        DUPLICATE_QUOTATION_CHECK_STATUSES,
    });
}

/* ============================================================================
 * Create service input
 * ============================================================================
 */

export interface CreateQuotationServiceInput {
  quotation:
    CreateQuotationInput;

  /**
   * Optional repository audit context.
   *
   * Current Quotation Prisma model does not persist this directly.
   */
  context?:
    QuotationRepositoryMutationContext;
}

/* ============================================================================
 * Create Quotation business workflow
 * ============================================================================
 */

/**
 * Complete Quotation creation workflow.
 *
 * Sequence:
 *
 * 1. Domain validation
 * 2. Normalize validated input
 * 3. Check persisted Lead / Booking / Vendor / User
 * 4. Confirm Booking belongs to Lead
 * 5. Check duplicate active Vendor quotation
 * 6. Generate unique quotation identity
 * 7. Persist through repository
 */
export async function createQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    CreateQuotationServiceInput,
  configuration:
    QuotationServiceConfiguration =
      DEFAULT_QUOTATION_SERVICE_CONFIGURATION
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  /* ------------------------------------------------------------------------
   * 1. Validate the domain input
   * ------------------------------------------------------------------------
   */

  const validation =
    validateCompleteCreateQuotationInput(
      input.quotation
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation creation validation failed.",
      {
        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  const quotation =
    validation.value;

  const warnings =
    validation.warnings;

  try {
    /* ----------------------------------------------------------------------
     * 2. Check persisted relations
     * ----------------------------------------------------------------------
     */

    const relations =
      await dependencies
        .repository
        .checkRelations({
          leadId:
            quotation.leadId,

          bookingId:
            quotation.bookingId,

          vendorId:
            quotation.vendorId,

          ...(quotation.userId
            ? {
                userId:
                  quotation.userId,
              }
            : {}),
        });

    /* ----------------------------------------------------------------------
     * 3. Apply relation business rules
     * ----------------------------------------------------------------------
     */

    const relationError =
      validateQuotationCreationRelations(
        quotation,
        relations
      );

    if (
      relationError
    ) {
      return createQuotationServiceFailure(
        relationError.code,
        relationError.message,
        relationError.details,
        warnings
      );
    }
/* ----------------------------------------------------------------------
 * 4. Prevent new bidding after final quotation acceptance
 * ----------------------------------------------------------------------
 *
 * Once a Booking already owns an ACCEPTED selected quotation,
 * ordinary quotation creation is closed.
 *
 * Reopening quotation collection must later be handled through an
 * explicit cancellation / rebooking / admin-reopen workflow rather
 * than silently accepting new Vendor bids.
 * ----------------------------------------------------------------------
 */

const selectedQuotation =
  await dependencies
    .repository
    .findSelectedForBooking({
      bookingId:
        quotation.bookingId,
    });

if (
  selectedQuotation &&
  selectedQuotation.status ===
    QuotationStatus.ACCEPTED
) {
  return createQuotationServiceFailure(
    "SELECTED_QUOTATION_MUTATION_BLOCKED",
    "New quotations cannot be created because this Booking already has an accepted quotation.",
    {
      bookingId:
        quotation.bookingId,

      quotationId:
        selectedQuotation
          .quotationId,
    },
    warnings
  );
}
    /* ----------------------------------------------------------------------
     * 5. Prevent duplicate active Vendor quotation
     * ----------------------------------------------------------------------
     */

    const existingVendorQuotation =
      await checkDuplicateVendorQuotation(
        dependencies.repository,
        quotation
      );

    if (
      existingVendorQuotation
    ) {
      return createQuotationServiceFailure(
        "DUPLICATE_VENDOR_QUOTATION",
        "This Vendor already has an active quotation for the Booking.",
        {
          quotationId:
            existingVendorQuotation
              .quotationId,

          bookingId:
            quotation.bookingId,

          vendorId:
            quotation.vendorId,
        },
        warnings
      );
    }

    /* ----------------------------------------------------------------------
     * 6. Generate unique EasyMovers quotation identity
     * ----------------------------------------------------------------------
     */

    const identity =
      await generateUniqueQuotationIdentity(
        dependencies,
        configuration
      );

    /* ----------------------------------------------------------------------
     * 7. Prepare repository persistence request
     * ----------------------------------------------------------------------
     */

    const repositoryInput:
      CreateQuotationRepositoryInput = {
      quotation,

      identity: {
        quotationNumber:
          identity
            .quotationNumber,

        referenceId:
          identity
            .referenceId,
      },
    };

    /* ----------------------------------------------------------------------
     * 8. Persist
     * ----------------------------------------------------------------------
     */

    const created =
      await dependencies
        .repository
        .create(
          repositoryInput
        );

    return createQuotationServiceSuccess(
      created,
      warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      warnings
    );
  }
}

/* ============================================================================
 * Throwing create helper
 * ============================================================================
 */

/**
 * Useful for internal service composition where Result-style handling
 * would be unnecessarily repetitive.
 */
export async function requireCreatedQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    CreateQuotationServiceInput,
  configuration:
    QuotationServiceConfiguration =
      DEFAULT_QUOTATION_SERVICE_CONFIGURATION
): Promise<
  Quotation
> {
  const result =
    await createQuotation(
      dependencies,
      input,
      configuration
    );

  if (
    !result.success
  ) {
    throw new QuotationServiceError(
      result.error.code,
      result.error.message,
      result.error.details
    );
  }

  return result.data;
}

/* ============================================================================
 * QuotationService - Part A
 * ============================================================================
 */

/* ============================================================================
 * Complete QuotationService
 * ============================================================================
 */

export class QuotationService {
  constructor(
    private readonly dependencies:
      QuotationServiceDependencies,

    private readonly configuration:
      QuotationServiceConfiguration =
        DEFAULT_QUOTATION_SERVICE_CONFIGURATION
  ) {}

  /* ==========================================================================
   * Part A - Creation
   * ==========================================================================
   */

  create(
    input:
      CreateQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return createQuotation(
      this.dependencies,
      input,
      this.configuration
    );
  }

  createOrThrow(
    input:
      CreateQuotationServiceInput
  ): Promise<
    Quotation
  > {
    return requireCreatedQuotation(
      this.dependencies,
      input,
      this.configuration
    );
  }

  /* ==========================================================================
   * Part B - Read operations
   * ==========================================================================
   */

  getById(
    quotationId:
      QuotationId
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationById(
      this.dependencies,
      quotationId
    );
  }

  getByQuotationNumber(
    quotationNumber:
      QuotationNumber
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationByNumber(
      this.dependencies,
      quotationNumber
    );
  }

  getByReferenceId(
    referenceId:
      QuotationReferenceId
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationByReferenceId(
      this.dependencies,
      referenceId
    );
  }

  getCustomerSafeById(
    quotationId:
      QuotationId
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation
    >
  > {
    return getCustomerSafeQuotationById(
      this.dependencies,
      quotationId
    );
  }

  /* ==========================================================================
   * Part B - Booking reads
   * ==========================================================================
   */

  getByBooking(
    input:
      GetBookingQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation[]
    >
  > {
    return getBookingQuotations(
      this.dependencies,
      input
    );
  }

  getCustomerSafeByBooking(
    input:
      GetBookingQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation[]
    >
  > {
    return getBookingCustomerSafeQuotations(
      this.dependencies,
      input
    );
  }

  getActiveByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      Quotation[]
    >
  > {
    return getActiveBookingQuotations(
      this.dependencies,
      bookingId
    );
  }

  getSelectedByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      Quotation | null
    >
  > {
    return getSelectedBookingQuotation(
      this.dependencies,
      bookingId
    );
  }

  getCustomerSafeSelectedByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation | null
    >
  > {
    return getCustomerSafeSelectedBookingQuotation(
      this.dependencies,
      bookingId
    );
  }

  getComparison(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      BookingQuotationComparison
    >
  > {
    return getBookingQuotationComparison(
      this.dependencies,
      bookingId
    );
  }

  /* ==========================================================================
   * Part B - List/search
   * ==========================================================================
   */

  list(
    input:
      ListQuotationsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      PaginatedQuotationResult<
        QuotationListItem
      >
    >
  > {
    return listQuotations(
      this.dependencies,
      input
    );
  }

  listCustomerSafe(
    input:
      ListQuotationsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      PaginatedQuotationResult<
        QuotationListItem
      >
    >
  > {
    return listCustomerSafeQuotations(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part C - Commercial updates
   * ==========================================================================
   */

  update(
    input:
      UpdateQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return updateQuotation(
      this.dependencies,
      input
    );
  }

  updateStatus(
    input:
      UpdateQuotationStatusInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return updateQuotationStatus(
      this.dependencies,
      input
    );
  }

  withdraw(
    input:
      WithdrawQuotationInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return withdrawQuotation(
      this.dependencies,
      input
    );
  }

  reject(
    input:
      RejectQuotationInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return rejectQuotation(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part C - Semantic status workflows
   * ==========================================================================
   */

  submitDraft(
    input: {
      quotationId:
        QuotationId;

      submittedBy:
        string;

      reason?:
        string;
    }
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return submitDraftQuotation(
      this.dependencies,
      input
    );
  }

  markRevised(
    input: {
      quotationId:
        QuotationId;

      revisedBy:
        string;

      reason?:
        string;
    }
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return markQuotationRevised(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part D - Quotation selection
   * ==========================================================================
   */

  select(
    input:
      SelectQuotationInput
  ): Promise<
    QuotationServiceResult<
      QuotationSelectionServiceData
    >
  > {
    return selectQuotation(
      this.dependencies,
      input
    );
  }

  selectCustomerSafe(
    input:
      SelectQuotationInput
  ) {
    return selectCustomerSafeQuotation(
      this.dependencies,
      input
    );
  }

  unselect(
    input:
      UnselectQuotationInput
  ): Promise<
    QuotationServiceResult<
      QuotationSelectionServiceData
    >
  > {
    return unselectQuotation(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part D - Acceptance
   * ==========================================================================
   */

  accept(
    input:
      AcceptQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return acceptQuotation(
      this.dependencies,
      input
    );
  }

  acceptCustomerSafe(
    input:
      AcceptQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation
    >
  > {
    return acceptCustomerSafeQuotation(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part E - Booking quotation summary
   * ==========================================================================
   */

  getBookingSummary(
    input:
      GetBookingQuotationSummaryServiceInput
  ): Promise<
    QuotationServiceResult<
      QuotationRepositoryAmountSummary
    >
  > {
    return getBookingQuotationSummary(
      this.dependencies,
      input
    );
  }

  getActiveBookingSummary(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      QuotationRepositoryAmountSummary
    >
  > {
    return getActiveBookingQuotationSummary(
      this.dependencies,
      bookingId
    );
  }

  /* ==========================================================================
   * Part E - Statistics
   * ==========================================================================
   */

  getStatistics(
    input:
      GetQuotationStatisticsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      QuotationStatistics
    >
  > {
    return getQuotationStatistics(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part E - Expiration
   * ==========================================================================
   */

  expireDue(
    input:
      ExpireDueQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      ExpireDueQuotationsServiceData
    >
  > {
    return expireDueQuotations(
      this.dependencies,
      input
    );
  }

  /* ==========================================================================
   * Part E - Health / diagnostics
   * ==========================================================================
   */

  getRepositoryHealth():
    Promise<
      QuotationServiceResult<
        QuotationRepositoryHealthResult
      >
    > {
    return getQuotationRepositoryHealth(
      this.dependencies
    );
  }

  getDiagnostics():
    Promise<
      QuotationServiceDiagnostics
    > {
    return getQuotationServiceDiagnostics(
      this.dependencies
    );
  }
}
/* ============================================================================
 * Service factory
 * ============================================================================
 */

export function createQuotationService(
  dependencies:
    QuotationServiceDependencies,
  configuration?:
    Partial<
      QuotationServiceConfiguration
    >
): QuotationService {
  const resolvedConfiguration:
    QuotationServiceConfiguration = {
    ...DEFAULT_QUOTATION_SERVICE_CONFIGURATION,

    ...configuration,
  };

  return new QuotationService(
    dependencies,
    resolvedConfiguration
  );
}

/* ============================================================================
 * Part A facade
 * ============================================================================
 */

export const QuotationServicePartA = {
  create:
    createQuotation,

  createOrThrow:
    requireCreatedQuotation,

  createService:
    createQuotationService,

  generateIdentity:
    generateUniqueQuotationIdentity,

  generateIdentityCandidate:
    generateQuotationIdentityCandidate,

  validateRelations:
    validateQuotationCreationRelations,

  checkDuplicateVendorQuotation:
    checkDuplicateVendorQuotation,

  duplicateStatuses:
    DUPLICATE_QUOTATION_CHECK_STATUSES,
} as const;

/* ============================================================================
 * End of Part A
 * ============================================================================
 */

/* ============================================================================
 * EasyMovers
 * Quotation Service
 * Part B
 * ============================================================================
 *
 * Read/query responsibilities:
 *
 * - Get Quotation by ID
 * - Get Quotation by quotation number
 * - Get Quotation by reference ID
 * - Get Booking quotations
 * - Get customer-safe Booking quotations
 * - Build customer-safe Booking quotation comparison
 * - List/search quotations
 * - Produce customer-safe list/search results
 *
 * IMPORTANT:
 *
 * Internal service methods may return Vendor-aware Quotation objects.
 *
 * Customer-facing service methods MUST NOT expose:
 *
 * - vendorId
 * - vendorCode
 * - companyName
 * - internalRemarks
 * - submittedByUser
 * ============================================================================
 */

/* ============================================================================
 * Shared read helper
 * ============================================================================
 */

/**
 * Converts an optional Quotation into a service result.
 */
export function quotationReadResult(
  quotation:
    Quotation | null,
  notFoundMessage =
    "Quotation was not found."
): QuotationServiceResult<
  Quotation
> {
  if (
    !quotation
  ) {
    return createQuotationServiceFailure(
      "QUOTATION_NOT_FOUND",
      notFoundMessage
    );
  }

  return createQuotationServiceSuccess(
    quotation
  );
}

/* ============================================================================
 * Get Quotation by ID
 * ============================================================================
 */

export async function getQuotationById(
  dependencies:
    QuotationServiceDependencies,
  quotationId:
    QuotationId
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  if (
    typeof quotationId !==
      "string" ||
    quotationId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "quotationId is required.",
      {
        field:
          "quotationId",

        value:
          quotationId,
      }
    );
  }

  try {
    const quotation =
      await dependencies
        .repository
        .findById(
          quotationId.trim()
        );

    return quotationReadResult(
      quotation
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Get Quotation by quotation number
 * ============================================================================
 */

export async function getQuotationByNumber(
  dependencies:
    QuotationServiceDependencies,
  quotationNumber:
    QuotationNumber
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  if (
    typeof quotationNumber !==
      "string" ||
    quotationNumber
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "quotationNumber is required.",
      {
        field:
          "quotationNumber",

        value:
          quotationNumber,
      }
    );
  }

  try {
    const quotation =
      await dependencies
        .repository
        .findByQuotationNumber(
          quotationNumber.trim()
        );

    return quotationReadResult(
      quotation,
      "Quotation number was not found."
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Get Quotation by reference ID
 * ============================================================================
 */

export async function getQuotationByReferenceId(
  dependencies:
    QuotationServiceDependencies,
  referenceId:
    QuotationReferenceId
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  if (
    typeof referenceId !==
      "string" ||
    referenceId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "referenceId is required.",
      {
        field:
          "referenceId",

        value:
          referenceId,
      }
    );
  }

  try {
    const quotation =
      await dependencies
        .repository
        .findByReferenceId(
          referenceId.trim()
        );

    return quotationReadResult(
      quotation,
      "Quotation reference ID was not found."
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Customer-safe single Quotation
 * ============================================================================
 */

export async function getCustomerSafeQuotationById(
  dependencies:
    QuotationServiceDependencies,
  quotationId:
    QuotationId
): Promise<
  QuotationServiceResult<
    CustomerSafeQuotation
  >
> {
  const result =
    await getQuotationById(
      dependencies,
      quotationId
    );

  if (
    !result.success
  ) {
    return result;
  }

  return createQuotationServiceSuccess(
    CompleteQuotationMapper
      .read
      .toCustomerSafe(
        result.data
      ),
    result.warnings
  );
}

/* ============================================================================
 * Booking quotation read input
 * ============================================================================
 */

export interface GetBookingQuotationsServiceInput {
  bookingId:
    BookingId;

  statuses?:
    QuotationStatus[];

  includeExpired?:
    boolean;

  sort?:
    QuotationSort;
}

/* ============================================================================
 * Booking existence
 * ============================================================================
 */

/**
 * Distinguishes:
 *
 * valid Booking with zero quotations
 *
 * from:
 *
 * nonexistent Booking
 */
export async function ensureQuotationBookingExists(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceError | null
> {
  const booking =
    await dependencies
      .repository
      .checkBooking({
        bookingId,
      });

  if (
    !booking.exists
  ) {
    return new QuotationServiceError(
      "BOOKING_NOT_FOUND",
      "Booking was not found.",
      {
        bookingId,
      }
    );
  }

  return null;
}

/* ============================================================================
 * Get internal Booking quotations
 * ============================================================================
 */

export async function getBookingQuotations(
  dependencies:
    QuotationServiceDependencies,
  input:
    GetBookingQuotationsServiceInput
): Promise<
  QuotationServiceResult<
    Quotation[]
  >
> {
  if (
    typeof input.bookingId !==
      "string" ||
    input.bookingId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "bookingId is required.",
      {
        field:
          "bookingId",

        value:
          input.bookingId,
      }
    );
  }

  const bookingId =
    input.bookingId
      .trim();

  try {
    const bookingError =
      await ensureQuotationBookingExists(
        dependencies,
        bookingId
      );

    if (
      bookingError
    ) {
      return createQuotationServiceFailure(
        bookingError.code,
        bookingError.message,
        bookingError.details
      );
    }

    const quotations =
      await dependencies
        .repository
        .findByBookingId({
          bookingId,

          ...(input.statuses
            ? {
                statuses:
                  input.statuses,
              }
            : {}),

          ...(input.includeExpired !==
          undefined
            ? {
                includeExpired:
                  input.includeExpired,
              }
            : {}),

          ...(input.sort
            ? {
                sort:
                  input.sort,
              }
            : {}),
        });

    return createQuotationServiceSuccess(
      quotations
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Customer-safe Booking quotations
 * ============================================================================
 */
/* ============================================================================
 * Customer-visible Booking quotation statuses
 * ============================================================================
 */

/**
 * Default statuses visible through customer-facing Booking quotation APIs.
 *
 * DRAFT is excluded because it has not yet been formally submitted.
 *
 * WITHDRAWN / REJECTED / EXPIRED are excluded from the active customer
 * marketplace view.
 *
 * ACCEPTED remains visible because it represents the customer's finalized
 * quotation.
 */
export const CUSTOMER_VISIBLE_QUOTATION_STATUSES:
  QuotationStatus[] = [
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
    QuotationStatus.SHORTLISTED,
    QuotationStatus.ACCEPTED,
  ];
/**
 * This is the preferred Booking quotation method for customer APIs.
 *
 * Vendor information is removed before leaving the service.
 */
export async function getBookingCustomerSafeQuotations(
  dependencies:
    QuotationServiceDependencies,
  input:
    GetBookingQuotationsServiceInput
): Promise<
  QuotationServiceResult<
    CustomerSafeQuotation[]
  >
> {
  /**
   * Customer routes use a safe default visibility policy.
   *
   * Explicit statuses may still be supplied later by a trusted caller if
   * we intentionally build a customer quotation-history endpoint.
   */
  const result =
    await getBookingQuotations(
      dependencies,
      {
        ...input,

        statuses:
          input.statuses ??
          CUSTOMER_VISIBLE_QUOTATION_STATUSES,

        includeExpired:
          input.includeExpired ??
          false,

        sort:
          input.sort ?? {
            field:
              "totalAmount",

            direction:
              "asc",
          },
      }
    );

  if (
    !result.success
  ) {
    return result;
  }

  const quotations =
    result.data.map(
      (
        quotation
      ) =>
        CompleteQuotationMapper
          .read
          .toCustomerSafe(
            quotation
          )
    );

  return createQuotationServiceSuccess(
    quotations,
    result.warnings
  );
}

/* ============================================================================
 * Booking quotation comparison
 * ============================================================================
 */

/**
 * Builds the customer-facing quotation comparison for one Booking.
 *
 * The mapper itself also routes through CustomerSafeQuotation before
 * constructing comparison rows, giving us two layers of protection
 * against Vendor identity leakage.
 */
/* ============================================================================
 * Customer comparison eligible statuses
 * ============================================================================
 */

/**
 * Quotations that may appear in the customer-facing comparison.
 *
 * Terminal failed/ineligible states such as:
 *
 * - WITHDRAWN
 * - REJECTED
 * - EXPIRED
 *
 * must not influence comparison totals or price ranges.
 *
 * ACCEPTED remains visible because it represents the customer's
 * finalized selected quotation.
 */
export const CUSTOMER_COMPARISON_QUOTATION_STATUSES:
  QuotationStatus[] = [
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
    QuotationStatus.SHORTLISTED,
    QuotationStatus.ACCEPTED,
  ];
export async function getBookingQuotationComparison(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceResult<
    BookingQuotationComparison
  >
> {
  const result =
    await getBookingQuotations(
      dependencies,
      {
        bookingId,

        /**
         * Customer comparison must only contain commercially
         * eligible quotations.
         *
         * WITHDRAWN / REJECTED quotations must not influence:
         *
         * - totalQuotations
         * - lowestAmount
         * - highestAmount
         * - customer comparison rows
         */
        statuses:
          CUSTOMER_COMPARISON_QUOTATION_STATUSES,

        /**
         * Expired quotations are not actionable and therefore
         * must not participate in the live customer comparison.
         */
        includeExpired:
          false,

        sort: {
          field:
            "totalAmount",

          direction:
            "asc",
        },
      }
    );

  if (
    !result.success
  ) {
    return result;
  }

  const comparison =
    mapBookingQuotationComparison(
      bookingId,
      result.data
    );

  return createQuotationServiceSuccess(
    comparison,
    result.warnings
  );
}
/* ============================================================================
 * List/search service input
 * ============================================================================
 */

export interface ListQuotationsServiceInput {
  query?:
    QuotationListQuery;
}

/* ============================================================================
 * Internal list/search
 * ============================================================================
 */

/**
 * Internal/admin/vendor-aware quotation listing.
 *
 * QuotationListItem may contain vendorId.
 */
export async function listQuotations(
  dependencies:
    QuotationServiceDependencies,
  input:
    ListQuotationsServiceInput =
      {}
): Promise<
  QuotationServiceResult<
    PaginatedQuotationResult<
      QuotationListItem
    >
  >
> {
  const query:
    QuotationListQuery =
      input.query ?? {};

  const validation =
    validateQuotationListQuery(
      query
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation list query validation failed.",
      {
        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  try {
    const repositoryQuery =
      mapQuotationListQueryToRepositoryQuery(
        validation.value
      );

    const page =
      await dependencies
        .repository
        .list(
          repositoryQuery
        );

    return createQuotationServiceSuccess(
      mapQuotationRepositoryPageToDomain(
        page
      ),
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Customer-safe list item
 * ============================================================================
 */

/**
 * Removes internal Vendor identity from a repository list item.
 *
 * QuotationListItem.vendorId is optional by design.
 */
export function mapQuotationListItemToCustomerSafe(
  item:
    QuotationListItem
): QuotationListItem {
  return {
    quotationId:
      item.quotationId,

    quotationNumber:
      item.quotationNumber,

    referenceId:
      item.referenceId,

    leadId:
      item.leadId,

    bookingId:
      item.bookingId,

    totalAmount:
      item.totalAmount,

    currency:
      item.currency,

    status:
      item.status,

    ...(item.validUntil
      ? {
          validUntil:
            item.validUntil,
        }
      : {}),

    ...(item.pickupDate
      ? {
          pickupDate:
            item.pickupDate,
        }
      : {}),

    ...(item.deliveryDate
      ? {
          deliveryDate:
            item.deliveryDate,
        }
      : {}),

    ...(item.transitDays !==
    undefined
      ? {
          transitDays:
            item.transitDays,
        }
      : {}),

    selectedForBooking:
      item.selectedForBooking,

    createdAt:
      item.createdAt,

    updatedAt:
      item.updatedAt,
  };
}

/* ============================================================================
 * Customer-safe list/search
 * ============================================================================
 */

/**
 * Preferred listing method for customer APIs.
 *
 * The repository may internally return vendorId, but this service method
 * strips it before returning the result.
 */
export async function listCustomerSafeQuotations(
  dependencies:
    QuotationServiceDependencies,
  input:
    ListQuotationsServiceInput =
      {}
): Promise<
  QuotationServiceResult<
    PaginatedQuotationResult<
      QuotationListItem
    >
  >
> {
  const result =
    await listQuotations(
      dependencies,
      input
    );

  if (
    !result.success
  ) {
    return result;
  }

  return createQuotationServiceSuccess(
    {
      items:
        result.data
          .items
          .map(
            mapQuotationListItemToCustomerSafe
          ),

      pagination:
        result.data
          .pagination,
    },
    result.warnings
  );
}

/* ============================================================================
 * Find active Booking quotations
 * ============================================================================
 */

/**
 * Convenience query used by customer comparison and quotation-selection
 * workflows.
 */
export async function getActiveBookingQuotations(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceResult<
    Quotation[]
  >
> {
  return getBookingQuotations(
    dependencies,
    {
      bookingId,

      statuses: [
        QuotationStatus.SUBMITTED,
        QuotationStatus.REVISED,
        QuotationStatus.SHORTLISTED,
      ],

      includeExpired:
        false,

      sort: {
        field:
          "totalAmount",

        direction:
          "asc",
      },
    }
  );
}

/* ============================================================================
 * Find selected Booking quotation
 * ============================================================================
 */

export async function getSelectedBookingQuotation(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceResult<
    Quotation | null
  >
> {
  if (
    typeof bookingId !==
      "string" ||
    bookingId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "bookingId is required.",
      {
        field:
          "bookingId",

        value:
          bookingId,
      }
    );
  }

  try {
    const bookingError =
      await ensureQuotationBookingExists(
        dependencies,
        bookingId.trim()
      );

    if (
      bookingError
    ) {
      return createQuotationServiceFailure(
        bookingError.code,
        bookingError.message,
        bookingError.details
      );
    }

    const quotation =
      await dependencies
        .repository
        .findSelectedForBooking({
          bookingId:
            bookingId.trim(),
        });

    return createQuotationServiceSuccess(
      quotation
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Customer-safe selected quotation
 * ============================================================================
 */

export async function getCustomerSafeSelectedBookingQuotation(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceResult<
    CustomerSafeQuotation | null
  >
> {
  const result =
    await getSelectedBookingQuotation(
      dependencies,
      bookingId
    );

  if (
    !result.success
  ) {
    return result;
  }

  return createQuotationServiceSuccess(
    result.data
      ? CompleteQuotationMapper
          .read
          .toCustomerSafe(
            result.data
          )
      : null,
    result.warnings
  );
}

/* ============================================================================
 * Extend QuotationService class
 *
 * IMPORTANT:
 *
 * Add the methods below INSIDE the existing QuotationService class,
 * immediately after createOrThrow().
 * ============================================================================
 */

/*

  getById(
    quotationId:
      QuotationId
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationById(
      this.dependencies,
      quotationId
    );
  }

  getByQuotationNumber(
    quotationNumber:
      QuotationNumber
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationByNumber(
      this.dependencies,
      quotationNumber
    );
  }

  getByReferenceId(
    referenceId:
      QuotationReferenceId
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return getQuotationByReferenceId(
      this.dependencies,
      referenceId
    );
  }

  getCustomerSafeById(
    quotationId:
      QuotationId
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation
    >
  > {
    return getCustomerSafeQuotationById(
      this.dependencies,
      quotationId
    );
  }

  getByBooking(
    input:
      GetBookingQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation[]
    >
  > {
    return getBookingQuotations(
      this.dependencies,
      input
    );
  }

  getCustomerSafeByBooking(
    input:
      GetBookingQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation[]
    >
  > {
    return getBookingCustomerSafeQuotations(
      this.dependencies,
      input
    );
  }

  getComparison(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      BookingQuotationComparison
    >
  > {
    return getBookingQuotationComparison(
      this.dependencies,
      bookingId
    );
  }

  getActiveByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      Quotation[]
    >
  > {
    return getActiveBookingQuotations(
      this.dependencies,
      bookingId
    );
  }

  getSelectedByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      Quotation | null
    >
  > {
    return getSelectedBookingQuotation(
      this.dependencies,
      bookingId
    );
  }

  getCustomerSafeSelectedByBooking(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation | null
    >
  > {
    return getCustomerSafeSelectedBookingQuotation(
      this.dependencies,
      bookingId
    );
  }

  list(
    input:
      ListQuotationsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      PaginatedQuotationResult<
        QuotationListItem
      >
    >
  > {
    return listQuotations(
      this.dependencies,
      input
    );
  }

  listCustomerSafe(
    input:
      ListQuotationsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      PaginatedQuotationResult<
        QuotationListItem
      >
    >
  > {
    return listCustomerSafeQuotations(
      this.dependencies,
      input
    );
  }

*/

/* ============================================================================
 * Part B facade
 * ============================================================================
 */

export const QuotationServicePartB = {
  getById:
    getQuotationById,

  getByQuotationNumber:
    getQuotationByNumber,

  getByReferenceId:
    getQuotationByReferenceId,

  getCustomerSafeById:
    getCustomerSafeQuotationById,

  getByBooking:
    getBookingQuotations,

  getCustomerSafeByBooking:
    getBookingCustomerSafeQuotations,

  getActiveByBooking:
    getActiveBookingQuotations,

  getSelectedByBooking:
    getSelectedBookingQuotation,

  getCustomerSafeSelectedByBooking:
    getCustomerSafeSelectedBookingQuotation,

  getComparison:
    getBookingQuotationComparison,

  list:
    listQuotations,

  listCustomerSafe:
    listCustomerSafeQuotations,

  mapCustomerSafeListItem:
    mapQuotationListItemToCustomerSafe,
} as const;

/* ============================================================================
 * End of Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Service
 * Part C
 * ============================================================================
 *
 * Mutation/workflow responsibilities:
 *
 * - Update editable quotation
 * - Recalculate total when pricing changes
 * - Change quotation status
 * - Enforce domain status transitions
 * - Withdraw quotation
 * - Reject quotation
 *
 * IMPORTANT:
 *
 * - Identity fields cannot be updated here
 * - Lead / Booking / Vendor relationships cannot be changed here
 * - Terminal quotations cannot be commercially edited
 * - Repository performs persistence only
 * ============================================================================
 */

/* ============================================================================
 * Shared mutation helpers
 * ============================================================================
 */

/**
 * Loads a Quotation or returns a service-level not-found error.
 */
export async function requireQuotationForMutation(
  dependencies:
    QuotationServiceDependencies,
  quotationId:
    QuotationId
): Promise<
  Quotation
> {
  const quotation =
    await dependencies
      .repository
      .findById(
        quotationId
      );

  if (
    !quotation
  ) {
    throw new QuotationServiceError(
      "QUOTATION_NOT_FOUND",
      "Quotation was not found.",
      {
        quotationId,
      }
    );
  }

  return quotation;
}

/* ============================================================================
 * Pricing update detection
 * ============================================================================
 */

/**
 * Determines whether a quotation update changes any value that
 * contributes to totalAmount.
 */
export function hasQuotationPricingMutation(
  input:
    UpdateQuotationInput
): boolean {
  return (
    input.transportationCost !==
      undefined ||
    input.packingCost !==
      undefined ||
    input.unpackingCost !==
      undefined ||
    input.labourCost !==
      undefined ||
    input.insuranceCost !==
      undefined ||
    input.otherCost !==
      undefined ||
    input.discountAmount !==
      undefined ||
    input.taxAmount !==
      undefined
  );
}

/* ============================================================================
 * Update pricing normalization
 * ============================================================================
 */

/**
 * When a component amount changes but totalAmount is omitted,
 * calculate the new total from:
 *
 * current persisted costs
 * +
 * supplied update values
 *
 * This prevents stale totalAmount values after partial updates.
 */
export function normalizeQuotationUpdatePricing(
  quotation:
    Quotation,
  input:
    UpdateQuotationInput
): UpdateQuotationInput {
  if (
    !hasQuotationPricingMutation(
      input
    )
  ) {
    return input;
  }

  /**
   * A caller may explicitly supply totalAmount.
   *
   * validateUpdateQuotationInput validates its primitive amount;
   * service recomputation only occurs when totalAmount was omitted.
   */
  if (
    input.totalAmount !==
      undefined
  ) {
    return input;
  }

  const totalAmount =
    calculateQuotationTotal({
      transportationCost:
        input.transportationCost ??
        quotation.costs
          .transportationCost,

      packingCost:
        input.packingCost ??
        quotation.costs
          .packingCost,

      unpackingCost:
        input.unpackingCost ??
        quotation.costs
          .unpackingCost,

      labourCost:
        input.labourCost ??
        quotation.costs
          .labourCost,

      insuranceCost:
        input.insuranceCost ??
        quotation.costs
          .insuranceCost,

      otherCost:
        input.otherCost ??
        quotation.costs
          .otherCost,

      discountAmount:
        input.discountAmount ??
        quotation.costs
          .discountAmount,

      taxAmount:
        input.taxAmount ??
        quotation.costs
          .taxAmount,
    });

  return {
    ...input,

    totalAmount,
  };
}

/* ============================================================================
 * Full pricing consistency for update
 * ============================================================================
 */

/**
 * Ensures a supplied or calculated update total agrees with the final
 * quotation component values.
 */
export function validateQuotationUpdatePricingConsistency(
  quotation:
    Quotation,
  input:
    UpdateQuotationInput
): QuotationServiceError | null {
  if (
    !hasQuotationPricingMutation(
      input
    ) &&
    input.totalAmount ===
      undefined
  ) {
    return null;
  }

  const expectedTotal =
    calculateQuotationTotal({
      transportationCost:
        input.transportationCost ??
        quotation.costs
          .transportationCost,

      packingCost:
        input.packingCost ??
        quotation.costs
          .packingCost,

      unpackingCost:
        input.unpackingCost ??
        quotation.costs
          .unpackingCost,

      labourCost:
        input.labourCost ??
        quotation.costs
          .labourCost,

      insuranceCost:
        input.insuranceCost ??
        quotation.costs
          .insuranceCost,

      otherCost:
        input.otherCost ??
        quotation.costs
          .otherCost,

      discountAmount:
        input.discountAmount ??
        quotation.costs
          .discountAmount,

      taxAmount:
        input.taxAmount ??
        quotation.costs
          .taxAmount,
    });

  if (
    input.totalAmount !==
      undefined
  ) {
    const difference =
      Math.abs(
        input.totalAmount -
        expectedTotal
      );

    if (
      difference >
        0.01
    ) {
      return new QuotationServiceError(
        "VALIDATION_FAILED",
        `Quotation totalAmount must equal the calculated total of ${expectedTotal}.`,
        {
          field:
            "totalAmount",

          value:
            input.totalAmount,

          quotationId:
            quotation
              .quotationId,
        }
      );
    }
  }

  return null;
}

/* ============================================================================
 * Update Quotation service input
 * ============================================================================
 */

export interface UpdateQuotationServiceInput {
  quotationId:
    QuotationId;

  changes:
    UpdateQuotationInput;

  context?:
    QuotationRepositoryMutationContext;
}

/* ============================================================================
 * Update Quotation workflow
 * ============================================================================
 */

export async function updateQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    UpdateQuotationServiceInput
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  if (
    typeof input.quotationId !==
      "string" ||
    input.quotationId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "quotationId is required.",
      {
        field:
          "quotationId",

        value:
          input.quotationId,
      }
    );
  }

  /* ------------------------------------------------------------------------
   * 1. Validate update payload
   * ------------------------------------------------------------------------
   */

  const validation =
    validateUpdateQuotationInput(
      input.changes
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation update validation failed.",
      {
        quotationId:
          input.quotationId,

        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  try {
    /* ----------------------------------------------------------------------
     * 2. Load persisted Quotation
     * ----------------------------------------------------------------------
     */

    const quotation =
      await requireQuotationForMutation(
        dependencies,
        input.quotationId
          .trim()
      );

    /* ----------------------------------------------------------------------
     * 3. Enforce editable status
     * ----------------------------------------------------------------------
     */

    if (
      !isEditableQuotationStatus(
        quotation.status
      )
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_EDITABLE",
        `Quotation cannot be edited while its status is ${quotation.status}.`,
        {
          quotationId:
            quotation.quotationId,

          value:
            quotation.status,
        },
        validation.warnings
      );
    }

    /* ----------------------------------------------------------------------
     * 4. Recalculate commercial total for partial pricing updates
     * ----------------------------------------------------------------------
     */

    const normalizedChanges =
      normalizeQuotationUpdatePricing(
        quotation,
        validation.value
      );

    /* ----------------------------------------------------------------------
     * 5. Cross-check supplied total against final commercial values
     * ----------------------------------------------------------------------
     */

    const pricingError =
      validateQuotationUpdatePricingConsistency(
        quotation,
        normalizedChanges
      );

    if (
      pricingError
    ) {
      return createQuotationServiceFailure(
        pricingError.code,
        pricingError.message,
        pricingError.details,
        validation.warnings
      );
    }

    /* ----------------------------------------------------------------------
     * 6. Persist
     * ----------------------------------------------------------------------
     */

    const updated =
      await dependencies
        .repository
        .update({
          quotationId:
            quotation
              .quotationId,

          changes:
            normalizedChanges,
        });

    if (
      !updated
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_FOUND",
        "Quotation was not found during update.",
        {
          quotationId:
            quotation
              .quotationId,
        },
        validation.warnings
      );
    }

    return createQuotationServiceSuccess(
      updated,
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Status update workflow
 * ============================================================================
 */

/**
 * Changes the workflow status of an existing Quotation.
 */
export async function updateQuotationStatus(
  dependencies:
    QuotationServiceDependencies,
  input:
    UpdateQuotationStatusInput
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  if (
    typeof input.quotationId !==
      "string" ||
    input.quotationId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "quotationId is required.",
      {
        field:
          "quotationId",

        value:
          input.quotationId,
      }
    );
  }

  try {
    /* ----------------------------------------------------------------------
     * 1. Load existing quotation first so transition can be validated
     * ----------------------------------------------------------------------
     */

    const quotation =
      await requireQuotationForMutation(
        dependencies,
        input.quotationId
          .trim()
      );

    /* ----------------------------------------------------------------------
     * 2. Validate payload + current -> next transition
     * ----------------------------------------------------------------------
     */

    const validation =
      validateUpdateQuotationStatusInput(
        input,
        quotation.status
      );

    if (
      !validation.valid
    ) {
      return createQuotationServiceFailure(
        "INVALID_STATUS_TRANSITION",
        "Quotation status update validation failed.",
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            validation.errors,
        },
        validation.warnings
      );
    }

    /* ----------------------------------------------------------------------
     * 3. Explicit transition check
     *
     * This is intentionally repeated at service level because the service
     * owns workflow decisions. It also protects future validator changes.
     * ----------------------------------------------------------------------
     */

    const transitionErrors =
      validateQuotationStatusTransition(
        quotation.status,
        validation.value
          .status
      );

    if (
      transitionErrors.length >
        0
    ) {
      return createQuotationServiceFailure(
        "INVALID_STATUS_TRANSITION",
        `Quotation status cannot change from ${quotation.status} to ${validation.value.status}.`,
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            transitionErrors,
        },
        validation.warnings
      );
    }

    /**
     * Repeating the same status is treated as idempotent.
     */
    if (
      quotation.status ===
        validation.value
          .status
    ) {
      return createQuotationServiceSuccess(
        quotation,
        validation.warnings
      );
    }

    /* ----------------------------------------------------------------------
     * 4. Persist approved status
     * ----------------------------------------------------------------------
     */

    const updated =
      await dependencies
        .repository
        .updateStatus({
          quotationId:
            quotation
              .quotationId,

          status:
            validation.value
              .status,
        });

    if (
      !updated
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_FOUND",
        "Quotation was not found during status update.",
        {
          quotationId:
            quotation
              .quotationId,
        },
        validation.warnings
      );
    }

    return createQuotationServiceSuccess(
      updated,
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Withdraw Quotation
 * ============================================================================
 */

/**
 * Vendor/authorized actor withdrawal workflow.
 *
 * A withdrawal is not a direct repository mutation contract of its own;
 * after domain validation it becomes a status update to WITHDRAWN.
 */
export async function withdrawQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    WithdrawQuotationInput
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  const validation =
    validateWithdrawQuotationInput(
      input
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation withdrawal validation failed.",
      {
        quotationId:
          input.quotationId,

        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  try {
    const quotation =
      await requireQuotationForMutation(
        dependencies,
        validation.value
          .quotationId
      );

    const statusErrors =
      validateQuotationWithdrawableStatus(
        quotation.status
      );

    if (
      statusErrors.length >
        0
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_WITHDRAWABLE",
        `Quotation cannot be withdrawn while its status is ${quotation.status}.`,
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            statusErrors,
        },
        validation.warnings
      );
    }

    const transitionErrors =
      validateQuotationStatusTransition(
        quotation.status,
        QuotationStatus
          .WITHDRAWN
      );

    if (
      transitionErrors.length >
        0
    ) {
      return createQuotationServiceFailure(
        "INVALID_STATUS_TRANSITION",
        `Quotation status cannot change from ${quotation.status} to WITHDRAWN.`,
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            transitionErrors,
        },
        validation.warnings
      );
    }

    const updated =
      await dependencies
        .repository
        .updateStatus({
          quotationId:
            quotation
              .quotationId,

          status:
            QuotationStatus
              .WITHDRAWN,
        });

    if (
      !updated
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_FOUND",
        "Quotation was not found during withdrawal.",
        {
          quotationId:
            quotation
              .quotationId,
        },
        validation.warnings
      );
    }

    return createQuotationServiceSuccess(
      updated,
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Reject Quotation
 * ============================================================================
 */

/**
 * Booking/customer/admin rejection workflow.
 */
export async function rejectQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    RejectQuotationInput
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  const validation =
    validateRejectQuotationInput(
      input
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation rejection validation failed.",
      {
        quotationId:
          input.quotationId,

        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  try {
    const quotation =
      await requireQuotationForMutation(
        dependencies,
        validation.value
          .quotationId
      );

    const statusErrors =
      validateQuotationRejectableStatus(
        quotation.status
      );

    if (
      statusErrors.length >
        0
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_REJECTABLE",
        `Quotation cannot be rejected while its status is ${quotation.status}.`,
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            statusErrors,
        },
        validation.warnings
      );
    }

    const transitionErrors =
      validateQuotationStatusTransition(
        quotation.status,
        QuotationStatus
          .REJECTED
      );

    if (
      transitionErrors.length >
        0
    ) {
      return createQuotationServiceFailure(
        "INVALID_STATUS_TRANSITION",
        `Quotation status cannot change from ${quotation.status} to REJECTED.`,
        {
          quotationId:
            quotation
              .quotationId,

          validationErrors:
            transitionErrors,
        },
        validation.warnings
      );
    }

    const updated =
      await dependencies
        .repository
        .updateStatus({
          quotationId:
            quotation
              .quotationId,

          status:
            QuotationStatus
              .REJECTED,
        });

    if (
      !updated
    ) {
      return createQuotationServiceFailure(
        "QUOTATION_NOT_FOUND",
        "Quotation was not found during rejection.",
        {
          quotationId:
            quotation
              .quotationId,
        },
        validation.warnings
      );
    }

    return createQuotationServiceSuccess(
      updated,
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Submit Draft convenience workflow
 * ============================================================================
 */

/**
 * Submits an existing DRAFT quotation.
 *
 * This gives controllers a semantic operation instead of manually
 * constructing status-update payloads everywhere.
 */
export async function submitDraftQuotation(
  dependencies:
    QuotationServiceDependencies,
  input: {
    quotationId:
      QuotationId;

    submittedBy:
      string;

    reason?:
      string;
  }
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  return updateQuotationStatus(
    dependencies,
    {
      quotationId:
        input.quotationId,

      status:
        QuotationStatus
          .SUBMITTED,

      changedBy:
        input.submittedBy,

      ...(input.reason
        ? {
            reason:
              input.reason,
          }
        : {}),
    }
  );
}

/* ============================================================================
 * Mark quotation as revised
 * ============================================================================
 */

/**
 * Workflow helper used when a submitted quotation is formally revised.
 */
export async function markQuotationRevised(
  dependencies:
    QuotationServiceDependencies,
  input: {
    quotationId:
      QuotationId;

    revisedBy:
      string;

    reason?:
      string;
  }
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  return updateQuotationStatus(
    dependencies,
    {
      quotationId:
        input.quotationId,

      status:
        QuotationStatus
          .REVISED,

      changedBy:
        input.revisedBy,

      ...(input.reason
        ? {
            reason:
              input.reason,
          }
        : {}),
    }
  );
}

/* ============================================================================
 * Part C service class methods
 * ============================================================================
 *
 * Copy the methods below INSIDE the existing QuotationService class,
 * immediately before its final closing brace.
 *
 * Do NOT paste a second QuotationService class.
 * ============================================================================
 */

/*

  update(
    input:
      UpdateQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return updateQuotation(
      this.dependencies,
      input
    );
  }

  updateStatus(
    input:
      UpdateQuotationStatusInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return updateQuotationStatus(
      this.dependencies,
      input
    );
  }

  withdraw(
    input:
      WithdrawQuotationInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return withdrawQuotation(
      this.dependencies,
      input
    );
  }

  reject(
    input:
      RejectQuotationInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return rejectQuotation(
      this.dependencies,
      input
    );
  }

  submitDraft(
    input: {
      quotationId:
        QuotationId;

      submittedBy:
        string;

      reason?:
        string;
    }
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return submitDraftQuotation(
      this.dependencies,
      input
    );
  }

  markRevised(
    input: {
      quotationId:
        QuotationId;

      revisedBy:
        string;

      reason?:
        string;
    }
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return markQuotationRevised(
      this.dependencies,
      input
    );
  }

*/

/* ============================================================================
 * Part C facade
 * ============================================================================
 */

export const QuotationServicePartC = {
  update:
    updateQuotation,

  updateStatus:
    updateQuotationStatus,

  withdraw:
    withdrawQuotation,

  reject:
    rejectQuotation,

  submitDraft:
    submitDraftQuotation,

  markRevised:
    markQuotationRevised,

  normalizeUpdatePricing:
    normalizeQuotationUpdatePricing,

  validateUpdatePricingConsistency:
    validateQuotationUpdatePricingConsistency,

  hasPricingMutation:
    hasQuotationPricingMutation,

  requireForMutation:
    requireQuotationForMutation,
} as const;

/* ============================================================================
 * End of Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Service
 * Part D
 * ============================================================================
 *
 * Selection / acceptance workflow:
 *
 * - Select quotation for Booking
 * - Prevent cross-Booking quotation selection
 * - Prevent multiple simultaneous selected quotations
 * - Move selected quotation to SHORTLISTED
 * - Unselect quotation
 * - Accept the currently selected quotation
 * - Use transaction manager for multi-record mutation
 *
 * IMPORTANT:
 *
 * Booking.selectedQuotation owns selection persistence.
 *
 * Quotation.selectedForBooking is the reverse relation.
 *
 * Selection and acceptance remain separate operations.
 * ============================================================================
 */

/* ============================================================================
 * Selection service contracts
 * ============================================================================
 */

export interface QuotationSelectionServiceData {
  bookingId:
    BookingId;

  selectedQuotationId?:
    QuotationId;

  quotation?:
    Quotation;

  changed:
    boolean;
}

/**
 * Explicit final acceptance command.
 *
 * We deliberately keep this separate from SelectQuotationInput because:
 *
 * select     -> SHORTLISTED
 * accept     -> ACCEPTED
 */
export interface AcceptQuotationServiceInput {
  bookingId:
    BookingId;

  quotationId:
    QuotationId;

  acceptedBy:
    string;

  reason?:
    string;
}

/* ============================================================================
 * Transaction requirement
 * ============================================================================
 */

/**
 * Selection changes Booking.selectedQuotation and may also change the
 * Quotation status. Both operations must happen together.
 */
export function requireQuotationTransactionManager(
  dependencies:
    QuotationServiceDependencies
): QuotationRepositoryPortTransactionManager {
  if (
    !dependencies
      .transactionManager
  ) {
    throw new QuotationServiceError(
      "TRANSACTION_FAILED",
      "Quotation transaction manager is required for this workflow."
    );
  }

  return dependencies
    .transactionManager;
}

/* ============================================================================
 * Actor validation
 * ============================================================================
 */

export function validateQuotationWorkflowActor(
  field:
    string,
  value:
    unknown
): QuotationServiceError | null {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    return new QuotationServiceError(
      "INVALID_SERVICE_INPUT",
      `${field} is required.`,
      {
        field,
        value,
      }
    );
  }

  return null;
}

/* ============================================================================
 * Booking / quotation relation check
 * ============================================================================
 */

/**
 * Ensures the quotation being selected really belongs to the Booking.
 *
 * This prevents:
 *
 * Booking A
 *     ↓
 * selecting
 *     ↓
 * Quotation from Booking B
 */
export function validateQuotationBelongsToBooking(
  quotation:
    Quotation,
  bookingId:
    BookingId
): QuotationServiceError | null {
  if (
    quotation.booking
      .bookingId !==
    bookingId
  ) {
    return new QuotationServiceError(
      "INVALID_SERVICE_INPUT",
      "Quotation does not belong to the supplied Booking.",
      {
        quotationId:
          quotation
            .quotationId,

        bookingId,

        value:
          quotation.booking
            .bookingId,
      }
    );
  }

  return null;
}

/* ============================================================================
 * Selection transaction
 * ============================================================================
 */

/**
 * Executes the complete selection mutation.
 *
 * Rules:
 *
 * 1. Booking must exist.
 * 2. Quotation must exist.
 * 3. Quotation must belong to Booking.
 * 4. Quotation status must be selectable.
 * 5. Booking cannot silently replace another selected quotation.
 * 6. Selected quotation becomes SHORTLISTED.
 * 7. Booking.selectedQuotationId is updated.
 *
 * Steps 6 and 7 occur in one transaction.
 */
export async function selectQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    SelectQuotationInput
): Promise<
  QuotationServiceResult<
    QuotationSelectionServiceData
  >
> {
  const validation =
    validateSelectQuotationInput(
      input
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation selection validation failed.",
      {
        quotationId:
          input.quotationId,

        bookingId:
          input.bookingId,

        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  const validatedInput =
    validation.value;

  try {
    const transactionManager =
      requireQuotationTransactionManager(
        dependencies
      );

    const data =
      await transactionManager
        .runInTransaction(
          async ({
            repository,
          }) => {
            /* --------------------------------------------------------------
             * 1. Booking must exist
             * --------------------------------------------------------------
             */

            const booking =
              await repository
                .checkBooking({
                  bookingId:
                    validatedInput
                      .bookingId,
                });

            if (
              !booking.exists
            ) {
              throw new QuotationServiceError(
                "BOOKING_NOT_FOUND",
                "Booking was not found.",
                {
                  bookingId:
                    validatedInput
                      .bookingId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 2. Load quotation
             * --------------------------------------------------------------
             */

            const quotation =
              await repository
                .findById(
                  validatedInput
                    .quotationId
                );

            if (
              !quotation
            ) {
              throw new QuotationServiceError(
                "QUOTATION_NOT_FOUND",
                "Quotation was not found.",
                {
                  quotationId:
                    validatedInput
                      .quotationId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 3. Quotation must belong to Booking
             * --------------------------------------------------------------
             */

            const relationError =
              validateQuotationBelongsToBooking(
                quotation,
                validatedInput
                  .bookingId
              );

            if (
              relationError
            ) {
              throw relationError;
            }

            /* --------------------------------------------------------------
             * 4. Quotation must be selectable
             * --------------------------------------------------------------
             */

            const selectableErrors =
              validateQuotationSelectableStatus(
                quotation.status
              );

            if (
              selectableErrors.length >
                0
            ) {
              throw new QuotationServiceError(
                "INVALID_STATUS_TRANSITION",
                `Quotation cannot be selected while its status is ${quotation.status}.`,
                {
                  quotationId:
                    quotation
                      .quotationId,

                  validationErrors:
                    selectableErrors,
                }
              );
            }

            /* --------------------------------------------------------------
             * 5. Check current Booking selection
             * --------------------------------------------------------------
             */

            const currentlySelected =
              await repository
                .findSelectedForBooking({
                  bookingId:
                    validatedInput
                      .bookingId,
                });

            /**
             * Same quotation already selected:
             * operation is idempotent.
             */
            if (
              currentlySelected &&
              currentlySelected
                .quotationId ===
              quotation
                .quotationId
            ) {
              return {
                bookingId:
                  validatedInput
                    .bookingId,

                selectedQuotationId:
                  quotation
                    .quotationId,

                quotation:
                  currentlySelected,

                changed:
                  false,
              };
            }

            /**
             * Do not silently replace an existing selection.
             *
             * Explicit unselection must occur first.
             */
            if (
              currentlySelected
            ) {
              throw new QuotationServiceError(
                "SELECTED_QUOTATION_MUTATION_BLOCKED",
                "Another quotation is already selected for this Booking. Unselect it before selecting a different quotation.",
                {
                  quotationId:
                    currentlySelected
                      .quotationId,

                  bookingId:
                    validatedInput
                      .bookingId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 6. Move selected quote to SHORTLISTED
             * --------------------------------------------------------------
             */

            let shortlistedQuotation =
              quotation;

            if (
              quotation.status !==
                QuotationStatus
                  .SHORTLISTED
            ) {
              const transitionErrors =
                validateQuotationStatusTransition(
                  quotation.status,
                  QuotationStatus
                    .SHORTLISTED
                );

              if (
                transitionErrors.length >
                  0
              ) {
                throw new QuotationServiceError(
                  "INVALID_STATUS_TRANSITION",
                  `Quotation cannot change from ${quotation.status} to SHORTLISTED.`,
                  {
                    quotationId:
                      quotation
                        .quotationId,

                    validationErrors:
                      transitionErrors,
                  }
                );
              }

              const updated =
                await repository
                  .updateStatus({
                    quotationId:
                      quotation
                        .quotationId,

                    status:
                      QuotationStatus
                        .SHORTLISTED,
                  });

              if (
                !updated
              ) {
                throw new QuotationServiceError(
                  "QUOTATION_NOT_FOUND",
                  "Quotation disappeared during selection.",
                  {
                    quotationId:
                      quotation
                        .quotationId,
                  }
                );
              }

              shortlistedQuotation =
                updated;
            }

            /* --------------------------------------------------------------
             * 7. Persist Booking.selectedQuotation
             * --------------------------------------------------------------
             */

            const selection =
              await repository
                .selectForBooking({
                  bookingId:
                    validatedInput
                      .bookingId,

                  quotationId:
                    quotation
                      .quotationId,
                });

            /* --------------------------------------------------------------
             * 8. Re-read quotation so selectedForBooking is hydrated
             * --------------------------------------------------------------
             */

            const selectedQuotation =
              await repository
                .findById(
                  quotation
                    .quotationId
                );

            if (
              !selectedQuotation
            ) {
              throw new QuotationServiceError(
                "QUOTATION_NOT_FOUND",
                "Selected quotation could not be reloaded.",
                {
                  quotationId:
                    quotation
                      .quotationId,
                }
              );
            }

            return {
              bookingId:
                selection
                  .bookingId,

              selectedQuotationId:
                selectedQuotation
                  .quotationId,

              quotation:
                selectedQuotation ??
                shortlistedQuotation,

              changed:
                selection.changed ||
                quotation.status !==
                  QuotationStatus
                    .SHORTLISTED,
            };
          }
        );

    return createQuotationServiceSuccess(
      data,
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Unselect quotation
 * ============================================================================
 */

/**
 * Clears Booking.selectedQuotation.
 *
 * SHORTLISTED status remains intact.
 *
 * We deliberately do NOT guess whether the quotation should revert to
 * SUBMITTED or REVISED because the service cannot reliably know its
 * previous status without a status-history model.
 */
export async function unselectQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    UnselectQuotationInput
): Promise<
  QuotationServiceResult<
    QuotationSelectionServiceData
  >
> {
  const validation =
    validateUnselectQuotationInput(
      input
    );

  if (
    !validation.valid
  ) {
    return createQuotationServiceFailure(
      "VALIDATION_FAILED",
      "Quotation unselection validation failed.",
      {
        bookingId:
          input.bookingId,

        validationErrors:
          validation.errors,
      },
      validation.warnings
    );
  }

  try {
    const booking =
      await dependencies
        .repository
        .checkBooking({
          bookingId:
            validation.value
              .bookingId,
        });

    if (
      !booking.exists
    ) {
      return createQuotationServiceFailure(
        "BOOKING_NOT_FOUND",
        "Booking was not found.",
        {
          bookingId:
            validation.value
              .bookingId,
        },
        validation.warnings
      );
    }

    const selected =
      await dependencies
        .repository
        .findSelectedForBooking({
          bookingId:
            validation.value
              .bookingId,
        });

    /**
     * Nothing selected:
     * idempotent success.
     */
    if (
      !selected
    ) {
      return createQuotationServiceSuccess(
        {
          bookingId:
            validation.value
              .bookingId,

          changed:
            false,
        },
        validation.warnings
      );
    }

    /**
     * Once formally ACCEPTED, ordinary unselection is prohibited.
     *
     * Reversal of an accepted quotation should later be an explicit
     * cancellation/rebooking workflow.
     */
    if (
      selected.status ===
        QuotationStatus
          .ACCEPTED
    ) {
      return createQuotationServiceFailure(
        "SELECTED_QUOTATION_MUTATION_BLOCKED",
        "An accepted quotation cannot be unselected through the ordinary quotation-selection workflow.",
        {
          quotationId:
            selected
              .quotationId,

          bookingId:
            validation.value
              .bookingId,
        },
        validation.warnings
      );
    }

    const result =
      await dependencies
        .repository
        .unselectForBooking({
          bookingId:
            validation.value
              .bookingId,
        });

    return createQuotationServiceSuccess(
      {
        bookingId:
          result.bookingId,

        changed:
          result.changed,
      },
      validation.warnings
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details,
      validation.warnings
    );
  }
}

/* ============================================================================
 * Acceptance input validation
 * ============================================================================
 */

export function validateAcceptQuotationServiceInput(
  input:
    AcceptQuotationServiceInput
): QuotationServiceError | null {
  if (
    typeof input.bookingId !==
      "string" ||
    input.bookingId
      .trim()
      .length ===
      0
  ) {
    return new QuotationServiceError(
      "INVALID_SERVICE_INPUT",
      "bookingId is required.",
      {
        field:
          "bookingId",

        value:
          input.bookingId,
      }
    );
  }

  if (
    typeof input.quotationId !==
      "string" ||
    input.quotationId
      .trim()
      .length ===
      0
  ) {
    return new QuotationServiceError(
      "INVALID_SERVICE_INPUT",
      "quotationId is required.",
      {
        field:
          "quotationId",

        value:
          input.quotationId,
      }
    );
  }

  return validateQuotationWorkflowActor(
    "acceptedBy",
    input.acceptedBy
  );
}

/* ============================================================================
 * Accept selected quotation
 * ============================================================================
 */

/**
 * Final commercial acceptance.
 *
 * Requirements:
 *
 * - Booking exists
 * - Booking has a selected quotation
 * - selected quotation is the supplied quotation
 * - quotation belongs to Booking
 * - status transition to ACCEPTED is legal
 *
 * The Booking selection remains attached after acceptance.
 */
export async function acceptQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    AcceptQuotationServiceInput
): Promise<
  QuotationServiceResult<
    Quotation
  >
> {
  const inputError =
    validateAcceptQuotationServiceInput(
      input
    );

  if (
    inputError
  ) {
    return createQuotationServiceFailure(
      inputError.code,
      inputError.message,
      inputError.details
    );
  }

  try {
    const transactionManager =
      requireQuotationTransactionManager(
        dependencies
      );

    const accepted =
      await transactionManager
        .runInTransaction(
          async ({
            repository,
          }) => {
            /* --------------------------------------------------------------
             * 1. Booking must exist
             * --------------------------------------------------------------
             */

            const booking =
              await repository
                .checkBooking({
                  bookingId:
                    input.bookingId,
                });

            if (
              !booking.exists
            ) {
              throw new QuotationServiceError(
                "BOOKING_NOT_FOUND",
                "Booking was not found.",
                {
                  bookingId:
                    input.bookingId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 2. Booking must currently have a selected quotation
             * --------------------------------------------------------------
             */

            const selected =
              await repository
                .findSelectedForBooking({
                  bookingId:
                    input.bookingId,
                });

            if (
              !selected
            ) {
              throw new QuotationServiceError(
                "SELECTED_QUOTATION_MUTATION_BLOCKED",
                "No quotation is currently selected for this Booking.",
                {
                  bookingId:
                    input.bookingId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 3. Supplied quotation must be the selected quotation
             * --------------------------------------------------------------
             */

            if (
              selected
                .quotationId !==
              input.quotationId
            ) {
              throw new QuotationServiceError(
                "SELECTED_QUOTATION_MUTATION_BLOCKED",
                "Only the quotation currently selected for the Booking can be accepted.",
                {
                  bookingId:
                    input.bookingId,

                  quotationId:
                    input.quotationId,

                  value:
                    selected
                      .quotationId,
                }
              );
            }

            /* --------------------------------------------------------------
             * 4. Defensive Booking relationship check
             * --------------------------------------------------------------
             */

            const relationError =
              validateQuotationBelongsToBooking(
                selected,
                input.bookingId
              );

            if (
              relationError
            ) {
              throw relationError;
            }

            /**
             * Already accepted:
             * idempotent success.
             */
            if (
              selected.status ===
                QuotationStatus
                  .ACCEPTED
            ) {
              return selected;
            }

            /* --------------------------------------------------------------
             * 5. Validate acceptance transition
             * --------------------------------------------------------------
             */

            const transitionErrors =
              validateQuotationStatusTransition(
                selected.status,
                QuotationStatus
                  .ACCEPTED
              );

            if (
              transitionErrors.length >
                0
            ) {
              throw new QuotationServiceError(
                "INVALID_STATUS_TRANSITION",
                `Quotation cannot change from ${selected.status} to ACCEPTED.`,
                {
                  quotationId:
                    selected
                      .quotationId,

                  validationErrors:
                    transitionErrors,
                }
              );
            }

            /* --------------------------------------------------------------
             * 6. Persist accepted status
             * --------------------------------------------------------------
             */

            const updated =
              await repository
                .updateStatus({
                  quotationId:
                    selected
                      .quotationId,

                  status:
                    QuotationStatus
                      .ACCEPTED,
                });

            if (
              !updated
            ) {
              throw new QuotationServiceError(
                "QUOTATION_NOT_FOUND",
                "Quotation was not found during acceptance.",
                {
                  quotationId:
                    selected
                      .quotationId,
                }
              );
            }

            return updated;
          }
        );

    return createQuotationServiceSuccess(
      accepted
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Customer-safe selection
 * ============================================================================
 */

/**
 * Useful for customer-facing controller routes.
 *
 * Vendor identity is removed before returning the selected quotation.
 */
export async function selectCustomerSafeQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    SelectQuotationInput
): Promise<
  QuotationServiceResult<{
    bookingId:
      BookingId;

    selectedQuotationId?:
      QuotationId;

    quotation?:
      CustomerSafeQuotation;

    changed:
      boolean;
  }>
> {
  const result =
    await selectQuotation(
      dependencies,
      input
    );

  if (
    !result.success
  ) {
    return result;
  }

  return createQuotationServiceSuccess(
    {
      bookingId:
        result.data
          .bookingId,

      ...(result.data
        .selectedQuotationId
        ? {
            selectedQuotationId:
              result.data
                .selectedQuotationId,
          }
        : {}),

      ...(result.data
        .quotation
        ? {
            quotation:
              CompleteQuotationMapper
                .read
                .toCustomerSafe(
                  result.data
                    .quotation
                ),
          }
        : {}),

      changed:
        result.data
          .changed,
    },
    result.warnings
  );
}

/* ============================================================================
 * Customer-safe acceptance
 * ============================================================================
 */

export async function acceptCustomerSafeQuotation(
  dependencies:
    QuotationServiceDependencies,
  input:
    AcceptQuotationServiceInput
): Promise<
  QuotationServiceResult<
    CustomerSafeQuotation
  >
> {
  const result =
    await acceptQuotation(
      dependencies,
      input
    );

  if (
    !result.success
  ) {
    return result;
  }

  return createQuotationServiceSuccess(
    CompleteQuotationMapper
      .read
      .toCustomerSafe(
        result.data
      ),
    result.warnings
  );
}

/* ============================================================================
 * Part D service class methods
 *
 * Copy the methods below INSIDE the existing QuotationService class.
 * Do not create another QuotationService class.
 * ============================================================================
 */

/*

  select(
    input:
      SelectQuotationInput
  ): Promise<
    QuotationServiceResult<
      QuotationSelectionServiceData
    >
  > {
    return selectQuotation(
      this.dependencies,
      input
    );
  }

  selectCustomerSafe(
    input:
      SelectQuotationInput
  ) {
    return selectCustomerSafeQuotation(
      this.dependencies,
      input
    );
  }

  unselect(
    input:
      UnselectQuotationInput
  ): Promise<
    QuotationServiceResult<
      QuotationSelectionServiceData
    >
  > {
    return unselectQuotation(
      this.dependencies,
      input
    );
  }

  accept(
    input:
      AcceptQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      Quotation
    >
  > {
    return acceptQuotation(
      this.dependencies,
      input
    );
  }

  acceptCustomerSafe(
    input:
      AcceptQuotationServiceInput
  ): Promise<
    QuotationServiceResult<
      CustomerSafeQuotation
    >
  > {
    return acceptCustomerSafeQuotation(
      this.dependencies,
      input
    );
  }

*/

/* ============================================================================
 * Part D facade
 * ============================================================================
 */

export const QuotationServicePartD = {
  select:
    selectQuotation,

  selectCustomerSafe:
    selectCustomerSafeQuotation,

  unselect:
    unselectQuotation,

  accept:
    acceptQuotation,

  acceptCustomerSafe:
    acceptCustomerSafeQuotation,

  validateBookingRelation:
    validateQuotationBelongsToBooking,

  validateAcceptInput:
    validateAcceptQuotationServiceInput,

  requireTransactionManager:
    requireQuotationTransactionManager,
} as const;

/* ============================================================================
 * End of Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Service
 * Part E
 * ============================================================================
 *
 * Final service responsibilities:
 *
 * - Booking quotation commercial summary
 * - Quotation statistics
 * - Expire overdue quotations
 * - Repository health
 * - Final complete service facade
 *
 * IMPORTANT:
 *
 * - Expiry is a workflow status transition, not deletion
 * - Repository statistics are mapped into domain statistics
 * - Revised quotations remain included in totalQuotations even though
 *   the current QuotationStatistics contract has no revisedQuotations field
 * ============================================================================
 */

/* ============================================================================
 * Booking quotation summary
 * ============================================================================
 */

export interface GetBookingQuotationSummaryServiceInput {
  bookingId:
    BookingId;

  statuses?:
    QuotationStatus[];
}

/**
 * Retrieves commercial summary information for one Booking.
 *
 * This is useful for:
 *
 * - Booking dashboard
 * - quotation comparison
 * - lowest/highest quotation display
 * - selected quotation amount
 */
export async function getBookingQuotationSummary(
  dependencies:
    QuotationServiceDependencies,
  input:
    GetBookingQuotationSummaryServiceInput
): Promise<
  QuotationServiceResult<
    QuotationRepositoryAmountSummary
  >
> {
  if (
    typeof input.bookingId !==
      "string" ||
    input.bookingId
      .trim()
      .length ===
      0
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "bookingId is required.",
      {
        field:
          "bookingId",

        value:
          input.bookingId,
      }
    );
  }

  const bookingId =
    input.bookingId.trim();

  try {
    const booking =
      await dependencies
        .repository
        .checkBooking({
          bookingId,
        });

    if (
      !booking.exists
    ) {
      return createQuotationServiceFailure(
        "BOOKING_NOT_FOUND",
        "Booking was not found.",
        {
          bookingId,
        }
      );
    }

    const summary =
      await dependencies
        .repository
        .getBookingQuotationSummary({
          bookingId,

          ...(input.statuses
            ? {
                statuses:
                  input.statuses,
              }
            : {}),
        });

    return createQuotationServiceSuccess(
      summary
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Active Booking quotation summary
 * ============================================================================
 */

/**
 * Convenience summary for commercially active quotations only.
 */
export async function getActiveBookingQuotationSummary(
  dependencies:
    QuotationServiceDependencies,
  bookingId:
    BookingId
): Promise<
  QuotationServiceResult<
    QuotationRepositoryAmountSummary
  >
> {
  return getBookingQuotationSummary(
    dependencies,
    {
      bookingId,

      statuses: [
        QuotationStatus.SUBMITTED,
        QuotationStatus.REVISED,
        QuotationStatus.SHORTLISTED,
      ],
    }
  );
}

/* ============================================================================
 * Repository statistics -> Domain statistics
 * ============================================================================
 */

/**
 * Finds one status count from the repository statistics result.
 */
export function getQuotationRepositoryStatusCount(
  statistics:
    QuotationRepositoryStatistics,
  status:
    QuotationStatus
): number {
  return (
    statistics.statusCounts
      .find(
        (
          item
        ) =>
          item.status ===
          status
      )
      ?.count ??
    0
  );
}

/**
 * Converts persistence-oriented statistics into the public
 * QuotationStatistics domain contract.
 *
 * NOTE:
 *
 * The current domain QuotationStatistics type has no dedicated
 * revisedQuotations field.
 *
 * REVISED records remain included in totalQuotations.
 */
export function mapQuotationRepositoryStatisticsToDomain(
  statistics:
    QuotationRepositoryStatistics
): QuotationStatistics {
  return {
    totalQuotations:
      statistics.total,

    draftQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.DRAFT
      ),

    submittedQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.SUBMITTED
      ),

    shortlistedQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.SHORTLISTED
      ),

    acceptedQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.ACCEPTED
      ),

    rejectedQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.REJECTED
      ),

    expiredQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.EXPIRED
      ),

    withdrawnQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.WITHDRAWN
      ),

    cancelledQuotations:
      getQuotationRepositoryStatusCount(
        statistics,
        QuotationStatus.CANCELLED
      ),

    ...(statistics.averageAmount !==
    undefined
      ? {
          averageQuotationAmount:
            statistics.averageAmount,
        }
      : {}),

    ...(statistics.minimumAmount !==
    undefined
      ? {
          lowestQuotationAmount:
            statistics.minimumAmount,
        }
      : {}),

    ...(statistics.maximumAmount !==
    undefined
      ? {
          highestQuotationAmount:
            statistics.maximumAmount,
        }
      : {}),
  };
}

/* ============================================================================
 * Quotation statistics service
 * ============================================================================
 */

export interface GetQuotationStatisticsServiceInput {
  query?:
    QuotationListQuery;
}

/**
 * Returns Quotation statistics using optional search criteria.
 *
 * Pagination and sorting are deliberately ignored because statistics
 * describe the complete matching population, not one UI page.
 */
export async function getQuotationStatistics(
  dependencies:
    QuotationServiceDependencies,
  input:
    GetQuotationStatisticsServiceInput =
      {}
): Promise<
  QuotationServiceResult<
    QuotationStatistics
  >
> {
  const criteria =
    input.query
      ?.criteria;

  try {
    const repositoryStatistics =
      await dependencies
        .repository
        .getStatistics(
          criteria
            ? {
                filter:
                  mapQuotationListQueryToRepositoryQuery({
                    criteria,
                  }).filter,
              }
            : undefined
        );

    return createQuotationServiceSuccess(
      mapQuotationRepositoryStatisticsToDomain(
        repositoryStatistics
      )
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Expiration workflow contracts
 * ============================================================================
 */

export interface ExpireDueQuotationsServiceInput {
  /**
   * Actor executing the automatic/manual expiry workflow.
   *
   * Examples:
   *
   * SYSTEM
   * CRON
   * ADMIN:<id>
   */
  expiredBy:
    string;

  /**
   * Defaults to service clock.
   */
  cutoff?:
    Date;

  /**
   * Defaults to 100.
   */
  batchSize?:
    number;
}

export interface ExpireDueQuotationsServiceData {
  scanned:
    number;

  expired:
    number;

  skipped:
    number;

  failed:
    number;

  expiredQuotationIds:
    QuotationId[];

  failedQuotationIds:
    QuotationId[];
}

/* ============================================================================
 * Expiration constants
 * ============================================================================
 */

/**
 * These are the commercially active states that may become EXPIRED.
 *
 * DRAFT is intentionally excluded.
 */
export const QUOTATION_EXPIRABLE_STATUSES:
  QuotationStatus[] = [
    QuotationStatus.SUBMITTED,
    QuotationStatus.REVISED,
    QuotationStatus.SHORTLISTED,
  ];

export const DEFAULT_QUOTATION_EXPIRY_BATCH_SIZE =
  100;

export const MAX_QUOTATION_EXPIRY_BATCH_SIZE =
  100;

/* ============================================================================
 * Expiration input normalization
 * ============================================================================
 */

export function normalizeQuotationExpiryBatchSize(
  value:
    number | undefined
): number {
  if (
    !Number.isInteger(
      value
    ) ||
    (
      value as number
    ) <=
      0
  ) {
    return DEFAULT_QUOTATION_EXPIRY_BATCH_SIZE;
  }

  return Math.min(
    value as number,
    MAX_QUOTATION_EXPIRY_BATCH_SIZE
  );
}

/* ============================================================================
 * Expire overdue quotations
 * ============================================================================
 */

/**
 * Marks active quotations as EXPIRED when validUntil has passed.
 *
 * This routine intentionally performs status updates through the repository
 * rather than deleting quotations.
 */
export async function expireDueQuotations(
  dependencies:
    QuotationServiceDependencies,
  input:
    ExpireDueQuotationsServiceInput
): Promise<
  QuotationServiceResult<
    ExpireDueQuotationsServiceData
  >
> {
  const actorError =
    validateQuotationWorkflowActor(
      "expiredBy",
      input.expiredBy
    );

  if (
    actorError
  ) {
    return createQuotationServiceFailure(
      actorError.code,
      actorError.message,
      actorError.details
    );
  }

  const cutoff =
    input.cutoff ??
    quotationServiceNow(
      dependencies
    );

  if (
    Number.isNaN(
      cutoff.getTime()
    )
  ) {
    return createQuotationServiceFailure(
      "INVALID_SERVICE_INPUT",
      "cutoff must be a valid Date.",
      {
        field:
          "cutoff",

        value:
          input.cutoff,
      }
    );
  }

  const batchSize =
    normalizeQuotationExpiryBatchSize(
      input.batchSize
    );

  const result:
    ExpireDueQuotationsServiceData = {
    scanned:
      0,

    expired:
      0,

    skipped:
      0,

    failed:
      0,

    expiredQuotationIds:
      [],

    failedQuotationIds:
      [],
  };

  try {
    /**
     * One bounded page per execution.
     *
     * This makes the workflow suitable for future scheduled/background
     * execution without allowing an unbounded mutation run.
     */
    const page =
      await dependencies
        .repository
        .list({
          filter: {
            statuses:
              QUOTATION_EXPIRABLE_STATUSES,

            validUntil:
              cutoff
                .toISOString(),
          },

          pagination: {
            page:
              1,

            pageSize:
              batchSize,
          },

          sort: {
            field:
              "validUntil",

            direction:
              "asc",
          },
        });

    result.scanned =
      page.items.length;

    for (
      const item
      of page.items
    ) {
      /**
       * Defensive check.
       *
       * The query already restricts validUntil, but this ensures null or
       * malformed dates are never expired accidentally.
       */
      if (
        !item.validUntil
      ) {
        result.skipped +=
          1;

        continue;
      }

      const validUntil =
        new Date(
          item.validUntil
        );

      if (
        Number.isNaN(
          validUntil.getTime()
        ) ||
        validUntil.getTime() >
          cutoff.getTime()
      ) {
        result.skipped +=
          1;

        continue;
      }

      const transitionErrors =
        validateQuotationStatusTransition(
          item.status,
          QuotationStatus.EXPIRED
        );

      if (
        transitionErrors.length >
          0
      ) {
        result.skipped +=
          1;

        continue;
      }

      try {
        const updated =
          await dependencies
            .repository
            .updateStatus({
              quotationId:
                item.quotationId,

              status:
                QuotationStatus.EXPIRED,
            });

        if (
          updated
        ) {
          result.expired +=
            1;

          result
            .expiredQuotationIds
            .push(
              item.quotationId
            );
        } else {
          result.failed +=
            1;

          result
            .failedQuotationIds
            .push(
              item.quotationId
            );
        }
      } catch {
        /**
         * One failed quotation should not terminate the whole expiry batch.
         */
        result.failed +=
          1;

        result
          .failedQuotationIds
          .push(
            item.quotationId
          );
      }
    }

    return createQuotationServiceSuccess(
      result
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Repository health service
 * ============================================================================
 */

/**
 * Exposes repository health without leaking Prisma implementation details.
 */
export async function getQuotationRepositoryHealth(
  dependencies:
    QuotationServiceDependencies
): Promise<
  QuotationServiceResult<
    QuotationRepositoryHealthResult
  >
> {
  try {
    const health =
      await dependencies
        .repository
        .checkHealth();

    if (
      !health.healthy
    ) {
      return createQuotationServiceFailure(
        "REPOSITORY_ERROR",
        health.message ??
          "Quotation repository is unhealthy.",
        {
          value:
            health,
        }
      );
    }

    return createQuotationServiceSuccess(
      health
    );
  } catch (
    error
  ) {
    const normalized =
      mapQuotationRepositoryErrorToServiceError(
        error
      );

    return createQuotationServiceFailure(
      normalized.code,
      normalized.message,
      normalized.details
    );
  }
}

/* ============================================================================
 * Quotation service diagnostics
 * ============================================================================
 */

export interface QuotationServiceDiagnostics {
  repositoryHealthy:
    boolean;

  checkedAt:
    Date;

  repositoryLatencyMilliseconds?:
    number;

  transactionsAvailable:
    boolean;
}

export async function getQuotationServiceDiagnostics(
  dependencies:
    QuotationServiceDependencies
): Promise<
  QuotationServiceDiagnostics
> {
  const health =
    await dependencies
      .repository
      .checkHealth();

  return {
    repositoryHealthy:
      health.healthy,

    checkedAt:
      health.checkedAt,

    ...(health.latencyMilliseconds !==
    undefined
      ? {
          repositoryLatencyMilliseconds:
            health.latencyMilliseconds,
        }
      : {}),

    transactionsAvailable:
      Boolean(
        dependencies
          .transactionManager
      ),
  };
}

/* ============================================================================
 * Part E class methods
 *
 * Copy these methods INSIDE the existing QuotationService class,
 * immediately before its final closing brace.
 *
 * Do NOT create a second class.
 * ============================================================================
 */

/*

  getBookingSummary(
    input:
      GetBookingQuotationSummaryServiceInput
  ): Promise<
    QuotationServiceResult<
      QuotationRepositoryAmountSummary
    >
  > {
    return getBookingQuotationSummary(
      this.dependencies,
      input
    );
  }

  getActiveBookingSummary(
    bookingId:
      BookingId
  ): Promise<
    QuotationServiceResult<
      QuotationRepositoryAmountSummary
    >
  > {
    return getActiveBookingQuotationSummary(
      this.dependencies,
      bookingId
    );
  }

  getStatistics(
    input:
      GetQuotationStatisticsServiceInput =
        {}
  ): Promise<
    QuotationServiceResult<
      QuotationStatistics
    >
  > {
    return getQuotationStatistics(
      this.dependencies,
      input
    );
  }

  expireDue(
    input:
      ExpireDueQuotationsServiceInput
  ): Promise<
    QuotationServiceResult<
      ExpireDueQuotationsServiceData
    >
  > {
    return expireDueQuotations(
      this.dependencies,
      input
    );
  }

  getRepositoryHealth():
    Promise<
      QuotationServiceResult<
        QuotationRepositoryHealthResult
      >
    > {
    return getQuotationRepositoryHealth(
      this.dependencies
    );
  }

  getDiagnostics():
    Promise<
      QuotationServiceDiagnostics
    > {
    return getQuotationServiceDiagnostics(
      this.dependencies
    );
  }

*/

/* ============================================================================
 * Part E facade
 * ============================================================================
 */

export const QuotationServicePartE = {
  getBookingSummary:
    getBookingQuotationSummary,

  getActiveBookingSummary:
    getActiveBookingQuotationSummary,

  getStatistics:
    getQuotationStatistics,

  mapStatistics:
    mapQuotationRepositoryStatisticsToDomain,

  expireDue:
    expireDueQuotations,

  getRepositoryHealth:
    getQuotationRepositoryHealth,

  getDiagnostics:
    getQuotationServiceDiagnostics,

  expirableStatuses:
    QUOTATION_EXPIRABLE_STATUSES,
} as const;

/* ============================================================================
 * Final complete Quotation service facade
 * ============================================================================
 */

export const CompleteQuotationService = {
  /* ------------------------------------------------------------------------
   * Creation
   * ------------------------------------------------------------------------
   */

  create:
    createQuotation,

  createOrThrow:
    requireCreatedQuotation,

  /* ------------------------------------------------------------------------
   * Read
   * ------------------------------------------------------------------------
   */

  getById:
    getQuotationById,

  getByQuotationNumber:
    getQuotationByNumber,

  getByReferenceId:
    getQuotationByReferenceId,

  getCustomerSafeById:
    getCustomerSafeQuotationById,

  getByBooking:
    getBookingQuotations,

  getCustomerSafeByBooking:
    getBookingCustomerSafeQuotations,

  getActiveByBooking:
    getActiveBookingQuotations,

  getSelectedByBooking:
    getSelectedBookingQuotation,

  getCustomerSafeSelectedByBooking:
    getCustomerSafeSelectedBookingQuotation,

  getComparison:
    getBookingQuotationComparison,

  list:
    listQuotations,

  listCustomerSafe:
    listCustomerSafeQuotations,

  /* ------------------------------------------------------------------------
   * Editing / workflow
   * ------------------------------------------------------------------------
   */

  update:
    updateQuotation,

  updateStatus:
    updateQuotationStatus,

  submitDraft:
    submitDraftQuotation,

  markRevised:
    markQuotationRevised,

  withdraw:
    withdrawQuotation,

  reject:
    rejectQuotation,

  /* ------------------------------------------------------------------------
   * Selection / acceptance
   * ------------------------------------------------------------------------
   */

  select:
    selectQuotation,

  selectCustomerSafe:
    selectCustomerSafeQuotation,

  unselect:
    unselectQuotation,

  accept:
    acceptQuotation,

  acceptCustomerSafe:
    acceptCustomerSafeQuotation,

  /* ------------------------------------------------------------------------
   * Commercial summary
   * ------------------------------------------------------------------------
   */

  getBookingSummary:
    getBookingQuotationSummary,

  getActiveBookingSummary:
    getActiveBookingQuotationSummary,

  /* ------------------------------------------------------------------------
   * Statistics
   * ------------------------------------------------------------------------
   */

  getStatistics:
    getQuotationStatistics,

  /* ------------------------------------------------------------------------
   * Expiration
   * ------------------------------------------------------------------------
   */

  expireDue:
    expireDueQuotations,

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  getRepositoryHealth:
    getQuotationRepositoryHealth,

  getDiagnostics:
    getQuotationServiceDiagnostics,

  /* ------------------------------------------------------------------------
   * Factory
   * ------------------------------------------------------------------------
   */

  createService:
    createQuotationService,
} as const;

/* ============================================================================
 * End of quotation.service.ts
 * ============================================================================
 */