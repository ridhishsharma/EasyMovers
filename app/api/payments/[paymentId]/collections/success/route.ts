/**
 * ============================================================================
 * EasyMovers
 * Payment API
 * Successful Collection Route
 * ============================================================================
 *
 * File:
 * app/api/payments/[paymentId]/collections/success/route.ts
 *
 * Endpoint:
 *
 * POST /api/payments/[paymentId]/collections/success
 *
 * Purpose:
 *
 * Record a successful Payment collection and automatically synchronize the
 * resulting Payment financial state into the related Booking.
 *
 * Flow:
 *
 * HTTP Request
 *      ↓
 * Payment transport mapping
 *      ↓
 * PaymentCollectionWorkflowService
 *      ↓
 * PaymentServicePort.recordCollection()
 *      ↓
 * PaymentBookingSyncService
 *      ↓
 * BookingService.updatePayment()
 *
 * IMPORTANT:
 *
 * - Route paymentId is authoritative.
 * - Payment business rules stay in PaymentService.
 * - Booking business rules stay in BookingService.
 * - Cross-domain coordination stays in the application layer.
 * - No Prisma access belongs in this route.
 * ============================================================================
 */

/* ============================================================================
 * Payment API module
 * ============================================================================
 */

import {
  resolvePaymentCollectionWorkflow,
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
 */

import {
  PaymentControllerMutationMappingError,
  createPaymentCollectionControllerInput,
  createPaymentControllerCreated,
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

export const revalidate =
  0;

export const runtime =
  "nodejs";

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface PaymentCollectionSuccessRouteContext {
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
 * POST
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    PaymentCollectionSuccessRouteContext
) {
  try {
    /* ----------------------------------------------------------------------
     * 1. Map HTTP request
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
     * 2. Resolve authoritative paymentId
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
     * 3. Require request body
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
     * 4. Map Payment collection input
     *
     * Reuse the same mapper that the Payment controller uses.
     * ----------------------------------------------------------------------
     */

    let input;

    try {
      input =
        createPaymentCollectionControllerInput(
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
     * 5. Resolve application workflow
     *
     * CRITICAL:
     *
     * Do not synchronously check isPaymentApiModuleInitialized().
     *
     * resolvePaymentCollectionWorkflow() waits for the automatic Prisma
     * Payment bootstrap promise before resolving the application layer.
     * ----------------------------------------------------------------------
     */

    let workflow;

    try {
      workflow =
        await resolvePaymentCollectionWorkflow();
    } catch (
      error
    ) {
      return PaymentApiResponse
        .unavailable(
          "PAYMENT_APPLICATION_UNAVAILABLE",
          error instanceof Error
            ? error.message
            : "Payment application workflow is unavailable.",
          mapped.request
            .requestId
        );
    }

    /* ----------------------------------------------------------------------
     * 6. Execute complete application workflow
     * ----------------------------------------------------------------------
     */

    try {
      const result =
        await workflow
          .recordSuccessfulCollection({
            ...input,

            /**
             * Used only when the normalized Payment input does not already
             * contain updatedBy.
             */
            synchronizedBy:
              "PAYMENT_COLLECTION_WORKFLOW",
          });

      /* --------------------------------------------------------------------
       * 7. Maintain backward-compatible successful collection response
       *
       * Existing:
       *
       * data.payment
       * data.transaction
       *
       * Added:
       *
       * data.bookingSynchronization
       * --------------------------------------------------------------------
       */

      const response =
        createPaymentControllerCreated(
          {
            payment:
              result
                .collection
                .payment,

            transaction:
              result
                .collection
                .transaction,

            bookingSynchronization:
              result
                .bookingSynchronization,
          },
          mapped.request
            .requestId
        );

      return PaymentApiResponse
        .fromController(
          response
        );
    } catch (
      error
    ) {
      return PaymentApiResponse
        .fromController(
          handlePaymentControllerError(
            error,
            mapped.request
              .requestId
          )
        );
    }
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
 * End of Successful Collection Route
 * ============================================================================
 */