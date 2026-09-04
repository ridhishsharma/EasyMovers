/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Payment Statistics Route
 * ============================================================================
 *
 * File:
 * app/api/payments/statistics/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/statistics
 *
 * Purpose:
 *
 * Return aggregate statistics for Payments.
 *
 * Query filters are normalized by PaymentController and may include:
 *
 * paymentId
 * paymentNumber
 * referenceId
 * bookingId
 * quotationId
 * userId
 * vendorId
 * status
 * paymentMethod
 * paymentType
 * provider
 * gatewayOrderId
 * gatewayPaymentId
 * transactionId
 * minimumAmount
 * maximumAmount
 * createdFrom
 * createdUntil
 * paidFrom
 * paidUntil
 * search
 *
 * IMPORTANT:
 *
 * - No Payment business logic belongs here.
 * - No Prisma/repository access belongs here.
 * - Query mapping/validation remains inside PaymentController.
 * ============================================================================
 */

/* ============================================================================
 * Payment API module
 * ============================================================================
 */

import {
  isPaymentApiModuleInitialized,
  requirePaymentApiController,
} from "../_lib/payment-api.module";

/* ============================================================================
 * Request adapter
 * ============================================================================
 */

import {
  PaymentApiRequest,
} from "../_lib/payment-api.request";

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

import {
  PaymentApiResponse,
} from "../_lib/payment-api.response";

/* ============================================================================
 * Controller query type
 * ============================================================================
 */

import type {
  PaymentSearchQueryParams,
} from "../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentStatisticsApiController(
  requestId?:
    string
) {
  if (
    !isPaymentApiModuleInitialized()
  ) {
    return {
      success:
        false as const,

      response:
        PaymentApiResponse
          .unavailable(
            "PAYMENT_API_NOT_INITIALIZED",
            "Payment API module has not been initialized.",
            requestId
          ),
    };
  }

  try {
    return {
      success:
        true as const,

      controller:
        requirePaymentApiController(),
    };
  } catch (
    error
  ) {
    return {
      success:
        false as const,

      response:
        PaymentApiResponse
          .unavailable(
            "PAYMENT_API_UNAVAILABLE",
            error instanceof Error
              ? error.message
              : "Payment API is unavailable.",
            requestId
          ),
    };
  }
}

/* ============================================================================
 * GET /api/payments/statistics
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + query parameters
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .createResult(
          request,
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

    /* ----------------------------------------------------------------------
     * Narrow query contract
     * ----------------------------------------------------------------------
     */

    const controllerRequest = {
      ...mapped.request,

      query:
        mapped.request
          .query as
          PaymentSearchQueryParams,
    };

    /* ----------------------------------------------------------------------
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentStatisticsApiController(
        controllerRequest
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get Payment statistics
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .paymentStatistics(
          controllerRequest
        );

    /* ----------------------------------------------------------------------
     * Controller response -> NextResponse
     * ----------------------------------------------------------------------
     */

    return PaymentApiResponse
      .fromController(
        controllerResponse
      );
  } catch (
    error
  ) {
    return PaymentApiResponse
      .handleError(
        error,
        PaymentApiRequest
          .requestId(
            request
          )
      );
  }
}

/* ============================================================================
 * End of Payment Statistics Route
 * ============================================================================
 */