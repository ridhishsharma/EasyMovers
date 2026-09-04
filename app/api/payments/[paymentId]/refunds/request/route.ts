/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Refund Request Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/refunds/request/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/[paymentId]/refunds/request
 *
 * Purpose:
 *
 * Start the Payment refund lifecycle and automatically synchronize the
 * resulting Payment refund projection into Booking.
 *
 * Flow:
 *
 * HTTP Request
 *      ↓
 * PaymentApiRequest
 *      ↓
 * Payment refund transport mapper
 *      ↓
 * PaymentRefundWorkflowService.requestRefund()
 *      ↓
 * PaymentService.requestRefund()
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
 * - Refund business rules remain in PaymentService.
 * - Payment remains authoritative for financial/refund state.
 * - Booking receives only the synchronized financial projection.
 * - No Prisma/repository access belongs here.
 * ============================================================================
 */

/* ============================================================================
 * Payment API application workflow
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
 * Payment controller transport helpers
 * ============================================================================
 *
 * We deliberately reuse existing controller mapping helpers instead of
 * creating another refund request mapper in the route/application layer.
 * ============================================================================
 */

import {
  PaymentControllerMutationMappingError,
  createPaymentControllerCreated,
  createRequestPaymentRefundControllerInput,
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

export interface PaymentRefundRequestRouteContext {
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
 * POST /api/payments/[paymentId]/refunds/request
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentRefundRequestRouteContext
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
     * Require JSON object body
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
     * Normalize transport request into Payment refund service input
     * ----------------------------------------------------------------------
     *
     * Existing Payment controller mapper owns:
     *
     * - amount normalization
     * - provider normalization
     * - gateway normalization
     * - transactionId normalization
     * - reason / remarks
     * - recordedBy
     * - requestedAt
     * - updatedBy / mutation actor
     * ----------------------------------------------------------------------
     */

    let refundInput;

    try {
      refundInput =
        createRequestPaymentRefundControllerInput(
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
     * Application workflow requires synchronization actor
     * ----------------------------------------------------------------------
     *
     * PaymentService itself historically allows updatedBy to be optional.
     *
     * The application workflow requires it because Booking audit/timeline
     * synchronization must always have an actor.
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
              "updatedBy is required for Payment refund and Booking synchronization.",

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
     * Resolve shared refund application workflow
     * ----------------------------------------------------------------------
     */

    const refundWorkflow =
      await resolvePaymentRefundWorkflow();

    /* ----------------------------------------------------------------------
     * Request refund + synchronize Payment -> Booking
     * ----------------------------------------------------------------------
     */

    const workflowResult =
      await refundWorkflow
        .requestRefund({
          ...refundInput,

          paymentId:
            paymentId.value,

          updatedBy:
            updatedBy.trim(),
        });

    /* ----------------------------------------------------------------------
     * Application result -> existing Payment response envelope
     * ----------------------------------------------------------------------
     *
     * Preserve HTTP 201 semantics used by the previous refund-request
     * controller endpoint.
     * ----------------------------------------------------------------------
     */

    const controllerResponse =
      createPaymentControllerCreated(
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
    /* ----------------------------------------------------------------------
     * Unexpected / domain / application error
     * ----------------------------------------------------------------------
     */

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
 * End of Payment Refund Request Route
 * ============================================================================
 */