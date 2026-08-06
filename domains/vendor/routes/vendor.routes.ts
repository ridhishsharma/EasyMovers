/**
 * ============================================================
 * EasyMovers
 * Vendor Routes
 * ============================================================
 *
 * File
 * ----
 * vendor.routes.ts
 *
 * Part A
 * ------
 * - Framework-independent route contracts
 * - Vendor route registry
 * - Path parameter matching
 * - Route resolution
 * - Access-control contracts
 * - Controller handler binding
 *
 * Responsibilities
 * ----------------
 * The route layer:
 *
 * - Registers vendor endpoints
 * - Resolves HTTP method and request path
 * - Extracts route parameters
 * - Connects routes to controller handlers
 * - Defines route-level access requirements
 *
 * The route layer must not:
 *
 * - Query the database
 * - Contain business rules
 * - Duplicate service validation
 * - Directly implement repository operations
 * ============================================================
 */

import type {
  CompleteVendorController,
  VendorControllerAccessLevel,
  VendorControllerHandler,
  VendorControllerHttpMethod,
  VendorControllerRequest,
  VendorControllerResponse,
  VendorControllerRouteDefinition,
  VendorControllerRouteName,
} from "../controllers/vendor.controller";

import {
  VENDOR_CONTROLLER_ROUTES,
  executeVendorControllerHandler,
  getVendorControllerHandler,
} from "../controllers/vendor.controller";

/**
 * Generic route parameter record.
 */
export type VendorRouteParameters =
  Record<string, string>;

/**
 * Route query-value type.
 */
export type VendorRouteQueryValue =
  | string
  | string[]
  | undefined;

/**
 * Generic route query record.
 */
export type VendorRouteQuery =
  Record<
    string,
    VendorRouteQueryValue
  >;

/**
 * Generic route header record.
 */
export type VendorRouteHeaders =
  Record<
    string,
    string | string[] | undefined
  >;

/**
 * Route-level authentication context.
 */
export interface VendorRouteAuthentication {
  authenticated: boolean;

  userId?: string;

  roles?: string[];

  vendorId?: string;
}

/**
 * Framework-independent incoming route request.
 */
export interface VendorRouteRequest<
  TBody = unknown
> {
  method: string;

  path: string;

  body?: TBody;

  query?: VendorRouteQuery;

  headers?: VendorRouteHeaders;

  requestId?: string;

  ipAddress?: string;

  userAgent?: string;

  authentication?:
    VendorRouteAuthentication;
}

/**
 * Resolved route information.
 */
export interface ResolvedVendorRoute {
  definition:
    VendorControllerRouteDefinition;

  params:
    VendorRouteParameters;

  handler:
    VendorControllerHandler;
}

/**
 * Route-resolution result.
 */
export interface ResolveVendorRouteResult {
  matched: boolean;

  route?:
    ResolvedVendorRoute;

  methodAllowed?: boolean;

  allowedMethods?:
    VendorControllerHttpMethod[];
}

/**
 * Route-access decision.
 */
export interface VendorRouteAccessDecision {
  allowed: boolean;

  status?: number;

  code?: string;

  message?: string;
}

/**
 * Route-access evaluator.
 *
 * A production application can replace the default evaluator
 * with its own role and ownership policy.
 */
export type VendorRouteAccessEvaluator =
  (
    access:
      VendorControllerAccessLevel,
    authentication:
      VendorRouteAuthentication
      | undefined,
    params:
      VendorRouteParameters
  ) =>
    VendorRouteAccessDecision
    | Promise<
        VendorRouteAccessDecision
      >;

/**
 * Registered vendor route.
 */
export interface RegisteredVendorRoute {
  definition:
    VendorControllerRouteDefinition;

  handler:
    VendorControllerHandler;
}

/**
 * Vendor route registry contract.
 */
export interface VendorRouteRegistry {
  routes:
    readonly RegisteredVendorRoute[];

  resolve(
    method: string,
    path: string
  ): ResolveVendorRouteResult;

  execute(
    request:
      VendorRouteRequest
  ): Promise<
    VendorControllerResponse
  >;
}

/**
 * Vendor route-registry dependencies.
 */
export interface VendorRouteRegistryDependencies {
  controller:
    CompleteVendorController;

  accessEvaluator?:
    VendorRouteAccessEvaluator;
}

/**
 * Normalizes an HTTP method.
 */
export function normalizeVendorRouteMethod(
  method: unknown
): string {
  return typeof method === "string"
    ? method.trim().toUpperCase()
    : "";
}

/**
 * Normalizes a request path.
 *
 * The returned path:
 *
 * - Starts with "/"
 * - Does not include a query string
 * - Does not have a trailing slash, except for "/"
 */
export function normalizeVendorRoutePath(
  path: unknown
): string {
  if (typeof path !== "string") {
    return "/";
  }

  const withoutQuery =
    path.split("?")[0]?.trim() ?? "";

  if (!withoutQuery) {
    return "/";
  }

  const withLeadingSlash =
    withoutQuery.startsWith("/")
      ? withoutQuery
      : `/${withoutQuery}`;

  if (
    withLeadingSlash.length > 1 &&
    withLeadingSlash.endsWith("/")
  ) {
    return withLeadingSlash.replace(
      /\/+$/,
      ""
    );
  }

  return withLeadingSlash;
}

/**
 * Decodes a route parameter safely.
 */
export function decodeVendorRouteParameter(
  value: string
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Splits a normalized path into path segments.
 */
export function splitVendorRoutePath(
  path: string
): string[] {
  return normalizeVendorRoutePath(
    path
  )
    .split("/")
    .filter(
      (segment) =>
        segment.length > 0
    );
}

/**
 * Matches an incoming path against a route template.
 *
 * Example:
 *
 * Template:
 * /vendors/:vendorId/vehicles/:vehicleId
 *
 * Path:
 * /vendors/vendor-1/vehicles/vehicle-2
 */
export function matchVendorRoutePath(
  template: string,
  path: string
): VendorRouteParameters | null {
  const templateSegments =
    splitVendorRoutePath(
      template
    );

  const pathSegments =
    splitVendorRoutePath(
      path
    );

  if (
    templateSegments.length !==
    pathSegments.length
  ) {
    return null;
  }

  const params:
    VendorRouteParameters = {};

  for (
    let index = 0;
    index <
    templateSegments.length;
    index += 1
  ) {
    const templateSegment =
      templateSegments[index];

    const pathSegment =
      pathSegments[index];

    if (
      templateSegment === undefined ||
      pathSegment === undefined
    ) {
      return null;
    }

    if (
      templateSegment.startsWith(":")
    ) {
      const parameterName =
        templateSegment.slice(1);

      if (!parameterName) {
        return null;
      }

      params[parameterName] =
        decodeVendorRouteParameter(
          pathSegment
        );

      continue;
    }

    if (
      templateSegment !==
      pathSegment
    ) {
      return null;
    }
  }

  return params;
}

/**
 * Determines whether two route paths have the same template
 * structure.
 */
export function areVendorRouteTemplatesEquivalent(
  firstPath: string,
  secondPath: string
): boolean {
  const firstSegments =
    splitVendorRoutePath(
      firstPath
    );

  const secondSegments =
    splitVendorRoutePath(
      secondPath
    );

  if (
    firstSegments.length !==
    secondSegments.length
  ) {
    return false;
  }

  return firstSegments.every(
    (firstSegment, index) => {
      const secondSegment =
        secondSegments[index];

      if (
        secondSegment === undefined
      ) {
        return false;
      }

      const firstIsParameter =
        firstSegment.startsWith(
          ":"
        );

      const secondIsParameter =
        secondSegment.startsWith(
          ":"
        );

      if (
        firstIsParameter ||
        secondIsParameter
      ) {
        return (
          firstIsParameter &&
          secondIsParameter
        );
      }

      return (
        firstSegment ===
        secondSegment
      );
    }
  );
}

/**
 * Returns allowed methods for a request path.
 */
export function getAllowedVendorRouteMethods(
  path: string,
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorControllerHttpMethod[] {
  const methods =
    definitions
      .filter(
        (definition) =>
          matchVendorRoutePath(
            definition.path,
            path
          ) !== null
      )
      .map(
        (definition) =>
          definition.method
      );

  return [
    ...new Set(methods),
  ];
}

/**
 * Registers controller handlers using the controller route
 * metadata.
 */
export function createRegisteredVendorRoutes(
  controller:
    CompleteVendorController,
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): RegisteredVendorRoute[] {
  return definitions.map(
    (definition) => ({
      definition: {
        ...definition,
      },

      handler:
        getVendorControllerHandler(
          controller,
          definition.name
        ),
    })
  );
}

/**
 * Resolves an incoming method and path against registered
 * vendor routes.
 */
export function resolveRegisteredVendorRoute(
  routes:
    readonly RegisteredVendorRoute[],
  method: string,
  path: string
): ResolveVendorRouteResult {
  const normalizedMethod =
    normalizeVendorRouteMethod(
      method
    );

  const normalizedPath =
    normalizeVendorRoutePath(
      path
    );

  const matchingPathRoutes:
    Array<{
      route:
        RegisteredVendorRoute;

      params:
        VendorRouteParameters;
    }> = [];

  for (const route of routes) {
    const params =
      matchVendorRoutePath(
        route.definition.path,
        normalizedPath
      );

    if (params) {
      matchingPathRoutes.push({
        route,
        params,
      });
    }
  }

  if (
    matchingPathRoutes.length === 0
  ) {
    return {
      matched: false,

      methodAllowed: false,

      allowedMethods: [],
    };
  }

  const matchingRoute =
    matchingPathRoutes.find(
      ({ route }) =>
        route.definition.method ===
        normalizedMethod
    );

  if (!matchingRoute) {
    return {
      matched: false,

      methodAllowed: false,

      allowedMethods: [
        ...new Set(
          matchingPathRoutes.map(
            ({ route }) =>
              route.definition.method
          )
        ),
      ],
    };
  }

  return {
    matched: true,

    methodAllowed: true,

    allowedMethods: [
      matchingRoute.route
        .definition.method,
    ],

    route: {
      definition:
        matchingRoute.route
          .definition,

      params:
        matchingRoute.params,

      handler:
        matchingRoute.route
          .handler,
    },
  };
}

/**
 * Default route-access evaluator.
 *
 * This is intentionally conservative:
 *
 * - PUBLIC routes allow all requests.
 * - Every other access level requires authentication.
 * - ADMIN requires the ADMIN role.
 * - VENDOR allows ADMIN or VENDOR.
 *
 * Vendor ownership verification can be added in a later
 * route section or dedicated authorization policy.
 */
export function defaultVendorRouteAccessEvaluator(
  access:
    VendorControllerAccessLevel,
  authentication:
    VendorRouteAuthentication
    | undefined
): VendorRouteAccessDecision {
  if (access === "PUBLIC") {
    return {
      allowed: true,
    };
  }

  if (
    !authentication?.authenticated
  ) {
    return {
      allowed: false,

      status: 401,

      code:
        "VENDOR_AUTHENTICATION_REQUIRED",

      message:
        "Authentication is required.",
    };
  }

  const roles =
    authentication.roles?.map(
      (role) =>
        role.trim().toUpperCase()
    ) ?? [];

  if (
    access === "AUTHENTICATED"
  ) {
    return {
      allowed: true,
    };
  }

  if (access === "ADMIN") {
    const allowed =
      roles.includes("ADMIN");

    return allowed
      ? {
          allowed: true,
        }
      : {
          allowed: false,

          status: 403,

          code:
            "VENDOR_ADMIN_ACCESS_REQUIRED",

          message:
            "Administrator access is required.",
        };
  }

  if (access === "VENDOR") {
    const allowed =
      roles.includes("ADMIN") ||
      roles.includes("VENDOR");

    return allowed
      ? {
          allowed: true,
        }
      : {
          allowed: false,

          status: 403,

          code:
            "VENDOR_ACCESS_REQUIRED",

          message:
            "Vendor access is required.",
        };
  }

  return {
    allowed: false,

    status: 403,

    code:
      "VENDOR_ROUTE_ACCESS_DENIED",

    message:
      "Access to this vendor route is denied.",
  };
}

/**
 * Converts a route request into a controller request.
 */
export function mapVendorRouteRequestToControllerRequest(
  request:
    VendorRouteRequest,
  params:
    VendorRouteParameters
): VendorControllerRequest {
  return {
    body:
      request.body,

    params,

    query:
      request.query,

    headers:
      request.headers,

    method:
      normalizeVendorRouteMethod(
        request.method
      ),

    path:
      normalizeVendorRoutePath(
        request.path
      ),

    requestId:
      request.requestId,

    ipAddress:
      request.ipAddress,

    userAgent:
      request.userAgent,

    authenticatedUserId:
      request.authentication
        ?.userId,
  };
}

/**
 * Creates a route-not-found response.
 */
export function createVendorRouteNotFoundResponse(
  requestId?: string
): VendorControllerResponse {
  return {
    status: 404,

    body: {
      success: false,

      error: {
        code:
          "VENDOR_ROUTE_NOT_FOUND",

        message:
          "Vendor route was not found.",
      },

      meta: {
        requestId,

        timestamp:
          new Date().toISOString(),
      },
    },
  };
}

/**
 * Creates a method-not-allowed response.
 */
export function createVendorRouteMethodNotAllowedResponse(
  allowedMethods:
    VendorControllerHttpMethod[],
  requestId?: string
): VendorControllerResponse {
  return {
    status: 405,

    headers: {
      Allow:
        allowedMethods.join(", "),
    },

    body: {
      success: false,

      error: {
        code:
          "VENDOR_ROUTE_METHOD_NOT_ALLOWED",

        message:
          "The HTTP method is not allowed for this vendor route.",

        details: {
          allowedMethods,
        },
      },

      meta: {
        requestId,

        timestamp:
          new Date().toISOString(),
      },
    },
  };
}

/**
 * Creates a route-access failure response.
 */
export function createVendorRouteAccessFailureResponse(
  decision:
    VendorRouteAccessDecision,
  requestId?: string
): VendorControllerResponse {
  return {
    status:
      decision.status ?? 403,

    body: {
      success: false,

      error: {
        code:
          decision.code ??
          "VENDOR_ROUTE_ACCESS_DENIED",

        message:
          decision.message ??
          "Access to this vendor route is denied.",
      },

      meta: {
        requestId,

        timestamp:
          new Date().toISOString(),
      },
    },
  };
}

/**
 * Default vendor route registry.
 */
export class DefaultVendorRouteRegistry
  implements VendorRouteRegistry {
  readonly routes:
    readonly RegisteredVendorRoute[];

  private readonly accessEvaluator:
    VendorRouteAccessEvaluator;

  constructor(
    dependencies:
      VendorRouteRegistryDependencies
  ) {
    this.routes =
      createRegisteredVendorRoutes(
        dependencies.controller
      );

    this.accessEvaluator =
      dependencies.accessEvaluator ??
      defaultVendorRouteAccessEvaluator;
  }

  /**
   * Resolves an HTTP method and path.
   */
  resolve(
    method: string,
    path: string
  ): ResolveVendorRouteResult {
    return resolveRegisteredVendorRoute(
      this.routes,
      method,
      path
    );
  }

  /**
   * Resolves, authorizes, and executes a vendor route.
   */
  async execute(
    request:
      VendorRouteRequest
  ): Promise<
    VendorControllerResponse
  > {
    const resolved =
      this.resolve(
        request.method,
        request.path
      );

    if (
      !resolved.matched ||
      !resolved.route
    ) {
      if (
        resolved.allowedMethods &&
        resolved.allowedMethods.length > 0
      ) {
        return createVendorRouteMethodNotAllowedResponse(
          resolved.allowedMethods,
          request.requestId
        );
      }

      return createVendorRouteNotFoundResponse(
        request.requestId
      );
    }

    const accessDecision =
      await this.accessEvaluator(
        resolved.route
          .definition.access,
        request.authentication,
        resolved.route.params
      );

    if (!accessDecision.allowed) {
      return createVendorRouteAccessFailureResponse(
        accessDecision,
        request.requestId
      );
    }

    const controllerRequest =
      mapVendorRouteRequestToControllerRequest(
        request,
        resolved.route.params
      );

    return executeVendorControllerHandler(
      resolved.route.handler,
      controllerRequest
    );
  }
}

/**
 * Creates a vendor route registry.
 */
export function createVendorRouteRegistry(
  dependencies:
    VendorRouteRegistryDependencies
): VendorRouteRegistry {
  return new DefaultVendorRouteRegistry(
    dependencies
  );
}

/**
 * Returns a defensive copy of registered route metadata.
 */
export function getVendorRegisteredRouteDefinitions(
  registry:
    VendorRouteRegistry
): VendorControllerRouteDefinition[] {
  return registry.routes.map(
    ({ definition }) => ({
      ...definition,
    })
  );
}

/**
 * Returns a registered route using its route name.
 */
export function findRegisteredVendorRoute(
  registry:
    VendorRouteRegistry,
  routeName:
    VendorControllerRouteName
): RegisteredVendorRoute | undefined {
  return registry.routes.find(
    ({ definition }) =>
      definition.name ===
      routeName
  );
}

/**
 * Returns registered routes belonging to an access level.
 */
export function findVendorRoutesByAccess(
  registry:
    VendorRouteRegistry,
  access:
    VendorControllerAccessLevel
): RegisteredVendorRoute[] {
  return registry.routes.filter(
    ({ definition }) =>
      definition.access ===
      access
  );
}

/**
 * Returns registered routes belonging to an HTTP method.
 */
export function findVendorRoutesByMethod(
  registry:
    VendorRouteRegistry,
  method:
    VendorControllerHttpMethod
): RegisteredVendorRoute[] {
  return registry.routes.filter(
    ({ definition }) =>
      definition.method ===
      method
  );
}

/**
 * Determines whether the registry contains a named route.
 */
export function hasRegisteredVendorRoute(
  registry:
    VendorRouteRegistry,
  routeName:
    VendorControllerRouteName
): boolean {
  return registry.routes.some(
    ({ definition }) =>
      definition.name ===
      routeName
  );
}

/**
 * Determines whether the vendor route definitions contain
 * duplicate method/path combinations.
 */
export function findDuplicateVendorRoutes(
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorControllerRouteDefinition[][] {
  const routeGroups =
    new Map<
      string,
      VendorControllerRouteDefinition[]
    >();

  for (
    const definition
    of definitions
  ) {
    const key = [
      definition.method,
      normalizeVendorRoutePath(
        definition.path
      ),
    ].join(":");

    const existing =
      routeGroups.get(key) ?? [];

    existing.push({
      ...definition,
    });

    routeGroups.set(
      key,
      existing
    );
  }

  return [
    ...routeGroups.values(),
  ].filter(
    (group) =>
      group.length > 1
  );
}

/**
 * Validates the vendor route registry configuration.
 */
export interface VendorRouteRegistryValidationResult {
  valid: boolean;

  errors: string[];
}

/**
 * Validates route names and method/path combinations.
 */
export function validateVendorRouteDefinitions(
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorRouteRegistryValidationResult {
  const errors: string[] = [];

  const routeNames =
    new Set<
      VendorControllerRouteName
    >();

  for (
    const definition
    of definitions
  ) {
    if (
      routeNames.has(
        definition.name
      )
    ) {
      errors.push(
        `Duplicate vendor route name: ${definition.name}.`
      );
    } else {
      routeNames.add(
        definition.name
      );
    }

    if (
      !normalizeVendorRoutePath(
        definition.path
      )
    ) {
      errors.push(
        `Vendor route ${definition.name} has an invalid path.`
      );
    }
  }

  const duplicateRoutes =
    findDuplicateVendorRoutes(
      definitions
    );

  for (
    const duplicateGroup
    of duplicateRoutes
  ) {
    const firstRoute =
      duplicateGroup[0];

    if (firstRoute) {
      errors.push(
        `Duplicate vendor route: ${firstRoute.method} ${firstRoute.path}.`
      );
    }
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

/**
 * ============================================================
 * End of Vendor Routes Part A
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Routes
 * Part B
 * ============================================================
 *
 * Fetch API / Next.js App Router adapter:
 *
 * - Request body parsing
 * - Query parsing
 * - Header conversion
 * - Authentication resolver contract
 * - Native Request to VendorRouteRequest mapping
 * - VendorControllerResponse to Response mapping
 * - Fetch-compatible route handler factory
 * ============================================================
 */

/**
 * Authentication resolver for Fetch API requests.
 *
 * The application authentication layer can inspect:
 *
 * - Session cookies
 * - Authorization headers
 * - JWT claims
 * - Middleware-injected headers
 *
 * and return the normalized vendor-route authentication
 * context.
 */
export type VendorFetchAuthenticationResolver =
  (
    request: Request
  ) =>
    VendorRouteAuthentication
    | undefined
    | Promise<
        VendorRouteAuthentication
        | undefined
      >;

/**
 * Fetch route adapter configuration.
 */
export interface VendorFetchRouteAdapterOptions {
  /**
   * Optional route prefix removed before route resolution.
   *
   * Example:
   *
   * Request path:
   * /api/vendors/vendor-1
   *
   * Prefix:
   * /api
   *
   * Resolved vendor path:
   * /vendors/vendor-1
   */
  routePrefix?: string;

  /**
   * Resolves the authenticated user and roles.
   */
  authenticationResolver?:
    VendorFetchAuthenticationResolver;

  /**
   * Creates request IDs when the incoming request does not
   * contain one.
   */
  requestIdFactory?:
    () => string;

  /**
   * Whether empty request bodies should resolve to undefined.
   */
  allowEmptyBody?: boolean;
}

/**
 * Fetch route-handler dependencies.
 */
export interface VendorFetchRouteHandlerDependencies {
  registry:
    VendorRouteRegistry;

  options?:
    VendorFetchRouteAdapterOptions;
}

/**
 * Supported JSON content types.
 */
export function isVendorJsonContentType(
  contentType: string | null
): boolean {
  if (!contentType) {
    return false;
  }

  const normalized =
    contentType.toLowerCase();

  return (
    normalized.includes(
      "application/json"
    ) ||
    normalized.includes(
      "+json"
    )
  );
}

/**
 * Determines whether an HTTP method normally supports a body.
 */
export function vendorRouteMethodSupportsBody(
  method: string
): boolean {
  const normalizedMethod =
    normalizeVendorRouteMethod(
      method
    );

  return [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ].includes(
    normalizedMethod
  );
}
/**
 * Vendor fields that represent Date values in the domain.
 */
const VENDOR_DATE_FIELD_NAMES =
  new Set<string>([
    "createdAt",
    "updatedAt",
    "effectiveFrom",
    "effectiveUntil",
    "insuranceExpiryDate",
    "permitExpiryDate",
    "pollutionCertificateExpiryDate",
    "issuedAt",
    "expiresAt",
    "verifiedAt",
    "deletedAt",
    "restoredAt",
    "approvedAt",
    "suspendedAt",
    "lastVerifiedAt",
    "lastBookingAt",
  ]);

/**
 * Determines whether a value resembles an ISO date.
 */
export function isVendorIsoDateString(
  value: unknown
): value is string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return false;
  }

  return (
    /^\d{4}-\d{2}-\d{2}T/.test(
      value
    ) &&
    !Number.isNaN(
      Date.parse(value)
    )
  );
}

/**
 * JSON reviver that restores known vendor-domain Date fields.
 */
export function reviveVendorRequestDate(
  key: string,
  value: unknown
): unknown {
  if (
    VENDOR_DATE_FIELD_NAMES.has(
      key
    ) &&
    isVendorIsoDateString(
      value
    )
  ) {
    return new Date(value);
  }

  return value;
}

/**
 * Parses vendor JSON while restoring Date instances.
 */
export function parseVendorJsonText(
  text: string
): unknown {
  return JSON.parse(
    text,
    reviveVendorRequestDate
  );
}
/**
 * Safely parses a Fetch API request body.
 */
export async function parseVendorFetchRequestBody(
  request: Request,
  allowEmptyBody = true
): Promise<unknown> {
  if (
    !vendorRouteMethodSupportsBody(
      request.method
    )
  ) {
    return undefined;
  }

  const contentLength =
    request.headers.get(
      "content-length"
    );

  if (contentLength === "0") {
    return undefined;
  }

  const contentType =
    request.headers.get(
      "content-type"
    );

  const clonedRequest =
    request.clone();

if (
  isVendorJsonContentType(
    contentType
  )
) {
  try {
    const text =
      await clonedRequest.text();

    if (
      text.trim().length === 0
    ) {
      return undefined;
    }

    return parseVendorJsonText(
      text
    );
  } catch (error) {
      if (allowEmptyBody) {
        const text =
          await request
            .clone()
            .text();

        if (
          text.trim().length === 0
        ) {
          return undefined;
        }
      }

      throw new VendorRouteRequestParsingError(
        "INVALID_JSON_BODY",
        "Request body contains invalid JSON.",
        error
      );
    }
  }

  try {
    const text =
      await clonedRequest.text();

    if (
      text.trim().length === 0
    ) {
      return undefined;
    }

    return text;
  } catch (error) {
    throw new VendorRouteRequestParsingError(
      "REQUEST_BODY_READ_FAILED",
      "Unable to read the request body.",
      error
    );
  }
}

/**
 * Request-parsing error codes.
 */
export type VendorRouteRequestParsingErrorCode =
  | "INVALID_REQUEST_URL"
  | "INVALID_JSON_BODY"
  | "REQUEST_BODY_READ_FAILED";

/**
 * Error raised while converting a framework request.
 */
export class VendorRouteRequestParsingError
  extends Error {
  readonly code:
    VendorRouteRequestParsingErrorCode;

  readonly cause?: unknown;

  constructor(
    code:
      VendorRouteRequestParsingErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);

    this.name =
      "VendorRouteRequestParsingError";

    this.code = code;

    this.cause = cause;

    Object.setPrototypeOf(
      this,
      VendorRouteRequestParsingError.prototype
    );
  }
}

/**
 * Determines whether an error is a route-request parsing
 * error.
 */
export function isVendorRouteRequestParsingError(
  error: unknown
): error is VendorRouteRequestParsingError {
  return (
    error instanceof
    VendorRouteRequestParsingError
  );
}

/**
 * Converts Fetch API headers to vendor route headers.
 */
export function mapVendorFetchHeaders(
  headers: Headers
): VendorRouteHeaders {
  const mappedHeaders:
    VendorRouteHeaders = {};

  headers.forEach(
    (value, key) => {
      mappedHeaders[key] =
        value;
    }
  );

  return mappedHeaders;
}

/**
 * Converts URL search parameters into route query values.
 *
 * Repeated query parameters are returned as string arrays.
 */
export function mapVendorSearchParams(
  searchParams:
    URLSearchParams
): VendorRouteQuery {
  const query:
    VendorRouteQuery = {};

  for (
    const key
    of new Set(
      searchParams.keys()
    )
  ) {
    const values =
      searchParams.getAll(key);

    if (
      values.length === 0
    ) {
      continue;
    }

    query[key] =
      values.length === 1
        ? values[0]
        : values;
  }

  return query;
}

/**
 * Removes an application route prefix from a pathname.
 */
export function removeVendorRoutePrefix(
  pathname: string,
  routePrefix?: string
): string {
  const normalizedPath =
    normalizeVendorRoutePath(
      pathname
    );

  const normalizedPrefix =
    routePrefix
      ? normalizeVendorRoutePath(
          routePrefix
        )
      : "";

  if (
    !normalizedPrefix ||
    normalizedPrefix === "/"
  ) {
    return normalizedPath;
  }

  if (
    normalizedPath ===
    normalizedPrefix
  ) {
    return "/";
  }

  if (
    normalizedPath.startsWith(
      `${normalizedPrefix}/`
    )
  ) {
    return normalizeVendorRoutePath(
      normalizedPath.slice(
        normalizedPrefix.length
      )
    );
  }

  return normalizedPath;
}

/**
 * Reads the first available request ID header.
 */
export function getVendorFetchRequestId(
  request: Request
): string | undefined {
  const headerNames = [
    "x-request-id",
    "x-correlation-id",
    "traceparent",
  ];

  for (
    const headerName
    of headerNames
  ) {
    const value =
      request.headers.get(
        headerName
      );

    if (
      value &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return undefined;
}

/**
 * Reads a best-effort client IP address.
 *
 * Forwarded headers should only be trusted when configured
 * by a trusted reverse proxy.
 */
export function getVendorFetchClientIp(
  request: Request
): string | undefined {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for"
    );

  if (forwardedFor) {
    const firstAddress =
      forwardedFor
        .split(",")[0]
        ?.trim();

    if (firstAddress) {
      return firstAddress;
    }
  }

  return (
    request.headers.get(
      "x-real-ip"
    ) ??
    request.headers.get(
      "cf-connecting-ip"
    ) ??
    undefined
  );
}

/**
 * Maps a Fetch API Request into VendorRouteRequest.
 */
export async function mapVendorFetchRequest(
  request: Request,
  options?:
    VendorFetchRouteAdapterOptions
): Promise<VendorRouteRequest> {
  let requestUrl: URL;

  try {
    requestUrl =
      new URL(request.url);
  } catch (error) {
    throw new VendorRouteRequestParsingError(
      "INVALID_REQUEST_URL",
      "The request URL is invalid.",
      error
    );
  }

  const authentication =
    options
      ?.authenticationResolver
      ? await options
          .authenticationResolver(
            request
          )
      : undefined;

  const incomingRequestId =
    getVendorFetchRequestId(
      request
    );

  const requestId =
    incomingRequestId ??
    options
      ?.requestIdFactory
      ?.();

  const body =
    await parseVendorFetchRequestBody(
      request,
      options
        ?.allowEmptyBody ??
        true
    );

  return {
    method:
      normalizeVendorRouteMethod(
        request.method
      ),

    path:
      removeVendorRoutePrefix(
        requestUrl.pathname,
        options?.routePrefix
      ),

    body,

    query:
      mapVendorSearchParams(
        requestUrl.searchParams
      ),

    headers:
      mapVendorFetchHeaders(
        request.headers
      ),

    requestId,

    ipAddress:
      getVendorFetchClientIp(
        request
      ),

    userAgent:
      request.headers.get(
        "user-agent"
      ) ??
      undefined,

    authentication,
  };
}

/**
 * Converts controller headers into Fetch API Headers.
 */
export function mapVendorControllerResponseHeaders(
  response:
    VendorControllerResponse
): Headers {
  const headers =
    new Headers();

  headers.set(
    "content-type",
    "application/json; charset=utf-8"
  );

  headers.set(
    "cache-control",
    "no-store"
  );

  if (
    response.body.meta
      ?.requestId
  ) {
    headers.set(
      "x-request-id",
      response.body.meta
        .requestId
    );
  }

  if (response.headers) {
    for (
      const [key, value]
      of Object.entries(
        response.headers
      )
    ) {
      headers.set(
        key,
        value
      );
    }
  }

  return headers;
}

/**
 * Converts VendorControllerResponse into Fetch API Response.
 */
export function mapVendorControllerResponseToFetchResponse(
  response:
    VendorControllerResponse
): Response {
  const headers =
    mapVendorControllerResponseHeaders(
      response
    );

  if (
    response.status === 204
  ) {
    return new Response(
      null,
      {
        status:
          response.status,

        headers,
      }
    );
  }

  return new Response(
    JSON.stringify(
      response.body
    ),
    {
      status:
        response.status,

      headers,
    }
  );
}

/**
 * Creates a parsing-failure response.
 */
export function createVendorRouteParsingFailureResponse(
  error:
    VendorRouteRequestParsingError,
  requestId?: string
): VendorControllerResponse {
  return {
    status: 400,

    body: {
      success: false,

      error: {
        code:
          error.code,

        message:
          error.message,
      },

      meta: {
        requestId,

        timestamp:
          new Date().toISOString(),
      },
    },
  };
}

/**
 * Converts an unexpected adapter failure into a controller
 * response.
 */
export function createVendorRouteAdapterFailureResponse(
  error: unknown,
  requestId?: string
): VendorControllerResponse {
  if (
    isVendorRouteRequestParsingError(
      error
    )
  ) {
    return createVendorRouteParsingFailureResponse(
      error,
      requestId
    );
  }

  return {
    status: 500,

    body: {
      success: false,

      error: {
        code:
          "VENDOR_ROUTE_ADAPTER_FAILED",

        message:
          error instanceof Error
            ? error.message
            : "An unexpected vendor route adapter error occurred.",
      },

      meta: {
        requestId,

        timestamp:
          new Date().toISOString(),
      },
    },
  };
}

/**
 * Fetch-compatible route-handler contract.
 */
export type VendorFetchRouteHandler =
  (
    request: Request
  ) => Promise<Response>;

/**
 * Creates a Fetch API / Next.js-compatible vendor handler.
 */
export function createVendorFetchRouteHandler(
  dependencies:
    VendorFetchRouteHandlerDependencies
): VendorFetchRouteHandler {
  return async (
    request: Request
  ): Promise<Response> => {
    let requestId =
      getVendorFetchRequestId(
        request
      );

    if (
      !requestId &&
      dependencies.options
        ?.requestIdFactory
    ) {
      requestId =
        dependencies.options
          .requestIdFactory();
    }

    try {
      const routeRequest =
        await mapVendorFetchRequest(
          request,
          {
            ...dependencies.options,

            requestIdFactory:
              requestId
                ? () => requestId
                : dependencies
                    .options
                    ?.requestIdFactory,
          }
        );

      const routeResponse =
        await dependencies
          .registry
          .execute(
            routeRequest
          );

      return mapVendorControllerResponseToFetchResponse(
        routeResponse
      );
    } catch (error) {
      const failureResponse =
        createVendorRouteAdapterFailureResponse(
          error,
          requestId
        );

      return mapVendorControllerResponseToFetchResponse(
        failureResponse
      );
    }
  };
}

/**
 * Creates handlers for all supported HTTP methods.
 *
 * These handlers can be exported from a Next.js route file.
 */
export interface VendorFetchMethodHandlers {
  GET:
    VendorFetchRouteHandler;

  POST:
    VendorFetchRouteHandler;

  PUT:
    VendorFetchRouteHandler;

  PATCH:
    VendorFetchRouteHandler;

  DELETE:
    VendorFetchRouteHandler;
}

/**
 * Creates reusable Fetch API handlers for every vendor HTTP
 * method.
 */
export function createVendorFetchMethodHandlers(
  dependencies:
    VendorFetchRouteHandlerDependencies
): VendorFetchMethodHandlers {
  const handler =
    createVendorFetchRouteHandler(
      dependencies
    );

  return {
    GET: handler,

    POST: handler,

    PUT: handler,

    PATCH: handler,

    DELETE: handler,
  };
}

/**
 * Creates a vendor route registry and Fetch handlers together.
 */
export interface VendorFetchRouteModule {
  registry:
    VendorRouteRegistry;

  GET:
    VendorFetchRouteHandler;

  POST:
    VendorFetchRouteHandler;

  PUT:
    VendorFetchRouteHandler;

  PATCH:
    VendorFetchRouteHandler;

  DELETE:
    VendorFetchRouteHandler;
}

/**
 * Dependencies used to create the complete Fetch route module.
 */
export interface VendorFetchRouteModuleDependencies {
  controller:
    CompleteVendorController;

  accessEvaluator?:
    VendorRouteAccessEvaluator;

  options?:
    VendorFetchRouteAdapterOptions;
}

/**
 * Creates the complete Fetch API vendor route module.
 */
export function createVendorFetchRouteModule(
  dependencies:
    VendorFetchRouteModuleDependencies
): VendorFetchRouteModule {
  const registry =
    createVendorRouteRegistry({
      controller:
        dependencies.controller,

      accessEvaluator:
        dependencies.accessEvaluator,
    });

  const handlers =
    createVendorFetchMethodHandlers({
      registry,

      options:
        dependencies.options,
    });

  return {
    registry,

    ...handlers,
  };
}

/**
 * Default role-based authentication resolver factory.
 *
 * This is useful when authentication data has already been
 * injected into request headers by middleware.
 */
export interface VendorHeaderAuthenticationOptions {
  userIdHeader?: string;

  rolesHeader?: string;

  vendorIdHeader?: string;

  authenticatedHeader?: string;
}

/**
 * Creates an authentication resolver using request headers.
 */
export function createVendorHeaderAuthenticationResolver(
  options?:
    VendorHeaderAuthenticationOptions
): VendorFetchAuthenticationResolver {
  const userIdHeader =
    options?.userIdHeader ??
    "x-user-id";

  const rolesHeader =
    options?.rolesHeader ??
    "x-user-roles";

  const vendorIdHeader =
    options?.vendorIdHeader ??
    "x-vendor-id";

  const authenticatedHeader =
    options
      ?.authenticatedHeader ??
    "x-authenticated";

  return (
    request: Request
  ): VendorRouteAuthentication => {
    const userId =
      request.headers.get(
        userIdHeader
      )?.trim() ||
      undefined;

    const vendorId =
      request.headers.get(
        vendorIdHeader
      )?.trim() ||
      undefined;

    const roles =
      request.headers
        .get(rolesHeader)
        ?.split(",")
        .map(
          (role) =>
            role.trim()
        )
        .filter(
          (role) =>
            role.length > 0
        );

    const explicitAuthentication =
      request.headers
        .get(
          authenticatedHeader
        )
        ?.trim()
        .toLowerCase();

    const authenticated =
      explicitAuthentication ===
        "true" ||
      explicitAuthentication ===
        "1" ||
      Boolean(userId);

    return {
      authenticated,

      userId,

      vendorId,

      roles:
        roles &&
        roles.length > 0
          ? roles
          : undefined,
    };
  };
}

/**
 * Creates a fallback vendor route request ID.
 */
export function createVendorRouteRequestId():
  string {
  return [
    "vendor-route",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

/**
 * ============================================================
 * End of Vendor Routes Part B
 * ============================================================
 */
/**
 * ============================================================
 * Vendor Routes
 * Part C
 * ============================================================
 *
 * Final route composition and authorization utilities:
 *
 * - Vendor ownership policy
 * - Role and ownership access evaluator
 * - Complete route-module factory
 * - Catch-all route helpers
 * - Route diagnostics
 * - Route introspection
 * ============================================================
 */

/**
 * Vendor ownership resolver.
 *
 * This determines which vendor belongs to the authenticated
 * user.
 *
 * A production implementation may resolve ownership through:
 *
 * - Session claims
 * - User-to-vendor membership
 * - Organization membership
 * - Repository lookup
 */
export type VendorRouteOwnershipResolver =
  (
    authentication:
      VendorRouteAuthentication,
    params:
      VendorRouteParameters
  ) =>
    boolean
    | Promise<boolean>;

/**
 * Options used by the role-and-ownership access evaluator.
 */
export interface VendorRouteAuthorizationOptions {
  /**
   * Resolves whether the authenticated vendor owns the vendor
   * resource referenced by the route.
   */
  ownershipResolver?:
    VendorRouteOwnershipResolver;

  /**
   * Allows an ADMIN to access vendor-owned routes.
   */
  allowAdminOverride?: boolean;

  /**
   * Allows authenticated users with no explicit roles to use
   * AUTHENTICATED routes.
   */
  allowRolelessAuthenticatedUsers?: boolean;
}

/**
 * Normalizes route roles.
 */
export function normalizeVendorRouteRoles(
  roles:
    | string[]
    | null
    | undefined
): string[] {
  if (!Array.isArray(roles)) {
    return [];
  }

  return [
    ...new Set(
      roles
        .map(
          (role) =>
            typeof role ===
            "string"
              ? role
                  .trim()
                  .toUpperCase()
              : ""
        )
        .filter(
          (role) =>
            role.length > 0
        )
    ),
  ];
}

/**
 * Determines whether authentication contains a role.
 */
export function vendorRouteHasRole(
  authentication:
    VendorRouteAuthentication
    | undefined,
  role: string
): boolean {
  const normalizedRole =
    role.trim().toUpperCase();

  return normalizeVendorRouteRoles(
    authentication?.roles
  ).includes(
    normalizedRole
  );
}

/**
 * Determines whether authentication belongs to the vendor ID
 * referenced in the route.
 */
export function isAuthenticatedVendorRouteOwner(
  authentication:
    VendorRouteAuthentication
    | undefined,
  params:
    VendorRouteParameters
): boolean {
  const authenticatedVendorId =
    authentication?.vendorId
      ?.trim();

  const routeVendorId =
    params.vendorId?.trim();

  return Boolean(
    authenticatedVendorId &&
    routeVendorId &&
    authenticatedVendorId ===
      routeVendorId
  );
}

/**
 * Default ownership resolver.
 */
export function defaultVendorRouteOwnershipResolver(
  authentication:
    VendorRouteAuthentication,
  params:
    VendorRouteParameters
): boolean {
  return isAuthenticatedVendorRouteOwner(
    authentication,
    params
  );
}

/**
 * Creates a route-access evaluator enforcing both roles and
 * vendor ownership.
 */
export function createVendorRouteAccessEvaluator(
  options?:
    VendorRouteAuthorizationOptions
): VendorRouteAccessEvaluator {
  const allowAdminOverride =
    options?.allowAdminOverride ??
    true;

  const allowRolelessAuthenticatedUsers =
    options
      ?.allowRolelessAuthenticatedUsers ??
    true;

  const ownershipResolver =
    options?.ownershipResolver ??
    defaultVendorRouteOwnershipResolver;

  return async (
    access,
    authentication,
    params
  ): Promise<
    VendorRouteAccessDecision
  > => {
    if (access === "PUBLIC") {
      return {
        allowed: true,
      };
    }

    if (
      !authentication?.authenticated
    ) {
      return {
        allowed: false,

        status: 401,

        code:
          "VENDOR_AUTHENTICATION_REQUIRED",

        message:
          "Authentication is required.",
      };
    }

    const roles =
      normalizeVendorRouteRoles(
        authentication.roles
      );

    const isAdmin =
      roles.includes("ADMIN");

    if (
      access ===
      "AUTHENTICATED"
    ) {
      if (
        allowRolelessAuthenticatedUsers ||
        roles.length > 0
      ) {
        return {
          allowed: true,
        };
      }

      return {
        allowed: false,

        status: 403,

        code:
          "VENDOR_ROLE_REQUIRED",

        message:
          "An application role is required.",
      };
    }

    if (access === "ADMIN") {
      return isAdmin
        ? {
            allowed: true,
          }
        : {
            allowed: false,

            status: 403,

            code:
              "VENDOR_ADMIN_ACCESS_REQUIRED",

            message:
              "Administrator access is required.",
          };
    }

    if (access === "VENDOR") {
      if (
        isAdmin &&
        allowAdminOverride
      ) {
        return {
          allowed: true,
        };
      }

      if (
        !roles.includes(
          "VENDOR"
        )
      ) {
        return {
          allowed: false,

          status: 403,

          code:
            "VENDOR_ACCESS_REQUIRED",

          message:
            "Vendor access is required.",
        };
      }

      const ownsVendor =
        await ownershipResolver(
          authentication,
          params
        );

      if (!ownsVendor) {
        return {
          allowed: false,

          status: 403,

          code:
            "VENDOR_OWNERSHIP_REQUIRED",

          message:
            "You do not have access to this vendor resource.",
        };
      }

      return {
        allowed: true,
      };
    }

    return {
      allowed: false,

      status: 403,

      code:
        "VENDOR_ROUTE_ACCESS_DENIED",

      message:
        "Access to this vendor route is denied.",
    };
  };
}

/**
 * Complete vendor route-module dependencies.
 */
export interface CompleteVendorRouteModuleDependencies {
  controller:
    CompleteVendorController;

  authenticationResolver?:
    VendorFetchAuthenticationResolver;

  ownershipResolver?:
    VendorRouteOwnershipResolver;

  routePrefix?: string;

  requestIdFactory?:
    () => string;

  allowAdminOverride?: boolean;

  allowEmptyBody?: boolean;
}

/**
 * Complete vendor route module.
 */
export interface CompleteVendorRouteModule
  extends VendorFetchRouteModule {
  routeDefinitions:
    readonly VendorControllerRouteDefinition[];

  validateRoutes:
    () =>
      VendorRouteRegistryValidationResult;

  resolve:
    (
      method: string,
      path: string
    ) =>
      ResolveVendorRouteResult;
}

/**
 * Creates the final vendor route module.
 */
export function createCompleteVendorRouteModule(
  dependencies:
    CompleteVendorRouteModuleDependencies
): CompleteVendorRouteModule {
  const accessEvaluator =
    createVendorRouteAccessEvaluator(
      {
        ownershipResolver:
          dependencies
            .ownershipResolver,

        allowAdminOverride:
          dependencies
            .allowAdminOverride,
      }
    );

  const module =
    createVendorFetchRouteModule(
      {
        controller:
          dependencies.controller,

        accessEvaluator,

        options: {
          routePrefix:
            dependencies.routePrefix,

          authenticationResolver:
            dependencies
              .authenticationResolver,

          requestIdFactory:
            dependencies
              .requestIdFactory ??
            createVendorRouteRequestId,

          allowEmptyBody:
            dependencies
              .allowEmptyBody,
        },
      }
    );

  return {
    ...module,

    routeDefinitions:
      VENDOR_CONTROLLER_ROUTES,

    validateRoutes:
      () =>
        validateVendorRouteDefinitions(
          VENDOR_CONTROLLER_ROUTES
        ),

    resolve:
      (
        method,
        path
      ) =>
        module.registry.resolve(
          method,
          path
        ),
  };
}

/**
 * Route handler context used by catch-all application routes.
 */
export interface VendorCatchAllRouteContext {
  params?:
    Promise<
      Record<
        string,
        string | string[]
      >
    >
    | Record<
        string,
        string | string[]
      >;
}

/**
 * Catch-all route-handler contract.
 */
export type VendorCatchAllRouteHandler =
  (
    request: Request,
    context?:
      VendorCatchAllRouteContext
  ) => Promise<Response>;

/**
 * Resolves asynchronous route parameters.
 */
export async function resolveVendorCatchAllRouteParams(
  context?:
    VendorCatchAllRouteContext
): Promise<
  Record<
    string,
    string | string[]
  >
> {
  if (!context?.params) {
    return {};
  }

  return await context.params;
}

/**
 * Reads a catch-all route value.
 *
 * Accepted parameter names include:
 *
 * - vendor
 * - vendorPath
 * - slug
 * - path
 */
export function getVendorCatchAllSegments(
  params:
    Record<
      string,
      string | string[]
    >
): string[] {
  const candidateKeys = [
    "vendor",
    "vendorPath",
    "slug",
    "path",
  ];

  for (
    const candidateKey
    of candidateKeys
  ) {
    const value =
      params[candidateKey];

    if (
      Array.isArray(value)
    ) {
      return value
        .map(
          (segment) =>
            segment.trim()
        )
        .filter(
          (segment) =>
            segment.length > 0
        );
    }

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value
        .split("/")
        .map(
          (segment) =>
            segment.trim()
        )
        .filter(
          (segment) =>
            segment.length > 0
        );
    }
  }

  return [];
}

/**
 * Creates a vendor path from catch-all route parameters.
 */
export function createVendorPathFromCatchAllParams(
  params:
    Record<
      string,
      string | string[]
    >
): string {
  const segments =
    getVendorCatchAllSegments(
      params
    );

  if (
    segments.length === 0
  ) {
    return "/vendors";
  }

  if (
    segments[0] === "vendors"
  ) {
    return normalizeVendorRoutePath(
      `/${segments.join("/")}`
    );
  }

  return normalizeVendorRoutePath(
    `/vendors/${segments.join("/")}`
  );
}

/**
 * Rebuilds a Request with a catch-all vendor pathname.
 *
 * Request method, headers, and body are retained.
 */
export async function mapVendorCatchAllRequest(
  request: Request,
  context?:
    VendorCatchAllRouteContext
): Promise<Request> {
  const params =
    await resolveVendorCatchAllRouteParams(
      context
    );

  const vendorPath =
    createVendorPathFromCatchAllParams(
      params
    );

  const originalUrl =
    new URL(request.url);

  originalUrl.pathname =
    vendorPath;

  return new Request(
    originalUrl,
    request
  );
}

/**
 * Creates a catch-all vendor handler from a Fetch handler.
 */
export function createVendorCatchAllRouteHandler(
  handler:
    VendorFetchRouteHandler
): VendorCatchAllRouteHandler {
  return async (
    request,
    context
  ): Promise<Response> => {
    const mappedRequest =
      await mapVendorCatchAllRequest(
        request,
        context
      );

    return handler(
      mappedRequest
    );
  };
}

/**
 * Catch-all method handler collection.
 */
export interface VendorCatchAllMethodHandlers {
  GET:
    VendorCatchAllRouteHandler;

  POST:
    VendorCatchAllRouteHandler;

  PUT:
    VendorCatchAllRouteHandler;

  PATCH:
    VendorCatchAllRouteHandler;

  DELETE:
    VendorCatchAllRouteHandler;
}

/**
 * Creates catch-all route handlers from a complete vendor
 * route module.
 */
export function createVendorCatchAllMethodHandlers(
  module:
    VendorFetchRouteModule
): VendorCatchAllMethodHandlers {
  return {
    GET:
      createVendorCatchAllRouteHandler(
        module.GET
      ),

    POST:
      createVendorCatchAllRouteHandler(
        module.POST
      ),

    PUT:
      createVendorCatchAllRouteHandler(
        module.PUT
      ),

    PATCH:
      createVendorCatchAllRouteHandler(
        module.PATCH
      ),

    DELETE:
      createVendorCatchAllRouteHandler(
        module.DELETE
      ),
  };
}

/**
 * Vendor route diagnostic issue.
 */
export interface VendorRouteDiagnosticIssue {
  severity:
    | "error"
    | "warning";

  code: string;

  message: string;

  routeName?:
    VendorControllerRouteName;
}

/**
 * Vendor route diagnostics result.
 */
export interface VendorRouteDiagnosticsResult {
  healthy: boolean;

  routeCount: number;

  issues:
    VendorRouteDiagnosticIssue[];
}

/**
 * Runs route-level diagnostics.
 */
export function diagnoseVendorRoutes(
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorRouteDiagnosticsResult {
  const issues:
    VendorRouteDiagnosticIssue[] = [];

  const validation =
    validateVendorRouteDefinitions(
      definitions
    );

  for (
    const error
    of validation.errors
  ) {
    issues.push({
      severity: "error",

      code:
        "INVALID_VENDOR_ROUTE",

      message: error,
    });
  }

  for (
    const definition
    of definitions
  ) {
    if (
      definition.path
        .includes("//")
    ) {
      issues.push({
        severity: "warning",

        code:
          "VENDOR_ROUTE_DOUBLE_SLASH",

        message:
          `Route ${definition.name} contains a double slash.`,

        routeName:
          definition.name,
      });
    }

    if (
      definition.access ===
        "PUBLIC" &&
      definition.method !==
        "GET"
    ) {
      issues.push({
        severity: "warning",

        code:
          "PUBLIC_VENDOR_MUTATION_ROUTE",

        message:
          `Public vendor route ${definition.name} performs a mutation.`,

        routeName:
          definition.name,
      });
    }
  }

  return {
    healthy:
      !issues.some(
        (issue) =>
          issue.severity ===
          "error"
      ),

    routeCount:
      definitions.length,

    issues,
  };
}

/**
 * Route summary used for logs or API documentation.
 */
export interface VendorRouteSummary {
  name:
    VendorControllerRouteName;

  method:
    VendorControllerHttpMethod;

  path: string;

  access:
    VendorControllerAccessLevel;
}

/**
 * Creates compact vendor route summaries.
 */
export function createVendorRouteSummaries(
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorRouteSummary[] {
  return definitions.map(
    (definition) => ({
      name:
        definition.name,

      method:
        definition.method,

      path:
        definition.path,

      access:
        definition.access,
    })
  );
}

/**
 * Finds route metadata by method and concrete path.
 */
export function findVendorRouteDefinitionByRequest(
  method: string,
  path: string,
  definitions:
    readonly VendorControllerRouteDefinition[] =
      VENDOR_CONTROLLER_ROUTES
): VendorControllerRouteDefinition | undefined {
  const normalizedMethod =
    normalizeVendorRouteMethod(
      method
    );

  const normalizedPath =
    normalizeVendorRoutePath(
      path
    );

  return definitions.find(
    (definition) =>
      definition.method ===
        normalizedMethod &&
      matchVendorRoutePath(
        definition.path,
        normalizedPath
      ) !== null
  );
}

/**
 * Finds all vendor route parameter names in a template.
 */
export function getVendorRouteParameterNames(
  routePath: string
): string[] {
  return splitVendorRoutePath(
    routePath
  )
    .filter(
      (segment) =>
        segment.startsWith(":")
    )
    .map(
      (segment) =>
        segment.slice(1)
    )
    .filter(
      (segment) =>
        segment.length > 0
    );
}

/**
 * Creates a concrete vendor route path from template
 * parameters.
 */
export function buildVendorRoutePath(
  template: string,
  params:
    Record<
      string,
      string | number
    >
): string {
  const segments =
    splitVendorRoutePath(
      template
    );

  const mappedSegments =
    segments.map(
      (segment) => {
        if (
          !segment.startsWith(
            ":"
          )
        ) {
          return segment;
        }

        const parameterName =
          segment.slice(1);

        const parameterValue =
          params[parameterName];

        if (
          parameterValue ===
          undefined ||
          parameterValue ===
          null ||
          String(
            parameterValue
          ).trim().length === 0
        ) {
          throw new Error(
            `Missing vendor route parameter: ${parameterName}.`
          );
        }

        return encodeURIComponent(
          String(
            parameterValue
          )
        );
      }
    );

  return normalizeVendorRoutePath(
    `/${mappedSegments.join("/")}`
  );
}

/**
 * Creates a concrete path using a route name.
 */
export function buildVendorRoutePathByName(
  routeName:
    VendorControllerRouteName,
  params:
    Record<
      string,
      string | number
    > = {}
): string {
  const definition =
    VENDOR_CONTROLLER_ROUTES.find(
      (route) =>
        route.name === routeName
    );

  if (!definition) {
    throw new Error(
      `Unknown vendor route: ${routeName}.`
    );
  }

  return buildVendorRoutePath(
    definition.path,
    params
  );
}

/**
 * ============================================================
 * End of Vendor Routes
 * ============================================================
 */