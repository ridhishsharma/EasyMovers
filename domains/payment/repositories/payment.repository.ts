/**
 * ============================================================================
 * EasyMovers
 * Payment Repository Contract
 * ============================================================================
 *
 * File:
 * domains/payment/repositories/payment.repository.ts
 *
 * Responsibilities:
 * - Define persistence-facing Payment repository contracts
 * - Define repository errors
 * - Define list/filter/sort/pagination contracts
 * - Define transaction read/write contracts
 * - Define statistics/reconciliation repository contracts
 * - Define transaction-manager abstractions
 *
 * This file does not:
 * - import Prisma
 * - access a database
 * - validate Payment business rules
 * - call payment gateways
 * - map HTTP requests
 * ============================================================================
 */

import {
  PaymentCurrency,
  PaymentProvider,
  PaymentPurpose,
  PaymentSortDirection,
  PaymentSortField,
  PaymentSource,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "../models/payment.model";

import type {
  Payment,
  PaymentId,
  PaymentListResult,
  PaymentPagination,
  PaymentReconciliationObserved,
  PaymentReconciliationResult,
  PaymentSearchCriteria,
  PaymentStatistics,
  PaymentSummary,
  PaymentTransaction,
  PaymentTransactionId,
  PaymentTransactionListResult,
  PaymentTransactionSearchCriteria,
  PaymentTransactionStatistics,
} from "../models/payment.model";

/* ============================================================================
 * Repository error model
 * ============================================================================
 */

export type PaymentRepositoryErrorCode =
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_TRANSACTION_NOT_FOUND"
  | "DUPLICATE_PAYMENT"
  | "DUPLICATE_PAYMENT_NUMBER"
  | "DUPLICATE_PAYMENT_REFERENCE"
  | "DUPLICATE_GATEWAY_PAYMENT"
  | "INVALID_REPOSITORY_INPUT"
  | "REPOSITORY_READ_FAILED"
  | "REPOSITORY_WRITE_FAILED"
  | "TRANSACTION_FAILED"
  | "STATISTICS_FAILED"
  | "RECONCILIATION_FAILED"
  | "UNSUPPORTED_OPERATION";

export interface PaymentRepositoryErrorDetails {
  field?:
    string;

  value?:
    unknown;

  paymentId?:
    string;

  transactionId?:
    string;

  cause?:
    unknown;
}

export class PaymentRepositoryError
  extends Error {
  readonly code:
    PaymentRepositoryErrorCode;

  readonly details?:
    PaymentRepositoryErrorDetails;

  constructor(
    code:
      PaymentRepositoryErrorCode,
    message:
      string,
    details?:
      PaymentRepositoryErrorDetails
  ) {
    super(
      message
    );

    this.name =
      "PaymentRepositoryError";

    this.code =
      code;

    this.details =
      details;
  }
}

/* ============================================================================
 * Repository pagination
 * ============================================================================
 */

export const DEFAULT_PAYMENT_REPOSITORY_PAGE =
  1;

export const DEFAULT_PAYMENT_REPOSITORY_PAGE_SIZE =
  20;

export const MAX_PAYMENT_REPOSITORY_PAGE_SIZE =
  100;

export interface PaymentRepositoryPagination {
  page:
    number;

  pageSize:
    number;
}

export interface PaymentRepositoryPaginationMetadata {
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

/* ============================================================================
 * Repository sorting
 * ============================================================================
 */

export interface PaymentRepositorySort {
  field:
    PaymentSortField;

  direction:
    PaymentSortDirection;
}

export const DEFAULT_PAYMENT_REPOSITORY_SORT:
  PaymentRepositorySort = {
  field:
    PaymentSortField.CREATED_AT,

  direction:
    PaymentSortDirection.DESC,
};

/* ============================================================================
 * Payment repository filter
 * ============================================================================
 */

export interface PaymentRepositoryFilter {
  paymentId?:
    string;

  paymentNumber?:
    string;

  referenceId?:
    string;

  bookingId?:
    string;

  quotationId?:
    string;

  leadId?:
    string;

  customerId?:
    string;

  vendorId?:
    string;

  status?:
    PaymentStatus;

  statuses?:
    PaymentStatus[];

  currency?:
    PaymentCurrency;

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  minimumPaidAmount?:
    number;

  maximumPaidAmount?:
    number;

  createdFrom?:
    string;

  createdUntil?:
    string;

  updatedFrom?:
    string;

  updatedUntil?:
    string;

  hasOutstandingBalance?:
    boolean;

  hasRefund?:
    boolean;

  provider?:
    PaymentProvider;

  transactionStatus?:
    PaymentTransactionStatus;

  source?:
    PaymentSource;
}

/* ============================================================================
 * Payment repository list query
 * ============================================================================
 */

export interface PaymentRepositoryListQuery {
  filter?:
    PaymentRepositoryFilter;

  pagination?:
    PaymentRepositoryPagination;

  sort?:
    PaymentRepositorySort;
}

/* ============================================================================
 * Payment transaction repository filter
 * ============================================================================
 */

export interface PaymentTransactionRepositoryFilter {
  paymentId?:
    string;

  transactionId?:
    string;

  transactionType?:
    PaymentTransactionType;

  purpose?:
    PaymentPurpose;

  status?:
    PaymentTransactionStatus;

  provider?:
    PaymentProvider;

  gatewayOrderId?:
    string;

  gatewayPaymentId?:
    string;

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  initiatedFrom?:
    string;

  initiatedUntil?:
    string;
}

/* ============================================================================
 * Payment transaction repository query
 * ============================================================================
 */

export interface PaymentTransactionRepositoryListQuery {
  filter?:
    PaymentTransactionRepositoryFilter;

  pagination?:
    PaymentRepositoryPagination;
}

/* ============================================================================
 * Generic repository page
 * ============================================================================
 */

export interface PaymentRepositoryPage<T> {
  items:
    T[];

  pagination:
    PaymentRepositoryPaginationMetadata;
}

/* ============================================================================
 * Payment create/update repository inputs
 * ============================================================================
 */

/**
 * Repository create input intentionally accepts a complete Payment aggregate.
 *
 * ID/reference generation belongs to the service layer.
 */
export interface CreatePaymentRepositoryInput {
  payment:
    Payment;
}

/**
 * Repository update input.
 *
 * The repository persists the already-validated aggregate.
 */
export interface UpdatePaymentRepositoryInput {
  paymentId:
    PaymentId;

  payment:
    Payment;
}

/* ============================================================================
 * Transaction repository inputs
 * ============================================================================
 */

export interface CreatePaymentTransactionRepositoryInput {
  transaction:
    PaymentTransaction;
}

export interface UpdatePaymentTransactionRepositoryInput {
  paymentId:
    PaymentId;

  transactionId:
    PaymentTransactionId;

  transaction:
    PaymentTransaction;
}

/* ============================================================================
 * Reconciliation repository input
 * ============================================================================
 */

export interface SavePaymentReconciliationRepositoryInput {
  paymentId:
    PaymentId;

  observed:
    PaymentReconciliationObserved;

  result:
    PaymentReconciliationResult;
}

/* ============================================================================
 * Core Payment repository read port
 * ============================================================================
 */

export interface PaymentRepositoryReadPort {
  findById(
    paymentId:
      PaymentId
  ): Promise<
    Payment | null
  >;

  findByPaymentNumber(
    paymentNumber:
      string
  ): Promise<
    Payment | null
  >;

  findByReferenceId(
    referenceId:
      string
  ): Promise<
    Payment | null
  >;

  findByBookingId(
    bookingId:
      string
  ): Promise<
    Payment | null
  >;

  findByQuotationId(
    quotationId:
      string
  ): Promise<
    Payment | null
  >;

  list(
    query?:
      PaymentRepositoryListQuery
  ): Promise<
    PaymentRepositoryPage<
      Payment
    >
  >;

  search(
    criteria:
      PaymentSearchCriteria
  ): Promise<
    PaymentListResult
  >;
}

/* ============================================================================
 * Core Payment repository write port
 * ============================================================================
 */

export interface PaymentRepositoryWritePort {
  create(
    input:
      CreatePaymentRepositoryInput
  ): Promise<
    Payment
  >;

  update(
    input:
      UpdatePaymentRepositoryInput
  ): Promise<
    Payment
  >;

  delete(
    paymentId:
      PaymentId
  ): Promise<
    boolean
  >;
}

/* ============================================================================
 * Payment uniqueness port
 * ============================================================================
 */

export interface PaymentRepositoryUniquenessPort {
  paymentNumberExists(
    paymentNumber:
      string
  ): Promise<
    boolean
  >;

  referenceIdExists(
    referenceId:
      string
  ): Promise<
    boolean
  >;

  bookingPaymentExists(
    bookingId:
      string
  ): Promise<
    boolean
  >;

  gatewayPaymentIdExists(
    gatewayPaymentId:
      string
  ): Promise<
    boolean
  >;
}

/* ============================================================================
 * Payment transaction read port
 * ============================================================================
 */

export interface PaymentTransactionRepositoryReadPort {
  findTransactionById(
    transactionId:
      PaymentTransactionId
  ): Promise<
    PaymentTransaction | null
  >;

  findTransactionsByPaymentId(
    paymentId:
      PaymentId
  ): Promise<
    PaymentTransaction[]
  >;

  findTransactionByGatewayPaymentId(
    gatewayPaymentId:
      string
  ): Promise<
    PaymentTransaction | null
  >;

  findTransactionsByGatewayOrderId(
    gatewayOrderId:
      string
  ): Promise<
    PaymentTransaction[]
  >;

  listTransactions(
    query?:
      PaymentTransactionRepositoryListQuery
  ): Promise<
    PaymentRepositoryPage<
      PaymentTransaction
    >
  >;

  searchTransactions(
    criteria:
      PaymentTransactionSearchCriteria
  ): Promise<
    PaymentTransactionListResult
  >;
}

/* ============================================================================
 * Payment transaction write port
 * ============================================================================
 */

export interface PaymentTransactionRepositoryWritePort {
  createTransaction(
    input:
      CreatePaymentTransactionRepositoryInput
  ): Promise<
    PaymentTransaction
  >;

  updateTransaction(
    input:
      UpdatePaymentTransactionRepositoryInput
  ): Promise<
    PaymentTransaction
  >;
}

/* ============================================================================
 * Statistics port
 * ============================================================================
 */

export interface PaymentRepositoryStatisticsPort {
  getPaymentStatistics(
    criteria?:
      PaymentSearchCriteria
  ): Promise<
    PaymentStatistics
  >;

  getTransactionStatistics(
    criteria?:
      PaymentTransactionSearchCriteria
  ): Promise<
    PaymentTransactionStatistics
  >;
}

/* ============================================================================
 * Reconciliation port
 * ============================================================================
 */

export interface PaymentRepositoryReconciliationPort {
  saveReconciliation(
    input:
      SavePaymentReconciliationRepositoryInput
  ): Promise<
    PaymentReconciliationResult
  >;

  getLatestReconciliation(
    paymentId:
      PaymentId
  ): Promise<
    PaymentReconciliationResult | null
  >;
}

/* ============================================================================
 * Combined Payment repository
 * ============================================================================
 */

export interface PaymentRepository
  extends
    PaymentRepositoryReadPort,
    PaymentRepositoryWritePort,
    PaymentRepositoryUniquenessPort,
    PaymentTransactionRepositoryReadPort,
    PaymentTransactionRepositoryWritePort,
    PaymentRepositoryStatisticsPort,
    PaymentRepositoryReconciliationPort {}

/* ============================================================================
 * Repository transaction context
 * ============================================================================
 */

export interface PaymentRepositoryTransactionContext {
  repository:
    PaymentRepository;
}

export type PaymentRepositoryTransactionCallback<T> =
  (
    context:
      PaymentRepositoryTransactionContext
  ) => Promise<T>;

export interface PaymentRepositoryTransactionManager {
  runInTransaction<T>(
    callback:
      PaymentRepositoryTransactionCallback<T>
  ): Promise<T>;
}

/* ============================================================================
 * Repository health
 * ============================================================================
 */

export interface PaymentRepositoryHealth {
  healthy:
    boolean;

  message?:
    string;

  checkedAt:
    string;
}

export interface PaymentRepositoryHealthPort {
  checkHealth():
    Promise<
      PaymentRepositoryHealth
    >;
}

/* ============================================================================
 * Complete repository port
 * ============================================================================
 */

export interface CompletePaymentRepository
  extends
    PaymentRepository,
    PaymentRepositoryHealthPort {}

/* ============================================================================
 * Repository helper functions
 * ============================================================================
 */

export function normalizePaymentRepositoryPage(
  page:
    number | undefined
): number {
  if (
    !Number.isInteger(
      page
    ) ||
    (
      page ??
      0
    ) <
      1
  ) {
    return DEFAULT_PAYMENT_REPOSITORY_PAGE;
  }

  return page as number;
}

export function normalizePaymentRepositoryPageSize(
  pageSize:
    number | undefined
): number {
  if (
    !Number.isInteger(
      pageSize
    ) ||
    (
      pageSize ??
      0
    ) <
      1
  ) {
    return DEFAULT_PAYMENT_REPOSITORY_PAGE_SIZE;
  }

  return Math.min(
    pageSize as number,
    MAX_PAYMENT_REPOSITORY_PAGE_SIZE
  );
}

export function calculatePaymentRepositoryOffset(
  pagination?:
    PaymentRepositoryPagination
): number {
  const page =
    normalizePaymentRepositoryPage(
      pagination?.page
    );

  const pageSize =
    normalizePaymentRepositoryPageSize(
      pagination?.pageSize
    );

  return (
    page -
    1
  ) *
    pageSize;
}

export function createPaymentRepositoryPaginationMetadata(
  pagination:
    PaymentRepositoryPagination | undefined,
  totalItems:
    number
): PaymentRepositoryPaginationMetadata {
  const page =
    normalizePaymentRepositoryPage(
      pagination?.page
    );

  const pageSize =
    normalizePaymentRepositoryPageSize(
      pagination?.pageSize
    );

  const safeTotalItems =
    Number.isFinite(
      totalItems
    ) &&
    totalItems >
      0
      ? Math.floor(
          totalItems
        )
      : 0;

  const totalPages =
    safeTotalItems ===
      0
      ? 0
      : Math.ceil(
          safeTotalItems /
            pageSize
        );

  return {
    page,

    pageSize,

    totalItems:
      safeTotalItems,

    totalPages,

    hasNextPage:
      totalPages >
        0 &&
      page <
        totalPages,

    hasPreviousPage:
      page >
        1,
  };
}

/* ============================================================================
 * Repository query conversion helpers
 * ============================================================================
 */

export function mapPaymentSearchCriteriaToRepositoryQuery(
  criteria:
    PaymentSearchCriteria
): PaymentRepositoryListQuery {
  return {
    filter: {
      paymentId:
        criteria.paymentId,

      paymentNumber:
        criteria.paymentNumber,

      referenceId:
        criteria.referenceId,

      bookingId:
        criteria.bookingId,

      quotationId:
        criteria.quotationId,

      leadId:
        criteria.leadId,

      customerId:
        criteria.customerId,

      vendorId:
        criteria.vendorId,

      status:
        criteria.status,

      statuses:
        criteria.statuses,

      currency:
        criteria.currency,

      minimumAmount:
        criteria.minimumAmount,

      maximumAmount:
        criteria.maximumAmount,

      minimumPaidAmount:
        criteria.minimumPaidAmount,

      maximumPaidAmount:
        criteria.maximumPaidAmount,

      createdFrom:
        criteria.createdFrom,

      createdUntil:
        criteria.createdUntil,

      updatedFrom:
        criteria.updatedFrom,

      updatedUntil:
        criteria.updatedUntil,

      hasOutstandingBalance:
        criteria.hasOutstandingBalance,

      hasRefund:
        criteria.hasRefund,

      provider:
        criteria.provider,

      transactionStatus:
        criteria.transactionStatus,

      source:
        criteria.source,
    },

    pagination: {
      page:
        normalizePaymentRepositoryPage(
          criteria.page
        ),

      pageSize:
        normalizePaymentRepositoryPageSize(
          criteria.pageSize
        ),
    },

    sort: {
      field:
        criteria.sortBy ??
        DEFAULT_PAYMENT_REPOSITORY_SORT
          .field,

      direction:
        criteria.sortDirection ??
        DEFAULT_PAYMENT_REPOSITORY_SORT
          .direction,
    },
  };
}

export function mapPaymentTransactionSearchCriteriaToRepositoryQuery(
  criteria:
    PaymentTransactionSearchCriteria
): PaymentTransactionRepositoryListQuery {
  return {
    filter: {
      paymentId:
        criteria.paymentId,

      transactionId:
        criteria.transactionId,

      transactionType:
        criteria.transactionType,

      purpose:
        criteria.purpose,

      status:
        criteria.status,

      provider:
        criteria.provider,

      gatewayOrderId:
        criteria.gatewayOrderId,

      gatewayPaymentId:
        criteria.gatewayPaymentId,

      minimumAmount:
        criteria.minimumAmount,

      maximumAmount:
        criteria.maximumAmount,

      initiatedFrom:
        criteria.initiatedFrom,

      initiatedUntil:
        criteria.initiatedUntil,
    },

    pagination: {
      page:
        normalizePaymentRepositoryPage(
          criteria.page
        ),

      pageSize:
        normalizePaymentRepositoryPageSize(
          criteria.pageSize
        ),
    },
  };
}

/* ============================================================================
 * End of Payment Repository - Part A
 * ============================================================================
 */

/* ============================================================================
 * Payment bulk repository contracts
 * ============================================================================
 */

export interface PaymentRepositoryBulkLookupInput {
  paymentIds:
    PaymentId[];
}

export interface PaymentRepositoryBulkLookupResult {
  payments:
    Payment[];

  missingPaymentIds:
    PaymentId[];
}

export interface PaymentRepositoryBulkStatusUpdateItem {
  paymentId:
    PaymentId;

  status:
    PaymentStatus;

  updatedBy?:
    string;
}

export interface PaymentRepositoryBulkStatusUpdateInput {
  items:
    PaymentRepositoryBulkStatusUpdateItem[];
}

export interface PaymentRepositoryBulkStatusUpdateResult {
  updated:
    Payment[];

  failedPaymentIds:
    PaymentId[];
}

/* ============================================================================
 * Payment status persistence
 * ============================================================================
 */

export interface UpdatePaymentStatusRepositoryInput {
  paymentId:
    PaymentId;

  status:
    PaymentStatus;

  updatedAt?:
    string;

  updatedBy?:
    string;
}

export interface PaymentRepositoryStatusPort {
  updateStatus(
    input:
      UpdatePaymentStatusRepositoryInput
  ): Promise<
    Payment
  >;
}

/* ============================================================================
 * Payment financial summary persistence
 * ============================================================================
 */

export interface UpdatePaymentFinancialSummaryRepositoryInput {
  paymentId:
    PaymentId;

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
    PaymentTransactionId;

  updatedAt?:
    string;

  updatedBy?:
    string;
}

export interface PaymentRepositoryFinancialSummaryPort {
  updateFinancialSummary(
    input:
      UpdatePaymentFinancialSummaryRepositoryInput
  ): Promise<
    Payment
  >;
}

/* ------------------------------------------------------------------------
 * Payment -> Booking synchronization persistence
 * ------------------------------------------------------------------------
 */


/* ============================================================================
 * Payment -> Booking synchronization persistence
 * ============================================================================
 *
 * Payment is authoritative for all values stored in paymentSnapshot.
 *
 * paymentUpdatedAt acts as the synchronization version. Completion and retry
 * updates must match this value so an older synchronization attempt cannot
 * overwrite the state of a newer Payment mutation.
 * ============================================================================
 */

export type PaymentBookingSyncRepositoryStatus =
  | "PENDING"
  | "RETRY_PENDING"
  | "SYNCHRONIZED"
  | "FAILED";

/* ============================================================================
 * Persisted financial snapshot
 * ============================================================================
 */

export interface PaymentBookingSyncFinancialSnapshot {
  totalAmount:
    number;

  paidAmount:
    number;

  balanceAmount:
    number;

  paymentPending:
    number;

  refundedAmount:
    number;

  refundPendingAmount:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Persisted synchronization record
 * ============================================================================
 */

export interface PaymentBookingSyncRepositoryRecord {
  id:
    string;

  paymentId:
    PaymentId;

  bookingId:
    string;

  status:
    PaymentBookingSyncRepositoryStatus;

  /**
   * Version of the authoritative Payment projection represented by this row.
   */
  paymentUpdatedAt:
    string;

  paymentSnapshot:
    PaymentBookingSyncFinancialSnapshot;

  bookingSnapshot?:
    PaymentBookingSyncFinancialSnapshot;

  attemptCount:
    number;

  lastAttemptAt?:
    string;

  nextRetryAt?:
    string;

  synchronizedAt?:
    string;

  lastErrorCode?:
    string;

  lastErrorMessage?:
    string;

  requestedBy:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

/* ============================================================================
 * Create or replace the pending synchronization projection
 * ============================================================================
 */

export interface UpsertPendingPaymentBookingSyncRepositoryInput {
  paymentId:
    PaymentId;

  bookingId:
    string;

  paymentUpdatedAt:
    string;

  paymentSnapshot:
    PaymentBookingSyncFinancialSnapshot;

  requestedBy:
    string;
}

/* ============================================================================
 * Mark synchronization successful
 * ============================================================================
 */

export interface MarkPaymentBookingSyncSynchronizedRepositoryInput {
  paymentId:
    PaymentId;

  /**
   * Optimistic version guard.
   *
   * The update must be ignored when the stored paymentUpdatedAt does not match.
   */
  paymentUpdatedAt:
    string;

  bookingSnapshot:
    PaymentBookingSyncFinancialSnapshot;

  attemptedAt:
    string;

  synchronizedAt:
    string;
}

/* ============================================================================
 * Mark synchronization retryable
 * ============================================================================
 */

export interface MarkPaymentBookingSyncRetryPendingRepositoryInput {
  paymentId:
    PaymentId;

  /**
   * Optimistic version guard.
   */
  paymentUpdatedAt:
    string;

  attemptedAt:
    string;

  nextRetryAt:
    string;

  errorCode:
    string;

  errorMessage:
    string;

  bookingSnapshot?:
    PaymentBookingSyncFinancialSnapshot;
}

/* ============================================================================
 * Mark synchronization permanently failed
 * ============================================================================
 */

export interface MarkPaymentBookingSyncFailedRepositoryInput {
  paymentId:
    PaymentId;

  /**
   * Optimistic version guard.
   */
  paymentUpdatedAt:
    string;

  attemptedAt:
    string;

  errorCode:
    string;

  errorMessage:
    string;

  bookingSnapshot?:
    PaymentBookingSyncFinancialSnapshot;
}

/* ============================================================================
 * Retry queue query
 * ============================================================================
 */

export interface FindRetryablePaymentBookingSyncsRepositoryInput {
  /**
   * Return records whose nextRetryAt is at or before this timestamp.
   */
  dueAt:
    string;

  limit:
    number;
}

export interface ClaimRetryablePaymentBookingSyncsRepositoryInput
  extends
    FindRetryablePaymentBookingSyncsRepositoryInput {
  /**
   * Claimed records cannot be selected again before this timestamp.
   *
   * If the worker stops unexpectedly, the expired lease makes the record
   * eligible for processing again.
   */
  leaseUntil:
    string;
}
/* ============================================================================
 * Payment -> Booking synchronization statistics
 * ============================================================================
 */

export interface GetPaymentBookingSyncStatisticsRepositoryInput {
  /**
   * Timestamp used to determine which synchronization records are currently
   * eligible for processing.
   */
  observedAt:
    string;
}

export interface PaymentBookingSyncStatisticsRepositoryResult {
  total:
    number;

  pending:
    number;

  retryPending:
    number;

  synchronized:
    number;

  failed:
    number;

  /**
   * PENDING records eligible for crash recovery.
   */
  duePending:
    number;

  /**
   * RETRY_PENDING records whose nextRetryAt has arrived.
   */
  dueRetryPending:
    number;

  /**
   * Total records currently eligible for retry processing.
   */
  due:
    number;

  observedAt:
    string;
}

/* ============================================================================
 * Payment -> Booking synchronization repository port
 * ============================================================================
 */

export interface PaymentBookingSyncRepositoryPort {
  /**
   * Create the synchronization record or replace its projection when the
   * supplied Payment version is current or newer.
   */
  upsertPendingBookingSync(
    input:
      UpsertPendingPaymentBookingSyncRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord
  >;

  /**
   * Find the synchronization state belonging to one Payment.
   */
  findBookingSyncByPaymentId(
    paymentId:
      PaymentId
  ): Promise<
    PaymentBookingSyncRepositoryRecord | null
  >;

  /**
   * Mark the synchronization successful.
   *
   * Returns null when the optimistic paymentUpdatedAt guard does not match.
   */
  markBookingSyncSynchronized(
    input:
      MarkPaymentBookingSyncSynchronizedRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord | null
  >;

  /**
   * Mark the synchronization eligible for another retry.
   *
   * This operation atomically increments attemptCount.
   *
   * Returns null when the optimistic paymentUpdatedAt guard does not match.
   */
  markBookingSyncRetryPending(
    input:
      MarkPaymentBookingSyncRetryPendingRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord | null
  >;

  /**
   * Mark the synchronization permanently failed.
   *
   * This operation atomically increments attemptCount.
   *
   * Returns null when the optimistic paymentUpdatedAt guard does not match.
   */
  markBookingSyncFailed(
    input:
      MarkPaymentBookingSyncFailedRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord | null
  >;

  /**
   * Find synchronization records currently eligible for processing.
   */
  findRetryableBookingSyncs(
    input:
      FindRetryablePaymentBookingSyncsRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord[]
  >;
  /**
   * Atomically claim synchronization records for one retry worker.
   *
   * Concurrent workers may inspect the same candidates, but only one worker
   * can successfully move each record's lease beyond the current due time.
   */
  claimRetryableBookingSyncs(
    input:
      ClaimRetryablePaymentBookingSyncsRepositoryInput
  ): Promise<
    PaymentBookingSyncRepositoryRecord[]
  >;
  /**
   * Return queue-level Payment -> Booking synchronization statistics.
   */
  getBookingSyncStatistics(
    input:
      GetPaymentBookingSyncStatisticsRepositoryInput
  ): Promise<
    PaymentBookingSyncStatisticsRepositoryResult
  >;
}
/* ============================================================================
 * Gateway order persistence
 * ============================================================================
 */

export type PaymentGatewayOrderStatus =
  | "CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface PaymentGatewayOrderRepositoryRecord {
  paymentId:
    PaymentId;

  provider:
    PaymentProvider;

  gatewayOrderId:
    string;

  amount:
    number;

  currency:
    PaymentCurrency;

  status:
    PaymentGatewayOrderStatus;

  receiptReference?:
    string;

  metadata?:
    Record<
      string,
      unknown
    >;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface CreatePaymentGatewayOrderRepositoryInput {
  order:
    PaymentGatewayOrderRepositoryRecord;
}

export interface UpdatePaymentGatewayOrderRepositoryInput {
  paymentId:
    PaymentId;

  gatewayOrderId:
    string;

  status?:
    PaymentGatewayOrderStatus;

  metadata?:
    Record<
      string,
      unknown
    >;

  updatedAt?:
    string;
}

export interface PaymentGatewayOrderRepositoryPort {
  createGatewayOrder(
    input:
      CreatePaymentGatewayOrderRepositoryInput
  ): Promise<
    PaymentGatewayOrderRepositoryRecord
  >;

  updateGatewayOrder(
    input:
      UpdatePaymentGatewayOrderRepositoryInput
  ): Promise<
    PaymentGatewayOrderRepositoryRecord
  >;

  findGatewayOrderById(
    gatewayOrderId:
      string
  ): Promise<
    PaymentGatewayOrderRepositoryRecord | null
  >;

  findGatewayOrdersByPaymentId(
    paymentId:
      PaymentId
  ): Promise<
    PaymentGatewayOrderRepositoryRecord[]
  >;
}

/* ============================================================================
 * Webhook idempotency persistence
 * ============================================================================
 */

export interface PaymentWebhookRepositoryRecord {
  webhookId:
    string;

  provider:
    PaymentProvider;

  eventType:
    string;

  gatewayOrderId?:
    string;

  gatewayPaymentId?:
    string;

  providerEventId?:
    string;

  payloadHash?:
    string;

  processed:
    boolean;

  duplicate:
    boolean;

  receivedAt:
    string;

  processedAt?:
    string;

  paymentId?:
    PaymentId;

  transactionId?:
    PaymentTransactionId;

  errorCode?:
    string;

  errorMessage?:
    string;
}

export interface CreatePaymentWebhookRepositoryInput {
  webhook:
    PaymentWebhookRepositoryRecord;
}

export interface MarkPaymentWebhookProcessedRepositoryInput {
  webhookId:
    string;

  processedAt:
    string;

  paymentId?:
    PaymentId;

  transactionId?:
    PaymentTransactionId;
}

export interface MarkPaymentWebhookFailedRepositoryInput {
  webhookId:
    string;

  processedAt:
    string;

  errorCode?:
    string;

  errorMessage?:
    string;
}

export interface PaymentWebhookRepositoryPort {
  createWebhookRecord(
    input:
      CreatePaymentWebhookRepositoryInput
  ): Promise<
    PaymentWebhookRepositoryRecord
  >;

  findWebhookById(
    webhookId:
      string
  ): Promise<
    PaymentWebhookRepositoryRecord | null
  >;

  findWebhookByProviderEventId(
    provider:
      PaymentProvider,
    providerEventId:
      string
  ): Promise<
    PaymentWebhookRepositoryRecord | null
  >;

  webhookProviderEventExists(
    provider:
      PaymentProvider,
    providerEventId:
      string
  ): Promise<
    boolean
  >;

  markWebhookProcessed(
    input:
      MarkPaymentWebhookProcessedRepositoryInput
  ): Promise<
    PaymentWebhookRepositoryRecord
  >;

  markWebhookFailed(
    input:
      MarkPaymentWebhookFailedRepositoryInput
  ): Promise<
    PaymentWebhookRepositoryRecord
  >;
}

/* ============================================================================
 * Reconciliation history
 * ============================================================================
 */

export interface PaymentReconciliationRepositoryRecord {
  reconciliationId:
    string;

  paymentId:
    PaymentId;

  provider:
    PaymentProvider;

  expectedCollectedAmount:
    number;

  observedCollectedAmount:
    number;

  expectedRefundedAmount:
    number;

  observedRefundedAmount:
    number;

  currency:
    PaymentCurrency;

  reconciled:
    boolean;

  differences:
    Array<{
      field:
        string;

      expected:
        number;

      observed:
        number;

      difference:
        number;
    }>;

  providerReference?:
    string;

  observedAt:
    string;

  reconciledAt:
    string;

  reconciledBy?:
    string;
}

export interface PaymentReconciliationHistoryQuery {
  paymentId:
    PaymentId;

  page?:
    number;

  pageSize?:
    number;
}

export interface PaymentReconciliationHistoryResult {
  items:
    PaymentReconciliationRepositoryRecord[];

  pagination:
    PaymentRepositoryPaginationMetadata;
}

export interface PaymentRepositoryReconciliationHistoryPort {
  listReconciliations(
    query:
      PaymentReconciliationHistoryQuery
  ): Promise<
    PaymentReconciliationHistoryResult
  >;
}

/* ============================================================================
 * Bulk repository port
 * ============================================================================
 */

export interface PaymentRepositoryBulkPort {
  findManyByIds(
    input:
      PaymentRepositoryBulkLookupInput
  ): Promise<
    PaymentRepositoryBulkLookupResult
  >;

  updateManyStatuses(
    input:
      PaymentRepositoryBulkStatusUpdateInput
  ): Promise<
    PaymentRepositoryBulkStatusUpdateResult
  >;
}

/* ============================================================================
 * Repository capability reporting
 * ============================================================================
 */

export type PaymentRepositoryCapabilityName =
  | "CORE_PAYMENT_READ"
  | "CORE_PAYMENT_WRITE"
  | "PAYMENT_LISTING"
  | "PAYMENT_SEARCH"
  | "PAYMENT_UNIQUENESS"
  | "PAYMENT_TRANSACTIONS"
  | "PAYMENT_STATUS_UPDATE"
  | "PAYMENT_FINANCIAL_SUMMARY"
  | "PAYMENT_BOOKING_SYNC"
  | "GATEWAY_ORDER_PERSISTENCE"
  | "WEBHOOK_IDEMPOTENCY"
  | "PAYMENT_STATISTICS"
  | "PAYMENT_RECONCILIATION"
  | "RECONCILIATION_HISTORY"
  | "BULK_LOOKUP"
  | "BULK_STATUS_UPDATE"
  | "DATABASE_TRANSACTIONS"
  | "HEALTH_CHECK";

export interface PaymentRepositoryCapability {
  capability:
    PaymentRepositoryCapabilityName;

  supported:
    boolean;

  message?:
    string;
}

export interface PaymentRepositoryCapabilityReport {
  fullyOperational:
    boolean;

  capabilities:
    PaymentRepositoryCapability[];
}

/* ============================================================================
 * Repository configuration validation
 * ============================================================================
 */

export interface PaymentRepositoryConfigurationValidation {
  valid:
    boolean;

  errors:
    string[];

  warnings:
    string[];
}

/* ============================================================================
 * Extended Payment repository
 * ============================================================================
 */

export interface ExtendedPaymentRepository
  extends
    PaymentRepository,
    PaymentRepositoryStatusPort,
    PaymentRepositoryFinancialSummaryPort,
    PaymentBookingSyncRepositoryPort,
    PaymentGatewayOrderRepositoryPort,
    PaymentWebhookRepositoryPort,
    PaymentRepositoryReconciliationHistoryPort,
    PaymentRepositoryBulkPort {}

/* ============================================================================
 * Complete extended repository
 * ============================================================================
 */

export interface CompleteExtendedPaymentRepository
  extends
    ExtendedPaymentRepository,
    PaymentRepositoryHealthPort {}

/* ============================================================================
 * Extended repository transaction context
 * ============================================================================
 */

export interface ExtendedPaymentRepositoryTransactionContext {
  repository:
    ExtendedPaymentRepository;
}

export type ExtendedPaymentRepositoryTransactionCallback<T> =
  (
    context:
      ExtendedPaymentRepositoryTransactionContext
  ) => Promise<T>;

export interface ExtendedPaymentRepositoryTransactionManager {
  runInTransaction<T>(
    callback:
      ExtendedPaymentRepositoryTransactionCallback<T>
  ): Promise<T>;
}

/* ============================================================================
 * Repository module contract
 * ============================================================================
 */

export interface PaymentRepositoryModule {
  repository:
    ExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  capabilityReport:
    PaymentRepositoryCapabilityReport;

  configuration:
    PaymentRepositoryConfigurationValidation;
}

/* ============================================================================
 * Repository factory dependency contract
 * ============================================================================
 */

/**
 * Persistence-neutral dependency holder.
 *
 * payment.prisma.repository.ts will define the concrete Prisma dependency
 * contract later.
 */
export interface PaymentRepositoryDependencies {
  repository?:
    ExtendedPaymentRepository;

  transactionManager?:
    ExtendedPaymentRepositoryTransactionManager;
}

/* ============================================================================
 * Repository capability helpers
 * ============================================================================
 */

export function createPaymentRepositoryCapabilityReport(
  capabilities:
    PaymentRepositoryCapability[]
): PaymentRepositoryCapabilityReport {
  return {
    fullyOperational:
      capabilities.every(
        (
          capability
        ) =>
          capability.supported
      ),

    capabilities,
  };
}

export function createSupportedPaymentRepositoryCapability(
  capability:
    PaymentRepositoryCapabilityName,
  message?:
    string
): PaymentRepositoryCapability {
  return {
    capability,

    supported:
      true,

    ...(message
      ? {
          message,
        }
      : {}),
  };
}

export function createUnsupportedPaymentRepositoryCapability(
  capability:
    PaymentRepositoryCapabilityName,
  message:
    string
): PaymentRepositoryCapability {
  return {
    capability,

    supported:
      false,

    message,
  };
}

/* ============================================================================
 * Repository configuration helpers
 * ============================================================================
 */

export function createValidPaymentRepositoryConfiguration(
  warnings:
    string[] = []
): PaymentRepositoryConfigurationValidation {
  return {
    valid:
      true,

    errors:
      [],

    warnings,
  };
}

export function createInvalidPaymentRepositoryConfiguration(
  errors:
    string[],
  warnings:
    string[] = []
): PaymentRepositoryConfigurationValidation {
  return {
    valid:
      false,

    errors,

    warnings,
  };
}

/* ============================================================================
 * Bulk helper methods
 * ============================================================================
 */

export function normalizePaymentRepositoryIds(
  ids:
    PaymentId[]
): PaymentId[] {
  return Array.from(
    new Set(
      ids
        .map(
          (
            id
          ) =>
            typeof id ===
              "string"
              ? id.trim()
              : ""
        )
        .filter(
          (
            id
          ) =>
            id.length >
            0
        )
    )
  );
}

export function createEmptyPaymentBulkLookupResult(
  ids:
    PaymentId[] = []
): PaymentRepositoryBulkLookupResult {
  return {
    payments:
      [],

    missingPaymentIds:
      normalizePaymentRepositoryIds(
        ids
      ),
  };
}

export function createEmptyPaymentBulkStatusUpdateResult():
  PaymentRepositoryBulkStatusUpdateResult {
  return {
    updated:
      [],

    failedPaymentIds:
      [],
  };
}

/* ============================================================================
 * Repository health helpers
 * ============================================================================
 */

export function createHealthyPaymentRepositoryResult(
  message =
    "Payment repository is healthy."
): PaymentRepositoryHealth {
  return {
    healthy:
      true,

    message,

    checkedAt:
      new Date()
        .toISOString(),
  };
}

export function createUnhealthyPaymentRepositoryResult(
  message:
    string
): PaymentRepositoryHealth {
  return {
    healthy:
      false,

    message,

    checkedAt:
      new Date()
        .toISOString(),
  };
}

/* ============================================================================
 * Repository error normalization
 * ============================================================================
 */

export function normalizePaymentRepositoryError(
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
    error instanceof
      Error
  ) {
    return new PaymentRepositoryError(
      fallbackCode,
      error.message,
      {
        cause:
          error,
      }
    );
  }

  return new PaymentRepositoryError(
    fallbackCode,
    "Unknown Payment repository error.",
    {
      cause:
        error,
    }
  );
}
/* ============================================================================
 * End of Payment Repository - Part B
 * ============================================================================
 */

/* ============================================================================
 * Canonical repository command aliases
 * ============================================================================
 */

/**
 * These aliases give service/controller consumers stable names without
 * exposing persistence-specific implementation details.
 */

export type FindPaymentByIdRepositoryQuery = {
  paymentId:
    PaymentId;
};

export type FindPaymentByNumberRepositoryQuery = {
  paymentNumber:
    string;
};

export type FindPaymentByReferenceRepositoryQuery = {
  referenceId:
    string;
};

export type FindPaymentByBookingRepositoryQuery = {
  bookingId:
    string;
};

export type FindPaymentByQuotationRepositoryQuery = {
  quotationId:
    string;
};

export type FindPaymentTransactionByIdRepositoryQuery = {
  transactionId:
    PaymentTransactionId;
};

export type FindPaymentTransactionByGatewayPaymentIdRepositoryQuery = {
  gatewayPaymentId:
    string;
};

export type FindPaymentTransactionsByGatewayOrderIdRepositoryQuery = {
  gatewayOrderId:
    string;
};

/* ============================================================================
 * Canonical repository operation results
 * ============================================================================
 */

export interface PaymentRepositoryOperationResult {
  success:
    boolean;

  payment?:
    Payment;

  message?:
    string;

  errorCode?:
    PaymentRepositoryErrorCode;
}

export interface PaymentTransactionRepositoryOperationResult {
  success:
    boolean;

  transaction?:
    PaymentTransaction;

  message?:
    string;

  errorCode?:
    PaymentRepositoryErrorCode;
}

/* ============================================================================
 * Payment lookup result
 * ============================================================================
 */

export interface PaymentRepositoryLookupResult {
  found:
    boolean;

  payment:
    Payment | null;
}

export interface PaymentTransactionRepositoryLookupResult {
  found:
    boolean;

  transaction:
    PaymentTransaction | null;
}

/* ============================================================================
 * Repository mutation helpers
 * ============================================================================
 */

export function createPaymentRepositorySuccessResult(
  payment:
    Payment,
  message?:
    string
): PaymentRepositoryOperationResult {
  return {
    success:
      true,

    payment,

    ...(message
      ? {
          message,
        }
      : {}),
  };
}

export function createPaymentRepositoryFailureResult(
  errorCode:
    PaymentRepositoryErrorCode,
  message:
    string
): PaymentRepositoryOperationResult {
  return {
    success:
      false,

    errorCode,

    message,
  };
}

export function createPaymentTransactionRepositorySuccessResult(
  transaction:
    PaymentTransaction,
  message?:
    string
): PaymentTransactionRepositoryOperationResult {
  return {
    success:
      true,

    transaction,

    ...(message
      ? {
          message,
        }
      : {}),
  };
}

export function createPaymentTransactionRepositoryFailureResult(
  errorCode:
    PaymentRepositoryErrorCode,
  message:
    string
): PaymentTransactionRepositoryOperationResult {
  return {
    success:
      false,

    errorCode,

    message,
  };
}

/* ============================================================================
 * Repository lookup helpers
 * ============================================================================
 */

export function createPaymentRepositoryLookupResult(
  payment:
    Payment | null
): PaymentRepositoryLookupResult {
  return {
    found:
      payment !==
      null,

    payment,
  };
}

export function createPaymentTransactionRepositoryLookupResult(
  transaction:
    PaymentTransaction | null
): PaymentTransactionRepositoryLookupResult {
  return {
    found:
      transaction !==
      null,

    transaction,
  };
}

/* ============================================================================
 * Repository guards
 * ============================================================================
 */

export function requirePaymentRepositoryIdentifier(
  value:
    unknown,
  field:
    string
): string {
  if (
    typeof value !==
      "string"
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} must contain a valid string.`,
      {
        field,
        value,
      }
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} cannot be empty.`,
      {
        field,
        value,
      }
    );
  }

  return normalized;
}

export function requirePaymentRepositoryAmount(
  value:
    unknown,
  field:
    string,
  allowZero =
    true
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} must contain a finite number.`,
      {
        field,
        value,
      }
    );
  }

  if (
    value <
      0
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} cannot be negative.`,
      {
        field,
        value,
      }
    );
  }

  if (
    !allowZero &&
    value ===
      0
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      `${field} must be greater than zero.`,
      {
        field,
        value,
      }
    );
  }

  return value;
}

/* ============================================================================
 * Repository page helper
 * ============================================================================
 */

export function createPaymentRepositoryPage<T>(
  items:
    T[],
  pagination:
    PaymentRepositoryPagination | undefined,
  totalItems:
    number
): PaymentRepositoryPage<T> {
  return {
    items,

    pagination:
      createPaymentRepositoryPaginationMetadata(
        pagination,
        totalItems
      ),
  };
}

/* ============================================================================
 * Service-facing repository bundle
 * ============================================================================
 */

/**
 * PaymentService should depend on this contract rather than a concrete Prisma
 * repository.
 */
export interface PaymentRepositoryBundle {
  repository:
    ExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  capabilityReport:
    PaymentRepositoryCapabilityReport;

  configuration:
    PaymentRepositoryConfigurationValidation;
}

/* ============================================================================
 * Repository bundle guards
 * ============================================================================
 */

export function requirePaymentRepository(
  dependencies:
    PaymentRepositoryDependencies
): ExtendedPaymentRepository {
  if (
    !dependencies.repository
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Payment repository dependency is required.",
      {
        field:
          "repository",
      }
    );
  }

  return dependencies.repository;
}

export function requirePaymentRepositoryTransactionManager(
  dependencies:
    PaymentRepositoryDependencies
): ExtendedPaymentRepositoryTransactionManager {
  if (
    !dependencies.transactionManager
  ) {
    throw new PaymentRepositoryError(
      "INVALID_REPOSITORY_INPUT",
      "Payment repository transaction manager is required.",
      {
        field:
          "transactionManager",
      }
    );
  }

  return dependencies.transactionManager;
}

/* ============================================================================
 * Repository bundle factory
 * ============================================================================
 */

export function createPaymentRepositoryBundle(
  dependencies:
    PaymentRepositoryDependencies,
  capabilityReport:
    PaymentRepositoryCapabilityReport,
  configuration:
    PaymentRepositoryConfigurationValidation
): PaymentRepositoryBundle {
  return {
    repository:
      requirePaymentRepository(
        dependencies
      ),

    transactionManager:
      requirePaymentRepositoryTransactionManager(
        dependencies
      ),

    capabilityReport,

    configuration,
  };
}

/* ============================================================================
 * Capability defaults
 * ============================================================================
 */

export function createDefaultPaymentRepositoryCapabilityReport():
  PaymentRepositoryCapabilityReport {
  const capabilities:
    PaymentRepositoryCapability[] = [
      createSupportedPaymentRepositoryCapability(
        "CORE_PAYMENT_READ"
      ),

      createSupportedPaymentRepositoryCapability(
        "CORE_PAYMENT_WRITE"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_LISTING"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_SEARCH"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_UNIQUENESS"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_TRANSACTIONS"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_STATUS_UPDATE"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_FINANCIAL_SUMMARY"
      ),

	createSupportedPaymentRepositoryCapability(
	 "PAYMENT_BOOKING_SYNC"
	),
      createSupportedPaymentRepositoryCapability(
        "GATEWAY_ORDER_PERSISTENCE"
      ),

      createSupportedPaymentRepositoryCapability(
        "WEBHOOK_IDEMPOTENCY"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_STATISTICS"
      ),

      createSupportedPaymentRepositoryCapability(
        "PAYMENT_RECONCILIATION"
      ),

      createSupportedPaymentRepositoryCapability(
        "RECONCILIATION_HISTORY"
      ),

      createSupportedPaymentRepositoryCapability(
        "BULK_LOOKUP"
      ),

      createSupportedPaymentRepositoryCapability(
        "BULK_STATUS_UPDATE"
      ),

      createSupportedPaymentRepositoryCapability(
        "DATABASE_TRANSACTIONS"
      ),

      createSupportedPaymentRepositoryCapability(
        "HEALTH_CHECK"
      ),
    ];

  return createPaymentRepositoryCapabilityReport(
    capabilities
  );
}

/* ============================================================================
 * Repository compatibility aliases
 * ============================================================================
 */

/**
 * These aliases make it easier to evolve older consumers without coupling
 * them to the final repository naming.
 */

export type PaymentRepositoryPort =
  ExtendedPaymentRepository;

export type CompletePaymentRepositoryPort =
  CompleteExtendedPaymentRepository;

export type PaymentRepositoryPortTransactionManager =
  ExtendedPaymentRepositoryTransactionManager;

export type PaymentRepositoryPortTransactionContext =
  ExtendedPaymentRepositoryTransactionContext;

/* ============================================================================
 * Canonical query aliases
 * ============================================================================
 */

export type PaymentRepositorySearchQuery =
  PaymentSearchCriteria;

export type PaymentTransactionRepositorySearchQuery =
  PaymentTransactionSearchCriteria;

export type PaymentRepositorySearchResult =
  PaymentListResult;

export type PaymentTransactionRepositorySearchResult =
  PaymentTransactionListResult;

/* ============================================================================
 * Repository statistics aliases
 * ============================================================================
 */

export type PaymentRepositoryStatisticsResult =
  PaymentStatistics;

export type PaymentTransactionRepositoryStatisticsResult =
  PaymentTransactionStatistics;

/* ============================================================================
 * Reconciliation aliases
 * ============================================================================
 */

export type PaymentRepositoryReconciliationResult =
  PaymentReconciliationResult;

export type PaymentRepositoryObservedReconciliation =
  PaymentReconciliationObserved;

/* ============================================================================
 * Repository validation helpers
 * ============================================================================
 */

export function validatePaymentRepositoryPagination(
  pagination:
    PaymentRepositoryPagination | undefined
): PaymentRepositoryPagination {
  return {
    page:
      normalizePaymentRepositoryPage(
        pagination?.page
      ),

    pageSize:
      normalizePaymentRepositoryPageSize(
        pagination?.pageSize
      ),
  };
}

export function validatePaymentRepositorySort(
  sort:
    PaymentRepositorySort | undefined
): PaymentRepositorySort {
  if (
    !sort
  ) {
    return {
      ...DEFAULT_PAYMENT_REPOSITORY_SORT,
    };
  }

  const field =
    Object.values(
      PaymentSortField
    ).includes(
      sort.field
    )
      ? sort.field
      : DEFAULT_PAYMENT_REPOSITORY_SORT
          .field;

  const direction =
    Object.values(
      PaymentSortDirection
    ).includes(
      sort.direction
    )
      ? sort.direction
      : DEFAULT_PAYMENT_REPOSITORY_SORT
          .direction;

  return {
    field,

    direction,
  };
}

/* ============================================================================
 * Repository diagnostics
 * ============================================================================
 */

export interface PaymentRepositoryDiagnostics {
  healthy:
    boolean;

  configurationValid:
    boolean;

  fullyOperational:
    boolean;

  unsupportedCapabilities:
    PaymentRepositoryCapabilityName[];

  checkedAt:
    string;
}

export function createPaymentRepositoryDiagnostics(
  health:
    PaymentRepositoryHealth,
  configuration:
    PaymentRepositoryConfigurationValidation,
  capabilityReport:
    PaymentRepositoryCapabilityReport
): PaymentRepositoryDiagnostics {
  return {
    healthy:
      health.healthy,

    configurationValid:
      configuration.valid,

    fullyOperational:
      health.healthy &&
      configuration.valid &&
      capabilityReport
        .fullyOperational,

    unsupportedCapabilities:
      capabilityReport
        .capabilities
        .filter(
          (
            capability
          ) =>
            !capability.supported
        )
        .map(
          (
            capability
          ) =>
            capability.capability
        ),

    checkedAt:
      new Date()
        .toISOString(),
  };
}

/* ============================================================================
 * End of Payment Repository - Part C
 * ============================================================================
 */