/* ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization
 * Application Models
 * ============================================================================
 *
 * Application-layer contracts for synchronizing an authoritative Payment
 * aggregate into the Booking payment projection.
 *
 * IMPORTANT:
 *
 * - Payment remains the source of truth for collected money.
 * - Booking keeps only its operational/payment projection.
 * - This layer coordinates domains.
 * - It must not contain Prisma or repository code.
 * ============================================================================
 */

/* ============================================================================
 * Synchronization input
 * ============================================================================
 */

export interface SyncPaymentToBookingInput {
  /**
   * Authoritative Payment aggregate identifier.
   */
  paymentId: string;

  /**
   * Actor responsible for triggering the synchronization.
   *
   * Examples:
   * - PAYMENT_COLLECTION_WORKFLOW
   * - PAYMENT_WEBHOOK
   * - ADMIN
   * - POSTMAN_INTEGRATION_TEST
   */
  updatedBy: string;
}

/* ============================================================================
 * Financial snapshot
 * ============================================================================
 */

export interface PaymentBookingFinancialSnapshot {
  /**
   * Confirmed commercial amount of the Booking/Payment.
   */
  totalAmount: number;

  /**
   * Gross amount successfully collected.
   *
   * IMPORTANT:
   * Refunds do not reduce this value.
   */
  paidAmount: number;

  /**
   * Remaining collection balance.
   *
   * Derived from:
   * totalAmount - paidAmount
   */
  balanceAmount: number;

  /**
   * Amount still pending collection.
   */
  paymentPending: number;

  /**
   * Amount successfully refunded to the customer.
   */
  refundedAmount: number;

  /**
   * Amount requested for refund but not yet completed.
   */
  refundPendingAmount: number;

  /**
   * Financial currency.
   */
  currency: string;
}

/* ============================================================================
 * Synchronization result
 * ============================================================================
 */

/* ============================================================================
 * Successful synchronization result
 * ============================================================================
 */

export interface SuccessfulPaymentBookingSyncResult {
  success:
    true;

  paymentId:
    string;

  bookingId:
    string;

  synchronized:
    true;

  /**
   * The Payment mutation and Booking projection are aligned.
   */
  retryable?:
    false;

  payment:
    PaymentBookingFinancialSnapshot;

  booking:
    PaymentBookingFinancialSnapshot;

  message:
    string;

  /**
   * Optional timestamp for compatibility while synchronization resilience
   * is introduced incrementally.
   */
  attemptedAt?:
    string;

  errorCode?:
    never;
}

/* ============================================================================
 * Pending/retryable synchronization result
 * ============================================================================
 *
 * Payment has already committed successfully, but Booking synchronization
 * did not complete or could not be verified.
 *
 * The client must not repeat the original Payment mutation. Only the
 * idempotent Payment -> Booking synchronization should be retried.
 * ============================================================================
 */

export interface PendingPaymentBookingSyncResult {
  success:
    false;

  paymentId:
    string;

  bookingId:
    string;

  synchronized:
    false;

  retryable:
    true;

  /**
   * Authoritative Payment financial state that Booking must eventually
   * receive.
   */
  payment:
    PaymentBookingFinancialSnapshot;

  /**
   * Present only when Booking returned a financial projection that could be
   * read but did not match Payment.
   */
  booking?:
    PaymentBookingFinancialSnapshot;

  message:
    string;

  errorCode:
    string;

  attemptedAt:
    string;
}

/* ============================================================================
 * Terminal synchronization failure
 * ============================================================================
 *
 * The configured retry limit has been reached. The original Payment mutation
 * remains committed and must never be repeated.
 *
 * Recovery now requires an explicit administrative/manual synchronization
 * action or a newer Payment mutation that creates a new pending version.
 * ============================================================================
 */

export interface FailedPaymentBookingSyncResult {
  success:
    false;

  paymentId:
    string;

  bookingId:
    string;

  synchronized:
    false;

  retryable:
    false;

  /**
   * Authoritative Payment financial state that remains the source of truth.
   */
  payment:
    PaymentBookingFinancialSnapshot;

  /**
   * Present when Booking returned a readable but mismatched projection.
   */
  booking?:
    PaymentBookingFinancialSnapshot;

  message:
    string;

  errorCode:
    string;

  attemptedAt:
    string;
}
/* ============================================================================
 * Synchronization outcome
 * ============================================================================
 */

export type SyncPaymentToBookingResult =
  SuccessfulPaymentBookingSyncResult |
  PendingPaymentBookingSyncResult |
  FailedPaymentBookingSyncResult;

/* ============================================================================
 * Synchronization retry processor
 * ============================================================================
 */

export interface ProcessPaymentBookingSyncRetriesInput {
  processedBy:
    string;

  dueAt?:
    string;

  batchSize?:
    number;
}

export type PaymentBookingSyncRetryItemStatus =
  | "SYNCHRONIZED"
  | "RETRY_PENDING"
  | "FAILED"
  | "SKIPPED";

export interface PaymentBookingSyncRetryItemResult {
  paymentId:
    string;

  bookingId:
    string;

  status:
    PaymentBookingSyncRetryItemStatus;

  success:
    boolean;

  retryable:
    boolean;

  message:
    string;

  errorCode?:
    string;

  attemptedAt:
    string;
}

export interface ProcessPaymentBookingSyncRetriesResult {
  success:
    true;

  scanned:
    number;

  synchronized:
    number;

  retryPending:
    number;

  failed:
    number;

  skipped:
    number;

  items:
    PaymentBookingSyncRetryItemResult[];

  processedAt:
    string;
}
/* ============================================================================
 * Application error
 * ============================================================================
 */

export class PaymentBookingSyncError extends Error {
  readonly code: string;

  readonly details?: Record<
    string,
    unknown
  >;

  constructor(
    code: string,
    message: string,
    details?: Record<
      string,
      unknown
    >
  ) {
    super(message);

    this.name =
      "PaymentBookingSyncError";

    this.code =
      code;

    this.details =
      details;
  }
}