/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Latest Reconciliation Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/reconciliation/latest/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/[paymentId]/reconciliation/latest
 *
 * Purpose:
 *
 * Return the latest persisted reconciliation record for one Payment.
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - No reconciliation business logic belongs here.
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
  PaymentIdRouteParams,
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

export interface PaymentLatestReconciliationRouteContext {
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

function requirePaymentLatestReconciliationApiController(
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
 * GET /api/payments/[paymentId]/reconciliation/latest
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentLatestReconciliationRouteContext
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
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentLatestReconciliationApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get latest reconciliation
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getLatestReconciliation(
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
 * End of Latest Reconciliation Route
 * ============================================================================
 */