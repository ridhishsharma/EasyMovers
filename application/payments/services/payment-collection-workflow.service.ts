/* ============================================================================
 * EasyMovers
 * Successful Payment Collection Workflow
 * Application Service
 * ============================================================================
 *
 * Coordinates:
 *
 * 1. Successful Payment collection
 * 2. Payment financial persistence
 * 3. Payment -> Booking financial synchronization
 *
 * IMPORTANT:
 *
 * - Payment domain owns collection rules and financial calculations.
 * - Booking domain owns its payment projection rules.
 * - Application layer coordinates both domains.
 * - No Prisma access is allowed here.
 * ============================================================================
 */

import type {
  PaymentCollectionServiceResult,
  RecordPaymentCollectionServiceInput,
} from "../../../domains/payment/services/payment.service";

import type {
  PaymentServicePort,
} from "../../../domains/payment/services/payment.service";

import type {
  SyncPaymentToBookingResult,
} from "../models/payment-booking-sync.model";

import {
  PaymentBookingSyncService,
} from "./payment-booking-sync.service";

/* ============================================================================
 * Workflow dependencies
 * ============================================================================
 */

export interface PaymentCollectionWorkflowDependencies {
  paymentService:
    PaymentServicePort;

  paymentBookingSyncService:
    PaymentBookingSyncService;
}

/* ============================================================================
 * Workflow input
 * ============================================================================
 */

export interface RecordPaymentCollectionWorkflowInput
  extends RecordPaymentCollectionServiceInput {
  /**
   * Actor used when synchronizing the Booking projection.
   *
   * If Payment collection input already contains updatedBy,
   * that value is preferred.
   */
  synchronizedBy?:
    string;
}

/* ============================================================================
 * Workflow result
 * ============================================================================
 */

export interface PaymentCollectionWorkflowResult {
  collection:
    PaymentCollectionServiceResult;

  bookingSynchronization:
    SyncPaymentToBookingResult;
}

/* ============================================================================
 * Application error
 * ============================================================================
 */

export class PaymentCollectionWorkflowError
  extends Error {
  readonly code:
    string;

  readonly details?:
    Record<
      string,
      unknown
    >;

  constructor(
    code:
      string,
    message:
      string,
    details?:
      Record<
        string,
        unknown
      >
  ) {
    super(
      message
    );

    this.name =
      "PaymentCollectionWorkflowError";

    this.code =
      code;

    this.details =
      details;
  }
}

/* ============================================================================
 * Helpers
 * ============================================================================
 */

function normalizeWorkflowActor(
  value:
    unknown
): string | undefined {
  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized ||
    undefined;
}

function resolveWorkflowActor(
  input:
    RecordPaymentCollectionWorkflowInput
): string {
  const actor =
    normalizeWorkflowActor(
      input.updatedBy
    ) ??
    normalizeWorkflowActor(
      input.synchronizedBy
    );

  if (
    !actor
  ) {
    throw new PaymentCollectionWorkflowError(
      "PAYMENT_COLLECTION_WORKFLOW_ACTOR_REQUIRED",
      "An actor is required to synchronize the successful Payment collection to Booking.",
      {
        paymentId:
          input.paymentId,
      }
    );
  }

  return actor;
}

/* ============================================================================
 * Workflow service
 * ============================================================================
 */

export class PaymentCollectionWorkflowService {
  private readonly paymentService:
    PaymentServicePort;

  private readonly paymentBookingSyncService:
    PaymentBookingSyncService;

  constructor(
    dependencies:
      PaymentCollectionWorkflowDependencies
  ) {
    this.paymentService =
      dependencies
        .paymentService;

    this.paymentBookingSyncService =
      dependencies
        .paymentBookingSyncService;
  }

  /**
   * Records a successful Payment collection and synchronizes
   * the resulting financial state into the Booking projection.
   */
  async recordSuccessfulCollection(
    input:
      RecordPaymentCollectionWorkflowInput
  ): Promise<
    PaymentCollectionWorkflowResult
  > {
    const updatedBy =
      resolveWorkflowActor(
        input
      );

    /* ------------------------------------------------------------------------
     * Step 1:
     * Record collection in Payment domain.
     * ------------------------------------------------------------------------
     */

    const collection =
      await this.paymentService
        .recordCollection(
          input
        );

    /* ------------------------------------------------------------------------
     * Step 2:
     * Synchronize authoritative Payment state to Booking.
     * ------------------------------------------------------------------------
     */

    const bookingSynchronization =
      await this.paymentBookingSyncService
        .syncPaymentToBooking({
          paymentId:
            collection
              .payment
              .paymentId,

          updatedBy,
        });

    return {
      collection,

      bookingSynchronization,
    };
  }
}

/* ============================================================================
 * Factory
 * ============================================================================
 */

export function createPaymentCollectionWorkflowService(
  dependencies:
    PaymentCollectionWorkflowDependencies
): PaymentCollectionWorkflowService {
  return new PaymentCollectionWorkflowService(
    dependencies
  );
}