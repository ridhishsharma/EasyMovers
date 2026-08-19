/**
 * ============================================================================
 * EasyMovers
 * Quotation Controller
 * Part A
 * ============================================================================
 *
 * File:
 * domains/quotation/controllers/quotation.controller.ts
 *
 * Responsibilities:
 *
 * - Framework-independent controller contracts
 * - Standard HTTP response contracts
 * - Controller request metadata
 * - Route/query/body normalization helpers
 * - Quotation service-result -> HTTP response conversion
 * - Quotation service error -> HTTP status mapping
 * - Controller dependency contract
 *
 * Later parts will implement:
 *
 * - Create Quotation controller
 * - Get by ID / quotation number / reference ID
 * - Booking quotation listing
 * - Customer-safe quotation responses
 * - Search/list controllers
 * - Update/status workflows
 * - Withdraw/reject workflows
 * - Selection/unselection
 * - Acceptance
 * - Comparison / statistics / summary
 * - Expiry / health endpoints
 *
 * IMPORTANT:
 *
 * Controller layer MUST NOT:
 *
 * - Import Prisma
 * - Query repositories directly
 * - Perform database access
 * - Duplicate domain validation
 * - Duplicate service business rules
 * - Expose internal Vendor identity through customer routes
 * ============================================================================
 */

import type {
  AcceptQuotationServiceInput,
  CreateQuotationServiceInput,
  ExpireDueQuotationsServiceInput,
  GetQuotationStatisticsServiceInput,
  QuotationSelectionServiceData,
  QuotationService,
  QuotationServiceDiagnostics,
  QuotationServiceErrorCode,
  QuotationServiceFailure,
  QuotationServiceResult,
  UpdateQuotationServiceInput,
} from "../services/quotation.service";

import type {
  BookingId,
  BookingQuotationComparison,
  CreateQuotationInput,
  CustomerSafeQuotation,
  PaginatedQuotationResult,
  Quotation,
  QuotationId,
  QuotationListItem,
  QuotationListQuery,
  QuotationNumber,
  QuotationReferenceId,
  QuotationSort,
  RejectQuotationInput,
  SelectQuotationInput,
  UnselectQuotationInput,
  UpdateQuotationInput,
  UpdateQuotationStatusInput,
  WithdrawQuotationInput,
} from "../models/quotation.model";

import {
  QuotationStatus,
} from "../models/quotation.model";
/* ============================================================================
 * Generic controller record
 * ============================================================================
 */

/**
 * Generic record used for:
 *
 * - route parameters
 * - query parameters
 * - arbitrary request metadata
 */
export type QuotationControllerRecord =
  Record<
    string,
    unknown
  >;

/* ============================================================================
 * Framework-independent request contract
 * ============================================================================
 */

/**
 * Framework-independent request representation.
 *
 * Next.js route handlers will later adapt Request / params /
 * searchParams into this structure.
 */
export interface QuotationControllerRequest<
  TBody =
    unknown,
  TParams extends
    QuotationControllerRecord =
      QuotationControllerRecord,
  TQuery extends
    QuotationControllerRecord =
      QuotationControllerRecord
> {
  body?:
    TBody;

  params?:
    TParams;

  query?:
    TQuery;

  headers?:
    Record<
      string,
      string |
      string[] |
      undefined
    >;

  method?:
    string;

  path?:
    string;

  requestId?:
    string;

  ipAddress?:
    string;

  userAgent?:
    string;

  authenticatedUserId?:
    string;
}

/* ============================================================================
 * Controller response contracts
 * ============================================================================
 */

export interface QuotationControllerErrorResponse {
  code:
    string;

  message:
    string;

  details?:
    unknown;
}

export interface QuotationControllerResponseMetadata {
  requestId?:
    string;

  timestamp:
    string;

  pagination?:
    unknown;

  warnings?:
    unknown[];
}

export interface QuotationControllerResponseBody<
  TData =
    unknown
> {
  success:
    boolean;

  data?:
    TData;

  error?:
    QuotationControllerErrorResponse;

  meta?:
    QuotationControllerResponseMetadata;
}

export interface QuotationControllerResponse<
  TData =
    unknown
> {
  status:
    number;

  body:
    QuotationControllerResponseBody<
      TData
    >;

  headers?:
    Record<
      string,
      string
    >;
}

/* ============================================================================
 * Controller dependency contract
 * ============================================================================
 */

/**
 * Quotation controller talks only to QuotationService.
 *
 * Repository and Prisma dependencies remain hidden below the
 * service boundary.
 */
export interface QuotationControllerDependencies {
  quotationService:
    QuotationService;
}

/* ============================================================================
 * Common route parameter contracts
 * ============================================================================
 */

export interface QuotationIdRouteParams
  extends QuotationControllerRecord {
  quotationId?:
    unknown;
}

export interface QuotationNumberRouteParams
  extends QuotationControllerRecord {
  quotationNumber?:
    unknown;
}

export interface QuotationReferenceRouteParams
  extends QuotationControllerRecord {
  referenceId?:
    unknown;
}

export interface QuotationBookingRouteParams
  extends QuotationControllerRecord {
  bookingId?:
    unknown;
}

/**
 * Routes requiring both Booking and Quotation IDs.
 */
export interface BookingQuotationRouteParams
  extends QuotationControllerRecord {
  bookingId?:
    unknown;

  quotationId?:
    unknown;
}

/* ============================================================================
 * HTTP status constants
 * ============================================================================
 */

export const QUOTATION_HTTP_STATUS = {
  OK:
    200,

  CREATED:
    201,

  NO_CONTENT:
    204,

  BAD_REQUEST:
    400,

  UNAUTHORIZED:
    401,

  FORBIDDEN:
    403,

  NOT_FOUND:
    404,

  CONFLICT:
    409,

  UNPROCESSABLE_ENTITY:
    422,

  INTERNAL_SERVER_ERROR:
    500,

  SERVICE_UNAVAILABLE:
    503,
} as const;

export type QuotationHttpStatus =
  typeof QUOTATION_HTTP_STATUS[
    keyof typeof QUOTATION_HTTP_STATUS
  ];

/* ============================================================================
 * String normalization
 * ============================================================================
 */

export function normalizeQuotationControllerString(
  value:
    unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export function normalizeQuotationControllerOptionalString(
  value:
    unknown
): string | undefined {
  const normalized =
    normalizeQuotationControllerString(
      value
    );

  return normalized.length >
    0
    ? normalized
    : undefined;
}

/* ============================================================================
 * Boolean normalization
 * ============================================================================
 */

export function normalizeQuotationControllerBoolean(
  value:
    unknown
): boolean | undefined {
  if (
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "y",
    ].includes(
      normalized
    )
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
    ].includes(
      normalized
    )
  ) {
    return false;
  }

  return undefined;
}

/* ============================================================================
 * Number normalization
 * ============================================================================
 */

export function normalizeQuotationControllerNumber(
  value:
    unknown
): number | undefined {
  if (
    typeof value ===
      "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : undefined;
  }

  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    return undefined;
  }

  const parsed =
    Number(
      normalized
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
}

/* ============================================================================
 * Integer normalization
 * ============================================================================
 */

export function normalizeQuotationControllerInteger(
  value:
    unknown
): number | undefined {
  const normalized =
    normalizeQuotationControllerNumber(
      value
    );

  if (
    normalized ===
      undefined ||
    !Number.isInteger(
      normalized
    )
  ) {
    return undefined;
  }

  return normalized;
}

/* ============================================================================
 * Positive integer normalization
 * ============================================================================
 */

export function normalizeQuotationControllerPositiveInteger(
  value:
    unknown
): number | undefined {
  const normalized =
    normalizeQuotationControllerInteger(
      value
    );

  if (
    normalized ===
      undefined ||
    normalized <=
      0
  ) {
    return undefined;
  }

  return normalized;
}

/* ============================================================================
 * String-array normalization
 * ============================================================================
 */

/**
 * Supports:
 *
 * ["SUBMITTED", "REVISED"]
 *
 * or:
 *
 * "SUBMITTED,REVISED"
 */
export function normalizeQuotationControllerStringArray(
  value:
    unknown
): string[] | undefined {
  if (
    Array.isArray(
      value
    )
  ) {
    const normalized =
      value
        .map(
          (
            item
          ) =>
            normalizeQuotationControllerOptionalString(
              item
            )
        )
        .filter(
          (
            item
          ): item is string =>
            Boolean(
              item
            )
        );

    return normalized.length >
      0
      ? normalized
      : undefined;
  }

  if (
    typeof value ===
      "string"
  ) {
    const normalized =
      value
        .split(
          ","
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );

    return normalized.length >
      0
      ? normalized
      : undefined;
  }

  return undefined;
}

/* ============================================================================
 * Date-string normalization
 * ============================================================================
 */

/**
 * Controller only normalizes date text.
 *
 * Domain validation remains responsible for determining whether the
 * date is valid for the requested business operation.
 */
export function normalizeQuotationControllerDateString(
  value:
    unknown
): string | undefined {
  return normalizeQuotationControllerOptionalString(
    value
  );
}

/* ============================================================================
 * Request metadata
 * ============================================================================
 */

export function createQuotationControllerMetadata(
  requestId?:
    string,
  pagination?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponseMetadata {
  const normalizedRequestId =
    normalizeQuotationControllerOptionalString(
      requestId
    );

  return {
    ...(normalizedRequestId
      ? {
          requestId:
            normalizedRequestId,
        }
      : {}),

    timestamp:
      new Date()
        .toISOString(),

    ...(pagination !==
    undefined
      ? {
          pagination,
        }
      : {}),

    ...(warnings &&
    warnings.length >
      0
      ? {
          warnings,
        }
      : {}),
  };
}

/* ============================================================================
 * Success response
 * ============================================================================
 */

export function createQuotationControllerSuccess<
  TData
>(
  status:
    number,
  data:
    TData,
  requestId?:
    string,
  pagination?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  TData
> {
  return {
    status,

    body: {
      success:
        true,

      data,

      meta:
        createQuotationControllerMetadata(
          requestId,
          pagination,
          warnings
        ),
    },
  };
}

/* ============================================================================
 * Failure response
 * ============================================================================
 */

export function createQuotationControllerFailure(
  status:
    number,
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  never
> {
  return {
    status,

    body: {
      success:
        false,

      error: {
        code,

        message,

        ...(details !==
        undefined
          ? {
              details,
            }
          : {}),
      },

      meta:
        createQuotationControllerMetadata(
          requestId,
          undefined,
          warnings
        ),
    },
  };
}

/* ============================================================================
 * HTTP convenience response helpers
 * ============================================================================
 */

export function createQuotationControllerOk<
  TData
>(
  data:
    TData,
  requestId?:
    string,
  pagination?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  TData
> {
  return createQuotationControllerSuccess(
    QUOTATION_HTTP_STATUS.OK,
    data,
    requestId,
    pagination,
    warnings
  );
}

export function createQuotationControllerCreated<
  TData
>(
  data:
    TData,
  requestId?:
    string,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  TData
> {
  return createQuotationControllerSuccess(
    QUOTATION_HTTP_STATUS
      .CREATED,
    data,
    requestId,
    undefined,
    warnings
  );
}

export function createQuotationControllerBadRequest(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .BAD_REQUEST,
    code,
    message,
    requestId,
    details,
    warnings
  );
}

export function createQuotationControllerNotFound(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .NOT_FOUND,
    code,
    message,
    requestId,
    details,
    warnings
  );
}

export function createQuotationControllerConflict(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .CONFLICT,
    code,
    message,
    requestId,
    details,
    warnings
  );
}

export function createQuotationControllerUnprocessable(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown,
  warnings?:
    unknown[]
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .UNPROCESSABLE_ENTITY,
    code,
    message,
    requestId,
    details,
    warnings
  );
}

export function createQuotationControllerInternalError(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .INTERNAL_SERVER_ERROR,
    code,
    message,
    requestId,
    details
  );
}

export function createQuotationControllerUnavailable(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    QUOTATION_HTTP_STATUS
      .SERVICE_UNAVAILABLE,
    code,
    message,
    requestId,
    details
  );
}

/* ============================================================================
 * Service error -> HTTP status
 * ============================================================================
 */

/**
 * Converts stable Quotation service error codes into HTTP semantics.
 *
 * The controller does not reinterpret business logic; it only determines
 * the appropriate HTTP response class.
 */
export function mapQuotationServiceErrorCodeToHttpStatus(
  code:
    QuotationServiceErrorCode
): QuotationHttpStatus {
  switch (
    code
  ) {
    /* ----------------------------------------------------------------------
     * Request/domain validation
     * ----------------------------------------------------------------------
     */

    case "VALIDATION_FAILED":
    case "INVALID_SERVICE_INPUT":
      return QUOTATION_HTTP_STATUS
        .BAD_REQUEST;

    /* ----------------------------------------------------------------------
     * Missing resources
     * ----------------------------------------------------------------------
     */

    case "LEAD_NOT_FOUND":
    case "BOOKING_NOT_FOUND":
    case "VENDOR_NOT_FOUND":
    case "USER_NOT_FOUND":
    case "QUOTATION_NOT_FOUND":
      return QUOTATION_HTTP_STATUS
        .NOT_FOUND;

    /* ----------------------------------------------------------------------
     * Business-state conflicts
     * ----------------------------------------------------------------------
     */

    case "BOOKING_LEAD_MISMATCH":
    case "DUPLICATE_VENDOR_QUOTATION":
    case "QUOTATION_NOT_EDITABLE":
    case "INVALID_STATUS_TRANSITION":
    case "QUOTATION_NOT_WITHDRAWABLE":
    case "QUOTATION_NOT_REJECTABLE":
    case "SELECTED_QUOTATION_MUTATION_BLOCKED":
      return QUOTATION_HTTP_STATUS
        .CONFLICT;

    /* ----------------------------------------------------------------------
     * Persistence/service availability
     * ----------------------------------------------------------------------
     */

    case "TRANSACTION_FAILED":
    case "REPOSITORY_ERROR":
      return QUOTATION_HTTP_STATUS
        .SERVICE_UNAVAILABLE;

    /* ----------------------------------------------------------------------
     * Internal failures
     * ----------------------------------------------------------------------
     */

    case "IDENTITY_GENERATION_FAILED":
    case "UNKNOWN_SERVICE_ERROR":
    default:
      return QUOTATION_HTTP_STATUS
        .INTERNAL_SERVER_ERROR;
  }
}

/* ============================================================================
 * Service failure -> Controller failure
 * ============================================================================
 */

export function mapQuotationServiceFailureToControllerResponse(
  failure:
    QuotationServiceFailure,
  requestId?:
    string
): QuotationControllerResponse<
  never
> {
  return createQuotationControllerFailure(
    mapQuotationServiceErrorCodeToHttpStatus(
      failure.error.code
    ),
    failure.error.code,
    failure.error.message,
    requestId,
    failure.error.details,
    failure.warnings
  );
}

/* ============================================================================
 * Generic service result -> HTTP response
 * ============================================================================
 */

/**
 * Converts any successful QuotationServiceResult into HTTP 200.
 *
 * Creation controllers should use
 * mapQuotationCreateServiceResultToControllerResponse()
 * because successful creation requires HTTP 201.
 */
export function mapQuotationServiceResultToControllerResponse<
  TData
>(
  result:
    QuotationServiceResult<
      TData
    >,
  requestId?:
    string
): QuotationControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    return mapQuotationServiceFailureToControllerResponse(
      result,
      requestId
    );
  }

  return createQuotationControllerOk(
    result.data,
    requestId,
    undefined,
    result.warnings
  );
}

/* ============================================================================
 * Creation service result -> HTTP response
 * ============================================================================
 */

export function mapQuotationCreateServiceResultToControllerResponse<
  TData
>(
  result:
    QuotationServiceResult<
      TData
    >,
  requestId?:
    string
): QuotationControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    return mapQuotationServiceFailureToControllerResponse(
      result,
      requestId
    );
  }

  return createQuotationControllerCreated(
    result.data,
    requestId,
    result.warnings
  );
}

/* ============================================================================
 * Paginated service result -> HTTP response
 * ============================================================================
 */

/**
 * Extracts pagination from a conventional:
 *
 * {
 *   items: [],
 *   pagination: {...}
 * }
 *
 * result while keeping the complete service result as data.
 */
export function mapQuotationPaginatedServiceResultToControllerResponse<
  TData extends {
    pagination:
      unknown;
  }
>(
  result:
    QuotationServiceResult<
      TData
    >,
  requestId?:
    string
): QuotationControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    return mapQuotationServiceFailureToControllerResponse(
      result,
      requestId
    );
  }

  return createQuotationControllerOk(
    result.data,
    requestId,
    result.data
      .pagination,
    result.warnings
  );
}

/* ============================================================================
 * Parameter extraction
 * ============================================================================
 */

export function getQuotationControllerParam(
  request:
    QuotationControllerRequest,
  parameterName:
    string
): string | undefined {
  return normalizeQuotationControllerOptionalString(
    request.params?.[
      parameterName
    ]
  );
}

/* ============================================================================
 * Required parameter helper
 * ============================================================================
 */

export function requireQuotationControllerParam(
  request:
    QuotationControllerRequest,
  parameterName:
    string
): {
  success:
    true;

  value:
    string;
} | {
  success:
    false;

  response:
    QuotationControllerResponse<
      never
    >;
} {
  const value =
    getQuotationControllerParam(
      request,
      parameterName
    );

  if (
    !value
  ) {
    return {
      success:
        false,

      response:
        createQuotationControllerBadRequest(
          "MISSING_ROUTE_PARAMETER",
          `${parameterName} is required.`,
          request.requestId,
          {
            field:
              parameterName,
          }
        ),
    };
  }

  return {
    success:
      true,

    value,
  };
}

/* ============================================================================
 * Request-body guard
 * ============================================================================
 */

export function isQuotationControllerBodyObject(
  value:
    unknown
): value is
  QuotationControllerRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

/**
 * Requires a JSON-object body.
 */
export function requireQuotationControllerBody(
  request:
    QuotationControllerRequest
): {
  success:
    true;

  value:
    QuotationControllerRecord;
} | {
  success:
    false;

  response:
    QuotationControllerResponse<
      never
    >;
} {
  if (
    !isQuotationControllerBodyObject(
      request.body
    )
  ) {
    return {
      success:
        false,

      response:
        createQuotationControllerBadRequest(
          "INVALID_REQUEST_BODY",
          "Request body must be a JSON object.",
          request.requestId
        ),
    };
  }

  return {
    success:
      true,

    value:
      request.body,
  };
}

/* ============================================================================
 * Actor resolution
 * ============================================================================
 */

/**
 * Resolves an authenticated actor from:
 *
 * 1. authenticatedUserId
 * 2. explicit body/query actor when later controller operation permits it
 *
 * Part A only exposes the authenticated-user value.
 */
export function getQuotationControllerAuthenticatedUserId(
  request:
    QuotationControllerRequest
): string | undefined {
  return normalizeQuotationControllerOptionalString(
    request.authenticatedUserId
  );
}

/* ============================================================================
 * Mutation metadata
 * ============================================================================
 */

export interface QuotationControllerMutationMetadata {
  performedBy?:
    string;

  requestId?:
    string;

  source:
    string;

  ipAddress?:
    string;

  userAgent?:
    string;
}

/**
 * Creates framework-neutral mutation metadata.
 *
 * The service/repository may use this later for audit/event logging.
 */
export function createQuotationControllerMutationMetadata(
  request:
    QuotationControllerRequest
): QuotationControllerMutationMetadata {
  const performedBy =
    getQuotationControllerAuthenticatedUserId(
      request
    );

  const requestId =
    normalizeQuotationControllerOptionalString(
      request.requestId
    );

  const ipAddress =
    normalizeQuotationControllerOptionalString(
      request.ipAddress
    );

  const userAgent =
    normalizeQuotationControllerOptionalString(
      request.userAgent
    );

  return {
    ...(performedBy
      ? {
          performedBy,
        }
      : {}),

    ...(requestId
      ? {
          requestId,
        }
      : {}),

    source:
      "QUOTATION_CONTROLLER",

    ...(ipAddress
      ? {
          ipAddress,
        }
      : {}),

    ...(userAgent
      ? {
          userAgent,
        }
      : {}),
  };
}

/* ============================================================================
 * Controller unexpected-error handler
 * ============================================================================
 */

/**
 * Handles errors that escaped the service Result contract.
 *
 * Business/service errors should normally already have been converted
 * into QuotationServiceFailure.
 */
export function handleQuotationControllerUnexpectedError(
  error:
    unknown,
  requestId?:
    string
): QuotationControllerResponse<
  never
> {
  if (
    error instanceof
      Error
  ) {
    return createQuotationControllerInternalError(
      "QUOTATION_CONTROLLER_ERROR",
      error.message,
      requestId
    );
  }

  return createQuotationControllerInternalError(
    "QUOTATION_CONTROLLER_ERROR",
    "An unexpected Quotation controller error occurred.",
    requestId
  );
}

/* ============================================================================
 * Controller dependency guard
 * ============================================================================
 */

export function requireQuotationControllerDependencies(
  dependencies:
    QuotationControllerDependencies
): QuotationControllerDependencies {
  if (
    !dependencies ||
    !dependencies.quotationService
  ) {
    throw new Error(
      "QuotationController requires QuotationService."
    );
  }

  return dependencies;
}

/* ============================================================================
 * Controller context
 * ============================================================================
 */

export class QuotationControllerContext {
  readonly quotationService:
    QuotationService;

  constructor(
    dependencies:
      QuotationControllerDependencies
  ) {
    const resolved =
      requireQuotationControllerDependencies(
        dependencies
      );

    this.quotationService =
      resolved.quotationService;
  }
}

/* ============================================================================
 * Part A facade
 * ============================================================================
 */

export const QuotationControllerPartA = {
  /* Response */

  success:
    createQuotationControllerSuccess,

  ok:
    createQuotationControllerOk,

  created:
    createQuotationControllerCreated,

  failure:
    createQuotationControllerFailure,

  badRequest:
    createQuotationControllerBadRequest,

  notFound:
    createQuotationControllerNotFound,

  conflict:
    createQuotationControllerConflict,

  unprocessable:
    createQuotationControllerUnprocessable,

  internalError:
    createQuotationControllerInternalError,

  unavailable:
    createQuotationControllerUnavailable,

  /* Service result */

  serviceResult:
    mapQuotationServiceResultToControllerResponse,

  createServiceResult:
    mapQuotationCreateServiceResultToControllerResponse,

  paginatedServiceResult:
    mapQuotationPaginatedServiceResultToControllerResponse,

  serviceFailure:
    mapQuotationServiceFailureToControllerResponse,

  serviceErrorStatus:
    mapQuotationServiceErrorCodeToHttpStatus,

  /* Normalize */

  string:
    normalizeQuotationControllerString,

  optionalString:
    normalizeQuotationControllerOptionalString,

  boolean:
    normalizeQuotationControllerBoolean,

  number:
    normalizeQuotationControllerNumber,

  integer:
    normalizeQuotationControllerInteger,

  positiveInteger:
    normalizeQuotationControllerPositiveInteger,

  stringArray:
    normalizeQuotationControllerStringArray,

  dateString:
    normalizeQuotationControllerDateString,

  /* Request */

  getParam:
    getQuotationControllerParam,

  requireParam:
    requireQuotationControllerParam,

  requireBody:
    requireQuotationControllerBody,

  authenticatedUserId:
    getQuotationControllerAuthenticatedUserId,

  mutationMetadata:
    createQuotationControllerMutationMetadata,

  unexpectedError:
    handleQuotationControllerUnexpectedError,

  /* Dependencies */

  requireDependencies:
    requireQuotationControllerDependencies,
} as const;

/* ============================================================================
 * End of Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Controller
 * Part B
 * ============================================================================
 *
 * Core controller operations:
 *
 * - Create Quotation
 * - Get Quotation by ID
 * - Get Quotation by quotation number
 * - Get Quotation by reference ID
 * - Get customer-safe Quotation by ID
 *
 * IMPORTANT:
 *
 * Controller responsibilities:
 *
 * Request
 *    ↓
 * Normalize
 *    ↓
 * Service
 *    ↓
 * Controller response
 *
 * Business validation remains in quotation.service.ts /
 * quotation.validator.ts.
 * ============================================================================
 */

/* ============================================================================
 * Create quotation body
 * ============================================================================
 */

/**
 * Public/controller body for creating one quotation.
 *
 * The controller accepts the domain CreateQuotationInput directly.
 *
 * Service-level wrapper fields such as mutation context are generated
 * by the controller rather than supplied by API clients.
 */
export type CreateQuotationControllerBody =
  CreateQuotationInput;

/* ============================================================================
 * Create quotation handler
 * ============================================================================
 */

/**
 * Handles creation of a new quotation.
 *
 * Expected route:
 *
 * POST /api/quotations
 */
export async function handleCreateQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      CreateQuotationControllerBody
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    /* ----------------------------------------------------------------------
     * 1. Require JSON-object body
     * ----------------------------------------------------------------------
     */

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult
        .response;
    }

    /**
     * Domain validator in the service performs the actual payload
     * validation.
     *
     * Controller only guarantees that body is a JSON object.
     */
    const quotation =
      bodyResult.value as unknown as
        CreateQuotationInput;

    /* ----------------------------------------------------------------------
     * 2. Create service mutation context
     * ----------------------------------------------------------------------
     */

    const mutationMetadata =
      createQuotationControllerMutationMetadata(
        request
      );

    const serviceInput:
      CreateQuotationServiceInput = {
      quotation,

      context: {
        audit: {
          ...(mutationMetadata.performedBy
            ? {
                performedBy:
                  mutationMetadata
                    .performedBy,
              }
            : {}),

          ...(mutationMetadata.requestId
            ? {
                requestId:
                  mutationMetadata
                    .requestId,
              }
            : {}),

          source:
            mutationMetadata
              .source,

          ...(mutationMetadata.ipAddress
            ? {
                ipAddress:
                  mutationMetadata
                    .ipAddress,
              }
            : {}),

          ...(mutationMetadata.userAgent
            ? {
                userAgent:
                  mutationMetadata
                    .userAgent,
              }
            : {}),
        },
      },
    };

    /* ----------------------------------------------------------------------
     * 3. Delegate creation workflow to service
     * ----------------------------------------------------------------------
     */

    const result =
      await quotationService
        .create(
          serviceInput
        );

    /* ----------------------------------------------------------------------
     * 4. Successful creation -> HTTP 201
     * ----------------------------------------------------------------------
     */

    return mapQuotationCreateServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get quotation by ID
 * ============================================================================
 */

/**
 * Expected route:
 *
 * GET /api/quotations/:quotationId
 */
export async function getQuotationByIdController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const quotationId =
      parameter.value as
        QuotationId;

    const result =
      await quotationService
        .getById(
          quotationId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get customer-safe quotation by ID
 * ============================================================================
 */

/**
 * Customer-facing read.
 *
 * Vendor identity is removed by the service before the controller
 * receives the quotation.
 *
 * Expected route example:
 *
 * GET /api/quotations/:quotationId/customer
 */
export async function getCustomerSafeQuotationByIdController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    CustomerSafeQuotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const quotationId =
      parameter.value as
        QuotationId;

    const result =
      await quotationService
        .getCustomerSafeById(
          quotationId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get quotation by quotation number
 * ============================================================================
 */

/**
 * Expected route example:
 *
 * GET /api/quotations/number/:quotationNumber
 */
export async function getQuotationByNumberController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationNumberRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationNumber"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const quotationNumber =
      parameter.value as
        QuotationNumber;

    const result =
      await quotationService
        .getByQuotationNumber(
          quotationNumber
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get quotation by reference ID
 * ============================================================================
 */

/**
 * Expected route example:
 *
 * GET /api/quotations/reference/:referenceId
 */
export async function getQuotationByReferenceIdController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationReferenceRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "referenceId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const referenceId =
      parameter.value as
        QuotationReferenceId;

    const result =
      await quotationService
        .getByReferenceId(
          referenceId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Generic lookup type
 * ============================================================================
 */

export type QuotationControllerLookupType =
  | "id"
  | "quotationNumber"
  | "referenceId";

/* ============================================================================
 * Generic quotation lookup controller
 * ============================================================================
 */

/**
 * Internal convenience controller.
 */
export async function lookupQuotationController(
  dependencies:
    QuotationControllerDependencies,
  input: {
    type:
      QuotationControllerLookupType;

    value:
      unknown;

    requestId?:
      string;
  }
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  const value =
    normalizeQuotationControllerOptionalString(
      input.value
    );

  if (
    !value
  ) {
    return createQuotationControllerBadRequest(
      "INVALID_LOOKUP_VALUE",
      "Quotation lookup value is required.",
      input.requestId
    );
  }

  try {
    if (
      input.type ===
      "id"
    ) {
      const result =
        await quotationService
          .getById(
            value as
              QuotationId
          );

      return mapQuotationServiceResultToControllerResponse(
        result,
        input.requestId
      );
    }

    if (
      input.type ===
      "quotationNumber"
    ) {
      const result =
        await quotationService
          .getByQuotationNumber(
            value as
              QuotationNumber
          );

      return mapQuotationServiceResultToControllerResponse(
        result,
        input.requestId
      );
    }

    if (
      input.type ===
      "referenceId"
    ) {
      const result =
        await quotationService
          .getByReferenceId(
            value as
              QuotationReferenceId
          );

      return mapQuotationServiceResultToControllerResponse(
        result,
        input.requestId
      );
    }

    return createQuotationControllerBadRequest(
      "INVALID_LOOKUP_TYPE",
      "Unsupported Quotation lookup type.",
      input.requestId,
      {
        type:
          input.type,
      }
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      input.requestId
    );
  }
}

/* ============================================================================
 * Controller class
 * ============================================================================
 */

/**
 * Framework-independent Quotation controller.
 */
export class QuotationController
  extends QuotationControllerContext {
  constructor(
    dependencies:
      QuotationControllerDependencies
  ) {
    super(
      dependencies
    );
  }

  /* ==========================================================================
   * Part B - Create
   * ==========================================================================
   */

  create(
    request:
      QuotationControllerRequest<
        CreateQuotationControllerBody
      >
  ): Promise<
    QuotationControllerResponse<
      Quotation
    >
  > {
    return handleCreateQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part B - Single quotation reads
   * ==========================================================================
   */

  getById(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationIdRouteParams
      >
  ): Promise<
    QuotationControllerResponse<
      Quotation
    >
  > {
    return getQuotationByIdController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getByQuotationNumber(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationNumberRouteParams
      >
  ): Promise<
    QuotationControllerResponse<
      Quotation
    >
  > {
    return getQuotationByNumberController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getByReferenceId(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationReferenceRouteParams
      >
  ): Promise<
    QuotationControllerResponse<
      Quotation
    >
  > {
    return getQuotationByReferenceIdController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getCustomerSafeById(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationIdRouteParams
      >
  ): Promise<
    QuotationControllerResponse<
      CustomerSafeQuotation
    >
  > {
    return getCustomerSafeQuotationByIdController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part C - List/search
   * ==========================================================================
   */

  list(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord,
        QuotationListQueryParams
      >
  ) {
    return listQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  listCustomerSafe(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord,
        QuotationListQueryParams
      >
  ) {
    return listCustomerSafeQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part C - Booking quotation reads
   * ==========================================================================
   */

  getByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        BookingQuotationQueryParams
      >
  ) {
    return getBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getCustomerSafeByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        BookingQuotationQueryParams
      >
  ) {
    return getCustomerSafeBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getActiveByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getActiveBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getSelectedByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getSelectedBookingQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getCustomerSafeSelectedByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getCustomerSafeSelectedBookingQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getComparison(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getBookingQuotationComparisonController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part D - Update/status
   * ==========================================================================
   */

  update(
    request:
      QuotationControllerRequest<
        UpdateQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return updateQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  updateStatus(
    request:
      QuotationControllerRequest<
        UpdateQuotationStatusControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return updateQuotationStatusController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  withdraw(
    request:
      QuotationControllerRequest<
        WithdrawQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return withdrawQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  reject(
    request:
      QuotationControllerRequest<
        RejectQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return rejectQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part D - Selection
   * ==========================================================================
   */

  select(
    request:
      QuotationControllerRequest<
        SelectQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return selectQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  selectCustomerSafe(
    request:
      QuotationControllerRequest<
        SelectQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return selectCustomerSafeQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  unselect(
    request:
      QuotationControllerRequest<
        UnselectQuotationControllerBody,
        QuotationBookingRouteParams
      >
  ) {
    return unselectQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part D - Acceptance
   * ==========================================================================
   */

  accept(
    request:
      QuotationControllerRequest<
        AcceptQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return acceptQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

    acceptCustomerSafe(
    request:
      QuotationControllerRequest<
        AcceptQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return acceptCustomerSafeQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  /* ==========================================================================
   * Part E - Booking quotation summary
   * ==========================================================================
   */

  async getBookingSummary(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        QuotationControllerRecord
      >
  ): Promise<
    QuotationControllerResponse<
      unknown
    >
  > {
    try {
      const bookingId =
        normalizeQuotationControllerString(
          request.params
            ?.bookingId
        );

      if (
        !bookingId
      ) {
        return createQuotationControllerBadRequest(
          "INVALID_SERVICE_INPUT",
          "bookingId is required.",
          request.requestId,
          {
            field:
              "bookingId",
          }
        );
      }

      const statuses =
        normalizeQuotationControllerStringArray(
          request.query
            ?.statuses
        ) ?? [];

      const result =
        await this
          .quotationService
          .getBookingSummary({
            bookingId,

            ...(statuses.length >
              0
              ? {
                  statuses:
                    statuses as
                      Parameters<
                        QuotationService[
                          "getBookingSummary"
                        ]
                      >[0]["statuses"],
                }
              : {}),
          });

      return mapQuotationServiceResultToControllerResponse(
        result,
        request.requestId
      );
    } catch (
      error
    ) {
      return handleQuotationControllerUnexpectedError(
        error,
        request.requestId
      );
    }
  }
  async getStatistics(
    request:
      QuotationControllerRequest<
        GetQuotationStatisticsServiceInput
      >
  ) {
    try {
      const result =
        await this
          .quotationService
          .getStatistics(
            request.body ??
              {}
          );

      return mapQuotationServiceResultToControllerResponse(
        result,
        request.requestId
      );
    } catch (
      error
    ) {
      return handleQuotationControllerUnexpectedError(
        error,
        request.requestId
      );
    }
}
  /* ==========================================================================
   * Part E - Expiration
   * ==========================================================================
   */

  async expireDue(
    request:
      QuotationControllerRequest<
        ExpireDueQuotationsServiceInput
      >
  ) {
    try {
      const input =
        request.body;

      if (
        !input ||
        typeof input !==
          "object"
      ) {
        return createQuotationControllerBadRequest(
          "INVALID_SERVICE_INPUT",
          "Quotation expiry input is required.",
          request.requestId
        );
      }

      const result =
        await this
          .quotationService
          .expireDue(
            input
          );

      return mapQuotationServiceResultToControllerResponse(
        result,
        request.requestId
      );
    } catch (
      error
    ) {
      return handleQuotationControllerUnexpectedError(
        error,
        request.requestId
      );
    }
  }

  /* ==========================================================================
   * Part E - Repository health
   * ==========================================================================
   */

  async getRepositoryHealth(
    request:
      QuotationControllerRequest
  ) {
    try {
      const result =
        await this
          .quotationService
          .getRepositoryHealth();

      return mapQuotationServiceResultToControllerResponse(
        result,
        request.requestId
      );
    } catch (
      error
    ) {
      return handleQuotationControllerUnexpectedError(
        error,
        request.requestId
      );
    }
  }

  /* ==========================================================================
   * Part E - Diagnostics
   * ==========================================================================
   */

  async getDiagnostics(
    request:
      QuotationControllerRequest
  ) {
    try {
      const diagnostics =
        await this
          .quotationService
          .getDiagnostics();

      return {
        status:
          diagnostics
            .repositoryHealthy
            ? 200
            : 503,

        body: {
          success:
            true,

          data:
            diagnostics,

          meta: {
            ...(request.requestId
              ? {
                  requestId:
                    request.requestId,
                }
              : {}),

            timestamp:
              new Date()
                .toISOString(),
          },
        },

        ...(request.requestId
          ? {
              headers: {
                "x-request-id":
                  request.requestId,
              },
            }
          : {}),
      };
    } catch (
      error
    ) {
      return handleQuotationControllerUnexpectedError(
        error,
        request.requestId
      );
    }
  }
}


/* ============================================================================
 * Controller factory
 * ============================================================================
 */

/**
 * Creates the complete QuotationController instance.
 */
export function createQuotationController(
  dependencies:
    QuotationControllerDependencies
): QuotationController {
  return new QuotationController(
    dependencies
  );
}

/* ============================================================================
 * Part B facade
 * ============================================================================
 */

export const QuotationControllerPartB = {
  /* Operation */

  create:
    handleCreateQuotationController,

  /* Reads */

  getById:
    getQuotationByIdController,

  getCustomerSafeById:
    getCustomerSafeQuotationByIdController,

  getByQuotationNumber:
    getQuotationByNumberController,

  getByReferenceId:
    getQuotationByReferenceIdController,

  lookup:
    lookupQuotationController,

  /* Factory */

  createController:
    createQuotationController,
} as const;

/* ============================================================================
 * End of Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Controller
 * Part C
 * ============================================================================
 *
 * Read/list responsibilities:
 *
 * - List/search quotations
 * - Customer-safe list/search
 * - Booking quotation listing
 * - Customer-safe Booking quotations
 * - Active Booking quotations
 * - Selected Booking quotation
 * - Customer-safe selected quotation
 * - Booking quotation comparison
 *
 * IMPORTANT:
 *
 * - Controller normalizes request/query data
 * - Service performs validation/business rules
 * - Customer-safe methods rely on service-side masking
 * ============================================================================
 */

/* ============================================================================
 * List query parameters
 * ============================================================================
 */

export interface QuotationListQueryParams
  extends QuotationControllerRecord {
  quotationId?:
    unknown;

  quotationNumber?:
    unknown;

  referenceId?:
    unknown;

  leadId?:
    unknown;

  bookingId?:
    unknown;

  vendorId?:
    unknown;

  userId?:
    unknown;

  status?:
    unknown;

  statuses?:
    unknown;

  selectedForBooking?:
    unknown;

  minimumAmount?:
    unknown;

  maximumAmount?:
    unknown;

  validFrom?:
    unknown;

  validUntil?:
    unknown;

  pickupDateFrom?:
    unknown;

  pickupDateTo?:
    unknown;

  createdFrom?:
    unknown;

  createdUntil?:
    unknown;

  search?:
    unknown;

  page?:
    unknown;

  pageSize?:
    unknown;

  sortField?:
    unknown;

  sortDirection?:
    unknown;
}

/* ============================================================================
 * Booking quotation query parameters
 * ============================================================================
 */

export interface BookingQuotationQueryParams
  extends QuotationControllerRecord {
  statuses?:
    unknown;

  includeExpired?:
    unknown;

  sortField?:
    unknown;

  sortDirection?:
    unknown;
}
/* ============================================================================
 * Quotation search mapping error
 * ============================================================================
 */

export interface QuotationSearchMappingErrorItem {
  field:
    string;

  code:
    string;

  message:
    string;

  value?:
    unknown;
}

export class QuotationSearchMappingError
  extends Error {
  readonly mappingErrors:
    QuotationSearchMappingErrorItem[];

  constructor(
    mappingErrors:
      QuotationSearchMappingErrorItem[]
  ) {
    super(
      "Quotation search request mapping failed."
    );

    this.name =
      "QuotationSearchMappingError";

    this.mappingErrors =
      mappingErrors;
  }
}
/* ============================================================================
 * Status normalization
 * ============================================================================
 */

export function normalizeQuotationControllerStatus(
  value:
    unknown
): QuotationStatus | undefined {
  const normalized =
    normalizeQuotationControllerOptionalString(
      value
    )?.toUpperCase();

  if (
    !normalized
  ) {
    return undefined;
  }

  const values =
    Object.values(
      QuotationStatus
    ) as string[];

  return values.includes(
    normalized
  )
    ? normalized as QuotationStatus
    : undefined;
}

export function normalizeQuotationControllerStatuses(
  value:
    unknown
): QuotationStatus[] | undefined {
  const values =
    normalizeQuotationControllerStringArray(
      value
    );

  if (
    !values
  ) {
    return undefined;
  }

  const statuses:
    QuotationStatus[] = [];

  const mappingErrors:
    QuotationSearchMappingErrorItem[] =
      [];

  for (
    const item of values
  ) {
    const normalized =
      normalizeQuotationControllerStatus(
        item
      );

    if (
      !normalized
    ) {
      mappingErrors.push({
        field:
          "statuses",

        code:
          "INVALID_ENUM_VALUE",

        message:
          "statuses contains an unsupported value.",

        value:
          item,
      });

      continue;
    }

    statuses.push(
      normalized
    );
  }

  if (
    mappingErrors.length >
    0
  ) {
    throw new QuotationSearchMappingError(
      mappingErrors
    );
  }

  return statuses.length >
    0
    ? statuses
    : undefined;
}

/* ============================================================================
 * Sort normalization
 * ============================================================================
 */

export function createQuotationControllerSort(
  query:
    QuotationControllerRecord
): QuotationSort | undefined {
  const rawField =
    normalizeQuotationControllerOptionalString(
      query.sortField
    );

  const rawDirection =
    normalizeQuotationControllerOptionalString(
      query.sortDirection
    );

  /*
   * No sort requested.
   */
  if (
    !rawField &&
    !rawDirection
  ) {
    return undefined;
  }

  /*
   * One part supplied without the other.
   */
  if (
    rawField &&
    !rawDirection
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "sortDirection",

        code:
          "REQUIRED_WITH_SORT_FIELD",

        message:
          "sortDirection is required when sortField is supplied.",
      },
    ]);
  }

  if (
    !rawField &&
    rawDirection
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "sortField",

        code:
          "REQUIRED_WITH_SORT_DIRECTION",

        message:
          "sortField is required when sortDirection is supplied.",
      },
    ]);
  }

  const field =
    rawField as string;

  const direction =
    (
      rawDirection as string
    ).toLowerCase();

  const validFields = [
    "createdAt",
    "updatedAt",
    "totalAmount",
    "validUntil",
    "pickupDate",
    "deliveryDate",
  ];

  if (
    !validFields.includes(
      field
    )
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "sortField",

        code:
          "INVALID_SORT_FIELD",

        message:
          "sortField contains an unsupported value.",

        value:
          field,
      },
    ]);
  }

  if (
    direction !==
      "asc" &&
    direction !==
      "desc"
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "sortDirection",

        code:
          "INVALID_SORT_DIRECTION",

        message:
          "sortDirection must be either asc or desc.",

        value:
          rawDirection,
      },
    ]);
  }

  return {
    field:
      field as QuotationSort[
        "field"
      ],

    direction:
      direction as QuotationSort[
        "direction"
      ],
  };
}

/* ============================================================================
 * Create QuotationListQuery
 * ============================================================================
 */

export function createQuotationListControllerQuery(
  query?:
    QuotationListQueryParams
): QuotationListQuery {
  const safeQuery =
    query ?? {};

  /* ==========================================================================
   * Status normalization / validation
   * ==========================================================================
   */

  const rawStatus =
    normalizeQuotationControllerOptionalString(
      safeQuery.status
    );

  const normalizedStatus =
    rawStatus
      ? normalizeQuotationControllerStatus(
          rawStatus
        )
      : undefined;

  if (
    rawStatus &&
    !normalizedStatus
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "status",

        code:
          "INVALID_ENUM_VALUE",

        message:
          "status contains an unsupported value.",

        value:
          rawStatus,
      },
    ]);
  }

  const normalizedStatuses =
    normalizeQuotationControllerStatuses(
      safeQuery.statuses
    );

  /* ==========================================================================
   * selectedForBooking normalization / validation
   * ==========================================================================
   */

  const rawSelectedForBooking =
    normalizeQuotationControllerOptionalString(
      safeQuery.selectedForBooking
    );

  const normalizedSelectedForBooking =
    normalizeQuotationControllerBoolean(
      safeQuery.selectedForBooking
    );

  if (
    rawSelectedForBooking &&
    normalizedSelectedForBooking ===
      undefined
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "selectedForBooking",

        code:
          "INVALID_BOOLEAN_VALUE",

        message:
          "selectedForBooking must be either true or false.",

        value:
          rawSelectedForBooking,
      },
    ]);
  }
  /* ==========================================================================
   * Amount normalization / validation
   * ==========================================================================
   */

  const rawMinimumAmount =
    normalizeQuotationControllerOptionalString(
      safeQuery.minimumAmount
    );

  const normalizedMinimumAmount =
    normalizeQuotationControllerNumber(
      safeQuery.minimumAmount
    );

  if (
    rawMinimumAmount &&
    normalizedMinimumAmount ===
      undefined
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "minimumAmount",

        code:
          "INVALID_NUMBER_VALUE",

        message:
          "minimumAmount must contain a valid numeric value.",

        value:
          rawMinimumAmount,
      },
    ]);
  }

  const rawMaximumAmount =
    normalizeQuotationControllerOptionalString(
      safeQuery.maximumAmount
    );

  const normalizedMaximumAmount =
    normalizeQuotationControllerNumber(
      safeQuery.maximumAmount
    );

  if (
    rawMaximumAmount &&
    normalizedMaximumAmount ===
      undefined
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "maximumAmount",

        code:
          "INVALID_NUMBER_VALUE",

        message:
          "maximumAmount must contain a valid numeric value.",

        value:
          rawMaximumAmount,
      },
    ]);
  }
  /* ==========================================================================
   * Criteria
   * ==========================================================================
   */

    const criteria:
    NonNullable<
      QuotationListQuery[
        "criteria"
      ]
    > = {
    ...(normalizeQuotationControllerOptionalString(
      safeQuery.quotationId
    )
      ? {
          quotationId:
            normalizeQuotationControllerOptionalString(
              safeQuery.quotationId
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.quotationNumber
    )
      ? {
          quotationNumber:
            normalizeQuotationControllerOptionalString(
              safeQuery.quotationNumber
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.referenceId
    )
      ? {
          referenceId:
            normalizeQuotationControllerOptionalString(
              safeQuery.referenceId
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.leadId
    )
      ? {
          leadId:
            normalizeQuotationControllerOptionalString(
              safeQuery.leadId
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.bookingId
    )
      ? {
          bookingId:
            normalizeQuotationControllerOptionalString(
              safeQuery.bookingId
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.vendorId
    )
      ? {
          vendorId:
            normalizeQuotationControllerOptionalString(
              safeQuery.vendorId
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.userId
    )
      ? {
          userId:
            normalizeQuotationControllerOptionalString(
              safeQuery.userId
            ),
        }
      : {}),

    ...(normalizedStatus
      ? {
          status:
            normalizedStatus,
        }
      : {}),

    ...(normalizedStatuses
      ? {
          statuses:
            normalizedStatuses,
        }
      : {}),

    ...(normalizedSelectedForBooking !==
    undefined
      ? {
          selectedForBooking:
            normalizedSelectedForBooking,
        }
      : {}),

    ...(normalizedMinimumAmount !==
    undefined
      ? {
          minimumAmount:
            normalizedMinimumAmount,
        }
      : {}),

    ...(normalizedMaximumAmount !==
    undefined
      ? {
          maximumAmount:
            normalizedMaximumAmount,
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.validFrom
    )
      ? {
          validFrom:
            normalizeQuotationControllerDateString(
              safeQuery.validFrom
            ),
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.validUntil
    )
      ? {
          validUntil:
            normalizeQuotationControllerDateString(
              safeQuery.validUntil
            ),
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.pickupDateFrom
    )
      ? {
          pickupDateFrom:
            normalizeQuotationControllerDateString(
              safeQuery.pickupDateFrom
            ),
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.pickupDateTo
    )
      ? {
          pickupDateTo:
            normalizeQuotationControllerDateString(
              safeQuery.pickupDateTo
            ),
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.createdFrom
    )
      ? {
          createdFrom:
            normalizeQuotationControllerDateString(
              safeQuery.createdFrom
            ),
        }
      : {}),

    ...(normalizeQuotationControllerDateString(
      safeQuery.createdUntil
    )
      ? {
          createdUntil:
            normalizeQuotationControllerDateString(
              safeQuery.createdUntil
            ),
        }
      : {}),

    ...(normalizeQuotationControllerOptionalString(
      safeQuery.search
    )
      ? {
          search:
            normalizeQuotationControllerOptionalString(
              safeQuery.search
            ),
        }
      : {}),
  };
  /* ==========================================================================
   * Pagination
   * ==========================================================================
   */
  const rawPage =
    normalizeQuotationControllerOptionalString(
      safeQuery.page
    );

  const page =
    normalizeQuotationControllerPositiveInteger(
      safeQuery.page
    );

  if (
    rawPage &&
    page === undefined
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "page",

        code:
          "INVALID_INTEGER_VALUE",

        message:
          "page must contain a valid positive integer.",

        value:
          rawPage,
      },
    ]);
  }

  const rawPageSize =
    normalizeQuotationControllerOptionalString(
      safeQuery.pageSize
    );

  const pageSize =
    normalizeQuotationControllerPositiveInteger(
      safeQuery.pageSize
    );

  if (
    rawPageSize &&
    pageSize === undefined
  ) {
    throw new QuotationSearchMappingError([
      {
        field:
          "pageSize",

        code:
          "INVALID_INTEGER_VALUE",

        message:
          "pageSize must contain a valid positive integer.",

        value:
          rawPageSize,
      },
    ]);
  }
  const pagination =
    page !== undefined ||
    pageSize !== undefined
      ? {
          page:
            page ?? 1,

          pageSize:
            pageSize ?? 20,
        }
      : undefined;

  /* ==========================================================================
   * Sort
   * ==========================================================================
   */

  const sort =
    createQuotationControllerSort(
      safeQuery
    );

  /* ==========================================================================
   * Final query
   * ==========================================================================
   */

  return {
    ...(Object.keys(
      criteria
    ).length >
    0
      ? {
          criteria,
        }
      : {}),

    ...(pagination
      ? {
          pagination,
        }
      : {}),

    ...(sort
      ? {
          sort,
        }
      : {}),
  };
}
/* ============================================================================
 * List quotations
 * ============================================================================
 */

/**
 * Internal/admin quotation list.
 *
 * Expected route:
 *
 * GET /api/quotations
 */
export async function listQuotationsController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationControllerRecord,
      QuotationListQueryParams
    >
): Promise<
  QuotationControllerResponse<
    PaginatedQuotationResult<
      QuotationListItem
    >
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const query =
      createQuotationListControllerQuery(
        request.query
      );

    const result =
      await quotationService
        .list({
          query,
        });

    return mapQuotationPaginatedServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
  error
) {
  if (
    error instanceof
    QuotationSearchMappingError
  ) {
    return createQuotationControllerBadRequest(
      "QUOTATION_REQUEST_MAPPING_FAILED",
      error.message,
      request.requestId,
      {
        mappingErrors:
          error.mappingErrors,
      }
    );
  }

  return handleQuotationControllerUnexpectedError(
    error,
    request.requestId
  );
}
}
/* ============================================================================
 * Customer-safe list quotations
 * ============================================================================
 */

export async function listCustomerSafeQuotationsController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationControllerRecord,
      QuotationListQueryParams
    >
): Promise<
  QuotationControllerResponse<
    PaginatedQuotationResult<
      QuotationListItem
    >
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const query =
      createQuotationListControllerQuery(
        request.query
      );

    const result =
      await quotationService
        .listCustomerSafe({
          query,
        });

        return mapQuotationPaginatedServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
      QuotationSearchMappingError
    ) {
      return createQuotationControllerBadRequest(
        "QUOTATION_REQUEST_MAPPING_FAILED",
        error.message,
        request.requestId,
        {
          mappingErrors:
            error.mappingErrors,
        }
      );
    }

    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Create Booking quotation input
 * ============================================================================
 */

export function createBookingQuotationControllerInput(
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams,
      BookingQuotationQueryParams
    >
) {
  const bookingId =
    getQuotationControllerParam(
      request,
      "bookingId"
    );

  if (
    !bookingId
  ) {
    return {
      success:
        false as const,

      response:
        createQuotationControllerBadRequest(
          "MISSING_ROUTE_PARAMETER",
          "bookingId is required.",
          request.requestId,
          {
            field:
              "bookingId",
          }
        ),
    };
  }

  return {
    success:
      true as const,

    input: {
      bookingId:
        bookingId as BookingId,

      ...(normalizeQuotationControllerStatuses(
        request.query
          ?.statuses
      )
        ? {
            statuses:
              normalizeQuotationControllerStatuses(
                request.query
                  ?.statuses
              ),
          }
        : {}),

      ...(normalizeQuotationControllerBoolean(
        request.query
          ?.includeExpired
      ) !==
      undefined
        ? {
            includeExpired:
              normalizeQuotationControllerBoolean(
                request.query
                  ?.includeExpired
              ),
          }
        : {}),

      ...(createQuotationControllerSort(
        request.query ??
          {}
      )
        ? {
            sort:
              createQuotationControllerSort(
                request.query ??
                  {}
              ),
          }
        : {}),
    },
  };
}
export async function getBookingQuotationsController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams,
      BookingQuotationQueryParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation[]
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const inputResult =
      createBookingQuotationControllerInput(
        request
      );

    if (
      !inputResult.success
    ) {
      return inputResult
        .response;
    }

    const result =
      await quotationService
        .getByBooking(
          inputResult.input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}
/* ============================================================================
 * Customer-safe Booking quotations
 * ============================================================================
 */

export async function getCustomerSafeBookingQuotationsController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams,
      BookingQuotationQueryParams
    >
): Promise<
  QuotationControllerResponse<
    CustomerSafeQuotation[]
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const inputResult =
      createBookingQuotationControllerInput(
        request
      );

    if (
      !inputResult.success
    ) {
      return inputResult
        .response;
    }

    const result =
      await quotationService
        .getCustomerSafeByBooking(
          inputResult.input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Active Booking quotations
 * ============================================================================
 */

export async function getActiveBookingQuotationsController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation[]
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "bookingId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const result =
      await quotationService
        .getActiveByBooking(
          parameter.value as
            BookingId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Selected Booking quotation
 * ============================================================================
 */

export async function getSelectedBookingQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation | null
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "bookingId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const result =
      await quotationService
        .getSelectedByBooking(
          parameter.value as
            BookingId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Customer-safe selected Booking quotation
 * ============================================================================
 */

export async function getCustomerSafeSelectedBookingQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams
    >
): Promise<
  QuotationControllerResponse<
    CustomerSafeQuotation | null
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "bookingId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const result =
      await quotationService
        .getCustomerSafeSelectedByBooking(
          parameter.value as
            BookingId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Booking quotation comparison
 * ============================================================================
 */

export async function getBookingQuotationComparisonController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      unknown,
      QuotationBookingRouteParams
    >
): Promise<
  QuotationControllerResponse<
    BookingQuotationComparison
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "bookingId"
      );

    if (
      !parameter.success
    ) {
      return parameter
        .response;
    }

    const result =
      await quotationService
        .getComparison(
          parameter.value as
            BookingId
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Part C controller class extension
 *
 * Copy these methods INSIDE the existing QuotationController class.
 * Do not create a second class.
 * ============================================================================
 */

/*

  list(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord,
        QuotationListQueryParams
      >
  ) {
    return listQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  listCustomerSafe(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord,
        QuotationListQueryParams
      >
  ) {
    return listCustomerSafeQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        BookingQuotationQueryParams
      >
  ) {
    return getBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getCustomerSafeByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        BookingQuotationQueryParams
      >
  ) {
    return getCustomerSafeBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getActiveByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getActiveBookingQuotationsController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getSelectedByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getSelectedBookingQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getCustomerSafeSelectedByBooking(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getCustomerSafeSelectedBookingQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  getComparison(
    request:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      >
  ) {
    return getBookingQuotationComparisonController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

*/

/* ============================================================================
 * Part C facade
 * ============================================================================
 */

export const QuotationControllerPartC = {
  list:
    listQuotationsController,

  listCustomerSafe:
    listCustomerSafeQuotationsController,

  getByBooking:
    getBookingQuotationsController,

  getCustomerSafeByBooking:
    getCustomerSafeBookingQuotationsController,

  getActiveByBooking:
    getActiveBookingQuotationsController,

  getSelectedByBooking:
    getSelectedBookingQuotationController,

  getCustomerSafeSelectedByBooking:
    getCustomerSafeSelectedBookingQuotationController,

  getComparison:
    getBookingQuotationComparisonController,

  createListQuery:
    createQuotationListControllerQuery,

  createBookingInput:
    createBookingQuotationControllerInput,

  normalizeStatus:
    normalizeQuotationControllerStatus,

  normalizeStatuses:
    normalizeQuotationControllerStatuses,

  createSort:
    createQuotationControllerSort,
} as const;

/* ============================================================================
 * End of Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Quotation Controller
 * Part D
 * ============================================================================
 *
 * Mutation/workflow responsibilities:
 *
 * - Update quotation
 * - Update quotation status
 * - Withdraw quotation
 * - Reject quotation
 * - Select quotation for Booking
 * - Unselect Booking quotation
 * - Accept selected quotation
 *
 * Controller remains framework-independent.
 * ============================================================================
 */

/* ============================================================================
 * Controller mutation body aliases
 * ============================================================================
 */

export type UpdateQuotationControllerBody =
  UpdateQuotationInput;

export type UpdateQuotationStatusControllerBody =
  Omit<
    UpdateQuotationStatusInput,
    "quotationId"
  >;

export type WithdrawQuotationControllerBody =
  Omit<
    WithdrawQuotationInput,
    "quotationId"
  >;

export type RejectQuotationControllerBody =
  Omit<
    RejectQuotationInput,
    "quotationId"
  >;

export type SelectQuotationControllerBody =
  Omit<
    SelectQuotationInput,
    "bookingId" |
    "quotationId"
  >;

export type UnselectQuotationControllerBody =
  Omit<
    UnselectQuotationInput,
    "bookingId"
  >;

export type AcceptQuotationControllerBody =
  Omit<
    AcceptQuotationServiceInput,
    "bookingId" |
    "quotationId"
  >;

/* ============================================================================
 * Update Quotation
 * ============================================================================
 */

/**
 * Expected route:
 *
 * PATCH /api/quotations/:quotationId
 */
export async function updateQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      UpdateQuotationControllerBody,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const changes =
      bodyResult.value as unknown as
        UpdateQuotationInput;

    const mutationMetadata =
      createQuotationControllerMutationMetadata(
        request
      );

    const input:
      UpdateQuotationServiceInput = {
      quotationId:
        parameter.value as
          QuotationId,

      changes,

      context: {
        audit: {
          ...(mutationMetadata.performedBy
            ? {
                performedBy:
                  mutationMetadata
                    .performedBy,
              }
            : {}),

          ...(mutationMetadata.requestId
            ? {
                requestId:
                  mutationMetadata
                    .requestId,
              }
            : {}),

          source:
            mutationMetadata.source,

          ...(mutationMetadata.ipAddress
            ? {
                ipAddress:
                  mutationMetadata
                    .ipAddress,
              }
            : {}),

          ...(mutationMetadata.userAgent
            ? {
                userAgent:
                  mutationMetadata
                    .userAgent,
              }
            : {}),
        },
      },
    };

    const result =
      await quotationService
        .update(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Update Quotation Status
 * ============================================================================
 */

/**
 * Expected route:
 *
 * PATCH /api/quotations/:quotationId/status
 */
export async function updateQuotationStatusController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      UpdateQuotationStatusControllerBody,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const body =
      bodyResult.value;

    const input =
      {
        ...body,

        quotationId:
          parameter.value,
      } as unknown as
        UpdateQuotationStatusInput;

    const result =
      await quotationService
        .updateStatus(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Withdraw Quotation
 * ============================================================================
 */

/**
 * Expected route:
 *
 * POST /api/quotations/:quotationId/withdraw
 */
export async function withdrawQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      WithdrawQuotationControllerBody,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input =
      {
        ...bodyResult.value,

        quotationId:
          parameter.value,
      } as unknown as
        WithdrawQuotationInput;

    const result =
      await quotationService
        .withdraw(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Reject Quotation
 * ============================================================================
 */

/**
 * Expected route:
 *
 * POST /api/quotations/:quotationId/reject
 */
export async function rejectQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      RejectQuotationControllerBody,
      QuotationIdRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const parameter =
      requireQuotationControllerParam(
        request,
        "quotationId"
      );

    if (
      !parameter.success
    ) {
      return parameter.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input =
      {
        ...bodyResult.value,

        quotationId:
          parameter.value,
      } as unknown as
        RejectQuotationInput;

    const result =
      await quotationService
        .reject(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Selection route validation
 * ============================================================================
 */

/**
 * Resolves Booking + Quotation route parameters.
 */
export function requireBookingQuotationControllerParams(
  request:
    QuotationControllerRequest<
      unknown,
      BookingQuotationRouteParams
    >
):
  | {
      success:
        true;

      bookingId:
        BookingId;

      quotationId:
        QuotationId;
    }
  | {
      success:
        false;

      response:
        QuotationControllerResponse<
          never
        >;
    } {
  const booking =
    requireQuotationControllerParam(
      request,
      "bookingId"
    );

  if (
    !booking.success
  ) {
    return booking;
  }

  const quotation =
    requireQuotationControllerParam(
      request,
      "quotationId"
    );

  if (
    !quotation.success
  ) {
    return quotation;
  }

  return {
    success:
      true,

    bookingId:
      booking.value as
        BookingId,

    quotationId:
      quotation.value as
        QuotationId,
  };
}

/* ============================================================================
 * Select Quotation
 * ============================================================================
 */

/**
 * Customer/Booking workflow.
 *
 * Expected route:
 *
 * POST /api/bookings/:bookingId/quotations/:quotationId/select
 */
export async function selectQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      SelectQuotationControllerBody,
      BookingQuotationRouteParams
    >
): Promise<
  QuotationControllerResponse<
    QuotationSelectionServiceData
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const params =
      requireBookingQuotationControllerParams(
        request
      );

    if (
      !params.success
    ) {
      return params.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input =
      {
        ...bodyResult.value,

        bookingId:
          params.bookingId,

        quotationId:
          params.quotationId,
      } as unknown as
        SelectQuotationInput;

    const result =
      await quotationService
        .select(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Customer-safe selection
 * ============================================================================
 */

export async function selectCustomerSafeQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      SelectQuotationControllerBody,
      BookingQuotationRouteParams
    >
) {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const params =
      requireBookingQuotationControllerParams(
        request
      );

    if (
      !params.success
    ) {
      return params.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input =
      {
        ...bodyResult.value,

        bookingId:
          params.bookingId,

        quotationId:
          params.quotationId,
      } as unknown as
        SelectQuotationInput;

    const result =
      await quotationService
        .selectCustomerSafe(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Unselect Quotation
 * ============================================================================
 */

/**
 * Expected route:
 *
 * POST /api/bookings/:bookingId/quotations/unselect
 */
export async function unselectQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      UnselectQuotationControllerBody,
      QuotationBookingRouteParams
    >
): Promise<
  QuotationControllerResponse<
    QuotationSelectionServiceData
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const booking =
      requireQuotationControllerParam(
        request,
        "bookingId"
      );

    if (
      !booking.success
    ) {
      return booking.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input =
      {
        ...bodyResult.value,

        bookingId:
          booking.value,
      } as unknown as
        UnselectQuotationInput;

    const result =
      await quotationService
        .unselect(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Accept selected Quotation
 * ============================================================================
 */

/**
 * Expected route:
 *
 * POST /api/bookings/:bookingId/quotations/:quotationId/accept
 */
export async function acceptQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      AcceptQuotationControllerBody,
      BookingQuotationRouteParams
    >
): Promise<
  QuotationControllerResponse<
    Quotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const params =
      requireBookingQuotationControllerParams(
        request
      );

    if (
      !params.success
    ) {
      return params.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input:
      AcceptQuotationServiceInput = {
      bookingId:
        params.bookingId,

      quotationId:
        params.quotationId,

      acceptedBy:
        normalizeQuotationControllerString(
          bodyResult.value
            .acceptedBy
        ),

      ...(normalizeQuotationControllerOptionalString(
        bodyResult.value.reason
      )
        ? {
            reason:
              normalizeQuotationControllerOptionalString(
                bodyResult.value
                  .reason
              ),
          }
        : {}),
    };

    const result =
      await quotationService
        .accept(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Customer-safe acceptance
 * ============================================================================
 */

export async function acceptCustomerSafeQuotationController(
  dependencies:
    QuotationControllerDependencies,
  request:
    QuotationControllerRequest<
      AcceptQuotationControllerBody,
      BookingQuotationRouteParams
    >
): Promise<
  QuotationControllerResponse<
    CustomerSafeQuotation
  >
> {
  const {
    quotationService,
  } =
    requireQuotationControllerDependencies(
      dependencies
    );

  try {
    const params =
      requireBookingQuotationControllerParams(
        request
      );

    if (
      !params.success
    ) {
      return params.response;
    }

    const bodyResult =
      requireQuotationControllerBody(
        request
      );

    if (
      !bodyResult.success
    ) {
      return bodyResult.response;
    }

    const input:
      AcceptQuotationServiceInput = {
      bookingId:
        params.bookingId,

      quotationId:
        params.quotationId,

      acceptedBy:
        normalizeQuotationControllerString(
          bodyResult.value
            .acceptedBy
        ),

      ...(normalizeQuotationControllerOptionalString(
        bodyResult.value.reason
      )
        ? {
            reason:
              normalizeQuotationControllerOptionalString(
                bodyResult.value
                  .reason
              ),
          }
        : {}),
    };

    const result =
      await quotationService
        .acceptCustomerSafe(
          input
        );

    return mapQuotationServiceResultToControllerResponse(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handleQuotationControllerUnexpectedError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Part D controller class extension
 *
 * Copy these methods INSIDE the existing QuotationController class,
 * immediately before its final closing brace.
 *
 * Do NOT create another QuotationController class.
 * ============================================================================
 */

/*

  update(
    request:
      QuotationControllerRequest<
        UpdateQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return updateQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  updateStatus(
    request:
      QuotationControllerRequest<
        UpdateQuotationStatusControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return updateQuotationStatusController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  withdraw(
    request:
      QuotationControllerRequest<
        WithdrawQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return withdrawQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  reject(
    request:
      QuotationControllerRequest<
        RejectQuotationControllerBody,
        QuotationIdRouteParams
      >
  ) {
    return rejectQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  select(
    request:
      QuotationControllerRequest<
        SelectQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return selectQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }

  selectCustomerSafe(
    request:
      QuotationControllerRequest<
        SelectQuotationControllerBody,
        BookingQuotationRouteParams
      >
  ) {
    return selectCustomerSafeQuotationController(
      {
        quotationService:
          this.quotationService,
      },
      request
    );
  }
    }
==========================================================================
 * Part D facade
 * ============================================================================
 */
export const QuotationControllerPartD = {
  /* Commercial mutation */

  update:
    updateQuotationController,

  updateStatus:
    updateQuotationStatusController,

  withdraw:
    withdrawQuotationController,

  reject:
    rejectQuotationController,

  /* Selection */

  select:
    selectQuotationController,

  selectCustomerSafe:
    selectCustomerSafeQuotationController,

  unselect:
    unselectQuotationController,

  /* Acceptance */

  accept:
    acceptQuotationController,

  acceptCustomerSafe:
    acceptCustomerSafeQuotationController,

  /* Helpers */

  requireBookingQuotationParams:
    requireBookingQuotationControllerParams,
} as const;

/* ============================================================================
 * End of Part D
 * ============================================================================
 */
