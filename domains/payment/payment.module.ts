/**
 * ============================================================================
 * EasyMovers
 * Payment Module
 * Part A
 * ============================================================================
 *
 * File:
 * domains/payment/payment.module.ts
 *
 * Responsibilities:
 *
 * - Define Payment module contracts
 * - Compose repository + transaction manager
 * - Compose Payment service
 * - Compose Payment controller
 * - Expose canonical module dependencies
 * - Expose module factories
 *
 * Part A intentionally does NOT instantiate PrismaClient directly.
 *
 * Concrete Prisma repository creation belongs in Part B after the exact
 * payment.prisma.repository.ts factory exports are bound to this module.
 * ============================================================================
 */

/* ============================================================================
 * Repository contracts
 * ============================================================================
 */

import type {
  CompleteExtendedPaymentRepository,
  ExtendedPaymentRepositoryTransactionManager,
  PaymentRepositoryCapabilityReport,
  PaymentRepositoryConfigurationValidation,
} from "./repositories/payment.repository";

/* ============================================================================
 * Service runtime
 * ============================================================================
 */

import {
  createOperationalPaymentService,
} from "./services/payment.service";

/* ============================================================================
 * Service types
 * ============================================================================
 */
import type {
  CompleteOperationalPaymentService,
  PaymentCreationAuthorityProvider,
  PaymentCreationBookingAuthority,
  PaymentCreationQuotationAuthority,
  PaymentServiceConfiguration,
  PaymentServiceDependencies,
  PaymentServicePort,
} from "./services/payment.service";

/* ============================================================================
 * Controller runtime
 * ============================================================================
 */

import {
  createCompletePaymentController,
} from "./controllers/payment.controller";

/* ============================================================================
 * Controller types
 * ============================================================================
 */

import type {
  CompletePaymentController,
  PaymentControllerDependencies,
} from "./controllers/payment.controller";

import type {
  BookingService,
} from "../booking/services/booking.service";

import type {
  QuotationService,
} from "../quotation/services/quotation.service";

import {
  PaymentCurrency,
} from "./models/payment.model";

/* ============================================================================
 * Payment module repository dependencies
 * ============================================================================
 */

/**
 * Persistence dependencies required by the Payment module.
 *
 * The module depends on repository abstractions rather than Prisma directly.
 */
export interface PaymentModuleRepositoryDependencies {
  repository:
    CompleteExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  /**
   * Cross-domain authority used only when creating a Payment.
   *
   * It verifies Booking, selected Quotation, Vendor, amount and currency
   * against their authoritative domain records.
   */
  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  capabilityReport?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;
}
/* ============================================================================
 * Payment module configuration
 * ============================================================================
 */

export interface PaymentModuleConfiguration {
  service?:
    Partial<
      PaymentServiceConfiguration
    >;
}

/* ============================================================================
 * Payment module creation input
 * ============================================================================
 */

export interface CreatePaymentModuleInput {
  repositories:
    PaymentModuleRepositoryDependencies;

  configuration?:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Payment module services
 * ============================================================================
 */

export interface PaymentModuleServices {
  payment:
    PaymentServicePort;
}

/* ============================================================================
 * Payment module controllers
 * ============================================================================
 */

export interface PaymentModuleControllers {
  payment:
    CompletePaymentController;
}

/* ============================================================================
 * Complete Payment module
 * ============================================================================
 */

export interface PaymentModule {
  repositories:
    PaymentModuleRepositoryDependencies;

  services:
    PaymentModuleServices;

  controllers:
    PaymentModuleControllers;

  configuration:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Repository dependency validation
 * ============================================================================
 */

export function requirePaymentModuleRepositoryDependencies(
  dependencies:
    PaymentModuleRepositoryDependencies
): PaymentModuleRepositoryDependencies {
  if (
    !dependencies
  ) {
    throw new Error(
      "Payment module repository dependencies are required."
    );
  }

  if (
    !dependencies.repository
  ) {
    throw new Error(
      "Payment module requires a Payment repository."
    );
  }

  if (
    !dependencies.transactionManager
  ) {
    throw new Error(
      "Payment module requires a Payment repository transaction manager."
    );
  }

  return dependencies;
}

/* ============================================================================
 * Normalize module configuration
 * ============================================================================
 */

export function normalizePaymentModuleConfiguration(
  configuration?:
    PaymentModuleConfiguration
): PaymentModuleConfiguration {
  return {
    ...(configuration
      ?.service
      ? {
          service: {
            ...configuration
              .service,
          },
        }
      : {}),
  };
}

/* ============================================================================
 * Payment creation authority composition
 * ============================================================================
 */

export interface PaymentCreationAuthorityServices {
  bookingService:
    Pick<
      BookingService,
      "getBooking"
    >;

  quotationService:
    Pick<
      QuotationService,
      "getById"
    >;
}

export function requirePaymentCreationAuthorityServices(
  services:
    PaymentCreationAuthorityServices
): PaymentCreationAuthorityServices {
  if (
    !services ||
    !services.bookingService
  ) {
    throw new Error(
      "Payment creation authority requires BookingService."
    );
  }

  if (
    !services.quotationService
  ) {
    throw new Error(
      "Payment creation authority requires QuotationService."
    );
  }

  return services;
}

export function mapQuotationCurrencyToPaymentCurrency(
  currency:
    string
): PaymentCurrency {
  switch (
    currency
  ) {
    case "INR":
      return PaymentCurrency.INR;

    default:
      throw new Error(
        `Unsupported Quotation currency for Payment creation: ${currency}`
      );
  }
}
export function createPaymentCreationAuthorityProviderFromServices(
  services:
    PaymentCreationAuthorityServices
): PaymentCreationAuthorityProvider {
  const resolved =
    requirePaymentCreationAuthorityServices(
      services
    );

  return {
    async getBookingAuthority(
      bookingId:
        string
    ): Promise<
      PaymentCreationBookingAuthority |
      null
    > {
      const booking =
        await resolved.bookingService
          .getBooking(
            bookingId
          );

      if (
        !booking
      ) {
        return null;
      }

      return {
        bookingId:
          booking.bookingId,

        bookingNumber:
          booking.bookingCode,

        status:
          booking.status,

        ...(booking.quotation
          ?.selectedQuotationId !==
        undefined
          ? {
              selectedQuotationId:
                booking.quotation
                  .selectedQuotationId,
            }
          : {}),

        ...(booking.quotation
          ?.selectedQuoteAmount !==
        undefined
          ? {
              selectedQuoteAmount:
                booking.quotation
                  .selectedQuoteAmount,
            }
          : {}),

        ...(booking.vendor
          ?.vendorId !==
        undefined
          ? {
              vendorId:
                booking.vendor
                  .vendorId,
            }
          : {}),
      };
    },

    async getQuotationAuthority(
      quotationId:
        string
    ): Promise<
      PaymentCreationQuotationAuthority |
      null
    > {
      const result =
        await resolved.quotationService
          .getById(
            quotationId
          );

      if (
        !result.success
      ) {
        if (
          result.error.code ===
            "QUOTATION_NOT_FOUND"
        ) {
          return null;
        }

        throw new Error(
          `Unable to obtain authoritative Quotation: ${result.error.message}`
        );
      }

      const quotation =
        result.data;

      return {
        quotationId:
          quotation.quotationId,

        bookingId:
          quotation.booking
            .bookingId,

        vendorId:
          quotation.vendor
            .vendorId,

        status:
          quotation.status,

        selectedForBooking:
          quotation.selectedForBooking,

        totalAmount:
          quotation.costs
            .totalAmount,

                currency:
          mapQuotationCurrencyToPaymentCurrency(
            quotation.costs
              .currency
          ),
      };
    },
  };
}
/* ============================================================================
 * Create Payment service dependencies
 * ============================================================================
 */

export function createPaymentModuleServiceDependencies(
  repositories:
    PaymentModuleRepositoryDependencies
): PaymentServiceDependencies {
  const resolved =
    requirePaymentModuleRepositoryDependencies(
      repositories
    );

  return {
  repository:
    resolved.repository,

  transactionManager:
    resolved.transactionManager,

  ...(resolved.creationAuthorityProvider
    ? {
        creationAuthorityProvider:
          resolved.creationAuthorityProvider,
      }
    : {}),

  ...(resolved.capabilityReport
    ? {
        capabilityReport:
          resolved.capabilityReport,
      }
    : {}),

  ...(resolved.configuration
    ? {
        configuration:
          resolved.configuration,
      }
    : {}),
};
}
/*
============================================================================
 * Create Payment service
 * ============================================================================
 */

export function createPaymentModuleService(
  repositories:
    PaymentModuleRepositoryDependencies,
  configuration?:
    PaymentModuleConfiguration
): CompleteOperationalPaymentService {
  const dependencies =
    createPaymentModuleServiceDependencies(
      repositories
    );

  return createOperationalPaymentService(
    dependencies,
    configuration
      ?.service ??
      {}
  );
}

/* ============================================================================
 * Create Payment controller dependencies
 * ============================================================================
 */

export function createPaymentModuleControllerDependencies(
  paymentService:
    PaymentServicePort
): PaymentControllerDependencies {
  if (
    !paymentService
  ) {
    throw new Error(
      "Payment module requires PaymentService before creating controllers."
    );
  }

  return {
    paymentService,
  };
}

/* ============================================================================
 * Create Payment controller
 * ============================================================================
 */

export function createPaymentModuleController(
  paymentService:
    PaymentServicePort
): CompletePaymentController {
  return createCompletePaymentController(
    createPaymentModuleControllerDependencies(
      paymentService
    )
  );
}

/* ============================================================================
 * Create Payment services collection
 * ============================================================================
 */

export function createPaymentModuleServices(
  repositories:
    PaymentModuleRepositoryDependencies,
  configuration?:
    PaymentModuleConfiguration
): PaymentModuleServices {
  const paymentService =
    createPaymentModuleService(
      repositories,
      configuration
    );

  return {
    payment:
      paymentService,
  };
}

/* ============================================================================
 * Create Payment controllers collection
 * ============================================================================
 */

export function createPaymentModuleControllers(
  services:
    PaymentModuleServices
): PaymentModuleControllers {
  return {
    payment:
      createPaymentModuleController(
        services.payment
      ),
  };
}

/* ============================================================================
 * Create complete Payment module
 * ============================================================================
 */

export function createPaymentModule(
  input:
    CreatePaymentModuleInput
): PaymentModule {
  const repositories =
    requirePaymentModuleRepositoryDependencies(
      input.repositories
    );

  const configuration =
    normalizePaymentModuleConfiguration(
      input.configuration
    );

  const services =
    createPaymentModuleServices(
      repositories,
      configuration
    );

  const controllers =
    createPaymentModuleControllers(
      services
    );

  return {
    repositories,

    services,

    controllers,

    configuration,
  };
}

/* ============================================================================
 * Payment module type guards
 * ============================================================================
 */

export function isPaymentModule(
  value:
    unknown
): value is
  PaymentModule {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }

  const candidate =
    value as
      Partial<
        PaymentModule
      >;

  return Boolean(
    candidate.repositories &&
    candidate.services
      ?.payment &&
    candidate.controllers
      ?.payment
  );
}

/* ============================================================================
 * Require complete Payment module
 * ============================================================================
 */

export function requirePaymentModule(
  value:
    unknown
): PaymentModule {
  if (
    !isPaymentModule(
      value
    )
  ) {
    throw new Error(
      "A complete Payment module is required."
    );
  }

  return value;
}

/* ============================================================================
 * Payment module accessors
 * ============================================================================
 */

export function getPaymentModuleRepository(
  module:
    PaymentModule
): CompleteExtendedPaymentRepository {
  return requirePaymentModule(
    module
  ).repositories
    .repository;
}

export function getPaymentModuleTransactionManager(
  module:
    PaymentModule
): ExtendedPaymentRepositoryTransactionManager {
  return requirePaymentModule(
    module
  ).repositories
    .transactionManager;
}

export function getPaymentModuleService(
  module:
    PaymentModule
): PaymentServicePort {
  return requirePaymentModule(
    module
  ).services
    .payment;
}

export function getPaymentModuleController(
  module:
    PaymentModule
): CompletePaymentController {
  return requirePaymentModule(
    module
  ).controllers
    .payment;
}

/* ============================================================================
 * Payment module diagnostics
 * ============================================================================
 */

export interface PaymentModuleDiagnostics {
  repositoryConfigured:
    boolean;

  transactionManagerConfigured:
    boolean;

  serviceConfigured:
    boolean;

  controllerConfigured:
    boolean;

  capabilityReportAvailable:
    boolean;

  repositoryConfigurationAvailable:
    boolean;
}

export function getPaymentModuleDiagnostics(
  module:
    PaymentModule
): PaymentModuleDiagnostics {
  const resolved =
    requirePaymentModule(
      module
    );

  return {
    repositoryConfigured:
      Boolean(
        resolved.repositories
          .repository
      ),

    transactionManagerConfigured:
      Boolean(
        resolved.repositories
          .transactionManager
      ),

    serviceConfigured:
      Boolean(
        resolved.services
          .payment
      ),

    controllerConfigured:
      Boolean(
        resolved.controllers
          .payment
      ),

    capabilityReportAvailable:
      Boolean(
        resolved.repositories
          .capabilityReport
      ),

    repositoryConfigurationAvailable:
      Boolean(
        resolved.repositories
          .configuration
      ),
  };
}

/* ============================================================================
 * Payment module facade
 * ============================================================================
 */

export const PaymentModuleFacade = {
  /* ------------------------------------------------------------------------
   * Factory
   * ------------------------------------------------------------------------
   */

  create:
    createPaymentModule,

  /* ------------------------------------------------------------------------
   * Composition
   * ------------------------------------------------------------------------
   */

  createServiceDependencies:
    createPaymentModuleServiceDependencies,

createPaymentCreationAuthorityProviderFromServices,
requirePaymentCreationAuthorityServices,

  createService:
    createPaymentModuleService,

  createServices:
    createPaymentModuleServices,

  createControllerDependencies:
    createPaymentModuleControllerDependencies,

  createController:
    createPaymentModuleController,

  createControllers:
    createPaymentModuleControllers,



  /* ------------------------------------------------------------------------
   * Guards
   * ------------------------------------------------------------------------
   */

  isModule:
    isPaymentModule,

  requireModule:
    requirePaymentModule,

  requireRepositories:
    requirePaymentModuleRepositoryDependencies,

  /* ------------------------------------------------------------------------
   * Access
   * ------------------------------------------------------------------------
   */

  repository:
    getPaymentModuleRepository,

  transactionManager:
    getPaymentModuleTransactionManager,

  service:
    getPaymentModuleService,

  controller:
    getPaymentModuleController,

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  diagnostics:
    getPaymentModuleDiagnostics,
} as const;

/* ============================================================================
 * Canonical Payment module port
 * ============================================================================
 */

export type PaymentModulePort =
  PaymentModule;

/* ============================================================================
 * End of Payment Module - Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Module
 * Part B
 * ============================================================================
 *
 * Infrastructure binding / lifecycle:
 *
 * - Bind concrete persistence adapter
 * - Normalize Prisma repository module
 * - Build Payment module from persistence adapter
 * - Capability/configuration propagation
 * - Default/singleton Payment module
 * - Module initialization state
 * - Reset / replacement support
 * - Disposal lifecycle
 *
 * IMPORTANT:
 *
 * This section deliberately depends on the Payment repository contracts,
 * not on guessed factory names from payment.prisma.repository.ts.
 *
 * Part C can directly bind the exact Prisma exports once those names are
 * compiler-confirmed.
 * ============================================================================
 */

/* ============================================================================
 * Persistence adapter contract
 * ============================================================================
 */

/**
 * Concrete persistence adapters — Prisma in production, mocks in tests —
 * expose this normalized shape to the Payment module.
 */
export interface PaymentPersistenceAdapter {
  repository:
    CompleteExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  capabilityReport?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;

  dispose?:
    () =>
      void |
      Promise<void>;
}

/* ============================================================================
 * Persistence adapter factory
 * ============================================================================
 */

export type PaymentPersistenceAdapterFactory<
  TDependencies =
    void
> = (
  dependencies:
    TDependencies
) =>
  PaymentPersistenceAdapter |
  Promise<
    PaymentPersistenceAdapter
  >;

/* ============================================================================
 * Module creation from persistence adapter
 * ============================================================================
 */

export interface CreatePaymentModuleFromAdapterInput {
  adapter:
    PaymentPersistenceAdapter;

  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  configuration?:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Async module factory input
 * ============================================================================
 */

export interface CreatePaymentModuleFromFactoryInput<
  TDependencies
> {
  factory:
    PaymentPersistenceAdapterFactory<
      TDependencies
    >;

  dependencies:
    TDependencies;

  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  configuration?:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Managed Payment module
 * ============================================================================
 */

/**
 * Managed wrapper preserves the persistence adapter used to create the module.
 *
 * This is useful when the adapter owns resources that require cleanup.
 */
export interface ManagedPaymentModule {
  module:
    PaymentModule;

  adapter:
    PaymentPersistenceAdapter;

  dispose:
    () => Promise<void>;
}

/* ============================================================================
 * Validate persistence adapter
 * ============================================================================
 */

export function requirePaymentPersistenceAdapter(
  adapter:
    PaymentPersistenceAdapter
): PaymentPersistenceAdapter {
  if (
    !adapter
  ) {
    throw new Error(
      "Payment persistence adapter is required."
    );
  }

  if (
    !adapter.repository
  ) {
    throw new Error(
      "Payment persistence adapter must provide a repository."
    );
  }

  if (
    !adapter.transactionManager
  ) {
    throw new Error(
      "Payment persistence adapter must provide a transaction manager."
    );
  }

  return adapter;
}

/* ============================================================================
 * Persistence adapter -> module repository dependencies
 * ============================================================================
 */

export function createPaymentModuleRepositoryDependenciesFromAdapter(
  adapter:
    PaymentPersistenceAdapter
): PaymentModuleRepositoryDependencies {
  const resolved =
    requirePaymentPersistenceAdapter(
      adapter
    );

  return {
    repository:
      resolved.repository,

    transactionManager:
      resolved.transactionManager,

    ...(resolved.capabilityReport
      ? {
          capabilityReport:
            resolved
              .capabilityReport,
        }
      : {}),

    ...(resolved.configuration
      ? {
          configuration:
            resolved
              .configuration,
        }
      : {}),
  };
}

/* ============================================================================
 * Create module from persistence adapter
 * ============================================================================
 */

export function createPaymentModuleFromAdapter(
  input:
    CreatePaymentModuleFromAdapterInput
): PaymentModule {
  const adapter =
    requirePaymentPersistenceAdapter(
      input.adapter
    );

  const repositoryDependencies =
    createPaymentModuleRepositoryDependenciesFromAdapter(
      adapter
    );

  return createPaymentModule({
    repositories: {
      ...repositoryDependencies,

      ...(input.creationAuthorityProvider
        ? {
            creationAuthorityProvider:
              input.creationAuthorityProvider,
          }
        : {}),
    },

    ...(input.configuration
      ? {
          configuration:
            input.configuration,
        }
      : {}),
  });
}

/* ============================================================================
 * Create module asynchronously from persistence factory
 * ============================================================================
 */

export async function createPaymentModuleFromFactory<
  TDependencies
>(
  input:
    CreatePaymentModuleFromFactoryInput<
      TDependencies
    >
): Promise<
  ManagedPaymentModule
> {
  const adapter =
    requirePaymentPersistenceAdapter(
      await input.factory(
        input.dependencies
      )
    );

  const module =
  createPaymentModuleFromAdapter({
    adapter,

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
  });

  return createManagedPaymentModule(
    module,
    adapter
  );
}

/* ============================================================================
 * Managed module factory
 * ============================================================================
 */

export function createManagedPaymentModule(
  module:
    PaymentModule,
  adapter:
    PaymentPersistenceAdapter
): ManagedPaymentModule {
  const resolvedModule =
    requirePaymentModule(
      module
    );

  const resolvedAdapter =
    requirePaymentPersistenceAdapter(
      adapter
    );

  let disposed =
    false;

  return {
    module:
      resolvedModule,

    adapter:
      resolvedAdapter,

    dispose:
      async () => {
        if (
          disposed
        ) {
          return;
        }

        disposed =
          true;

        if (
          resolvedAdapter
            .dispose
        ) {
          await resolvedAdapter
            .dispose();
        }
      },
  };
}

/* ============================================================================
 * Payment module runtime state
 * ============================================================================
 */

export type PaymentModuleRuntimeStatus =
  | "UNINITIALIZED"
  | "INITIALIZING"
  | "READY"
  | "FAILED"
  | "DISPOSING"
  | "DISPOSED";

/* ============================================================================
 * Runtime snapshot
 * ============================================================================
 */

export interface PaymentModuleRuntimeSnapshot {
  status:
    PaymentModuleRuntimeStatus;

  initialized:
    boolean;

  hasModule:
    boolean;

  initializedAt?:
    string;

  disposedAt?:
    string;

  failureMessage?:
    string;
}

/* ============================================================================
 * Runtime storage
 * ============================================================================
 */

let defaultPaymentModule:
  ManagedPaymentModule |
  undefined;

let defaultPaymentModulePromise:
  Promise<
    ManagedPaymentModule
  > |
  undefined;

let paymentModuleRuntimeStatus:
  PaymentModuleRuntimeStatus =
    "UNINITIALIZED";

let paymentModuleInitializedAt:
  string |
  undefined;

let paymentModuleDisposedAt:
  string |
  undefined;

let paymentModuleFailureMessage:
  string |
  undefined;

/* ============================================================================
 * Runtime snapshot accessor
 * ============================================================================
 */

export function getPaymentModuleRuntimeSnapshot():
  PaymentModuleRuntimeSnapshot {
  return {
    status:
      paymentModuleRuntimeStatus,

    initialized:
      paymentModuleRuntimeStatus ===
        "READY",

    hasModule:
      Boolean(
        defaultPaymentModule
      ),

    ...(paymentModuleInitializedAt
      ? {
          initializedAt:
            paymentModuleInitializedAt,
        }
      : {}),

    ...(paymentModuleDisposedAt
      ? {
          disposedAt:
            paymentModuleDisposedAt,
        }
      : {}),

    ...(paymentModuleFailureMessage
      ? {
          failureMessage:
            paymentModuleFailureMessage,
        }
      : {}),
  };
}

/* ============================================================================
 * Default module existence
 * ============================================================================
 */

export function hasDefaultPaymentModule():
  boolean {
  return Boolean(
    defaultPaymentModule
  );
}

/* ============================================================================
 * Set default Payment module
 * ============================================================================
 */

export function setDefaultPaymentModule(
  managedModule:
    ManagedPaymentModule
): ManagedPaymentModule {
  if (
    !managedModule ||
    !managedModule.module
  ) {
    throw new Error(
      "A managed Payment module is required."
    );
  }

  requirePaymentModule(
    managedModule.module
  );

  requirePaymentPersistenceAdapter(
    managedModule.adapter
  );

  defaultPaymentModule =
    managedModule;

  paymentModuleRuntimeStatus =
    "READY";

  paymentModuleInitializedAt =
    new Date()
      .toISOString();

  paymentModuleDisposedAt =
    undefined;

  paymentModuleFailureMessage =
    undefined;

  return managedModule;
}

/* ============================================================================
 * Require default Payment module
 * ============================================================================
 */

export function requireDefaultPaymentModule():
  ManagedPaymentModule {
  if (
    !defaultPaymentModule
  ) {
    throw new Error(
      "Default Payment module has not been initialized."
    );
  }

  return defaultPaymentModule;
}

/* ============================================================================
 * Default Payment module accessors
 * ============================================================================
 */

export function getDefaultPaymentModule():
  PaymentModule {
  return requireDefaultPaymentModule()
    .module;
}

export function getDefaultPaymentService():
  PaymentServicePort {
  return getPaymentModuleService(
    getDefaultPaymentModule()
  );
}

export function getDefaultPaymentController():
  CompletePaymentController {
  return getPaymentModuleController(
    getDefaultPaymentModule()
  );
}

export function getDefaultPaymentRepository():
  CompleteExtendedPaymentRepository {
  return getPaymentModuleRepository(
    getDefaultPaymentModule()
  );
}

export function getDefaultPaymentTransactionManager():
  ExtendedPaymentRepositoryTransactionManager {
  return getPaymentModuleTransactionManager(
    getDefaultPaymentModule()
  );
}

/* ============================================================================
 * Initialize default Payment module
 * ============================================================================
 */

/**
 * Singleton-safe initialization.
 *
 * Multiple route modules may request Payment initialization concurrently.
 * Only the first caller executes the persistence factory.
 */
export async function initializeDefaultPaymentModule<
  TDependencies
>(
  input:
    CreatePaymentModuleFromFactoryInput<
      TDependencies
    >
): Promise<
  ManagedPaymentModule
> {
  if (
    defaultPaymentModule
  ) {
    return defaultPaymentModule;
  }

  if (
    defaultPaymentModulePromise
  ) {
    return defaultPaymentModulePromise;
  }

  paymentModuleRuntimeStatus =
    "INITIALIZING";

  paymentModuleFailureMessage =
    undefined;

  defaultPaymentModulePromise =
    createPaymentModuleFromFactory(
      input
    )
      .then(
        (
          managedModule
        ) =>
          setDefaultPaymentModule(
            managedModule
          )
      )
      .catch(
        (
          error:
            unknown
        ) => {
          paymentModuleRuntimeStatus =
            "FAILED";

          paymentModuleFailureMessage =
            error instanceof Error
              ? error.message
              : "Unknown Payment module initialization failure.";

          throw error;
        }
      )
      .finally(
        () => {
          defaultPaymentModulePromise =
            undefined;
        }
      );

  return defaultPaymentModulePromise;
}

/* ============================================================================
 * Dispose default Payment module
 * ============================================================================
 */

export async function disposeDefaultPaymentModule():
  Promise<void> {
  if (
    !defaultPaymentModule
  ) {
    paymentModuleRuntimeStatus =
      "DISPOSED";

    paymentModuleDisposedAt =
      new Date()
        .toISOString();

    return;
  }

  paymentModuleRuntimeStatus =
    "DISPOSING";

  const moduleToDispose =
    defaultPaymentModule;

  /**
   * Clear first so new consumers cannot obtain a module that is in the
   * process of being disposed.
   */
  defaultPaymentModule =
    undefined;

  try {
    await moduleToDispose
      .dispose();

    paymentModuleRuntimeStatus =
      "DISPOSED";

    paymentModuleDisposedAt =
      new Date()
        .toISOString();
  } catch (
    error
  ) {
    paymentModuleRuntimeStatus =
      "FAILED";

    paymentModuleFailureMessage =
      error instanceof Error
        ? error.message
        : "Unknown Payment module disposal failure.";

    throw error;
  }
}

/* ============================================================================
 * Reset module runtime
 * ============================================================================
 *
 * Primarily useful during unit/integration testing.
 *
 * If a managed module is active, it is disposed before runtime state is reset.
 * ============================================================================
 */

export async function resetPaymentModuleRuntime():
  Promise<void> {
  if (
    defaultPaymentModule
  ) {
    await disposeDefaultPaymentModule();
  }

  defaultPaymentModule =
    undefined;

  defaultPaymentModulePromise =
    undefined;

  paymentModuleRuntimeStatus =
    "UNINITIALIZED";

  paymentModuleInitializedAt =
    undefined;

  paymentModuleDisposedAt =
    undefined;

  paymentModuleFailureMessage =
    undefined;
}

/* ============================================================================
 * Replace default Payment module
 * ============================================================================
 */

export async function replaceDefaultPaymentModule(
  managedModule:
    ManagedPaymentModule
): Promise<
  ManagedPaymentModule
> {
  if (
    defaultPaymentModule
  ) {
    await disposeDefaultPaymentModule();
  }

  return setDefaultPaymentModule(
    managedModule
  );
}

/* ============================================================================
 * Payment infrastructure diagnostics
 * ============================================================================
 */

export interface PaymentInfrastructureDiagnostics
  extends PaymentModuleDiagnostics {
  runtimeStatus:
    PaymentModuleRuntimeStatus;

  initialized:
    boolean;

  initializedAt?:
    string;

  disposedAt?:
    string;

  failureMessage?:
    string;
}

export function getPaymentInfrastructureDiagnostics(
  module?:
    PaymentModule
): PaymentInfrastructureDiagnostics {
  const runtime =
    getPaymentModuleRuntimeSnapshot();

  const resolvedModule =
    module ??
    defaultPaymentModule
      ?.module;

  if (
    !resolvedModule
  ) {
    return {
      repositoryConfigured:
        false,

      transactionManagerConfigured:
        false,

      serviceConfigured:
        false,

      controllerConfigured:
        false,

      capabilityReportAvailable:
        false,

      repositoryConfigurationAvailable:
        false,

      runtimeStatus:
        runtime.status,

      initialized:
        runtime.initialized,

      ...(runtime.initializedAt
        ? {
            initializedAt:
              runtime.initializedAt,
          }
        : {}),

      ...(runtime.disposedAt
        ? {
            disposedAt:
              runtime.disposedAt,
          }
        : {}),

      ...(runtime.failureMessage
        ? {
            failureMessage:
              runtime.failureMessage,
          }
        : {}),
    };
  }

  const moduleDiagnostics =
    getPaymentModuleDiagnostics(
      resolvedModule
    );

  return {
    ...moduleDiagnostics,

    runtimeStatus:
      runtime.status,

    initialized:
      runtime.initialized,

    ...(runtime.initializedAt
      ? {
          initializedAt:
            runtime.initializedAt,
        }
      : {}),

    ...(runtime.disposedAt
      ? {
          disposedAt:
            runtime.disposedAt,
        }
      : {}),

    ...(runtime.failureMessage
      ? {
          failureMessage:
            runtime.failureMessage,
        }
      : {}),
  };
}

/* ============================================================================
 * Payment adapter helpers
 * ============================================================================
 */

/**
 * Convenience helper for persistence implementations that already expose
 * repository + transaction-manager objects.
 */
export function createPaymentPersistenceAdapter(
  input:
    PaymentModuleRepositoryDependencies & {
      dispose?:
        () =>
          void |
          Promise<void>;
    }
): PaymentPersistenceAdapter {
  const repositories =
    requirePaymentModuleRepositoryDependencies(
      input
    );

  return {
    repository:
      repositories.repository,

    transactionManager:
      repositories
        .transactionManager,

    ...(repositories
      .capabilityReport
      ? {
          capabilityReport:
            repositories
              .capabilityReport,
        }
      : {}),

    ...(repositories
      .configuration
      ? {
          configuration:
            repositories
              .configuration,
        }
      : {}),

    ...(input.dispose
      ? {
          dispose:
            input.dispose,
        }
      : {}),
  };
}

/* ============================================================================
 * Payment Module Part B facade
 * ============================================================================
 */

export const PaymentModuleInfrastructure = {
  /* ------------------------------------------------------------------------
   * Adapter
   * ------------------------------------------------------------------------
   */

  createAdapter:
    createPaymentPersistenceAdapter,

  requireAdapter:
    requirePaymentPersistenceAdapter,

  repositoryDependencies:
    createPaymentModuleRepositoryDependenciesFromAdapter,

  /* ------------------------------------------------------------------------
   * Module
   * ------------------------------------------------------------------------
   */

  createFromAdapter:
    createPaymentModuleFromAdapter,

  createFromFactory:
    createPaymentModuleFromFactory,

  createManaged:
    createManagedPaymentModule,

  /* ------------------------------------------------------------------------
   * Default/singleton
   * ------------------------------------------------------------------------
   */

  initialize:
    initializeDefaultPaymentModule,

  setDefault:
    setDefaultPaymentModule,

  replaceDefault:
    replaceDefaultPaymentModule,

  hasDefault:
    hasDefaultPaymentModule,

  requireDefault:
    requireDefaultPaymentModule,

  reset:
    resetPaymentModuleRuntime,

  dispose:
    disposeDefaultPaymentModule,

  /* ------------------------------------------------------------------------
   * Default accessors
   * ------------------------------------------------------------------------
   */

  module:
    getDefaultPaymentModule,

  repository:
    getDefaultPaymentRepository,

  transactionManager:
    getDefaultPaymentTransactionManager,

  service:
    getDefaultPaymentService,

  controller:
    getDefaultPaymentController,

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  runtime:
    getPaymentModuleRuntimeSnapshot,

  diagnostics:
    getPaymentInfrastructureDiagnostics,
} as const;

/* ============================================================================
 * Complete Payment module facade - Parts A + B
 * ============================================================================
 */

export const CompletePaymentModuleFacade = {
  /* ------------------------------------------------------------------------
   * Pure composition
   * ------------------------------------------------------------------------
   */

  module:
    PaymentModuleFacade,

  /* ------------------------------------------------------------------------
   * Infrastructure
   * ------------------------------------------------------------------------
   */

  infrastructure:
    PaymentModuleInfrastructure,

  /* ------------------------------------------------------------------------
   * Factory shortcuts
   * ------------------------------------------------------------------------
   */

  create:
    createPaymentModule,

  createFromAdapter:
    createPaymentModuleFromAdapter,

  createFromFactory:
    createPaymentModuleFromFactory,

  /* ------------------------------------------------------------------------
   * Default module shortcuts
   * ------------------------------------------------------------------------
   */

  initialize:
    initializeDefaultPaymentModule,

  get:
    getDefaultPaymentModule,

  service:
    getDefaultPaymentService,

  controller:
    getDefaultPaymentController,

  reset:
    resetPaymentModuleRuntime,

  dispose:
    disposeDefaultPaymentModule,
} as const;

/* ============================================================================
 * End of Payment Module - Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Module
 * Part C
 * ============================================================================
 *
 * Concrete persistence binding / bootstrap:
 *
 * - Payment repository-provider contract
 * - Repository-module normalization
 * - Prisma-compatible provider registration
 * - Default provider registration
 * - Default Payment-module bootstrap
 * - Lazy initialization
 * - Readiness/bootstrap diagnostics
 * - Test-safe provider replacement
 * - Final module bootstrap facade
 *
 * IMPORTANT:
 *
 * This layer intentionally does NOT import guessed symbols from
 * payment.prisma.repository.ts.
 *
 * The concrete Prisma repository file only needs to satisfy the provider
 * contract below.
 * ============================================================================
 */

/* ============================================================================
 * Payment repository module shape
 * ============================================================================
 */

/**
 * Normalized shape expected from a concrete Payment persistence module.
 *
 * A Prisma repository module may expose additional properties; only these
 * values are required by payment.module.ts.
 */
export interface PaymentRepositoryModuleBinding {
  repository:
    CompleteExtendedPaymentRepository;

  transactionManager:
    ExtendedPaymentRepositoryTransactionManager;

  capabilityReport?:
    PaymentRepositoryCapabilityReport;

  configuration?:
    PaymentRepositoryConfigurationValidation;
}

/* ============================================================================
 * Concrete repository provider
 * ============================================================================
 */

export interface PaymentRepositoryProvider<
  TDependencies =
    unknown
> {
  create(
    dependencies:
      TDependencies
  ):
    PaymentRepositoryModuleBinding |
    Promise<
      PaymentRepositoryModuleBinding
    >;

  dispose?(
    dependencies:
      TDependencies
  ):
    void |
    Promise<void>;
}

/* ============================================================================
 * Repository provider factory function
 * ============================================================================
 */

export type PaymentRepositoryProviderFactory<
  TDependencies =
    unknown
> = (
  dependencies:
    TDependencies
) =>
  PaymentRepositoryModuleBinding |
  Promise<
    PaymentRepositoryModuleBinding
  >;

/* ============================================================================
 * Provider registration
 * ============================================================================
 */

export interface RegisteredPaymentRepositoryProvider<
  TDependencies =
    unknown
> {
  readonly name:
    string;

  readonly provider:
    PaymentRepositoryProvider<
      TDependencies
    >;
}

/* ============================================================================
 * Provider creation
 * ============================================================================
 */

export function createPaymentRepositoryProvider<
  TDependencies
>(
  factory:
    PaymentRepositoryProviderFactory<
      TDependencies
    >,
  dispose?:
    (
      dependencies:
        TDependencies
    ) =>
      void |
      Promise<void>
): PaymentRepositoryProvider<
  TDependencies
> {
  if (
    typeof factory !==
      "function"
  ) {
    throw new Error(
      "Payment repository provider factory is required."
    );
  }

  return {
    create:
      factory,

    ...(dispose
      ? {
          dispose,
        }
      : {}),
  };
}

/* ============================================================================
 * Normalize repository-module binding
 * ============================================================================
 */

export function requirePaymentRepositoryModuleBinding(
  value:
    PaymentRepositoryModuleBinding
): PaymentRepositoryModuleBinding {
  if (
    !value
  ) {
    throw new Error(
      "Payment repository module binding is required."
    );
  }

  if (
    !value.repository
  ) {
    throw new Error(
      "Payment repository module binding must provide repository."
    );
  }

  if (
    !value.transactionManager
  ) {
    throw new Error(
      "Payment repository module binding must provide transactionManager."
    );
  }

  return value;
}

/* ============================================================================
 * Repository binding -> persistence adapter
 * ============================================================================
 */

export function createPaymentPersistenceAdapterFromRepositoryModule(
  binding:
    PaymentRepositoryModuleBinding,
  dispose?:
    () =>
      void |
      Promise<void>
): PaymentPersistenceAdapter {
  const resolved =
    requirePaymentRepositoryModuleBinding(
      binding
    );

  return createPaymentPersistenceAdapter({
    repository:
      resolved.repository,

    transactionManager:
      resolved.transactionManager,

    ...(resolved.capabilityReport
      ? {
          capabilityReport:
            resolved
              .capabilityReport,
        }
      : {}),

    ...(resolved.configuration
      ? {
          configuration:
            resolved
              .configuration,
        }
      : {}),

    ...(dispose
      ? {
          dispose,
        }
      : {}),
  });
}

/* ============================================================================
 * Provider-backed Payment module input
 * ============================================================================
 */

export interface CreateProviderPaymentModuleInput<
  TDependencies
> {
  provider:
    PaymentRepositoryProvider<
      TDependencies
    >;

  dependencies:
    TDependencies;

  creationAuthorityProvider?:
    PaymentCreationAuthorityProvider;

  configuration?:
    PaymentModuleConfiguration;
}

/* ============================================================================
 * Create managed Payment module from provider
 * ============================================================================
 */

export async function createPaymentModuleFromProvider<
  TDependencies
>(
  input:
    CreateProviderPaymentModuleInput<
      TDependencies
    >
): Promise<
  ManagedPaymentModule
> {
  if (
    !input.provider
  ) {
    throw new Error(
      "Payment repository provider is required."
    );
  }

  const binding =
    requirePaymentRepositoryModuleBinding(
      await input.provider
        .create(
          input.dependencies
        )
    );

  const adapter =
    createPaymentPersistenceAdapterFromRepositoryModule(
      binding,
      input.provider.dispose
        ? async () => {
            await input.provider
              .dispose?.(
                input.dependencies
              );
          }
        : undefined
    );

  const module =
  createPaymentModuleFromAdapter({
    adapter,

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
  });
  return createManagedPaymentModule(
    module,
    adapter
  );
}

/* ============================================================================
 * Default repository provider registration
 * ============================================================================
 */

let defaultPaymentRepositoryProvider:
  RegisteredPaymentRepositoryProvider<
    unknown
  > |
  undefined;

/* ============================================================================
 * Register default provider
 * ============================================================================
 */

export function registerDefaultPaymentRepositoryProvider<
  TDependencies
>(
  name:
    string,
  provider:
    PaymentRepositoryProvider<
      TDependencies
    >
): void {
  const normalizedName =
    typeof name ===
      "string"
      ? name.trim()
      : "";

  if (
    !normalizedName
  ) {
    throw new Error(
      "Payment repository provider name is required."
    );
  }

  if (
    !provider ||
    typeof provider.create !==
      "function"
  ) {
    throw new Error(
      "Payment repository provider must expose create()."
    );
  }

  defaultPaymentRepositoryProvider = {
    name:
      normalizedName,

    provider:
      provider as
        PaymentRepositoryProvider<
          unknown
        >,
  };
}

/* ============================================================================
 * Provider registered?
 * ============================================================================
 */

export function hasDefaultPaymentRepositoryProvider():
  boolean {
  return Boolean(
    defaultPaymentRepositoryProvider
  );
}

/* ============================================================================
 * Require provider
 * ============================================================================
 */

export function requireDefaultPaymentRepositoryProvider():
  RegisteredPaymentRepositoryProvider<
    unknown
  > {
  if (
    !defaultPaymentRepositoryProvider
  ) {
    throw new Error(
      "Default Payment repository provider has not been registered."
    );
  }

  return defaultPaymentRepositoryProvider;
}

/* ============================================================================
 * Clear provider
 * ============================================================================
 */

export function clearDefaultPaymentRepositoryProvider():
  void {
  defaultPaymentRepositoryProvider =
    undefined;
}

/* ============================================================================
 * Provider metadata
 * ============================================================================
 */

export interface PaymentRepositoryProviderMetadata {
  registered:
    boolean;

  name?:
    string;
}

export function getDefaultPaymentRepositoryProviderMetadata():
  PaymentRepositoryProviderMetadata {
  if (
    !defaultPaymentRepositoryProvider
  ) {
    return {
      registered:
        false,
    };
  }

  return {
    registered:
      true,

    name:
      defaultPaymentRepositoryProvider
        .name,
  };
}

/* ============================================================================
 * Default-provider initialization input
 * ============================================================================
 */

export interface InitializePaymentModuleFromDefaultProviderInput<
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
 * Initialize default module from registered provider
 * ============================================================================
 */

export async function initializePaymentModuleFromDefaultProvider<
  TDependencies
>(
  input:
    InitializePaymentModuleFromDefaultProviderInput<
      TDependencies
    >
): Promise<
  ManagedPaymentModule
> {
  if (
    defaultPaymentModule
  ) {
    return defaultPaymentModule;
  }

  if (
    defaultPaymentModulePromise
  ) {
    return defaultPaymentModulePromise;
  }

  const registration =
    requireDefaultPaymentRepositoryProvider();

  paymentModuleRuntimeStatus =
    "INITIALIZING";

  paymentModuleFailureMessage =
    undefined;

  defaultPaymentModulePromise =
  createPaymentModuleFromProvider({
    provider:
      registration.provider,

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
          managedModule
        ) =>
          setDefaultPaymentModule(
            managedModule
          )
      )
      .catch(
        (
          error:
            unknown
        ) => {
          paymentModuleRuntimeStatus =
            "FAILED";

          paymentModuleFailureMessage =
            error instanceof Error
              ? error.message
              : "Unknown Payment module bootstrap failure.";

          throw error;
        }
      )
      .finally(
        () => {
          defaultPaymentModulePromise =
            undefined;
        }
      );

  return defaultPaymentModulePromise;
}

/* ============================================================================
 * Payment bootstrap state
 * ============================================================================
 */

export interface PaymentModuleBootstrapState {
  providerRegistered:
    boolean;

  providerName?:
    string;

  runtime:
    PaymentModuleRuntimeSnapshot;

  moduleAvailable:
    boolean;
}

/* ============================================================================
 * Bootstrap state
 * ============================================================================
 */

export function getPaymentModuleBootstrapState():
  PaymentModuleBootstrapState {
  const provider =
    getDefaultPaymentRepositoryProviderMetadata();

  return {
    providerRegistered:
      provider.registered,

    ...(provider.name
      ? {
          providerName:
            provider.name,
        }
      : {}),

    runtime:
      getPaymentModuleRuntimeSnapshot(),

    moduleAvailable:
      hasDefaultPaymentModule(),
  };
}

/* ============================================================================
 * Payment module readiness
 * ============================================================================
 */

export interface PaymentModuleBootstrapReadiness {
  ready:
    boolean;

  providerRegistered:
    boolean;

  moduleInitialized:
    boolean;

  serviceReady?:
    boolean;

  runtimeStatus:
    PaymentModuleRuntimeStatus;

  checkedAt:
    string;

  reason?:
    string;
}

/* ============================================================================
 * Check bootstrap readiness
 * ============================================================================
 */

export async function checkPaymentModuleBootstrapReadiness():
  Promise<
    PaymentModuleBootstrapReadiness
  > {
  const providerRegistered =
    hasDefaultPaymentRepositoryProvider();

  const moduleInitialized =
    hasDefaultPaymentModule();

  const runtime =
    getPaymentModuleRuntimeSnapshot();

  if (
    !providerRegistered
  ) {
    return {
      ready:
        false,

      providerRegistered:
        false,

      moduleInitialized,

      runtimeStatus:
        runtime.status,

      checkedAt:
        new Date()
          .toISOString(),

      reason:
        "Payment repository provider is not registered.",
    };
  }

  if (
    !moduleInitialized
  ) {
    return {
      ready:
        false,

      providerRegistered:
        true,

      moduleInitialized:
        false,

      runtimeStatus:
        runtime.status,

      checkedAt:
        new Date()
          .toISOString(),

      reason:
        "Payment module has not been initialized.",
    };
  }

  try {
    const readiness =
      await getDefaultPaymentService()
        .checkReadiness();

    return {
      ready:
        readiness.ready,

      providerRegistered:
        true,

      moduleInitialized:
        true,

      serviceReady:
        readiness.ready,

      runtimeStatus:
        runtime.status,

      checkedAt:
        new Date()
          .toISOString(),

      ...(!readiness.ready
        ? {
            reason:
              "Payment service reported that it is not ready.",
          }
        : {}),
    };
  } catch (
    error
  ) {
    return {
      ready:
        false,

      providerRegistered:
        true,

      moduleInitialized:
        true,

      serviceReady:
        false,

      runtimeStatus:
        runtime.status,

      checkedAt:
        new Date()
          .toISOString(),

      reason:
        error instanceof Error
          ? error.message
          : "Unable to determine Payment module readiness.",
    };
  }
}

/* ============================================================================
 * Reset bootstrap
 * ============================================================================
 */

export async function resetPaymentModuleBootstrap():
  Promise<void> {
  await resetPaymentModuleRuntime();

  clearDefaultPaymentRepositoryProvider();
}

/* ============================================================================
 * Provider replacement
 * ============================================================================
 */

export async function replaceDefaultPaymentRepositoryProvider<
  TDependencies
>(
  name:
    string,
  provider:
    PaymentRepositoryProvider<
      TDependencies
    >
): Promise<void> {
  if (
    hasDefaultPaymentModule()
  ) {
    await disposeDefaultPaymentModule();
  }

  registerDefaultPaymentRepositoryProvider(
    name,
    provider
  );

  paymentModuleRuntimeStatus =
    "UNINITIALIZED";

  paymentModuleInitializedAt =
    undefined;

  paymentModuleDisposedAt =
    undefined;

  paymentModuleFailureMessage =
    undefined;
}

/* ============================================================================
 * Direct repository-module provider helper
 * ============================================================================
 */

/**
 * Useful when payment.prisma.repository.ts already exposes one factory
 * returning:
 *
 * {
 *   repository,
 *   transactionManager,
 *   capabilityReport?,
 *   configuration?
 * }
 *
 * Example wiring:
 *
 * createPaymentRepositoryModuleProvider(
 *   createPrismaPaymentRepositoryModule
 * )
 *
 * No dependency on that concrete export exists inside payment.module.ts.
 */
export function createPaymentRepositoryModuleProvider<
  TDependencies
>(
  factory:
    (
      dependencies:
        TDependencies
    ) =>
      PaymentRepositoryModuleBinding |
      Promise<
        PaymentRepositoryModuleBinding
      >,
  dispose?:
    (
      dependencies:
        TDependencies
    ) =>
      void |
      Promise<void>
): PaymentRepositoryProvider<
  TDependencies
> {
  return createPaymentRepositoryProvider(
    async (
      dependencies
    ) =>
      requirePaymentRepositoryModuleBinding(
        await factory(
          dependencies
        )
      ),
    dispose
  );
}

/* ============================================================================
 * Separate repository + transaction-manager factory helper
 * ============================================================================
 */

/**
 * Some repository files expose two factories rather than one module factory.
 *
 * This adapter supports that shape without forcing payment.module.ts to know
 * the concrete export names.
 */
export interface PaymentRepositoryFactorySet<
  TDependencies
> {
  createRepository(
    dependencies:
      TDependencies
  ):
    CompleteExtendedPaymentRepository |
    Promise<
      CompleteExtendedPaymentRepository
    >;

  createTransactionManager(
    dependencies:
      TDependencies
  ):
    ExtendedPaymentRepositoryTransactionManager |
    Promise<
      ExtendedPaymentRepositoryTransactionManager
    >;

  getCapabilityReport?(
    dependencies:
      TDependencies
  ):
    PaymentRepositoryCapabilityReport |
    Promise<
      PaymentRepositoryCapabilityReport
    >;

  getConfiguration?(
    dependencies:
      TDependencies
  ):
    PaymentRepositoryConfigurationValidation |
    Promise<
      PaymentRepositoryConfigurationValidation
    >;

  dispose?(
    dependencies:
      TDependencies
  ):
    void |
    Promise<void>;
}

/* ============================================================================
 * Create provider from separate factories
 * ============================================================================
 */

export function createPaymentRepositoryProviderFromFactories<
  TDependencies
>(
  factories:
    PaymentRepositoryFactorySet<
      TDependencies
    >
): PaymentRepositoryProvider<
  TDependencies
> {
  if (
    !factories ||
    typeof factories
      .createRepository !==
      "function" ||
    typeof factories
      .createTransactionManager !==
      "function"
  ) {
    throw new Error(
      "Payment repository and transaction-manager factories are required."
    );
  }

  return {
    create:
      async (
        dependencies
      ) => {
        const [
          repository,
          transactionManager,
          capabilityReport,
          configuration,
        ] =
          await Promise.all([
            factories
              .createRepository(
                dependencies
              ),

            factories
              .createTransactionManager(
                dependencies
              ),

            factories
              .getCapabilityReport
              ? factories
                  .getCapabilityReport(
                    dependencies
                  )
              : Promise.resolve(
                  undefined
                ),

            factories
              .getConfiguration
              ? factories
                  .getConfiguration(
                    dependencies
                  )
              : Promise.resolve(
                  undefined
                ),
          ]);

        return requirePaymentRepositoryModuleBinding({
          repository,

          transactionManager,

          ...(capabilityReport
            ? {
                capabilityReport,
              }
            : {}),

          ...(configuration
            ? {
                configuration,
              }
            : {}),
        });
      },

    ...(factories.dispose
      ? {
          dispose:
            factories.dispose,
        }
      : {}),
  };
}

/* ============================================================================
 * Payment module bootstrap facade
 * ============================================================================
 */

export const PaymentModuleBootstrap = {
  /* ------------------------------------------------------------------------
   * Provider construction
   * ------------------------------------------------------------------------
   */

  createProvider:
    createPaymentRepositoryProvider,

  createModuleProvider:
    createPaymentRepositoryModuleProvider,

  createProviderFromFactories:
    createPaymentRepositoryProviderFromFactories,

  /* ------------------------------------------------------------------------
   * Provider registration
   * ------------------------------------------------------------------------
   */

  register:
    registerDefaultPaymentRepositoryProvider,

  replace:
    replaceDefaultPaymentRepositoryProvider,

  clear:
    clearDefaultPaymentRepositoryProvider,

  hasProvider:
    hasDefaultPaymentRepositoryProvider,

  requireProvider:
    requireDefaultPaymentRepositoryProvider,

  providerMetadata:
    getDefaultPaymentRepositoryProviderMetadata,

  /* ------------------------------------------------------------------------
   * Module creation
   * ------------------------------------------------------------------------
   */

  createFromProvider:
    createPaymentModuleFromProvider,

  initialize:
    initializePaymentModuleFromDefaultProvider,

  /* ------------------------------------------------------------------------
   * State
   * ------------------------------------------------------------------------
   */

  state:
    getPaymentModuleBootstrapState,

  readiness:
    checkPaymentModuleBootstrapReadiness,

  /* ------------------------------------------------------------------------
   * Reset
   * ------------------------------------------------------------------------
   */

  reset:
    resetPaymentModuleBootstrap,
} as const;

/* ============================================================================
 * Final Payment module facade - Parts A/B/C
 * ============================================================================
 */

export const PaymentDomainModule = {
  /* ------------------------------------------------------------------------
   * Pure composition
   * ------------------------------------------------------------------------
   */

  composition:
    PaymentModuleFacade,

  /* ------------------------------------------------------------------------
   * Infrastructure lifecycle
   * ------------------------------------------------------------------------
   */

  infrastructure:
    PaymentModuleInfrastructure,

  /* ------------------------------------------------------------------------
   * Bootstrap/provider wiring
   * ------------------------------------------------------------------------
   */

  bootstrap:
    PaymentModuleBootstrap,

  /* ------------------------------------------------------------------------
   * Current defaults
   * ------------------------------------------------------------------------
   */

  get module() {
    return getDefaultPaymentModule();
  },

  get service() {
    return getDefaultPaymentService();
  },

  get controller() {
    return getDefaultPaymentController();
  },

  get repository() {
    return getDefaultPaymentRepository();
  },

  get transactionManager() {
    return getDefaultPaymentTransactionManager();
  },
} as const;

/* ============================================================================
 * End of Payment Module - Part C
 * ============================================================================
 */