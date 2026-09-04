/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Payment Reconciliation Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/reconciliation/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/[paymentId]/reconciliation
 *
 * Purpose:
 *
 * Reconcile one Payment against externally observed provider/ledger values.
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - Reconciliation rules remain inside PaymentService.
 * - Controller performs only transport-shape mapping.
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

export interface PaymentReconciliationRouteContext {
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

function requirePaymentReconciliationApiController(
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
 * POST /api/payments/[paymentId]/reconciliation
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentReconciliationRouteContext
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
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentReconciliationApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Reconcile Payment
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .reconcile(
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
 * End of Payment Reconciliation Route
 * ============================================================================
 */