/**
 * ============================================================================
 * EasyMovers
 * Payment Service
 * Part A
 * ============================================================================
 *
 * File:
 * domains/payment/services/payment.service.ts
 *
 * Responsibilities of Part A:
 * - Define Payment service error contracts
 * - Define Payment service dependencies
 * - Normalize identifiers
 * - Normalize repository failures
 * - Define common service result contracts
 * - Implement core Payment read operations
 * - Implement transaction read operations
 * - Implement Payment search/list operations
 * - Establish service factory/foundation
 *
 * Business mutations such as:
 * - create Payment
 * - initiate collection
 * - capture/confirm Payment
 * - refund
 * - gateway-order creation
 * - webhook processing
 * - reconciliation
 *
 * are added in later parts after this foundation is build-cleared.
 * ============================================================================
 */

/* ============================================================================
 * Payment-domain runtime values
 * ============================================================================
 */

import {
  PaymentProvider,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "../models/payment.model";

/* ============================================================================
 * Payment-domain types
 * ============================================================================
 */

import type {
  Payment,
  PaymentCurrency,
  PaymentId,
  PaymentListResult,
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
 * Repository runtime values
 * ============================================================================
 */

import {
  PaymentRepositoryError,
} from "../repositories/payment.repository";

/* ============================================================================
 * Repository contract types
 * ============================================================================
 */

import type {
  CompleteExtendedPaymentRepository,
  ExtendedPaymentRepositoryTransactionManager,
PaymentBookingSyncFinancialSnapshot,
  PaymentGatewayOrderRepositoryRecord,
  PaymentReconciliationHistoryQuery,
  PaymentReconciliationHistoryResult,
  PaymentRepositoryBulkLookupInput,
  PaymentRepositoryBulkLookupResult,
  PaymentRepositoryBulkStatusUpdateInput,
  PaymentRepositoryBulkStatusUpdateResult,
  PaymentRepositoryCapabilityReport,
  PaymentRepositoryConfigurationValidation,
  PaymentRepositoryHealth,
  PaymentWebhookRepositoryRecord,
  SavePaymentReconciliationRepositoryInput,
} from "../repositories/payment.repository";

import {
  mapPaymentToPersistence,
} from "../mappers/payment.mapper";

import {
  validateCreatePaymentInput,
  validatePaymentBusinessState,
} from "../validators/payment.validator";

/* ============================================================================
 * Payment service error codes
 * ============================================================================
 */

export type PaymentServiceErrorCode =
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_TRANSACTION_NOT_FOUND"
  | "PAYMENT_TRANSACTION_ALREADY_EXISTS"
  | "PAYMENT_ALREADY_EXISTS"
  | "PAYMENT_NUMBER_EXISTS"
  | "PAYMENT_REFERENCE_EXISTS"
  | "GATEWAY_PAYMENT_ALREADY_EXISTS"
  | "INVALID_PAYMENT_ID"
  | "INVALID_TRANSACTION_ID"
  | "INVALID_PAYMENT_NUMBER"
  | "INVALID_REFERENCE_ID"
  | "INVALID_BOOKING_ID"
  | "INVALID_QUOTATION_ID"
  | "INVALID_GATEWAY_ORDER_ID"
  | "INVALID_GATEWAY_PAYMENT_ID"
  | "INVALID_SERVICE_INPUT"
  | "VALIDATION_FAILED"
  | "BUSINESS_RULE"
  | "PAYMENT_ALREADY_PAID"
  | "PAYMENT_CANCELLED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_NOT_REFUNDABLE"
  | "PAYMENT_AMOUNT_EXCEEDED"
  | "PAYMENT_AMOUNT_INVALID"
  | "TRANSACTION_FAILED"
  | "GATEWAY_OPERATION_FAILED"
  | "WEBHOOK_PROCESSING_FAILED"
  | "RECONCILIATION_FAILED"
  | "PAYMENT_REPOSITORY_ERROR"
  | "SERVICE_CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

/* ============================================================================
 * Payment service error details
 * ============================================================================
 */

export interface PaymentServiceErrorDetails {
  field?:
    string;

  value?:
    unknown;

  paymentId?:
    string;

  transactionId?:
    string;

  bookingId?:
    string;

  quotationId?:
    string;

  gatewayOrderId?:
    string;

  gatewayPaymentId?:
    string;

  cause?:
    unknown;
}

/* ============================================================================
 * Payment service error
 * ============================================================================
 */

export class PaymentServiceError
  extends Error {
  readonly code:
    PaymentServiceErrorCode;

  readonly details?:
    PaymentServiceErrorDetails;

  constructor(
    code:
      PaymentServiceErrorCode,
    message:
      string,
    details?:
      PaymentServiceErrorDetails
  ) {
    super(
      message
    );

    this.name =
      "PaymentServiceError";

    this.code =
      code;

    this.details =
      details;
  }
}
export interface PaymentCreationBookingAuthority {
  bookingId:
    string;

  bookingNumber:
    string;

  status:
    string;

  selectedQuotationId?:
    string;

  selectedQuoteAmount?:
    number;

  vendorId?:
    string;
}

export interface PaymentCreationQuotationAuthority {
  quotationId:
    string;

  bookingId:
    string;

  vendorId:
    string;

  status:
    string;

  selectedForBooking:
    boolean;

  totalAmount:
    number;

  currency:
    PaymentCurrency;
}

export interface PaymentCreationAuthorityProvider {
  getBookingAuthority(
    bookingId:
      string
  ): Promise<
    PaymentCreationBookingAuthority |
    null
  >;

  getQuotationAuthority(
    quotationId:
      string
  ): Promise<
    PaymentCreationQuotationAuthority |
    null
  >;
}

/* ============================================================================
 * Service dependencies
 * ============================================================================
 */

/**
 * PaymentService depends only on repository contracts.
 *
 * It does not know whether persistence is Prisma, in-memory, mocked, etc.
 */
export interface PaymentServiceDependencies {
  repository:
    CompleteExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  capabilityReport?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;
}

/* ============================================================================
 * Service configuration
 * ============================================================================
 */

export interface PaymentServiceConfiguration {
  defaultCurrency:
    string;

  paymentNumberPrefix:
    string;

  paymentReferencePrefix:
    string;

  transactionReferencePrefix:
    string;

  /**
   * Maximum permitted difference between server time and a client/provider
   * supplied event timestamp.
   */
  maxFutureEventSkewMs:
    number;
}

export const DEFAULT_PAYMENT_SERVICE_CONFIGURATION:
  PaymentServiceConfiguration = {
    defaultCurrency:
      "INR",

    paymentNumberPrefix:
      "EMP",

    paymentReferencePrefix:
      "EMP-REF",

    transactionReferencePrefix:
      "EMPT",

    maxFutureEventSkewMs:
      60_000,
  };

/* ============================================================================
 * Generic service operation result
 * ============================================================================
 */

export interface PaymentServiceResult<T> {
  success:
    boolean;

  data?:
    T;

  error?:
    {
      code:
        PaymentServiceErrorCode;

      message:
        string;

      details?:
        PaymentServiceErrorDetails;
    };
}

/* ============================================================================
 * Canonical result aliases
 * ============================================================================
 */

export type PaymentResult =
  PaymentServiceResult<
    Payment
  >;

export type NullablePaymentResult =
  PaymentServiceResult<
    Payment | null
  >;

export type PaymentSummaryResult =
  PaymentServiceResult<
    PaymentSummary
  >;

export type PaymentListServiceResult =
  PaymentServiceResult<
    PaymentListResult
  >;

export type PaymentTransactionResult =
  PaymentServiceResult<
    PaymentTransaction
  >;

export type NullablePaymentTransactionResult =
  PaymentServiceResult<
    PaymentTransaction | null
  >;

export type PaymentTransactionListServiceResult =
  PaymentServiceResult<
    PaymentTransactionListResult
  >;

export type PaymentStatisticsServiceResult =
  PaymentServiceResult<
    PaymentStatistics
  >;

export type PaymentTransactionStatisticsServiceResult =
  PaymentServiceResult<
    PaymentTransactionStatistics
  >;

export type PaymentRepositoryHealthServiceResult =
  PaymentServiceResult<
    PaymentRepositoryHealth
  >;

export type PaymentReconciliationHistoryServiceResult =
  PaymentServiceResult<
    PaymentReconciliationHistoryResult
  >;

export type PaymentGatewayOrdersServiceResult =
  PaymentServiceResult<
    PaymentGatewayOrderRepositoryRecord[]
  >;

/* ============================================================================
 * Success/failure helpers
 * ============================================================================
 */

export function createPaymentServiceSuccess<T>(
  data:
    T
): PaymentServiceResult<T> {
  return {
    success:
      true,

    data,
  };
}

export function createPaymentServiceFailure<T>(
  error:
    PaymentServiceError
): PaymentServiceResult<T> {
  return {
    success:
      false,

    error: {
      code:
        error.code,

      message:
        error.message,

      ...(error.details
        ? {
            details:
              error.details,
          }
        : {}),
    },
  };
}

/* ============================================================================
 * Identifier normalization
 * ============================================================================
 */

export function normalizePaymentServiceString(
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

/* ============================================================================
 * Required identifier
 * ============================================================================
 */

export function requirePaymentServiceIdentifier(
  value:
    unknown,
  field:
    string,
  code:
    PaymentServiceErrorCode =
      "INVALID_SERVICE_INPUT"
): string {
  const normalized =
    normalizePaymentServiceString(
      value
    );

  if (
    !normalized
  ) {
    throw new PaymentServiceError(
      code,
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
 * Repository error -> service error
 * ============================================================================
 */

export function mapPaymentRepositoryErrorToServiceError(
  error:
    PaymentRepositoryError
): PaymentServiceError {
  switch (
    error.code
  ) {
    case "PAYMENT_NOT_FOUND":
      return new PaymentServiceError(
        "PAYMENT_NOT_FOUND",
        error.message,
        {
          ...error.details,
        }
      );

    case "PAYMENT_TRANSACTION_NOT_FOUND":
      return new PaymentServiceError(
        "PAYMENT_TRANSACTION_NOT_FOUND",
        error.message,
        {
          ...error.details,
        }
      );

    case "DUPLICATE_PAYMENT":
      return new PaymentServiceError(
        "PAYMENT_ALREADY_EXISTS",
        error.message,
        {
          ...error.details,
        }
      );

    case "DUPLICATE_PAYMENT_NUMBER":
      return new PaymentServiceError(
        "PAYMENT_NUMBER_EXISTS",
        error.message,
        {
          ...error.details,
        }
      );

    case "DUPLICATE_PAYMENT_REFERENCE":
      return new PaymentServiceError(
        "PAYMENT_REFERENCE_EXISTS",
        error.message,
        {
          ...error.details,
        }
      );

        case "DUPLICATE_GATEWAY_PAYMENT":
      return new PaymentServiceError(
        "GATEWAY_PAYMENT_ALREADY_EXISTS",
        error.message,
        {
          field:
            "gateway.gatewayPaymentId",
        }
      );
    case "TRANSACTION_FAILED":
      return new PaymentServiceError(
        "TRANSACTION_FAILED",
        error.message,
        {
          ...error.details,
        }
      );

    case "RECONCILIATION_FAILED":
      return new PaymentServiceError(
        "RECONCILIATION_FAILED",
        error.message,
        {
          ...error.details,
        }
      );

    case "INVALID_REPOSITORY_INPUT":
      return new PaymentServiceError(
        "INVALID_SERVICE_INPUT",
        error.message,
        {
          ...error.details,
        }
      );

    case "REPOSITORY_READ_FAILED":
    case "REPOSITORY_WRITE_FAILED":
    case "STATISTICS_FAILED":
    case "UNSUPPORTED_OPERATION":
    default:
      return new PaymentServiceError(
        "PAYMENT_REPOSITORY_ERROR",
        error.message,
        {
          ...error.details,
        }
      );
  }
}

/* ============================================================================
 * Unknown error normalization
 * ============================================================================
 */

export function normalizePaymentServiceError(
  error:
    unknown
): PaymentServiceError {
  if (
    error instanceof
      PaymentServiceError
  ) {
    return error;
  }

  if (
    error instanceof
      PaymentRepositoryError
  ) {
    return mapPaymentRepositoryErrorToServiceError(
      error
    );
  }

  if (
    error instanceof
      Error
  ) {
    return new PaymentServiceError(
      "INTERNAL_ERROR",
      error.message,
      {
        cause:
          error,
      }
    );
  }

  return new PaymentServiceError(
    "INTERNAL_ERROR",
    "Unknown Payment service error.",
    {
      cause:
        error,
    }
  );
}

/* ============================================================================
 * Service dependency guards
 * ============================================================================
 */

export function requirePaymentServiceRepository(
  dependencies:
    PaymentServiceDependencies
): CompleteExtendedPaymentRepository {
  if (
    !dependencies.repository
  ) {
    throw new PaymentServiceError(
      "SERVICE_CONFIGURATION_ERROR",
      "Payment repository dependency is required.",
      {
        field:
          "repository",
      }
    );
  }

  return dependencies.repository;
}

export function requirePaymentServiceTransactionManager(
  dependencies:
    PaymentServiceDependencies
): ExtendedPaymentRepositoryTransactionManager {
  if (
    !dependencies.transactionManager
  ) {
    throw new PaymentServiceError(
      "SERVICE_CONFIGURATION_ERROR",
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
 * Payment existence helper
 * ============================================================================
 */

export async function requirePaymentById(
  repository:
    CompleteExtendedPaymentRepository,
  paymentId:
    PaymentId
): Promise<
  Payment
> {
  const normalizedPaymentId =
    requirePaymentServiceIdentifier(
      paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const payment =
    await repository.findById(
      normalizedPaymentId
    );

  if (
    !payment
  ) {
    throw new PaymentServiceError(
      "PAYMENT_NOT_FOUND",
      "Payment not found.",
      {
        paymentId:
          normalizedPaymentId,
      }
    );
  }

  return payment;
}

/* ============================================================================
 * Payment -> Booking synchronization projection
 * ============================================================================
 */

/**
 * Builds the authoritative financial snapshot persisted in the synchronization
 * outbox record.
 *
 * Payment remains the source of truth.
 */
export function buildPaymentBookingSyncFinancialSnapshot(
  payment:
    Payment
): PaymentBookingSyncFinancialSnapshot {
  return {
    totalAmount:
      payment.payable
        .totalAmount,

    paidAmount:
      payment.payable
        .paidAmount,

    balanceAmount:
      payment.payable
        .balanceAmount,

    paymentPending:
      payment.payable
        .paymentPending,

    refundedAmount:
      payment.refundSummary
        ?.totalRefundedAmount ??
      0,

    refundPendingAmount:
      payment.refundSummary
        ?.refundPendingAmount ??
      0,

    currency:
      payment.payable
        .currency,
  };
}

/* ============================================================================
 * Persist pending Payment -> Booking synchronization
 * ============================================================================
 */

/**
 * This helper must be called through the transaction-scoped repository after
 * the Payment mutation has been persisted.
 *
 * Consequently, the Payment mutation and its PENDING synchronization record
 * either commit together or roll back together.
 */
export async function persistPendingPaymentBookingSync(
  repository:
    CompleteExtendedPaymentRepository,
  payment:
    Payment,
  requestedBy:
    string
): Promise<void> {
  const paymentId =
    requirePaymentServiceIdentifier(
      payment.paymentId,
      "payment.paymentId",
      "INVALID_PAYMENT_ID"
    );

  const bookingId =
    requirePaymentServiceIdentifier(
      payment.bookingId,
      "payment.bookingId",
      "INVALID_SERVICE_INPUT"
    );

  const paymentUpdatedAt =
    requirePaymentServiceIdentifier(
      payment.audit
        .updatedAt,
      "payment.audit.updatedAt",
      "INVALID_SERVICE_INPUT"
    );

  const normalizedRequestedBy =
    requirePaymentServiceIdentifier(
      requestedBy,
      "requestedBy",
      "INVALID_SERVICE_INPUT"
    );

  await repository
    .upsertPendingBookingSync({
      paymentId,

      bookingId,

      paymentUpdatedAt,

      paymentSnapshot:
        buildPaymentBookingSyncFinancialSnapshot(
          payment
        ),

      requestedBy:
        normalizedRequestedBy,
    });
}
/* ============================================================================
 * Transaction duplicate guard
 * ============================================================================
 */

export async function requirePaymentTransactionIdAvailable(
  repository:
    CompleteExtendedPaymentRepository,
  transactionId?:
    string
): Promise<void> {
  if (
    typeof transactionId !==
      "string" ||
    !transactionId.trim()
  ) {
    return;
  }

  const normalizedTransactionId =
    transactionId.trim();

  const existingTransaction =
    await repository
      .findTransactionById(
        normalizedTransactionId
      );

  if (
    existingTransaction
  ) {
    throw new PaymentServiceError(
      "PAYMENT_TRANSACTION_ALREADY_EXISTS",
      "A Payment transaction with this transactionId already exists.",
      {
        transactionId:
          normalizedTransactionId,

        paymentId:
          existingTransaction
            .paymentId,
      }
    );
  }
}
/* ============================================================================
 * Transaction existence helper
 * ============================================================================
 */

export async function requirePaymentTransactionById(
  repository:
    CompleteExtendedPaymentRepository,
  transactionId:
    PaymentTransactionId
): Promise<
  PaymentTransaction
> {
  const normalizedTransactionId =
    requirePaymentServiceIdentifier(
      transactionId,
      "transactionId",
      "INVALID_TRANSACTION_ID"
    );

  const transaction =
    await repository
      .findTransactionById(
        normalizedTransactionId
      );

  if (
    !transaction
  ) {
    throw new PaymentServiceError(
      "PAYMENT_TRANSACTION_NOT_FOUND",
      "Payment transaction not found.",
      {
        transactionId:
          normalizedTransactionId,
      }
    );
  }

  return transaction;
}

/* ============================================================================
 * Payment lifecycle helpers
 * ============================================================================
 */

export function isPaymentTerminal(
  payment:
    Payment
): boolean {
  return (
    payment.status ===
      PaymentStatus.CANCELLED ||
    payment.status ===
      PaymentStatus.REFUNDED
  );
}

export function isPaymentFullyPaid(
  payment:
    Payment
): boolean {
  return (
    payment.status ===
      PaymentStatus.PAID ||
    (
      payment.payable
        .totalAmount >
        0 &&
      payment.payable
        .paidAmount >=
        payment.payable
          .totalAmount &&
      payment.payable
        .balanceAmount <=
        0
    )
  );
}

/* ============================================================================
 * Payment Service
 * ============================================================================
 */

export class PaymentService {
  readonly repository:
    CompleteExtendedPaymentRepository;

  readonly transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

readonly creationAuthorityProvider?:
  PaymentCreationAuthorityProvider;
  readonly configuration:
    PaymentServiceConfiguration;

  readonly capabilityReport?:
    PaymentRepositoryCapabilityReport;

  readonly repositoryConfiguration?:
    PaymentRepositoryConfigurationValidation;

  constructor(
    dependencies:
      PaymentServiceDependencies,
    configuration:
      Partial<
        PaymentServiceConfiguration
      > = {}
  ) {
this.repository =
  requirePaymentServiceRepository(
    dependencies
  );

this.transactionManager =
  requirePaymentServiceTransactionManager(
    dependencies
  );

this.creationAuthorityProvider =
  dependencies
    .creationAuthorityProvider;

this.capabilityReport =
  dependencies
    .capabilityReport;

    this.repositoryConfiguration =
      dependencies
        .configuration;

    this.configuration = {
      ...DEFAULT_PAYMENT_SERVICE_CONFIGURATION,
      ...configuration,
    };
  }

  /* ==========================================================================
   * Find Payment by ID
   * ==========================================================================
   */

  async getPayment(
    paymentId:
      PaymentId
  ): Promise<
    Payment | null
  > {
    const normalizedPaymentId =
      requirePaymentServiceIdentifier(
        paymentId,
        "paymentId",
        "INVALID_PAYMENT_ID"
      );

    try {
      return await this.repository
        .findById(
          normalizedPaymentId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Require Payment by ID
   * ==========================================================================
   */

  async getRequiredPayment(
    paymentId:
      PaymentId
  ): Promise<
    Payment
  > {
    try {
      return await requirePaymentById(
        this.repository,
        paymentId
      );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Find Payment by public Payment number
   * ==========================================================================
   */

  async getPaymentByNumber(
    paymentNumber:
      string
  ): Promise<
    Payment | null
  > {
    const normalizedPaymentNumber =
      requirePaymentServiceIdentifier(
        paymentNumber,
        "paymentNumber",
        "INVALID_PAYMENT_NUMBER"
      );

    try {
      return await this.repository
        .findByPaymentNumber(
          normalizedPaymentNumber
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Find Payment by reference ID
   * ==========================================================================
   */

  async getPaymentByReferenceId(
    referenceId:
      string
  ): Promise<
    Payment | null
  > {
    const normalizedReferenceId =
      requirePaymentServiceIdentifier(
        referenceId,
        "referenceId",
        "INVALID_REFERENCE_ID"
      );

    try {
      return await this.repository
        .findByReferenceId(
          normalizedReferenceId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Find latest Payment for Booking
   * ==========================================================================
   */

  async getPaymentByBookingId(
    bookingId:
      string
  ): Promise<
    Payment | null
  > {
    const normalizedBookingId =
      requirePaymentServiceIdentifier(
        bookingId,
        "bookingId",
        "INVALID_BOOKING_ID"
      );

    try {
      return await this.repository
        .findByBookingId(
          normalizedBookingId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Find latest Payment for Quotation
   * ==========================================================================
   */

  async getPaymentByQuotationId(
    quotationId:
      string
  ): Promise<
    Payment | null
  > {
    const normalizedQuotationId =
      requirePaymentServiceIdentifier(
        quotationId,
        "quotationId",
        "INVALID_QUOTATION_ID"
      );

    try {
      return await this.repository
        .findByQuotationId(
          normalizedQuotationId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Search Payments
   * ==========================================================================
   */

  async searchPayments(
    criteria:
      PaymentSearchCriteria
  ): Promise<
    PaymentListResult
  > {
    try {
      return await this.repository
        .search(
          criteria
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Find transaction by ID
   * ==========================================================================
   */

  async getPaymentTransaction(
    transactionId:
      PaymentTransactionId
  ): Promise<
    PaymentTransaction | null
  > {
    const normalizedTransactionId =
      requirePaymentServiceIdentifier(
        transactionId,
        "transactionId",
        "INVALID_TRANSACTION_ID"
      );

    try {
      return await this.repository
        .findTransactionById(
          normalizedTransactionId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Require transaction by ID
   * ==========================================================================
   */

  async getRequiredPaymentTransaction(
    transactionId:
      PaymentTransactionId
  ): Promise<
    PaymentTransaction
  > {
    try {
      return await requirePaymentTransactionById(
        this.repository,
        transactionId
      );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Transactions for Payment
   * ==========================================================================
   */

  async getPaymentTransactions(
    paymentId:
      PaymentId
  ): Promise<
    PaymentTransaction[]
  > {
    const normalizedPaymentId =
      requirePaymentServiceIdentifier(
        paymentId,
        "paymentId",
        "INVALID_PAYMENT_ID"
      );

    try {
      return await this.repository
        .findTransactionsByPaymentId(
          normalizedPaymentId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Transaction by gateway Payment ID
   * ==========================================================================
   */

  async getTransactionByGatewayPaymentId(
    gatewayPaymentId:
      string
  ): Promise<
    PaymentTransaction | null
  > {
    const normalizedGatewayPaymentId =
      requirePaymentServiceIdentifier(
        gatewayPaymentId,
        "gatewayPaymentId",
        "INVALID_GATEWAY_PAYMENT_ID"
      );

    try {
      return await this.repository
        .findTransactionByGatewayPaymentId(
          normalizedGatewayPaymentId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Transactions by gateway order
   * ==========================================================================
   */

  async getTransactionsByGatewayOrderId(
    gatewayOrderId:
      string
  ): Promise<
    PaymentTransaction[]
  > {
    const normalizedGatewayOrderId =
      requirePaymentServiceIdentifier(
        gatewayOrderId,
        "gatewayOrderId",
        "INVALID_GATEWAY_ORDER_ID"
      );

    try {
      return await this.repository
        .findTransactionsByGatewayOrderId(
          normalizedGatewayOrderId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Search Payment transactions
   * ==========================================================================
   */

  async searchPaymentTransactions(
    criteria:
      PaymentTransactionSearchCriteria
  ): Promise<
    PaymentTransactionListResult
  > {
    try {
      return await this.repository
        .searchTransactions(
          criteria
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Gateway orders for Payment
   * ==========================================================================
   */

  async getGatewayOrders(
    paymentId:
      PaymentId
  ): Promise<
    PaymentGatewayOrderRepositoryRecord[]
  > {
    const normalizedPaymentId =
      requirePaymentServiceIdentifier(
        paymentId,
        "paymentId",
        "INVALID_PAYMENT_ID"
      );

    try {
      return await this.repository
        .findGatewayOrdersByPaymentId(
          normalizedPaymentId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Latest reconciliation
   * ==========================================================================
   */

  async getLatestReconciliation(
    paymentId:
      PaymentId
  ) {
    const normalizedPaymentId =
      requirePaymentServiceIdentifier(
        paymentId,
        "paymentId",
        "INVALID_PAYMENT_ID"
      );

    try {
      return await this.repository
        .getLatestReconciliation(
          normalizedPaymentId
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Reconciliation history
   * ==========================================================================
   */

  async getReconciliationHistory(
    query:
      PaymentReconciliationHistoryQuery
  ): Promise<
    PaymentReconciliationHistoryResult
  > {
    requirePaymentServiceIdentifier(
      query.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

    try {
      return await this.repository
        .listReconciliations(
          query
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Payment statistics
   * ==========================================================================
   */

  async getPaymentStatistics(
    criteria?:
      PaymentSearchCriteria
  ): Promise<
    PaymentStatistics
  > {
    try {
      return await this.repository
        .getPaymentStatistics(
          criteria
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Transaction statistics
   * ==========================================================================
   */

  async getTransactionStatistics(
    criteria?:
      PaymentTransactionSearchCriteria
  ): Promise<
    PaymentTransactionStatistics
  > {
    try {
      return await this.repository
        .getTransactionStatistics(
          criteria
        );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ==========================================================================
   * Repository health
   * ==========================================================================
   */

  async checkRepositoryHealth():
    Promise<
      PaymentRepositoryHealth
    > {
    try {
      return await this.repository
        .checkHealth();
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }
}

/* ============================================================================
 * Payment Service factory
 * ============================================================================
 */

export function createPaymentService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): PaymentService {
  return new PaymentService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Payment Service foundation facade
 * ============================================================================
 */

export const PaymentServiceFoundation = {
  create:
    createPaymentService,

  errors: {
    normalize:
      normalizePaymentServiceError,

    repositoryToService:
      mapPaymentRepositoryErrorToServiceError,
  },

  identifiers: {
    normalize:
      normalizePaymentServiceString,

    require:
      requirePaymentServiceIdentifier,
  },

  guards: {
    requirePayment:
      requirePaymentById,

    requireTransaction:
      requirePaymentTransactionById,

    isTerminal:
      isPaymentTerminal,

    isFullyPaid:
      isPaymentFullyPaid,
  },
} as const;

/* ============================================================================
 * End of Payment Service - Part A
 * ============================================================================
 */

/* ============================================================================
 * EasyMovers
 * Payment Service
 * Part B
 * ============================================================================
 *
 * Core mutation/business operations:
 *
 * - Payment identity generation
 * - Payment identity validation
 * - Payment uniqueness checks
 * - Create Payment
 * - Update Payment
 * - Payment status transitions
 * - Cancel Payment
 * - Transaction-safe mutation execution
 *
 * IMPORTANT:
 * - This section accepts an already-constructed Payment aggregate.
 * - Request payload validation remains the responsibility of
 *   payment.validator.ts / controller mapping.
 * - PaymentService owns business-state rules.
 * - Repository owns persistence only.
 * ============================================================================
 */

/* ============================================================================
 * Service mutation actor
 * ============================================================================
 */

export interface PaymentMutationContext {
  updatedBy?:
    string;

  reason?:
    string;
}

/* ============================================================================
 * Payment identity result
 * ============================================================================
 */

export interface GeneratedPaymentIdentity {
  paymentNumber:
    string;

  referenceId:
    string;
}

/* ============================================================================
 * Payment status mutation input
 * ============================================================================
 */

export interface ChangePaymentStatusServiceInput {
  paymentId:
    PaymentId;

  status:
    PaymentStatus;

  updatedBy?:
    string;
}

/* ============================================================================
 * Cancel Payment input
 * ============================================================================
 */

export interface CancelPaymentServiceInput {
  paymentId:
    PaymentId;

  cancelledBy?:
    string;

  reason?:
    string;
}

/* ============================================================================
 * Payment mutation result aliases
 * ============================================================================
 */

export type CreatePaymentServiceResult =
  Payment;

export type UpdatePaymentServiceResult =
  Payment;

export type ChangePaymentStatusServiceResult =
  Payment;

export type CancelPaymentServiceResult =
  Payment;

/* ============================================================================
 * Random identity helper
 * ============================================================================
 */

function createPaymentIdentitySuffix(
  length =
    6
): string {
  return Math.random()
    .toString(36)
    .slice(
      2,
      2 +
        length
    )
    .toUpperCase()
    .padEnd(
      length,
      "0"
    );
}

/* ============================================================================
 * Payment number generator
 * ============================================================================
 */

export function generatePaymentNumber(
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION,
  now:
    Date = new Date()
): string {
  const year =
    now
      .getUTCFullYear();

  const month =
    String(
      now
        .getUTCMonth() +
        1
    )
      .padStart(
        2,
        "0"
      );

  const day =
    String(
      now
        .getUTCDate()
    )
      .padStart(
        2,
        "0"
      );

  return [
    configuration
      .paymentNumberPrefix,
    `${year}${month}${day}`,
    createPaymentIdentitySuffix(
      6
    ),
  ].join(
    "-"
  );
}

/* ============================================================================
 * Payment reference generator
 * ============================================================================
 */

export function generatePaymentReferenceId(
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION,
  now:
    Date = new Date()
): string {
  return [
    configuration
      .paymentReferencePrefix,

    now.getTime(),

    createPaymentIdentitySuffix(
      8
    ),
  ].join(
    "-"
  );
}

/* ============================================================================
 * Payment transaction reference generator
 * ============================================================================
 */

export function generatePaymentTransactionReference(
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION,
  now:
    Date = new Date()
): string {
  return [
    configuration
      .transactionReferencePrefix,

    now.getTime(),

    createPaymentIdentitySuffix(
      8
    ),
  ].join(
    "-"
  );
}

/* ============================================================================
 * Combined Payment identity generator
 * ============================================================================
 */

export function generatePaymentIdentity(
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): GeneratedPaymentIdentity {
  const now =
    new Date();

  return {
    paymentNumber:
      generatePaymentNumber(
        configuration,
        now
      ),

    referenceId:
      generatePaymentReferenceId(
        configuration,
        now
      ),
  };
}

export function validatePaymentCreationContract(
  payment:
    Payment
): void {
  const validation =
    validateCreatePaymentInput({
      bookingId:
        payment.bookingId,

      ...(payment.bookingNumber !==
      undefined
        ? {
            bookingNumber:
              payment.bookingNumber,
          }
        : {}),

      ...(payment.vendorId !==
      undefined
        ? {
            vendorId:
              payment.vendorId,
          }
        : {}),

      ...(payment.quotationId !==
      undefined
        ? {
            quotationId:
              payment.quotationId,
          }
        : {}),

      totalAmount:
        payment.payable
          .totalAmount,

      ...(payment.payable
        .advanceAmount !==
      undefined
        ? {
            advanceAmount:
              payment.payable
                .advanceAmount,
          }
        : {}),

      currency:
        payment.payable
          .currency,

      source:
        payment.audit.source,

      commercialReference:
        payment.commercialReference,

      ...(payment.remarks !==
      undefined
        ? {
            remarks:
              payment.remarks,
          }
        : {}),

      ...(payment.internalRemarks !==
      undefined
        ? {
            internalRemarks:
              payment.internalRemarks,
          }
        : {}),

      createdBy:
        payment.audit.createdBy,
    });

  if (
    validation.valid
  ) {
    return;
  }

  const firstError =
    validation.errors[0];

  if (
    firstError ===
      undefined
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment creation validation failed.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  throw new PaymentServiceError(
    "VALIDATION_FAILED",
    firstError.message,
    {
      field:
        firstError.field,

      value:
        firstError.value,

      paymentId:
        payment.paymentId,
    }
  );
}

export function validatePaymentBusinessContract(
  payment:
    Payment
): void {
  const validation =
    validatePaymentBusinessState(
      payment
    );

  if (
    validation.valid
  ) {
    return;
  }

  const firstError =
    validation.errors[0];

  if (
    firstError ===
      undefined
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment business-state validation failed.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  throw new PaymentServiceError(
    "VALIDATION_FAILED",
    firstError.message,
    {
      field:
        firstError.field,

      value:
        firstError.value,

      paymentId:
        payment.paymentId,
    }
  );
}

export function validateInitialPaymentState(
  payment:
    Payment
): void {
  const totalRefundedAmount =
    payment.refundSummary
      ?.totalRefundedAmount ??
    0;

  const refundPendingAmount =
    payment.refundSummary
      ?.refundPendingAmount ??
    0;
    if (
    payment.status !==
      PaymentStatus.PENDING
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "A newly created Payment must have PENDING status.",
      {
        field:
          "status",

        value:
          payment.status,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.payable
      .paidAmount !==
      0
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "A newly created Payment must have zero paidAmount.",
      {
        field:
          "payable.paidAmount",

        value:
          payment.payable
            .paidAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.transactions
      .length !==
      0
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "A newly created Payment cannot contain transactions.",
      {
        field:
          "transactions",

        value:
          payment.transactions
            .length,

        paymentId:
          payment.paymentId,
      }
    );
  }
    if (
  totalRefundedAmount !==
    0
)
 {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "A newly created Payment must have zero totalRefundedAmount.",
      {
        field:
          "refundSummary.totalRefundedAmount",

        value: totalRefundedAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
  refundPendingAmount !==
    0
) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "A newly created Payment must have zero refundPendingAmount.",
      {
        field:
          "refundSummary.refundPendingAmount",

        value:
  refundPendingAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }
}

export async function validatePaymentCreationAuthority(
  provider:
    PaymentCreationAuthorityProvider |
    undefined,
  payment:
    Payment
): Promise<
  void
> {
  if (
    provider ===
      undefined
  ) {
    throw new PaymentServiceError(
      "SERVICE_CONFIGURATION_ERROR",
      "Payment creation authority provider is required.",
      {
        field:
          "creationAuthorityProvider",

        paymentId:
          payment.paymentId,
      }
    );
  }

  const booking =
    await provider
      .getBookingAuthority(
        payment.bookingId
      );

  if (
    booking ===
      null
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment Booking does not exist.",
      {
        field:
          "bookingId",

        value:
          payment.bookingId,

        paymentId:
          payment.paymentId,

        bookingId:
          payment.bookingId,
      }
    );
  }

  const allowedBookingStatuses =
    new Set([
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
    ]);

  if (
    !allowedBookingStatuses
      .has(
        booking.status
      )
  ) {
    throw new PaymentServiceError(
      "BUSINESS_RULE",
      "Booking is not eligible for Payment creation.",
      {
        field:
          "booking.status",

        value:
          booking.status,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,
      }
    );
  }

  if (
    payment.bookingNumber !==
      booking.bookingNumber
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment bookingNumber must match the authoritative Booking.",
      {
        field:
          "bookingNumber",

        value:
          payment.bookingNumber,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,
      }
    );
  }

  if (
    booking.selectedQuotationId ===
      undefined
  ) {
    throw new PaymentServiceError(
      "BUSINESS_RULE",
      "Booking must contain a selected quotation before Payment creation.",
      {
        field:
          "booking.quotation.selectedQuotationId",

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,
      }
    );
  }

  if (
    payment.quotationId !==
      booking.selectedQuotationId
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment quotationId must match the Booking selected quotation.",
      {
        field:
          "quotationId",

        value:
          payment.quotationId,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,

        quotationId:
          payment.quotationId,
      }
    );
  }

  if (
    booking.vendorId ===
      undefined ||
    payment.vendorId !==
      booking.vendorId
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment vendorId must match the Booking assigned Vendor.",
      {
        field:
          "vendorId",

        value:
          payment.vendorId,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,
      }
    );
  }

  if (
    booking.selectedQuoteAmount ===
      undefined ||
    Math.abs(
      booking.selectedQuoteAmount -
        payment.payable
          .totalAmount
    ) >
      0.001
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment totalAmount must match the Booking selected quotation amount.",
      {
        field:
          "payable.totalAmount",

        value:
          payment.payable
            .totalAmount,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,
      }
    );
  }

  const quotation =
    await provider
      .getQuotationAuthority(
        booking
          .selectedQuotationId
      );

  if (
    quotation ===
      null
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Selected quotation does not exist.",
      {
        field:
          "quotationId",

        value:
          booking
            .selectedQuotationId,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,

        quotationId:
          booking
            .selectedQuotationId,
      }
    );
  }

  if (
    quotation.status !==
      "ACCEPTED" ||
    quotation.selectedForBooking !==
      true
  ) {
    throw new PaymentServiceError(
      "BUSINESS_RULE",
      "Quotation must be accepted and selected before Payment creation.",
      {
        field:
          "quotation.status",

        value:
          quotation.status,

        paymentId:
          payment.paymentId,

        quotationId:
          quotation.quotationId,
      }
    );
  }

  if (
    quotation.bookingId !==
      booking.bookingId
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Quotation does not belong to the Payment Booking.",
      {
        field:
          "quotation.bookingId",

        value:
          quotation.bookingId,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,

        quotationId:
          quotation.quotationId,
      }
    );
  }

  if (
    quotation.vendorId !==
      booking.vendorId
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Quotation Vendor does not match the Booking assigned Vendor.",
      {
        field:
          "quotation.vendorId",

        value:
          quotation.vendorId,

        paymentId:
          payment.paymentId,

        bookingId:
          booking.bookingId,

        quotationId:
          quotation.quotationId,
      }
    );
  }

  if (
    Math.abs(
      quotation.totalAmount -
        payment.payable
          .totalAmount
    ) >
      0.001
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment totalAmount must match the accepted quotation totalAmount.",
      {
        field:
          "payable.totalAmount",

        value:
          payment.payable
            .totalAmount,

        paymentId:
          payment.paymentId,

        quotationId:
          quotation.quotationId,
      }
    );
  }

  if (
    quotation.currency !==
      payment.payable
        .currency
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      "Payment currency must match the accepted quotation currency.",
      {
        field:
          "payable.currency",

        value:
          payment.payable
            .currency,

        paymentId:
          payment.paymentId,

        quotationId:
          quotation.quotationId,
      }
    );
  }
}
/*
============================================================================
 * Validate Payment aggregate runtime shape
 * ============================================================================
 */

export function validatePaymentAggregateShape(
  payment:
    Payment
): void {
  if (
    typeof payment !==
      "object" ||
    payment ===
      null ||
    Array.isArray(
      payment
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_SERVICE_INPUT",
      "Payment must be a JSON object.",
      {
        field:
          "payment",

        value:
          payment,
      }
    );
  }

  const candidate =
    payment as unknown as
      Record<
        string,
        unknown
      >;

  if (
    typeof candidate.payable !==
      "object" ||
    candidate.payable ===
      null ||
    Array.isArray(
      candidate.payable
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_SERVICE_INPUT",
      "Payment payable must be a JSON object.",
      {
        field:
          "payable",

        value:
          candidate.payable,
      }
    );
  }

  if (
    !Array.isArray(
      candidate.transactions
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_SERVICE_INPUT",
      "Payment transactions must be an array.",
      {
        field:
          "transactions",

        value:
          candidate.transactions,
      }
    );
  }

  if (
    typeof candidate.refundSummary !==
      "object" ||
    candidate.refundSummary ===
      null ||
    Array.isArray(
      candidate.refundSummary
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_SERVICE_INPUT",
      "Payment refundSummary must be a JSON object.",
      {
        field:
          "refundSummary",

        value:
          candidate.refundSummary,
      }
    );
  }

  if (
    typeof candidate.audit !==
      "object" ||
    candidate.audit ===
      null ||
    Array.isArray(
      candidate.audit
    )
  ) {
    throw new PaymentServiceError(
      "INVALID_SERVICE_INPUT",
      "Payment audit must be a JSON object.",
      {
        field:
          "audit",

        value:
          candidate.audit,
      }
    );
  }
}
/* ============================================================================
 * Validate Payment aggregate identity
 * ============================================================================
 */

export function validatePaymentAggregateIdentity(
  payment:
    Payment
): void {
  const persistence =
    mapPaymentToPersistence(
      payment
    );

  requirePaymentServiceIdentifier(
    payment.paymentId,
    "paymentId",
    "INVALID_PAYMENT_ID"
  );

  requirePaymentServiceIdentifier(
    persistence.paymentNumber,
    "paymentNumber",
    "INVALID_PAYMENT_NUMBER"
  );

  requirePaymentServiceIdentifier(
    persistence.referenceId,
    "referenceId",
    "INVALID_REFERENCE_ID"
  );

  requirePaymentServiceIdentifier(
    persistence.bookingId,
    "bookingId",
    "INVALID_BOOKING_ID"
  );
}

/* ============================================================================
 * Validate Payment financial aggregate
 * ============================================================================
 */

export function validatePaymentFinancialState(
  payment:
    Payment
): void {
  const {
    totalAmount,
    paidAmount,
    balanceAmount,
    paymentPending,
  } =
    payment.payable;

  if (
    !Number.isFinite(
      totalAmount
    ) ||
    totalAmount <
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment totalAmount must contain a valid non-negative amount.",
      {
        field:
          "payable.totalAmount",

        value:
          totalAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    !Number.isFinite(
      paidAmount
    ) ||
    paidAmount <
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment paidAmount must contain a valid non-negative amount.",
      {
        field:
          "payable.paidAmount",

        value:
          paidAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    paidAmount >
      totalAmount
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_EXCEEDED",
      "Payment paidAmount cannot exceed totalAmount.",
      {
        field:
          "payable.paidAmount",

        value:
          paidAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    !Number.isFinite(
      balanceAmount
    ) ||
    balanceAmount <
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment balanceAmount must contain a valid non-negative amount.",
      {
        field:
          "payable.balanceAmount",

        value:
          balanceAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    !Number.isFinite(
      paymentPending
    ) ||
    paymentPending <
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment paymentPending must contain a valid non-negative amount.",
      {
        field:
          "payable.paymentPending",

        value:
          paymentPending,

        paymentId:
          payment.paymentId,
      }
    );
  }

  const expectedBalanceAmount =
    Number(
      (
        totalAmount -
        paidAmount
      ).toFixed(
        2
      )
    );

  if (
    Math.abs(
      balanceAmount -
        expectedBalanceAmount
    ) >
      0.001
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment balanceAmount must equal totalAmount minus paidAmount.",
      {
        field:
          "payable.balanceAmount",

        value:
          balanceAmount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    Math.abs(
      paymentPending -
        expectedBalanceAmount
    ) >
      0.001
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Payment paymentPending must equal the outstanding balanceAmount.",
      {
        field:
          "payable.paymentPending",

        value:
          paymentPending,

        paymentId:
          payment.paymentId,
      }
    );
  }
}

/* ============================================================================
 * Validate complete Payment aggregate
 * ============================================================================
 */

export function validatePaymentAggregateForPersistence(
  payment:
    Payment
): void {
  validatePaymentAggregateShape(
  payment
);

validatePaymentCreationContract(
  payment
);

validateInitialPaymentState(
  payment
);

validatePaymentBusinessContract(
  payment
);

validatePaymentAggregateIdentity(
  payment
);

validatePaymentFinancialState(
  payment
);
}

/**
 * Validates an existing Payment aggregate before an update.
 *
 * Creation-only rules are intentionally excluded:
 *
 * - validatePaymentCreationContract()
 * - validateInitialPaymentState()
 *
 * Existing Payments may legitimately contain transactions, collections,
 * refunds and non-PENDING statuses.
 */
export function validatePaymentAggregateForUpdate(
  payment:
    Payment
): void {
  validatePaymentAggregateShape(
    payment
  );

  validatePaymentBusinessContract(
    payment
  );

  validatePaymentAggregateIdentity(
    payment
  );

  validatePaymentFinancialState(
    payment
  );
}

export function validatePaymentUpdateImmutability(
  existing:
    Payment,
  proposed:
    Payment
): void {
  const rejectChange = (
    field:
      string,
    existingValue:
      unknown,
    proposedValue:
      unknown,
    message:
      string
  ): void => {
    if (
      proposedValue ===
        existingValue
    ) {
      return;
    }

    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      message,
      {
        field,

        value:
          proposedValue,

        paymentId:
          existing.paymentId,

        bookingId:
          existing.bookingId,

        quotationId:
          existing.quotationId,
      }
    );
  };

  /* ------------------------------------------------------------------------
   * Immutable Payment identity
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "paymentId",
    existing.paymentId,
    proposed.paymentId,
    "paymentId cannot be changed after Payment creation."
  );

  rejectChange(
    "paymentNumber",
    existing.paymentNumber,
    proposed.paymentNumber,
    "paymentNumber cannot be changed after Payment creation."
  );

  rejectChange(
    "referenceId",
    existing.referenceId,
    proposed.referenceId,
    "referenceId cannot be changed after Payment creation."
  );

  /* ------------------------------------------------------------------------
   * Immutable cross-domain authority
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "bookingId",
    existing.bookingId,
    proposed.bookingId,
    "bookingId cannot be changed after Payment creation."
  );

  rejectChange(
    "bookingNumber",
    existing.bookingNumber,
    proposed.bookingNumber,
    "bookingNumber cannot be changed after Payment creation."
  );

  rejectChange(
    "vendorId",
    existing.vendorId,
    proposed.vendorId,
    "vendorId cannot be changed after Payment creation."
  );

  rejectChange(
    "quotationId",
    existing.quotationId,
    proposed.quotationId,
    "quotationId cannot be changed after Payment creation."
  );

  /* ------------------------------------------------------------------------
   * Immutable commercial amount and currency
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "payable.totalAmount",
    existing.payable
      .totalAmount,
    proposed.payable
      .totalAmount,
    "Payment totalAmount cannot be changed through aggregate update."
  );

  rejectChange(
    "payable.currency",
    existing.payable
      .currency,
    proposed.payable
      .currency,
    "Payment currency cannot be changed after Payment creation."
  );

  rejectChange(
    "commercialReference.quotationId",
    existing.commercialReference
      ?.quotationId,
    proposed.commercialReference
      ?.quotationId,
    "Commercial quotationId cannot be changed after Payment creation."
  );

  rejectChange(
    "commercialReference.customerPayableAmount",
    existing.commercialReference
      ?.customerPayableAmount,
    proposed.commercialReference
      ?.customerPayableAmount,
    "Commercial customerPayableAmount cannot be changed after Payment creation."
  );

  rejectChange(
    "commercialReference.currency",
    existing.commercialReference
      ?.currency,
    proposed.commercialReference
      ?.currency,
    "Commercial currency cannot be changed after Payment creation."
  );

  /*
   * Protect every remaining field in the commercial snapshot, including:
   *
   * - quotationNumber
   * - vendorQuotedAmount
   * - platformMarkupAmount
   * - platformCommissionAmount
   */
  rejectChange(
    "commercialReference",
    JSON.stringify(
      existing.commercialReference
    ),
    JSON.stringify(
      proposed.commercialReference
    ),
    "Payment commercialReference cannot be changed after Payment creation."
  );

  /* ------------------------------------------------------------------------
   * Status must use the dedicated status workflow
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "status",
    existing.status,
    proposed.status,
    "Payment status cannot be changed through aggregate update."
  );

  /* ------------------------------------------------------------------------
   * Collection-controlled financial state
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "payable.paidAmount",
    existing.payable
      .paidAmount,
    proposed.payable
      .paidAmount,
    "Payment paidAmount can only be changed through collection operations."
  );

  rejectChange(
    "payable.balanceAmount",
    existing.payable
      .balanceAmount,
    proposed.payable
      .balanceAmount,
    "Payment balanceAmount can only be changed through Payment transaction workflows."
  );

  rejectChange(
    "payable.paymentPending",
    existing.payable
      .paymentPending,
    proposed.payable
      .paymentPending,
    "Payment paymentPending can only be changed through Payment transaction workflows."
  );

  /* ------------------------------------------------------------------------
   * Refund-controlled financial state
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "refundSummary.totalRefundedAmount",
    existing.refundSummary
      ?.totalRefundedAmount ??
      0,
    proposed.refundSummary
      ?.totalRefundedAmount ??
      0,
    "Payment totalRefundedAmount can only be changed through refund operations."
  );

  rejectChange(
    "refundSummary.refundPendingAmount",
    existing.refundSummary
      ?.refundPendingAmount ??
      0,
    proposed.refundSummary
      ?.refundPendingAmount ??
      0,
    "Payment refundPendingAmount can only be changed through refund operations."
  );

  rejectChange(
    "refundSummary.currency",
    existing.refundSummary
      ?.currency,
    proposed.refundSummary
      ?.currency,
    "Payment refund currency cannot be changed after Payment creation."
  );

  /* ------------------------------------------------------------------------
   * Transaction history must use transaction workflows
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "latestSuccessfulTransactionId",
    existing.latestSuccessfulTransactionId,
    proposed.latestSuccessfulTransactionId,
    "latestSuccessfulTransactionId can only be changed through collection operations."
  );

  rejectChange(
    "transactions",
    JSON.stringify(
      existing.transactions
    ),
    JSON.stringify(
      proposed.transactions
    ),
    "Payment transactions cannot be changed through aggregate update."
  );

  /* ------------------------------------------------------------------------
   * Immutable audit origin
   *
   * audit.updatedAt and audit.updatedBy remain editable.
   * ------------------------------------------------------------------------
   */

  rejectChange(
    "audit.createdAt",
    existing.audit
      .createdAt,
    proposed.audit
      .createdAt,
    "Payment audit.createdAt cannot be changed."
  );

  rejectChange(
    "audit.createdBy",
    existing.audit
      .createdBy,
    proposed.audit
      .createdBy,
    "Payment audit.createdBy cannot be changed."
  );

  rejectChange(
    "audit.source",
    existing.audit
      .source,
    proposed.audit
      .source,
    "Payment audit.source cannot be changed."
  );
}

/* ============================================================================
 * Payment uniqueness validation
 * ============================================================================
 */

export async function validatePaymentUniqueness(
  repository:
    CompleteExtendedPaymentRepository,
  payment:
    Payment
): Promise<void> {
  const persistence =
    mapPaymentToPersistence(
      payment
    );

  const [
    paymentNumberExists,
    referenceIdExists,
  ] =
    await Promise.all([
      repository
        .paymentNumberExists(
          persistence
            .paymentNumber
        ),

      repository
        .referenceIdExists(
          persistence
            .referenceId
        ),
    ]);

  if (
    paymentNumberExists
  ) {
    throw new PaymentServiceError(
      "PAYMENT_NUMBER_EXISTS",
      "A Payment with this paymentNumber already exists.",
      {
        field:
          "paymentNumber",

        value:
          persistence
            .paymentNumber,
      }
    );
  }

  if (
    referenceIdExists
  ) {
    throw new PaymentServiceError(
      "PAYMENT_REFERENCE_EXISTS",
      "A Payment with this referenceId already exists.",
      {
        field:
          "referenceId",

        value:
          persistence
            .referenceId,
      }
    );
  }
}

/* ============================================================================
 * Canonical Payment status transition rules
 * ============================================================================
 */

export function canTransitionPaymentStatus(
  current:
    PaymentStatus,
  next:
    PaymentStatus
): boolean {
  if (
    current ===
      next
  ) {
    return true;
  }

  switch (
    current
  ) {
    case PaymentStatus.PENDING:
      return [
        PaymentStatus.PARTIALLY_PAID,
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
      ].includes(
        next
      );

    case PaymentStatus.PARTIALLY_PAID:
      return [
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUND_PENDING,
      ].includes(
        next
      );

    case PaymentStatus.PAID:
      return [
        PaymentStatus.REFUND_PENDING,
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.REFUNDED,
      ].includes(
        next
      );

    case PaymentStatus.FAILED:
      return [
        PaymentStatus.PENDING,
        PaymentStatus.CANCELLED,
      ].includes(
        next
      );

    case PaymentStatus.REFUND_PENDING:
      return [
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.REFUNDED,
        PaymentStatus.PAID,
      ].includes(
        next
      );

    case PaymentStatus.PARTIALLY_REFUNDED:
      return [
        PaymentStatus.REFUND_PENDING,
        PaymentStatus.REFUNDED,
      ].includes(
        next
      );

    case PaymentStatus.CANCELLED:
    case PaymentStatus.REFUNDED:
      return false;

    default:
      return false;
  }
}

/* ============================================================================
 * Require Payment status transition
 * ============================================================================
 */

export function requirePaymentStatusTransition(
  current:
    PaymentStatus,
  next:
    PaymentStatus,
  paymentId?:
    string
): void {
  if (
    canTransitionPaymentStatus(
      current,
      next
    )
  ) {
    return;
  }

  throw new PaymentServiceError(
    "BUSINESS_RULE",
    `Payment status cannot change from ${current} to ${next}.`,
    {
      paymentId,

      field:
        "status",

      value:
        next,
    }
  );
}

/* ============================================================================
 * Payment cancellation guard
 * ============================================================================
 */

export function requirePaymentCanBeCancelled(
  payment:
    Payment
): void {
  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_CANCELLED",
      "Payment is already cancelled.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.status ===
      PaymentStatus.PAID
  ) {
    throw new PaymentServiceError(
      "PAYMENT_ALREADY_PAID",
      "A fully paid Payment cannot be cancelled.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.status ===
      PaymentStatus.REFUNDED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_REFUNDED",
      "A refunded Payment cannot be cancelled.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  requirePaymentStatusTransition(
    payment.status,
    PaymentStatus.CANCELLED,
    payment.paymentId
  );
}

/* ============================================================================
 * Core create operation
 * ============================================================================
 */

export async function createPaymentAggregate(
  repository:
    CompleteExtendedPaymentRepository,
  payment:
    Payment
): Promise<
  Payment
> {
  validatePaymentAggregateForPersistence(
    payment
  );

  await validatePaymentUniqueness(
    repository,
    payment
  );

  try {
    return await repository
      .create({
        payment,
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Transaction-safe Payment creation
 * ============================================================================
 */

export async function createPaymentAggregateInTransaction(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  payment:
    Payment
): Promise<
  Payment
> {
  validatePaymentAggregateForPersistence(
    payment
  );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          await validatePaymentUniqueness(
            completeRepository,
            payment
          );

          return completeRepository
            .create({
              payment,
            });
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Update Payment aggregate
 * ============================================================================
 */

export async function updatePaymentAggregate(
  repository:
    CompleteExtendedPaymentRepository,
  payment:
    Payment
): Promise<
  Payment
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      payment.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const existingPayment =
    await requirePaymentById(
      repository,
      paymentId
    );

  /*
   * Shape validation must run before immutable-field comparison because the
   * comparison safely accesses nested payable, refundSummary and audit fields.
   */
  validatePaymentAggregateShape(
    payment
  );

  /*
   * Compare the request against persisted state before general business-state
   * validation so attempted mutations return the exact protected field.
   */
  validatePaymentUpdateImmutability(
    existingPayment,
    payment
  );

  /*
   * Validate the complete proposed update after immutable fields have been
   * confirmed unchanged.
   */
  validatePaymentAggregateForUpdate(
    payment
  );

  try {
    return await repository
      .update({
        paymentId,

        payment,
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}
/* ============================================================================
 * Change Payment status
 * ============================================================================
 */

export async function changePaymentStatus(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    ChangePaymentStatusServiceInput
): Promise<
  Payment
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

  const payment =
    await requirePaymentById(
      repository,
      paymentId
    );

  /*
   * Verify that the workflow transition is permitted.
   */
  requirePaymentStatusTransition(
    payment.status,
    input.status,
    paymentId
  );

  const updatedAt =
    new Date()
      .toISOString();

  /*
   * Validate the complete proposed state before persistence.
   */
  const proposedPayment:
    Payment = {
      ...payment,

      status:
        input.status,

      audit: {
        ...payment.audit,

        updatedAt,

        updatedBy,
      },
    };

  validatePaymentAggregateForUpdate(
    proposedPayment
  );

  try {
    return await repository
      .updateStatus({
        paymentId,

        status:
          input.status,

        updatedAt,

        updatedBy,
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Cancel Payment
 * ============================================================================
 */

export async function cancelPaymentAggregate(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    CancelPaymentServiceInput
): Promise<
  Payment
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const payment =
    await requirePaymentById(
      repository,
      paymentId
    );

  requirePaymentCanBeCancelled(
    payment
  );

  try {
    return await repository
      .updateStatus({
        paymentId,

        status:
          PaymentStatus.CANCELLED,

        updatedAt:
          new Date()
            .toISOString(),

        ...(input.cancelledBy
          ? {
              updatedBy:
                input.cancelledBy,
            }
          : {}),
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Complete mutation-capable Payment Service
 * ============================================================================
 */

export class CompletePaymentService
  extends PaymentService {
  /* ------------------------------------------------------------------------
   * Create
   * ------------------------------------------------------------------------
   */

  async createPayment(
  payment:
    Payment
): Promise<
  CreatePaymentServiceResult
> {
  try {
    validatePaymentAggregateForPersistence(
      payment
    );

validatePaymentAggregateForPersistence(
  payment
);

await validatePaymentCreationAuthority(
  this.creationAuthorityProvider,
  payment
);

const existingPayment =
  await this.repository.findByBookingId(
    payment.bookingId
  );

    if (
      existingPayment !==
      null
    ) {
      throw new PaymentServiceError(
        "PAYMENT_ALREADY_EXISTS",
        "A Payment already exists for this Booking.",
        {
          field:
            "bookingId",

          value:
            payment.bookingId,

          bookingId:
            payment.bookingId,

          paymentId:
  existingPayment.paymentId,
        }
      );
    }

    return await createPaymentAggregateInTransaction(
      this.transactionManager,
      payment
    );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

  /* ------------------------------------------------------------------------
   * Update
   * ------------------------------------------------------------------------
   */

  async updatePayment(
    payment:
      Payment
  ): Promise<
    UpdatePaymentServiceResult
  > {
    try {
      return await updatePaymentAggregate(
        this.repository,
        payment
      );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ------------------------------------------------------------------------
   * Status
   * ------------------------------------------------------------------------
   */

  async changeStatus(
    input:
      ChangePaymentStatusServiceInput
  ): Promise<
    ChangePaymentStatusServiceResult
  > {
    try {
      return await changePaymentStatus(
        this.repository,
        input
      );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }

  /* ------------------------------------------------------------------------
   * Cancel
   * ------------------------------------------------------------------------
   */

  async cancelPayment(
    input:
      CancelPaymentServiceInput
  ): Promise<
    CancelPaymentServiceResult
  > {
    try {
      return await cancelPaymentAggregate(
        this.repository,
        input
      );
    } catch (
      error
    ) {
      throw normalizePaymentServiceError(
        error
      );
    }
  }
}

/* ============================================================================
 * Complete Payment Service factory
 * ============================================================================
 */

export function createCompletePaymentService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): CompletePaymentService {
  return new CompletePaymentService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Payment mutation facade
 * ============================================================================
 */

export const PaymentServiceMutations = {
  identity: {
    generate:
      generatePaymentIdentity,

    paymentNumber:
      generatePaymentNumber,

    referenceId:
      generatePaymentReferenceId,

    transactionReference:
      generatePaymentTransactionReference,
  },

  validation: {
    aggregate:
      validatePaymentAggregateForPersistence,

    identity:
      validatePaymentAggregateIdentity,

    financial:
      validatePaymentFinancialState,

    uniqueness:
      validatePaymentUniqueness,

    statusTransition:
      requirePaymentStatusTransition,

    cancellable:
      requirePaymentCanBeCancelled,
  },

  lifecycle: {
    canTransition:
      canTransitionPaymentStatus,

    changeStatus:
      changePaymentStatus,

    cancel:
      cancelPaymentAggregate,
  },

  persistence: {
    create:
      createPaymentAggregate,

    createInTransaction:
      createPaymentAggregateInTransaction,

    update:
      updatePaymentAggregate,
  },

  createService:
    createCompletePaymentService,
} as const;

/* ============================================================================
 * End of Payment Service - Part B
 * ============================================================================
 */

/* ============================================================================
 * EasyMovers
 * Payment Service
 * Part C
 * ============================================================================
 *
 * Collection / money-movement lifecycle:
 *
 * - Collection transaction construction
 * - Successful collection
 * - Failed collection attempt
 * - Partial/full Payment calculation
 * - Payment financial-summary synchronization
 * - Atomic Payment + PaymentTransaction persistence
 *
 * Refunds are intentionally deferred to Part D.
 * ============================================================================
 */

/* ============================================================================
 * Successful collection input
 * ============================================================================
 */

export interface RecordPaymentCollectionServiceInput {
  paymentId:
    PaymentId;

  amount:
    number;

  transactionId?:
    string;

  currency?:
    string;

  purpose?:
    PaymentTransaction[
      "purpose"
    ];

  method?:
    PaymentTransaction[
      "method"
    ];

  provider?:
    PaymentTransaction[
      "provider"
    ];

  gateway?:
    PaymentTransaction[
      "gateway"
    ];

  remarks?:
    string;

  recordedBy?:
    PaymentTransaction[
      "recordedBy"
    ];

  completedAt?:
    string;

  updatedBy?:
    string;
}

/* ============================================================================
 * Failed collection input
 * ============================================================================
 */

export interface RecordFailedPaymentCollectionServiceInput {
  paymentId:
    PaymentId;

  amount:
    number;

  transactionId?:
    string;

  currency?:
    string;

  purpose?:
    PaymentTransaction[
      "purpose"
    ];

  method?:
    PaymentTransaction[
      "method"
    ];

  provider?:
    PaymentTransaction[
      "provider"
    ];

  gateway?:
    PaymentTransaction[
      "gateway"
    ];

  reason?:
    string;

  message?:
    string;

  providerErrorCode?:
    string;

  remarks?:
    string;

  recordedBy?:
    PaymentTransaction[
      "recordedBy"
    ];

  failedAt?:
    string;

  updatedBy?:
    string;
}

/* ============================================================================
 * Collection result
 * ============================================================================
 */

export interface PaymentCollectionServiceResult {
  payment:
    Payment;

  transaction:
    PaymentTransaction;
}

/* ============================================================================
 * Collection amount validation
 * ============================================================================
 */

export function requireValidPaymentCollectionAmount(
  payment:
    Payment,
  amount:
    number
): void {
  if (
    !Number.isFinite(
      amount
    ) ||
    amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Collection amount must be greater than zero.",
      {
        field:
          "amount",

        value:
          amount,

        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    amount >
      payment.payable
        .balanceAmount
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_EXCEEDED",
      "Collection amount cannot exceed the outstanding Payment balance.",
      {
        field:
          "amount",

        value:
          amount,

        paymentId:
          payment.paymentId,
      }
    );
  }
}

/* ============================================================================
 * Collection currency validation
 * ============================================================================
 */

export function requirePaymentCollectionCurrency(
  payment:
    Payment,
  currency?:
    string
): PaymentCurrency {
  const expectedCurrency =
    payment.payable
      .currency;

  const suppliedCurrency =
    normalizePaymentServiceString(
      currency
    );

  if (
    !suppliedCurrency
  ) {
    return expectedCurrency;
  }

  const normalizedCurrency =
    suppliedCurrency
      .toUpperCase();

  if (
    normalizedCurrency !==
      expectedCurrency
  ) {
    throw new PaymentServiceError(
      "BUSINESS_RULE",
      `Payment currency must be ${expectedCurrency}.`,
      {
        field:
          "currency",

        value:
          normalizedCurrency,

        paymentId:
          payment.paymentId,
      }
    );
  }

  /**
   * The equality check above proves this value is the same
   * supported currency as the Payment aggregate.
   */
  return expectedCurrency;
}

/* ============================================================================
 * Collection eligibility
 * ============================================================================
 */

export function requirePaymentCanAcceptCollection(
  payment:
    Payment
): void {
  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_CANCELLED",
      "A cancelled Payment cannot accept a collection.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.status ===
      PaymentStatus.REFUNDED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_REFUNDED",
      "A refunded Payment cannot accept a collection.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    isPaymentFullyPaid(
      payment
    )
  ) {
    throw new PaymentServiceError(
      "PAYMENT_ALREADY_PAID",
      "Payment is already fully paid.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }
}

export function requireValidPaymentEventTimestamp(
  payment:
    Payment,
  value:
    string,
  field:
    string,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION,
  now:
    Date = new Date()
): string {
  const normalizedValue =
    normalizePaymentServiceString(
      value
    );

  if (
    !normalizedValue
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      `${field} must contain a valid timestamp.`,
      {
        field,

        value,

        paymentId:
          payment.paymentId,
      }
    );
  }

  const eventTimestamp =
    Date.parse(
      normalizedValue
    );

  if (
    !Number.isFinite(
      eventTimestamp
    )
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      `${field} must contain a valid ISO-8601 timestamp.`,
      {
        field,

        value,

        paymentId:
          payment.paymentId,
      }
    );
  }

  const paymentCreatedTimestamp =
    Date.parse(
      payment.audit
        .createdAt
    );

  if (
    Number.isFinite(
      paymentCreatedTimestamp
    ) &&
    eventTimestamp <
      paymentCreatedTimestamp
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      `${field} cannot occur before Payment creation.`,
      {
        field,

        value:
          normalizedValue,

        paymentId:
          payment.paymentId,
      }
    );
  }

  const maximumFutureTimestamp =
    now.getTime() +
    configuration
      .maxFutureEventSkewMs;

  if (
    eventTimestamp >
      maximumFutureTimestamp
  ) {
    throw new PaymentServiceError(
      "VALIDATION_FAILED",
      `${field} cannot be unreasonably far in the future.`,
      {
        field,

        value:
          normalizedValue,

        paymentId:
          payment.paymentId,
      }
    );
  }

  return new Date(
    eventTimestamp
  ).toISOString();
}

/* ============================================================================
 * Transaction identity
 * ============================================================================
 */

export function resolvePaymentTransactionId(
  transactionId:
    string | undefined,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): string {
  const supplied =
    normalizePaymentServiceString(
      transactionId
    );

  return supplied ??
    generatePaymentTransactionReference(
      configuration
    );
}

/* ============================================================================
 * Successful collection transaction builder
 * ============================================================================
 */

export function buildSuccessfulCollectionTransaction(
  payment:
    Payment,
  input:
    RecordPaymentCollectionServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): PaymentTransaction {
  const currency =
    requirePaymentCollectionCurrency(
      payment,
      input.currency
    );

  requireValidPaymentCollectionAmount(
    payment,
    input.amount
  );

    const completedAt =
    requireValidPaymentEventTimestamp(
      payment,
      input.completedAt ??
        new Date()
          .toISOString(),
      "completedAt",
      configuration
    );

  const transactionId =
    resolvePaymentTransactionId(
      input.transactionId,
      configuration
    );

  return {
    transactionId,

    paymentId:
      payment.paymentId,

    transactionType:
      PaymentTransactionType
        .COLLECTION,

    purpose:
      input.purpose,

    amount: {
      amount:
        input.amount,

      currency,
    },

    status:
      PaymentTransactionStatus
        .SUCCESS,

    method:
      input.method,

    provider:
  input.provider ??
  PaymentProvider.OTHER,

    gateway:
      input.gateway,

    initiatedAt:
      completedAt,

    completedAt,

    remarks:
      input.remarks,

    recordedBy:
      input.recordedBy,
  };
}

/* ============================================================================
 * Failed collection transaction builder
 * ============================================================================
 */

export function buildFailedCollectionTransaction(
  payment:
    Payment,
  input:
    RecordFailedPaymentCollectionServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): PaymentTransaction {
  const currency =
    requirePaymentCollectionCurrency(
      payment,
      input.currency
    );

  if (
    !Number.isFinite(
      input.amount
    ) ||
    input.amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Failed collection attempt amount must be greater than zero.",
      {
        field:
          "amount",

        value:
          input.amount,

        paymentId:
          payment.paymentId,
      }
    );
  }

    const failedAt =
    requireValidPaymentEventTimestamp(
      payment,
      input.failedAt ??
        new Date()
          .toISOString(),
      "failedAt",
      configuration
    );


  const transactionId =
    resolvePaymentTransactionId(
      input.transactionId,
      configuration
    );

  return {
    transactionId,

    paymentId:
      payment.paymentId,

    transactionType:
      PaymentTransactionType
        .COLLECTION,

    purpose:
      input.purpose,

    amount: {
      amount:
        input.amount,

      currency,
    },

    status:
      PaymentTransactionStatus
        .FAILED,

    method:
      input.method,

    provider:
  input.provider ??
  PaymentProvider.OTHER,

    gateway:
      input.gateway,

    failure: {
      reason:
        input.reason,

      message:
        input.message,

      providerCode:
        input.providerErrorCode,

      failedAt,
    },

    initiatedAt:
      failedAt,

    failedAt,

    remarks:
      input.remarks,

    recordedBy:
      input.recordedBy,
  };
}

/* ============================================================================
 * Successful collection financial projection
 * ============================================================================
 */

export interface PaymentCollectionFinancialProjection {
  totalAmount:
    number;

  paidAmount:
    number;

  balanceAmount:
    number;

  paymentPending:
    number;

  status:
    PaymentStatus;
}

export function calculatePaymentAfterSuccessfulCollection(
  payment:
    Payment,
  amount:
    number
): PaymentCollectionFinancialProjection {
  requireValidPaymentCollectionAmount(
    payment,
    amount
  );

  const totalAmount =
    payment.payable
      .totalAmount;

  const paidAmount =
    payment.payable
      .paidAmount +
    amount;

  const balanceAmount =
    Math.max(
      0,
      totalAmount -
        paidAmount
    );

  const paymentPending =
    balanceAmount;

  const status =
    balanceAmount <=
      0
      ? PaymentStatus.PAID
      : PaymentStatus
          .PARTIALLY_PAID;

  return {
    totalAmount,

    paidAmount,

    balanceAmount,

    paymentPending,

    status,
  };
}

/* ============================================================================
 * Successful collection persistence
 * ============================================================================
 */

export async function recordSuccessfulPaymentCollection(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  input:
    RecordPaymentCollectionServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): Promise<
  PaymentCollectionServiceResult
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          const payment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );

          requirePaymentCanAcceptCollection(
            payment
          );
await requirePaymentTransactionIdAvailable(
  completeRepository,
  input.transactionId
);
          const transaction =
            buildSuccessfulCollectionTransaction(
              payment,
              input,
              configuration
            );

          const duplicateGatewayPayment =
            transaction.gateway
              ?.gatewayPaymentId
              ? await completeRepository
                  .gatewayPaymentIdExists(
                    transaction
                      .gateway
                      .gatewayPaymentId
                  )
              : false;

          if (
            duplicateGatewayPayment
          ) {
            throw new PaymentServiceError(
              "GATEWAY_PAYMENT_ALREADY_EXISTS",
              "This gateway Payment has already been recorded.",
              {
                paymentId,

                gatewayPaymentId:
                  transaction
                    .gateway
                    ?.gatewayPaymentId,
              }
            );
          }

          const projection =
            calculatePaymentAfterSuccessfulCollection(
              payment,
              input.amount
            );

          const createdTransaction =
            await completeRepository
              .createTransaction({
                transaction,
              });

                   await completeRepository
            .updateFinancialSummary({
              paymentId,

              totalAmount:
                projection
                  .totalAmount,

              paidAmount:
                projection
                  .paidAmount,

              balanceAmount:
                projection
                  .balanceAmount,

              paymentPending:
                projection
                  .paymentPending,

              latestSuccessfulTransactionId:
                createdTransaction
                  .transactionId,

              updatedAt:
                new Date()
                  .toISOString(),

              updatedBy,
            });

                    const updatedPayment =
            await completeRepository
              .updateStatus({
                paymentId,

                status:
                  projection
                    .status,

                updatedAt:
                  new Date()
                    .toISOString(),

                updatedBy,
              });

          /**
           * Persist the latest authoritative Payment projection within the
           * same database transaction as the collection.
           *
           * If this write fails, the transaction, financial summary and status
           * changes are rolled back together.
           */
          await persistPendingPaymentBookingSync(
            completeRepository,
            updatedPayment,
            updatedBy
          );

          return {
            payment:
              updatedPayment,

            transaction:
              createdTransaction,
          };
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Failed collection persistence
 * ============================================================================
 */

export async function recordFailedPaymentCollection(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  input:
    RecordFailedPaymentCollectionServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): Promise<
  PaymentCollectionServiceResult
> {
    const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          const payment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );

          requirePaymentCanAcceptCollection(
            payment
          );
await requirePaymentTransactionIdAvailable(
  completeRepository,
  input.transactionId
);
          const transaction =
            buildFailedCollectionTransaction(
              payment,
              input,
              configuration
            );

                    const createdTransaction =
            await completeRepository
              .createTransaction({
                transaction,
              });

          /**
           * A failed attempt must not erase money already collected.
           *
           * If nothing has yet been collected, the aggregate becomes FAILED.
           * If a previous partial collection exists, it remains
           * PARTIALLY_PAID.
           */
          const resultingStatus =
            payment.payable
              .paidAmount >
              0
              ? PaymentStatus
                  .PARTIALLY_PAID
              : PaymentStatus
                  .FAILED;

          /**
           * Persist even an unchanged status so audit attribution advances.
           */
                    await completeRepository
            .updateStatus({
              paymentId,

              status:
                resultingStatus,

              updatedAt:
                new Date()
                  .toISOString(),

              updatedBy,
            });

          /**
           * Reload so both the response and synchronization projection contain
           * the newly created failed transaction and latest audit state.
           */
          const refreshedPayment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );

          /**
           * Persist synchronization intent within the same transaction.
           */
          await persistPendingPaymentBookingSync(
            completeRepository,
            refreshedPayment,
            updatedBy
          );

          return {
            payment:
              refreshedPayment,

            transaction:
              createdTransaction,
          };
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Payment collection methods
 * ============================================================================
 */

export class PaymentCollectionService
  extends CompletePaymentService {
  async recordCollection(
    input:
      RecordPaymentCollectionServiceInput
  ): Promise<
    PaymentCollectionServiceResult
  > {
    return recordSuccessfulPaymentCollection(
      this.transactionManager,
      input,
      this.configuration
    );
  }

  async recordFailedCollection(
    input:
      RecordFailedPaymentCollectionServiceInput
  ): Promise<
    PaymentCollectionServiceResult
  > {
    return recordFailedPaymentCollection(
      this.transactionManager,
      input,
      this.configuration
    );
  }
}

/* ============================================================================
 * Collection-capable service factory
 * ============================================================================
 */

export function createPaymentCollectionService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): PaymentCollectionService {
  return new PaymentCollectionService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Collection facade
 * ============================================================================
 */

export const PaymentServiceCollections = {
  validation: {
    amount:
      requireValidPaymentCollectionAmount,

    currency:
      requirePaymentCollectionCurrency,

    eligible:
      requirePaymentCanAcceptCollection,
  },

  transaction: {
    buildSuccess:
      buildSuccessfulCollectionTransaction,

    buildFailure:
      buildFailedCollectionTransaction,

    resolveId:
      resolvePaymentTransactionId,
  },

  financials: {
    calculateAfterSuccess:
      calculatePaymentAfterSuccessfulCollection,
  },

  persistence: {
    success:
      recordSuccessfulPaymentCollection,

    failed:
      recordFailedPaymentCollection,
  },

  createService:
    createPaymentCollectionService,
} as const;

/* ============================================================================
 * End of Payment Service - Part C
 * ============================================================================
 */

/* ============================================================================
 * EasyMovers
 * Payment Service
 * Part D
 * ============================================================================
 *
 * Refund lifecycle:
 *
 * - Refund eligibility
 * - Refund amount validation
 * - Refund-pending transaction
 * - Successful refund transaction
 * - Failed refund transaction
 * - Partial/full refund calculation
 * - refundPendingAmount synchronization
 * - PARTIALLY_REFUNDED / REFUNDED lifecycle
 * - Atomic Payment + PaymentTransaction persistence
 * ============================================================================
 */

/* ============================================================================
 * Refund request input
 * ============================================================================
 */

export interface RequestPaymentRefundServiceInput {
  paymentId:
    PaymentId;

  amount:
    number;

  transactionId?:
    string;

  provider?:
    PaymentTransaction[
      "provider"
    ];

  gateway?:
    PaymentTransaction[
      "gateway"
    ];

  reason?:
    string;

  remarks?:
    string;

  recordedBy?:
    PaymentTransaction[
      "recordedBy"
    ];

  requestedAt?:
    string;

  updatedBy?:
    string;
}

/* ============================================================================
 * Successful refund input
 * ============================================================================
 */

export interface CompletePaymentRefundServiceInput {
  paymentId:
    PaymentId;

  amount:
    number;

  transactionId?:
    string;

  provider?:
    PaymentTransaction[
      "provider"
    ];

  gateway?:
    PaymentTransaction[
      "gateway"
    ];

  remarks?:
    string;

  recordedBy?:
    PaymentTransaction[
      "recordedBy"
    ];

  refundedAt?:
    string;

  updatedBy?:
    string;
}

/* ============================================================================
 * Failed refund input
 * ============================================================================
 */

export interface FailPaymentRefundServiceInput {
  paymentId:
    PaymentId;

  amount:
    number;

  transactionId?:
    string;

  provider?:
    PaymentTransaction[
      "provider"
    ];

  gateway?:
    PaymentTransaction[
      "gateway"
    ];

  reason?:
    string;

  message?:
    string;

  providerErrorCode?:
    string;

  remarks?:
    string;

  recordedBy?:
    PaymentTransaction[
      "recordedBy"
    ];

  failedAt?:
    string;

  updatedBy?:
    string;
}

/* ============================================================================
 * Refund result
 * ============================================================================
 */

export interface PaymentRefundServiceResult {
  payment:
    Payment;

  transaction:
    PaymentTransaction;
}

/* ============================================================================
 * Current refunded amount
 * ============================================================================
 */

export function getPaymentRefundedAmount(
  payment:
    Payment
): number {
  return (
    payment.refundSummary
      ?.totalRefundedAmount ??
    0
  );
}

/* ============================================================================
 * Current refund-pending amount
 * ============================================================================
 */

export function getPaymentRefundPendingAmount(
  payment:
    Payment
): number {
  return (
    payment.refundSummary
      ?.refundPendingAmount ??
    0
  );
}

/* ============================================================================
 * Refundable amount
 * ============================================================================
 */

export function getPaymentRefundableAmount(
  payment:
    Payment
): number {
  const paidAmount =
    payment.payable
      .paidAmount;

  const refundedAmount =
    getPaymentRefundedAmount(
      payment
    );

  const pendingAmount =
    getPaymentRefundPendingAmount(
      payment
    );

  return Math.max(
    0,
    paidAmount -
      refundedAmount -
      pendingAmount
  );
}

/* ============================================================================
 * Refund eligibility
 * ============================================================================
 */

export function requirePaymentCanBeRefunded(
  payment:
    Payment
): void {
  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_CANCELLED",
      "A cancelled Payment cannot be refunded.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.payable
      .paidAmount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_NOT_REFUNDABLE",
      "Payment has no successfully collected amount available for refund.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.status ===
      PaymentStatus.REFUNDED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_REFUNDED",
      "Payment has already been fully refunded.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    getPaymentRefundableAmount(
      payment
    ) <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_NOT_REFUNDABLE",
      "Payment has no remaining refundable amount.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }
}

/* ============================================================================
 * Refund amount validation
 * ============================================================================
 */

export function requireValidPaymentRefundAmount(
  payment:
    Payment,
  amount:
    number
): void {
  if (
    !Number.isFinite(
      amount
    ) ||
    amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Refund amount must be greater than zero.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          amount,
      }
    );
  }

  const refundableAmount =
    getPaymentRefundableAmount(
      payment
    );

  if (
    amount >
      refundableAmount
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_EXCEEDED",
      "Refund amount cannot exceed the remaining refundable amount.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          amount,
      }
    );
  }
}

/* ============================================================================
 * Refund-pending transaction builder
 * ============================================================================
 */

export function buildPendingRefundTransaction(
  payment:
    Payment,
  input:
    RequestPaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): PaymentTransaction {
  requirePaymentCanBeRefunded(
    payment
  );

  requireValidPaymentRefundAmount(
    payment,
    input.amount
  );

  const requestedAt =
    input.requestedAt ??
    new Date()
      .toISOString();

  return {
    transactionId:
      resolvePaymentTransactionId(
        input.transactionId,
        configuration
      ),

    paymentId:
      payment.paymentId,

    transactionType:
      PaymentTransactionType
        .REFUND,

    amount: {
      amount:
        input.amount,

      currency:
        payment.payable
          .currency,
    },

    status:
      PaymentTransactionStatus
        .PENDING,

    provider:
      input.provider ??
      PaymentProvider.OTHER,

    gateway:
      input.gateway,

    initiatedAt:
      requestedAt,

    remarks:
      input.remarks ??
      input.reason,

    recordedBy:
      input.recordedBy,
  };
}

/* ============================================================================
 * Successful refund transaction builder
 * ============================================================================
 */

export function buildSuccessfulRefundTransaction(
  payment:
    Payment,
  input:
    CompletePaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): PaymentTransaction {
  if (
    !Number.isFinite(
      input.amount
    ) ||
    input.amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Refund amount must be greater than zero.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          input.amount,
      }
    );
  }

    const refundedAt =
    requireValidPaymentEventTimestamp(
      payment,
      input.refundedAt ??
        new Date()
          .toISOString(),
      "refundedAt",
      configuration
    );

  return {
    transactionId:
      resolvePaymentTransactionId(
        input.transactionId,
        configuration
      ),

    paymentId:
      payment.paymentId,

    transactionType:
      PaymentTransactionType
        .REFUND,

    amount: {
      amount:
        input.amount,

      currency:
        payment.payable
          .currency,
    },

    status:
      PaymentTransactionStatus
        .REFUNDED,

    provider:
      input.provider ??
      PaymentProvider.OTHER,

    gateway:
      input.gateway,

    initiatedAt:
      refundedAt,

    completedAt:
      refundedAt,

    remarks:
      input.remarks,

    recordedBy:
      input.recordedBy,
  };
}

/* ============================================================================
 * Failed refund transaction builder
 * ============================================================================
 */

export function buildFailedRefundTransaction(
  payment:
    Payment,
  input:
    FailPaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): PaymentTransaction {
  if (
    !Number.isFinite(
      input.amount
    ) ||
    input.amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Refund amount must be greater than zero.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          input.amount,
      }
    );
  }

    const failedAt =
    requireValidPaymentEventTimestamp(
      payment,
      input.failedAt ??
        new Date()
          .toISOString(),
      "failedAt",
      configuration
    );


  return {
    transactionId:
      resolvePaymentTransactionId(
        input.transactionId,
        configuration
      ),

    paymentId:
      payment.paymentId,

    transactionType:
      PaymentTransactionType
        .REFUND,

    amount: {
      amount:
        input.amount,

      currency:
        payment.payable
          .currency,
    },

    status:
      PaymentTransactionStatus
        .FAILED,

    provider:
      input.provider ??
      PaymentProvider.OTHER,

    gateway:
      input.gateway,

    failure: {
      reason:
        input.reason,

      message:
        input.message,

      providerCode:
        input.providerErrorCode,

      failedAt,
    },

    initiatedAt:
      failedAt,

    failedAt,

    remarks:
      input.remarks,

    recordedBy:
      input.recordedBy,
  };
}

/* ============================================================================
 * Refund financial projection
 * ============================================================================
 */

export interface PaymentRefundFinancialProjection {
  refundedAmount:
    number;

  refundPendingAmount:
    number;

  status:
    PaymentStatus;
}

/* ============================================================================
 * After refund request
 * ============================================================================
 */

export function calculatePaymentAfterRefundRequest(
  payment:
    Payment,
  amount:
    number
): PaymentRefundFinancialProjection {
  requirePaymentCanBeRefunded(
    payment
  );

  requireValidPaymentRefundAmount(
    payment,
    amount
  );

  const refundedAmount =
    getPaymentRefundedAmount(
      payment
    );

  const refundPendingAmount =
    getPaymentRefundPendingAmount(
      payment
    ) +
    amount;

  return {
    refundedAmount,

    refundPendingAmount,

    status:
      PaymentStatus
        .REFUND_PENDING,
  };
}

/* ============================================================================
 * After successful refund
 * ============================================================================
 */

export function calculatePaymentAfterSuccessfulRefund(
  payment:
    Payment,
  amount:
    number
): PaymentRefundFinancialProjection {
  if (
    !Number.isFinite(
      amount
    ) ||
    amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Refund amount must be greater than zero.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          amount,
      }
    );
  }

  const currentRefundedAmount =
    getPaymentRefundedAmount(
      payment
    );

  const currentPendingAmount =
    getPaymentRefundPendingAmount(
      payment
    );

  const refundedAmount =
    currentRefundedAmount +
    amount;

  const refundPendingAmount =
    Math.max(
      0,
      currentPendingAmount -
        amount
    );

  const fullyRefunded =
    refundedAmount >=
      payment.payable
        .paidAmount;

  const status =
    fullyRefunded
      ? PaymentStatus
          .REFUNDED
      : refundPendingAmount >
          0
        ? PaymentStatus
            .REFUND_PENDING
        : PaymentStatus
            .PARTIALLY_REFUNDED;

  return {
    refundedAmount,

    refundPendingAmount,

    status,
  };
}

/* ============================================================================
 * After failed refund
 * ============================================================================
 */

export function calculatePaymentAfterFailedRefund(
  payment:
    Payment,
  amount:
    number
): PaymentRefundFinancialProjection {
  const refundedAmount =
    getPaymentRefundedAmount(
      payment
    );

  const refundPendingAmount =
    Math.max(
      0,
      getPaymentRefundPendingAmount(
        payment
      ) -
        amount
    );

  let status:
    PaymentStatus;

  if (
    refundedAmount >=
      payment.payable
        .paidAmount &&
    payment.payable
      .paidAmount >
      0
  ) {
    status =
      PaymentStatus
        .REFUNDED;
  } else if (
    refundedAmount >
      0
  ) {
    status =
      PaymentStatus
        .PARTIALLY_REFUNDED;
  } else if (
    payment.payable
      .balanceAmount <=
      0
  ) {
    status =
      PaymentStatus
        .PAID;
  } else if (
    payment.payable
      .paidAmount >
      0
  ) {
    status =
      PaymentStatus
        .PARTIALLY_PAID;
  } else {
    status =
      PaymentStatus
        .PENDING;
  }

  return {
    refundedAmount,

    refundPendingAmount,

    status,
  };
}

/* ============================================================================
 * Request refund
 * ============================================================================
 */

export async function requestPaymentRefund(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  input:
    RequestPaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): Promise<
  PaymentRefundServiceResult
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          const payment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );
await requirePaymentTransactionIdAvailable(
  completeRepository,
  input.transactionId
);
          const transaction =
            buildPendingRefundTransaction(
              payment,
              input,
              configuration
            );

          const projection =
            calculatePaymentAfterRefundRequest(
              payment,
              input.amount
            );

          const createdTransaction =
            await completeRepository
              .createTransaction({
                transaction,
              });

                             await completeRepository
            .updateFinancialSummary({
              paymentId,

              refundedAmount:
                projection
                  .refundedAmount,

              refundPendingAmount:
                projection
                  .refundPendingAmount,

              updatedAt:
                new Date()
                  .toISOString(),

              updatedBy,
            });
                   const updatedPayment =
            await completeRepository
              .updateStatus({
                paymentId,

                status:
                  projection
                    .status,

                updatedAt:
                  new Date()
                    .toISOString(),

                updatedBy,
              });

          /**
           * The refund transaction, refund financial projection, Payment status
           * and synchronization intent share the same database transaction.
           */
          await persistPendingPaymentBookingSync(
            completeRepository,
            updatedPayment,
            updatedBy
          );

          return {
            payment:
              updatedPayment,

            transaction:
              createdTransaction,
          };
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Complete refund
 * ============================================================================
 */

export async function completePaymentRefund(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  input:
    CompletePaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): Promise<
  PaymentRefundServiceResult
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          const payment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );
  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

await requirePaymentTransactionIdAvailable(
  completeRepository,
  input.transactionId
);
          if (
            payment.status !==
              PaymentStatus
                .REFUND_PENDING &&
            getPaymentRefundPendingAmount(
              payment
            ) <=
              0
          ) {
            throw new PaymentServiceError(
              "BUSINESS_RULE",
              "Payment does not have a pending refund to complete.",
              {
                paymentId,
              }
            );
          }

          if (
            input.amount >
              getPaymentRefundPendingAmount(
                payment
              )
          ) {
            throw new PaymentServiceError(
              "PAYMENT_AMOUNT_EXCEEDED",
              "Completed refund amount cannot exceed the pending refund amount.",
              {
                paymentId,

                field:
                  "amount",

                value:
                  input.amount,
              }
            );
          }

          const transaction =
            buildSuccessfulRefundTransaction(
              payment,
              input,
              configuration
            );

          const projection =
            calculatePaymentAfterSuccessfulRefund(
              payment,
              input.amount
            );

          const createdTransaction =
            await completeRepository
              .createTransaction({
                transaction,
              });

                   await completeRepository
            .updateFinancialSummary({
              paymentId,

              refundedAmount:
                projection
                  .refundedAmount,

              refundPendingAmount:
                projection
                  .refundPendingAmount,

              updatedAt:
                new Date()
                  .toISOString(),

              updatedBy,
            });

                             const updatedPayment =
            await completeRepository
              .updateStatus({
                paymentId,

                status:
                  projection
                    .status,

                updatedAt:
                  new Date()
                    .toISOString(),

                updatedBy,
              });

          /**
           * Persist the completed-refund synchronization intent inside the
           * same database transaction as the Payment financial mutation.
           */
          await persistPendingPaymentBookingSync(
            completeRepository,
            updatedPayment,
            updatedBy
          );

          return {
            payment:
              updatedPayment,

            transaction:
              createdTransaction,
          };
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Fail refund
 * ============================================================================
 */

export async function failPaymentRefund(
  transactionManager:
    ExtendedPaymentRepositoryTransactionManager,
  input:
    FailPaymentRefundServiceInput,
  configuration:
    PaymentServiceConfiguration =
      DEFAULT_PAYMENT_SERVICE_CONFIGURATION
): Promise<
  PaymentRefundServiceResult
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );
  const updatedBy =
    requirePaymentServiceIdentifier(
      input.updatedBy ??
        "",
      "updatedBy",
      "INVALID_SERVICE_INPUT"
    );

  try {
    return await transactionManager
      .runInTransaction(
        async (
          {
            repository,
          }
        ) => {
          const completeRepository =
            repository as
              CompleteExtendedPaymentRepository;

          const payment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );
await requirePaymentTransactionIdAvailable(
  completeRepository,
  input.transactionId
);
          const pendingAmount =
            getPaymentRefundPendingAmount(
              payment
            );

          if (
            pendingAmount <=
              0
          ) {
            throw new PaymentServiceError(
              "BUSINESS_RULE",
              "Payment does not have a pending refund to fail.",
              {
                paymentId,
              }
            );
          }

          if (
            input.amount >
              pendingAmount
          ) {
            throw new PaymentServiceError(
              "PAYMENT_AMOUNT_EXCEEDED",
              "Failed refund amount cannot exceed the pending refund amount.",
              {
                paymentId,

                field:
                  "amount",

                value:
                  input.amount,
              }
            );
          }

          const transaction =
            buildFailedRefundTransaction(
              payment,
              input,
              configuration
            );

          const projection =
            calculatePaymentAfterFailedRefund(
              payment,
              input.amount
            );

          const createdTransaction =
            await completeRepository
              .createTransaction({
                transaction,
              });

                    await completeRepository
            .updateFinancialSummary({
              paymentId,

              refundedAmount:
                projection
                  .refundedAmount,

              refundPendingAmount:
                projection
                  .refundPendingAmount,

              updatedAt:
                new Date()
                  .toISOString(),

              updatedBy,
            });

                            /**
           * Change status only when the failed refund projection requires it.
           *
           * updateFinancialSummary() already records updatedAt/updatedBy,
           * so a redundant same-status update is unnecessary.
           */
          if (
            payment.status !==
              projection.status
          ) {
            await completeRepository
              .updateStatus({
                paymentId,

                status:
                  projection.status,

                updatedAt:
                  new Date()
                    .toISOString(),

                updatedBy,
              });
          }

          /**
           * Reload after transaction, financial-summary and optional status
           * writes so the response contains the authoritative aggregate.
           */
                    const refreshedPayment =
            await requirePaymentById(
              completeRepository,
              paymentId
            );

          /**
           * Persist the failed-refund synchronization intent after reloading
           * the authoritative Payment state.
           */
          await persistPendingPaymentBookingSync(
            completeRepository,
            refreshedPayment,
            updatedBy
          );

          return {
            payment:
              refreshedPayment,

            transaction:
              createdTransaction,
          };
        }
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Refund-capable Payment Service
 * ============================================================================
 */

export class PaymentRefundService
  extends PaymentCollectionService {
  async requestRefund(
    input:
      RequestPaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  > {
    return requestPaymentRefund(
      this.transactionManager,
      input,
      this.configuration
    );
  }

  async completeRefund(
    input:
      CompletePaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  > {
    return completePaymentRefund(
      this.transactionManager,
      input,
      this.configuration
    );
  }

  async failRefund(
    input:
      FailPaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  > {
    return failPaymentRefund(
      this.transactionManager,
      input,
      this.configuration
    );
  }
}

/* ============================================================================
 * Refund-capable service factory
 * ============================================================================
 */

export function createPaymentRefundService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): PaymentRefundService {
  return new PaymentRefundService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Refund facade
 * ============================================================================
 */

export const PaymentServiceRefunds = {
  amounts: {
    refunded:
      getPaymentRefundedAmount,

    pending:
      getPaymentRefundPendingAmount,

    refundable:
      getPaymentRefundableAmount,
  },

  validation: {
    eligible:
      requirePaymentCanBeRefunded,

    amount:
      requireValidPaymentRefundAmount,
  },

  transaction: {
    pending:
      buildPendingRefundTransaction,

    success:
      buildSuccessfulRefundTransaction,

    failed:
      buildFailedRefundTransaction,
  },

  financials: {
    request:
      calculatePaymentAfterRefundRequest,

    success:
      calculatePaymentAfterSuccessfulRefund,

    failed:
      calculatePaymentAfterFailedRefund,
  },

  persistence: {
    request:
      requestPaymentRefund,

    complete:
      completePaymentRefund,

    fail:
      failPaymentRefund,
  },

  createService:
    createPaymentRefundService,
} as const;

/* ============================================================================
 * End of Payment Service - Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Service
 * Part E
 * ============================================================================
 *
 * Gateway / webhook lifecycle:
 *
 * - Gateway-order creation
 * - Gateway-order update
 * - Gateway-order lookup
 * - Provider-event idempotency
 * - Webhook receipt persistence
 * - Webhook processed state
 * - Webhook failure state
 *
 * IMPORTANT:
 * - Provider SDK/network calls do NOT belong here.
 * - This service works with normalized provider results.
 * - Razorpay/other gateway adapters can be plugged in later.
 * ============================================================================
 */

/* ============================================================================
 * Create gateway order input
 * ============================================================================
 */

export interface CreatePaymentGatewayOrderServiceInput {
  paymentId:
    PaymentId;

  provider:
    PaymentProvider;

  gatewayOrderId:
    string;

  amount:
    number;

  currency?:
    string;

  status?:
  PaymentGatewayOrderRepositoryRecord[
    "status"
  ];

  receiptReference?:
    string;

  metadata?:
    Record<
      string,
      unknown
    >;
}

/* ============================================================================
 * Update gateway order input
 * ============================================================================
 */

export interface UpdatePaymentGatewayOrderServiceInput {
  gatewayOrderId:
    string;

status?:
  PaymentGatewayOrderRepositoryRecord[
    "status"
  ];

  metadata?:
    Record<
      string,
      unknown
    >;

  updatedAt?:
    string;
}

/* ============================================================================
 * Webhook receipt input
 * ============================================================================
 */

export interface RecordPaymentWebhookServiceInput {
  webhookId:
    string;

  provider:
    PaymentProvider;

  eventType:
    PaymentWebhookRepositoryRecord[
      "eventType"
    ];

  providerEventId?:
    string;

  payloadHash?:
    string;

  gatewayOrderId?:
    string;

  gatewayPaymentId?:
    string;

  paymentId?:
    string;

  transactionId?:
    string;

  receivedAt?:
    string;
}

/* ============================================================================
 * Mark webhook processed input
 * ============================================================================
 */

export interface CompletePaymentWebhookServiceInput {
  webhookId:
    string;

  paymentId?:
    string;

  transactionId?:
    string;

  processedAt?:
    string;
}

/* ============================================================================
 * Mark webhook failed input
 * ============================================================================
 */

export interface FailPaymentWebhookServiceInput {
  webhookId:
    string;

  errorCode?:
    string;

  errorMessage?:
    string;

  processedAt?:
    string;
}

/* ============================================================================
 * Webhook receipt result
 * ============================================================================
 */

export interface PaymentWebhookReceiptServiceResult {
  webhook:
    PaymentWebhookRepositoryRecord;

  duplicate:
    boolean;
}

/* ============================================================================
 * Gateway order amount validation
 * ============================================================================
 */

export function requireValidGatewayOrderAmount(
  payment:
    Payment,
  amount:
    number
): void {
  if (
    !Number.isFinite(
      amount
    ) ||
    amount <=
      0
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_INVALID",
      "Gateway order amount must be greater than zero.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          amount,
      }
    );
  }

  if (
    amount >
      payment.payable
        .balanceAmount
  ) {
    throw new PaymentServiceError(
      "PAYMENT_AMOUNT_EXCEEDED",
      "Gateway order amount cannot exceed the outstanding Payment balance.",
      {
        paymentId:
          payment.paymentId,

        field:
          "amount",

        value:
          amount,
      }
    );
  }
}

/* ============================================================================
 * Gateway order eligibility
 * ============================================================================
 */

export function requirePaymentCanCreateGatewayOrder(
  payment:
    Payment
): void {
  if (
    payment.status ===
      PaymentStatus.CANCELLED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_CANCELLED",
      "A cancelled Payment cannot create a gateway order.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    payment.status ===
      PaymentStatus.REFUNDED
  ) {
    throw new PaymentServiceError(
      "PAYMENT_REFUNDED",
      "A refunded Payment cannot create a gateway order.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }

  if (
    isPaymentFullyPaid(
      payment
    )
  ) {
    throw new PaymentServiceError(
      "PAYMENT_ALREADY_PAID",
      "A fully paid Payment cannot create another gateway collection order.",
      {
        paymentId:
          payment.paymentId,
      }
    );
  }
}

/* ============================================================================
 * Gateway-order currency
 * ============================================================================
 */

export function resolveGatewayOrderCurrency(
  payment:
    Payment,
  currency?:
    string
): Payment[
  "payable"
]["currency"] {
  const supplied =
    normalizePaymentServiceString(
      currency
    );

  if (
    !supplied
  ) {
    return payment
      .payable
      .currency;
  }

  const normalized =
    supplied
      .toUpperCase();

  if (
    normalized !==
      payment.payable
        .currency
  ) {
    throw new PaymentServiceError(
      "BUSINESS_RULE",
      `Gateway order currency must be ${payment.payable.currency}.`,
      {
        paymentId:
          payment.paymentId,

        field:
          "currency",

        value:
          normalized,
      }
    );
  }

  return payment
    .payable
    .currency;
}

/* ============================================================================
 * Create gateway-order persistence record
 * ============================================================================
 */

export async function createPaymentGatewayOrder(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    CreatePaymentGatewayOrderServiceInput
): Promise<
  PaymentGatewayOrderRepositoryRecord
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  const gatewayOrderId =
    requirePaymentServiceIdentifier(
      input.gatewayOrderId,
      "gatewayOrderId",
      "INVALID_GATEWAY_ORDER_ID"
    );

  try {
    const payment =
      await requirePaymentById(
        repository,
        paymentId
      );

    requirePaymentCanCreateGatewayOrder(
      payment
    );

    requireValidGatewayOrderAmount(
      payment,
      input.amount
    );

    const currency =
      resolveGatewayOrderCurrency(
        payment,
        input.currency
      );

    const existing =
      await repository
        .findGatewayOrderById(
          gatewayOrderId
        );

    if (
      existing
    ) {
      throw new PaymentServiceError(
        "BUSINESS_RULE",
        "Gateway order already exists.",
        {
          paymentId,

          gatewayOrderId,
        }
      );
    }

    const now =
      new Date()
        .toISOString();

    return await repository
      .createGatewayOrder({
        order: {
          paymentId,

          provider:
            input.provider,

          gatewayOrderId,

          amount:
            input.amount,

          currency,

          status:
  input.status ??
  "CREATED",

          ...(input.receiptReference
            ? {
                receiptReference:
                  input
                    .receiptReference,
              }
            : {}),

          ...(input.metadata
            ? {
                metadata:
                  input.metadata,
              }
            : {}),

          createdAt:
            now,

          updatedAt:
            now,
        },
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Update gateway order
 * ============================================================================
 */

export async function updatePaymentGatewayOrder(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    UpdatePaymentGatewayOrderServiceInput
): Promise<
  PaymentGatewayOrderRepositoryRecord
> {
  const gatewayOrderId =
    requirePaymentServiceIdentifier(
      input.gatewayOrderId,
      "gatewayOrderId",
      "INVALID_GATEWAY_ORDER_ID"
    );

  try {
    const existing =
      await repository
        .findGatewayOrderById(
          gatewayOrderId
        );

    if (
      !existing
    ) {
      throw new PaymentServiceError(
        "GATEWAY_OPERATION_FAILED",
        "Gateway order was not found.",
        {
          gatewayOrderId,
        }
      );
    }

    return await repository
  .updateGatewayOrder({
    paymentId:
      existing.paymentId,

    gatewayOrderId,

    ...(input.status
      ? {
          status:
            input.status,
        }
      : {}),

    ...(input.metadata
      ? {
          metadata:
            input.metadata,
        }
      : {}),

    updatedAt:
      input.updatedAt ??
      new Date()
        .toISOString(),
  });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Gateway-order lookup
 * ============================================================================
 */

export async function getPaymentGatewayOrder(
  repository:
    CompleteExtendedPaymentRepository,
  gatewayOrderId:
    string
): Promise<
  PaymentGatewayOrderRepositoryRecord |
  null
> {
  const normalized =
    requirePaymentServiceIdentifier(
      gatewayOrderId,
      "gatewayOrderId",
      "INVALID_GATEWAY_ORDER_ID"
    );

  try {
    return await repository
      .findGatewayOrderById(
        normalized
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Provider event idempotency
 * ============================================================================
 */

export async function paymentWebhookEventAlreadyExists(
  repository:
    CompleteExtendedPaymentRepository,
  provider:
    PaymentProvider,
  providerEventId:
    string
): Promise<
  boolean
> {
  const normalizedEventId =
    requirePaymentServiceIdentifier(
      providerEventId,
      "providerEventId",
      "INVALID_SERVICE_INPUT"
    );

  try {
    return await repository
      .webhookProviderEventExists(
        provider,
        normalizedEventId
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Record webhook receipt
 * ============================================================================
 */

export async function recordPaymentWebhook(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    RecordPaymentWebhookServiceInput
): Promise<
  PaymentWebhookReceiptServiceResult
> {
  const webhookId =
    requirePaymentServiceIdentifier(
      input.webhookId,
      "webhookId",
      "INVALID_SERVICE_INPUT"
    );

  try {
    /**
     * First-level idempotency:
     * provider + providerEventId
     */
    if (
      input.providerEventId
    ) {
      const existing =
        await repository
          .findWebhookByProviderEventId(
            input.provider,
            input.providerEventId
          );

      if (
        existing
      ) {
        return {
          webhook:
            existing,

          duplicate:
            true,
        };
      }
    }

    /**
     * Second-level idempotency:
     * our own webhook identifier.
     */
    const existingByWebhookId =
      await repository
        .findWebhookById(
          webhookId
        );

    if (
      existingByWebhookId
    ) {
      return {
        webhook:
          existingByWebhookId,

        duplicate:
          true,
      };
    }

    const webhook =
      await repository
        .createWebhookRecord({
          webhook: {
            webhookId,

            provider:
              input.provider,

            eventType:
              input.eventType,

            ...(input.providerEventId
              ? {
                  providerEventId:
                    input.providerEventId,
                }
              : {}),

            ...(input.payloadHash
              ? {
                  payloadHash:
                    input.payloadHash,
                }
              : {}),

            ...(input.gatewayOrderId
              ? {
                  gatewayOrderId:
                    input.gatewayOrderId,
                }
              : {}),

            ...(input.gatewayPaymentId
              ? {
                  gatewayPaymentId:
                    input.gatewayPaymentId,
                }
              : {}),

            ...(input.paymentId
              ? {
                  paymentId:
                    input.paymentId,
                }
              : {}),

            ...(input.transactionId
              ? {
                  transactionId:
                    input.transactionId,
                }
              : {}),

            processed:
              false,

            duplicate:
              false,

            receivedAt:
              input.receivedAt ??
              new Date()
                .toISOString(),
          },
        });

    return {
      webhook,

      duplicate:
        false,
    };
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Mark webhook processed
 * ============================================================================
 */

export async function completePaymentWebhook(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    CompletePaymentWebhookServiceInput
): Promise<
  PaymentWebhookRepositoryRecord
> {
  const webhookId =
    requirePaymentServiceIdentifier(
      input.webhookId,
      "webhookId",
      "INVALID_SERVICE_INPUT"
    );

  try {
    const webhook =
      await repository
        .findWebhookById(
          webhookId
        );

    if (
      !webhook
    ) {
      throw new PaymentServiceError(
        "WEBHOOK_PROCESSING_FAILED",
        "Payment webhook record was not found.",
        {
          field:
            "webhookId",

          value:
            webhookId,
        }
      );
    }

    if (
      webhook.processed
    ) {
      return webhook;
    }

    return await repository
      .markWebhookProcessed({
        webhookId,

        ...(input.paymentId
          ? {
              paymentId:
                input.paymentId,
            }
          : {}),

        ...(input.transactionId
          ? {
              transactionId:
                input.transactionId,
            }
          : {}),

        processedAt:
          input.processedAt ??
          new Date()
            .toISOString(),
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Mark webhook failed
 * ============================================================================
 */

export async function failPaymentWebhook(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    FailPaymentWebhookServiceInput
): Promise<
  PaymentWebhookRepositoryRecord
> {
  const webhookId =
    requirePaymentServiceIdentifier(
      input.webhookId,
      "webhookId",
      "INVALID_SERVICE_INPUT"
    );

  try {
    const webhook =
      await repository
        .findWebhookById(
          webhookId
        );

    if (
      !webhook
    ) {
      throw new PaymentServiceError(
        "WEBHOOK_PROCESSING_FAILED",
        "Payment webhook record was not found.",
        {
          field:
            "webhookId",

          value:
            webhookId,
        }
      );
    }

    return await repository
      .markWebhookFailed({
        webhookId,

        ...(input.errorCode
          ? {
              errorCode:
                input.errorCode,
            }
          : {}),

        ...(input.errorMessage
          ? {
              errorMessage:
                input.errorMessage,
            }
          : {}),

        processedAt:
          input.processedAt ??
          new Date()
            .toISOString(),
      });
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Gateway/Webhook capable Payment Service
 * ============================================================================
 */

export class PaymentGatewayService
  extends PaymentRefundService {
  /* ------------------------------------------------------------------------
   * Gateway orders
   * ------------------------------------------------------------------------
   */

  async createGatewayOrder(
    input:
      CreatePaymentGatewayOrderServiceInput
  ): Promise<
    PaymentGatewayOrderRepositoryRecord
  > {
    return createPaymentGatewayOrder(
      this.repository,
      input
    );
  }

  async updateGatewayOrder(
    input:
      UpdatePaymentGatewayOrderServiceInput
  ): Promise<
    PaymentGatewayOrderRepositoryRecord
  > {
    return updatePaymentGatewayOrder(
      this.repository,
      input
    );
  }

  async getGatewayOrder(
    gatewayOrderId:
      string
  ): Promise<
    PaymentGatewayOrderRepositoryRecord |
    null
  > {
    return getPaymentGatewayOrder(
      this.repository,
      gatewayOrderId
    );
  }

  /* ------------------------------------------------------------------------
   * Webhooks
   * ------------------------------------------------------------------------
   */

  async recordWebhook(
    input:
      RecordPaymentWebhookServiceInput
  ): Promise<
    PaymentWebhookReceiptServiceResult
  > {
    return recordPaymentWebhook(
      this.repository,
      input
    );
  }

  async completeWebhook(
    input:
      CompletePaymentWebhookServiceInput
  ): Promise<
    PaymentWebhookRepositoryRecord
  > {
    return completePaymentWebhook(
      this.repository,
      input
    );
  }

  async failWebhook(
    input:
      FailPaymentWebhookServiceInput
  ): Promise<
    PaymentWebhookRepositoryRecord
  > {
    return failPaymentWebhook(
      this.repository,
      input
    );
  }

  async webhookEventExists(
    provider:
      PaymentProvider,
    providerEventId:
      string
  ): Promise<
    boolean
  > {
    return paymentWebhookEventAlreadyExists(
      this.repository,
      provider,
      providerEventId
    );
  }
}

/* ============================================================================
 * Gateway-capable service factory
 * ============================================================================
 */

export function createPaymentGatewayService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): PaymentGatewayService {
  return new PaymentGatewayService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Gateway / webhook facade
 * ============================================================================
 */

export const PaymentServiceGateway = {
  gatewayOrder: {
    validateAmount:
      requireValidGatewayOrderAmount,

    validateEligibility:
      requirePaymentCanCreateGatewayOrder,

    resolveCurrency:
      resolveGatewayOrderCurrency,

    create:
      createPaymentGatewayOrder,

    update:
      updatePaymentGatewayOrder,

    get:
      getPaymentGatewayOrder,
  },

  webhook: {
    eventExists:
      paymentWebhookEventAlreadyExists,

    record:
      recordPaymentWebhook,

    complete:
      completePaymentWebhook,

    fail:
      failPaymentWebhook,
  },

  createService:
    createPaymentGatewayService,
} as const;

/* ============================================================================
 * End of Payment Service - Part E
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Service
 * Part F
 * ============================================================================
 *
 * Final service composition:
 *
 * - Reconciliation
 * - Bulk lookup
 * - Bulk status updates
 * - Repository diagnostics
 * - Capability/configuration reporting
 * - Service readiness
 * - Final Payment service class
 * - Final factory/facade
 * ============================================================================
 */

/* ============================================================================
 * Reconciliation input
 * ============================================================================
 */

export interface ReconcilePaymentServiceInput {
  paymentId:
    PaymentId;

  observed:
    PaymentReconciliationObserved;

  reconciledBy?:
    string;
}

/* ============================================================================
 * Reconciliation amount difference
 * ============================================================================
 */

export interface PaymentReconciliationDifference {
  field:
    string;

  expected:
    number;

  observed:
    number;

  difference:
    number;
}

/* ============================================================================
 * Build reconciliation differences
 * ============================================================================
 */

export function buildPaymentReconciliationDifferences(
  payment:
    Payment,
  observed:
    PaymentReconciliationObserved
): PaymentReconciliationDifference[] {
  const expectedCollectedAmount =
    payment.payable
      .paidAmount;

  const expectedRefundedAmount =
    getPaymentRefundedAmount(
      payment
    );

  const collectedDifference =
    observed.collectedAmount -
    expectedCollectedAmount;

  const refundedDifference =
    observed.refundedAmount -
    expectedRefundedAmount;

  const differences:
    PaymentReconciliationDifference[] =
      [];

  if (
    collectedDifference !==
      0
  ) {
    differences.push({
      field:
        "collectedAmount",

      expected:
        expectedCollectedAmount,

      observed:
        observed.collectedAmount,

      difference:
        collectedDifference,
    });
  }

  if (
    refundedDifference !==
      0
  ) {
    differences.push({
      field:
        "refundedAmount",

      expected:
        expectedRefundedAmount,

      observed:
        observed.refundedAmount,

      difference:
        refundedDifference,
    });
  }

  return differences;
}

/* ============================================================================
 * Reconciliation validation
 * ============================================================================
 */

export function requireValidPaymentReconciliationObserved(
  payment:
    Payment,
  observed:
    PaymentReconciliationObserved
): void {
  if (
    !Number.isFinite(
      observed.collectedAmount
    ) ||
    observed.collectedAmount <
      0
  ) {
    throw new PaymentServiceError(
      "RECONCILIATION_FAILED",
      "Observed collected amount must be a valid non-negative amount.",
      {
        paymentId:
          payment.paymentId,

        field:
          "observed.collectedAmount",

        value:
          observed.collectedAmount,
      }
    );
  }

  if (
    !Number.isFinite(
      observed.refundedAmount
    ) ||
    observed.refundedAmount <
      0
  ) {
    throw new PaymentServiceError(
      "RECONCILIATION_FAILED",
      "Observed refunded amount must be a valid non-negative amount.",
      {
        paymentId:
          payment.paymentId,

        field:
          "observed.refundedAmount",

        value:
          observed.refundedAmount,
      }
    );
  }

  if (
    observed.currency !==
      payment.payable
        .currency
  ) {
    throw new PaymentServiceError(
      "RECONCILIATION_FAILED",
      `Observed reconciliation currency must be ${payment.payable.currency}.`,
      {
        paymentId:
          payment.paymentId,

        field:
          "observed.currency",

        value:
          observed.currency,
      }
    );
  }
}

/* ============================================================================
 * Build reconciliation result
 * ============================================================================
 */

export function buildPaymentReconciliationResult(
  payment:
    Payment,
  observed:
    PaymentReconciliationObserved,
  reconciledBy?:
    string
): PaymentReconciliationResult {
  requireValidPaymentReconciliationObserved(
    payment,
    observed
  );

  const differences =
    buildPaymentReconciliationDifferences(
      payment,
      observed
    );

  return {
    paymentId:
      payment.paymentId,

    reconciled:
      differences.length ===
        0,

    expected: {
      paymentId:
        payment.paymentId,

      totalAmount:
        payment.payable
          .totalAmount,

      paidAmount:
        payment.payable
          .paidAmount,

      refundedAmount:
        getPaymentRefundedAmount(
          payment
        ),

      balanceAmount:
        payment.payable
          .balanceAmount,

      currency:
        payment.payable
          .currency,
    },

    observed,

    differences,

    reconciledAt:
      new Date()
        .toISOString(),

    ...(reconciledBy
      ? {
          reconciledBy,
        }
      : {}),
  };
}

/* ============================================================================
 * Reconcile one Payment
 * ============================================================================
 */

export async function reconcilePayment(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    ReconcilePaymentServiceInput
): Promise<
  PaymentReconciliationResult
> {
  const paymentId =
    requirePaymentServiceIdentifier(
      input.paymentId,
      "paymentId",
      "INVALID_PAYMENT_ID"
    );

  try {
    const payment =
      await requirePaymentById(
        repository,
        paymentId
      );

    const result =
      buildPaymentReconciliationResult(
        payment,
        input.observed,
        input.reconciledBy
      );

    const persistenceInput:
      SavePaymentReconciliationRepositoryInput = {
      paymentId,

      observed:
        input.observed,

      result,
    };

    return await repository
      .saveReconciliation(
        persistenceInput
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Bulk lookup
 * ============================================================================
 */

export async function getPaymentsByIds(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    PaymentRepositoryBulkLookupInput
): Promise<
  PaymentRepositoryBulkLookupResult
> {
  try {
    return await repository
      .findManyByIds(
        input
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Bulk status update
 * ============================================================================
 */

export async function changeManyPaymentStatuses(
  repository:
    CompleteExtendedPaymentRepository,
  input:
    PaymentRepositoryBulkStatusUpdateInput
): Promise<
  PaymentRepositoryBulkStatusUpdateResult
> {
  /**
   * Repository bulk update is persistence-oriented.
   *
   * Service-level validation is performed first to prevent clearly illegal
   * status transitions from being sent directly to the database.
   */
  for (
    const item
    of input.items
  ) {
    const payment =
      await requirePaymentById(
        repository,
        item.paymentId
      );

    requirePaymentStatusTransition(
      payment.status,
      item.status,
      payment.paymentId
    );
  }

  try {
    return await repository
      .updateManyStatuses(
        input
      );
  } catch (
    error
  ) {
    throw normalizePaymentServiceError(
      error
    );
  }
}

/* ============================================================================
 * Repository capability check
 * ============================================================================
 */

export interface PaymentServiceCapabilityState {
  available:
    boolean;

  capabilities?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;
}

/* ============================================================================
 * Payment Service readiness result
 * ============================================================================
 */

export interface PaymentServiceReadinessResult {
  ready:
    boolean;

  repositoryHealthy:
    boolean;

  configurationValid:
    boolean;

  capabilityReport?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;

  health:
    PaymentRepositoryHealth;

  checkedAt:
    string;
}

/* ============================================================================
 * Determine repository configuration validity
 * ============================================================================
 */

export function isPaymentRepositoryConfigurationValid(
  configuration?:
    PaymentRepositoryConfigurationValidation
): boolean {
  if (
    !configuration
  ) {
    return true;
  }

  return configuration.valid;
}

/* ============================================================================
 * Service capability state
 * ============================================================================
 */

export function getPaymentServiceCapabilityState(
  service:
    PaymentService
): PaymentServiceCapabilityState {
  const configurationValid =
    isPaymentRepositoryConfigurationValid(
      service.repositoryConfiguration
    );

  return {
    available:
      configurationValid,

    ...(service.capabilityReport
      ? {
          capabilities:
            service.capabilityReport,
        }
      : {}),

    ...(service.repositoryConfiguration
      ? {
          configuration:
            service.repositoryConfiguration,
        }
      : {}),
  };
}

/* ============================================================================
 * Service readiness
 * ============================================================================
 */

export async function checkPaymentServiceReadiness(
  service:
    PaymentService
): Promise<
  PaymentServiceReadinessResult
> {
  const health =
    await service
      .checkRepositoryHealth();

  const configurationValid =
    isPaymentRepositoryConfigurationValid(
      service.repositoryConfiguration
    );

  return {
    ready:
      health.healthy &&
      configurationValid,

    repositoryHealthy:
      health.healthy,

    configurationValid,

    ...(service.capabilityReport
      ? {
          capabilityReport:
            service.capabilityReport,
        }
      : {}),

    ...(service.repositoryConfiguration
      ? {
          configuration:
            service.repositoryConfiguration,
        }
      : {}),

    health,

    checkedAt:
      new Date()
        .toISOString(),
  };
}

/* ============================================================================
 * Final complete Payment Service
 * ============================================================================
 */

export class CompleteOperationalPaymentService
  extends PaymentGatewayService {
  /* ------------------------------------------------------------------------
   * Reconciliation
   * ------------------------------------------------------------------------
   */

  async reconcile(
    input:
      ReconcilePaymentServiceInput
  ): Promise<
    PaymentReconciliationResult
  > {
    return reconcilePayment(
      this.repository,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Bulk lookup
   * ------------------------------------------------------------------------
   */

  async getManyByIds(
    input:
      PaymentRepositoryBulkLookupInput
  ): Promise<
    PaymentRepositoryBulkLookupResult
  > {
    return getPaymentsByIds(
      this.repository,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Bulk status update
   * ------------------------------------------------------------------------
   */

  async changeManyStatuses(
    input:
      PaymentRepositoryBulkStatusUpdateInput
  ): Promise<
    PaymentRepositoryBulkStatusUpdateResult
  > {
    return changeManyPaymentStatuses(
      this.repository,
      input
    );
  }

  /* ------------------------------------------------------------------------
   * Capability state
   * ------------------------------------------------------------------------
   */

  getCapabilities():
    PaymentServiceCapabilityState {
    return getPaymentServiceCapabilityState(
      this
    );
  }

  /* ------------------------------------------------------------------------
   * Readiness
   * ------------------------------------------------------------------------
   */

  async checkReadiness():
    Promise<
      PaymentServiceReadinessResult
    > {
    return checkPaymentServiceReadiness(
      this
    );
  }
}

/* ============================================================================
 * Final Payment Service factory
 * ============================================================================
 */

export function createOperationalPaymentService(
  dependencies:
    PaymentServiceDependencies,
  configuration:
    Partial<
      PaymentServiceConfiguration
    > = {}
): CompleteOperationalPaymentService {
  return new CompleteOperationalPaymentService(
    dependencies,
    configuration
  );
}

/* ============================================================================
 * Canonical Payment Service type
 * ============================================================================
 */

export type PaymentServicePort =
  CompleteOperationalPaymentService;

/* ============================================================================
 * Final Payment Service facade
 * ============================================================================
 */

export const CompletePaymentServiceFacade = {
  /* ------------------------------------------------------------------------
   * Factory
   * ------------------------------------------------------------------------
   */

  create:
    createOperationalPaymentService,

  /* ------------------------------------------------------------------------
   * Identity
   * ------------------------------------------------------------------------
   */

  identity: {
    generate:
      generatePaymentIdentity,

    paymentNumber:
      generatePaymentNumber,

    referenceId:
      generatePaymentReferenceId,

    transactionReference:
      generatePaymentTransactionReference,
  },

  /* ------------------------------------------------------------------------
   * Reads
   * ------------------------------------------------------------------------
   */

  reads: {
    requirePayment:
      requirePaymentById,

    requireTransaction:
      requirePaymentTransactionById,
  },

  /* ------------------------------------------------------------------------
   * Mutation
   * ------------------------------------------------------------------------
   */

  mutations: {
    create:
      createPaymentAggregateInTransaction,

    update:
      updatePaymentAggregate,

    changeStatus:
      changePaymentStatus,

    cancel:
      cancelPaymentAggregate,
  },

  /* ------------------------------------------------------------------------
   * Collection
   * ------------------------------------------------------------------------
   */

  collections: {
    success:
      recordSuccessfulPaymentCollection,

    failed:
      recordFailedPaymentCollection,

    calculate:
      calculatePaymentAfterSuccessfulCollection,
  },

  /* ------------------------------------------------------------------------
   * Refund
   * ------------------------------------------------------------------------
   */

  refunds: {
    request:
      requestPaymentRefund,

    complete:
      completePaymentRefund,

    fail:
      failPaymentRefund,

    refundableAmount:
      getPaymentRefundableAmount,
  },

  /* ------------------------------------------------------------------------
   * Gateway
   * ------------------------------------------------------------------------
   */

  gateway: {
    createOrder:
      createPaymentGatewayOrder,

    updateOrder:
      updatePaymentGatewayOrder,

    getOrder:
      getPaymentGatewayOrder,
  },

  /* ------------------------------------------------------------------------
   * Webhooks
   * ------------------------------------------------------------------------
   */

  webhooks: {
    record:
      recordPaymentWebhook,

    complete:
      completePaymentWebhook,

    fail:
      failPaymentWebhook,

    exists:
      paymentWebhookEventAlreadyExists,
  },

  /* ------------------------------------------------------------------------
   * Reconciliation
   * ------------------------------------------------------------------------
   */

  reconciliation: {
    build:
      buildPaymentReconciliationResult,

    reconcile:
      reconcilePayment,

    differences:
      buildPaymentReconciliationDifferences,
  },

  /* ------------------------------------------------------------------------
   * Bulk
   * ------------------------------------------------------------------------
   */

  bulk: {
    findByIds:
      getPaymentsByIds,

    changeStatuses:
      changeManyPaymentStatuses,
  },

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  diagnostics: {
    capabilityState:
      getPaymentServiceCapabilityState,

    readiness:
      checkPaymentServiceReadiness,

    configurationValid:
      isPaymentRepositoryConfigurationValid,
  },

  /* ------------------------------------------------------------------------
   * Errors
   * ------------------------------------------------------------------------
   */

  errors: {
    normalize:
      normalizePaymentServiceError,

    repositoryToService:
      mapPaymentRepositoryErrorToServiceError,
  },
} as const;

/* ============================================================================
 * End of Payment Service - Part F
 * ============================================================================
 */