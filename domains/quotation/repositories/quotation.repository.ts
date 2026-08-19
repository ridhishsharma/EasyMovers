/**
 * ============================================================================
 * EasyMovers
 * Quotation Repository Contract
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/repositories/quotation.repository.ts
 *
 * Responsibilities:
 * - Define Quotation persistence contracts
 * - Define repository query/filter contracts
 * - Define pagination and sorting contracts
 * - Define create/update repository inputs
 * - Define lookup and existence contracts
 * - Define repository operation result contracts
 *
 * This file MUST NOT:
 * - Import Prisma
 * - Perform database access
 * - Perform HTTP handling
 * - Perform business validation
 * - Generate quotation business decisions
 *
 * Prisma implementation will live in:
 * domains/quotation/repositories/quotation.prisma.repository.ts
 * ============================================================================
 */

import type {
  BookingId,
  CreateQuotationInput,
  LeadId,
  PaginatedQuotationResult,
  Quotation,
  QuotationId,
  QuotationListItem,
  QuotationListQuery,
  QuotationNumber,
  QuotationReferenceId,
  QuotationSearchCriteria,
  QuotationSort,
  QuotationStatus,
  UpdateQuotationInput,
  UserId,
  VendorId,
} from "../models/quotation.model";

/* ============================================================================
 * Repository identifiers
 * ============================================================================
 */

/**
 * Identifier types are re-exposed through repository-specific aliases
 * so future persistence implementations remain independent of raw strings.
 */
export type QuotationRepositoryId =
  QuotationId;

export type QuotationRepositoryNumber =
  QuotationNumber;

export type QuotationRepositoryReferenceId =
  QuotationReferenceId;

/* ============================================================================
 * Repository sorting
 * ============================================================================
 */

/**
 * Repository sorting uses the same domain-supported fields.
 */
export type QuotationRepositorySort =
  QuotationSort;

/* ============================================================================
 * Repository pagination
 * ============================================================================
 */

/**
 * One-based repository pagination input.
 */
export interface QuotationRepositoryPagination {
  page:
    number;

  pageSize:
    number;
}

/**
 * Pagination metadata returned by repository queries.
 */
export interface QuotationRepositoryPaginationMetadata {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;

  hasNextPage:
    boolean;

  hasPreviousPage:
    boolean;
}

/**
 * Generic paginated repository response.
 */
export interface QuotationRepositoryPage<
  T
> {
  items:
    T[];

  pagination:
    QuotationRepositoryPaginationMetadata;
}

/* ============================================================================
 * Repository filters
 * ============================================================================
 */

/**
 * Quotation persistence filters.
 *
 * This intentionally mirrors the supported domain search capabilities
 * without exposing Prisma-specific filter types.
 */
export interface QuotationRepositoryFilter {
  quotationId?:
    QuotationId;

  quotationNumber?:
    QuotationNumber;

  referenceId?:
    QuotationReferenceId;

  leadId?:
    LeadId;

  bookingId?:
    BookingId;

  vendorId?:
    VendorId;

  userId?:
    UserId;

  status?:
    QuotationStatus;

  statuses?:
    QuotationStatus[];

  selectedForBooking?:
    boolean;

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  validFrom?:
    string;

  validUntil?:
    string;

  pickupDateFrom?:
    string;

  pickupDateTo?:
    string;

  createdFrom?:
    string;

  createdUntil?:
    string;

  /**
   * Repository implementation may search fields such as:
   *
   * - quotationNumber
   * - referenceId
   * - remarks
   * - internalRemarks
   *
   * Customer-facing services must still apply Vendor masking.
   */
  search?:
    string;
}

/* ============================================================================
 * Complete list query
 * ============================================================================
 */

export interface QuotationRepositoryListQuery {
  filter?:
    QuotationRepositoryFilter;

  pagination?:
    QuotationRepositoryPagination;

  sort?:
    QuotationRepositorySort;
}

/* ============================================================================
 * Repository operation result
 * ============================================================================
 */

/**
 * Generic persistence operation result.
 *
 * Most repository methods may return values directly, but this contract
 * is available for operations where explicit success/failure metadata
 * is useful.
 */
export interface QuotationRepositoryOperationResult<
  T
> {
  success:
    boolean;

  data?:
    T;

  errorCode?:
    string;

  errorMessage?:
    string;
}

/* ============================================================================
 * Create repository input
 * ============================================================================
 */

/**
 * Unique identity supplied by the service before persistence.
 *
 * Prisma generates the primary ID itself unless quotationId is provided.
 */
export interface QuotationRepositoryGeneratedIdentity {
  quotationNumber:
    QuotationNumber;

  referenceId:
    QuotationReferenceId;

  quotationId?:
    QuotationId;
}

/**
 * Repository create input.
 *
 * The service is responsible for:
 * - validating CreateQuotationInput
 * - generating quotationNumber
 * - generating referenceId
 * - checking Lead / Booking / Vendor business rules
 *
 * The repository is responsible only for persistence.
 */
export interface CreateQuotationRepositoryInput {
  quotation:
    CreateQuotationInput;

  identity:
    QuotationRepositoryGeneratedIdentity;
}

/* ============================================================================
 * Update repository input
 * ============================================================================
 */

export interface UpdateQuotationRepositoryInput {
  quotationId:
    QuotationId;

  changes:
    UpdateQuotationInput;
}

/* ============================================================================
 * Status repository input
 * ============================================================================
 */

/**
 * Persistence-only status update.
 *
 * Workflow transition validation belongs to the service/domain validator.
 */
export interface UpdateQuotationStatusRepositoryInput {
  quotationId:
    QuotationId;

  status:
    QuotationStatus;
}

/* ============================================================================
 * Lookup queries
 * ============================================================================
 */

export interface FindQuotationByIdRepositoryQuery {
  quotationId:
    QuotationId;
}

export interface FindQuotationByNumberRepositoryQuery {
  quotationNumber:
    QuotationNumber;
}

export interface FindQuotationByReferenceRepositoryQuery {
  referenceId:
    QuotationReferenceId;
}

/* ============================================================================
 * Relation lookup queries
 * ============================================================================
 */

export interface FindQuotationsByBookingRepositoryQuery {
  bookingId:
    BookingId;

  statuses?:
    QuotationStatus[];

  includeExpired?:
    boolean;

  sort?:
    QuotationRepositorySort;
}

export interface FindQuotationsByLeadRepositoryQuery {
  leadId:
    LeadId;

  statuses?:
    QuotationStatus[];

  sort?:
    QuotationRepositorySort;
}

export interface FindQuotationsByVendorRepositoryQuery {
  vendorId:
    VendorId;

  statuses?:
    QuotationStatus[];

  pagination?:
    QuotationRepositoryPagination;

  sort?:
    QuotationRepositorySort;
}

/* ============================================================================
 * Existence queries
 * ============================================================================
 */

export interface QuotationRepositoryExistenceQuery {
  quotationId?:
    QuotationId;

  quotationNumber?:
    QuotationNumber;

  referenceId?:
    QuotationReferenceId;
}

export interface QuotationRepositoryExistenceResult {
  exists:
    boolean;

  quotationId?:
    QuotationId;
}

/* ============================================================================
 * Duplicate Vendor quotation query
 * ============================================================================
 */

/**
 * Used by the service to determine whether the same Vendor has already
 * submitted a quotation for the same Booking.
 *
 * Whether a second quotation is rejected or treated as a revision remains
 * a business rule in the service layer.
 */
export interface FindVendorBookingQuotationRepositoryQuery {
  bookingId:
    BookingId;

  vendorId:
    VendorId;

  statuses?:
    QuotationStatus[];
}

/* ============================================================================
 * Count queries
 * ============================================================================
 */

export interface CountQuotationsRepositoryQuery {
  filter?:
    QuotationRepositoryFilter;
}

/* ============================================================================
 * Aggregate amount result
 * ============================================================================
 */

/**
 * Lightweight commercial aggregate useful when updating the Booking
 * quotation summary.
 */
export interface QuotationRepositoryAmountSummary {
  bookingId:
    BookingId;

  totalQuotations:
    number;

  lowestAmount?:
    number;

  highestAmount?:
    number;

  selectedQuotationId?:
    QuotationId;

  selectedAmount?:
    number;
}

/* ============================================================================
 * Booking quotation summary query
 * ============================================================================
 */

export interface GetBookingQuotationSummaryRepositoryQuery {
  bookingId:
    BookingId;

  /**
   * Terminal quotations such as REJECTED, WITHDRAWN or CANCELLED may
   * optionally be excluded by the implementation.
   */
  statuses?:
    QuotationStatus[];
}

/* ============================================================================
 * Delete repository result
 * ============================================================================
 */

/**
 * Physical deletion contract.
 *
 * We do not define soft deletion because the current Prisma Quotation
 * model has no deletedAt / isDeleted field.
 */
export interface DeleteQuotationRepositoryResult {
  quotationId:
    QuotationId;

  deleted:
    boolean;
}

/* ============================================================================
 * Core Quotation repository port
 * ============================================================================
 */

/**
 * Primary Quotation persistence boundary.
 *
 * The service layer depends on this interface rather than Prisma directly.
 */
export interface QuotationRepository {
  /* ------------------------------------------------------------------------
   * Create
   * ------------------------------------------------------------------------
   */

  create(
    input:
      CreateQuotationRepositoryInput
  ): Promise<
    Quotation
  >;

  /* ------------------------------------------------------------------------
   * Update
   * ------------------------------------------------------------------------
   */

  update(
    input:
      UpdateQuotationRepositoryInput
  ): Promise<
    Quotation | null
  >;

  updateStatus(
    input:
      UpdateQuotationStatusRepositoryInput
  ): Promise<
    Quotation | null
  >;

  /* ------------------------------------------------------------------------
   * Single-record reads
   * ------------------------------------------------------------------------
   */

  findById(
    quotationId:
      QuotationId
  ): Promise<
    Quotation | null
  >;

  findByQuotationNumber(
    quotationNumber:
      QuotationNumber
  ): Promise<
    Quotation | null
  >;

  findByReferenceId(
    referenceId:
      QuotationReferenceId
  ): Promise<
    Quotation | null
  >;

  /* ------------------------------------------------------------------------
   * Relationship reads
   * ------------------------------------------------------------------------
   */

  findByBookingId(
    query:
      FindQuotationsByBookingRepositoryQuery
  ): Promise<
    Quotation[]
  >;

  findByLeadId(
    query:
      FindQuotationsByLeadRepositoryQuery
  ): Promise<
    Quotation[]
  >;

  findByVendorId(
    query:
      FindQuotationsByVendorRepositoryQuery
  ): Promise<
    QuotationRepositoryPage<
      QuotationListItem
    >
  >;

  findVendorBookingQuotation(
    query:
      FindVendorBookingQuotationRepositoryQuery
  ): Promise<
    Quotation | null
  >;

  /* ------------------------------------------------------------------------
   * Search / list
   * ------------------------------------------------------------------------
   */

  list(
    query?:
      QuotationRepositoryListQuery
  ): Promise<
    QuotationRepositoryPage<
      QuotationListItem
    >
  >;

  /* ------------------------------------------------------------------------
   * Existence / counts
   * ------------------------------------------------------------------------
   */

  exists(
    query:
      QuotationRepositoryExistenceQuery
  ): Promise<
    QuotationRepositoryExistenceResult
  >;

  count(
    query?:
      CountQuotationsRepositoryQuery
  ): Promise<
    number
  >;

  /* ------------------------------------------------------------------------
   * Booking quotation aggregation
   * ------------------------------------------------------------------------
   */

  getBookingQuotationSummary(
    query:
      GetBookingQuotationSummaryRepositoryQuery
  ): Promise<
    QuotationRepositoryAmountSummary
  >;

  /* ------------------------------------------------------------------------
   * Delete
   * ------------------------------------------------------------------------
   */

  delete(
    quotationId:
      QuotationId
  ): Promise<
    DeleteQuotationRepositoryResult
  >;
}

/* ============================================================================
 * Domain query adapters
 * ============================================================================
 */

/**
 * Converts the existing domain search contract into the repository filter.
 *
 * The two shapes currently align, but this helper prevents service code
 * from depending on that coincidence.
 */
export function mapQuotationSearchCriteriaToRepositoryFilter(
  criteria:
    QuotationSearchCriteria
): QuotationRepositoryFilter {
  return {
    quotationId:
      criteria.quotationId,

    quotationNumber:
      criteria.quotationNumber,

    referenceId:
      criteria.referenceId,

    leadId:
      criteria.leadId,

    bookingId:
      criteria.bookingId,

    vendorId:
      criteria.vendorId,

    userId:
      criteria.userId,

    status:
      criteria.status,

    statuses:
      criteria.statuses,

    selectedForBooking:
      criteria.selectedForBooking,

    minimumAmount:
      criteria.minimumAmount,

    maximumAmount:
      criteria.maximumAmount,

    validFrom:
      criteria.validFrom,

    validUntil:
      criteria.validUntil,

    pickupDateFrom:
      criteria.pickupDateFrom,

    pickupDateTo:
      criteria.pickupDateTo,

    createdFrom:
      criteria.createdFrom,

    createdUntil:
      criteria.createdUntil,

    search:
      criteria.search,
  };
}

/**
 * Converts a domain QuotationListQuery into repository terminology.
 */
export function mapQuotationListQueryToRepositoryQuery(
  query:
    QuotationListQuery
): QuotationRepositoryListQuery {
  return {
    ...(query.criteria
      ? {
          filter:
            mapQuotationSearchCriteriaToRepositoryFilter(
              query.criteria
            ),
        }
      : {}),

    ...(query.pagination
      ? {
          pagination: {
            page:
              query.pagination.page,

            pageSize:
              query.pagination.pageSize,
          },
        }
      : {}),

    ...(query.sort
      ? {
          sort:
            query.sort,
        }
      : {}),
  };
}

/* ============================================================================
 * Pagination result adapter
 * ============================================================================
 */

/**
 * Converts repository pagination into the existing domain
 * PaginatedQuotationResult contract.
 */
export function mapQuotationRepositoryPageToDomain<
  T
>(
  page:
    QuotationRepositoryPage<T>
): PaginatedQuotationResult<T> {
  return {
    items:
      page.items,

    pagination: {
      page:
        page.pagination.page,

      pageSize:
        page.pagination.pageSize,

      totalItems:
        page.pagination.totalItems,

      totalPages:
        page.pagination.totalPages,

      hasNextPage:
        page.pagination.hasNextPage,

      hasPreviousPage:
        page.pagination.hasPreviousPage,
    },
  };
}

/* ============================================================================
 * Repository capability contract
 * ============================================================================
 */

/**
 * Describes capabilities expected from the concrete repository.
 *
 * This becomes useful when we later introduce test/in-memory repositories.
 */
export interface QuotationRepositoryCapabilities {
  create:
    boolean;

  update:
    boolean;

  updateStatus:
    boolean;

  search:
    boolean;

  pagination:
    boolean;

  sorting:
    boolean;

  bookingAggregation:
    boolean;

  transactionSupport:
    boolean;
}

/* ============================================================================
 * Default repository capability declaration
 * ============================================================================
 */

export const DEFAULT_QUOTATION_REPOSITORY_CAPABILITIES:
  QuotationRepositoryCapabilities = {
    create:
      true,

    update:
      true,

    updateStatus:
      true,

    search:
      true,

    pagination:
      true,

    sorting:
      true,

    bookingAggregation:
      true,

    transactionSupport:
      false,
  };

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Repository Contract
 * Part B
 * ============================================================================
 *
 * Responsibilities:
 * - Define repository error contracts
 * - Define mutation context / audit metadata
 * - Define Lead / Booking / Vendor relation-existence contracts
 * - Define quotation selection persistence contracts
 * - Define transaction contracts
 * - Define repository health contracts
 * - Define final repository composition
 *
 * IMPORTANT:
 * - No Prisma implementation
 * - No HTTP handling
 * - No business workflow decisions
 * - No controller logic
 * ============================================================================
 */

/* ============================================================================
 * Repository error contracts
 * ============================================================================
 */

export type QuotationRepositoryErrorCode =
  | "QUOTATION_NOT_FOUND"
  | "LEAD_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "VENDOR_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "DUPLICATE_QUOTATION_NUMBER"
  | "DUPLICATE_REFERENCE_ID"
  | "DUPLICATE_VENDOR_BOOKING_QUOTATION"
  | "INVALID_REPOSITORY_INPUT"
  | "RELATION_MISMATCH"
  | "SELECTION_FAILED"
  | "TRANSACTION_FAILED"
  | "DATABASE_ERROR"
  | "UNKNOWN_REPOSITORY_ERROR";

export interface QuotationRepositoryErrorDetails {
  field?:
    string;

  value?:
    unknown;

  quotationId?:
    QuotationId;

  bookingId?:
    BookingId;

  leadId?:
    LeadId;

  vendorId?:
    VendorId;

  userId?:
    UserId;

  cause?:
    unknown;
}

/**
 * Standard Quotation repository error.
 */
export class QuotationRepositoryError
  extends Error {
  readonly code:
    QuotationRepositoryErrorCode;

  readonly details?:
    QuotationRepositoryErrorDetails;

  constructor(
    code:
      QuotationRepositoryErrorCode,
    message:
      string,
    details?:
      QuotationRepositoryErrorDetails
  ) {
    super(
      message
    );

    this.name =
      "QuotationRepositoryError";

    this.code =
      code;

    this.details =
      details;

    Object.setPrototypeOf(
      this,
      QuotationRepositoryError.prototype
    );
  }
}

/**
 * Runtime guard for repository errors.
 */
export function isQuotationRepositoryError(
  error:
    unknown
): error is QuotationRepositoryError {
  return (
    error instanceof
    QuotationRepositoryError
  );
}

/* ============================================================================
 * Repository error factories
 * ============================================================================
 */

export function createQuotationNotFoundRepositoryError(
  quotationId:
    QuotationId
): QuotationRepositoryError {
  return new QuotationRepositoryError(
    "QUOTATION_NOT_FOUND",
    "Quotation was not found.",
    {
      quotationId,
    }
  );
}

export function createQuotationLeadNotFoundRepositoryError(
  leadId:
    LeadId
): QuotationRepositoryError {
  return new QuotationRepositoryError(
    "LEAD_NOT_FOUND",
    "Lead was not found.",
    {
      leadId,
    }
  );
}

export function createQuotationBookingNotFoundRepositoryError(
  bookingId:
    BookingId
): QuotationRepositoryError {
  return new QuotationRepositoryError(
    "BOOKING_NOT_FOUND",
    "Booking was not found.",
    {
      bookingId,
    }
  );
}

export function createQuotationVendorNotFoundRepositoryError(
  vendorId:
    VendorId
): QuotationRepositoryError {
  return new QuotationRepositoryError(
    "VENDOR_NOT_FOUND",
    "Vendor was not found.",
    {
      vendorId,
    }
  );
}

export function createQuotationDatabaseRepositoryError(
  message:
    string,
  cause?:
    unknown
): QuotationRepositoryError {
  return new QuotationRepositoryError(
    "DATABASE_ERROR",
    message,
    {
      cause,
    }
  );
}

/* ============================================================================
 * Mutation metadata
 * ============================================================================
 */

/**
 * Repository mutation metadata.
 *
 * Current Prisma Quotation does not persist createdBy / updatedBy.
 * This metadata remains useful for:
 * - logs
 * - telemetry
 * - future audit/event persistence
 * - transaction correlation
 */
export interface QuotationRepositoryAuditMetadata {
  performedBy?:
    string;

  requestId?:
    string;

  source?:
    string;

  ipAddress?:
    string;

  userAgent?:
    string;

  performedAt?:
    Date;
}

/**
 * Context attached to repository mutation operations.
 */
export interface QuotationRepositoryMutationContext {
  audit?:
    QuotationRepositoryAuditMetadata;

  transactionId?:
    string;
}

/* ============================================================================
 * Relation existence contracts
 * ============================================================================
 */

/**
 * Minimal result returned by Lead existence checks.
 */
export interface QuotationLeadExistenceResult {
  exists:
    boolean;

  leadId:
    LeadId;

  referenceId?:
    string;
}

/**
 * Minimal result returned by Booking existence checks.
 */
export interface QuotationBookingExistenceResult {
  exists:
    boolean;

  bookingId:
    BookingId;

  leadId?:
    LeadId;

  bookingNumber?:
    string;

  selectedQuotationId?:
    QuotationId;
}

/**
 * Minimal Vendor existence result.
 *
 * Vendor eligibility itself remains a service/business concern.
 */
export interface QuotationVendorExistenceResult {
  exists:
    boolean;

  vendorId:
    VendorId;

  vendorCode?:
    string;

  companyName?:
    string;
}

/**
 * Optional User existence result.
 */
export interface QuotationUserExistenceResult {
  exists:
    boolean;

  userId:
    UserId;
}

/* ============================================================================
 * Relation verification queries
 * ============================================================================
 */

export interface CheckQuotationLeadRepositoryQuery {
  leadId:
    LeadId;
}

export interface CheckQuotationBookingRepositoryQuery {
  bookingId:
    BookingId;
}

export interface CheckQuotationVendorRepositoryQuery {
  vendorId:
    VendorId;
}

export interface CheckQuotationUserRepositoryQuery {
  userId:
    UserId;
}

/**
 * Combined relation query used before quotation creation.
 */
export interface CheckQuotationRelationsRepositoryQuery {
  leadId:
    LeadId;

  bookingId:
    BookingId;

  vendorId:
    VendorId;

  userId?:
    UserId;
}

/**
 * Combined persistence-level relation result.
 *
 * This does NOT decide whether the combination is commercially valid.
 * It merely provides persisted relation facts to the service.
 */
export interface CheckQuotationRelationsRepositoryResult {
  lead:
    QuotationLeadExistenceResult;

  booking:
    QuotationBookingExistenceResult;

  vendor:
    QuotationVendorExistenceResult;

  user?:
    QuotationUserExistenceResult;
}

/* ============================================================================
 * Quotation identity uniqueness contracts
 * ============================================================================
 */

export interface QuotationRepositoryUniquenessQuery {
  quotationNumber?:
    QuotationNumber;

  referenceId?:
    QuotationReferenceId;

  excludeQuotationId?:
    QuotationId;
}

export interface QuotationRepositoryUniquenessResult {
  exists:
    boolean;

  quotationId?:
    QuotationId;

  matchedField?:
    | "quotationNumber"
    | "referenceId";
}

/* ============================================================================
 * Booking quotation selection contracts
 * ============================================================================
 */

/**
 * Selection is owned by Booking.selectedQuotationId.
 *
 * Quotation.selectedForBooking is only the reverse Prisma relation.
 */
export interface SelectBookingQuotationRepositoryInput {
  bookingId:
    BookingId;

  quotationId:
    QuotationId;
}

/**
 * Clears Booking.selectedQuotationId.
 */
export interface UnselectBookingQuotationRepositoryInput {
  bookingId:
    BookingId;
}

export interface BookingQuotationSelectionRepositoryResult {
  bookingId:
    BookingId;

  selectedQuotationId?:
    QuotationId;

  changed:
    boolean;
}

/**
 * Retrieves the quotation currently selected by one Booking.
 */
export interface FindSelectedQuotationRepositoryQuery {
  bookingId:
    BookingId;
}

/* ============================================================================
 * Booking quotation count contracts
 * ============================================================================
 */

export interface CountBookingQuotationsRepositoryQuery {
  bookingId:
    BookingId;

  statuses?:
    QuotationStatus[];
}

/* ============================================================================
 * Repository statistics
 * ============================================================================
 */

export interface QuotationRepositoryStatusCount {
  status:
    QuotationStatus;

  count:
    number;
}

export interface QuotationRepositoryStatistics {
  total:
    number;

  selected:
    number;

  unselected:
    number;

  statusCounts:
    QuotationRepositoryStatusCount[];

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  averageAmount?:
    number;
}

export interface GetQuotationRepositoryStatisticsQuery {
  filter?:
    QuotationRepositoryFilter;
}

/* ============================================================================
 * Repository health contracts
 * ============================================================================
 */

export interface QuotationRepositoryHealthResult {
  healthy:
    boolean;

  checkedAt:
    Date;

  latencyMilliseconds?:
    number;

  message?:
    string;
}

/* ============================================================================
 * Extended Quotation repository port
 * ============================================================================
 */

/**
 * Extends the core Part A repository with relation, selection,
 * uniqueness and health operations.
 */
export interface CompleteQuotationRepository
  extends QuotationRepository {
  /* ------------------------------------------------------------------------
   * Relation existence
   * ------------------------------------------------------------------------
   */

  checkLead(
    query:
      CheckQuotationLeadRepositoryQuery
  ): Promise<
    QuotationLeadExistenceResult
  >;

  checkBooking(
    query:
      CheckQuotationBookingRepositoryQuery
  ): Promise<
    QuotationBookingExistenceResult
  >;

  checkVendor(
    query:
      CheckQuotationVendorRepositoryQuery
  ): Promise<
    QuotationVendorExistenceResult
  >;

  checkUser(
    query:
      CheckQuotationUserRepositoryQuery
  ): Promise<
    QuotationUserExistenceResult
  >;

  checkRelations(
    query:
      CheckQuotationRelationsRepositoryQuery
  ): Promise<
    CheckQuotationRelationsRepositoryResult
  >;

  /* ------------------------------------------------------------------------
   * Uniqueness
   * ------------------------------------------------------------------------
   */

  checkUniqueness(
    query:
      QuotationRepositoryUniquenessQuery
  ): Promise<
    QuotationRepositoryUniquenessResult
  >;

  /* ------------------------------------------------------------------------
   * Booking selection
   * ------------------------------------------------------------------------
   */

  selectForBooking(
    input:
      SelectBookingQuotationRepositoryInput,
    context?:
      QuotationRepositoryMutationContext
  ): Promise<
    BookingQuotationSelectionRepositoryResult
  >;

  unselectForBooking(
    input:
      UnselectBookingQuotationRepositoryInput,
    context?:
      QuotationRepositoryMutationContext
  ): Promise<
    BookingQuotationSelectionRepositoryResult
  >;

  findSelectedForBooking(
    query:
      FindSelectedQuotationRepositoryQuery
  ): Promise<
    Quotation | null
  >;

  /* ------------------------------------------------------------------------
   * Counts / statistics
   * ------------------------------------------------------------------------
   */

  countByBooking(
    query:
      CountBookingQuotationsRepositoryQuery
  ): Promise<
    number
  >;

  getStatistics(
    query?:
      GetQuotationRepositoryStatisticsQuery
  ): Promise<
    QuotationRepositoryStatistics
  >;

  /* ------------------------------------------------------------------------
   * Health
   * ------------------------------------------------------------------------
   */

  checkHealth():
    Promise<
      QuotationRepositoryHealthResult
    >;
}

/* ============================================================================
 * Transaction contracts
 * ============================================================================
 */

/**
 * Repository instance supplied within a transaction callback.
 */
export interface QuotationRepositoryTransactionContext {
  repository:
    CompleteQuotationRepository;
}

/**
 * Generic transaction callback.
 */
export type QuotationRepositoryTransactionCallback<
  T
> =
  (
    context:
      QuotationRepositoryTransactionContext
  ) => Promise<T>;

/**
 * Transaction-manager persistence boundary.
 */
export interface QuotationRepositoryTransactionManager {
  runInTransaction<T>(
    callback:
      QuotationRepositoryTransactionCallback<T>
  ): Promise<T>;
}

/* ============================================================================
 * Selection transaction recommendation
 * ============================================================================
 */

/**
 * Selection normally touches Booking and Quotation state together.
 *
 * The concrete Prisma implementation should execute selection inside
 * a transaction where practical.
 */
export interface QuotationSelectionTransactionInput {
  bookingId:
    BookingId;

  quotationId:
    QuotationId;
}

/* ============================================================================
 * Repository dependencies
 * ============================================================================
 */

/**
 * Generic repository dependency object.
 *
 * Concrete implementations may extend this contract.
 */
export interface QuotationRepositoryDependencies {
  /**
   * Optional label useful for logs/testing.
   */
  repositoryName?:
    string;
}

/* ============================================================================
 * Repository capability report
 * ============================================================================
 */

export interface QuotationRepositoryCapabilityReport
  extends QuotationRepositoryCapabilities {
  relationChecks:
    boolean;

  uniquenessChecks:
    boolean;

  bookingSelection:
    boolean;

  statistics:
    boolean;

  healthCheck:
    boolean;
}

export const COMPLETE_QUOTATION_REPOSITORY_CAPABILITIES:
  QuotationRepositoryCapabilityReport = {
    ...DEFAULT_QUOTATION_REPOSITORY_CAPABILITIES,

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

/* ============================================================================
 * Repository facade type
 * ============================================================================
 */

/**
 * Canonical repository interface to use from the Quotation service.
 */
export type QuotationRepositoryPort =
  CompleteQuotationRepository;

/**
 * Canonical transaction manager interface.
 */
export type QuotationRepositoryPortTransactionManager =
  QuotationRepositoryTransactionManager;

/* ============================================================================
 * Repository module contract
 * ============================================================================
 */

/**
 * Composition returned by a concrete repository module/factory.
 */
export interface QuotationRepositoryModule {
  repository:
    QuotationRepositoryPort;

  transactionManager?:
    QuotationRepositoryPortTransactionManager;

  capabilities:
    QuotationRepositoryCapabilityReport;
}

/* ============================================================================
 * Repository utility guards
 * ============================================================================
 */

export function hasQuotationRepositoryTransactionManager(
  module:
    QuotationRepositoryModule
): module is
  QuotationRepositoryModule & {
    transactionManager:
      QuotationRepositoryPortTransactionManager;
  } {
  return Boolean(
    module.transactionManager
  );
}

/**
 * Determines whether a repository reports a specific capability.
 */
export function quotationRepositorySupports(
  capabilities:
    QuotationRepositoryCapabilityReport,
  capability:
    keyof QuotationRepositoryCapabilityReport
): boolean {
  return capabilities[
    capability
  ] ===
    true;
}

/* ============================================================================
 * Final repository contract facade
 * ============================================================================
 */

/**
 * Convenience namespace-like facade.
 *
 * This does not create a repository instance. It simply exposes stable
 * defaults and helper functions to repository consumers.
 */
export const QuotationRepositoryContracts = {
  defaultCapabilities:
    DEFAULT_QUOTATION_REPOSITORY_CAPABILITIES,

  completeCapabilities:
    COMPLETE_QUOTATION_REPOSITORY_CAPABILITIES,

  mapSearchCriteria:
    mapQuotationSearchCriteriaToRepositoryFilter,

  mapListQuery:
    mapQuotationListQueryToRepositoryQuery,

  mapPageToDomain:
    mapQuotationRepositoryPageToDomain,

  supports:
    quotationRepositorySupports,

  hasTransactionManager:
    hasQuotationRepositoryTransactionManager,
} as const;

/* ============================================================================
 * End of quotation.repository.ts
 * ============================================================================
 */