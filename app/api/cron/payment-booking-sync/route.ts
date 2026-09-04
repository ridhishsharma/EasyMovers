/**
 * ============================================================================
 * EasyMovers
 * Scheduled Payment -> Booking Synchronization Processor
 * ============================================================================
 *
 * File:
 * app/api/cron/payment-booking-sync/route.ts
 *
 * Endpoint:
 *
 * GET /api/cron/payment-booking-sync
 *
 * Purpose:
 *
 * Allow an authorized production scheduler to:
 *
 * - process durable Payment -> Booking synchronization retries;
 * - inspect the queue after processing;
 * - expose queue health for production monitoring;
 * - return HTTP 503 when terminal failures require attention.
 * ============================================================================
 */

import {
  requirePaymentApiRepository,
  resolvePaymentApiBookingSyncRetryService,
} from "../../payments/_lib/payment-api.module";

import {
  PaymentApiRequest,
} from "../../payments/_lib/payment-api.request";

import {
  PaymentApiResponse,
} from "../../payments/_lib/payment-api.response";

import {
  createHash,
  timingSafeEqual,
} from "node:crypto";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

/**
 * Prevent the scheduler invocation from becoming unbounded.
 */
export const maxDuration =
  60;

/* ============================================================================
 * Scheduler configuration
 * ============================================================================
 */

const SCHEDULER_ACTOR =
  "SYSTEM_PAYMENT_BOOKING_SYNC_SCHEDULER";

const SCHEDULER_BATCH_SIZE =
  25;

/* ============================================================================
 * Authorization
 * ============================================================================
 */

function createSecretDigest(
  value:
    string
): Buffer {
  return createHash(
    "sha256"
  )
    .update(
      value,
      "utf8"
    )
    .digest();
}

function isAuthorizedCronRequest(
  request:
    Request
): boolean {
  const cronSecret =
    process.env
      .CRON_SECRET
      ?.trim();

  const authorization =
    request.headers
      .get(
        "authorization"
      )
      ?.trim();

  if (
    !cronSecret ||
    !authorization
  ) {
    return false;
  }

  const expectedAuthorization =
    `Bearer ${cronSecret}`;

  return timingSafeEqual(
    createSecretDigest(
      authorization
    ),
    createSecretDigest(
      expectedAuthorization
    )
  );
}

/* ============================================================================
 * GET /api/cron/payment-booking-sync
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  const requestId =
    PaymentApiRequest
      .requestId(
        request
      );

  try {
    /* ----------------------------------------------------------------------
     * Authenticate scheduler invocation
     * ----------------------------------------------------------------------
     */

    if (
      !isAuthorizedCronRequest(
        request
      )
    ) {
      return PaymentApiResponse
        .failure(
          401,
          "PAYMENT_BOOKING_SYNC_CRON_UNAUTHORIZED",
          "Valid Payment synchronization scheduler authorization is required.",
          requestId
        );
    }

    /* ----------------------------------------------------------------------
     * Resolve shared retry processor
     *
     * This also ensures that the Payment API application module and repository
     * have been initialized before requirePaymentApiRepository() is called.
     * ----------------------------------------------------------------------
     */

    const retryService =
      await resolvePaymentApiBookingSyncRetryService();

    const repository =
      requirePaymentApiRepository();

    const dueAt =
      new Date()
        .toISOString();

    /* ----------------------------------------------------------------------
     * Process one bounded queue batch
     * ----------------------------------------------------------------------
     */

    const result =
      await retryService
        .processRetries({
          processedBy:
            SCHEDULER_ACTOR,

          dueAt,

          batchSize:
            SCHEDULER_BATCH_SIZE,
        });

    /* ----------------------------------------------------------------------
     * Read queue health after processing
     * ----------------------------------------------------------------------
     */

    const observedAt =
      new Date()
        .toISOString();

    const queue =
      await repository
        .getBookingSyncStatistics({
          observedAt,
        });

    const scheduler = {
      actor:
        SCHEDULER_ACTOR,

      batchSize:
        SCHEDULER_BATCH_SIZE,

      dueAt,

      observedAt,
    };

    /* ----------------------------------------------------------------------
     * Raise production monitoring alert for terminal failures
     *
     * RETRY_PENDING records are part of normal retry processing and continue
     * returning HTTP 200.
     *
     * FAILED records are terminal and require operational attention, so the
     * scheduler returns HTTP 503.
     * ----------------------------------------------------------------------
     */

    if (
      queue.failed >
      0
    ) {
      return PaymentApiResponse
        .failure(
          503,
          "PAYMENT_BOOKING_SYNC_CRON_REQUIRES_ATTENTION",
          "Terminal Payment to Booking synchronization failures require operational attention.",
          requestId,
          {
            queue,

            execution:
              result,

            scheduler,
          }
        );
    }

    /* ----------------------------------------------------------------------
     * Return healthy scheduler execution result
     * ----------------------------------------------------------------------
     */

    return PaymentApiResponse
      .success(
        {
          ...result,

          queue,

          healthy:
            true,

          requiresAttention:
            false,

          scheduler,
        },
        200,
        requestId
      );
  } catch (
    error
  ) {
    return PaymentApiResponse
      .handleError(
        error,
        requestId
      );
  }
}

/* ============================================================================
 * End of Scheduled Payment -> Booking Synchronization Processor
 * ============================================================================
 */