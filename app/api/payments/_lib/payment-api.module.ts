/**
 * ============================================================================
 * EasyMovers
 * Payment API Module
 * ============================================================================
 *
 * File:
 * app/api/payments/_lib/payment-api.module.ts
 *
 * Purpose:
 *
 * Application/API composition boundary for the Payment domain.
 *
 * Responsibilities:
 *
 * - Register the concrete Payment persistence provider
 * - Initialize the default Payment domain module
 * - Reuse one initialized module across Payment API routes
 * - Reuse the canonical Booking domain service
 * - Compose the Payment application module
 * - Expose Payment service/controller/repository accessors
 * - Expose Payment application workflow accessors
 * - Expose Payment API bootstrap/readiness information
 *
 * IMPORTANT:
 *
 * This file must NOT:
 *
 * - Contain Payment business rules
 * - Contain Booking business rules
 * - Query Prisma directly outside infrastructure composition
 * - Map HTTP requests
 * - Create NextResponse objects
 * - Process gateway webhook signatures
 *
 * Those responsibilities belong to:
 *
 * - PaymentService / BookingService
 * - Payment application workflows
 * - payment-api.request.ts
 * - payment-api.response.ts
 * - gateway/provider adapters
 * ============================================================================
 */

/* ============================================================================
 * Payment domain module runtime
 * ============================================================================
 */

import {
  checkPaymentModuleBootstrapReadiness,
  createPaymentCreationAuthorityProviderFromServices,
  getDefaultPaymentController,
  getDefaultPaymentModule,
   getDefaultPaymentRepository,
  getDefaultPaymentService,
  getPaymentModuleBootstrapState,
  hasDefaultPaymentModule,
  hasDefaultPaymentRepositoryProvider,
  initializePaymentModuleFromDefaultProvider,
  registerDefaultPaymentRepositoryProvider,
} from "../../../../domains/payment/payment.module";

/* ============================================================================
 * Payment domain module types
 * ============================================================================
 */

import type {
  ManagedPaymentModule,
  PaymentModule,
  PaymentModuleBootstrapReadiness,
  PaymentModuleBootstrapState,
  PaymentModuleConfiguration,
  PaymentRepositoryProvider,
} from "../../../../domains/payment/payment.module";

/* ============================================================================
 * Payment service/controller/repository types
 * ============================================================================
 */

import type {
  PaymentCreationAuthorityProvider,
  PaymentServicePort,
} from "../../../../domains/payment/services/payment.service";

import type {
  CompletePaymentController,
} from "../../../../domains/payment/controllers/payment.controller";

import type {
  CompleteExtendedPaymentRepository,
} from "../../../../domains/payment/repositories/payment.repository";

/* ============================================================================
 * Booking and Quotation authority services
 * ============================================================================
 */



import {
  createQuotationModule,
} from "../../../../domains/quotation/quotation.module";

/* ============================================================================
 * Booking domain module
 * ============================================================================
 *
 * Payment application workflows must synchronize authoritative Payment
 * financial state into Booking.
 *
 * The Booking domain module remains responsible for constructing and owning
 * its BookingRepository / BookingService dependency graph.
 * ============================================================================
 */

import {
  getBookingService,
} from "../../../../domains/booking/booking.module";

import type {
  BookingService,
} from "../../../../domains/booking/services/booking.service";

/* ============================================================================
 * Payment application module
 * ============================================================================
 */

import {
  createPaymentApplicationModule,
} from "../../../../application/payments/payment-application.module";

import type {
  PaymentApplicationModule,
} from "../../../../application/payments/payment-application.module";

/* ============================================================================
 * Payment application service types
 * ============================================================================
 */

import type {
  PaymentBookingSyncService,
} from "../../../../application/payments/services/payment-booking-sync.service";

import type {
  PaymentBookingSyncRetryService,
} from "../../../../application/payments/services/payment-booking-sync-retry.service";

import type {
  PaymentCollectionWorkflowService,
} from "../../../../application/payments/services/payment-collection-workflow.service";

import type {
  PaymentRefundWorkflowService,
} from "../../../../application/payments/services/payment-refund-workflow.service";

/* ============================================================================
 * Prisma
 * ============================================================================
 */

import {
  PrismaClient,
} from "@prisma/client";

/* ============================================================================
 * Prisma Payment repository
 * ============================================================================
 */

import {
  createPrismaPaymentRepositoryModule,
} from "../../../../domains/payment/repositories/payment.prisma.repository";

/* ============================================================================
 * Prisma singleton
 * ============================================================================
 *
 * Next.js development mode reloads modules frequently.
 *
 * Storing PrismaClient on globalThis avoids creating a new connection pool
 * every time the Payment API module is re-evaluated.
 * ============================================================================
 */

type PaymentApiGlobal =
  typeof globalThis & {
    __easyMoversPaymentPrisma?:
      PrismaClient;

    __easyMoversPaymentApplicationModule?:
      PaymentApplicationModule;
  };

const paymentApiGlobal =
  globalThis as
    PaymentApiGlobal;

/* ============================================================================
 * Resolve Prisma client
 * ============================================================================
 */

export function getPaymentApiPrismaClient():
  PrismaClient {
  if (
    paymentApiGlobal
      .__easyMoversPaymentPrisma
  ) {
    return paymentApiGlobal
      .__easyMoversPaymentPrisma;
  }

  const prisma =
    new PrismaClient();

  paymentApiGlobal
    .__easyMoversPaymentPrisma =
      prisma;

  return prisma;
}

/* ============================================================================
 * Payment API provider registration
 * ============================================================================
 */

export function registerPaymentApiRepositoryProvider<
  TDependencies
>(
  name:
    string,
  provider:
    PaymentRepositoryProvider<
      TDependencies
    >
): void {
  registerDefaultPaymentRepositoryProvider(
    name,
    provider
  );
}

/* ============================================================================
 * Default Prisma Payment provider
 * ============================================================================
 */

export const PrismaPaymentApiRepositoryProvider:
  PaymentRepositoryProvider<
    PrismaClient
  > = {
  create(
    prisma:
      PrismaClient
  ) {
    const repositoryModule =
      createPrismaPaymentRepositoryModule(
        prisma
      );

    return {
      repository:
        repositoryModule
          .repository,

      transactionManager:
        repositoryModule
          .transactionManager,

      ...(repositoryModule
        .capabilityReport
        ? {
            capabilityReport:
              repositoryModule
                .capabilityReport,
          }
        : {}),

      ...(repositoryModule
        .configuration
        ? {
            configuration:
              repositoryModule
                .configuration,
          }
        : {}),
    };
  },
};

/* ============================================================================
 * Register default Prisma Payment provider
 * ============================================================================
 */

export function registerDefaultPrismaPaymentApiProvider():
  void {
  if (
    hasDefaultPaymentRepositoryProvider()
  ) {
    return;
  }

  registerPaymentApiRepositoryProvider(
    "prisma",
    PrismaPaymentApiRepositoryProvider
  );
}

/* ============================================================================
 * Payment application module helpers
 * ============================================================================
 */

/**
 * Returns the shared Booking domain service.
 *
 * Booking owns construction of its own repository/service graph.
 */
export function requirePaymentApiBookingService():
  BookingService {
  return getBookingService();
}

/**
 * Returns the already composed Payment application module when available.
 */
export function peekPaymentApiApplicationModule():
  PaymentApplicationModule |
  undefined {
  return paymentApiGlobal
    .__easyMoversPaymentApplicationModule;
}

/**
 * Indicates whether the cross-domain Payment application layer has already
 * been composed.
 */
export function isPaymentApiApplicationModuleInitialized():
  boolean {
  return Boolean(
    paymentApiGlobal
      .__easyMoversPaymentApplicationModule
  );
}

/**
 * Builds the Payment application graph once.
 *
 * IMPORTANT:
 *
 * The same final PaymentServicePort instance used by the Payment controller
 * is supplied to the application layer.
 *
 * The canonical BookingService singleton is supplied by booking.module.ts.
 */
export function initializePaymentApiApplicationModule(
  paymentService:
    PaymentServicePort
): PaymentApplicationModule {
  const existing =
    paymentApiGlobal
      .__easyMoversPaymentApplicationModule;

  if (
    existing
  ) {
    return existing;
  }

    const bookingService =
    requirePaymentApiBookingService();

  const paymentBookingSyncRepository =
    getDefaultPaymentRepository();

  const applicationModule =
    createPaymentApplicationModule({
      paymentService,

      bookingService,

      paymentBookingSyncRepository,
    });

  paymentApiGlobal
    .__easyMoversPaymentApplicationModule =
      applicationModule;

  return applicationModule;
}

/**
 * Returns the initialized application module.
 *
 * This accessor deliberately does not manufacture a separate Payment service.
 */
export function requirePaymentApiApplicationModule():
  PaymentApplicationModule {
  const existing =
    peekPaymentApiApplicationModule();

  if (
    existing
  ) {
    return existing;
  }

  if (
    !hasDefaultPaymentModule()
  ) {
    throw new Error(
      "Payment API application module cannot initialize before the Payment domain module."
    );
  }

  return initializePaymentApiApplicationModule(
    getDefaultPaymentService()
  );
}

/* ============================================================================
 * Payment application workflow accessors
 * ============================================================================
 */

/**
 * Shared Payment -> Booking synchronization service.
 */
export function requirePaymentApiBookingSyncService():
  PaymentBookingSyncService {
  return requirePaymentApiApplicationModule()
    .paymentBookingSyncService;
}

/**
 * Shared Payment -> Booking synchronization retry processor.
 */
export function requirePaymentApiBookingSyncRetryService():
  PaymentBookingSyncRetryService {
  return requirePaymentApiApplicationModule()
    .paymentBookingSyncRetryService;
}
/**
 * Shared successful-collection application workflow.
 */
export function requirePaymentApiCollectionWorkflowService():
  PaymentCollectionWorkflowService {
  return requirePaymentApiApplicationModule()
    .paymentCollectionWorkflowService;
}

/**
 * Shared refund application workflow.
 *
 * Handles:
 *
 * - refund request
 * - refund completion
 * - automatic Payment -> Booking financial synchronization
 */
export function requirePaymentApiRefundWorkflowService():
  PaymentRefundWorkflowService {
  return requirePaymentApiApplicationModule()
    .paymentRefundWorkflowService;
}

/* ============================================================================
 * Payment API initialization input
 * ============================================================================
 */

export interface InitializePaymentApiModuleInput<
  TDependencies =
    unknown
> {
  dependencies:
    TDependencies;

  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  configuration?:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Payment API initialization result
 * ============================================================================
 */

export interface PaymentApiModuleContext {
  module:
    PaymentModule;

  service:
    PaymentServicePort;

  controller:
    CompletePaymentController;

  repository:
    CompleteExtendedPaymentRepository;

  /**
   * Cross-domain application graph.
   */
  application:
    PaymentApplicationModule;

  /**
   * Canonical Booking service participating in Payment -> Booking sync.
   */
  bookingService:
    BookingService;
}

/* ============================================================================
 * API initialization promise
 * ============================================================================
 */

let paymentApiInitializationPromise:
  Promise<
    PaymentApiModuleContext
  > |
  undefined;

/* ============================================================================
 * Build API context from initialized domain module
 * ============================================================================
 */

export function getInitializedPaymentApiContext():
  PaymentApiModuleContext {
  if (
    !hasDefaultPaymentModule()
  ) {
    throw new Error(
      "Payment API module has not been initialized."
    );
  }

  const service =
    getDefaultPaymentService();

  const application =
    initializePaymentApiApplicationModule(
      service
    );

  const bookingService =
    requirePaymentApiBookingService();

  return {
    module:
      getDefaultPaymentModule(),

    service,

    controller:
      getDefaultPaymentController(),

    repository:
      getDefaultPaymentRepository(),

    application,

    bookingService,
  };
}

/* ============================================================================
 * Initialize Payment API module
 * ============================================================================
 */

export async function initializePaymentApiModule<
  TDependencies
>(
  input:
    InitializePaymentApiModuleInput<
      TDependencies
    >
): Promise<
  PaymentApiModuleContext
> {
  /* ------------------------------------------------------------------------
   * Already initialized
   * ------------------------------------------------------------------------
   */

  if (
    hasDefaultPaymentModule()
  ) {
    return getInitializedPaymentApiContext();
  }

  /* ------------------------------------------------------------------------
   * Initialization already running
   * ------------------------------------------------------------------------
   */

  if (
    paymentApiInitializationPromise
  ) {
    return paymentApiInitializationPromise;
  }

  /* ------------------------------------------------------------------------
   * Provider required
   * ------------------------------------------------------------------------
   */

  if (
    !hasDefaultPaymentRepositoryProvider()
  ) {
    throw new Error(
      "Payment API cannot initialize because no Payment repository provider has been registered."
    );
  }

  /* ------------------------------------------------------------------------
   * Initialize Payment domain first
   * ------------------------------------------------------------------------
   */

  paymentApiInitializationPromise =
  initializePaymentModuleFromDefaultProvider({
    dependencies:
      input.dependencies,

    ...(input.creationAuthorityProvider
      ? {
          creationAuthorityProvider:
            input.creationAuthorityProvider,
        }
      : {}),

    ...(input.configuration
      ? {
          configuration:
            input.configuration,
        }
      : {}),
  })

      .then(
        (
          _managedModule:
            ManagedPaymentModule
        ) => {
          /*
           * getInitializedPaymentApiContext() composes the application graph
           * only after the Payment domain service is ready.
           */
          return getInitializedPaymentApiContext();
        }
      )
      .finally(
        () => {
          paymentApiInitializationPromise =
            undefined;
        }
      );

  return paymentApiInitializationPromise;
}

/* ============================================================================
 * Bootstrap Prisma-backed Payment API
 * ============================================================================
 */

export async function initializePrismaPaymentApiModule():
  Promise<
    PaymentApiModuleContext
  > {
  registerDefaultPrismaPaymentApiProvider();

  const prisma =
    getPaymentApiPrismaClient();

  const bookingService =
    getBookingService();

  const quotationModule =
    createQuotationModule({
      prisma,
    });

  const creationAuthorityProvider =
    createPaymentCreationAuthorityProviderFromServices({
      bookingService,

      quotationService:
        quotationModule.service,
    });

  return initializePaymentApiModule({
    dependencies:
      prisma,

    creationAuthorityProvider,
  });
}

/* ============================================================================
 * Require Payment API controller
 * ============================================================================
 */

export function requirePaymentApiController():
  CompletePaymentController {
  return getInitializedPaymentApiContext()
    .controller;
}

/* ============================================================================
 * Resolve initialized Payment API controller
 * ============================================================================
 */

export async function resolvePaymentApiController():
  Promise<
    CompletePaymentController
  > {
  const context =
    await ensurePrismaPaymentApiReady();

  return context.controller;
}

/* ============================================================================
 * Require Payment API service
 * ============================================================================
 */

export function requirePaymentApiService():
  PaymentServicePort {
  return getInitializedPaymentApiContext()
    .service;
}

/* ============================================================================
 * Resolve Payment API service
 * ============================================================================
 */

export async function resolvePaymentApiService():
  Promise<
    PaymentServicePort
  > {
  const context =
    await ensurePrismaPaymentApiReady();

  return context.service;
}

/* ============================================================================
 * Require Payment API repository
 * ============================================================================
 */

/**
 * Route files should normally use the controller/application workflow rather
 * than this accessor.
 *
 * It remains available for diagnostics and integration tests.
 */
export function requirePaymentApiRepository():
  CompleteExtendedPaymentRepository {
  return getInitializedPaymentApiContext()
    .repository;
}

/* ============================================================================
 * Resolve Payment application module
 * ============================================================================
 */

export async function resolvePaymentApiApplicationModule():
  Promise<
    PaymentApplicationModule
  > {
  const context =
    await ensurePrismaPaymentApiReady();

  return context.application;
}

/* ============================================================================
 * Resolve Payment -> Booking synchronization service
 * ============================================================================
 */

export async function resolvePaymentApiBookingSyncService():
  Promise<
    PaymentBookingSyncService
  > {
  const application =
    await resolvePaymentApiApplicationModule();

  return application
    .paymentBookingSyncService;
}

/* ============================================================================
 * Resolve Payment -> Booking synchronization retry processor
 * ============================================================================
 */

export async function resolvePaymentApiBookingSyncRetryService():
  Promise<
    PaymentBookingSyncRetryService
  > {
  const application =
    await resolvePaymentApiApplicationModule();

  return application
    .paymentBookingSyncRetryService;
}

/* ============================================================================
 * Resolve Payment collection workflow
 * ============================================================================
 */

export async function resolvePaymentApiCollectionWorkflowService():
  Promise<
    PaymentCollectionWorkflowService
  > {
  const application =
    await resolvePaymentApiApplicationModule();

  return application
    .paymentCollectionWorkflowService;
}

/* ============================================================================
 * Resolve Payment collection workflow
 * Backward-compatible API accessor
 * ============================================================================
 */

export async function resolvePaymentCollectionWorkflow():
  Promise<
    PaymentCollectionWorkflowService
  > {
  return resolvePaymentApiCollectionWorkflowService();
}
/* ============================================================================
 * Resolve Payment refund workflow
 * ============================================================================
 */

/**
 * This is the preferred accessor for refund route handlers.
 *
 * Unlike the old synchronous initialization check, it waits for the Payment
 * API bootstrap and then returns the shared refund workflow.
 */
export async function resolvePaymentApiRefundWorkflowService():
  Promise<
    PaymentRefundWorkflowService
  > {
  const application =
    await resolvePaymentApiApplicationModule();

  return application
    .paymentRefundWorkflowService;
}

/* ============================================================================
 * Resolve Payment refund workflow
 * Backward-compatible API accessor
 * ============================================================================
 */

export async function resolvePaymentRefundWorkflow():
  Promise<
    PaymentRefundWorkflowService
  > {
  return resolvePaymentApiRefundWorkflowService();
}
/* ============================================================================
 * Payment API initialized?
 * ============================================================================
 */

export function isPaymentApiModuleInitialized():
  boolean {
  return hasDefaultPaymentModule();
}

/* ============================================================================
 * Payment API bootstrap state
 * ============================================================================
 */

export function getPaymentApiBootstrapState():
  PaymentModuleBootstrapState {
  return getPaymentModuleBootstrapState();
}

/* ============================================================================
 * Payment API readiness
 * ============================================================================
 */

export async function checkPaymentApiReadiness():
  Promise<
    PaymentModuleBootstrapReadiness
  > {
  return checkPaymentModuleBootstrapReadiness();
}

/* ============================================================================
 * Ensure Payment API initialized
 * ============================================================================
 */

export async function ensurePaymentApiModule<
  TDependencies
>(
  input?:
    InitializePaymentApiModuleInput<
      TDependencies
    >
): Promise<
  PaymentApiModuleContext
> {
  if (
    hasDefaultPaymentModule()
  ) {
    return getInitializedPaymentApiContext();
  }

  if (
    !input
  ) {
    throw new Error(
      "Payment API module is not initialized and initialization dependencies were not supplied."
    );
  }

  return initializePaymentApiModule(
    input
  );
}

/* ============================================================================
 * Payment API diagnostics
 * ============================================================================
 */

export interface PaymentApiModuleDiagnostics {
  providerRegistered:
    boolean;

  initialized:
    boolean;

  initializationRunning:
    boolean;

  applicationInitialized:
    boolean;

  bootstrap:
    PaymentModuleBootstrapState;
}

/* ============================================================================
 * Read Payment API diagnostics
 * ============================================================================
 */

export function getPaymentApiModuleDiagnostics():
  PaymentApiModuleDiagnostics {
  return {
    providerRegistered:
      hasDefaultPaymentRepositoryProvider(),

    initialized:
      hasDefaultPaymentModule(),

    initializationRunning:
      Boolean(
        paymentApiInitializationPromise
      ),

    applicationInitialized:
      isPaymentApiApplicationModuleInitialized(),

    bootstrap:
      getPaymentModuleBootstrapState(),
  };
}

/* ============================================================================
 * Payment API module facade
 * ============================================================================
 */

export const PaymentApiModule = {
  /* ------------------------------------------------------------------------
   * Provider
   * ------------------------------------------------------------------------
   */

  registerProvider:
    registerPaymentApiRepositoryProvider,

  hasProvider:
    hasDefaultPaymentRepositoryProvider,

  registerPrismaProvider:
    registerDefaultPrismaPaymentApiProvider,

  /* ------------------------------------------------------------------------
   * Initialization
   * ------------------------------------------------------------------------
   */

  initialize:
    initializePaymentApiModule,

  initializePrisma:
    initializePrismaPaymentApiModule,

  ensure:
    ensurePaymentApiModule,

  ensurePrisma:
    ensurePrismaPaymentApiReady,

  initialized:
    isPaymentApiModuleInitialized,

  /* ------------------------------------------------------------------------
   * Domain context
   * ------------------------------------------------------------------------
   */

  context:
    getInitializedPaymentApiContext,

  controller:
    requirePaymentApiController,

  resolveController:
    resolvePaymentApiController,

  service:
    requirePaymentApiService,

  resolveService:
    resolvePaymentApiService,

  repository:
    requirePaymentApiRepository,

  /* ------------------------------------------------------------------------
   * Application context
   * ------------------------------------------------------------------------
   */

  application:
    requirePaymentApiApplicationModule,

  resolveApplication:
    resolvePaymentApiApplicationModule,

  applicationInitialized:
    isPaymentApiApplicationModuleInitialized,

  /* ------------------------------------------------------------------------
   * Payment -> Booking synchronization
   * ------------------------------------------------------------------------
   */

    bookingSync:
    requirePaymentApiBookingSyncService,

  resolveBookingSync:
    resolvePaymentApiBookingSyncService,

  bookingSyncRetry:
    requirePaymentApiBookingSyncRetryService,

  resolveBookingSyncRetry:
    resolvePaymentApiBookingSyncRetryService,

/* ------------------------------------------------------------------------
 * Collection workflow
 * ------------------------------------------------------------------------
 */

collectionWorkflow:
  requirePaymentApiCollectionWorkflowService,

resolveCollectionWorkflow:
  resolvePaymentCollectionWorkflow,

resolveCollectionWorkflowService:
  resolvePaymentApiCollectionWorkflowService,

/* ------------------------------------------------------------------------
 * Refund workflow
 * ------------------------------------------------------------------------
 */

refundWorkflow:
  requirePaymentApiRefundWorkflowService,

resolveRefundWorkflow:
  resolvePaymentRefundWorkflow,

resolveRefundWorkflowService:
  resolvePaymentApiRefundWorkflowService,
  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  bootstrapState:
    getPaymentApiBootstrapState,

  readiness:
    checkPaymentApiReadiness,

  diagnostics:
    getPaymentApiModuleDiagnostics,
} as const;

/* ============================================================================
 * Payment API module port
 * ============================================================================
 */

export type PaymentApiModulePort =
  typeof PaymentApiModule;

/* ============================================================================
 * Automatic Prisma Payment API bootstrap
 * ============================================================================
 */

registerDefaultPrismaPaymentApiProvider();

/**
 * Initialization starts once when the Payment API module is evaluated.
 *
 * Payment route files import this module, so the Payment domain becomes
 * available without repeating repository/service/controller construction.
 *
 * When Payment initialization completes, getInitializedPaymentApiContext()
 * also composes the Payment application module using the canonical Booking
 * domain service.
 */
const paymentApiBootstrapPromise =
  initializePrismaPaymentApiModule();

/* ============================================================================
 * Await Payment API bootstrap
 * ============================================================================
 */

export async function ensurePrismaPaymentApiReady():
  Promise<
    PaymentApiModuleContext
  > {
  if (
    hasDefaultPaymentModule()
  ) {
    return getInitializedPaymentApiContext();
  }

  return paymentApiBootstrapPromise;
}

/* ============================================================================
 * End of Payment API Module
 * ============================================================================
 */