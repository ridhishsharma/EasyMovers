/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Transaction Statistics Route
 * ============================================================================
 *
 * File:
 * app/api/payments/transactions/statistics/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/transactions/statistics
 *
 * Purpose:
 *
 * Return aggregate statistics for Payment transactions.
 *
 * Query filters are normalized by PaymentController and may include:
 *
 * paymentId
 * transactionId
 * transactionType
 * purpose
 * status
 * method
 * provider
 * gatewayOrderId
 * gatewayPaymentId
 * minimumAmount
 * maximumAmount
 * initiatedFrom
 * initiatedUntil
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
 * Controller query type
 * ============================================================================
 */

import type {
  PaymentTransactionSearchQueryParams,
} from "../../../../../domains/payment/controllers/payment.controller";

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

function requirePaymentTransactionStatisticsApiController(
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
 * GET /api/payments/transactions/statistics
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
          PaymentTransactionSearchQueryParams,
    };

    /* ----------------------------------------------------------------------
     * Resolve Payment controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentTransactionStatisticsApiController(
        controllerRequest
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get transaction statistics
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .transactionStatistics(
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
 * End of Transaction Statistics Route
 * ============================================================================
 */