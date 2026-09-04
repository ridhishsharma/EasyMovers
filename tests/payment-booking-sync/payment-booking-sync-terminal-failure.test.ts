import {
  equal,
} from "node:assert";

import {
  test,
} from "node:test";

import type {
  Payment,
} from "../../domains/payment/models/payment.model";

import type {
  PaymentService,
} from "../../domains/payment/services/payment.service";

import type {
  BookingService,
} from "../../domains/booking/services/booking.service";

import type {
  PaymentBookingSyncRepositoryPort,
  PaymentBookingSyncRepositoryRecord,
} from "../../domains/payment/repositories/payment.repository";

import {
  PaymentBookingSyncService,
} from "../../application/payments/services/payment-booking-sync.service";

/* ============================================================================
 * Test fixture
 * ============================================================================
 */

const paymentUpdatedAt =
  "2026-09-04T12:30:00.000Z";

const payment =
  {
    paymentId:
      "PAY-TERMINAL-RETRY-TEST-001",

    bookingId:
      "BOOKING-TERMINAL-RETRY-TEST-001",

    payable: {
      totalAmount:
        10000,

      paidAmount:
        5000,

      balanceAmount:
        5000,

      paymentPending:
        5000,

      currency:
        "INR",
    },

    refundSummary: {
      totalRefundedAmount:
        0,

      refundPendingAmount:
        0,

      currency:
        "INR",
    },

    audit: {
      createdAt:
        "2026-09-04T12:00:00.000Z",

      updatedAt:
        paymentUpdatedAt,

      createdBy:
        "PAYMENT_SYNC_TEST",

      updatedBy:
        "PAYMENT_SYNC_TEST",

      source:
        "API",
    },
  } as unknown as
    Payment;

/* ============================================================================
 * Terminal retry test
 * ============================================================================
 */

test(
  "Payment Booking synchronization becomes terminal after five failures",
  async () => {
    let record:
      PaymentBookingSyncRepositoryRecord =
        {
          id:
            "SYNC-TERMINAL-RETRY-TEST-001",

          paymentId:
            payment.paymentId,

          bookingId:
            payment.bookingId,

          status:
            "PENDING",

          paymentUpdatedAt,

          paymentSnapshot: {
            totalAmount:
              10000,

            paidAmount:
              5000,

            balanceAmount:
              5000,

            paymentPending:
              5000,

            refundedAmount:
              0,

            refundPendingAmount:
              0,

            currency:
              "INR",
          },

          attemptCount:
            0,

          requestedBy:
            "PAYMENT_SYNC_TEST",

          createdAt:
            "2026-09-04T12:30:00.000Z",

          updatedAt:
            "2026-09-04T12:30:00.000Z",
        };

    let retryPendingWrites =
      0;

    let failedWrites =
      0;

    const syncRepository =
      {
        async findBookingSyncByPaymentId() {
          return record;
        },

        async upsertPendingBookingSync() {
          return record;
        },

        async markBookingSyncRetryPending(
          input:
            Parameters<
              PaymentBookingSyncRepositoryPort[
                "markBookingSyncRetryPending"
              ]
            >[0]
        ) {
          retryPendingWrites +=
            1;

          record = {
            ...record,

            status:
              "RETRY_PENDING",

            attemptCount:
              record.attemptCount +
              1,

            lastAttemptAt:
              input.attemptedAt,

            nextRetryAt:
              input.nextRetryAt,

            lastErrorCode:
              input.errorCode,

            lastErrorMessage:
              input.errorMessage,

            updatedAt:
              input.attemptedAt,
          };

          return record;
        },

        async markBookingSyncFailed(
          input:
            Parameters<
              PaymentBookingSyncRepositoryPort[
                "markBookingSyncFailed"
              ]
            >[0]
        ) {
          failedWrites +=
            1;

          record = {
            ...record,

            status:
              "FAILED",

            attemptCount:
              record.attemptCount +
              1,

            lastAttemptAt:
              input.attemptedAt,

            nextRetryAt:
              undefined,

            synchronizedAt:
              undefined,

            lastErrorCode:
              input.errorCode,

            lastErrorMessage:
              input.errorMessage,

            updatedAt:
              input.attemptedAt,
          };

          return record;
        },

        async markBookingSyncSynchronized() {
          throw new Error(
            "Successful synchronization was not expected."
          );
        },
      } as unknown as
        PaymentBookingSyncRepositoryPort;

    const paymentService =
      {
        async getRequiredPayment() {
          return payment;
        },
      } as unknown as
        PaymentService;

    const bookingService =
      {
        async updatePayment() {
          return {
            success:
              false,

            errorCode:
              "BOOKING_TEST_FAILURE",

            message:
              "Intentional Booking synchronization failure.",
          };
        },
      } as unknown as
        BookingService;

    const service =
      new PaymentBookingSyncService({
        paymentService,

        bookingService,

        syncRepository,
      });

    for (
      let attempt = 1;
      attempt <=
        4;
      attempt +=
        1
    ) {
      const result =
        await service
          .syncPaymentToBooking({
            paymentId:
              payment.paymentId,

            updatedBy:
              "PAYMENT_SYNC_TERMINAL_TEST",
          });

      equal(
        result.success,
        false
      );

      equal(
        result.retryable,
        true
      );

      equal(
        result.errorCode,
        "BOOKING_TEST_FAILURE"
      );

      equal(
        record.status,
        "RETRY_PENDING"
      );

      equal(
        record.attemptCount,
        attempt
      );
    }

    const terminalResult =
      await service
        .syncPaymentToBooking({
          paymentId:
            payment.paymentId,

          updatedBy:
            "PAYMENT_SYNC_TERMINAL_TEST",
        });

    equal(
      terminalResult.success,
      false
    );

    equal(
      terminalResult.retryable,
      false
    );

    equal(
      terminalResult.errorCode,
      "BOOKING_PAYMENT_SYNC_RETRY_EXHAUSTED"
    );

    equal(
      record.status,
      "FAILED"
    );

    equal(
      record.attemptCount,
      5
    );

    equal(
      retryPendingWrites,
      4
    );

    equal(
      failedWrites,
      1
    );
  }
);