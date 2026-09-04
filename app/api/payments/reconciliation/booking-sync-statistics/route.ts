/**
 * ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization Statistics Route
 * ============================================================================
 *
 * File:
 * app/api/payments/reconciliation/booking-sync-statistics/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/reconciliation/booking-sync-statistics
 *
 * Purpose:
 *
 * Provide protected operational statistics for the durable
 * Payment -> Booking synchronization queue.
 * ============================================================================
 */

import {
  requirePaymentApiRepository,
  resolvePaymentApiApplicationModule,
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
 * Authorization
 * ============================================================================
 */

function isAuthorized(
  request:
    Request
): boolean {
  const configuredSecret =
    process.env
      .PAYMENT_SYNC_RETRY_SECRET
      ?.trim();

  const suppliedSecret =
    request.headers
      .get(
        "x-payment-sync-retry-secret"
      )
      ?.trim();

  return Boolean(
    configuredSecret &&
    suppliedSecret &&
    suppliedSecret ===
      configuredSecret
  );
}

/* ============================================================================
 * Resolve observation timestamp
 * ============================================================================
 */

function resolveObservedAt(
  request:
    Request
):
  | {
      success:
        true;

      value:
        string;
    }
  | {
      success:
        false;

      value:
        unknown;
    } {
  const requestUrl =
    new URL(
      request.url
    );

  const suppliedObservedAt =
    requestUrl
      .searchParams
      .get(
        "observedAt"
      );

  if (
    suppliedObservedAt ===
      null ||
    !suppliedObservedAt.trim()
  ) {
    return {
      success:
        true,

      value:
        new Date()
          .toISOString(),
    };
  }

  const observedAt =
    new Date(
      suppliedObservedAt
    );

  if (
    Number.isNaN(
      observedAt.getTime()
    )
  ) {
    return {
      success:
        false,

      value:
        suppliedObservedAt,
    };
  }

  return {
    success:
      true,

    value:
      observedAt
        .toISOString(),
  };
}

/* ============================================================================
 * GET /api/payments/reconciliation/booking-sync-statistics
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
     * Protect operational queue information
     * ----------------------------------------------------------------------
     */

    if (
      !isAuthorized(
        request
      )
    ) {
      return PaymentApiResponse
        .failure(
          401,
          "PAYMENT_SYNC_STATISTICS_UNAUTHORIZED",
          "Valid Payment synchronization statistics authorization is required.",
          requestId
        );
    }

    /* ----------------------------------------------------------------------
     * Validate optional observation timestamp
     *     *
     * When omitted, the current server timestamp is used.
     * ----------------------------------------------------------------------
     */

    const observedAt =
      resolveObservedAt(
        request
      );

    if (
      !observedAt.success
    ) {
      return PaymentApiResponse
        .badRequest(
          "PAYMENT_SYNC_STATISTICS_INVALID_OBSERVED_AT",
          "observedAt must be a valid ISO timestamp.",
          requestId,
          {
            field:
              "observedAt",

            value:
              observedAt.value,
          }
        );
    }

    /* ----------------------------------------------------------------------
     * Initialize the application and resolve the repository
     * ----------------------------------------------------------------------
     */

    await resolvePaymentApiApplicationModule();

    const repository =
      requirePaymentApiRepository();

    /* ----------------------------------------------------------------------
     * Read synchronization statistics
     * ----------------------------------------------------------------------
     */

    const statistics =
      await repository
        .getBookingSyncStatistics({
          observedAt:
            observedAt.value,
        });

    /* ----------------------------------------------------------------------
     * Return operational snapshot
     * ----------------------------------------------------------------------
     */

    return PaymentApiResponse
      .success(
        {
          success:
            true,

          queue:
            statistics,

          healthy:
            statistics.failed ===
              0 &&
            statistics.due ===
              0,

          requiresAttention:
            statistics.failed >
              0 ||
            statistics.due >
              0,

          message:
            statistics.failed >
              0
              ? "Payment synchronization contains terminal failures requiring attention."
              : statistics.due >
                  0
                ? "Payment synchronization records are ready for retry processing."
                : "Payment synchronization queue is healthy.",
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
 * End of Payment -> Booking Synchronization Statistics Route
 * ============================================================================
 */