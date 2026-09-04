/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Webhook Completion Route
 * ============================================================================
 *
 * File:
 * app/api/payments/webhooks/[webhookId]/complete/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/webhooks/[webhookId]/complete
 *
 * Purpose:
 *
 * Mark one persisted Payment webhook as successfully processed.
 *
 * IMPORTANT:
 *
 * - Route webhookId is authoritative.
 * - Webhook processing rules remain inside PaymentService.
 * - This route may optionally associate paymentId / transactionId.
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
  PaymentWebhookRouteParams,
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

export interface PaymentWebhookCompleteRouteContext {
  params:
    Promise<{
      webhookId:
        string;
    }> | {
      webhookId:
        string;
    };
}

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentWebhookCompleteApiController(
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
 * POST /api/payments/webhooks/[webhookId]/complete
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentWebhookCompleteRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + webhookId + optional JSON body
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .fromRouteContext<
          PaymentWebhookRouteParams
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
      requirePaymentWebhookCompleteApiController(
        mapped.request
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Mark webhook processed
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .completeWebhook(
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
 * End of Webhook Completion Route
 * ============================================================================
 */