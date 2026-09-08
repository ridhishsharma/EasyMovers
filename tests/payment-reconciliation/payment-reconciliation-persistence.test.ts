import {
  deepStrictEqual,
  equal,
  ok,
} from "node:assert";

import {
  test,
} from "node:test";

import {
  PaymentCurrency,
  PaymentProvider,
} from "../../domains/payment/models/payment.model";

import type {
  SavePaymentReconciliationRepositoryInput,
} from "../../domains/payment/repositories/payment.repository";

import {
  savePrismaPaymentReconciliation,
} from "../../domains/payment/repositories/payment.prisma.repository";

import type {
  PrismaPaymentRepositoryClient,
} from "../../domains/payment/repositories/payment.prisma.repository";

/* ============================================================================
 * Reconciliation persistence
 * ============================================================================
 */

test(
  "Payment reconciliation preserves provider reference and observation time",
  async () => {
    const paymentId =
      "PAY-RECONCILIATION-PERSISTENCE-TEST-001";

    const providerReference =
      "PROVIDER-RECONCILIATION-REFERENCE-001";

    const observedAt =
      "2026-09-08T17:01:00.000Z";

    const reconciledAt =
      "2026-09-08T17:01:05.462Z";

    const writes:
      Array<{
        data:
          Record<
            string,
            unknown
          >;
      }> =
        [];

    const prisma =
      {
        paymentReconciliation: {
          async create(
            input: {
              data:
                Record<
                  string,
                  unknown
                >;
            }
          ) {
            writes.push(
              input
            );

            return {};
          },
        },
      } as unknown as
        PrismaPaymentRepositoryClient;

    const input:
      SavePaymentReconciliationRepositoryInput = {
        paymentId,

        observed: {
          provider:
            PaymentProvider.OTHER,

          collectedAmount:
            23364,

          refundedAmount:
            3000,

          currency:
            PaymentCurrency.INR,

          providerReference,

          observedAt,
        },

        result: {
          paymentId,

          reconciled:
            true,

          expected: {
            paymentId,

            totalAmount:
              23364,

            paidAmount:
              23364,

            refundedAmount:
              3000,

            balanceAmount:
              0,

            currency:

              PaymentCurrency.INR,
          },

          observed: {
            provider:
              PaymentProvider.OTHER,

            collectedAmount:
              23364,

            refundedAmount:
              3000,

            currency:
              PaymentCurrency.INR,

            providerReference,

            observedAt,
          },

          differences:
            [],

          reconciledAt,

          reconciledBy:
            "PAYMENT_RECONCILIATION_TEST",
        },
      };

    const result =
      await savePrismaPaymentReconciliation(
        prisma,
        input
      );

    equal(
      writes.length,
      1
    );

    const write =
      writes[0];

    ok(
      write
    );

    equal(
      write.data
        .paymentId,
      paymentId
    );

    equal(
      write.data
        .provider,
      PaymentProvider.OTHER
    );

    equal(
      write.data
        .providerReference,
      providerReference
    );

    ok(
      write.data
        .observedAt instanceof
        Date
    );

    equal(
      (
        write.data
          .observedAt as Date
      ).toISOString(),
      observedAt
    );

    ok(
      write.data
        .reconciledAt instanceof
        Date
    );

    equal(
      (
        write.data
          .reconciledAt as Date
      ).toISOString(),
      reconciledAt
    );

    deepStrictEqual(
      result,
      input.result
    );
  }
);