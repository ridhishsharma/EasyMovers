/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Transactions by Gateway Order ID Route
 * ============================================================================
 *
 * File:
 * app/api/payments/transactions/by-gateway-order/[gatewayOrderId]/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/transactions/by-gateway-order/[gatewayOrderId]
 *
 * Purpose:
 *
 * Return Payment transactions associated with one external gateway order ID.
 *
 * IMPORTANT:
 *
 * - Route gatewayOrderId is authoritative.
 * - Empty transaction collections remain valid HTTP 200 results.
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
} from "../../../_lib/payment-api.module";

/* ============================================================================
 * Request adapter
 * ============================================================================
 */

import {
  PaymentApiRequest,
} from "../../../_lib/payment-api.request";

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

import {
  PaymentApiResponse,
} from "../../../_lib/payment-api.response";

/* ============================================================================
 * Controller route type
 * ============================================================================
 */

import type {
  PaymentGatewayOrderRouteParams,
} from "../../../../../../domains/payment/controllers/payment.controller";

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

export interface PaymentTransactionsByGatewayOrderRouteContext {
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

function requirePaymentTransactionsByGatewayOrderApiController(
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
 * GET /api/payments/transactions/by-gateway-order/[gatewayOrderId]
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentTransactionsByGatewayOrderRouteContext
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
      requirePaymentTransactionsByGatewayOrderApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get transactions by gateway order ID
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getTransactionsByGatewayOrderId(
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
 * End of Transactions by Gateway Order ID Route
 * ============================================================================
 */