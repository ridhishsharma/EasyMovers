/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Bulk Payment Lookup Route
 * ============================================================================
 *
 * File:
 * app/api/payments/bulk/lookup/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/bulk/lookup
 *
 * Purpose:
 *
 * Fetch multiple Payments by Payment IDs in one request.
 *
 * IMPORTANT:
 *
 * - Request-body mapping remains in PaymentController.
 * - No Payment business logic belongs here.
 * - No Prisma/repository access belongs here.
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
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentBulkLookupApiController(
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
 * POST /api/payments/bulk/lookup
 * ============================================================================
 */

export async function POST(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + JSON body
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .createResult(
          request,
          {
            parseBody:
              true,
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
     * Resolve Payment controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentBulkLookupApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Bulk lookup Payments
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getManyByIds(
          mapped.request
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
 * End of Bulk Payment Lookup Route
 * ============================================================================
 */