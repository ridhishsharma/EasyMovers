/**
 * ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization Status Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/sync-booking/status/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/[paymentId]/sync-booking/status
 *
 * Purpose:
 *
 * Return the durable Payment -> Booking synchronization state for one Payment.
 *
 * IMPORTANT:
 *
 * - This is a protected operational endpoint.
 * - Secret verification uses the shared constant-time authorization helper.
 * - This endpoint does not modify Payment, Booking or synchronization state.
 * ============================================================================
 */

/* ============================================================================
 * Payment API module
 * ============================================================================
 */

import {
  requirePaymentApiRepository,
  resolvePaymentApiApplicationModule,
} from "../../../_lib/payment-api.module";

/* ============================================================================
 * Request adapter
 * ============================================================================
 */

import {
  PaymentApiRequest,
} from "../../../_lib/payment-api.request";

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

import {
  PaymentApiResponse,
} from "../../../_lib/payment-api.response";

/* ============================================================================
 * Shared internal authorization
 * ============================================================================
 */

import {
  authorizePaymentSyncRequest,
} from "../../../_lib/payment-api.internal-authorization";

/* ============================================================================
 * Payment controller transport contracts
 * ============================================================================
 */

import {
  requirePaymentControllerParam,
} from "../../../../../../domains/payment/controllers/payment.controller";

import type {
  PaymentIdRouteParams,
} from "../../../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface PaymentBookingSyncStatusRouteContext {
  params:
    Promise<{
      paymentId:
        string;
    }> | {
      paymentId:
        string;
    };
}

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * GET /api/payments/[paymentId]/sync-booking/status
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentBookingSyncStatusRouteContext
) {
  const requestId =
    PaymentApiRequest
      .requestId(
        request
      );

  try {
    /* ----------------------------------------------------------------------
     * Protect operational synchronization information
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
          "PAYMENT_SYNC_STATUS_UNAUTHORIZED",
          "Valid Payment synchronization status authorization is required.",
          requestId
        );
    }

    /* ----------------------------------------------------------------------
     * Initialize the Payment API application and repository
     * ----------------------------------------------------------------------
     */

    await resolvePaymentApiApplicationModule();

    const repository =
      requirePaymentApiRepository();

    /* ----------------------------------------------------------------------
     * Map route parameters
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
          PaymentIdRouteParams
        >(
          request,
          {
            params:
              context.params,
          },
          {
            parseBody:
              false,
          }
        );

    if (
      !mapped.success
    ) {
      return PaymentApiResponse
        .badRequest(
          mapped.error.code,
          mapped.error.message,
          mapped.requestId,
          mapped.error.details
        );
    }

    const paymentId =
      requirePaymentControllerParam(
        mapped.request,
        "paymentId"
      );

    if (
      !paymentId.success
    ) {
      return PaymentApiResponse
        .fromController(
          paymentId.response
        );
    }

    /* ----------------------------------------------------------------------
     * Read durable synchronization state
     * ----------------------------------------------------------------------
     */

    const synchronization =
      await repository
        .findBookingSyncByPaymentId(
          paymentId.value
        );

    if (
  !synchronization
) {
  return PaymentApiResponse
    .notFound(
      "PAYMENT_BOOKING_SYNC_NOT_FOUND",
      "Booking synchronization state was not found for this Payment.",
      requestId,
      {
        paymentId:
          paymentId.value,
      }
    );
}

/* ----------------------------------------------------------------------
 * Return synchronization state
 * ----------------------------------------------------------------------
 */

return PaymentApiResponse
  .success(
    {
      paymentId:
        synchronization
          .paymentId,

      bookingId:
        synchronization
          .bookingId,

      status:
        synchronization
          .status,

      synchronized:
        synchronization.status ===
          "SYNCHRONIZED",

      retryable:
        synchronization.status ===
          "PENDING" ||
        synchronization.status ===
          "RETRY_PENDING",

      paymentUpdatedAt:
        synchronization
          .paymentUpdatedAt,

      attemptCount:
        synchronization
          .attemptCount,

      lastAttemptAt:
        synchronization
          .lastAttemptAt,

      nextRetryAt:
        synchronization
          .nextRetryAt,

      synchronizedAt:
        synchronization
          .synchronizedAt,

      lastError:
        synchronization
          .lastErrorCode ||
        synchronization
          .lastErrorMessage
          ? {
              code:
                synchronization
                  .lastErrorCode,

              message:
                synchronization
                  .lastErrorMessage,
            }
          : undefined,

      requestedBy:
        synchronization
          .requestedBy,

      paymentSnapshot:
        synchronization
          .paymentSnapshot,

      bookingSnapshot:
        synchronization
          .bookingSnapshot,

      createdAt:
        synchronization
          .createdAt,

      updatedAt:
        synchronization
          .updatedAt,
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
 * End of Payment -> Booking Synchronization Status Route
 * ============================================================================
 */