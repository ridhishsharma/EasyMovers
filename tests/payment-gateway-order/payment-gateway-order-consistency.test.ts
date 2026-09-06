import {
  equal,
  rejects,
  throws,
} from "node:assert";

import {
  test,
} from "node:test";

import {
  PaymentCurrency,
  PaymentProvider,
  PaymentStatus,
} from "../../domains/payment/models/payment.model";

import type {
  Payment,
  PaymentTransaction,
} from "../../domains/payment/models/payment.model";

import {
  PaymentServiceError,
  recordSuccessfulPaymentCollection,
  synchronizeSuccessfulCollectionGatewayOrder,
  requireValidPaymentGatewayOrderTransition,
} from "../../domains/payment/services/payment.service";

import type {
  CompleteExtendedPaymentRepository,
  ExtendedPaymentRepositoryTransactionManager,
  PaymentGatewayOrderRepositoryRecord,
  UpdatePaymentGatewayOrderRepositoryInput,
} from "../../domains/payment/repositories/payment.repository";

/* ============================================================================
 * Test identifiers
 * ============================================================================
 */

const paymentId =
  "PAY-GATEWAY-CONSISTENCY-TEST-001";

const bookingId =
  "BOOKING-GATEWAY-CONSISTENCY-TEST-001";

const gatewayOrderId =
  "GW-ORDER-CONSISTENCY-TEST-001";

const gatewayPaymentId =
  "GW-PAYMENT-CONSISTENCY-TEST-001";

const transactionId =
  "PTXN-GATEWAY-CONSISTENCY-TEST-001";

const completedAt =
  "2026-09-06T10:00:00.000Z";

/* ============================================================================
 * Successful collection gateway-order synchronization
 * ============================================================================
 */
test(
  "Gateway-order transition policy permits progression and prevents reopening",
  () => {
    requireValidPaymentGatewayOrderTransition(
      "CREATED",
      "PENDING"
    );

    requireValidPaymentGatewayOrderTransition(
      "CREATED",
      "PAID"
    );

    requireValidPaymentGatewayOrderTransition(
      "PENDING",
      "PAID"
    );

    requireValidPaymentGatewayOrderTransition(
      "PAID",
      "PAID"
    );

    throws(
      () =>
        requireValidPaymentGatewayOrderTransition(
          "PAID",
          "PENDING"
        ),
      (
        error:
          unknown
      ) =>
        error instanceof
          PaymentServiceError &&
        error.code ===
          "BUSINESS_RULE"
    );

    throws(
      () =>
        requireValidPaymentGatewayOrderTransition(
          "CANCELLED",
          "PAID"
        ),
      (
        error:
          unknown
      ) =>
        error instanceof
          PaymentServiceError &&
        error.code ===
          "BUSINESS_RULE"
    );
  }
);
test(
  "Successful gateway collection marks its persisted gateway order PAID",
  async () => {
    const payment =
      {
        paymentId,

        paymentNumber:
          "EMP-GATEWAY-CONSISTENCY-001",

        referenceId:
          "EMP-REF-GATEWAY-CONSISTENCY-001",

        bookingId,

        status:
          PaymentStatus.PENDING,

        payable: {
          totalAmount:
            5000,

          paidAmount:
            0,

          balanceAmount:
            5000,

          paymentPending:
            5000,

          currency:
            PaymentCurrency.INR,
        },

        transactions:
          [],

        refundSummary: {
          totalRefundedAmount:
            0,

          refundPendingAmount:
            0,

          currency:
            PaymentCurrency.INR,
        },

        audit: {
          createdAt:
            "2026-09-06T09:00:00.000Z",

          updatedAt:
            "2026-09-06T09:00:00.000Z",

          createdBy:
            "PAYMENT_GATEWAY_TEST",

          updatedBy:
            "PAYMENT_GATEWAY_TEST",

          source:
            "API",
        },
      } as unknown as
        Payment;

    let gatewayOrder:
      PaymentGatewayOrderRepositoryRecord =
        {
          paymentId,

          provider:
            PaymentProvider.OTHER,

          gatewayOrderId,

          amount:
            5000,

          currency:
            PaymentCurrency.INR,

          status:
            "PENDING",

          createdAt:
            "2026-09-06T09:30:00.000Z",

          updatedAt:
            "2026-09-06T09:30:00.000Z",
        };

    let gatewayOrderLookupCount =
      0;

    let gatewayOrderUpdateCount =
      0;

    let gatewayOrderUpdate:
      UpdatePaymentGatewayOrderRepositoryInput |
      undefined;

    const repository =
      {
        async findById() {
          return payment;
        },

        async findTransactionById() {
          return null;
        },

        async gatewayPaymentIdExists() {
          return false;
        },

        async createTransaction(
          input: {
            transaction:
              PaymentTransaction;
          }
        ) {
          return input.transaction;
        },

        async updateFinancialSummary() {
          return payment;
        },

        async updateStatus(
          input: {
            status:
              PaymentStatus;

            updatedAt:
              string;
          }
        ) {
          return {
            ...payment,

            status:
              input.status,

            payable: {
              ...payment.payable,

              paidAmount:
                5000,

              balanceAmount:
                0,

              paymentPending:
                0,
            },

            audit: {
              ...payment.audit,

              updatedAt:
                input.updatedAt,
            },
          };
        },

        async upsertPendingBookingSync() {
          return {};
        },

        async findGatewayOrderById(
          requestedGatewayOrderId:
            string
        ) {
          gatewayOrderLookupCount +=
            1;

          return requestedGatewayOrderId ===
            gatewayOrderId
            ? gatewayOrder
            : null;
        },

        async updateGatewayOrder(
          input:
            UpdatePaymentGatewayOrderRepositoryInput
        ) {
          gatewayOrderUpdateCount +=
            1;

          gatewayOrderUpdate =
            input;

          gatewayOrder = {
            ...gatewayOrder,

            status:
              input.status ??
              gatewayOrder.status,

            updatedAt:
              input.updatedAt ??
              gatewayOrder.updatedAt,
          };

          return gatewayOrder;
        },
      } as unknown as
        CompleteExtendedPaymentRepository;

    const transactionManager =
      {
        async runInTransaction<T>(
          callback:
            Parameters<
              ExtendedPaymentRepositoryTransactionManager[
                "runInTransaction"
              ]
            >[0]
        ): Promise<T> {
          return callback({
            repository,
          }) as Promise<T>;
        },
      } as
        ExtendedPaymentRepositoryTransactionManager;

    const result =
      await recordSuccessfulPaymentCollection(
        transactionManager,
        {
          paymentId,

          amount:
            5000,

          transactionId,

          provider:
            PaymentProvider.OTHER,

          gateway: {
            provider:
              PaymentProvider.OTHER,

            gatewayOrderId,

            gatewayPaymentId,
          },

          completedAt,

          updatedBy:
            "PAYMENT_GATEWAY_TEST",
        }
      );

    equal(
      result.transaction.status,
      "SUCCESS"
    );

    equal(
      gatewayOrderLookupCount,
      1
    );

    equal(
      gatewayOrderUpdateCount,
      1
    );

    equal(
      gatewayOrderUpdate?.paymentId,
      paymentId
    );

    equal(
      gatewayOrderUpdate?.gatewayOrderId,
      gatewayOrderId
    );

    equal(
      gatewayOrderUpdate?.status,
      "PAID"
    );

    equal(
      gatewayOrder.status,
      "PAID"
    );
  }
);
/* ============================================================================
 * Gateway-order synchronization policy
 * ============================================================================
 */

test(
  "Gateway-order synchronization ignores collections without a gateway order",
  async () => {
    let lookupCount =
      0;

    let updateCount =
      0;

    const repository =
      {
        async findGatewayOrderById() {
          lookupCount +=
            1;

          return null;
        },

        async updateGatewayOrder() {
          updateCount +=
            1;

          throw new Error(
            "Gateway order must not be updated."
          );
        },
      } as unknown as
        CompleteExtendedPaymentRepository;

    await synchronizeSuccessfulCollectionGatewayOrder(
      repository,
      {
        paymentId,
      } as Payment,
      {
        paymentId,

        amount: {
          amount:
            5000,

          currency:
            PaymentCurrency.INR,
        },

        status:
          "SUCCESS",
      } as PaymentTransaction
    );
    equal(
      lookupCount,
      0
    );

    equal(
      updateCount,
      0
    );
  }
);

test(
  "Gateway-order synchronization rejects an unknown gateway order",
  async () => {
    let updateCount =
      0;

    const repository =
      {
        async findGatewayOrderById() {
                   return null;
        },

        async updateGatewayOrder() {
          updateCount +=
            1;

          throw new Error(
            "Unknown gateway order must not be updated."
          );
        },
      } as unknown as
        CompleteExtendedPaymentRepository;

    await rejects(
      () =>
        synchronizeSuccessfulCollectionGatewayOrder(
          repository,
          {
            paymentId,
          } as Payment,
          {
            paymentId,

            amount: {
              amount:
                5000,

              currency:
                PaymentCurrency.INR,
            },

            status:
              "SUCCESS",

            gateway: {
              provider:
                PaymentProvider.OTHER,

              gatewayOrderId,
            },
          } as PaymentTransaction
        ),
      (
        error:
          unknown
      ) =>
        error instanceof
          PaymentServiceError &&
        error.code ===
          "GATEWAY_OPERATION_FAILED"
    );

    equal(
      updateCount,
      0
    );
  }
);

test(
  "Gateway-order synchronization treats an already PAID order as idempotent",
  async () => {
    let updateCount =
      0;

    const repository =
      {
        async findGatewayOrderById() {
          return {
            paymentId,

            provider:
              PaymentProvider.OTHER,

            gatewayOrderId,

            amount:
              5000,

            currency:
              PaymentCurrency.INR,

            status:
              "PAID",

            createdAt:
              "2026-09-06T09:30:00.000Z",

            updatedAt:
              "2026-09-06T10:00:00.000Z",
          } as PaymentGatewayOrderRepositoryRecord;
        },

        async updateGatewayOrder() {
          updateCount +=
            1;

          throw new Error(
            "An already PAID order must not be rewritten."
          );
        },
      } as unknown as
        CompleteExtendedPaymentRepository;

    await synchronizeSuccessfulCollectionGatewayOrder(
      repository,
      {
        paymentId,
      } as Payment,
      {
        paymentId,

        amount: {
          amount:
            5000,

          currency:
            PaymentCurrency.INR,
        },

        status:
          "SUCCESS",

        gateway: {
          provider:
            PaymentProvider.OTHER,

          gatewayOrderId,
        },
      } as PaymentTransaction
    );

    equal(
      updateCount,
      0
    );
  }
);

test(
  "Gateway-order synchronization rejects a terminal gateway order",
  async () => {
    let updateCount =
      0;

    const repository =
      {
        async findGatewayOrderById() {
          return {
            paymentId,

            provider:
              PaymentProvider.OTHER,

            gatewayOrderId,

            amount:
              5000,

            currency:
              PaymentCurrency.INR,

            status:
              "CANCELLED",

            createdAt:
              "2026-09-06T09:30:00.000Z",

            updatedAt:
              "2026-09-06T09:45:00.000Z",
          } as PaymentGatewayOrderRepositoryRecord;
        },

        async updateGatewayOrder() {
          updateCount +=
            1;

          throw new Error(
            "A terminal gateway order must not be updated."
          );
        },
      } as unknown as
        CompleteExtendedPaymentRepository;

    await rejects(
      () =>
        synchronizeSuccessfulCollectionGatewayOrder(
          repository,
          {
            paymentId,
          } as Payment,
          {
            paymentId,

            amount: {
              amount:
                5000,

              currency:
                PaymentCurrency.INR,
            },

            status:
              "SUCCESS",

            gateway: {
              provider:
                PaymentProvider.OTHER,

              gatewayOrderId,
            },
          } as PaymentTransaction
        ),
      (
        error:
          unknown
      ) =>
        error instanceof
          PaymentServiceError &&
        error.code ===
          "BUSINESS_RULE"
    );

    equal(
      updateCount,
      0
    );
  }
);