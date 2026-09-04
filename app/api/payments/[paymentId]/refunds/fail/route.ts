/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Failed Refund Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/refunds/fail/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/[paymentId]/refunds/fail
 *
 * Purpose:
 *
 * Record a failed Payment refund and automatically synchronize the resulting
 * authoritative Payment refund projection into Booking.
 *
 * Flow:
 *
 * HTTP Request
 *      ↓
 * PaymentApiRequest
 *      ↓
 * Existing Payment failed-refund transport mapper
 *      ↓
 * PaymentRefundWorkflowService.failRefund()
 *      ↓
 * PaymentService.failRefund()
 *      ↓
 * PaymentBookingSyncService
 *      ↓
 * BookingService.updatePayment()
 *      ↓
 * HTTP Response
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - Transport normalization remains in Payment controller helpers.
 * - Refund business rules remain in PaymentService.
 * - Payment remains authoritative for refund financial state.
 * - Booking receives only the synchronized payment/refund projection.
 * - No Prisma/repository access belongs in this route.
 * ============================================================================
 */

/* ============================================================================
 * Payment application workflow
 * ============================================================================
 */

import {
  resolvePaymentRefundWorkflow,
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
 * Existing Payment transport helpers
 * ============================================================================
 */

import {
  PaymentControllerMutationMappingError,
handlePaymentControllerError,
  createFailPaymentRefundControllerInput,
  createPaymentControllerOk,
  mapPaymentMutationMappingErrorToResponse,
  requirePaymentControllerBody,
  requirePaymentControllerParam,
} from "../../../../../../domains/payment/controllers/payment.controller";

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

export interface PaymentRefundFailRouteContext {
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
 * POST /api/payments/[paymentId]/refunds/fail
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentRefundFailRouteContext
) {
  const requestId =
    PaymentApiRequest
      .requestId(
        request
      );

  try {
    /* ----------------------------------------------------------------------
     * Map HTTP request
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
     * Resolve authoritative route paymentId
     * ----------------------------------------------------------------------
     */

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
    /* ----------------------------------------------------------------------
     * Require request body
     * ----------------------------------------------------------------------
     */

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

    /* ----------------------------------------------------------------------
     * Normalize failed-refund input
     * ----------------------------------------------------------------------
     *
     * Existing Payment controller mapper owns:
     *
     * - amount validation
     * - transactionId
     * - provider
     * - gateway
     * - reason
     * - failure message
     * - providerErrorCode
     * - remarks
     * - recordedBy
     * - failedAt
     * - updatedBy / mutation actor
     * ----------------------------------------------------------------------
     */

    let refundInput;

    try {
      refundInput =
        createFailPaymentRefundControllerInput(
          paymentId.value,
          body.value,
          mapped.request
        );
    } catch (
      error
    ) {
      if (
        error instanceof
          PaymentControllerMutationMappingError
      ) {
        return PaymentApiResponse
          .fromController(
            mapPaymentMutationMappingErrorToResponse(
              error,
              mapped.request
                .requestId
            )
          );
      }

      throw error;
    }

    /* ----------------------------------------------------------------------
     * Application synchronization requires an actor
     * ----------------------------------------------------------------------
     */

    const updatedBy =
      refundInput.updatedBy;

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
              "updatedBy is required for failed Payment refund and Booking synchronization.",

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

    /* ----------------------------------------------------------------------
     * Resolve shared Payment refund workflow
     * ----------------------------------------------------------------------
     */

    const refundWorkflow =
      await resolvePaymentRefundWorkflow();

    /* ----------------------------------------------------------------------
     * Fail refund + synchronize Payment -> Booking
     * ----------------------------------------------------------------------
     */

    const workflowResult =
      await refundWorkflow
        .failRefund({
          ...refundInput,

          paymentId:
            paymentId.value,

          updatedBy:
            updatedBy.trim(),
        });

    /* ----------------------------------------------------------------------
     * Preserve existing HTTP 200 OK semantics
     * ----------------------------------------------------------------------
     */
    const controllerResponse =
      createPaymentControllerOk(
        workflowResult,
        mapped.request.requestId
      );

    return PaymentApiResponse.fromController(
      controllerResponse
    );
  } catch (
    error
  ) {
    const controllerResponse =
      handlePaymentControllerError(
        error,
        requestId
      );

    return PaymentApiResponse.fromController(
      controllerResponse
    );
  }
}

/* ============================================================================
 * End of Payment Failed Refund Route
 * ============================================================================
 */
