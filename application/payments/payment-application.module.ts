/* ============================================================================
 * EasyMovers
 * Payment Application Module
 * ============================================================================
 *
 * File:
 * application/payments/payment-application.module.ts
 *
 * Responsibilities:
 *
 * - Compose Payment-related application services
 * - Connect existing Payment and Booking domain services
 * - Expose a reusable application dependency graph
 * - Support dependency injection for tests
 *
 * IMPORTANT:
 *
 * This module does NOT:
 *
 * - instantiate Prisma repositories
 * - contain Payment business rules
 * - contain Booking business rules
 * - access NextRequest / NextResponse
 * - perform HTTP transport mapping
 *
 * Domain modules remain responsible for constructing their own repositories
 * and services.
 * ============================================================================
 */

import type {
  PaymentServicePort,
} from "../../domains/payment/services/payment.service";

import type {
  BookingService,
} from "../../domains/booking/services/booking.service";

import {
  PaymentBookingSyncService,
  createPaymentBookingSyncService,
} from "./services/payment-booking-sync.service";

import {
  PaymentCollectionWorkflowService,
  createPaymentCollectionWorkflowService,
} from "./services/payment-collection-workflow.service";

import {
  PaymentRefundWorkflowService,
  createPaymentRefundWorkflowService,
} from "./services/payment-refund-workflow.service";

import type {
  PaymentBookingSyncRepositoryPort,
} from "../../domains/payment/repositories/payment.repository";

import {
  PaymentBookingSyncRetryService,
  createPaymentBookingSyncRetryService,
} from "./services/payment-booking-sync-retry.service";

/* ============================================================================
 * Module dependencies
 * ============================================================================
 */

export interface PaymentApplicationModuleDependencies {
  /**
   * Existing final Payment domain service.
   *
   * Payment remains the authoritative source of financial state.
   *
   * PaymentServicePort resolves to the complete operational Payment service
   * and therefore includes collection, refund, gateway, reconciliation,
   * and other final Payment capabilities.
   */
  paymentService:
    PaymentServicePort;

  paymentBookingSyncRepository:
    PaymentBookingSyncRepositoryPort;

  /**
   * Existing Booking domain service.
   *
   * Booking owns validation and persistence of its operational payment
   * projection.
   */
  bookingService:
    BookingService;
}

/* ============================================================================
 * Application module contract
 * ============================================================================
 */

export interface PaymentApplicationModule {
  /**
   * Synchronizes authoritative Payment financial state into Booking.
   *
   * Handles:
   *
   * - totalAmount
   * - paidAmount
   * - balanceAmount
   * - paymentPending
   * - refundedAmount
   * - refundPendingAmount
   */
  paymentBookingSyncService:
    PaymentBookingSyncService;

  /**
   * Processes durable Payment -> Booking synchronization retries.
   */
  paymentBookingSyncRetryService:
    PaymentBookingSyncRetryService;
  /**
   * Coordinates successful Payment collection and subsequent
   * Payment -> Booking synchronization.
   */
  paymentCollectionWorkflowService:
    PaymentCollectionWorkflowService;

  /**
   * Coordinates Payment refund request/completion and subsequent
   * Payment -> Booking synchronization.
   */
  paymentRefundWorkflowService:
    PaymentRefundWorkflowService;

  /**
   * Useful for diagnostics and tests.
   */
  createdAt:
    Date;
}

/* ============================================================================
 * Dependency validation
 * ============================================================================
 */

function requirePaymentApplicationDependencies(
  dependencies:
    PaymentApplicationModuleDependencies
): PaymentApplicationModuleDependencies {
    if (
    !dependencies
      .paymentBookingSyncRepository
  ) {
    throw new Error(
      "PaymentApplicationModule requires paymentBookingSyncRepository."
    );
  }

  if (
    !dependencies.bookingService
  ) {
    throw new Error(
      "PaymentApplicationModule requires bookingService."
    );
  }

  return dependencies;
}

/* ============================================================================
 * Payment -> Booking synchronization factory
 * ============================================================================
 */

export function createPaymentBookingApplicationService(
  dependencies:
    PaymentApplicationModuleDependencies
): PaymentBookingSyncService {
  const resolvedDependencies =
    requirePaymentApplicationDependencies(
      dependencies
    );

  return createPaymentBookingSyncService({
    paymentService:
      resolvedDependencies
        .paymentService,

    bookingService:
      resolvedDependencies
        .bookingService,

    syncRepository:
      resolvedDependencies
        .paymentBookingSyncRepository,
  });
}

/* ============================================================================
 * Payment collection workflow factory
 * ============================================================================
 */

export function createPaymentCollectionApplicationService(
  dependencies:
    PaymentApplicationModuleDependencies,
  paymentBookingSyncService?:
    PaymentBookingSyncService
): PaymentCollectionWorkflowService {
  const resolvedDependencies =
    requirePaymentApplicationDependencies(
      dependencies
    );

  const resolvedPaymentBookingSyncService =
    paymentBookingSyncService ??
    createPaymentBookingApplicationService(
      resolvedDependencies
    );

  return createPaymentCollectionWorkflowService({
    paymentService:
      resolvedDependencies
        .paymentService,

    paymentBookingSyncService:
      resolvedPaymentBookingSyncService,
  });
}

/* ============================================================================
 * Payment refund workflow factory
 * ============================================================================
 */

export function createPaymentRefundApplicationService(
  dependencies:
    PaymentApplicationModuleDependencies,
  paymentBookingSyncService?:
    PaymentBookingSyncService
): PaymentRefundWorkflowService {
  const resolvedDependencies =
    requirePaymentApplicationDependencies(
      dependencies
    );

  /*
   * Reuse the module's PaymentBookingSyncService whenever one is supplied.
   *
   * This avoids constructing competing synchronization-service instances
   * inside the same application module.
   */
  const resolvedPaymentBookingSyncService =
    paymentBookingSyncService ??
    createPaymentBookingApplicationService(
      resolvedDependencies
    );

  return createPaymentRefundWorkflowService({
    /*
     * PaymentServicePort is the final operational Payment service.
     *
     * It structurally satisfies PaymentRefundWorkflowPaymentServicePort
     * because it inherits requestRefund() and completeRefund().
     */
    paymentService:
      resolvedDependencies
        .paymentService,

    paymentBookingSyncService:
      resolvedPaymentBookingSyncService,
  });
}

/* ============================================================================
 * Module composition
 * ============================================================================
 */
export function createPaymentApplicationModule(
  dependencies:
    PaymentApplicationModuleDependencies
): PaymentApplicationModule {
  const resolvedDependencies =
    requirePaymentApplicationDependencies(
      dependencies
    );

  /*
   * Create one shared Payment -> Booking synchronization service.
   *
   * Collection, refund and retry workflows reuse this same instance.
   */
  const paymentBookingSyncService =
    createPaymentBookingApplicationService(
      resolvedDependencies
    );

  /*
   * Create the durable synchronization retry processor.
   */
  const paymentBookingSyncRetryService =
    createPaymentBookingSyncRetryService({
      syncRepository:
        resolvedDependencies
          .paymentBookingSyncRepository,

      syncService:
        paymentBookingSyncService,
    });

  /*
   * Collection workflow.
   */
  const paymentCollectionWorkflowService =
    createPaymentCollectionApplicationService(
      resolvedDependencies,
      paymentBookingSyncService
    );

  /*
   * Refund workflow.
   */
  const paymentRefundWorkflowService =
    createPaymentRefundApplicationService(
      resolvedDependencies,
      paymentBookingSyncService
    );

  return {
    paymentBookingSyncService,

    paymentBookingSyncRetryService,

    paymentCollectionWorkflowService,

    paymentRefundWorkflowService,

    createdAt:
      new Date(),
  };
}
/*
 * ===================================================================
 * Safe construction result
 * ============================================================================
 */
export type CreatePaymentApplicationModuleResult =
  | {
      success:
        true;

      module:
        PaymentApplicationModule;
    }
  | {
      success:
        false;

      error: {
        code:
          "PAYMENT_APPLICATION_MODULE_CREATION_FAILED";

        message:
          string;
      };
    };

/* ============================================================================
 * Safe module factory
 * ============================================================================
 */

export function tryCreatePaymentApplicationModule(
  dependencies:
    PaymentApplicationModuleDependencies
): CreatePaymentApplicationModuleResult {
  try {
    return {
      success:
        true,

      module:
        createPaymentApplicationModule(
          dependencies
        ),
    };
  } catch (
    error
  ) {
    return {
      success:
        false,

      error: {
        code:
          "PAYMENT_APPLICATION_MODULE_CREATION_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "An unknown Payment application module creation error occurred.",
      },
    };
  }
}

/* ============================================================================
 * Payment Application facade
 * ============================================================================
 */

export const PaymentApplication = {
  /**
   * Complete module.
   */
  create:
    createPaymentApplicationModule,

  /**
   * Safe complete module construction.
   */
  tryCreate:
    tryCreatePaymentApplicationModule,

  /**
   * Payment -> Booking synchronization.
   */
  createPaymentBookingSyncService:
    createPaymentBookingApplicationService,

  /**
   * Payment collection workflow.
   */
  createPaymentCollectionWorkflowService:
    createPaymentCollectionApplicationService,

  /**
   * Payment refund workflow.
   */
  createPaymentRefundWorkflowService:
    createPaymentRefundApplicationService,
} as const;

/* ============================================================================
 * End of Payment Application Module
 * ============================================================================
 */