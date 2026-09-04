/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Payment by Reference ID Route
 * ============================================================================
 *
 * File:
 * app/api/payments/by-reference/[referenceId]/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/by-reference/[referenceId]
 *
 * Purpose:
 *
 * Return one Payment using its Payment reference ID.
 *
 * IMPORTANT:
 *
 * - Route referenceId is authoritative.
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
 * Controller route type
 * ============================================================================
 */

import type {
  PaymentReferenceRouteParams,
} from "../../../../../domains/payment/controllers/payment.controller";

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

export interface PaymentByReferenceRouteContext {
  params:
    Promise<{
      referenceId:
        string;
    }> | {
      referenceId:
        string;
    };
}

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentByReferenceApiController(
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
 * GET /api/payments/by-reference/[referenceId]
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentByReferenceRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + route params
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
          PaymentReferenceRouteParams
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
      requirePaymentByReferenceApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get Payment by reference ID
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getByReferenceId(
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
 * End of Payment by Reference ID Route
 * ============================================================================
 */