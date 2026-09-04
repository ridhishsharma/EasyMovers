/* ============================================================================
 * EasyMovers
 * Payment Refund Workflow
 * Application Service
 * ============================================================================
 *
 * Coordinates Payment refund mutations with Booking financial synchronization.
 *
 * RESPONSIBILITIES:
 *
 * - PaymentService remains authoritative for refund business rules.
 * - PaymentService performs refund persistence.
 * - PaymentBookingSyncService projects the resulting Payment financial state
 *   into Booking.
 * - This application layer performs orchestration only.
 * - No Prisma or repository access belongs here.
 *
 * REFUND LIFECYCLE:
 *
 * requestRefund()
 *      ↓
 * refundPendingAmount increases
 *      ↓
 * Booking synchronized
 *
 * completeRefund()
 *      ↓
 * refundedAmount increases
 * refundPendingAmount decreases
 *      ↓
 * Booking synchronized
 *
 * failRefund()
 *      ↓
 * refundPendingAmount decreases
 * Payment status recalculated
 *      ↓
 * Booking synchronized
 * ============================================================================
 */

import type {
  Payment,
  PaymentTransaction,
} from "../../../domains/payment/models/payment.model";

import type {
  RequestPaymentRefundServiceInput,
  CompletePaymentRefundServiceInput,
  FailPaymentRefundServiceInput,
  PaymentRefundServiceResult,
} from "../../../domains/payment/services/payment.service";

import type {
  SyncPaymentToBookingResult,
} from "../models/payment-booking-sync.model";

import type {
  PaymentBookingSyncService,
} from "./payment-booking-sync.service";

/* ============================================================================
 * Workflow inputs
 * ============================================================================
 */

/**
 * Application input for requesting a refund.
 *
 * updatedBy is mandatory at application level because the Booking
 * synchronization must always have an audit actor.
 */
export type RequestPaymentRefundWorkflowInput =
  RequestPaymentRefundServiceInput & {
    updatedBy: string;
  };

/**
 * Application input for completing a refund.
 */
export type CompletePaymentRefundWorkflowInput =
  CompletePaymentRefundServiceInput & {
    updatedBy: string;
  };

/**
 * Application input for recording a failed refund.
 */
export type FailPaymentRefundWorkflowInput =
  FailPaymentRefundServiceInput & {
    updatedBy: string;
  };

/* ============================================================================
 * Workflow result
 * ============================================================================
 *
 * All refund lifecycle mutations return the same normalized application shape:
 *
 * - authoritative updated Payment
 * - resulting PaymentTransaction
 * - Payment -> Booking synchronization result
 * ============================================================================
 */

export interface PaymentRefundWorkflowResult {
  success: true;

  payment:
    Payment;

  transaction:
    PaymentTransaction;

  bookingSynchronization:
    SyncPaymentToBookingResult;
}

/* ============================================================================
 * Application error
 * ============================================================================
 */

export class PaymentRefundWorkflowError
  extends Error {
  readonly code:
    string;

  readonly details?:
    Record<
      string,
      unknown
    >;

  constructor(
    code:
      string,
    message:
      string,
    details?:
      Record<
        string,
        unknown
      >
  ) {
    super(
      message
    );

    this.name =
      "PaymentRefundWorkflowError";

    this.code =
      code;

    this.details =
      details;
  }
}

/* ============================================================================
 * Payment refund service port
 * ============================================================================
 *
 * The application workflow depends only on the Payment refund capabilities
 * that it actually needs.
 *
 * PaymentRefundService and CompleteOperationalPaymentService satisfy this
 * contract structurally.
 * ============================================================================
 */

export interface PaymentRefundWorkflowPaymentServicePort {
  requestRefund(
    input:
      RequestPaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  >;

  completeRefund(
    input:
      CompletePaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  >;

  failRefund(
    input:
      FailPaymentRefundServiceInput
  ): Promise<
    PaymentRefundServiceResult
  >;
}

/* ============================================================================
 * Dependencies
 * ============================================================================
 */

export interface PaymentRefundWorkflowServiceDependencies {
  paymentService:
    PaymentRefundWorkflowPaymentServicePort;

  paymentBookingSyncService:
    PaymentBookingSyncService;
}

/* ============================================================================
 * Helpers
 * ============================================================================
 */

function requireRefundWorkflowText(
  value:
    unknown,
  field:
    string
): string {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new PaymentRefundWorkflowError(
      "INVALID_INPUT",
      `${field} is required.`,
      {
        field,
        value,
      }
    );
  }

  return value.trim();
}

/* ============================================================================
 * Result validation
 * ============================================================================
 */

function requireRefundWorkflowResult(
  result:
    PaymentRefundServiceResult,
  paymentId:
    string,
  operation:
    "REQUEST" |
    "COMPLETE" |
    "FAIL"
): {
  payment:
    Payment;

  transaction:
    PaymentTransaction;
} {
  const payment =
    result.payment;

  const transaction =
    result.transaction;

  if (
    !payment
  ) {
    throw new PaymentRefundWorkflowError(
      "PAYMENT_REFUND_RESULT_MISSING_PAYMENT",
      `${operation} refund operation completed without returning the updated Payment.`,
      {
        paymentId,
        operation,
      }
    );
  }

  if (
    !transaction
  ) {
    throw new PaymentRefundWorkflowError(
      "PAYMENT_REFUND_RESULT_MISSING_TRANSACTION",
      `${operation} refund operation completed without returning the Payment transaction.`,
      {
        paymentId,
        operation,
      }
    );
  }

  return {
    payment,
    transaction,
  };
}

/* ============================================================================
 * Payment Refund Workflow Service
 * ============================================================================
 */

export class PaymentRefundWorkflowService {
  private readonly paymentService:
    PaymentRefundWorkflowPaymentServicePort;

  private readonly paymentBookingSyncService:
    PaymentBookingSyncService;

  constructor(
    dependencies:
      PaymentRefundWorkflowServiceDependencies
  ) {
    this.paymentService =
      dependencies.paymentService;

    this.paymentBookingSyncService =
      dependencies.paymentBookingSyncService;
  }

  /* ==========================================================================
   * Request refund
   * ==========================================================================
   *
   * Flow:
   *
   * PaymentService.requestRefund()
   *        ↓
   * refundPendingAmount increases
   * Payment status becomes REFUND_PENDING
   *        ↓
   * PaymentBookingSyncService
   *        ↓
   * Booking refund projection synchronized
   * ==========================================================================
   */

  async requestRefund(
    input:
      RequestPaymentRefundWorkflowInput
  ): Promise<
    PaymentRefundWorkflowResult
  > {
    const paymentId =
      requireRefundWorkflowText(
        input.paymentId,
        "paymentId"
      );

    const updatedBy =
      requireRefundWorkflowText(
        input.updatedBy,
        "updatedBy"
      );

    const refundResult =
      await this.paymentService
        .requestRefund({
          ...input,

          paymentId,

          updatedBy,
        });

    const {
      payment,
      transaction,
    } =
      requireRefundWorkflowResult(
        refundResult,
        paymentId,
        "REQUEST"
      );

    const bookingSynchronization =
      await this.paymentBookingSyncService
        .syncPaymentToBooking({
          paymentId:
            payment.paymentId,

          updatedBy,
        });

    return {
      success:
        true,

      payment,

      transaction,

      bookingSynchronization,
    };
  }

  /* ==========================================================================
   * Complete refund
   * ==========================================================================
   *
   * Flow:
   *
   * PaymentService.completeRefund()
   *        ↓
   * refundedAmount increases
   * refundPendingAmount decreases
   * Payment status recalculated
   *        ↓
   * PaymentBookingSyncService
   *        ↓
   * Booking refund projection synchronized
   * ==========================================================================
   */

  async completeRefund(
    input:
      CompletePaymentRefundWorkflowInput
  ): Promise<
    PaymentRefundWorkflowResult
  > {
    const paymentId =
      requireRefundWorkflowText(
        input.paymentId,
        "paymentId"
      );

    const updatedBy =
      requireRefundWorkflowText(
        input.updatedBy,
        "updatedBy"
      );

    const refundResult =
      await this.paymentService
        .completeRefund({
          ...input,

          paymentId,

          updatedBy,
        });

    const {
      payment,
      transaction,
    } =
      requireRefundWorkflowResult(
        refundResult,
        paymentId,
        "COMPLETE"
      );

    const bookingSynchronization =
      await this.paymentBookingSyncService
        .syncPaymentToBooking({
          paymentId:
            payment.paymentId,

          updatedBy,
        });

    return {
      success:
        true,

      payment,

      transaction,

      bookingSynchronization,
    };
  }

  /* ==========================================================================
   * Fail refund
   * ==========================================================================
   *
   * Flow:
   *
   * PaymentService.failRefund()
   *        ↓
   * Failed refund transaction persisted
   *        ↓
   * refundPendingAmount decreases
   *        ↓
   * Payment status recalculated
   *        ↓
   * PaymentBookingSyncService
   *        ↓
   * Booking refund projection synchronized
   *
   * IMPORTANT:
   *
   * A failed refund does NOT increase refundedAmount.
   * It releases the corresponding pending-refund amount.
   * ==========================================================================
   */

  async failRefund(
    input:
      FailPaymentRefundWorkflowInput
  ): Promise<
    PaymentRefundWorkflowResult
  > {
    const paymentId =
      requireRefundWorkflowText(
        input.paymentId,
        "paymentId"
      );

    const updatedBy =
      requireRefundWorkflowText(
        input.updatedBy,
        "updatedBy"
      );

    const refundResult =
      await this.paymentService
        .failRefund({
          ...input,

          paymentId,

          updatedBy,
        });

    const {
      payment,
      transaction,
    } =
      requireRefundWorkflowResult(
        refundResult,
        paymentId,
        "FAIL"
      );

    const bookingSynchronization =
      await this.paymentBookingSyncService
        .syncPaymentToBooking({
          paymentId:
            payment.paymentId,

          updatedBy,
        });

    return {
      success:
        true,

      payment,

      transaction,

      bookingSynchronization,
    };
  }
}

/* ============================================================================
 * Factory
 * ============================================================================
 */

export function createPaymentRefundWorkflowService(
  dependencies:
    PaymentRefundWorkflowServiceDependencies
): PaymentRefundWorkflowService {
  return new PaymentRefundWorkflowService(
    dependencies
  );
}

/* ============================================================================
 * End of Payment Refund Workflow
 * ============================================================================
 */