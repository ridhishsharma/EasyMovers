/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Readiness Route
 * ============================================================================
 *
 * File:
 * app/api/payments/readiness/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/readiness
 *
 * Purpose:
 *
 * Determine whether the Payment domain is ready to serve API requests.
 *
 * IMPORTANT:
 *
 * - This is an operational readiness endpoint.
 * - It is different from the health endpoint:
 *
 *      health     -> checks Payment infrastructure/repository health
 *      readiness  -> checks whether Payment domain is ready for requests
 *
 * - No Payment business logic belongs here.
 * - No direct Prisma/repository access belongs here.
 * - Readiness is obtained through PaymentController.
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

function requirePaymentReadinessApiController(
  requestId?:
    string
) {
  /* ------------------------------------------------------------------------
   * API module must first be initialized.
   * ------------------------------------------------------------------------
   */

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

  /* ------------------------------------------------------------------------
   * Resolve configured Payment controller.
   * ------------------------------------------------------------------------
   */

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
 * GET /api/payments/readiness
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Map incoming Next.js Request
     *
     * No body is required for a readiness request.
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

    /* ----------------------------------------------------------------------
     * Request mapping failure
     * ----------------------------------------------------------------------
     */

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
      requirePaymentReadinessApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Check Payment-domain readiness
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .readiness(
          mapped.request
        );

    /* ----------------------------------------------------------------------
     * PaymentControllerResponse -> NextResponse
     * ----------------------------------------------------------------------
     */

    return PaymentApiResponse
      .fromController(
        controllerResponse
      );
  } catch (
    error
  ) {
    /* ----------------------------------------------------------------------
     * Unexpected API-boundary error
     * ----------------------------------------------------------------------
     */

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
 * End of Payment Readiness Route
 * ============================================================================
 */