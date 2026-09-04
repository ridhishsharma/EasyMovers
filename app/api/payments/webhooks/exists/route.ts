/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Webhook Idempotency Check Route
 * ============================================================================
 *
 * File:
 * app/api/payments/webhooks/exists/route.ts
 *
 * Endpoint:
 *
 * GET /api/payments/webhooks/exists
 *
 * Purpose:
 *
 * Check whether a provider webhook event has already been recorded.
 *
 * Query parameters:
 *
 * provider
 * providerEventId
 *
 * Example:
 *
 * /api/payments/webhooks/exists
 *   ?provider=RAZORPAY
 *   &providerEventId=evt_123
 *
 * IMPORTANT:
 *
 * - This route performs no persistence logic directly.
 * - Idempotency lookup remains inside PaymentService/Repository.
 * - No Prisma access belongs here.
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
 * Controller query type
 * ============================================================================
 */

import type {
  PaymentWebhookExistsQueryParams,
} from "../../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * Route configuration
 * ============================================================================
 */

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Resolve controller
 * ============================================================================
 */

function requirePaymentWebhookExistsApiController(
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
 * GET /api/payments/webhooks/exists
 * ============================================================================
 */

export async function GET(
  request:
    Request
) {
  try {
    /* ----------------------------------------------------------------------
     * Map Request + query parameters
     * ----------------------------------------------------------------------
     */

    const mapped =
      await PaymentApiRequest
        .createResult(
          request,
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
     * Narrow query contract
     * ----------------------------------------------------------------------
     */

    const controllerRequest = {
      ...mapped.request,

      query:
        mapped.request
          .query as
          PaymentWebhookExistsQueryParams,
    };

    /* ----------------------------------------------------------------------
     * Resolve controller
     * ----------------------------------------------------------------------
     */

    const resolved =
      requirePaymentWebhookExistsApiController(
        controllerRequest
          .requestId
      );

    if (
      !resolved.success
    ) {
      return resolved.response;
    }

    /* ----------------------------------------------------------------------
     * Check provider-event idempotency
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      await resolved
        .controller
        .checkWebhookEvent(
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
 * End of Webhook Idempotency Check Route
 * ============================================================================
 */