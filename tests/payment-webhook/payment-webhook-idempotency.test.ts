import {
  deepStrictEqual,
  equal,
  rejects,
} from "node:assert";

import {
  test,
} from "node:test";

import {
  PaymentProvider,
} from "../../domains/payment/models/payment.model";

import type {
  CompleteExtendedPaymentRepository,
  PaymentWebhookRepositoryRecord,
} from "../../domains/payment/repositories/payment.repository";

import {
  PaymentServiceError,
  recordPaymentWebhook,
} from "../../domains/payment/services/payment.service";

/* ============================================================================
 * Fixtures
 * ============================================================================
 */

const webhookId =
  "WH-WEBHOOK-IDEMPOTENCY-TEST-001";

const providerEventId =
  "EVT-WEBHOOK-IDEMPOTENCY-TEST-001";

const originalPayloadHash =
  "sha256-original-webhook-payload";

const conflictingPayloadHash =
  "sha256-conflicting-webhook-payload";

const existingWebhook:
  PaymentWebhookRepositoryRecord = {
    webhookId,

    provider:
      PaymentProvider.OTHER,

    eventType:
      "PAYMENT_CAPTURED",

    providerEventId,

    payloadHash:
      originalPayloadHash,

    processed:
      false,

    duplicate:
      false,

    receivedAt:
      "2026-09-08T08:00:00.000Z",

    paymentId:
      "PAY-WEBHOOK-IDEMPOTENCY-TEST-001",

    transactionId:
      "PTXN-WEBHOOK-IDEMPOTENCY-TEST-001",
  };

/* ============================================================================
 * Repository fixture
 * ============================================================================
 */

interface WebhookRepositoryFixtureOptions {
  providerEventWebhook?:
    PaymentWebhookRepositoryRecord | null;

  webhookIdWebhook?:
    PaymentWebhookRepositoryRecord | null;
}

function createWebhookRepositoryFixture(
  options:
    WebhookRepositoryFixtureOptions = {}
) {
  let createWebhookWrites =
    0;

  const repository =
    {
      async findWebhookByProviderEventId() {
        return options
          .providerEventWebhook ??
          null;
      },

      async findWebhookById() {
        return options
          .webhookIdWebhook ??
          null;
      },

      async createWebhookRecord(
        input: {
          webhook:
            PaymentWebhookRepositoryRecord;
        }
      ) {
        createWebhookWrites +=
          1;

        return input.webhook;
      },
    } as unknown as
      CompleteExtendedPaymentRepository;

  return {
    repository,

    getCreateWebhookWrites() {
      return createWebhookWrites;
    },
  };
}

/* ============================================================================
 * Same provider event + same payload
 * ============================================================================
 */

test(
  "Webhook replay with the same provider event and payload is idempotent",
  async () => {
    const fixture =
      createWebhookRepositoryFixture({
        providerEventWebhook:
          existingWebhook,
      });

    const result =
      await recordPaymentWebhook(
        fixture.repository,
        {
          webhookId:
            "WH-WEBHOOK-IDEMPOTENCY-REPLAY-001",

          provider:
            PaymentProvider.OTHER,

          eventType:
            "PAYMENT_CAPTURED",

          providerEventId,

          payloadHash:
            originalPayloadHash,

          paymentId:
            existingWebhook.paymentId,

          transactionId:
            existingWebhook.transactionId,
        }
      );

    equal(
      result.duplicate,
      true
    );

    deepStrictEqual(
      result.webhook,
      existingWebhook
    );

    equal(
      fixture.getCreateWebhookWrites(),
      0
    );
  }
);

/* ============================================================================
 * Same provider event + conflicting payload
 * ============================================================================
 */

test(
  "Webhook replay rejects a conflicting payload for the same provider event",
  async () => {
    const originalSnapshot = {
      ...existingWebhook,
    };

    const fixture =
      createWebhookRepositoryFixture({
        providerEventWebhook:
          existingWebhook,
      });

    await rejects(
      () =>
        recordPaymentWebhook(
          fixture.repository,
          {
            webhookId:
              "WH-WEBHOOK-CONFLICTING-PROVIDER-EVENT-001",

            provider:
              PaymentProvider.OTHER,

            eventType:
              "PAYMENT_FAILED",

            providerEventId,

            payloadHash:
              conflictingPayloadHash,

            paymentId:
              existingWebhook.paymentId,
          }
        ),
      (
        error:
          unknown
      ) => {
        if (
          !(
            error instanceof
              PaymentServiceError
          )
        ) {
          return false;
        }

        equal(
          error.code,
          "BUSINESS_RULE"
        );

        equal(
          error.message,
          "Webhook identity is already associated with a different payload."
        );

        equal(
          error.details
            ?.field,
          "providerEventId"
        );

        equal(
          error.details
            ?.value,
          providerEventId
        );

        return true;
      }
    );

    equal(
      fixture.getCreateWebhookWrites(),
      0
    );

    deepStrictEqual(
      existingWebhook,
      originalSnapshot
    );
  }
);

/* ============================================================================
 * Same webhook ID + conflicting payload
 * ============================================================================
 */

test(
  "Webhook replay rejects a conflicting payload for the same webhook ID",
  async () => {
    const originalSnapshot = {
      ...existingWebhook,
    };

    const fixture =
      createWebhookRepositoryFixture({
        providerEventWebhook:
          null,

        webhookIdWebhook:
          existingWebhook,
      });

    await rejects(
      () =>
        recordPaymentWebhook(
          fixture.repository,
          {
            webhookId,

            provider:
              PaymentProvider.OTHER,

            eventType:
              "PAYMENT_FAILED",

            providerEventId:
              "EVT-WEBHOOK-IDEMPOTENCY-TEST-002",

            payloadHash:
              conflictingPayloadHash,

            paymentId:
              existingWebhook.paymentId,
          }
        ),
      (
        error:
          unknown
      ) => {
        if (
          !(
            error instanceof
              PaymentServiceError
          )
        ) {
          return false;
        }

        equal(
          error.code,
          "BUSINESS_RULE"
        );

        equal(
          error.message,
          "Webhook identity is already associated with a different payload."
        );

        equal(
          error.details
            ?.field,
          "webhookId"
        );

        equal(
          error.details
            ?.value,
          webhookId
        );

        return true;
      }
    );

    equal(
      fixture.getCreateWebhookWrites(),
      0
    );

    deepStrictEqual(
      existingWebhook,
      originalSnapshot
    );
  }
);