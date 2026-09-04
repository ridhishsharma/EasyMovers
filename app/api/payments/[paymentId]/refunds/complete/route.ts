/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Complete Refund Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/refunds/complete/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/[paymentId]/refunds/complete
 *
 * Purpose:
 *
 * Complete a successful Payment refund and automatically synchronize the
 * resulting Payment refund projection into Booking.
 *
 * Flow:
 *
 * HTTP Request
 *      ↓
 * PaymentApiRequest
 *      ↓
 * Payment refund completion transport mapper
 *      ↓
 * PaymentRefundWorkflowService.completeRefund()
 *      ↓
 * PaymentService.completeRefund()
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
 * - Transport normalization remains in Payment controller mapper helpers.
 * - Refund calculations remain in PaymentService.
 * - Payment remains authoritative for refund financial state.
 * - Booking receives only the synchronized financial projection.
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
  createCompletePaymentRefundControllerInput,
  createPaymentControllerOk,
  handlePaymentControllerError,
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

export interface PaymentRefundCompleteRouteContext {
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
 * POST /api/payments/[paymentId]/refunds/complete
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentRefundCompleteRouteContext
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
     * Normalize successful refund input
     * ----------------------------------------------------------------------
     *
     * Existing Payment controller mapping owns:
     *
     * - amount validation
     * - transactionId normalization
     * - provider normalization
     * - gateway normalization
     * - remarks
     * - recordedBy
     * - refundedAt
     * - updatedBy / mutation actor
     * ----------------------------------------------------------------------
     */

    let refundInput;

    try {
      refundInput =
        createCompletePaymentRefundControllerInput(
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
              "updatedBy is required for Payment refund completion and Booking synchronization.",

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
     * Complete refund + synchronize Payment -> Booking
     * ----------------------------------------------------------------------
     */

    const workflowResult =
      await refundWorkflow
        .completeRefund({
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
        mapped.request
          .requestId
      );

    return PaymentApiResponse
      .fromController(
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

    return PaymentApiResponse
      .fromController(
        controllerResponse
      );
  }
}

/* ============================================================================
 * End of Payment Complete Refund Route
 * ============================================================================
 */