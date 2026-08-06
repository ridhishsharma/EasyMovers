/**
 * ============================================================
 * EasyMovers
 * Vendor Module
 * ============================================================
 *
 * File
 * ----
 * domains/vendor/vendor.module.ts
 *
 * Part A
 * ------
 * - Vendor dependency composition
 * - Prisma repository module
 * - Vendor service collection
 * - Complete vendor controller
 * - Module capability reporting
 * - Module lifecycle helpers
 *
 * Responsibilities
 * ----------------
 * This file is the composition root for the Vendor domain.
 *
 * It connects:
 *
 * Prisma repository
 *        ↓
 * Vendor services
 *        ↓
 * Vendor controller
 *
 * It must not contain:
 *
 * - Vendor business rules
 * - Prisma query implementation
 * - HTTP request handling
 * - Route parsing
 * - Domain validation logic
 * ============================================================
 */

import type {
  PrismaVendorRepositoryCapabilityReport,
  PrismaVendorRepositoryDependencies,
  PrismaVendorRepositoryModule,
} from "./repositories/prisma-vendor.repository";

import {
  createPrismaVendorRepositoryModule,
  validatePrismaVendorRepositoryConfiguration,
} from "./repositories/prisma-vendor.repository";

import type {
  CompleteVendorServiceCollection,
  VendorServiceDependencies,
} from "./services/vendor.service";

import {
  createCompleteVendorServiceCollection,
} from "./services/vendor.service";

import type {
  CompleteVendorController,
  VendorControllerCollectionDependencies,
} from "./controllers/vendor.controller";

import {
  createCompleteVendorControllerFromServices,
} from "./controllers/vendor.controller";

import type {
  CompleteVendorRouteModule,
  VendorCatchAllMethodHandlers,
  VendorFetchAuthenticationResolver,
  VendorRouteOwnershipResolver,
} from "./routes/vendor.routes";

import {
  createCompleteVendorRouteModule,
  createVendorCatchAllMethodHandlers,
  createVendorHeaderAuthenticationResolver,
  createVendorRouteRequestId,
  diagnoseVendorRoutes,
} from "./routes/vendor.routes";

import {
  prisma,
} from "@/lib/prisma";
/**
 * Vendor module construction options.
 */
export interface VendorModuleOptions {
  /**
   * Optional Prisma repository dependencies.
   *
   * When omitted, the repository uses the default Prisma
   * client exported from lib/prisma.
   */
  repository?:
    PrismaVendorRepositoryDependencies;

  /**
   * Whether repository capability warnings should prevent
   * module creation.
   *
   * The current legacy Prisma schema does not support every
   * normalized nested vendor relation. Therefore, this should
   * normally remain false until the Prisma schema is migrated.
   */
  requireFullRepositoryCapabilities?:
    boolean;
}

/**
 * Final vendor module.
 *
 * This exposes all composed layers so the application can:
 *
 * - use the repository directly in infrastructure tasks,
 * - call services in background jobs,
 * - call the controller from route adapters,
 * - inspect repository capabilities.
 */
export interface VendorModule {
  repositoryModule:
    PrismaVendorRepositoryModule;

  services:
    CompleteVendorServiceCollection;

  controller:
    CompleteVendorController;

  capabilities:
    PrismaVendorRepositoryCapabilityReport;

  createdAt:
    Date;
}

/**
 * Vendor module validation issue.
 */
export interface VendorModuleValidationIssue {
  severity:
    | "error"
    | "warning";

  code: string;

  message: string;
}

/**
 * Vendor module validation result.
 */
export interface VendorModuleValidationResult {
  valid: boolean;

  issues:
    VendorModuleValidationIssue[];
}

/**
 * Creates service dependencies from the composed Prisma
 * repository module.
 */
export function createVendorServiceDependenciesFromRepository(
  repositoryModule:
    PrismaVendorRepositoryModule
): VendorServiceDependencies {
  return {
    repository:
      repositoryModule.repository,

    transactionManager:
      repositoryModule
        .transactionManager,
  };
}

/**
 * Creates controller dependencies from the complete service
 * collection.
 */
export function createVendorControllerDependenciesFromServices(
  services:
    CompleteVendorServiceCollection
): VendorControllerCollectionDependencies {
  return {
    services,
  };
}

/**
 * Validates whether the repository can support the requested
 * module configuration.
 */
export function validateVendorModuleOptions(
  options:
    VendorModuleOptions = {}
): VendorModuleValidationResult {
  const issues:
    VendorModuleValidationIssue[] = [];

  const repositoryValidation =
    validatePrismaVendorRepositoryConfiguration();

  for (
    const error
    of repositoryValidation.errors
  ) {
    issues.push({
      severity: "error",

      code:
        "VENDOR_REPOSITORY_CONFIGURATION_ERROR",

      message:
        error,
    });
  }

  for (
    const warning
    of repositoryValidation.warnings
  ) {
    issues.push({
      severity: "warning",

      code:
        "VENDOR_REPOSITORY_CAPABILITY_WARNING",

      message:
        warning,
    });
  }

  if (
    options
      .requireFullRepositoryCapabilities ===
      true &&
    repositoryValidation
      .warnings.length > 0
  ) {
    issues.push({
      severity: "error",

      code:
        "VENDOR_FULL_CAPABILITIES_REQUIRED",

      message:
        "The vendor module requires full repository capabilities, but one or more nested Prisma persistence capabilities are unavailable.",
    });
  }

  return {
    valid:
      !issues.some(
        (issue) =>
          issue.severity ===
          "error"
      ),

    issues,
  };
}

/**
 * Error thrown when the vendor module cannot be composed.
 */
export class VendorModuleConfigurationError
  extends Error {
  readonly issues:
    VendorModuleValidationIssue[];

  constructor(
    message: string,
    issues:
      VendorModuleValidationIssue[]
  ) {
    super(message);

    this.name =
      "VendorModuleConfigurationError";

    this.issues =
      issues.map(
        (issue) => ({
          ...issue,
        })
      );

    Object.setPrototypeOf(
      this,
      VendorModuleConfigurationError
        .prototype
    );
  }
}

/**
 * Determines whether an unknown error is a vendor module
 * configuration error.
 */
export function isVendorModuleConfigurationError(
  error: unknown
): error is VendorModuleConfigurationError {
  return (
    error instanceof
    VendorModuleConfigurationError
  );
}

/**
 * Creates the Prisma repository module.
 */
/**
 * Creates the Prisma Vendor repository module.
 *
 * Uses explicitly supplied dependencies when provided.
 * Otherwise, it falls back to the application's shared
 * PrismaClient singleton.
 */
export function createVendorRepositoryModule(
  options:
    VendorModuleOptions = {}
): PrismaVendorRepositoryModule {
  const repositoryDependencies =
    options.repository ?? {
      prisma,
    };

  return createPrismaVendorRepositoryModule(
    repositoryDependencies
  );
}
/**
 * Creates the complete vendor service collection.
 */
export function createVendorServices(
  repositoryModule:
    PrismaVendorRepositoryModule
): CompleteVendorServiceCollection {
  return createCompleteVendorServiceCollection(
    createVendorServiceDependenciesFromRepository(
      repositoryModule
    )
  );
}

/**
 * Creates the complete vendor controller.
 */
export function createVendorModuleController(
  services:
    CompleteVendorServiceCollection
): CompleteVendorController {
  return createCompleteVendorControllerFromServices(
    createVendorControllerDependenciesFromServices(
      services
    )
  );
}

/**
 * Creates the complete Vendor module.
 */
export function createVendorModule(
  options:
    VendorModuleOptions = {}
): VendorModule {
  const validation =
    validateVendorModuleOptions(
      options
    );

  if (!validation.valid) {
    throw new VendorModuleConfigurationError(
      "Unable to create the Vendor module because its configuration is invalid.",
      validation.issues
    );
  }

  const repositoryModule =
    createVendorRepositoryModule(
      options
    );

  const services =
    createVendorServices(
      repositoryModule
    );

  const controller =
    createVendorModuleController(
      services
    );

  return {
    repositoryModule,

    services,

    controller,

    capabilities:
  repositoryModule.capabilityReport,

    createdAt:
      new Date(),
  };
}

/**
 * Creates the Vendor module without throwing.
 */
export interface CreateVendorModuleResult {
  success: boolean;

  module?: VendorModule;

  error?: {
    code: string;

    message: string;

    issues?:
      VendorModuleValidationIssue[];
  };
}

/**
 * Safely creates the complete Vendor module.
 */
export function tryCreateVendorModule(
  options:
    VendorModuleOptions = {}
): CreateVendorModuleResult {
  try {
    return {
      success: true,

      module:
        createVendorModule(
          options
        ),
    };
  } catch (error) {
    if (
      isVendorModuleConfigurationError(
        error
      )
    ) {
      return {
        success: false,

        error: {
          code:
            "VENDOR_MODULE_CONFIGURATION_FAILED",

          message:
            error.message,

          issues:
            error.issues,
        },
      };
    }

    return {
      success: false,

      error: {
        code:
          "VENDOR_MODULE_CREATION_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "An unknown Vendor module creation error occurred.",
      },
    };
  }
}

/**
 * Module summary suitable for diagnostics.
 */
export interface VendorModuleSummary {
  createdAt:
    Date;

  fullyOperational:
    boolean;

  supportedCapabilities:
    string[];

  unsupportedCapabilities:
    string[];

  repositoryValidation:
    VendorModuleValidationResult;
}

/**
 * Creates a diagnostic summary of a composed Vendor module.
 */
export function createVendorModuleSummary(
  module:
    VendorModule
): VendorModuleSummary {
  const supportedCapabilities =
    module.capabilities
      .capabilities
      .filter(
        (capability) =>
          capability.supported
      )
      .map(
        (capability) =>
          capability.capability
      );

  const unsupportedCapabilities =
    module.capabilities
      .capabilities
      .filter(
        (capability) =>
          !capability.supported
      )
      .map(
        (capability) =>
          capability.capability
      );

  return {
    createdAt:
      new Date(
        module.createdAt.getTime()
      ),

    fullyOperational:
      module.capabilities
        .fullyOperational,

    supportedCapabilities,

    unsupportedCapabilities,

    repositoryValidation:
      validateVendorModuleOptions(),
  };
}

/**
 * Singleton module state.
 *
 * This prevents a new service/controller graph from being
 * created for every request in development or production.
 */
let vendorModuleSingleton:
  VendorModule | undefined;

/**
 * Returns the existing Vendor module singleton or creates it.
 */
export function getVendorModule(
  options:
    VendorModuleOptions = {}
): VendorModule {
  if (!vendorModuleSingleton) {
    vendorModuleSingleton =
      createVendorModule(
        options
      );
  }

  return vendorModuleSingleton;
}

/**
 * Determines whether the module singleton has been created.
 */
export function isVendorModuleInitialized():
  boolean {
  return (
    vendorModuleSingleton !==
    undefined
  );
}

/**
 * Returns the initialized module without creating it.
 */
export function peekVendorModule():
  VendorModule | undefined {
  return vendorModuleSingleton;
}

/**
 * Resets the singleton.
 *
 * This is intended primarily for automated tests or
 * development dependency replacement.
 */
export function resetVendorModule():
  void {
  vendorModuleSingleton =
    undefined;
}

/**
 * Initializes the module explicitly.
 *
 * Calling this after initialization returns the existing
 * singleton unless forceReinitialize is true.
 */
export interface InitializeVendorModuleOptions
  extends VendorModuleOptions {
  forceReinitialize?:
    boolean;
}

/**
 * Explicitly initializes the Vendor module.
 */
export function initializeVendorModule(
  options:
    InitializeVendorModuleOptions = {}
): VendorModule {
  if (
    options.forceReinitialize ===
    true
  ) {
    resetVendorModule();
  }

  return getVendorModule(
    options
  );
}

/**
 * ============================================================
 * End of Vendor Module Part A
 * ============================================================
 */

/**
 * ============================================================
 * Vendor Module
 * Part B
 * ============================================================
 *
 * Route and API composition:
 *
 * - Vendor route-module configuration
 * - Authentication resolver configuration
 * - Vendor ownership configuration
 * - Catch-all Next.js-compatible handlers
 * - Complete application module
 * - Route diagnostics
 * ============================================================
 */

/**
 * Vendor route-module options.
 */
export interface VendorModuleRouteOptions {
  /**
   * Prefix removed before vendor route resolution.
   *
   * For Next.js API routes this is normally:
   *
   * /api
   */
  routePrefix?: string;

  /**
   * Resolves request authentication.
   */
  authenticationResolver?:
    VendorFetchAuthenticationResolver;

  /**
   * Resolves whether an authenticated vendor owns the
   * requested vendor resource.
   */
  ownershipResolver?:
    VendorRouteOwnershipResolver;

  /**
   * Allows administrators to access vendor-owned resources.
   */
  allowAdminOverride?: boolean;

  /**
   * Allows empty mutation request bodies to resolve to
   * undefined rather than throwing.
   */
  allowEmptyBody?: boolean;

  /**
   * Creates request identifiers.
   */
  requestIdFactory?:
    () => string;

  /**
   * When true, uses the default header-based authentication
   * resolver if no custom resolver is supplied.
   *
   * The default resolver reads:
   *
   * - x-authenticated
   * - x-user-id
   * - x-user-roles
   * - x-vendor-id
   */
  useHeaderAuthenticationResolver?:
    boolean;
}

/**
 * Complete module construction options.
 */
export interface CompleteVendorModuleOptions
  extends VendorModuleOptions {
  routes?:
    VendorModuleRouteOptions;
}

/**
 * Complete Vendor application module.
 *
 * This contains the domain composition from Part A plus the
 * framework-independent route module and catch-all handlers.
 */
export interface CompleteVendorApplicationModule
  extends VendorModule {
  routeModule:
    CompleteVendorRouteModule;

  handlers:
    VendorCatchAllMethodHandlers;
}

/**
 * Returns the authentication resolver configured for the
 * Vendor route module.
 */
export function resolveVendorModuleAuthenticationResolver(
  options?:
    VendorModuleRouteOptions
): VendorFetchAuthenticationResolver | undefined {
  if (
    options?.authenticationResolver
  ) {
    return options.authenticationResolver;
  }

  if (
    options
      ?.useHeaderAuthenticationResolver ===
      false
  ) {
    return undefined;
  }

  return createVendorHeaderAuthenticationResolver();
}

/**
 * Creates the complete Vendor route module.
 */
export function createVendorModuleRoutes(
  module:
    VendorModule,
  options:
    VendorModuleRouteOptions = {}
): CompleteVendorRouteModule {
  return createCompleteVendorRouteModule({
    controller:
      module.controller,

    authenticationResolver:
      resolveVendorModuleAuthenticationResolver(
        options
      ),

    ownershipResolver:
      options.ownershipResolver,

    routePrefix:
      options.routePrefix ??
      "/api",

    requestIdFactory:
      options.requestIdFactory ??
      createVendorRouteRequestId,

    allowAdminOverride:
      options.allowAdminOverride ??
      true,

    allowEmptyBody:
      options.allowEmptyBody ??
      true,
  });
}

/**
 * Creates catch-all HTTP handlers from the Vendor route
 * module.
 */
export function createVendorModuleCatchAllHandlers(
  routeModule:
    CompleteVendorRouteModule
): VendorCatchAllMethodHandlers {
  return createVendorCatchAllMethodHandlers(
    routeModule
  );
}

/**
 * Creates the full Vendor application module.
 */
export function createCompleteVendorApplicationModule(
  options:
    CompleteVendorModuleOptions = {}
): CompleteVendorApplicationModule {
  const module =
    createVendorModule(
      options
    );

  const routeModule =
    createVendorModuleRoutes(
      module,
      options.routes
    );

  const handlers =
    createVendorModuleCatchAllHandlers(
      routeModule
    );

  return {
    ...module,

    routeModule,

    handlers,
  };
}

/**
 * Safely creates the full Vendor application module.
 */
export interface CreateCompleteVendorApplicationModuleResult {
  success: boolean;

  module?:
    CompleteVendorApplicationModule;

  error?: {
    code: string;

    message: string;

    issues?:
      VendorModuleValidationIssue[];
  };
}

/**
 * Creates the full Vendor application module without
 * throwing.
 */
export function tryCreateCompleteVendorApplicationModule(
  options:
    CompleteVendorModuleOptions = {}
): CreateCompleteVendorApplicationModuleResult {
  try {
    return {
      success: true,

      module:
        createCompleteVendorApplicationModule(
          options
        ),
    };
  } catch (error) {
    if (
      isVendorModuleConfigurationError(
        error
      )
    ) {
      return {
        success: false,

        error: {
          code:
            "VENDOR_APPLICATION_MODULE_CONFIGURATION_FAILED",

          message:
            error.message,

          issues:
            error.issues,
        },
      };
    }

    return {
      success: false,

      error: {
        code:
          "VENDOR_APPLICATION_MODULE_CREATION_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "An unknown Vendor application-module error occurred.",
      },
    };
  }
}

/**
 * Vendor route diagnostics summary.
 */
export interface VendorModuleRouteDiagnostics {
  healthy: boolean;

  routeCount: number;

  issues: Array<{
    severity:
      | "error"
      | "warning";

    code: string;

    message: string;

    routeName?: string;
  }>;
}

/**
 * Runs route diagnostics for a complete Vendor module.
 */
export function diagnoseVendorModuleRoutes(
  module:
    CompleteVendorApplicationModule
): VendorModuleRouteDiagnostics {
  const diagnostics =
    diagnoseVendorRoutes(
      module.routeModule
        .routeDefinitions
    );

  return {
    healthy:
      diagnostics.healthy,

    routeCount:
      diagnostics.routeCount,

    issues:
      diagnostics.issues.map(
        (issue) => ({
          severity:
            issue.severity,

          code:
            issue.code,

          message:
            issue.message,

          routeName:
            issue.routeName,
        })
      ),
  };
}

/**
 * Complete Vendor module diagnostics.
 */
export interface CompleteVendorModuleDiagnostics {
  repository:
    VendorModuleSummary;

  routes:
    VendorModuleRouteDiagnostics;

  operational: boolean;
}

/**
 * Runs repository and route diagnostics.
 */
export function diagnoseCompleteVendorModule(
  module:
    CompleteVendorApplicationModule
): CompleteVendorModuleDiagnostics {
  const repository =
    createVendorModuleSummary(
      module
    );

  const routes =
    diagnoseVendorModuleRoutes(
      module
    );

  return {
    repository,

    routes,

    operational:
      routes.healthy &&
      repository
        .supportedCapabilities
        .includes(
          "CORE_VENDOR_READ"
        ) &&
      repository
        .supportedCapabilities
        .includes(
          "CORE_VENDOR_WRITE"
        ),
  };
}

/**
 * Complete Vendor application-module singleton.
 */
let completeVendorModuleSingleton:
  CompleteVendorApplicationModule
  | undefined;

/**
 * Returns the complete application-module singleton or
 * creates it.
 */
export function getCompleteVendorApplicationModule(
  options:
    CompleteVendorModuleOptions = {}
): CompleteVendorApplicationModule {
  if (
    !completeVendorModuleSingleton
  ) {
    completeVendorModuleSingleton =
      createCompleteVendorApplicationModule(
        options
      );
  }

  return completeVendorModuleSingleton;
}

/**
 * Returns the complete module without initializing it.
 */
export function peekCompleteVendorApplicationModule():
  CompleteVendorApplicationModule
  | undefined {
  return completeVendorModuleSingleton;
}

/**
 * Determines whether the complete Vendor module has been
 * initialized.
 */
export function isCompleteVendorApplicationModuleInitialized():
  boolean {
  return (
    completeVendorModuleSingleton !==
    undefined
  );
}

/**
 * Resets the complete application-module singleton.
 *
 * The Part A module singleton is also reset to prevent
 * separate stale dependency graphs during tests.
 */
export function resetCompleteVendorApplicationModule():
  void {
  completeVendorModuleSingleton =
    undefined;

  resetVendorModule();
}

/**
 * Complete module initialization options.
 */
export interface InitializeCompleteVendorApplicationModuleOptions
  extends CompleteVendorModuleOptions {
  forceReinitialize?:
    boolean;
}

/**
 * Explicitly initializes the complete Vendor module.
 */
export function initializeCompleteVendorApplicationModule(
  options:
    InitializeCompleteVendorApplicationModuleOptions = {}
): CompleteVendorApplicationModule {
  if (
    options.forceReinitialize ===
    true
  ) {
    resetCompleteVendorApplicationModule();
  }

  return getCompleteVendorApplicationModule(
    options
  );
}

/**
 * Returns the catch-all Vendor handlers.
 */
export function getVendorModuleHandlers(
  options:
    CompleteVendorModuleOptions = {}
): VendorCatchAllMethodHandlers {
  return getCompleteVendorApplicationModule(
    options
  ).handlers;
}

/**
 * Executes a Vendor catch-all GET request.
 */
export async function executeVendorModuleGet(
  request: Request,
  context?: Parameters<
    VendorCatchAllMethodHandlers["GET"]
  >[1]
): Promise<Response> {
  return getVendorModuleHandlers()
    .GET(
      request,
      context
    );
}

/**
 * Executes a Vendor catch-all POST request.
 */
export async function executeVendorModulePost(
  request: Request,
  context?: Parameters<
    VendorCatchAllMethodHandlers["POST"]
  >[1]
): Promise<Response> {
  return getVendorModuleHandlers()
    .POST(
      request,
      context
    );
}

/**
 * Executes a Vendor catch-all PUT request.
 */
export async function executeVendorModulePut(
  request: Request,
  context?: Parameters<
    VendorCatchAllMethodHandlers["PUT"]
  >[1]
): Promise<Response> {
  return getVendorModuleHandlers()
    .PUT(
      request,
      context
    );
}

/**
 * Executes a Vendor catch-all PATCH request.
 */
export async function executeVendorModulePatch(
  request: Request,
  context?: Parameters<
    VendorCatchAllMethodHandlers["PATCH"]
  >[1]
): Promise<Response> {
  return getVendorModuleHandlers()
    .PATCH(
      request,
      context
    );
}

/**
 * Executes a Vendor catch-all DELETE request.
 */
export async function executeVendorModuleDelete(
  request: Request,
  context?: Parameters<
    VendorCatchAllMethodHandlers["DELETE"]
  >[1]
): Promise<Response> {
  return getVendorModuleHandlers()
    .DELETE(
      request,
      context
    );
}

/**
 * ============================================================
 * End of Vendor Module Part B
 * ============================================================
 */