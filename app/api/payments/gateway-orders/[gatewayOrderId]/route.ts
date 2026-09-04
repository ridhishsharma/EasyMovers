/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Gateway Order by ID Route
 * ============================================================================
 *
 * File:
 * app/api/payments/gateway-orders/[gatewayOrderId]/route.ts
 *
 * Endpoints:
 *
 * GET
 * /api/payments/gateway-orders/[gatewayOrderId]
 *
 * Returns one gateway order by gatewayOrderId.
 *
 * PATCH
 * /api/payments/gateway-orders/[gatewayOrderId]
 *
 * Updates one gateway order.
 *
 * IMPORTANT:
 *
 * - Route gatewayOrderId is authoritative.
 * - Gateway-order business rules remain inside PaymentService.
 * - No direct Prisma/repository access belongs here.
 * - External gateway SDK calls do not belong here.
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
  PaymentGatewayOrderRouteParams,
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

export interface PaymentGatewayOrderByIdRouteContext {
  params:
    Promise<{
      gatewayOrderId:
        string;
    }> | {
      gatewayOrderId:
        string;
    };
}

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentGatewayOrderByIdApiController(
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
 * GET /api/payments/gateway-orders/[gatewayOrderId]
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentGatewayOrderByIdRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + gatewayOrderId
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
  PaymentGatewayOrderRouteParams
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
      requirePaymentGatewayOrderByIdApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get gateway order
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getGatewayOrder(
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
 * PATCH /api/payments/gateway-orders/[gatewayOrderId]
 * ============================================================================
 */

export async function PATCH(
  request:
    Request,
  context:
    PaymentGatewayOrderByIdRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + gatewayOrderId + JSON body
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
  PaymentGatewayOrderRouteParams
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
      requirePaymentGatewayOrderByIdApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Update gateway order
     *
     * gatewayOrderId from the URL remains authoritative.
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .updateGatewayOrder(
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
 * End of Gateway Order by ID Route
 * ============================================================================
 */