/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Root Route
 * Part A
 * ============================================================================
 *
 * File:
 * app/api/payments/route.ts
 *
 * Endpoints:
 *
 * GET  /api/payments
 *      Search / list Payments
 *
 * POST /api/payments
 *      Create a Payment
 *
 * Architecture:
 *
 * Request
 *   ↓
 * payment-api.request.ts
 *   ↓
 * PaymentController
 *   ↓
 * PaymentService
 *   ↓
 * PaymentRepository
 *   ↓
 * payment-api.response.ts
 *   ↓
 * NextResponse
 *
 * IMPORTANT:
 *
 * This route contains no Payment business logic.
 * ============================================================================
 */

/* ============================================================================
 * Payment API module
 * ============================================================================
 */

import {
  isPaymentApiModuleInitialized,
  requirePaymentApiController,
} from "./_lib/payment-api.module";

/* ============================================================================
 * Request adapter
 * ============================================================================
 */

import {
  PaymentApiRequest,
} from "./_lib/payment-api.request";

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

import {
  PaymentApiResponse,
} from "./_lib/payment-api.response";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

/**
 * Payment data is dynamic and must not be statically cached.
 */
export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Payment API availability
 * ============================================================================
 */

function requirePaymentRootApiController(
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
 * GET /api/payments
 * ============================================================================
 *
 * Supported query behavior is owned by payment.controller.ts.
 *
 * Examples:
 *
 * /api/payments?page=1&pageSize=20
 *
 * /api/payments?status=PAID
 *
 * /api/payments?bookingId=...
 *
 * /api/payments?paymentNumber=...
 *
 * /api/payments?sortBy=createdAt&sortDirection=desc
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Convert Request -> PaymentControllerRequest
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
      requirePaymentRootApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Search Payments
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .search(
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
 * POST /api/payments
 * ============================================================================
 *
 * Creates a new Payment using the canonical Payment service/controller
 * creation contract.
 *
 * JSON parsing happens at the API request boundary.
 * Domain validation remains inside PaymentController / PaymentService.
 * ============================================================================
 */

export async function POST(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Convert Request -> PaymentControllerRequest
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
      requirePaymentRootApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Create Payment
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .create(
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
 * End of Payment Root Route - Part A
 * ============================================================================
 */