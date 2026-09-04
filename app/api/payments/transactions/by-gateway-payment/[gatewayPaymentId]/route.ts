/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Transaction by Gateway Payment ID Route
 * ============================================================================
 *
 * File:
 * app/api/payments/transactions/by-gateway-payment/[gatewayPaymentId]/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/transactions/by-gateway-payment/[gatewayPaymentId]
 *
 * Purpose:
 *
 * Return one Payment transaction using the external gateway Payment ID.
 *
 * IMPORTANT:
 *
 * - Route gatewayPaymentId is authoritative.
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
  PaymentGatewayPaymentRouteParams,
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

export interface PaymentTransactionByGatewayPaymentRouteContext {
  params:
    Promise<{
      gatewayPaymentId:
        string;
    }> | {
      gatewayPaymentId:
        string;
    };
}

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentTransactionByGatewayPaymentApiController(
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
 * GET /api/payments/transactions/by-gateway-payment/[gatewayPaymentId]
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentTransactionByGatewayPaymentRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + gatewayPaymentId
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
          PaymentGatewayPaymentRouteParams
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
      requirePaymentTransactionByGatewayPaymentApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get transaction by gateway Payment ID
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getTransactionByGatewayPaymentId(
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
 * End of Transaction by Gateway Payment ID Route
 * ============================================================================
 */