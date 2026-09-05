/**
 * ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization Retry Route
 * ============================================================================
 *
 * POST /api/payments/reconciliation/booking-sync-retries
 *
 * Processes durable PaymentBookingSync records whose nextRetryAt timestamp
 * has arrived.
 *
 * The original Payment mutation is never repeated. Only the idempotent
 * Payment -> Booking synchronization operation is retried.
 * ============================================================================
 */

import {
  resolvePaymentApiBookingSyncRetryService,
} from "../../_lib/payment-api.module";

import {
  PaymentApiRequest,
} from "../../_lib/payment-api.request";

import {
  PaymentApiResponse,
} from "../../_lib/payment-api.response";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Request body
 * ============================================================================
 */

interface PaymentBookingSyncRetryRouteBody {
  processedBy?:
    unknown;

  dueAt?:
    unknown;

  batchSize?:
    unknown;
}

/* ============================================================================
 * Helpers
 * ============================================================================
 */

function isRequestBodyObject(
  value:
    unknown
): value is PaymentBookingSyncRetryRouteBody {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

/* ============================================================================
 * POST /api/payments/reconciliation/booking-sync-retries
 * ============================================================================
 */

export async function POST(
  request:
    Request
) {
  const requestId =
    PaymentApiRequest
      .requestId(
        request
      );

  try {
    /* ------------------------------------------------------------------------
     * Require configured internal secret
     * ------------------------------------------------------------------------
     */

    const configuredSecret =
      process.env
        .PAYMENT_SYNC_RETRY_SECRET
        ?.trim();

    if (
      !configuredSecret
    ) {
      return PaymentApiResponse
        .unavailable(
          "PAYMENT_SYNC_RETRY_NOT_CONFIGURED",
          "Payment synchronization retry processing is not configured.",
          requestId
        );
    }

    const suppliedSecret =
      request.headers
        .get(
          "x-payment-sync-retry-secret"
        )
        ?.trim();

    if (
      !suppliedSecret ||
      suppliedSecret !==
        configuredSecret
    ) {
      return PaymentApiResponse
        .failure(
          401,
          "PAYMENT_SYNC_RETRY_UNAUTHORIZED",
          "Valid Payment synchronization retry authorization is required.",
          requestId
        );
    }

    /* ------------------------------------------------------------------------
     * Parse request body
     * ------------------------------------------------------------------------
     */

    let rawBody:
      unknown;

    try {
      rawBody =
        await request.json();
    } catch {
      return PaymentApiResponse
        .badRequest(
          "INVALID_REQUEST",
          "Request body must contain valid JSON.",
          requestId
        );
    }

    if (
      !isRequestBodyObject(
        rawBody
      )
    ) {
      return PaymentApiResponse
        .badRequest(
          "INVALID_REQUEST",
          "Request body must be a JSON object.",
          requestId
        );
    }

    /* ------------------------------------------------------------------------
     * Resolve processing actor
     * ------------------------------------------------------------------------
     */

    const headerActor =
      request.headers
        .get(
          "x-updated-by"
        )
        ?.trim();

    const bodyActor =
      typeof rawBody
        .processedBy ===
          "string"
        ? rawBody
            .processedBy
            .trim()
        : "";

    const processedBy =
      bodyActor ||
      headerActor ||
      "";

    if (
      !processedBy
    ) {
      return PaymentApiResponse
        .badRequest(
          "INVALID_REQUEST",
          "processedBy is required.",
          requestId,
          {
            field:
              "processedBy",
          }
        );
    }

    /* ------------------------------------------------------------------------
     * Validate optional dueAt
     * ------------------------------------------------------------------------
     */

    if (
      rawBody.dueAt !==
        undefined &&
      (
        typeof rawBody.dueAt !==
          "string" ||
        !rawBody.dueAt.trim() ||
        Number.isNaN(
          new Date(
            rawBody.dueAt
          )
            .getTime()
        )
      )
    ) {
      return PaymentApiResponse
        .badRequest(
          "INVALID_REQUEST",
          "dueAt must be a valid ISO timestamp.",
          requestId,
          {
            field:
              "dueAt",

            value:
              rawBody.dueAt,
          }
        );
    }

    /* ------------------------------------------------------------------------
     * Validate optional batchSize
     * ------------------------------------------------------------------------
     */

    if (
      rawBody.batchSize !==
        undefined &&
      (
        typeof rawBody.batchSize !==
          "number" ||
        !Number.isInteger(
          rawBody.batchSize
        ) ||
        rawBody.batchSize <
          1 ||
        rawBody.batchSize >
          100
      )
    ) {
      return PaymentApiResponse
        .badRequest(
          "INVALID_REQUEST",
          "batchSize must be an integer between 1 and 100.",
          requestId,
          {
            field:
              "batchSize",

            value:
              rawBody.batchSize,
          }
        );
    }

    /* ------------------------------------------------------------------------
     * Resolve shared retry processor
     * ------------------------------------------------------------------------
     */

    const retryService =
      await resolvePaymentApiBookingSyncRetryService();

    /* ------------------------------------------------------------------------
     * Process due synchronization records
     * ------------------------------------------------------------------------
     */

    const result =
      await retryService
        .processRetries({
          processedBy,

          ...(typeof rawBody.dueAt ===
            "string"
            ? {
                dueAt:
                  rawBody.dueAt,
              }
            : {}),

          ...(typeof rawBody.batchSize ===
            "number"
            ? {
                batchSize:
                  rawBody.batchSize,
              }
            : {}),
        });

    return PaymentApiResponse
      .success(
        result,
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
 * End of Payment -> Booking Synchronization Retry Route
 * ============================================================================
 */