/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Transaction Search Route
 * ============================================================================
 *
 * File:
 * app/api/payments/transactions/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/transactions
 *
 * Purpose:
 *
 * Search / list Payment transactions across the Payment domain.
 *
 * Supported query parameters are normalized by PaymentController.
 *
 * Examples:
 *
 * ?paymentId=...
 * ?transactionId=...
 * ?status=SUCCESS
 * ?provider=RAZORPAY
 * ?gatewayOrderId=...
 * ?gatewayPaymentId=...
 * ?minimumAmount=1000
 * ?maximumAmount=5000
 * ?page=1
 * ?pageSize=20
 * ?sortBy=initiatedAt
 * ?sortDirection=desc
 *
 * IMPORTANT:
 *
 * - No Payment business logic belongs here.
 * - No Prisma/repository access belongs here.
 * - Query validation/mapping remains in PaymentController.
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
  PaymentTransactionSearchQueryParams,
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

function requirePaymentTransactionSearchApiController(
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
 * GET /api/payments/transactions
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
      requirePaymentTransactionSearchApiController(
        controllerRequest
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Search Payment transactions
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .searchTransactions(
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
 * End of Transaction Search Route
 * ============================================================================
 */