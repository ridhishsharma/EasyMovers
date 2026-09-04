/**
 * ============================================================================
 * EasyMovers
 * Payment -> Booking Synchronization Retry Route
 * ============================================================================
 *
 * POST /api/payments/[paymentId]/sync-booking
 *
 * Rebuilds Booking financial state from the latest authoritative Payment.
 *
 * This route is idempotent:
 *
 * - It does not create Payment transactions.
 * - It does not change Payment financial values.
 * - It may safely be retried.
 * - HTTP 200 means synchronized and verified.
 * - HTTP 202 means synchronization remains pending/retryable.
 * ============================================================================
 */

import {
  resolvePaymentApiBookingSyncService,
} from "../../_lib/payment-api.module";

import {
  PaymentApiRequest,
} from "../../_lib/payment-api.request";

import {
  PaymentApiResponse,
} from "../../_lib/payment-api.response";

import {
  PaymentControllerMutationMappingError,
  handlePaymentControllerError,
  mapPaymentMutationMappingErrorToResponse,
  requirePaymentControllerBody,
  requirePaymentControllerParam,
  resolvePaymentControllerMutationActor,
} from "../../../../../domains/payment/controllers/payment.controller";

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

export interface PaymentSyncBookingRouteContext {
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
 * POST /api/payments/[paymentId]/sync-booking
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentSyncBookingRouteContext
) {
  const requestId =
    PaymentApiRequest
      .requestId(
        request
      );

  try {
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

    const paymentId =
      requirePaymentControllerParam(
        mapped.request,
        "paymentId"
      );

    if (
      !paymentId.success
    ) {
      return PaymentApiResponse
        .fromController(
          paymentId.response
        );
    }

    const body =
      requirePaymentControllerBody(
        mapped.request
      );

    if (
      !body.success
    ) {
      return PaymentApiResponse
        .fromController(
          body.response
        );
    }

    const updatedBy =
      resolvePaymentControllerMutationActor(
        mapped.request,
        body.value.updatedBy
      );

    if (
      typeof updatedBy !==
        "string" ||
      !updatedBy.trim()
    ) {
      const mappingError =
        new PaymentControllerMutationMappingError([
          {
            field:
              "updatedBy",

            code:
              "REQUIRED_FIELD",

            message:
              "updatedBy is required for Payment to Booking synchronization.",

            value:
              updatedBy,
          },
        ]);

      return PaymentApiResponse
        .fromController(
          mapPaymentMutationMappingErrorToResponse(
            mappingError,
            mapped.request
              .requestId
          )
        );
    }

    const synchronizationService =
      await resolvePaymentApiBookingSyncService();

    const synchronizationResult =
      await synchronizationService
        .syncPaymentToBooking({
          paymentId:
            paymentId.value,

          updatedBy:
            updatedBy.trim(),
        });

    /**
     * 200: Booking now matches Payment.
     *
     * 202: Payment remains committed, but synchronization is still pending.
     * The caller may safely retry only this endpoint.
     */
    return PaymentApiResponse
      .success(
        synchronizationResult,
        synchronizationResult
          .synchronized
          ? 200
          : 202,
        mapped.request
          .requestId
      );
  } catch (
    error
  ) {
    const controllerResponse =
      handlePaymentControllerError(
        error,
        requestId
      );

    return PaymentApiResponse
      .fromController(
        controllerResponse
      );
  }
}

/* ============================================================================
 * End of Payment -> Booking Synchronization Retry Route
 * ============================================================================
 */