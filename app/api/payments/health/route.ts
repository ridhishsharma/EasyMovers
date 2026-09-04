/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Health Route
 * ============================================================================
 *
 * File:
 * app/api/payments/health/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/health
 *
 * Purpose:
 *
 * Return the Payment repository/infrastructure health result.
 *
 * IMPORTANT:
 *
 * - This is an operational diagnostics endpoint.
 * - No Payment business logic belongs here.
 * - No direct Prisma/repository access belongs here.
 * - Repository health is obtained through PaymentController.
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
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentHealthApiController(
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
 * GET /api/payments/health
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request
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
     * Resolve Payment controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentHealthApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Check repository health
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .health(
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
 * End of Payment Health Route
 * ============================================================================
 */