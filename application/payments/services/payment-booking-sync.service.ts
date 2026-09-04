/* ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization
 * Application Service
 * ============================================================================
 *
 * Coordinates the Payment and Booking domains after a successful financial
 * mutation.
 *
 * IMPORTANT:
 *
 * - Payment is the authoritative source for financial state.
 * - Booking stores an operational financial projection.
 * - paidAmount is gross successful collection amount.
 * - Refunds do NOT reduce paidAmount.
 * - refundedAmount and refundPendingAmount are synchronized separately.
 * - This application service does not access Prisma directly.
 * - Domain validation remains inside PaymentService and BookingService.
 * ============================================================================
 */

import type {
  Payment,
} from "../../../domains/payment/models/payment.model";

import type {
  PaymentService,
} from "../../../domains/payment/services/payment.service";

import type {
  BookingService,
} from "../../../domains/booking/services/booking.service";

import type {
  BookingPaymentSummary,
} from "../../../domains/booking/models/booking.model";

import type {
  PaymentBookingSyncRepositoryPort,
} from "../../../domains/payment/repositories/payment.repository";

import {
  PaymentBookingSyncError,
} from "../models/payment-booking-sync.model";

import type {
  PaymentBookingFinancialSnapshot,
  SyncPaymentToBookingInput,
  SyncPaymentToBookingResult,
} from "../models/payment-booking-sync.model";

/* ============================================================================
 * Dependencies
 * ============================================================================
 */

export interface PaymentBookingSyncServiceDependencies {
  paymentService:
    PaymentService;

  bookingService:
    BookingService;

  syncRepository:
    PaymentBookingSyncRepositoryPort;
}
/* ============================================================================
 * Helpers
 * ============================================================================
 */

function requireSyncText(
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
    throw new PaymentBookingSyncError(
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
 * Build Booking financial projection
 * ============================================================================
 *
 * Payment is authoritative.
 *
 * Gross collection state:
 *
 * totalAmount
 * paidAmount
 * balanceAmount
 * paymentPending
 *
 * Refund state:
 *
 * refundedAmount
 * refundPendingAmount
 * ============================================================================
 */

function buildBookingPaymentSummary(
  payment:
    Payment
): BookingPaymentSummary {
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
  };
}


/* ============================================================================
 * Build authoritative Payment financial snapshot
 * ============================================================================
 */

function buildPaymentFinancialSnapshot(
  payment:
    Payment
): PaymentBookingFinancialSnapshot {
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
 * Build Booking financial snapshot
 * ============================================================================
 */

function buildBookingFinancialSnapshot(
  bookingPayment:
    BookingPaymentSummary,
  currency:
    string
): PaymentBookingFinancialSnapshot {
  return {
    totalAmount:
      bookingPayment
        .totalAmount ??
      0,

    paidAmount:
      bookingPayment
        .paidAmount ??
      0,

    balanceAmount:
      bookingPayment
        .balanceAmount ??
      0,

    paymentPending:
      bookingPayment
        .paymentPending ??
      0,

    refundedAmount:
      bookingPayment
        .refundedAmount ??
      0,

    refundPendingAmount:
      bookingPayment
        .refundPendingAmount ??
      0,

    currency,
  };
}

/* ============================================================================
 * Compare Payment and Booking projections
 * ============================================================================
 */

function paymentBookingSnapshotsMatch(
  payment:
    PaymentBookingFinancialSnapshot,
  booking:
    PaymentBookingFinancialSnapshot
): boolean {
  const tolerance =
    0.001;

  return (
    Math.abs(
      payment.totalAmount -
        booking.totalAmount
    ) <=
      tolerance &&
    Math.abs(
      payment.paidAmount -
        booking.paidAmount
    ) <=
      tolerance &&
    Math.abs(
      payment.balanceAmount -
        booking.balanceAmount
    ) <=
      tolerance &&
    Math.abs(
      payment.paymentPending -
        booking.paymentPending
    ) <=
      tolerance &&
    Math.abs(
      payment.refundedAmount -
        booking.refundedAmount
    ) <=
      tolerance &&
    Math.abs(
      payment.refundPendingAmount -
        booking.refundPendingAmount
    ) <=
      tolerance &&
    payment.currency ===
      booking.currency
  );
}
/* ============================================================================
 * Application Service
 * ============================================================================
 */

export class PaymentBookingSyncService {
  private readonly paymentService:
    PaymentService;

  private readonly bookingService:
    BookingService;

  private readonly syncRepository:
    PaymentBookingSyncRepositoryPort;

    constructor(
    dependencies:
      PaymentBookingSyncServiceDependencies
  ) {
    this.paymentService =
      dependencies.paymentService;

    this.bookingService =
      dependencies.bookingService;

    this.syncRepository =
      dependencies.syncRepository;
  }

  /* ==========================================================================
   * Ensure durable synchronization state
   * ==========================================================================
   */

  private async ensurePendingSynchronizationState(
    payment:
      Payment,
    bookingId:
      string,
    requestedBy:
      string
  ): Promise<
    string
  > {
    const paymentUpdatedAt =
      requireSyncText(
        payment.audit
          .updatedAt,
        "payment.audit.updatedAt"
      );

    const existing =
      await this.syncRepository
        .findBookingSyncByPaymentId(
          payment.paymentId
        );

    /**
     * Preserve the current attempt state when it already represents this exact
     * Payment version.
     */
    if (
      existing &&
      existing.paymentUpdatedAt ===
        paymentUpdatedAt
    ) {
      return paymentUpdatedAt;
    }

    await this.syncRepository
      .upsertPendingBookingSync({
        paymentId:
          payment.paymentId,

        bookingId,

        paymentUpdatedAt,

        paymentSnapshot: {
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
        },

        requestedBy,
      });

    return paymentUpdatedAt;
  }
  /* ==========================================================================
   * Persist retryable synchronization failure
   * ==========================================================================
   */

    private async persistSynchronizationFailure(
    payment:
      Payment,
    paymentUpdatedAt:
      string,
    attemptedAt:
      string,
    errorCode:
      string,
    errorMessage:
      string,
    bookingSnapshot?:
      PaymentBookingFinancialSnapshot
  ): Promise<
    boolean
  > {
    const existing =
      await this.syncRepository
        .findBookingSyncByPaymentId(
          payment.paymentId
        );

    const nextAttemptNumber =
      (
        existing
          ?.attemptCount ??
        0
      ) +
      1;

    const maximumAttempts =
      5;

    const repositoryBookingSnapshot =
      bookingSnapshot
        ? {
            totalAmount:
              bookingSnapshot
                .totalAmount,

            paidAmount:
              bookingSnapshot
                .paidAmount,

            balanceAmount:
              bookingSnapshot
                .balanceAmount,

            paymentPending:
              bookingSnapshot
                .paymentPending,

            refundedAmount:
              bookingSnapshot
                .refundedAmount,

            refundPendingAmount:
              bookingSnapshot
                .refundPendingAmount,

            currency:
              payment.payable
                .currency,
          }
        : undefined;

    /**
     * The fifth failed attempt becomes terminal immediately.
     *
     * markBookingSyncFailed() increments attemptCount atomically, so no
     * RETRY_PENDING write is performed for the same attempt.
     */
    if (
      nextAttemptNumber >=
        maximumAttempts
    ) {
      const failedRecord =
        await this.syncRepository
          .markBookingSyncFailed({
            paymentId:
              payment.paymentId,

            paymentUpdatedAt,

            attemptedAt,

            errorCode,

            errorMessage,

            ...(repositoryBookingSnapshot
              ? {
                  bookingSnapshot:
                    repositoryBookingSnapshot,
                }
              : {}),
          });

      /**
       * A null result means a newer Payment version replaced this attempt.
       * That newer version remains eligible for synchronization.
       */
      return failedRecord
        ? false
        : true;
    }

    const retryDelayMs =
      Math.min(
        30_000 *
          2 **
            Math.max(
              0,
              nextAttemptNumber -
                1
            ),
        15 * 60_000
      );

    const attemptedAtTime =
      new Date(
        attemptedAt
      )
        .getTime();

    const nextRetryAt =
      new Date(
        attemptedAtTime +
          retryDelayMs
      )
        .toISOString();

    await this.syncRepository
      .markBookingSyncRetryPending({
        paymentId:
          payment.paymentId,

        paymentUpdatedAt,

        attemptedAt,

        nextRetryAt,

        errorCode,

        errorMessage,

        ...(repositoryBookingSnapshot
          ? {
              bookingSnapshot:
                repositoryBookingSnapshot,
            }
          : {}),
      });

    return true;
  }
  /* ==========================================================================
   * Synchronize Payment -> Booking
   * ==========================================================================
   */

    async syncPaymentToBooking(
    input:
      SyncPaymentToBookingInput
  ): Promise<
    SyncPaymentToBookingResult
  > {
    const paymentId =
      requireSyncText(
        input.paymentId,
        "paymentId"
      );

    const updatedBy =
      requireSyncText(
        input.updatedBy,
        "updatedBy"
      );

    /**
     * Payment lookup failures remain hard failures because no authoritative
     * aggregate can be established.
     */
    const payment =
      await this.paymentService
        .getRequiredPayment(
          paymentId
        );

    const bookingId =
      requireSyncText(
        payment.bookingId,
        "payment.bookingId"
      );

    const attemptedAt =
      new Date()
        .toISOString();

    const bookingPaymentSummary =
      buildBookingPaymentSummary(
        payment
      );

        const paymentSnapshot =
      buildPaymentFinancialSnapshot(
        payment
      );

    const paymentUpdatedAt =
      await this
        .ensurePendingSynchronizationState(
          payment,
          bookingId,
          updatedBy
        );

    let bookingResult:
      Awaited<
        ReturnType<
          BookingService["updatePayment"]
        >
      >;

    try {
      bookingResult =
        await this.bookingService
          .updatePayment(
            bookingId,
            bookingPaymentSummary,
            updatedBy
          );
    } catch (
      error
    ) {
      const errorCode =
        "BOOKING_PAYMENT_SYNC_FAILED";

      const errorMessage =
        error instanceof
          Error
          ? error.message
          : "Booking synchronization failed unexpectedly.";

      const retryable =
        await this
          .persistSynchronizationFailure(
            payment,
            paymentUpdatedAt,
            attemptedAt,
            errorCode,
            errorMessage
          );

      if (
        !retryable
      ) {
        return {
          success:
            false,

          paymentId,

          bookingId,

          synchronized:
            false,

          retryable:
            false,

          payment:
            paymentSnapshot,

          message:
            "Payment committed successfully, but Booking synchronization exhausted its retry limit.",

          errorCode:
            "BOOKING_PAYMENT_SYNC_RETRY_EXHAUSTED",

          attemptedAt,
        };
      }

      return {
        success:
          false,

        paymentId,

        bookingId,

        synchronized:
          false,

        retryable:
          true,

        payment:
          paymentSnapshot,

        message:
          "Payment committed successfully, but Booking synchronization is pending.",

        errorCode,

        attemptedAt,
      };
    }

       if (
      !bookingResult.success ||
      !bookingResult.booking
    ) {
      const errorCode =
        bookingResult.errorCode ??
        "BOOKING_PAYMENT_SYNC_FAILED";

      const errorMessage =
        bookingResult.message ??
        "Booking synchronization failed.";

            const retryable =
        await this
          .persistSynchronizationFailure(
            payment,
            paymentUpdatedAt,
            attemptedAt,
            errorCode,
            errorMessage
          );

      if (
        !retryable
      ) {
        return {
          success:
            false,

          paymentId,

          bookingId,

          synchronized:
            false,

          retryable:
            false,

          payment:
            paymentSnapshot,

          message:
            "Payment committed successfully, but Booking synchronization exhausted its retry limit.",

          errorCode:
            "BOOKING_PAYMENT_SYNC_RETRY_EXHAUSTED",

          attemptedAt,
        };
      }

      return {
        success:
          false,

        paymentId,

        bookingId,

        synchronized:
          false,

        retryable:
          true,

        payment:
          paymentSnapshot,

        message:
          "Payment committed successfully, but Booking synchronization is pending.",

        errorCode,

        attemptedAt,
      };
    }
    const bookingPayment =
      bookingResult.booking
        .payment;

        if (
      !bookingPayment
    ) {
      const errorCode =
        "BOOKING_PAYMENT_SUMMARY_MISSING";

      const errorMessage =
        "Booking returned no payment summary after synchronization.";

      const retryable =
        await this
          .persistSynchronizationFailure(
            payment,
            paymentUpdatedAt,
            attemptedAt,
            errorCode,
            errorMessage
          );

      if (
        !retryable
      ) {
        return {
          success:
            false,

          paymentId,

          bookingId,

          synchronized:
            false,

          retryable:
            false,

          payment:
            paymentSnapshot,

          message:
            "Payment committed successfully, but Booking synchronization exhausted its retry limit.",

          errorCode:
            "BOOKING_PAYMENT_SYNC_RETRY_EXHAUSTED",

          attemptedAt,
        };
      }

      return {
        success:
          false,

        paymentId,

        bookingId,

        synchronized:
          false,

        retryable:
          true,

        payment:
          paymentSnapshot,

        message:
          "Payment committed successfully, but Booking returned no payment summary.",

        errorCode,

        attemptedAt,
      };
    }

    const bookingSnapshot =
      buildBookingFinancialSnapshot(
        bookingPayment,
        paymentSnapshot
          .currency
      );

                if (
      !paymentBookingSnapshotsMatch(
        paymentSnapshot,
        bookingSnapshot
      )
    ) {
      const errorCode =
        "BOOKING_PAYMENT_SYNC_MISMATCH";

      const errorMessage =
        "Booking payment projection does not match the authoritative Payment projection.";

      const retryable =
        await this
          .persistSynchronizationFailure(
            payment,
            paymentUpdatedAt,
            attemptedAt,
            errorCode,
            errorMessage,
            bookingSnapshot
          );

      if (
        !retryable
      ) {
        return {
          success:
            false,

          paymentId,

          bookingId,

          synchronized:
            false,

          retryable:
            false,

          payment:
            paymentSnapshot,

          booking:
            bookingSnapshot,

          message:
            "Payment committed successfully, but Booking synchronization exhausted its retry limit.",

          errorCode:
            "BOOKING_PAYMENT_SYNC_RETRY_EXHAUSTED",

          attemptedAt,
        };
      }

      return {
        success:
          false,

        paymentId,

        bookingId,

        synchronized:
          false,

        retryable:
          true,

        payment:
          paymentSnapshot,

        booking:
          bookingSnapshot,

        message:
          "Payment committed successfully, but Booking synchronization couldBELERIFY.",

        errorCode,

        attemptedAt,
      };
    }
    const persistedSynchronization =
      await this.syncRepository
        .markBookingSyncSynchronized({
          paymentId,

          paymentUpdatedAt,

          bookingSnapshot: {
            totalAmount:
              bookingSnapshot
                .totalAmount,

            paidAmount:
              bookingSnapshot
                .paidAmount,

            balanceAmount:
              bookingSnapshot
                .balanceAmount,

            paymentPending:
              bookingSnapshot
                .paymentPending,

            refundedAmount:
              bookingSnapshot
                .refundedAmount,

            refundPendingAmount:
              bookingSnapshot
                .refundPendingAmount,

            currency:
              payment.payable
                .currency,
          },

          attemptedAt,

          synchronizedAt:
            attemptedAt,
        });

    /**
     * A null result means a newer Payment version replaced the outbox record
     * while this Booking update was running. The older attempt must not mark
     * the newer projection as synchronized.
     */
    if (
      !persistedSynchronization
    ) {
      return {
        success:
          false,

        paymentId,

        bookingId,

        synchronized:
          false,

        retryable:
          true,

        payment:
          paymentSnapshot,

        booking:
          bookingSnapshot,

        message:
          "Booking was updated, but a newer Payment version requires synchronization.",

        errorCode:
          "BOOKING_PAYMENT_SYNC_STALE",

        attemptedAt,
      };
    }

    return {
      success:
        true,

      paymentId,

      bookingId,

      synchronized:
        true,

      retryable:
        false,

      payment:
        paymentSnapshot,

      booking:
        bookingSnapshot,

      message:
        "Payment financials synchronized to Booking successfully.",

      attemptedAt,
    };
  }
}

/* ============================================================================
 * Factory
 * ============================================================================
 */

export function createPaymentBookingSyncService(
  dependencies:
    PaymentBookingSyncServiceDependencies
): PaymentBookingSyncService {
  return new PaymentBookingSyncService(
    dependencies
  );
}

/* ============================================================================
 * End of Payment -> Booking Synchronization Service
 * ============================================================================
 */