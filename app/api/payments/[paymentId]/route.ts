/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Payment by ID Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/route.ts
 *
 * Endpoints:
 *
 * GET
 * /api/payments/[paymentId]
 *
 * Returns one Payment by ID.
 *
 * PATCH
 * /api/payments/[paymentId]
 *
 * Updates one Payment.
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * PaymentApiRequest
 *      ↓
 * PaymentController
 *      ↓
 * PaymentService
 *      ↓
 * PaymentRepository
 *      ↓
 * PaymentApiResponse
 *      ↓
 * NextResponse
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - No Payment business rules belong here.
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
 * Payment controller route-param type
 * ============================================================================
 */

import type {
  PaymentIdRouteParams,
} from "../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface PaymentByIdRouteContext {
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
 * Resolve Payment API controller
 * ============================================================================
 */

function requirePaymentByIdApiController(
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
 * GET /api/payments/[paymentId]
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentByIdRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Convert Request + route params
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

    /* ----------------------------------------------------------------------
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentByIdApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get Payment
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getById(
          mapped.request
        );

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
 * PATCH /api/payments/[paymentId]
 * ============================================================================
 */

export async function PATCH(
  request:
    Request,
  context:
    PaymentByIdRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Convert Request + route params + JSON body
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
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentByIdApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Update Payment
     * ----------------------------------------------------------------------
     *
     * payment.controller.ts ensures the route paymentId overrides any
     * paymentId supplied in the body.
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .update(
          mapped.request
        );

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
 * End of Payment by ID Route
 * ============================================================================
 */