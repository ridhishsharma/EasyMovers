/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Reconciliation History Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/reconciliation/history/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/[paymentId]/reconciliation/history
 *
 * Purpose:
 *
 * Return paginated reconciliation history for one Payment.
 *
 * Supported query parameters:
 *
 * page
 * pageSize
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - Pagination validation remains in PaymentController.
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
 * Controller route types
 * ============================================================================
 */

import type {
  PaymentIdRouteParams,
  PaymentReconciliationHistoryQueryParams,
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

export interface PaymentReconciliationHistoryRouteContext {
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

function requirePaymentReconciliationHistoryApiController(
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
 * GET /api/payments/[paymentId]/reconciliation/history
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    PaymentReconciliationHistoryRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + route params + query parameters
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
     * Narrow query contract for controller
     * ----------------------------------------------------------------------
     */

    const controllerRequest = {
      ...mapped.request,

      query:
        mapped.request
          .query as
          PaymentReconciliationHistoryQueryParams,
    };

    /* ----------------------------------------------------------------------
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentReconciliationHistoryApiController(
        controllerRequest
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Get reconciliation history
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .getReconciliationHistory(
          controllerRequest
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
 * End of Reconciliation History Route
 * ============================================================================
 */