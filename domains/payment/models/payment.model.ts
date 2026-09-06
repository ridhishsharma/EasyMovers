/**
 * ============================================================================
 * EasyMovers
 * Payment Domain Model
 * ============================================================================
 *
 * File:
 * domains/payment/models/payment.model.ts
 *
 * Responsibilities:
 * - Define Payment-domain identifiers and workflow states
 * - Define money, payment-method and provider contracts
 * - Define normalized payment transaction contracts
 * - Define Payment actor and audit information
 * - Remain independent from Prisma, HTTP and payment-gateway SDKs
 *
 * Important architectural rules:
 * - Domain amounts are represented as JavaScript numbers
 * - Prisma mappers are responsible for Decimal conversion
 * - Gateway-specific payloads must not leak into core domain contracts
 * - Payment records represent financial movement only
 * - Markup, commission and pricing calculations belong outside this domain
 *
 * This file does not:
 * - Access Prisma
 * - Validate input
 * - Perform payment calculations
 * - Call Razorpay or any other gateway
 * - Perform settlement calculations
 * - Return HTTP responses
 * ============================================================================
 */

/* ============================================================================
 * Identifier aliases
 * ============================================================================
 */

export type PaymentId =
  string;

export type PaymentNumber =
  string;

export type PaymentTransactionId =
  string;

export type PaymentReferenceId =
  string;

export type GatewayOrderId =
  string;

export type GatewayPaymentId =
  string;

export type GatewaySignature =
  string;

export type BookingId =
  string;

export type QuotationId =
  string;

export type LeadId =
  string;

export type CustomerId =
  string;

export type VendorId =
  string;

export type UserId =
  string;

/* ============================================================================
 * Currency
 * ============================================================================
 */

/**
 * Supported Payment currencies.
 *
 * EasyMovers currently operates in INR.
 *
 * This enum intentionally remains Payment-domain-owned rather than importing
 * QuotationCurrency so that Payment does not become coupled to Quotation.
 */
export enum PaymentCurrency {
  INR =
    "INR",
}

/* ============================================================================
 * Payment status
 * ============================================================================
 */

/**
 * Represents the overall financial state of a Payment aggregate.
 *
 * This is intentionally different from PaymentTransactionStatus.
 *
 * Example:
 *
 * Booking payable: INR 23,010
 * Paid:            INR 5,000
 *
 * PaymentStatus = PARTIALLY_PAID
 *
 * A later successful transaction may move the Payment to PAID.
 */
export enum PaymentStatus {
  PENDING =
    "PENDING",

  PARTIALLY_PAID =
    "PARTIALLY_PAID",

  PAID =
    "PAID",

  FAILED =
    "FAILED",

  CANCELLED =
    "CANCELLED",

  REFUND_PENDING =
    "REFUND_PENDING",

  PARTIALLY_REFUNDED =
    "PARTIALLY_REFUNDED",

  REFUNDED =
    "REFUNDED",
}

/* ============================================================================
 * Payment purpose
 * ============================================================================
 */

/**
 * Describes why the customer is making a payment.
 *
 * This is separate from transaction direction/type.
 */

/* ============================================================================
 * Legacy Payment classification
 * ============================================================================
 */

export enum PaymentType {
  ADVANCE =
    "ADVANCE",

  PARTIAL =
    "PARTIAL",

  FINAL =
    "FINAL",

  REFUND =
    "REFUND",

  BALANCE =
    "BALANCE",

  FULL_PAYMENT =
    "FULL_PAYMENT",

  ADDITIONAL =
    "ADDITIONAL",
}
export enum PaymentPurpose {
  ADVANCE =
    "ADVANCE",

  BALANCE =
    "BALANCE",

  FULL_PAYMENT =
    "FULL_PAYMENT",

  ADDITIONAL =
    "ADDITIONAL",
}

/* ============================================================================
 * Transaction type
 * ============================================================================
 */

/**
 * Describes the financial direction/purpose of an individual transaction.
 *
 * COLLECTION:
 * Money collected from a customer/corporate payer.
 *
 * REFUND:
 * Money returned against an earlier collection.
 *
 * ADJUSTMENT:
 * Explicit controlled accounting correction.
 */
export enum PaymentTransactionType {
  COLLECTION =
    "COLLECTION",

  REFUND =
    "REFUND",

  ADJUSTMENT =
    "ADJUSTMENT",
}

/* ============================================================================
 * Transaction status
 * ============================================================================
 */

/**
 * Normalized transaction status used by EasyMovers.
 *
 * Gateway-specific states must be mapped into one of these states by the
 * gateway adapter / mapper.
 */
export enum PaymentTransactionStatus {
  INITIATED =
    "INITIATED",

  PENDING =
    "PENDING",

  AUTHORIZED =
    "AUTHORIZED",

  CAPTURED =
    "CAPTURED",

  SUCCESS =
    "SUCCESS",

  FAILED =
    "FAILED",

  CANCELLED =
    "CANCELLED",

  REFUNDED =
    "REFUNDED",
}

/* ============================================================================
 * Payment method
 * ============================================================================
 */

/**
 * Customer-facing / operational payment method.
 *
 * CARD intentionally does not distinguish debit/credit at the core level.
 * Gateway metadata may retain that information separately when needed.
 */
export enum PaymentMethod {
  UPI =
    "UPI",

  CARD =
    "CARD",

  NET_BANKING =
    "NET_BANKING",

  WALLET =
    "WALLET",

  BANK_TRANSFER =
    "BANK_TRANSFER",

  CASH =
    "CASH",

  CHEQUE =
    "CHEQUE",

  OTHER =
    "OTHER",
}

/* ============================================================================
 * Payment provider
 * ============================================================================
 */

/**
 * Identifies the system/channel through which the transaction was processed.
 *
 * MANUAL:
 * Payment recorded operationally by an authorized EasyMovers user.
 *
 * BANK:
 * Direct bank-transfer reconciliation.
 *
 * RAZORPAY:
 * Online payment processed through Razorpay.
 *
 * OTHER:
 * Reserved for future provider integrations.
 */
export enum PaymentProvider {
  RAZORPAY =
    "RAZORPAY",

  MANUAL =
    "MANUAL",

  BANK =
    "BANK",

  OTHER =
    "OTHER",
}

/* ============================================================================
 * Actor type
 * ============================================================================
 */

/**
 * Identifies who initiated, recorded or performed a Payment-domain action.
 */
export enum PaymentActorType {
  CUSTOMER =
    "CUSTOMER",

  CORPORATE =
    "CORPORATE",

  ADMIN =
    "ADMIN",

  VENDOR =
    "VENDOR",

  SYSTEM =
    "SYSTEM",
}

/* ============================================================================
 * Payment source
 * ============================================================================
 */

/**
 * Identifies the originating EasyMovers channel.
 */
export enum PaymentSource {
  WEB =
    "WEB",

  ANDROID =
    "ANDROID",

  IOS =
    "IOS",

  ADMIN =
    "ADMIN",

  CORPORATE =
    "CORPORATE",

  API =
    "API",

  WEBHOOK =
    "WEBHOOK",
}

/* ============================================================================
 * Shared money contract
 * ============================================================================
 */

/**
 * Monetary value used by the Payment domain.
 *
 * Amounts are JavaScript numbers at the domain layer.
 *
 * Persistence adapters must convert values to/from Prisma Decimal.
 *
 * All validators and services must reject:
 * - NaN
 * - Infinity
 * - negative values where the operation does not permit them
 */
export interface PaymentMoney {
  amount:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Actor contract
 * ============================================================================
 */

/**
 * Normalized actor information for Payment-domain operations.
 */
export interface PaymentActor {
  actorType:
    PaymentActorType;

  actorId?:
    string;

  displayName?:
    string;
}

/* ============================================================================
 * Gateway reference
 * ============================================================================
 */

/**
 * Normalized gateway identifiers.
 *
 * These are references only.
 *
 * Full provider request/response payloads must not be stored directly in the
 * core Payment aggregate unless intentionally mapped to sanitized metadata.
 */
export interface PaymentGatewayReference {
  provider:
    PaymentProvider;

  gatewayOrderId?:
    GatewayOrderId;

  gatewayPaymentId?:
    GatewayPaymentId;

  gatewayReferenceId?:
    string;
}

/* ============================================================================
 * Payment failure
 * ============================================================================
 */

/**
 * Normalized failure information.
 *
 * Gateway-specific codes may be retained in providerCode while business
 * logic should use the normalized reason/message.
 */
export interface PaymentFailure {
  reason?:
    string;

  message?:
    string;

  providerCode?:
    string;

  failedAt?:
    string;
}

/* ============================================================================
 * Payment transaction
 * ============================================================================
 */

/**
 * Represents one immutable financial transaction attempt/event.
 *
 * A Payment aggregate may contain multiple transactions:
 *
 * Example:
 *
 * Transaction 1
 *   ADVANCE
 *   INR 5,000
 *   SUCCESS
 *
 * Transaction 2
 *   BALANCE
 *   INR 18,010
 *   SUCCESS
 *
 * The Payment aggregate can then become PAID for INR 23,010.
 *
 * Failed attempts remain part of transaction history and must not simply
 * disappear when a later retry succeeds.
 */
export interface PaymentTransaction {
  transactionId:
    PaymentTransactionId;

  paymentId:
    PaymentId;

  transactionType:
    PaymentTransactionType;

  purpose?:
    PaymentPurpose;

  amount:
    PaymentMoney;

  status:
    PaymentTransactionStatus;

  method?:
    PaymentMethod;

  provider:
    PaymentProvider;

  gateway?:
    PaymentGatewayReference;

  failure?:
    PaymentFailure;

  initiatedAt:
    string;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  completedAt?:
    string;

  failedAt?:
    string;

  remarks?:
    string;

  recordedBy?:
    PaymentActor;
}

/* ============================================================================
 * Payment audit
 * ============================================================================
 */

/**
 * Standard Payment-domain audit information.
 */
export interface PaymentAudit {
  createdAt:
    string;

  updatedAt:
    string;

  createdBy?:
    string;

  updatedBy?:
    string;

  source:
    PaymentSource;
}

/* ============================================================================
 * End of Payment Model - Part A
 * ============================================================================
 */
/* ============================================================================
 * Payable summary
 * ============================================================================
 */

/**
 * Represents the current customer-payment position for one Payment aggregate.
 *
 * This contract intentionally aligns with the existing Booking payment summary
 * while remaining owned by the Payment domain.
 *
 * Important:
 * - totalAmount is the total customer payable amount
 * - paidAmount is the successfully collected amount
 * - balanceAmount is the amount still outstanding
 * - advanceAmount is informational and may represent the agreed/collected
 *   advance portion
 * - paymentPending mirrors the outstanding amount for Booking compatibility
 */
export interface PaymentPayableSummary {
  totalAmount:
    number;

  advanceAmount?:
    number;

  paidAmount:
    number;

  balanceAmount:
    number;

  paymentPending:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Refund summary
 * ============================================================================
 */

/**
 * Aggregated refund information for a Payment.
 *
 * Individual refund transactions remain stored in transactions.
 * This summary exists for quick business reads.
 */
export interface PaymentRefundSummary {
  totalRefundedAmount:
    number;

  refundPendingAmount?:
    number;

  lastRefundedAt?:
    string;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Commercial reference snapshot
 * ============================================================================
 */

/**
 * References the commercial source used to establish the customer payable
 * amount.
 *
 * Payment does not calculate markup, commission or pricing.
 *
 * These fields allow Payment to preserve the commercial basis used when the
 * Payment was created.
 */
export interface PaymentCommercialReference {
  quotationId?:
    QuotationId;

  quotationNumber?:
    string;

  customerPayableAmount?:
    number;

  vendorQuotedAmount?:
    number;

  platformMarkupAmount?:
    number;

  platformCommissionAmount?:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Payment aggregate
 * ============================================================================
 */

/**
 * Core Payment aggregate.
 *
 * One Booking should normally have one active Payment aggregate.
 *
 * A Payment may contain multiple PaymentTransaction records.
 *
 * Example:
 *
 * Payment
 *   totalAmount = 23,010
 *
 *   transactions:
 *     - ADVANCE 5,000 SUCCESS
 *     - BALANCE 18,010 SUCCESS
 *
 *   status = PAID
 */
export interface Payment {
  paymentId:
    PaymentId;

  paymentNumber:
    PaymentNumber;

  referenceId:
    PaymentReferenceId;

  bookingId:
    BookingId;

  bookingNumber?:
    string;

  leadId?:
    LeadId;

  customerId?:
    CustomerId;

  vendorId?:
    VendorId;

  quotationId?:
    QuotationId;

  status:
    PaymentStatus;

  payable:
    PaymentPayableSummary;

  commercialReference?:
    PaymentCommercialReference;

  transactions:
    PaymentTransaction[];

  refundSummary?:
    PaymentRefundSummary;

  latestSuccessfulTransactionId?:
    PaymentTransactionId;

  remarks?:
    string;

  internalRemarks?:
    string;

  metadata?:
    Record<string, unknown>;

  audit:
    PaymentAudit;
}

/* ============================================================================
 * Create Payment input
 * ============================================================================
 */

/**
 * Creates the Payment aggregate for a Booking.
 *
 * No gateway transaction is created by this command.
 *
 * Gateway-order creation belongs to a separate operation.
 */
export interface CreatePaymentInput {
  bookingId:
    BookingId;

  bookingNumber?:
    string;

  leadId?:
    LeadId;

  customerId?:
    CustomerId;

  vendorId?:
    VendorId;

  quotationId?:
    QuotationId;

  totalAmount:
    number;

  advanceAmount?:
    number;

  currency:
    PaymentCurrency;

  commercialReference?:
    PaymentCommercialReference;

  remarks?:
    string;

  internalRemarks?:
    string;

  createdBy?:
    string;

  source:
    PaymentSource;
}

/* ============================================================================
 * Update Payment input
 * ============================================================================
 */

/**
 * Allows controlled updates to non-transaction Payment information.
 *
 * Transaction totals must not be directly manipulated through this input.
 */
export interface UpdatePaymentInput {
  remarks?:
    string;

  internalRemarks?:
    string;

  metadata?:
    Record<string, unknown>;

  updatedBy:
    string;
}

/* ============================================================================
 * Record Payment transaction input
 * ============================================================================
 */

/**
 * Records a normalized financial transaction against a Payment.
 *
 * This command may represent:
 * - gateway collection
 * - manual collection
 * - bank-transfer confirmation
 * - refund
 * - controlled adjustment
 */
export interface RecordPaymentTransactionInput {
  paymentId:
    PaymentId;

  transactionType:
    PaymentTransactionType;

  purpose?:
    PaymentPurpose;

  amount:
    number;

  currency:
    PaymentCurrency;

  status:
    PaymentTransactionStatus;

  method?:
    PaymentMethod;

  provider:
    PaymentProvider;

  gateway?:
    PaymentGatewayReference;

  failure?:
    PaymentFailure;

  initiatedAt?:
    string;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  completedAt?:
    string;

  failedAt?:
    string;

  remarks?:
    string;

  recordedBy?:
    PaymentActor;
}

/* ============================================================================
 * Gateway order creation input
 * ============================================================================
 */

/**
 * Requests creation of a provider-side payment order.
 *
 * The provider adapter will translate this into the gateway-specific request.
 */
export interface CreateGatewayPaymentOrderInput {
  paymentId:
    PaymentId;

  amount:
    number;

  currency:
    PaymentCurrency;

  purpose?:
    PaymentPurpose;

  provider:
    PaymentProvider;

  customerId?:
    CustomerId;

  receiptReference?:
    string;

  notes?:
    Record<string, string>;
}

/* ============================================================================
 * Gateway order result
 * ============================================================================
 */

/**
 * Normalized provider-order result.
 *
 * Raw gateway response objects must not be returned directly from the core
 * service layer.
 */
export interface GatewayPaymentOrder {
  provider:
    PaymentProvider;

  gatewayOrderId:
    GatewayOrderId;

  amount:
    number;

  currency:
    PaymentCurrency;

  status?:
    string;

  receiptReference?:
    string;

  createdAt?:
    string;
}

/* ============================================================================
 * Verify Payment input
 * ============================================================================
 */

/**
 * Verifies a provider transaction after customer payment.
 *
 * For Razorpay this may use:
 * - gatewayOrderId
 * - gatewayPaymentId
 * - gatewaySignature
 *
 * Verification logic belongs to the gateway adapter/service.
 */
export interface VerifyPaymentInput {
  paymentId:
    PaymentId;

  provider:
    PaymentProvider;

  gatewayOrderId:
    GatewayOrderId;

  gatewayPaymentId:
    GatewayPaymentId;

  gatewaySignature?:
    GatewaySignature;

  verifiedBy?:
    string;
}

/* ============================================================================
 * Payment verification result
 * ============================================================================
 */

export interface PaymentVerificationResult {
  verified:
    boolean;

  provider:
    PaymentProvider;

  gatewayOrderId:
    GatewayOrderId;

  gatewayPaymentId:
    GatewayPaymentId;

  transactionStatus?:
    PaymentTransactionStatus;

  message?:
    string;
}

/* ============================================================================
 * Refund input
 * ============================================================================
 */

/**
 * Requests refund of a previously successful collection.
 *
 * Refund execution may be provider-driven or manual depending on provider.
 */
export interface RefundPaymentInput {
  paymentId:
    PaymentId;

  transactionId?:
    PaymentTransactionId;

  gatewayPaymentId?:
    GatewayPaymentId;

  amount:
    number;

  currency:
    PaymentCurrency;

  reason:
    string;

  requestedBy:
    string;

  provider:
    PaymentProvider;
}

/* ============================================================================
 * Refund result
 * ============================================================================
 */

export interface RefundPaymentResult {
  success:
    boolean;

  payment?:
    Payment;

  refundTransaction?:
    PaymentTransaction;

  message?:
    string;

  errorCode?:
    string;
}

/* ============================================================================
 * Payment summary
 * ============================================================================
 */

/**
 * Lightweight Payment representation for Booking/Admin reads.
 */
export interface PaymentSummary {
  paymentId:
    PaymentId;

  paymentNumber:
    PaymentNumber;

  bookingId:
    BookingId;

  status:
    PaymentStatus;

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

  currency:
    PaymentCurrency;

  latestSuccessfulTransactionId?:
    PaymentTransactionId;

  updatedAt:
    string;
}

/* ============================================================================
 * Operation result
 * ============================================================================
 */

/**
 * Standard result used by Payment service operations.
 *
 * Service methods should return controlled business failures rather than throw
 * for expected domain-rule failures.
 */
export interface PaymentOperationResult {
  success:
    boolean;

  payment?:
    Payment;

  summary?:
    PaymentSummary;

  transaction?:
    PaymentTransaction;

  message?:
    string;

  errorCode?:
    string;

  validationErrorCode?:
    string;
}

/* ============================================================================
 * End of Payment Model - Part B
 * ============================================================================
 */
/* ============================================================================
 * Payment search criteria
 * ============================================================================
 */

/**
 * Supported fields for Payment list/search filtering.
 *
 * All filters are optional so the repository/service can compose
 * progressively narrower queries.
 */
export interface PaymentSearchCriteria {
  paymentId?:
    PaymentId;

  paymentNumber?:
    PaymentNumber;

  referenceId?:
    PaymentReferenceId;

  bookingId?:
    BookingId;

  quotationId?:
    QuotationId;

  leadId?:
    LeadId;

  customerId?:
    CustomerId;

  vendorId?:
    VendorId;

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

  page?:
    number;

  pageSize?:
    number;

  sortBy?:
    PaymentSortField;

  sortDirection?:
    PaymentSortDirection;
}

/* ============================================================================
 * Payment sorting
 * ============================================================================
 */

export enum PaymentSortField {
  CREATED_AT =
    "CREATED_AT",

  UPDATED_AT =
    "UPDATED_AT",

  TOTAL_AMOUNT =
    "TOTAL_AMOUNT",

  PAID_AMOUNT =
    "PAID_AMOUNT",

  BALANCE_AMOUNT =
    "BALANCE_AMOUNT",

  STATUS =
    "STATUS",
}

export enum PaymentSortDirection {
  ASC =
    "ASC",

  DESC =
    "DESC",
}

/* ============================================================================
 * Pagination
 * ============================================================================
 */

export interface PaymentPagination {
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

export interface PaymentListResult {
  items:
    PaymentSummary[];

  pagination:
    PaymentPagination;
}

/* ============================================================================
 * Transaction search
 * ============================================================================
 */

/**
 * Search/filter contract for Payment transactions.
 */
export interface PaymentTransactionSearchCriteria {
  paymentId?:
    PaymentId;

  transactionId?:
    PaymentTransactionId;

  transactionType?:
    PaymentTransactionType;

  purpose?:
    PaymentPurpose;

  status?:
    PaymentTransactionStatus;

  provider?:
    PaymentProvider;

  method?:
    PaymentMethod;

  gatewayOrderId?:
    GatewayOrderId;

  gatewayPaymentId?:
    GatewayPaymentId;

  minimumAmount?:
    number;

  maximumAmount?:
    number;

  initiatedFrom?:
    string;

  initiatedUntil?:
    string;

  page?:
    number;

  pageSize?:
    number;
}

export interface PaymentTransactionListResult {
  items:
    PaymentTransaction[];

  pagination:
    PaymentPagination;
}

/* ============================================================================
 * Payment statistics
 * ============================================================================
 */

/**
 * Aggregated Payment-domain statistics.
 *
 * These values are intended for Admin reporting and operational dashboards.
 */
export interface PaymentStatistics {
  totalPayments:
    number;

  pendingPayments:
    number;

  partiallyPaidPayments:
    number;

  paidPayments:
    number;

  failedPayments:
    number;

  cancelledPayments:
    number;

  refundPendingPayments:
    number;

  partiallyRefundedPayments:
    number;

  refundedPayments:
    number;

  totalPayableAmount:
    number;

  totalCollectedAmount:
    number;

  totalOutstandingAmount:
    number;

  totalRefundedAmount:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Transaction statistics
 * ============================================================================
 */

export interface PaymentTransactionStatistics {
  totalTransactions:
    number;

  successfulTransactions:
    number;

  failedTransactions:
    number;

  pendingTransactions:
    number;

  refundTransactions:
    number;

  totalCollectionAmount:
    number;

  totalRefundAmount:
    number;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Reconciliation contracts
 * ============================================================================
 */

/**
 * Represents the expected financial position derived from EasyMovers data.
 */
export interface PaymentReconciliationExpected {
  paymentId:
    PaymentId;

  totalAmount:
    number;

  paidAmount:
    number;

  refundedAmount:
    number;

  balanceAmount:
    number;

  currency:
    PaymentCurrency;
}

/**
 * Represents values observed from a provider or external settlement source.
 */
export interface PaymentReconciliationObserved {
  provider:
    PaymentProvider;

  collectedAmount:
    number;

  refundedAmount:
    number;

  currency:
    PaymentCurrency;

  providerReference?:
    string;

  observedAt:
    string;
}

/**
 * Describes a reconciliation mismatch.
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

/**
 * Final normalized reconciliation result.
 */
export interface PaymentReconciliationResult {
  paymentId:
    PaymentId;

  reconciled:
    boolean;

  expected:
    PaymentReconciliationExpected;

  observed:
    PaymentReconciliationObserved;

  differences:
    PaymentReconciliationDifference[];

  reconciledAt:
    string;

  reconciledBy?:
    string;
}

/* ============================================================================
 * Gateway webhook events
 * ============================================================================
 */

/**
 * Normalized gateway webhook event types.
 *
 * Provider adapters map gateway-specific event names into these values.
 */
export enum PaymentWebhookEventType {
  ORDER_CREATED =
    "ORDER_CREATED",

  PAYMENT_AUTHORIZED =
    "PAYMENT_AUTHORIZED",

  PAYMENT_CAPTURED =
    "PAYMENT_CAPTURED",

  PAYMENT_SUCCESS =
    "PAYMENT_SUCCESS",

  PAYMENT_FAILED =
    "PAYMENT_FAILED",

  PAYMENT_REFUNDED =
    "PAYMENT_REFUNDED",

  REFUND_FAILED =
    "REFUND_FAILED",

  UNKNOWN =
    "UNKNOWN",
}

/**
 * Core normalized webhook event.
 *
 * rawPayload is intentionally excluded from the domain model.
 * Raw webhook bodies should only be retained by infrastructure/audit layers
 * when necessary and appropriately sanitized.
 */
export interface PaymentWebhookEvent {
  provider:
    PaymentProvider;

  eventType:
    PaymentWebhookEventType;

  gatewayOrderId?:
    GatewayOrderId;

  gatewayPaymentId?:
    GatewayPaymentId;

  gatewayReferenceId?:
    string;

  amount?:
    number;

  currency?:
    PaymentCurrency;

  occurredAt:
    string;

  receivedAt:
    string;

  metadata?:
    Record<string, unknown>;
}

/* ============================================================================
 * Webhook processing result
 * ============================================================================
 */

export interface PaymentWebhookProcessingResult {
  success:
    boolean;

  duplicate:
    boolean;

  paymentId?:
    PaymentId;

  transactionId?:
    PaymentTransactionId;

  eventType?:
    PaymentWebhookEventType;

  message?:
    string;

  errorCode?:
    string;
}

/* ============================================================================
 * Payment domain event
 * ============================================================================
 */

/**
 * Internal EasyMovers events emitted by the Payment domain.
 */
export enum PaymentDomainEventType {
  PAYMENT_CREATED =
    "PAYMENT_CREATED",

  PAYMENT_UPDATED =
    "PAYMENT_UPDATED",

  TRANSACTION_RECORDED =
    "TRANSACTION_RECORDED",

  PAYMENT_PARTIALLY_PAID =
    "PAYMENT_PARTIALLY_PAID",

  PAYMENT_PAID =
    "PAYMENT_PAID",

  PAYMENT_FAILED =
    "PAYMENT_FAILED",

  REFUND_REQUESTED =
    "REFUND_REQUESTED",

  PAYMENT_PARTIALLY_REFUNDED =
    "PAYMENT_PARTIALLY_REFUNDED",

  PAYMENT_REFUNDED =
    "PAYMENT_REFUNDED",

  PAYMENT_RECONCILED =
    "PAYMENT_RECONCILED",
}

export interface PaymentDomainEvent {
  eventId:
    string;

  eventType:
    PaymentDomainEventType;

  paymentId:
    PaymentId;

  bookingId:
    BookingId;

  transactionId?:
    PaymentTransactionId;

  occurredAt:
    string;

  performedBy?:
    PaymentActor;

  metadata?:
    Record<string, unknown>;
}

/* ============================================================================
 * Payment lifecycle snapshot
 * ============================================================================
 */

/**
 * Read-optimized view of one Payment's current financial position.
 */
export interface PaymentLifecycleSnapshot {
  paymentId:
    PaymentId;

  bookingId:
    BookingId;

  status:
    PaymentStatus;

  totalAmount:
    number;

  paidAmount:
    number;

  balanceAmount:
    number;

  refundedAmount:
    number;

  successfulTransactionCount:
    number;

  failedTransactionCount:
    number;

  latestTransactionStatus?:
    PaymentTransactionStatus;

  currency:
    PaymentCurrency;
}

/* ============================================================================
 * Type guards
 * ============================================================================
 */

export function isPaymentStatus(
  value:
    unknown
): value is PaymentStatus {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentStatus
    ).includes(
      value as PaymentStatus
    )
  );
}
export function isPaymentType(
  value:
    unknown
): value is PaymentType {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentType
    ).includes(
      value as PaymentType
    )
  );
}
export function isPaymentTransactionStatus(
  value:
    unknown
): value is PaymentTransactionStatus {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentTransactionStatus
    ).includes(
      value as PaymentTransactionStatus
    )
  );
}

export function isPaymentMethod(
  value:
    unknown
): value is PaymentMethod {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentMethod
    ).includes(
      value as PaymentMethod
    )
  );
}

export function isPaymentProvider(
  value:
    unknown
): value is PaymentProvider {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentProvider
    ).includes(
      value as PaymentProvider
    )
  );
}

export function isPaymentCurrency(
  value:
    unknown
): value is PaymentCurrency {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentCurrency
    ).includes(
      value as PaymentCurrency
    )
  );
}

export function isPaymentPurpose(
  value:
    unknown
): value is PaymentPurpose {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentPurpose
    ).includes(
      value as PaymentPurpose
    )
  );
}

export function isPaymentTransactionType(
  value:
    unknown
): value is PaymentTransactionType {
  return (
    typeof value ===
      "string" &&
    Object.values(
      PaymentTransactionType
    ).includes(
      value as PaymentTransactionType
    )
  );
}

/* ============================================================================
 * Basic helpers
 * ============================================================================
 */

/**
 * Returns the successfully collected amount from transaction history.
 *
 * Only successful/captured collection transactions contribute.
 *
 * This helper performs no persistence and no mutation.
 */
export function calculateCollectedAmount(
  transactions:
    PaymentTransaction[]
): number {
  return transactions
    .filter(
      (
        transaction
      ) =>
        transaction
          .transactionType ===
          PaymentTransactionType
            .COLLECTION &&
        (
          transaction.status ===
            PaymentTransactionStatus
              .SUCCESS ||
          transaction.status ===
            PaymentTransactionStatus
              .CAPTURED
        )
    )
    .reduce(
      (
        total,
        transaction
      ) =>
        total +
        transaction.amount
          .amount,
      0
    );
}

/**
 * Returns the successfully refunded amount.
 */
export function calculateRefundedAmount(
  transactions:
    PaymentTransaction[]
): number {
  return transactions
    .filter(
      (
        transaction
      ) =>
        transaction
          .transactionType ===
          PaymentTransactionType
            .REFUND &&
        transaction.status ===
          PaymentTransactionStatus
            .REFUNDED
    )
    .reduce(
      (
        total,
        transaction
      ) =>
        total +
        transaction.amount
          .amount,
      0
    );
}

/**
 * Calculates the outstanding amount.
 *
 * Negative balances are normalized to zero.
 */
export function calculatePaymentBalance(
  totalAmount:
    number,
  paidAmount:
    number
): number {
  return Math.max(
    0,
    totalAmount -
      paidAmount
  );
}

/* ============================================================================
 * End of Payment Model - Part C
 * ============================================================================
 */