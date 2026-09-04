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
 *
 * IMPORTANT:
 *
 * - Operational data is protected by the internal synchronization secret.
 * - Secret verification uses the shared constant-time authorization helper.
 * - Payment and Booking financial data are not modified by this endpoint.
 * ============================================================================
 */

/* ============================================================================
 * Payment API module
 * ============================================================================
 */

import {
  requirePaymentApiRepository,
  resolvePaymentApiApplicationModule,
} from "../../_lib/payment-api.module";

/* ============================================================================
 * Request adapter
 * ============================================================================
 */

import {
  PaymentApiRequest,
} from "../../_lib/payment-api.request";

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

import {
  PaymentApiResponse,
} from "../../_lib/payment-api.response";

/* ============================================================================
 * Shared internal authorization
 * ============================================================================
 */

import {
  authorizePaymentSyncRequest,
} from "../../_lib/payment-api.internal-authorization";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

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
 * End of Part A
 * ============================================================================
 */
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

    const authorization =
      authorizePaymentSyncRequest(
        request
      );

    if (
      !authorization.authorized
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
     *
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
     * Initialize the Payment application and repository
     * ----------------------------------------------------------------------
     */

    await resolvePaymentApiApplicationModule();

    const repository =
      requirePaymentApiRepository();

    /* ----------------------------------------------------------------------
     * Read synchronization queue statistics
     * ----------------------------------------------------------------------
     */

    const statistics =
      await repository
        .getBookingSyncStatistics({
          observedAt:
            observedAt.value,
        });

    const healthy =
      statistics.failed ===
        0 &&
      statistics.due ===
        0;

    const requiresAttention =
      statistics.failed >
        0 ||
      statistics.due >
        0;

    /* ----------------------------------------------------------------------
     * Return operational queue snapshot
     * ----------------------------------------------------------------------
     */

    return PaymentApiResponse
      .success(
        {
          success:
            true,

          queue:
            statistics,

          healthy,

          requiresAttention,

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