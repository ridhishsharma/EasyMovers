/* ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization Retry Processor
 * ============================================================================
 *
 * Processes durable PaymentBookingSync records whose retry time has arrived.
 *
 * IMPORTANT:
 *
 * - The original Payment mutation is never repeated.
 * - Only the idempotent Payment -> Booking synchronization is retried.
 * - Payment remains the authoritative financial source.
 * - Processing is bounded by batchSize.
 * - One record failure does not stop the remaining batch.
 * ============================================================================
 */

import type {
  PaymentBookingSyncRepositoryPort,
} from "../../../domains/payment/repositories/payment.repository";

import type {
  PaymentBookingSyncRetryItemResult,
  ProcessPaymentBookingSyncRetriesInput,
  ProcessPaymentBookingSyncRetriesResult,
} from "../models/payment-booking-sync.model";

import type {
  PaymentBookingSyncService,
} from "./payment-booking-sync.service";

/* ============================================================================
 * Dependencies
 * ============================================================================
 */

export interface PaymentBookingSyncRetryServiceDependencies {
  syncRepository:
    PaymentBookingSyncRepositoryPort;

  syncService:
    PaymentBookingSyncService;
}

/* ============================================================================
 * Constants
 * ============================================================================
 */

const DEFAULT_RETRY_BATCH_SIZE =
  25;

const MAXIMUM_RETRY_BATCH_SIZE =
  100;

/**
 * Prevent another worker from processing the same synchronization record.
 *
 * An expired lease automatically restores the record after a worker crash.
 */
const RETRY_PROCESSING_LEASE_MS =
  5 *
  60 *
  1000;
/* ============================================================================
 * Validation helpers
 * ============================================================================
 */

function requireRetryText(
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
    throw new Error(
      `${field} is required.`
    );
  }

  return value.trim();
}

function normalizeRetryBatchSize(
  value:
    unknown
): number {
  if (
    value ===
      undefined
  ) {
    return DEFAULT_RETRY_BATCH_SIZE;
  }

  if (
    typeof value !==
      "number" ||
    !Number.isInteger(
      value
    ) ||
    value <
      1 ||
    value >
      MAXIMUM_RETRY_BATCH_SIZE
  ) {
    throw new Error(
      `batchSize must be an integer between 1 and ${MAXIMUM_RETRY_BATCH_SIZE}.`
    );
  }

  return value;
}

function normalizeRetryDueAt(
  value:
    unknown
): string {
  if (
    value ===
      undefined
  ) {
    return new Date()
      .toISOString();
  }

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      "dueAt must be a valid ISO timestamp."
    );
  }

  const dueAt =
    new Date(
      value
    );

  if (
    Number.isNaN(
      dueAt.getTime()
    )
  ) {
    throw new Error(
      "dueAt must be a valid ISO timestamp."
    );
  }

  return dueAt
    .toISOString();
}

/* ============================================================================
 * Retry service
 * ============================================================================
 */

export class PaymentBookingSyncRetryService {
  private readonly syncRepository:
    PaymentBookingSyncRepositoryPort;

  private readonly syncService:
    PaymentBookingSyncService;

  constructor(
    dependencies:
      PaymentBookingSyncRetryServiceDependencies
  ) {
    this.syncRepository =
      dependencies.syncRepository;

    this.syncService =
      dependencies.syncService;
  }

  /* ==========================================================================
   * Process due synchronization records
   * ==========================================================================
   */

  async processRetries(
    input:
      ProcessPaymentBookingSyncRetriesInput
  ): Promise<
    ProcessPaymentBookingSyncRetriesResult
  > {
    const processedBy =
      requireRetryText(
        input.processedBy,
        "processedBy"
      );

    const dueAt =
      normalizeRetryDueAt(
        input.dueAt
      );

    const batchSize =
      normalizeRetryBatchSize(
        input.batchSize
      );

        const leaseBaseTime =
      Math.max(
        Date.now(),
        new Date(
          dueAt
        ).getTime()
      );

    const leaseUntil =
      new Date(
        leaseBaseTime +
          RETRY_PROCESSING_LEASE_MS
      )
        .toISOString();

    const records =
      await this.syncRepository
        .claimRetryableBookingSyncs({
          dueAt,

          leaseUntil,

          limit:
            batchSize,
        });

    const items:
      PaymentBookingSyncRetryItemResult[] =
        [];

    let synchronized =
      0;

    let retryPending =
      0;

    let failed =
      0;

    let skipped =
      0;

    for (
      const record of
        records
    ) {
      try {
        const result =
          await this.syncService
            .syncPaymentToBooking({
              paymentId:
                record.paymentId,

              updatedBy:
                processedBy,
            });

        const attemptedAt =
          result.attemptedAt ??
          new Date()
            .toISOString();

        if (
          result.success
        ) {
          synchronized +=
            1;

          items.push({
            paymentId:
              result.paymentId,

            bookingId:
              result.bookingId,

            status:
              "SYNCHRONIZED",

            success:
              true,

            retryable:
              false,

            message:
              result.message,

            attemptedAt,
          });

          continue;
        }

        if (
          result.retryable
        ) {
          retryPending +=
            1;

          items.push({
            paymentId:
              result.paymentId,

            bookingId:
              result.bookingId,

            status:
              "RETRY_PENDING",

            success:
              false,

            retryable:
              true,

            message:
              result.message,

            errorCode:
              result.errorCode,

            attemptedAt,
          });

          continue;
        }

        failed +=
          1;

        items.push({
          paymentId:
            result.paymentId,

          bookingId:
            result.bookingId,

          status:
            "FAILED",

          success:
            false,

          retryable:
            false,

          message:
            result.message,

          errorCode:
            result.errorCode,

          attemptedAt,
        });
      } catch (
        error
      ) {
        const attemptedAt =
          new Date()
            .toISOString();

        const errorMessage =
          error instanceof
            Error
            ? error.message
            : "Payment Booking synchronization retry failed unexpectedly.";

        /**
         * A thrown error indicates that the authoritative Payment could not be
         * loaded or another hard application failure occurred.
         *
         * Mark the matching Payment version as terminal when possible.
         */
        try {
          const failedRecord =
            await this.syncRepository
              .markBookingSyncFailed({
                paymentId:
                  record.paymentId,

                paymentUpdatedAt:
                  record.paymentUpdatedAt,

                attemptedAt,

                errorCode:
                  "PAYMENT_BOOKING_SYNC_RETRY_FAILED",

                errorMessage,
              });

          if (
            failedRecord
          ) {
            failed +=
              1;

            items.push({
              paymentId:
                record.paymentId,

              bookingId:
                record.bookingId,

              status:
                "FAILED",

              success:
                false,

              retryable:
                false,

              message:
                "Payment Booking synchronization retry failed permanently.",

              errorCode:
                "PAYMENT_BOOKING_SYNC_RETRY_FAILED",

              attemptedAt,
            });

            continue;
          }
        } catch {
          /**
           * Preserve batch isolation if the terminal state itself cannot be
           * persisted. The existing durable record remains available.
           */
        }

        skipped +=
          1;

        items.push({
          paymentId:
            record.paymentId,

          bookingId:
            record.bookingId,

          status:
            "SKIPPED",

          success:
            false,

          retryable:
            true,

          message:
            "Synchronization retry could not be completed or safely persisted.",

          errorCode:
            "PAYMENT_BOOKING_SYNC_RETRY_SKIPPED",

          attemptedAt,
        });
      }
    }

    return {
      success:
        true,

      scanned:
        records.length,

      synchronized,

      retryPending,

      failed,

      skipped,

      items,

      processedAt:
        new Date()
          .toISOString(),
    };
  }
}

/* ============================================================================
 * Factory
 * ============================================================================
 */

export function createPaymentBookingSyncRetryService(
  dependencies:
    PaymentBookingSyncRetryServiceDependencies
): PaymentBookingSyncRetryService {
  return new PaymentBookingSyncRetryService(
    dependencies
  );
}

/* ============================================================================
 * End of Payment -> Booking Synchronization Retry Processor
 * ============================================================================
 */