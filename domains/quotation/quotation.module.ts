/**
 * ============================================================================
 * EasyMovers
 * Quotation Domain Module
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/quotation.module.ts
 *
 * Responsibilities:
 *
 * - Compose Quotation repository
 * - Compose Quotation transaction manager
 * - Compose Quotation service
 * - Compose Quotation controller
 * - Expose one canonical Quotation domain runtime
 * - Keep API routes independent from repository/service construction details
 *
 * This file MUST NOT:
 *
 * - Implement business rules
 * - Perform database queries directly
 * - Perform HTTP request parsing
 * - Duplicate validator logic
 * - Duplicate mapper logic
 *
 * Composition flow:
 *
 * PrismaClient
 *      ↓
 * PrismaQuotationRepositoryModule
 *      ↓
 * QuotationService
 *      ↓
 * QuotationController
 * ============================================================================
 */

import type {
  PrismaClient,
} from "@prisma/client";

import {
  createPrismaQuotationRepositoryModule,
} from "./repositories/quotation.prisma.repository";

import type {
  QuotationRepositoryModule,
  QuotationRepositoryPort,
  QuotationRepositoryPortTransactionManager,
} from "./repositories/quotation.repository";

import {
  createQuotationService,
} from "./services/quotation.service";

import type {
  QuotationService,
  QuotationServiceConfiguration,
  QuotationServiceDependencies,
} from "./services/quotation.service";

import {
  createQuotationController,
} from "./controllers/quotation.controller";

import type {
  QuotationController,
  QuotationControllerDependencies,
} from "./controllers/quotation.controller";

/* ============================================================================
 * Module dependencies
 * ============================================================================
 */

/**
 * Required external dependencies for the Quotation domain.
 *
 * PrismaClient is supplied from the application composition layer.
 */
export interface QuotationModuleDependencies {
  prisma:
    PrismaClient;

  /**
   * Optional deterministic clock.
   *
   * Useful for:
   * - tests
   * - quotation expiry
   * - quotation identity generation
   */
  now?:
    () => Date;

  /**
   * Optional deterministic random generator.
   *
   * Useful for testing quotation identity generation.
   */
  random?:
    () => number;

  /**
   * Optional Quotation service configuration overrides.
   */
  serviceConfiguration?:
    Partial<
      QuotationServiceConfiguration
    >;
}

/* ============================================================================
 * Runtime contracts
 * ============================================================================
 */

/**
 * Complete assembled Quotation domain.
 */
export interface QuotationModule {
  repository:
    QuotationRepositoryPort;

  transactionManager?:
    QuotationRepositoryPortTransactionManager;

  service:
    QuotationService;

  controller:
    QuotationController;

  repositoryModule:
    QuotationRepositoryModule;
}

/* ============================================================================
 * Dependency validation
 * ============================================================================
 */

export function requireQuotationModuleDependencies(
  dependencies:
    QuotationModuleDependencies
): QuotationModuleDependencies {
  if (
    !dependencies ||
    !dependencies.prisma
  ) {
    throw new Error(
      "QuotationModule requires PrismaClient."
    );
  }

  return dependencies;
}

/* ============================================================================
 * Repository composition
 * ============================================================================
 */

/**
 * Creates the Quotation repository layer.
 */
export function createQuotationModuleRepository(
  dependencies:
    QuotationModuleDependencies
): QuotationRepositoryModule {
  const resolved =
    requireQuotationModuleDependencies(
      dependencies
    );

  return createPrismaQuotationRepositoryModule({
    prisma:
      resolved.prisma,
  });
}

/* ============================================================================
 * Service dependency composition
 * ============================================================================
 */

export function createQuotationModuleServiceDependencies(
  dependencies:
    QuotationModuleDependencies,
  repositoryModule:
    QuotationRepositoryModule
): QuotationServiceDependencies {
  return {
    repository:
      repositoryModule
        .repository,

    ...(repositoryModule
      .transactionManager
      ? {
          transactionManager:
            repositoryModule
              .transactionManager,
        }
      : {}),

    ...(dependencies.now
      ? {
          now:
            dependencies.now,
        }
      : {}),

    ...(dependencies.random
      ? {
          random:
            dependencies.random,
        }
      : {}),
  };
}

/* ============================================================================
 * Service composition
 * ============================================================================
 */

/**
 * Creates the canonical QuotationService instance.
 */
export function createQuotationModuleService(
  dependencies:
    QuotationModuleDependencies,
  repositoryModule:
    QuotationRepositoryModule
): QuotationService {
  const serviceDependencies =
    createQuotationModuleServiceDependencies(
      dependencies,
      repositoryModule
    );

  return createQuotationService(
    serviceDependencies,
    dependencies
      .serviceConfiguration
  );
}

/* ============================================================================
 * Controller dependency composition
 * ============================================================================
 */

export function createQuotationModuleControllerDependencies(
  service:
    QuotationService
): QuotationControllerDependencies {
  return {
    quotationService:
      service,
  };
}

/* ============================================================================
 * Controller composition
 * ============================================================================
 */

/**
 * Creates the canonical QuotationController instance.
 */
export function createQuotationModuleController(
  service:
    QuotationService
): QuotationController {
  return createQuotationController(
    createQuotationModuleControllerDependencies(
      service
    )
  );
}

/* ============================================================================
 * Complete Quotation module factory
 * ============================================================================
 */

/**
 * Creates the entire Quotation domain runtime.
 *
 * This should become the preferred composition entry point for
 * Next.js API routes.
 */
export function createQuotationModule(
  dependencies:
    QuotationModuleDependencies
): QuotationModule {
  const resolved =
    requireQuotationModuleDependencies(
      dependencies
    );

  /* ------------------------------------------------------------------------
   * Repository
   * ------------------------------------------------------------------------
   */

  const repositoryModule =
    createQuotationModuleRepository(
      resolved
    );

  /* ------------------------------------------------------------------------
   * Service
   * ------------------------------------------------------------------------
   */

  const service =
    createQuotationModuleService(
      resolved,
      repositoryModule
    );

  /* ------------------------------------------------------------------------
   * Controller
   * ------------------------------------------------------------------------
   */

  const controller =
    createQuotationModuleController(
      service
    );

  /* ------------------------------------------------------------------------
   * Runtime
   * ------------------------------------------------------------------------
   */

  return {
    repository:
      repositoryModule
        .repository,

    ...(repositoryModule
      .transactionManager
      ? {
          transactionManager:
            repositoryModule
              .transactionManager,
        }
      : {}),

    service,

    controller,

    repositoryModule,
  };
}

/* ============================================================================
 * Module access helpers
 * ============================================================================
 */

export function getQuotationModuleRepository(
  module:
    QuotationModule
): QuotationRepositoryPort {
  return module.repository;
}

export function getQuotationModuleTransactionManager(
  module:
    QuotationModule
): QuotationRepositoryPortTransactionManager | undefined {
  return module
    .transactionManager;
}

export function getQuotationModuleService(
  module:
    QuotationModule
): QuotationService {
  return module.service;
}

export function getQuotationModuleController(
  module:
    QuotationModule
): QuotationController {
  return module.controller;
}

/* ============================================================================
 * Module capability checks
 * ============================================================================
 */

/**
 * Selection / acceptance workflows require transaction support.
 */
export function quotationModuleSupportsTransactions(
  module:
    QuotationModule
): boolean {
  return Boolean(
    module.transactionManager
  );
}

/* ============================================================================
 * Part A facade
 * ============================================================================
 */

export const QuotationModulePartA = {
  create:
    createQuotationModule,

  createRepository:
    createQuotationModuleRepository,

  createService:
    createQuotationModuleService,

  createController:
    createQuotationModuleController,

  createServiceDependencies:
    createQuotationModuleServiceDependencies,

  createControllerDependencies:
    createQuotationModuleControllerDependencies,

  requireDependencies:
    requireQuotationModuleDependencies,

  getRepository:
    getQuotationModuleRepository,

  getTransactionManager:
    getQuotationModuleTransactionManager,

  getService:
    getQuotationModuleService,

  getController:
    getQuotationModuleController,

  supportsTransactions:
    quotationModuleSupportsTransactions,
} as const;

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Domain Module
 * Part B
 * ============================================================================
 *
 * Runtime/composition responsibilities:
 *
 * - Cache QuotationModule by PrismaClient instance
 * - Provide lazy module creation
 * - Provide runtime reset helpers for tests/development
 * - Expose canonical service/controller collections
 * - Expose repository capability information
 * - Provide complete module facade
 *
 * IMPORTANT:
 *
 * - No database queries are performed here
 * - No business rules are implemented here
 * - No HTTP parsing is performed here
 * - Cached runtime is scoped to the supplied PrismaClient instance
 * ============================================================================
 */

/* ============================================================================
 * Runtime cache
 * ============================================================================
 */

/**
 * Quotation module instances are cached against the PrismaClient that
 * created them.
 *
 * WeakMap is intentionally used because:
 *
 * - it does not prevent PrismaClient garbage collection
 * - separate Prisma clients receive separate Quotation modules
 * - tests can create isolated Prisma clients
 * - we avoid one unsafe process-wide singleton
 */
const quotationModuleRuntimeCache =
  new WeakMap<
    PrismaClient,
    QuotationModule
  >();

/* ============================================================================
 * Runtime configuration cache
 * ============================================================================
 */

/**
 * Configuration applied when a module is first created for a PrismaClient.
 *
 * Once cached, subsequent calls return the same module instance.
 */
const quotationModuleConfigurationCache =
  new WeakMap<
    PrismaClient,
    {
      now?:
        () => Date;

      random?:
        () => number;

      serviceConfiguration?:
        Partial<
          QuotationServiceConfiguration
        >;
    }
  >();

/* ============================================================================
 * Runtime existence check
 * ============================================================================
 */

export function hasQuotationModuleRuntime(
  prisma:
    PrismaClient
): boolean {
  return quotationModuleRuntimeCache
    .has(
      prisma
    );
}

/* ============================================================================
 * Get existing runtime
 * ============================================================================
 */

export function getExistingQuotationModuleRuntime(
  prisma:
    PrismaClient
): QuotationModule | undefined {
  return quotationModuleRuntimeCache
    .get(
      prisma
    );
}

/* ============================================================================
 * Create cached runtime
 * ============================================================================
 */

/**
 * Creates and caches one Quotation module for the supplied PrismaClient.
 *
 * If a module already exists for that PrismaClient, the existing module
 * is returned.
 */
export function getOrCreateQuotationModule(
  dependencies:
    QuotationModuleDependencies
): QuotationModule {
  const resolved =
    requireQuotationModuleDependencies(
      dependencies
    );

  const existing =
    quotationModuleRuntimeCache
      .get(
        resolved.prisma
      );

  if (
    existing
  ) {
    return existing;
  }

  const module =
    createQuotationModule(
      resolved
    );

  quotationModuleRuntimeCache
    .set(
      resolved.prisma,
      module
    );

  quotationModuleConfigurationCache
    .set(
      resolved.prisma,
      {
        ...(resolved.now
          ? {
              now:
                resolved.now,
            }
          : {}),

        ...(resolved.random
          ? {
              random:
                resolved.random,
            }
          : {}),

        ...(resolved.serviceConfiguration
          ? {
              serviceConfiguration:
                resolved
                  .serviceConfiguration,
            }
          : {}),
      }
    );

  return module;
}

/* ============================================================================
 * Runtime replacement
 * ============================================================================
 */

/**
 * Replaces the cached Quotation module for one PrismaClient.
 *
 * Primarily useful for:
 *
 * - integration tests
 * - development dependency replacement
 * - deterministic test clocks/random generators
 */
export function replaceQuotationModuleRuntime(
  dependencies:
    QuotationModuleDependencies
): QuotationModule {
  const resolved =
    requireQuotationModuleDependencies(
      dependencies
    );

  const module =
    createQuotationModule(
      resolved
    );

  quotationModuleRuntimeCache
    .set(
      resolved.prisma,
      module
    );

  quotationModuleConfigurationCache
    .set(
      resolved.prisma,
      {
        ...(resolved.now
          ? {
              now:
                resolved.now,
            }
          : {}),

        ...(resolved.random
          ? {
              random:
                resolved.random,
            }
          : {}),

        ...(resolved.serviceConfiguration
          ? {
              serviceConfiguration:
                resolved
                  .serviceConfiguration,
            }
          : {}),
      }
    );

  return module;
}

/* ============================================================================
 * Runtime reset
 * ============================================================================
 */

/**
 * Removes the cached module for one PrismaClient.
 *
 * The PrismaClient itself is NOT disconnected or destroyed here.
 */
export function resetQuotationModuleRuntime(
  prisma:
    PrismaClient
): boolean {
  quotationModuleConfigurationCache
    .delete(
      prisma
    );

  return quotationModuleRuntimeCache
    .delete(
      prisma
    );
}

/* ============================================================================
 * Runtime configuration read
 * ============================================================================
 */

export function getQuotationModuleRuntimeConfiguration(
  prisma:
    PrismaClient
):
  | {
      now?:
        () => Date;

      random?:
        () => number;

      serviceConfiguration?:
        Partial<
          QuotationServiceConfiguration
        >;
    }
  | undefined {
  return quotationModuleConfigurationCache
    .get(
      prisma
    );
}

/* ============================================================================
 * Canonical repository runtime
 * ============================================================================
 */

export function getOrCreateQuotationRepository(
  dependencies:
    QuotationModuleDependencies
): QuotationRepositoryPort {
  return getOrCreateQuotationModule(
    dependencies
  ).repository;
}

/* ============================================================================
 * Canonical transaction-manager runtime
 * ============================================================================
 */

export function getOrCreateQuotationTransactionManager(
  dependencies:
    QuotationModuleDependencies
):
  QuotationRepositoryPortTransactionManager |
  undefined {
  return getOrCreateQuotationModule(
    dependencies
  ).transactionManager;
}

/* ============================================================================
 * Canonical service runtime
 * ============================================================================
 */

export function getOrCreateQuotationService(
  dependencies:
    QuotationModuleDependencies
): QuotationService {
  return getOrCreateQuotationModule(
    dependencies
  ).service;
}

/* ============================================================================
 * Canonical controller runtime
 * ============================================================================
 */

export function getOrCreateQuotationController(
  dependencies:
    QuotationModuleDependencies
): QuotationController {
  return getOrCreateQuotationModule(
    dependencies
  ).controller;
}

/* ============================================================================
 * Service collection
 * ============================================================================
 */

/**
 * Explicit collection contract for future route/module composition.
 *
 * Additional Quotation sub-services can be added here later without
 * changing every API route.
 */
export interface QuotationServiceCollection {
  quotations:
    QuotationService;
}

export function createQuotationServiceCollection(
  module:
    QuotationModule
): QuotationServiceCollection {
  return {
    quotations:
      module.service,
  };
}

/* ============================================================================
 * Controller collection
 * ============================================================================
 */

/**
 * Controller collection mirrors the Vendor-domain composition style.
 *
 * Future specialized controllers may later be added, for example:
 *
 * - quotationWorkflow
 * - quotationCustomer
 * - quotationAdmin
 *
 * without changing the module entry point.
 */
export interface QuotationControllerCollection {
  quotations:
    QuotationController;
}

export function createQuotationControllerCollection(
  module:
    QuotationModule
): QuotationControllerCollection {
  return {
    quotations:
      module.controller,
  };
}

/* ============================================================================
 * Complete runtime collection
 * ============================================================================
 */

export interface QuotationRuntimeCollection {
  module:
    QuotationModule;

  services:
    QuotationServiceCollection;

  controllers:
    QuotationControllerCollection;
}

export function createQuotationRuntimeCollection(
  dependencies:
    QuotationModuleDependencies
): QuotationRuntimeCollection {
  const module =
    getOrCreateQuotationModule(
      dependencies
    );

  return {
    module,

    services:
      createQuotationServiceCollection(
        module
      ),

    controllers:
      createQuotationControllerCollection(
        module
      ),
  };
}

/* ============================================================================
 * Fresh runtime collection
 * ============================================================================
 */

/**
 * Creates a new uncached module and collection.
 *
 * Useful for tests where every test requires isolated instances.
 */
export function createFreshQuotationRuntimeCollection(
  dependencies:
    QuotationModuleDependencies
): QuotationRuntimeCollection {
  const module =
    createQuotationModule(
      dependencies
    );

  return {
    module,

    services:
      createQuotationServiceCollection(
        module
      ),

    controllers:
      createQuotationControllerCollection(
        module
      ),
  };
}

/* ============================================================================
 * Repository capability access
 * ============================================================================
 */

export function getQuotationRepositoryCapabilities(
  module:
    QuotationModule
) {
  return module
    .repositoryModule
    .capabilities;
}

/* ============================================================================
 * Module health summary
 * ============================================================================
 */

/**
 * Lightweight composition-level diagnostics.
 *
 * This does not itself query the database. Database health remains
 * available through QuotationService.getRepositoryHealth().
 */
export interface QuotationModuleRuntimeStatus {
  repositoryAvailable:
    boolean;

  serviceAvailable:
    boolean;

  controllerAvailable:
    boolean;

  transactionManagerAvailable:
    boolean;

  capabilities:
    QuotationRepositoryModule[
      "capabilities"
    ];
}

export function getQuotationModuleRuntimeStatus(
  module:
    QuotationModule
): QuotationModuleRuntimeStatus {
  return {
    repositoryAvailable:
      Boolean(
        module.repository
      ),

    serviceAvailable:
      Boolean(
        module.service
      ),

    controllerAvailable:
      Boolean(
        module.controller
      ),

    transactionManagerAvailable:
      Boolean(
        module.transactionManager
      ),

    capabilities:
      module.repositoryModule
        .capabilities,
  };
}

/* ============================================================================
 * Require transaction support
 * ============================================================================
 */

/**
 * Used by application composition when selection/acceptance routes must
 * guarantee transaction support.
 */
export function requireQuotationModuleTransactionManager(
  module:
    QuotationModule
): QuotationRepositoryPortTransactionManager {
  if (
    !module.transactionManager
  ) {
    throw new Error(
      "QuotationModule transaction manager is unavailable."
    );
  }

  return module.transactionManager;
}

/* ============================================================================
 * Require repository
 * ============================================================================
 */

export function requireQuotationModuleRepository(
  module:
    QuotationModule
): QuotationRepositoryPort {
  if (
    !module.repository
  ) {
    throw new Error(
      "QuotationModule repository is unavailable."
    );
  }

  return module.repository;
}

/* ============================================================================
 * Require service
 * ============================================================================
 */

export function requireQuotationModuleService(
  module:
    QuotationModule
): QuotationService {
  if (
    !module.service
  ) {
    throw new Error(
      "QuotationModule service is unavailable."
    );
  }

  return module.service;
}

/* ============================================================================
 * Require controller
 * ============================================================================
 */

export function requireQuotationModuleController(
  module:
    QuotationModule
): QuotationController {
  if (
    !module.controller
  ) {
    throw new Error(
      "QuotationModule controller is unavailable."
    );
  }

  return module.controller;
}

/* ============================================================================
 * Runtime facade
 * ============================================================================
 */

export const QuotationModuleRuntime = {
  /* Module */

  getOrCreate:
    getOrCreateQuotationModule,

  replace:
    replaceQuotationModuleRuntime,

  reset:
    resetQuotationModuleRuntime,

  has:
    hasQuotationModuleRuntime,

  getExisting:
    getExistingQuotationModuleRuntime,

  getConfiguration:
    getQuotationModuleRuntimeConfiguration,

  /* Components */

  getRepository:
    getOrCreateQuotationRepository,

  getTransactionManager:
    getOrCreateQuotationTransactionManager,

  getService:
    getOrCreateQuotationService,

  getController:
    getOrCreateQuotationController,

  /* Collections */

  createCollection:
    createQuotationRuntimeCollection,

  createFreshCollection:
    createFreshQuotationRuntimeCollection,

  /* Diagnostics */

  getStatus:
    getQuotationModuleRuntimeStatus,

  getCapabilities:
    getQuotationRepositoryCapabilities,

  /* Guards */

  requireRepository:
    requireQuotationModuleRepository,

  requireTransactionManager:
    requireQuotationModuleTransactionManager,

  requireService:
    requireQuotationModuleService,

  requireController:
    requireQuotationModuleController,
} as const;

/* ============================================================================
 * Complete Quotation module facade
 * ============================================================================
 */

export const CompleteQuotationModule = {
  /* Base composition */

  create:
    createQuotationModule,

  createRepository:
    createQuotationModuleRepository,

  createService:
    createQuotationModuleService,

  createController:
    createQuotationModuleController,

  /* Cached runtime */

  getOrCreate:
    getOrCreateQuotationModule,

  replaceRuntime:
    replaceQuotationModuleRuntime,

  resetRuntime:
    resetQuotationModuleRuntime,

  /* Collections */

  createServiceCollection:
    createQuotationServiceCollection,

  createControllerCollection:
    createQuotationControllerCollection,

  createRuntimeCollection:
    createQuotationRuntimeCollection,

  createFreshRuntimeCollection:
    createFreshQuotationRuntimeCollection,

  /* Access */

  getRepository:
    getQuotationModuleRepository,

  getTransactionManager:
    getQuotationModuleTransactionManager,

  getService:
    getQuotationModuleService,

  getController:
    getQuotationModuleController,

  /* Diagnostics */

  getRuntimeStatus:
    getQuotationModuleRuntimeStatus,

  getRepositoryCapabilities:
    getQuotationRepositoryCapabilities,

  supportsTransactions:
    quotationModuleSupportsTransactions,
} as const;

/* ============================================================================
 * End of quotation.module.ts
 * ============================================================================
 */