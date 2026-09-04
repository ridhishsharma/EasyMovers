/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Payment Gateway Orders Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/gateway-orders/route.ts
 *
 * Endpoints:
 *
 * GET
 * /api/payments/[paymentId]/gateway-orders
 *
 * Returns gateway orders belonging to one Payment.
 *
 * POST
 * /api/payments/[paymentId]/gateway-orders
 *
 * Creates one normalized gateway-order record for the Payment.
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - Payment/gateway eligibility rules remain inside PaymentService.
 * - External provider SDK/network calls do not belong here.
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
  PaymentIdRouteParams,
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

export interface PaymentGatewayOrdersRouteContext {
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
 * Resolve controller
 * ============================================================================
 */

function requirePaymentGatewayOrdersApiController(
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
 * GET /api/payments/[paymentId]/gateway-orders
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentGatewayOrdersRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + route params
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
     * Resolve Payment controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentGatewayOrdersApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * List gateway orders for Payment
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getGatewayOrders(
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
 * POST /api/payments/[paymentId]/gateway-orders
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentGatewayOrdersRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + route params + JSON body
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
     * Resolve Payment controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentGatewayOrdersApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Create gateway order
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .createGatewayOrder(
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
 * End of Payment Gateway Orders Route
 * ============================================================================
 */