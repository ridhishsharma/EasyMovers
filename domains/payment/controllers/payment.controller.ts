/**
 * ============================================================================
 * EasyMovers
 * Payment Controller
 * Part A
 * ============================================================================
 *
 * File:
 * domains/payment/controllers/payment.controller.ts
 *
 * Responsibilities:
 *
 * - Framework-independent controller contracts
 * - Standard HTTP response envelopes
 * - Request metadata contracts
 * - Common Payment route parameter contracts
 * - Body/query/parameter normalization helpers
 * - PaymentServiceError -> HTTP response mapping
 * - Generic Payment service-result mapping
 * - Controller dependency contract
 *
 * Later parts will implement:
 *
 * - Payment create/read/update controllers
 * - Payment search/list
 * - Status change/cancellation
 * - Collection success/failure
 * - Refund request/success/failure
 * - Gateway-order workflows
 * - Webhook workflows
 * - Reconciliation
 * - Statistics
 * - Bulk operations
 * - Health/readiness endpoints
 *
 * IMPORTANT:
 *
 * Controller layer MUST NOT:
 *
 * - Import Prisma
 * - Query repositories directly
 * - Perform database access
 * - Reimplement Payment business rules
 * - Reimplement Payment financial calculations
 * - Validate gateway signatures
 *
 * Those responsibilities remain below or beside the controller boundary.
 * ============================================================================
 */

/* ============================================================================
 * Payment service runtime
 * ============================================================================
 */

import {
  PaymentServiceError,
} from "../services/payment.service";

/* ============================================================================
 * Payment service types
 * ============================================================================
 */

import type {
  PaymentServiceErrorCode,
  PaymentServicePort,
  PaymentServiceResult,
} from "../services/payment.service";

/* ============================================================================
 * Generic controller record
 * ============================================================================
 */

/**
 * Generic object representation used for:
 *
 * - request body
 * - route params
 * - query params
 * - metadata
 */
export type PaymentControllerRecord =
  Record<
    string,
    unknown
  >;

/* ============================================================================
 * Framework-independent request contract
 * ============================================================================
 */

export interface PaymentControllerRequest<
  TBody =
    unknown,
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord,
  TQuery extends
    PaymentControllerRecord =
      PaymentControllerRecord
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
 * Controller error response
 * ============================================================================
 */

export interface PaymentControllerErrorResponse {
  code:
    string;

  message:
    string;

  details?:
    unknown;
}

/* ============================================================================
 * Controller metadata
 * ============================================================================
 */

export interface PaymentControllerResponseMetadata {
  requestId?:
    string;

  timestamp:
    string;

  pagination?:
    unknown;

  warnings?:
    unknown[];
}

/* ============================================================================
 * Controller response body
 * ============================================================================
 */

export interface PaymentControllerResponseBody<
  TData =
    unknown
> {
  success:
    boolean;

  data?:
    TData;

  error?:
    PaymentControllerErrorResponse;

  meta?:
    PaymentControllerResponseMetadata;
}

/* ============================================================================
 * Framework-independent controller response
 * ============================================================================
 */

export interface PaymentControllerResponse<
  TData =
    unknown
> {
  status:
    number;

  body:
    PaymentControllerResponseBody<
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
 * Controller depends only on the Payment service.
 *
 * Prisma and repository dependencies remain hidden below the
 * service boundary.
 */
export interface PaymentControllerDependencies {
  paymentService:
    PaymentServicePort;
}

/* ============================================================================
 * Common Payment route parameters
 * ============================================================================
 */

export interface PaymentIdRouteParams
  extends PaymentControllerRecord {
  paymentId?:
    unknown;
}

export interface PaymentNumberRouteParams
  extends PaymentControllerRecord {
  paymentNumber?:
    unknown;
}

export interface PaymentReferenceRouteParams
  extends PaymentControllerRecord {
  referenceId?:
    unknown;
}

export interface PaymentBookingRouteParams
  extends PaymentControllerRecord {
  bookingId?:
    unknown;
}

export interface PaymentQuotationRouteParams
  extends PaymentControllerRecord {
  quotationId?:
    unknown;
}

export interface PaymentTransactionRouteParams
  extends PaymentControllerRecord {
  transactionId?:
    unknown;
}

export interface PaymentGatewayOrderRouteParams
  extends PaymentControllerRecord {
  gatewayOrderId?:
    unknown;
}

export interface PaymentWebhookRouteParams
  extends PaymentControllerRecord {
  webhookId?:
    unknown;
}

/* ============================================================================
 * Combined route parameter contracts
 * ============================================================================
 */

export interface PaymentTransactionByPaymentRouteParams
  extends PaymentControllerRecord {
  paymentId?:
    unknown;

  transactionId?:
    unknown;
}

export interface PaymentGatewayOrderByPaymentRouteParams
  extends PaymentControllerRecord {
  paymentId?:
    unknown;

  gatewayOrderId?:
    unknown;
}

/* ============================================================================
 * HTTP status constants
 * ============================================================================
 */

export const PAYMENT_HTTP_STATUS = {
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

export type PaymentHttpStatus =
  typeof PAYMENT_HTTP_STATUS[
    keyof typeof PAYMENT_HTTP_STATUS
  ];

/* ============================================================================
 * String normalization
 * ============================================================================
 */

export function normalizePaymentControllerString(
  value:
    unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export function normalizePaymentControllerOptionalString(
  value:
    unknown
): string | undefined {
  const normalized =
    normalizePaymentControllerString(
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

export function normalizePaymentControllerBoolean(
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

export function normalizePaymentControllerNumber(
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

export function normalizePaymentControllerInteger(
  value:
    unknown
): number | undefined {
  const normalized =
    normalizePaymentControllerNumber(
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

export function normalizePaymentControllerPositiveInteger(
  value:
    unknown
): number | undefined {
  const normalized =
    normalizePaymentControllerInteger(
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
 * ["PAID", "PARTIALLY_PAID"]
 *
 * as well as:
 *
 * "PAID,PARTIALLY_PAID"
 */
export function normalizePaymentControllerStringArray(
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
            normalizePaymentControllerOptionalString(
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
 * Date normalization
 * ============================================================================
 */

/**
 * Controller performs only superficial string normalization.
 *
 * Date validity/business meaning belongs to validator/service layers.
 */
export function normalizePaymentControllerDateString(
  value:
    unknown
): string | undefined {
  return normalizePaymentControllerOptionalString(
    value
  );
}

/* ============================================================================
 * Record guard
 * ============================================================================
 */

export function isPaymentControllerRecord(
  value:
    unknown
): value is
  PaymentControllerRecord {
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

/* ============================================================================
 * Response metadata
 * ============================================================================
 */

export function createPaymentControllerMetadata(
  requestId?:
    string,
  pagination?:
    unknown,
  warnings?:
    unknown[]
): PaymentControllerResponseMetadata {
  const normalizedRequestId =
    normalizePaymentControllerOptionalString(
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

export function createPaymentControllerSuccess<
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
): PaymentControllerResponse<
  TData
> {
  return {
    status,

    body: {
      success:
        true,

      data,

      meta:
        createPaymentControllerMetadata(
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

export function createPaymentControllerFailure(
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
): PaymentControllerResponse<
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
        createPaymentControllerMetadata(
          requestId,
          undefined,
          warnings
        ),
    },
  };
}

/* ============================================================================
 * HTTP convenience helpers
 * ============================================================================
 */

export function createPaymentControllerOk<
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
): PaymentControllerResponse<
  TData
> {
  return createPaymentControllerSuccess(
    PAYMENT_HTTP_STATUS.OK,
    data,
    requestId,
    pagination,
    warnings
  );
}

export function createPaymentControllerCreated<
  TData
>(
  data:
    TData,
  requestId?:
    string,
  warnings?:
    unknown[]
): PaymentControllerResponse<
  TData
> {
  return createPaymentControllerSuccess(
    PAYMENT_HTTP_STATUS.CREATED,
    data,
    requestId,
    undefined,
    warnings
  );
}

export function createPaymentControllerBadRequest(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .BAD_REQUEST,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentControllerNotFound(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .NOT_FOUND,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentControllerConflict(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .CONFLICT,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentControllerUnprocessable(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .UNPROCESSABLE_ENTITY,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentControllerInternalError(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .INTERNAL_SERVER_ERROR,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentControllerUnavailable(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    PAYMENT_HTTP_STATUS
      .SERVICE_UNAVAILABLE,
    code,
    message,
    requestId,
    details
  );
}

/* ============================================================================
 * Payment service error -> HTTP status
 * ============================================================================
 */

export function mapPaymentServiceErrorCodeToHttpStatus(
  code:
    PaymentServiceErrorCode
): PaymentHttpStatus {
  switch (
    code
  ) {
    /* ----------------------------------------------------------------------
     * Invalid request/input
     * ----------------------------------------------------------------------
     */

       case "INVALID_PAYMENT_ID":
    case "INVALID_TRANSACTION_ID":
    case "INVALID_PAYMENT_NUMBER":
    case "INVALID_REFERENCE_ID":
    case "INVALID_BOOKING_ID":
    case "INVALID_QUOTATION_ID":
    case "INVALID_GATEWAY_ORDER_ID":
    case "INVALID_GATEWAY_PAYMENT_ID":
    case "INVALID_SERVICE_INPUT":
    case "VALIDATION_FAILED":
    case "PAYMENT_AMOUNT_INVALID":
      return PAYMENT_HTTP_STATUS
        .BAD_REQUEST;

    /* ----------------------------------------------------------------------
     * Missing resources
     * ----------------------------------------------------------------------
     */

    case "PAYMENT_NOT_FOUND":
    case "PAYMENT_TRANSACTION_NOT_FOUND":
      return PAYMENT_HTTP_STATUS
        .NOT_FOUND;

    /* ----------------------------------------------------------------------
     * Duplicate / lifecycle conflicts
     * ----------------------------------------------------------------------
     */

         case "PAYMENT_ALREADY_EXISTS":
    case "PAYMENT_NUMBER_EXISTS":
    case "PAYMENT_REFERENCE_EXISTS":
    case "PAYMENT_TRANSACTION_ALREADY_EXISTS":
    case "GATEWAY_PAYMENT_ALREADY_EXISTS":
    case "BUSINESS_RULE":
    case "PAYMENT_ALREADY_PAID":
    case "PAYMENT_CANCELLED":
    case "PAYMENT_REFUNDED":
    case "PAYMENT_NOT_REFUNDABLE":
    case "PAYMENT_AMOUNT_EXCEEDED":
      return PAYMENT_HTTP_STATUS
        .CONFLICT;

    /* ----------------------------------------------------------------------
     * Infrastructure / persistence
     * ----------------------------------------------------------------------
     */

    case "TRANSACTION_FAILED":
    case "GATEWAY_OPERATION_FAILED":
    case "WEBHOOK_PROCESSING_FAILED":
    case "RECONCILIATION_FAILED":
    case "PAYMENT_REPOSITORY_ERROR":
      return PAYMENT_HTTP_STATUS
        .SERVICE_UNAVAILABLE;

    /* ----------------------------------------------------------------------
     * Configuration
     * ----------------------------------------------------------------------
     */

    case "SERVICE_CONFIGURATION_ERROR":
      return PAYMENT_HTTP_STATUS
        .INTERNAL_SERVER_ERROR;

    /* ----------------------------------------------------------------------
     * Internal
     * ----------------------------------------------------------------------
     */

    case "INTERNAL_ERROR":
    default:
      return PAYMENT_HTTP_STATUS
        .INTERNAL_SERVER_ERROR;
  }
}

/* ============================================================================
 * PaymentServiceError -> controller response
 * ============================================================================
 */

export function mapPaymentServiceErrorToControllerResponse(
  error:
    PaymentServiceError,
  requestId?:
    string
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerFailure(
    mapPaymentServiceErrorCodeToHttpStatus(
      error.code
    ),
    error.code,
    error.message,
    requestId,
    error.details
  );
}

/* ============================================================================
 * Generic PaymentServiceResult -> controller response
 * ============================================================================
 */

/**
 * Part A PaymentService defined a generic PaymentServiceResult contract.
 *
 * Most operational service methods throw PaymentServiceError directly,
 * but this helper remains useful for service methods/future adapters that
 * return the explicit success/failure envelope.
 */
export function mapPaymentServiceResultToControllerResponse<
  TData
>(
  result:
    PaymentServiceResult<
      TData
    >,
  requestId?:
    string
): PaymentControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    const error =
      result.error;

    if (
      !error
    ) {
      return createPaymentControllerInternalError(
        "PAYMENT_SERVICE_RESULT_INVALID",
        "Payment service returned an invalid failure result.",
        requestId
      );
    }

    return createPaymentControllerFailure(
      mapPaymentServiceErrorCodeToHttpStatus(
        error.code
      ),
      error.code,
      error.message,
      requestId,
      error.details
    );
  }

  if (
    result.data ===
      undefined
  ) {
    return createPaymentControllerInternalError(
      "PAYMENT_SERVICE_RESULT_INVALID",
      "Payment service returned a success result without data.",
      requestId
    ) as PaymentControllerResponse<
      TData
    >;
  }

  return createPaymentControllerOk(
    result.data,
    requestId
  );
}

/* ============================================================================
 * Creation PaymentServiceResult -> HTTP 201
 * ============================================================================
 */

export function mapPaymentCreateServiceResultToControllerResponse<
  TData
>(
  result:
    PaymentServiceResult<
      TData
    >,
  requestId?:
    string
): PaymentControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    const error =
      result.error;

    if (
      !error
    ) {
      return createPaymentControllerInternalError(
        "PAYMENT_SERVICE_RESULT_INVALID",
        "Payment service returned an invalid failure result.",
        requestId
      ) as PaymentControllerResponse<
        TData
      >;
    }

    return createPaymentControllerFailure(
      mapPaymentServiceErrorCodeToHttpStatus(
        error.code
      ),
      error.code,
      error.message,
      requestId,
      error.details
    );
  }

  if (
    result.data ===
      undefined
  ) {
    return createPaymentControllerInternalError(
      "PAYMENT_SERVICE_RESULT_INVALID",
      "Payment service returned a success result without data.",
      requestId
    ) as PaymentControllerResponse<
      TData
    >;
  }

  return createPaymentControllerCreated(
    result.data,
    requestId
  );
}

/* ============================================================================
 * Paginated PaymentServiceResult
 * ============================================================================
 */

export function mapPaymentPaginatedServiceResultToControllerResponse<
  TData extends {
    pagination:
      unknown;
  }
>(
  result:
    PaymentServiceResult<
      TData
    >,
  requestId?:
    string
): PaymentControllerResponse<
  TData
> {
  if (
    !result.success
  ) {
    const error =
      result.error;

    if (
      !error
    ) {
      return createPaymentControllerInternalError(
        "PAYMENT_SERVICE_RESULT_INVALID",
        "Payment service returned an invalid failure result.",
        requestId
      ) as PaymentControllerResponse<
        TData
      >;
    }

    return createPaymentControllerFailure(
      mapPaymentServiceErrorCodeToHttpStatus(
        error.code
      ),
      error.code,
      error.message,
      requestId,
      error.details
    );
  }

  if (
    result.data ===
      undefined
  ) {
    return createPaymentControllerInternalError(
      "PAYMENT_SERVICE_RESULT_INVALID",
      "Payment service returned a success result without data.",
      requestId
    ) as PaymentControllerResponse<
      TData
    >;
  }

  return createPaymentControllerOk(
    result.data,
    requestId,
    result.data
      .pagination
  );
}

/* ============================================================================
 * Parameter extraction
 * ============================================================================
 */

export function getPaymentControllerParam(
  request:
    PaymentControllerRequest,
  parameterName:
    string
): string | undefined {
  return normalizePaymentControllerOptionalString(
    request.params?.[
      parameterName
    ]
  );
}

/* ============================================================================
 * Required parameter helper
 * ============================================================================
 */

export function requirePaymentControllerParam(
  request:
    PaymentControllerRequest,
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
    PaymentControllerResponse<
      never
    >;
} {
  const value =
    getPaymentControllerParam(
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
        createPaymentControllerBadRequest(
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
 * Request body guard
 * ============================================================================
 */

export function isPaymentControllerBodyObject(
  value:
    unknown
): value is
  PaymentControllerRecord {
  return isPaymentControllerRecord(
    value
  );
}

export function requirePaymentControllerBody(
  request:
    PaymentControllerRequest
): {
  success:
    true;

  value:
    PaymentControllerRecord;
} | {
  success:
    false;

  response:
    PaymentControllerResponse<
      never
    >;
} {
  if (
    !isPaymentControllerBodyObject(
      request.body
    )
  ) {
    return {
      success:
        false,

      response:
        createPaymentControllerBadRequest(
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
 * Header normalization
 * ============================================================================
 */

export function getPaymentControllerHeader(
  request:
    PaymentControllerRequest,
  name:
    string
): string | undefined {
  if (
    !request.headers
  ) {
    return undefined;
  }

  const expectedName =
    name
      .trim()
      .toLowerCase();

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      request.headers
    )
  ) {
    if (
      key
        .trim()
        .toLowerCase() !==
      expectedName
    ) {
      continue;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return normalizePaymentControllerOptionalString(
        value[0]
      );
    }

    return normalizePaymentControllerOptionalString(
      value
    );
  }

  return undefined;
}

/* ============================================================================
 * Authenticated user
 * ============================================================================
 */

export function getPaymentControllerAuthenticatedUserId(
  request:
    PaymentControllerRequest
): string | undefined {
  return normalizePaymentControllerOptionalString(
    request
      .authenticatedUserId
  );
}

/* ============================================================================
 * Mutation metadata
 * ============================================================================
 */

export interface PaymentControllerMutationMetadata {
  requestId?:
    string;

  updatedBy?:
    string;

  ipAddress?:
    string;

  userAgent?:
    string;
}

export function createPaymentControllerMutationMetadata(
  request:
    PaymentControllerRequest
): PaymentControllerMutationMetadata {
  const requestId =
    normalizePaymentControllerOptionalString(
      request.requestId
    );

  const updatedBy =
    getPaymentControllerAuthenticatedUserId(
      request
    );

  const ipAddress =
    normalizePaymentControllerOptionalString(
      request.ipAddress
    );

  const userAgent =
    normalizePaymentControllerOptionalString(
      request.userAgent
    );

  return {
    ...(requestId
      ? {
          requestId,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),

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
 * Controller error handling
 * ============================================================================
 */

/**
 * Converts known Payment service failures into their stable API response.
 *
 * Unexpected errors become HTTP 500.
 */
export function handlePaymentControllerError(
  error:
    unknown,
  requestId?:
    string
): PaymentControllerResponse<
  never
> {
  if (
    error instanceof
      PaymentServiceError
  ) {
    return mapPaymentServiceErrorToControllerResponse(
      error,
      requestId
    );
  }

  if (
    error instanceof
      Error
  ) {
    return createPaymentControllerInternalError(
      "PAYMENT_CONTROLLER_ERROR",
      error.message,
      requestId
    );
  }

  return createPaymentControllerInternalError(
    "PAYMENT_CONTROLLER_ERROR",
    "An unexpected Payment controller error occurred.",
    requestId
  );
}

/* ============================================================================
 * Dependency guard
 * ============================================================================
 */

export function requirePaymentControllerDependencies(
  dependencies:
    PaymentControllerDependencies
): PaymentControllerDependencies {
  if (
    !dependencies ||
    !dependencies.paymentService
  ) {
    throw new Error(
      "PaymentController requires PaymentService."
    );
  }

  return dependencies;
}

/* ============================================================================
 * Controller context
 * ============================================================================
 */

export class PaymentControllerContext {
  readonly paymentService:
    PaymentServicePort;

  constructor(
    dependencies:
      PaymentControllerDependencies
  ) {
    const resolved =
      requirePaymentControllerDependencies(
        dependencies
      );

    this.paymentService =
      resolved.paymentService;
  }
}

/* ============================================================================
 * Part A facade
 * ============================================================================
 */

export const PaymentControllerPartA = {
  /* ------------------------------------------------------------------------
   * Response
   * ------------------------------------------------------------------------
   */

  success:
    createPaymentControllerSuccess,

  ok:
    createPaymentControllerOk,

  created:
    createPaymentControllerCreated,

  failure:
    createPaymentControllerFailure,

  badRequest:
    createPaymentControllerBadRequest,

  notFound:
    createPaymentControllerNotFound,

  conflict:
    createPaymentControllerConflict,

  unprocessable:
    createPaymentControllerUnprocessable,

  internalError:
    createPaymentControllerInternalError,

  unavailable:
    createPaymentControllerUnavailable,

  /* ------------------------------------------------------------------------
   * Service mapping
   * ------------------------------------------------------------------------
   */

  serviceResult:
    mapPaymentServiceResultToControllerResponse,

  createServiceResult:
    mapPaymentCreateServiceResultToControllerResponse,

  paginatedServiceResult:
    mapPaymentPaginatedServiceResultToControllerResponse,

  serviceError:
    mapPaymentServiceErrorToControllerResponse,

  serviceErrorStatus:
    mapPaymentServiceErrorCodeToHttpStatus,

  /* ------------------------------------------------------------------------
   * Normalize
   * ------------------------------------------------------------------------
   */

  string:
    normalizePaymentControllerString,

  optionalString:
    normalizePaymentControllerOptionalString,

  boolean:
    normalizePaymentControllerBoolean,

  number:
    normalizePaymentControllerNumber,

  integer:
    normalizePaymentControllerInteger,

  positiveInteger:
    normalizePaymentControllerPositiveInteger,

  stringArray:
    normalizePaymentControllerStringArray,

  dateString:
    normalizePaymentControllerDateString,

  record:
    isPaymentControllerRecord,

  /* ------------------------------------------------------------------------
   * Request
   * ------------------------------------------------------------------------
   */

  getParam:
    getPaymentControllerParam,

  requireParam:
    requirePaymentControllerParam,

  requireBody:
    requirePaymentControllerBody,

  getHeader:
    getPaymentControllerHeader,

  authenticatedUserId:
    getPaymentControllerAuthenticatedUserId,

  mutationMetadata:
    createPaymentControllerMutationMetadata,

  /* ------------------------------------------------------------------------
   * Error
   * ------------------------------------------------------------------------
   */

  handleError:
    handlePaymentControllerError,

  /* ------------------------------------------------------------------------
   * Dependencies
   * ------------------------------------------------------------------------
   */

  requireDependencies:
    requirePaymentControllerDependencies,
} as const;

/* ============================================================================
 * End of Payment Controller - Part A
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Controller
 * Part B
 * ============================================================================
 *
 * Core read / diagnostic operations:
 *
 * - Get Payment by ID
 * - Get Payment by Payment number
 * - Get Payment by reference ID
 * - Get Payment by Booking ID
 * - Get Payment by Quotation ID
 * - Get Payment transaction by ID
 * - Get transactions for Payment
 * - Get transaction by gateway payment ID
 * - Get transactions by gateway order ID
 * - Get gateway orders for Payment
 * - Get latest reconciliation
 * - Get reconciliation history
 * - Repository health
 * - Service readiness
 *
 * Design:
 *
 * Controller method input/output contracts are derived from PaymentServicePort
 * wherever possible. This prevents the controller from maintaining a second,
 * potentially divergent copy of Payment service contracts.
 * ============================================================================
 */

/* ============================================================================
 * Service method result helpers
 * ============================================================================
 */

export type PaymentControllerServiceResult<
  TMethod extends
    keyof PaymentServicePort
> =
  PaymentServicePort[
    TMethod
  ] extends (
    ...args:
      never[]
  ) => Promise<
    infer TResult
  >
    ? TResult
    : never;

/* ============================================================================
 * Concrete read-result types
 * ============================================================================
 */

export type GetPaymentControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPayment"
      ]
    >
  >;

export type GetPaymentByNumberControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentByNumber"
      ]
    >
  >;

export type GetPaymentByReferenceControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentByReferenceId"
      ]
    >
  >;

export type GetPaymentByBookingControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentByBookingId"
      ]
    >
  >;

export type GetPaymentByQuotationControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentByQuotationId"
      ]
    >
  >;

export type GetPaymentTransactionControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentTransaction"
      ]
    >
  >;

export type GetPaymentTransactionsControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentTransactions"
      ]
    >
  >;

export type GetGatewayPaymentTransactionControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getTransactionByGatewayPaymentId"
      ]
    >
  >;

export type GetGatewayOrderTransactionsControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getTransactionsByGatewayOrderId"
      ]
    >
  >;

export type GetPaymentGatewayOrdersControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getGatewayOrders"
      ]
    >
  >;

export type GetLatestPaymentReconciliationControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getLatestReconciliation"
      ]
    >
  >;

export type GetPaymentReconciliationHistoryControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getReconciliationHistory"
      ]
    >
  >;

export type PaymentRepositoryHealthControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "checkRepositoryHealth"
      ]
    >
  >;

export type PaymentReadinessControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "checkReadiness"
      ]
    >
  >;

/* ============================================================================
 * Additional route parameter contracts
 * ============================================================================
 */

export interface PaymentGatewayPaymentRouteParams
  extends PaymentControllerRecord {
  gatewayPaymentId?:
    unknown;
}

/* ============================================================================
 * Reconciliation history query
 * ============================================================================
 */

export interface PaymentReconciliationHistoryQueryParams
  extends PaymentControllerRecord {
  page?:
    unknown;

  pageSize?:
    unknown;
}

/* ============================================================================
 * Nullable resource response helper
 * ============================================================================
 */

/**
 * Several Payment read service methods intentionally return null when the
 * resource does not exist.
 *
 * Controller converts that null into stable HTTP 404 semantics.
 */
export function createPaymentControllerNullableReadResponse<
  TData
>(
  data:
    TData | null,
  requestId:
    string | undefined,
  notFoundCode:
    string,
  notFoundMessage:
    string,
  details?:
    unknown
): PaymentControllerResponse<
  TData
> {
  if (
    data ===
      null
  ) {
    return createPaymentControllerNotFound(
      notFoundCode,
      notFoundMessage,
      requestId,
      details
    ) as PaymentControllerResponse<
      TData
    >;
  }

  return createPaymentControllerOk(
    data,
    requestId
  );
}

/* ============================================================================
 * Get Payment by ID
 * ============================================================================
 */

export async function getPaymentByIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const payment =
      await paymentService
        .getPayment(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      payment,
      request.requestId,
      "PAYMENT_NOT_FOUND",
      "Payment not found.",
      {
        paymentId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get Payment by number
 * ============================================================================
 */

export async function getPaymentByNumberController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentNumberRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentByNumberControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentNumber"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const payment =
      await paymentService
        .getPaymentByNumber(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      payment,
      request.requestId,
      "PAYMENT_NOT_FOUND",
      "Payment not found.",
      {
        paymentNumber:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get Payment by reference ID
 * ============================================================================
 */

export async function getPaymentByReferenceIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentReferenceRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentByReferenceControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "referenceId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const payment =
      await paymentService
        .getPaymentByReferenceId(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      payment,
      request.requestId,
      "PAYMENT_NOT_FOUND",
      "Payment not found.",
      {
        referenceId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get latest Payment by Booking ID
 * ============================================================================
 */

export async function getPaymentByBookingIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentBookingRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentByBookingControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "bookingId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const payment =
      await paymentService
        .getPaymentByBookingId(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      payment,
      request.requestId,
      "PAYMENT_NOT_FOUND",
      "No Payment was found for this Booking.",
      {
        bookingId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get latest Payment by Quotation ID
 * ============================================================================
 */

export async function getPaymentByQuotationIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentQuotationRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentByQuotationControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "quotationId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const payment =
      await paymentService
        .getPaymentByQuotationId(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      payment,
      request.requestId,
      "PAYMENT_NOT_FOUND",
      "No Payment was found for this Quotation.",
      {
        quotationId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get transaction by ID
 * ============================================================================
 */

export async function getPaymentTransactionByIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentTransactionRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentTransactionControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "transactionId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const transaction =
      await paymentService
        .getPaymentTransaction(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      transaction,
      request.requestId,
      "PAYMENT_TRANSACTION_NOT_FOUND",
      "Payment transaction not found.",
      {
        transactionId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get transactions for Payment
 * ============================================================================
 */

export async function getPaymentTransactionsController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    GetPaymentTransactionsControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const transactions =
      await paymentService
        .getPaymentTransactions(
          param.value
        );

    return createPaymentControllerOk(
      transactions,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get transaction by gateway Payment ID
 * ============================================================================
 */

export async function getTransactionByGatewayPaymentIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentGatewayPaymentRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetGatewayPaymentTransactionControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "gatewayPaymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const transaction =
      await paymentService
        .getTransactionByGatewayPaymentId(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      transaction,
      request.requestId,
      "PAYMENT_TRANSACTION_NOT_FOUND",
      "Payment transaction was not found for this gateway Payment ID.",
      {
        gatewayPaymentId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get transactions by gateway-order ID
 * ============================================================================
 */

export async function getTransactionsByGatewayOrderIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentGatewayOrderRouteParams
    >
): Promise<
  PaymentControllerResponse<
    GetGatewayOrderTransactionsControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "gatewayOrderId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const transactions =
      await paymentService
        .getTransactionsByGatewayOrderId(
          param.value
        );

    return createPaymentControllerOk(
      transactions,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get gateway orders for Payment
 * ============================================================================
 */

export async function getPaymentGatewayOrdersController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    GetPaymentGatewayOrdersControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const orders =
      await paymentService
        .getGatewayOrders(
          param.value
        );

    return createPaymentControllerOk(
      orders,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get latest Payment reconciliation
 * ============================================================================
 */

export async function getLatestPaymentReconciliationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetLatestPaymentReconciliationControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  try {
    const reconciliation =
      await paymentService
        .getLatestReconciliation(
          param.value
        );

    return createPaymentControllerNullableReadResponse(
      reconciliation,
      request.requestId,
      "PAYMENT_RECONCILIATION_NOT_FOUND",
      "No reconciliation record was found for this Payment.",
      {
        paymentId:
          param.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Reconciliation history input mapping
 * ============================================================================
 */

export function createPaymentReconciliationHistoryQuery(
  paymentId:
    string,
  query?:
    PaymentReconciliationHistoryQueryParams
): Parameters<
  PaymentServicePort[
    "getReconciliationHistory"
  ]
>[0] {
  const page =
    normalizePaymentControllerPositiveInteger(
      query?.page
    );

  const pageSize =
    normalizePaymentControllerPositiveInteger(
      query?.pageSize
    );

  return {
    paymentId,

    ...(page !==
      undefined
      ? {
          page,
        }
      : {}),

    ...(pageSize !==
      undefined
      ? {
          pageSize,
        }
      : {}),
  };
}

/* ============================================================================
 * Get reconciliation history
 * ============================================================================
 */

export async function getPaymentReconciliationHistoryController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams,
      PaymentReconciliationHistoryQueryParams
    >
): Promise<
  PaymentControllerResponse<
    GetPaymentReconciliationHistoryControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const param =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !param.success
  ) {
    return param.response;
  }

  const rawPage =
    normalizePaymentControllerOptionalString(
      request.query
        ?.page
    );

  const page =
    normalizePaymentControllerPositiveInteger(
      request.query
        ?.page
    );

  if (
    rawPage &&
    page ===
      undefined
  ) {
    return createPaymentControllerBadRequest(
      "INVALID_PAGE",
      "page must contain a valid positive integer.",
      request.requestId,
      {
        field:
          "page",

        value:
          request.query
            ?.page,
      }
    );
  }

  const rawPageSize =
    normalizePaymentControllerOptionalString(
      request.query
        ?.pageSize
    );

  const pageSize =
    normalizePaymentControllerPositiveInteger(
      request.query
        ?.pageSize
    );

  if (
    rawPageSize &&
    pageSize ===
      undefined
  ) {
    return createPaymentControllerBadRequest(
      "INVALID_PAGE_SIZE",
      "pageSize must contain a valid positive integer.",
      request.requestId,
      {
        field:
          "pageSize",

        value:
          request.query
            ?.pageSize,
      }
    );
  }

  try {
    const query =
      createPaymentReconciliationHistoryQuery(
        param.value,
        request.query
      );

    const result =
      await paymentService
        .getReconciliationHistory(
          query
        );

    return createPaymentControllerOk(
      result,
      request.requestId,
      result.pagination
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Repository health
 * ============================================================================
 */

export async function getPaymentRepositoryHealthController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    PaymentRepositoryHealthControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const health =
      await paymentService
        .checkRepositoryHealth();

    /**
     * Health is an operational result, so return the actual result even when
     * healthy === false. Route adapters may later decide whether to map an
     * unhealthy result to HTTP 503 for dedicated infrastructure probes.
     */
    return createPaymentControllerOk(
      health,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Service readiness
 * ============================================================================
 */

export async function getPaymentReadinessController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    PaymentReadinessControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const readiness =
      await paymentService
        .checkReadiness();

    if (
      !readiness.ready
    ) {
      return createPaymentControllerSuccess(
        PAYMENT_HTTP_STATUS
          .SERVICE_UNAVAILABLE,
        readiness,
        request.requestId
      );
    }

    return createPaymentControllerOk(
      readiness,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Complete Payment Controller - first operation class
 * ============================================================================
 */

export class PaymentController
  extends PaymentControllerContext {
  /* ------------------------------------------------------------------------
   * Payment reads
   * ------------------------------------------------------------------------
   */

  getById(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ) {
    return getPaymentByIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getByPaymentNumber(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentNumberRouteParams
      >
  ) {
    return getPaymentByNumberController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getByReferenceId(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentReferenceRouteParams
      >
  ) {
    return getPaymentByReferenceIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getByBookingId(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentBookingRouteParams
      >
  ) {
    return getPaymentByBookingIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getByQuotationId(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentQuotationRouteParams
      >
  ) {
    return getPaymentByQuotationIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  /* ------------------------------------------------------------------------
   * Transaction reads
   * ------------------------------------------------------------------------
   */

  getTransactionById(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentTransactionRouteParams
      >
  ) {
    return getPaymentTransactionByIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getTransactions(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ) {
    return getPaymentTransactionsController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getTransactionByGatewayPaymentId(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentGatewayPaymentRouteParams
      >
  ) {
    return getTransactionByGatewayPaymentIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getTransactionsByGatewayOrderId(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentGatewayOrderRouteParams
      >
  ) {
    return getTransactionsByGatewayOrderIdController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  /* ------------------------------------------------------------------------
   * Gateway reads
   * ------------------------------------------------------------------------
   */

  getGatewayOrders(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ) {
    return getPaymentGatewayOrdersController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  /* ------------------------------------------------------------------------
   * Reconciliation reads
   * ------------------------------------------------------------------------
   */

  getLatestReconciliation(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ) {
    return getLatestPaymentReconciliationController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  getReconciliationHistory(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams,
        PaymentReconciliationHistoryQueryParams
      >
  ) {
    return getPaymentReconciliationHistoryController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  health(
    request:
      PaymentControllerRequest
  ) {
    return getPaymentRepositoryHealthController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }

  readiness(
    request:
      PaymentControllerRequest
  ) {
    return getPaymentReadinessController(
      {
        paymentService:
          this.paymentService,
      },
      request
    );
  }
}

/* ============================================================================
 * Payment Controller factory
 * ============================================================================
 */

export function createPaymentController(
  dependencies:
    PaymentControllerDependencies
): PaymentController {
  return new PaymentController(
    dependencies
  );
}

/* ============================================================================
 * Part B facade
 * ============================================================================
 */

export const PaymentControllerPartB = {
  /* ------------------------------------------------------------------------
   * Payment reads
   * ------------------------------------------------------------------------
   */

  getById:
    getPaymentByIdController,

  getByPaymentNumber:
    getPaymentByNumberController,

  getByReferenceId:
    getPaymentByReferenceIdController,

  getByBookingId:
    getPaymentByBookingIdController,

  getByQuotationId:
    getPaymentByQuotationIdController,

  /* ------------------------------------------------------------------------
   * Transactions
   * ------------------------------------------------------------------------
   */

  getTransactionById:
    getPaymentTransactionByIdController,

  getTransactions:
    getPaymentTransactionsController,

  getTransactionByGatewayPaymentId:
    getTransactionByGatewayPaymentIdController,

  getTransactionsByGatewayOrderId:
    getTransactionsByGatewayOrderIdController,

  /* ------------------------------------------------------------------------
   * Gateway
   * ------------------------------------------------------------------------
   */

  getGatewayOrders:
    getPaymentGatewayOrdersController,

  /* ------------------------------------------------------------------------
   * Reconciliation
   * ------------------------------------------------------------------------
   */

  getLatestReconciliation:
    getLatestPaymentReconciliationController,

  getReconciliationHistory:
    getPaymentReconciliationHistoryController,

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  health:
    getPaymentRepositoryHealthController,

  readiness:
    getPaymentReadinessController,

  /* ------------------------------------------------------------------------
   * Mapping
   * ------------------------------------------------------------------------
   */

  createReconciliationHistoryQuery:
    createPaymentReconciliationHistoryQuery,

  nullableReadResponse:
    createPaymentControllerNullableReadResponse,

  /* ------------------------------------------------------------------------
   * Factory
   * ------------------------------------------------------------------------
   */

  createController:
    createPaymentController,
} as const;

/* ============================================================================
 * End of Payment Controller - Part B
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Controller
 * Part C
 * ============================================================================
 *
 * Search / reporting operations:
 *
 * - Payment search
 * - Payment transaction search
 * - Payment statistics
 * - Payment transaction statistics
 * - Query normalization
 * - Pagination normalization
 *
 * IMPORTANT:
 *
 * - Controller normalizes transport-level values only.
 * - Service owns Payment business rules.
 * - Search criteria types are derived from PaymentServicePort.
 * - No Prisma/repository dependency is introduced.
 * ============================================================================
 */

/* ============================================================================
 * Service-derived search contracts
 * ============================================================================
 */

export type PaymentControllerSearchCriteria =
  Parameters<
    PaymentServicePort[
      "searchPayments"
    ]
  >[0];

export type PaymentControllerTransactionSearchCriteria =
  Parameters<
    PaymentServicePort[
      "searchPaymentTransactions"
    ]
  >[0];

export type PaymentControllerStatisticsCriteria =
  Parameters<
    PaymentServicePort[
      "getPaymentStatistics"
    ]
  >[0];

export type PaymentControllerTransactionStatisticsCriteria =
  Parameters<
    PaymentServicePort[
      "getTransactionStatistics"
    ]
  >[0];

/* ============================================================================
 * Search result contracts
 * ============================================================================
 */

export type PaymentSearchControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "searchPayments"
      ]
    >
  >;

export type PaymentTransactionSearchControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "searchPaymentTransactions"
      ]
    >
  >;

export type PaymentStatisticsControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getPaymentStatistics"
      ]
    >
  >;

export type PaymentTransactionStatisticsControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getTransactionStatistics"
      ]
    >
  >;

/* ============================================================================
 * Payment search query params
 * ============================================================================
 */

export interface PaymentSearchQueryParams
  extends PaymentControllerRecord {
  paymentId?:
    unknown;

  paymentNumber?:
    unknown;

  referenceId?:
    unknown;

  bookingId?:
    unknown;

  quotationId?:
    unknown;

  userId?:
    unknown;

  vendorId?:
    unknown;

  status?:
    unknown;

  paymentStatus?:
    unknown;

  method?:
    unknown;

  paymentMethod?:
    unknown;

  type?:
    unknown;

  paymentType?:
    unknown;

  provider?:
    unknown;

  gatewayOrderId?:
    unknown;

  gatewayPaymentId?:
    unknown;

  transactionId?:
    unknown;

  minimumAmount?:
    unknown;

  maximumAmount?:
    unknown;

  createdFrom?:
    unknown;

  createdUntil?:
    unknown;

  paidFrom?:
    unknown;

  paidUntil?:
    unknown;

  search?:
    unknown;

  page?:
    unknown;

  pageSize?:
    unknown;

  sortBy?:
    unknown;

  sortField?:
    unknown;

  sortDirection?:
    unknown;
}

/* ============================================================================
 * Transaction search query params
 * ============================================================================
 */

export interface PaymentTransactionSearchQueryParams
  extends PaymentControllerRecord {
  transactionId?:
    unknown;

  paymentId?:
    unknown;

  transactionType?:
    unknown;

  purpose?:
    unknown;

  status?:
    unknown;

  method?:
    unknown;

  provider?:
    unknown;

  gatewayOrderId?:
    unknown;

  gatewayPaymentId?:
    unknown;

  minimumAmount?:
    unknown;

  maximumAmount?:
    unknown;

  initiatedFrom?:
    unknown;

  initiatedUntil?:
    unknown;

  page?:
    unknown;

  pageSize?:
    unknown;

  sortBy?:
    unknown;

  sortField?:
    unknown;

  sortDirection?:
    unknown;
}

/* ============================================================================
 * Search mapping issue
 * ============================================================================
 */

export interface PaymentControllerSearchMappingIssue {
  field:
    string;

  code:
    string;

  message:
    string;

  value?:
    unknown;
}

/* ============================================================================
 * Search mapping error
 * ============================================================================
 */

export class PaymentControllerSearchMappingError
  extends Error {
  readonly mappingErrors:
    PaymentControllerSearchMappingIssue[];

  constructor(
    mappingErrors:
      PaymentControllerSearchMappingIssue[]
  ) {
    super(
      "Payment search query contains invalid values."
    );

    this.name =
      "PaymentControllerSearchMappingError";

    this.mappingErrors =
      mappingErrors;
  }
}

/* ============================================================================
 * Safe mutable search record
 * ============================================================================
 */

/**
 * Search criteria remain owned by payment.model.ts.
 *
 * Controller uses a mutable transport record while mapping query-string
 * values and casts only once at the service boundary.
 */
type PaymentControllerMutableCriteria =
  Record<
    string,
    unknown
  >;

/* ============================================================================
 * Optional string assignment
 * ============================================================================
 */

export function assignPaymentControllerOptionalString(
  target:
    PaymentControllerMutableCriteria,
  field:
    string,
  value:
    unknown
): void {
  const normalized =
    normalizePaymentControllerOptionalString(
      value
    );

  if (
    normalized !==
      undefined
  ) {
    target[field] =
      normalized;
  }
}

/* ============================================================================
 * Optional number assignment
 * ============================================================================
 */

export function assignPaymentControllerOptionalNumber(
  target:
    PaymentControllerMutableCriteria,
  field:
    string,
  value:
    unknown,
  errors:
    PaymentControllerSearchMappingIssue[]
): void {
  const raw =
    normalizePaymentControllerOptionalString(
      value
    );

  if (
    raw ===
      undefined &&
    typeof value !==
      "number"
  ) {
    return;
  }

  const normalized =
    normalizePaymentControllerNumber(
      value
    );

  if (
    normalized ===
      undefined
  ) {
    errors.push({
      field,

      code:
        "INVALID_NUMBER_VALUE",

      message:
        `${field} must contain a valid number.`,

      value,
    });

    return;
  }

  target[field] =
    normalized;
}

/* ============================================================================
 * Payment pagination validation
 * ============================================================================
 */

export function validatePaymentControllerPagination(
  query?:
    PaymentControllerRecord
): {
  page?:
    number;

  pageSize?:
    number;
} {
  if (
    !query
  ) {
    return {};
  }

  const errors:
    PaymentControllerSearchMappingIssue[] =
      [];

  const rawPage =
    normalizePaymentControllerOptionalString(
      query.page
    );

  const page =
    normalizePaymentControllerPositiveInteger(
      query.page
    );

  if (
    rawPage !==
      undefined &&
    page ===
      undefined
  ) {
    errors.push({
      field:
        "page",

      code:
        "INVALID_INTEGER_VALUE",

      message:
        "page must contain a valid positive integer.",

      value:
        query.page,
    });
  }

  const rawPageSize =
    normalizePaymentControllerOptionalString(
      query.pageSize
    );

  const pageSize =
    normalizePaymentControllerPositiveInteger(
      query.pageSize
    );

  if (
    rawPageSize !==
      undefined &&
    pageSize ===
      undefined
  ) {
    errors.push({
      field:
        "pageSize",

      code:
        "INVALID_INTEGER_VALUE",

      message:
        "pageSize must contain a valid positive integer.",

      value:
        query.pageSize,
    });
  }

  if (
    errors.length >
      0
  ) {
    throw new PaymentControllerSearchMappingError(
      errors
    );
  }

  return {
    ...(page !==
      undefined
      ? {
          page,
        }
      : {}),

    ...(pageSize !==
      undefined
      ? {
          pageSize,
        }
      : {}),
  };
}

/* ============================================================================
 * Build Payment search criteria
 * ============================================================================
 */

export function createPaymentSearchCriteria(
  query?:
    PaymentSearchQueryParams
): PaymentControllerSearchCriteria {
  const safeQuery =
    query ??
    {};

  const criteria:
    PaymentControllerMutableCriteria =
      {};

  const errors:
    PaymentControllerSearchMappingIssue[] =
      [];

  /* ------------------------------------------------------------------------
   * Identifiers
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "paymentId",
    safeQuery.paymentId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paymentNumber",
    safeQuery.paymentNumber
  );

  assignPaymentControllerOptionalString(
    criteria,
    "referenceId",
    safeQuery.referenceId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "bookingId",
    safeQuery.bookingId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "quotationId",
    safeQuery.quotationId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "userId",
    safeQuery.userId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "vendorId",
    safeQuery.vendorId
  );

  /* ------------------------------------------------------------------------
   * Payment state
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "status",
    safeQuery.status ??
      safeQuery.paymentStatus
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paymentMethod",
    safeQuery.paymentMethod ??
      safeQuery.method
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paymentType",
    safeQuery.paymentType ??
      safeQuery.type
  );

  assignPaymentControllerOptionalString(
    criteria,
    "provider",
    safeQuery.provider
  );

  /* ------------------------------------------------------------------------
   * Gateway identifiers
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "gatewayOrderId",
    safeQuery.gatewayOrderId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "gatewayPaymentId",
    safeQuery.gatewayPaymentId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "transactionId",
    safeQuery.transactionId
  );

  /* ------------------------------------------------------------------------
   * Amount filters
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalNumber(
    criteria,
    "minimumAmount",
    safeQuery.minimumAmount,
    errors
  );

  assignPaymentControllerOptionalNumber(
    criteria,
    "maximumAmount",
    safeQuery.maximumAmount,
    errors
  );

  /* ------------------------------------------------------------------------
   * Date filters
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "createdFrom",
    safeQuery.createdFrom
  );

  assignPaymentControllerOptionalString(
    criteria,
    "createdUntil",
    safeQuery.createdUntil
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paidFrom",
    safeQuery.paidFrom
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paidUntil",
    safeQuery.paidUntil
  );

  /* ------------------------------------------------------------------------
   * Search
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "search",
    safeQuery.search
  );

  /* ------------------------------------------------------------------------
   * Pagination
   * ------------------------------------------------------------------------
   */

  const pagination =
    validatePaymentControllerPagination(
      safeQuery
    );

  if (
    pagination.page !==
      undefined
  ) {
    criteria.page =
      pagination.page;
  }

  if (
    pagination.pageSize !==
      undefined
  ) {
    criteria.pageSize =
      pagination.pageSize;
  }

  /* ------------------------------------------------------------------------
   * Sorting
   * ------------------------------------------------------------------------
   */

  assignPaymentControllerOptionalString(
    criteria,
    "sortBy",
    safeQuery.sortBy ??
      safeQuery.sortField
  );

  assignPaymentControllerOptionalString(
    criteria,
    "sortDirection",
    safeQuery.sortDirection
  );

  if (
    errors.length >
      0
  ) {
    throw new PaymentControllerSearchMappingError(
      errors
    );
  }

  return criteria as
    PaymentControllerSearchCriteria;
}

/* ============================================================================
 * Build Payment transaction search criteria
 * ============================================================================
 */

export function createPaymentTransactionSearchCriteria(
  query?:
    PaymentTransactionSearchQueryParams
): PaymentControllerTransactionSearchCriteria {
  const safeQuery =
    query ??
    {};

  const criteria:
    PaymentControllerMutableCriteria =
      {};

  const errors:
    PaymentControllerSearchMappingIssue[] =
      [];

  assignPaymentControllerOptionalString(
    criteria,
    "transactionId",
    safeQuery.transactionId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "paymentId",
    safeQuery.paymentId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "transactionType",
    safeQuery.transactionType
  );

  assignPaymentControllerOptionalString(
    criteria,
    "purpose",
    safeQuery.purpose
  );

  assignPaymentControllerOptionalString(
    criteria,
    "status",
    safeQuery.status
  );

  assignPaymentControllerOptionalString(
    criteria,
    "method",
    safeQuery.method
  );

  assignPaymentControllerOptionalString(
    criteria,
    "provider",
    safeQuery.provider
  );

  assignPaymentControllerOptionalString(
    criteria,
    "gatewayOrderId",
    safeQuery.gatewayOrderId
  );

  assignPaymentControllerOptionalString(
    criteria,
    "gatewayPaymentId",
    safeQuery.gatewayPaymentId
  );

  assignPaymentControllerOptionalNumber(
    criteria,
    "minimumAmount",
    safeQuery.minimumAmount,
    errors
  );

  assignPaymentControllerOptionalNumber(
    criteria,
    "maximumAmount",
    safeQuery.maximumAmount,
    errors
  );

  assignPaymentControllerOptionalString(
    criteria,
    "initiatedFrom",
    safeQuery.initiatedFrom
  );

  assignPaymentControllerOptionalString(
    criteria,
    "initiatedUntil",
    safeQuery.initiatedUntil
  );

  const pagination =
    validatePaymentControllerPagination(
      safeQuery
    );

  if (
    pagination.page !==
      undefined
  ) {
    criteria.page =
      pagination.page;
  }

  if (
    pagination.pageSize !==
      undefined
  ) {
    criteria.pageSize =
      pagination.pageSize;
  }

  assignPaymentControllerOptionalString(
    criteria,
    "sortBy",
    safeQuery.sortBy ??
      safeQuery.sortField
  );

  assignPaymentControllerOptionalString(
    criteria,
    "sortDirection",
    safeQuery.sortDirection
  );

  if (
    errors.length >
      0
  ) {
    throw new PaymentControllerSearchMappingError(
      errors
    );
  }

  return criteria as
    PaymentControllerTransactionSearchCriteria;
}

/* ============================================================================
 * Payment search controller
 * ============================================================================
 */

export async function searchPaymentsController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentControllerRecord,
      PaymentSearchQueryParams
    >
): Promise<
  PaymentControllerResponse<
    PaymentSearchControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const criteria =
      createPaymentSearchCriteria(
        request.query
      );

    const result =
      await paymentService
        .searchPayments(
          criteria
        );

    return createPaymentControllerOk(
      result,
      request.requestId,
      result.pagination
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerSearchMappingError
    ) {
      return createPaymentControllerBadRequest(
        "PAYMENT_REQUEST_MAPPING_FAILED",
        error.message,
        request.requestId,
        {
          mappingErrors:
            error.mappingErrors,
        }
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Payment transaction search controller
 * ============================================================================
 */

export async function searchPaymentTransactionsController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentControllerRecord,
      PaymentTransactionSearchQueryParams
    >
): Promise<
  PaymentControllerResponse<
    PaymentTransactionSearchControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const criteria =
      createPaymentTransactionSearchCriteria(
        request.query
      );

    const result =
      await paymentService
        .searchPaymentTransactions(
          criteria
        );

    return createPaymentControllerOk(
      result,
      request.requestId,
      result.pagination
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerSearchMappingError
    ) {
      return createPaymentControllerBadRequest(
        "PAYMENT_TRANSACTION_REQUEST_MAPPING_FAILED",
        error.message,
        request.requestId,
        {
          mappingErrors:
            error.mappingErrors,
        }
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Payment statistics controller
 * ============================================================================
 */

export async function getPaymentStatisticsController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentControllerRecord,
      PaymentSearchQueryParams
    >
): Promise<
  PaymentControllerResponse<
    PaymentStatisticsControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const criteria =
      createPaymentSearchCriteria(
        request.query
      );

    const statistics =
      await paymentService
        .getPaymentStatistics(
          criteria
        );

    return createPaymentControllerOk(
      statistics,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerSearchMappingError
    ) {
      return createPaymentControllerBadRequest(
        "PAYMENT_STATISTICS_REQUEST_MAPPING_FAILED",
        error.message,
        request.requestId,
        {
          mappingErrors:
            error.mappingErrors,
        }
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Transaction statistics controller
 * ============================================================================
 */

export async function getPaymentTransactionStatisticsController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentControllerRecord,
      PaymentTransactionSearchQueryParams
    >
): Promise<
  PaymentControllerResponse<
    PaymentTransactionStatisticsControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const criteria =
      createPaymentTransactionSearchCriteria(
        request.query
      );

    const statistics =
      await paymentService
        .getTransactionStatistics(
          criteria
        );

    return createPaymentControllerOk(
      statistics,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerSearchMappingError
    ) {
      return createPaymentControllerBadRequest(
        "PAYMENT_TRANSACTION_STATISTICS_REQUEST_MAPPING_FAILED",
        error.message,
        request.requestId,
        {
          mappingErrors:
            error.mappingErrors,
        }
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Extend PaymentController with search/reporting methods
 * ============================================================================
 */

export interface PaymentSearchControllerOperations {
  search(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentControllerRecord,
        PaymentSearchQueryParams
      >
  ): ReturnType<
    typeof searchPaymentsController
  >;

  searchTransactions(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentControllerRecord,
        PaymentTransactionSearchQueryParams
      >
  ): ReturnType<
    typeof searchPaymentTransactionsController
  >;

  paymentStatistics(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentControllerRecord,
        PaymentSearchQueryParams
      >
  ): ReturnType<
    typeof getPaymentStatisticsController
  >;

  transactionStatistics(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentControllerRecord,
        PaymentTransactionSearchQueryParams
      >
  ): ReturnType<
    typeof getPaymentTransactionStatisticsController
  >;
}

/* ============================================================================
 * Payment controller search operation attachment
 * ============================================================================
 */

/**
 * Part B already created PaymentController.
 *
 * We attach the Part C functions through the prototype so we do not redeclare
 * the class and create a TypeScript duplicate-export error.
 */
export function attachPaymentControllerPartCOperations():
  void {
  const prototype =
    PaymentController
      .prototype as
        PaymentController &
        PaymentSearchControllerOperations;

  if (
    typeof prototype.search !==
      "function"
  ) {
    prototype.search =
      function (
        request
      ) {
        return searchPaymentsController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.searchTransactions !==
      "function"
  ) {
    prototype.searchTransactions =
      function (
        request
      ) {
        return searchPaymentTransactionsController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.paymentStatistics !==
      "function"
  ) {
    prototype.paymentStatistics =
      function (
        request
      ) {
        return getPaymentStatisticsController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.transactionStatistics !==
      "function"
  ) {
    prototype.transactionStatistics =
      function (
        request
      ) {
        return getPaymentTransactionStatisticsController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }
}

/* ============================================================================
 * Install Part C controller methods
 * ============================================================================
 */

attachPaymentControllerPartCOperations();

/* ============================================================================
 * Part C facade
 * ============================================================================
 */

export const PaymentControllerPartC = {
  /* ------------------------------------------------------------------------
   * Search
   * ------------------------------------------------------------------------
   */

  searchPayments:
    searchPaymentsController,

  searchTransactions:
    searchPaymentTransactionsController,

  /* ------------------------------------------------------------------------
   * Statistics
   * ------------------------------------------------------------------------
   */

  paymentStatistics:
    getPaymentStatisticsController,

  transactionStatistics:
    getPaymentTransactionStatisticsController,

  /* ------------------------------------------------------------------------
   * Query mapping
   * ------------------------------------------------------------------------
   */

  createPaymentCriteria:
    createPaymentSearchCriteria,

  createTransactionCriteria:
    createPaymentTransactionSearchCriteria,

  validatePagination:
    validatePaymentControllerPagination,

  /* ------------------------------------------------------------------------
   * Mapping helpers
   * ------------------------------------------------------------------------
   */

  assignString:
    assignPaymentControllerOptionalString,

  assignNumber:
    assignPaymentControllerOptionalNumber,

  /* ------------------------------------------------------------------------
   * Controller installation
   * ------------------------------------------------------------------------
   */

  attach:
    attachPaymentControllerPartCOperations,
} as const;

/* ============================================================================
 * End of Payment Controller - Part C
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Controller
 * Part D
 * ============================================================================
 *
 * Core mutation operations:
 *
 * - Create Payment
 * - Update Payment
 * - Change Payment status
 * - Cancel Payment
 * - Record successful collection
 * - Record failed collection
 *
 * IMPORTANT:
 *
 * - Request contracts derive from PaymentServicePort.
 * - Route paymentId is authoritative for route-scoped mutations.
 * - Controller performs transport-shape normalization only.
 * - Payment financial/business rules remain in PaymentService.
 * - Controller does not access repositories or Prisma.
 * ============================================================================
 */

/* ============================================================================
 * Service-derived mutation input contracts
 * ============================================================================
 */

export type CreatePaymentControllerBody =
  Parameters<
    PaymentServicePort[
      "createPayment"
    ]
  >[0];

export type UpdatePaymentControllerBody =
  Parameters<
    PaymentServicePort[
      "updatePayment"
    ]
  >[0];

export type ChangePaymentStatusControllerInput =
  Parameters<
    PaymentServicePort[
      "changeStatus"
    ]
  >[0];

export type CancelPaymentControllerInput =
  Parameters<
    PaymentServicePort[
      "cancelPayment"
    ]
  >[0];

export type RecordPaymentCollectionControllerInput =
  Parameters<
    PaymentServicePort[
      "recordCollection"
    ]
  >[0];

export type RecordFailedPaymentCollectionControllerInput =
  Parameters<
    PaymentServicePort[
      "recordFailedCollection"
    ]
  >[0];

/* ============================================================================
 * Service-derived mutation result contracts
 * ============================================================================
 */

export type CreatePaymentControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "createPayment"
      ]
    >
  >;

export type UpdatePaymentControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "updatePayment"
      ]
    >
  >;

export type ChangePaymentStatusControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "changeStatus"
      ]
    >
  >;

export type CancelPaymentControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "cancelPayment"
      ]
    >
  >;

export type RecordPaymentCollectionControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "recordCollection"
      ]
    >
  >;

export type RecordFailedPaymentCollectionControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "recordFailedCollection"
      ]
    >
  >;

/* ============================================================================
 * Transport body contracts
 * ============================================================================
 *
 * Route-scoped bodies intentionally keep all values unknown.
 *
 * This lets the controller safely normalize transport input before assigning
 * it to the exact PaymentServicePort-derived type.
 * ============================================================================
 */

export interface ChangePaymentStatusControllerBody
  extends PaymentControllerRecord {
  status?:
    unknown;

  updatedBy?:
    unknown;
}

export interface CancelPaymentControllerBody
  extends PaymentControllerRecord {
  reason?:
    unknown;

  cancelledBy?:
    unknown;
}

export interface RecordPaymentCollectionControllerBody
  extends PaymentControllerRecord {
  amount?:
    unknown;

  transactionId?:
    unknown;

  currency?:
    unknown;

  purpose?:
    unknown;

  method?:
    unknown;

  provider?:
    unknown;

  gateway?:
    unknown;

  remarks?:
    unknown;

  recordedBy?:
    unknown;

  completedAt?:
    unknown;

  updatedBy?:
    unknown;
}

export interface RecordFailedPaymentCollectionControllerBody
  extends PaymentControllerRecord {
  amount?:
    unknown;

  transactionId?:
    unknown;

  currency?:
    unknown;

  purpose?:
    unknown;

  method?:
    unknown;

  provider?:
    unknown;

  gateway?:
    unknown;

  reason?:
    unknown;

  message?:
    unknown;

  providerErrorCode?:
    unknown;

  remarks?:
    unknown;

  recordedBy?:
    unknown;

  failedAt?:
    unknown;

  updatedBy?:
    unknown;
}

/* ============================================================================
 * Body mapping error
 * ============================================================================
 */

export interface PaymentControllerMutationMappingIssue {
  field:
    string;

  code:
    string;

  message:
    string;

  value?:
    unknown;
}

export class PaymentControllerMutationMappingError
  extends Error {
  readonly mappingErrors:
    PaymentControllerMutationMappingIssue[];

  constructor(
    mappingErrors:
      PaymentControllerMutationMappingIssue[]
  ) {
    super(
      "Payment mutation request contains invalid values."
    );

    this.name =
      "PaymentControllerMutationMappingError";

    this.mappingErrors =
      mappingErrors;
  }
}

/* ============================================================================
 * Mutation mapping-error response
 * ============================================================================
 */

export function mapPaymentMutationMappingErrorToResponse(
  error:
    PaymentControllerMutationMappingError,
  requestId?:
    string
): PaymentControllerResponse<
  never
> {
  return createPaymentControllerBadRequest(
    "PAYMENT_REQUEST_MAPPING_FAILED",
    error.message,
    requestId,
    {
      mappingErrors:
        error.mappingErrors,
    }
  );
}

/* ============================================================================
 * Resolve mutation actor
 * ============================================================================
 */

/**
 * Authentication metadata is authoritative when available.
 *
 * Body-supplied actor values remain useful for trusted internal routes and
 * Postman/domain testing where authentication middleware may not yet exist.
 */
export function resolvePaymentControllerMutationActor(
  request:
    PaymentControllerRequest,
  bodyValue?:
    unknown
): string | undefined {
  return (
    getPaymentControllerAuthenticatedUserId(
      request
    ) ??
    normalizePaymentControllerOptionalString(
      bodyValue
    )
  );
}

/* ============================================================================
 * Required numeric body field
 * ============================================================================
 */

export function requirePaymentControllerPositiveAmount(
  value:
    unknown,
  field =
    "amount"
): number {
  const amount =
    normalizePaymentControllerNumber(
      value
    );

  if (
    amount ===
      undefined ||
    amount <=
      0
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field,

        code:
          "INVALID_AMOUNT",

        message:
          `${field} must contain a valid amount greater than zero.`,

        value,
      },
    ]);
  }

  return amount;
}

/* ============================================================================
 * Required string body field
 * ============================================================================
 */

export function requirePaymentControllerBodyString(
  value:
    unknown,
  field:
    string
): string {
  const normalized =
    normalizePaymentControllerOptionalString(
      value
    );

  if (
    !normalized
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field,

        code:
          "REQUIRED_FIELD",

        message:
          `${field} is required.`,

        value,
      },
    ]);
  }

  return normalized;
}

/* ============================================================================
 * Create Payment body mapping
 * ============================================================================
 */

/**
 * createPayment() already accepts the canonical Payment aggregate.
 *
 * Controller therefore verifies only that the HTTP body is an object and then
 * forwards that object through the exact service-owned parameter type.
 */
export function createPaymentControllerCreateInput(
  body:
    unknown
): CreatePaymentControllerBody {
  if (
    !isPaymentControllerBodyObject(
      body
    )
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field:
          "body",

        code:
          "INVALID_REQUEST_BODY",

        message:
          "Payment creation body must be a JSON object.",

        value:
          body,
      },
    ]);
  }

  const mappingErrors:
    PaymentControllerMutationMappingIssue[] =
      [];

  if (
    !isPaymentControllerBodyObject(
      body.payable
    )
  ) {
    mappingErrors.push({
      field:
        "payable",

      code:
        "INVALID_OBJECT",

      message:
        "payable must be a JSON object.",

      value:
        body.payable,
    });
  }

  if (
    !Array.isArray(
      body.transactions
    )
  ) {
    mappingErrors.push({
      field:
        "transactions",

      code:
        "INVALID_ARRAY",

      message:
        "transactions must be an array.",

      value:
        body.transactions,
    });
  }

  if (
    !isPaymentControllerBodyObject(
      body.refundSummary
    )
  ) {
    mappingErrors.push({
      field:
        "refundSummary",

      code:
        "INVALID_OBJECT",

      message:
        "refundSummary must be a JSON object.",

      value:
        body.refundSummary,
    });
  }

  if (
    !isPaymentControllerBodyObject(
      body.audit
    )
  ) {
    mappingErrors.push({
      field:
        "audit",

      code:
        "INVALID_OBJECT",

      message:
        "audit must be a JSON object.",

      value:
        body.audit,
    });
  }

  if (
    mappingErrors.length >
      0
  ) {
    throw new PaymentControllerMutationMappingError(
      mappingErrors
    );
  }

  return body as
    unknown as
      CreatePaymentControllerBody;
}

/* ============================================================================
 * Update Payment body mapping
 * ============================================================================
 */

export function createPaymentControllerUpdateInput(
  paymentId:
    string,
  body:
    unknown
): UpdatePaymentControllerBody {
  if (
    !isPaymentControllerBodyObject(
      body
    )
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field:
          "body",

        code:
          "INVALID_REQUEST_BODY",

        message:
          "Payment update body must be a JSON object.",

        value:
          body,
      },
    ]);
  }

  /**
   * Route ID wins over any body paymentId.
   *
   * This prevents:
   *
   * PATCH /api/payments/A
   *
   * {
   *   "paymentId": "B"
   * }
   *
   * from accidentally updating B.
   */
  return {
    ...body,

    paymentId,
  } as unknown as
    UpdatePaymentControllerBody;
}

/* ============================================================================
 * Status input mapping
 * ============================================================================
 */

export function createPaymentStatusControllerInput(
  paymentId:
    string,
  body:
    ChangePaymentStatusControllerBody,
  request:
    PaymentControllerRequest
): ChangePaymentStatusControllerInput {
  const status =
    requirePaymentControllerBodyString(
      body.status,
      "status"
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    status,

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as ChangePaymentStatusControllerInput;
}

/* ============================================================================
 * Cancellation input mapping
 * ============================================================================
 */

export function createCancelPaymentControllerInput(
  paymentId:
    string,
  body:
    CancelPaymentControllerBody,
  request:
    PaymentControllerRequest
): CancelPaymentControllerInput {
  const reason =
    normalizePaymentControllerOptionalString(
      body.reason
    );

  const cancelledBy =
    resolvePaymentControllerMutationActor(
      request,
      body.cancelledBy
    );

  return {
    paymentId,

    ...(reason
      ? {
          reason,
        }
      : {}),

    ...(cancelledBy
      ? {
          cancelledBy,
        }
      : {}),
  } as CancelPaymentControllerInput;
}

/* ============================================================================
 * Payment collection transport enum values
 * ============================================================================
 *
 * These are transport-boundary accepted values.
 *
 * They mirror the canonical Payment persistence/domain values while keeping
 * Prisma completely outside the controller layer.
 * ============================================================================
 */

export const PAYMENT_CONTROLLER_PURPOSE_VALUES =
  [
    "ADVANCE",
    "BALANCE",
    "FULL_PAYMENT",
    "ADDITIONAL",
  ] as const;

export type PaymentControllerPurpose =
  typeof PAYMENT_CONTROLLER_PURPOSE_VALUES[number];

export const PAYMENT_CONTROLLER_METHOD_VALUES =
  [
    "CASH",
    "UPI",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "CARD",
    "NET_BANKING",
    "NEFT",
    "RTGS",
    "IMPS",
    "BANK_TRANSFER",
    "CHEQUE",
    "WALLET",
    "RAZORPAY",
    "OTHER",
  ] as const;

export type PaymentControllerMethod =
  typeof PAYMENT_CONTROLLER_METHOD_VALUES[number];

export const PAYMENT_CONTROLLER_PROVIDER_VALUES =
  [
    "RAZORPAY",
    "MANUAL",
    "BANK",
    "OTHER",
  ] as const;

export type PaymentControllerProvider =
  typeof PAYMENT_CONTROLLER_PROVIDER_VALUES[number];

/* ============================================================================
 * Generic Payment controller enum normalization
 * ============================================================================
 */

function normalizePaymentControllerEnum<
  const TValues extends
    readonly string[]
>(
  value:
    unknown,
  field:
    string,
  allowedValues:
    TValues
): TValues[number] | undefined {
  const normalized =
    normalizePaymentControllerOptionalString(
      value
    );

  if (
    normalized ===
    undefined
  ) {
    return undefined;
  }

  const upper =
    normalized
      .toUpperCase();

  if (
    !allowedValues.includes(
      upper as
        TValues[number]
    )
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field,

        code:
          "INVALID_ENUM_VALUE",

        message:
          `${field} must be one of: ${allowedValues.join(", ")}.`,

        value,
      },
    ]);
  }

  return upper as
    TValues[number];
}

/* ============================================================================
 * Collection purpose normalization
 * ============================================================================
 */

export function normalizePaymentControllerPurpose(
  value:
    unknown
): PaymentControllerPurpose | undefined {
  return normalizePaymentControllerEnum(
    value,
    "purpose",
    PAYMENT_CONTROLLER_PURPOSE_VALUES
  );
}

/* ============================================================================
 * Collection method normalization
 * ============================================================================
 */

export function normalizePaymentControllerMethod(
  value:
    unknown
): PaymentControllerMethod | undefined {
  return normalizePaymentControllerEnum(
    value,
    "method",
    PAYMENT_CONTROLLER_METHOD_VALUES
  );
}

/* ============================================================================
 * Payment provider normalization
 * ============================================================================
 */

export function normalizePaymentControllerProvider(
  value:
    unknown,
  field:
    string =
      "provider"
): PaymentControllerProvider | undefined {
  return normalizePaymentControllerEnum(
    value,
    field,
    PAYMENT_CONTROLLER_PROVIDER_VALUES
  );
}

/* ============================================================================
 * Successful collection input mapping
 * ============================================================================
 */

export function createPaymentCollectionControllerInput(
  paymentId:
    string,
  body:
    RecordPaymentCollectionControllerBody,
  request:
    PaymentControllerRequest
): RecordPaymentCollectionControllerInput {
  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const currency =
    normalizePaymentControllerOptionalString(
      body.currency
    );

const purpose =
  normalizePaymentControllerPurpose(
    body.purpose
  );

const method =
  normalizePaymentControllerMethod(
    body.method
  );

const provider =
  normalizePaymentControllerProvider(
    body.provider
  );

  const remarks =
    normalizePaymentControllerOptionalString(
      body.remarks
    );

  const completedAt =
    normalizePaymentControllerDateString(
      body.completedAt
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    amount,

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(currency
      ? {
          currency,
        }
      : {}),

    ...(purpose
      ? {
          purpose,
        }
      : {}),

    ...(method
      ? {
          method,
        }
      : {}),

    ...(provider
      ? {
          provider,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.gateway
    )
      ? {
          gateway:
            body.gateway,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.recordedBy
    )
      ? {
          recordedBy:
            body.recordedBy,
        }
      : {}),

    ...(completedAt
      ? {
          completedAt,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as unknown as
    RecordPaymentCollectionControllerInput;
}

/* ============================================================================
 * Failed collection input mapping
 * ============================================================================
 */

export function createFailedPaymentCollectionControllerInput(
  paymentId:
    string,
  body:
    RecordFailedPaymentCollectionControllerBody,
  request:
    PaymentControllerRequest
): RecordFailedPaymentCollectionControllerInput {
  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const currency =
    normalizePaymentControllerOptionalString(
      body.currency
    );

  const purpose =
  normalizePaymentControllerPurpose(
    body.purpose
  );

const method =
  normalizePaymentControllerMethod(
    body.method
  );

const provider =
  normalizePaymentControllerProvider(
    body.provider
  );

  const reason =
    normalizePaymentControllerOptionalString(
      body.reason
    );

  const message =
    normalizePaymentControllerOptionalString(
      body.message
    );

  const providerErrorCode =
    normalizePaymentControllerOptionalString(
      body.providerErrorCode
    );

  const remarks =
    normalizePaymentControllerOptionalString(
      body.remarks
    );

  const failedAt =
    normalizePaymentControllerDateString(
      body.failedAt
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    amount,

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(currency
      ? {
          currency,
        }
      : {}),

    ...(purpose
      ? {
          purpose,
        }
      : {}),

    ...(method
      ? {
          method,
        }
      : {}),

    ...(provider
      ? {
          provider,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.gateway
    )
      ? {
          gateway:
            body.gateway,
        }
      : {}),

    ...(reason
      ? {
          reason,
        }
      : {}),

    ...(message
      ? {
          message,
        }
      : {}),

    ...(providerErrorCode
      ? {
          providerErrorCode,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.recordedBy
    )
      ? {
          recordedBy:
            body.recordedBy,
        }
      : {}),

    ...(failedAt
      ? {
          failedAt,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as unknown as
    RecordFailedPaymentCollectionControllerInput;
}

/* ============================================================================
 * Create Payment
 * ============================================================================
 */

export async function createPaymentMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown
    >
): Promise<
  PaymentControllerResponse<
    CreatePaymentControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const input =
      createPaymentControllerCreateInput(
        request.body
      );

    const payment =
      await paymentService
        .createPayment(
          input
        );

    return createPaymentControllerCreated(
      payment,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Update Payment
 * ============================================================================
 */

export async function updatePaymentController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    UpdatePaymentControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  try {
    const input =
      createPaymentControllerUpdateInput(
        paymentId.value,
        request.body
      );

    const payment =
      await paymentService
        .updatePayment(
          input
        );

    return createPaymentControllerOk(
      payment,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Change Payment status
 * ============================================================================
 */

export async function changePaymentStatusController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    ChangePaymentStatusControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createPaymentStatusControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const payment =
      await paymentService
        .changeStatus(
          input
        );

    return createPaymentControllerOk(
      payment,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Cancel Payment
 * ============================================================================
 */

export async function cancelPaymentController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    CancelPaymentControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  /**
   * Cancellation body is optional.
   *
   * A route may legitimately cancel with only:
   *
   * POST /api/payments/:paymentId/cancel
   *
   * when the actor comes from authentication metadata.
   */
  const body:
    CancelPaymentControllerBody =
      isPaymentControllerBodyObject(
        request.body
      )
        ? request.body
        : {};

  try {
    const input =
      createCancelPaymentControllerInput(
        paymentId.value,
        body,
        request
      );

    const payment =
      await paymentService
        .cancelPayment(
          input
        );

    return createPaymentControllerOk(
      payment,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Record successful collection
 * ============================================================================
 */

export async function recordPaymentCollectionController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    RecordPaymentCollectionControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createPaymentCollectionControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .recordCollection(
          input
        );

    return createPaymentControllerCreated(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Record failed collection
 * ============================================================================
 */

export async function recordFailedPaymentCollectionController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    RecordFailedPaymentCollectionControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createFailedPaymentCollectionControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .recordFailedCollection(
          input
        );

    return createPaymentControllerCreated(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Part D controller operation contract
 * ============================================================================
 */

export interface PaymentMutationControllerOperations {
  create(
  request:
    PaymentControllerRequest<
      unknown
    >
): ReturnType<
  typeof createPaymentMutationController
>;

  update(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof updatePaymentController
  >;

  changeStatus(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof changePaymentStatusController
  >;

  cancel(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof cancelPaymentController
  >;

  recordCollection(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof recordPaymentCollectionController
  >;

  recordFailedCollection(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof recordFailedPaymentCollectionController
  >;
}

/* ============================================================================
 * Attach Part D operations to existing PaymentController
 * ============================================================================
 *
 * PaymentController was declared in Part B.
 *
 * We deliberately extend its prototype rather than redeclaring the class.
 * ============================================================================
 */

export function attachPaymentControllerPartDOperations():
  void {
  const prototype =
    PaymentController
      .prototype as
        PaymentController &
        PaymentMutationControllerOperations;

  if (
    typeof prototype.create !==
      "function"
  ) {
    prototype.create =
      function (
        request
      ) {
        return createPaymentMutationController(
  {
    paymentService:
      this.paymentService,
  },
  request
);
      };
  }

  if (
    typeof prototype.update !==
      "function"
  ) {
    prototype.update =
      function (
        request
      ) {
        return updatePaymentController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.changeStatus !==
      "function"
  ) {
    prototype.changeStatus =
      function (
        request
      ) {
        return changePaymentStatusController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.cancel !==
      "function"
  ) {
    prototype.cancel =
      function (
        request
      ) {
        return cancelPaymentController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.recordCollection !==
      "function"
  ) {
    prototype.recordCollection =
      function (
        request
      ) {
        return recordPaymentCollectionController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.recordFailedCollection !==
      "function"
  ) {
    prototype.recordFailedCollection =
      function (
        request
      ) {
        return recordFailedPaymentCollectionController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }
}

/* ============================================================================
 * Install Part D operations
 * ============================================================================
 */

attachPaymentControllerPartDOperations();

/* ============================================================================
 * Part D facade
 * ============================================================================
 */

export const PaymentControllerPartD = {
  /* ------------------------------------------------------------------------
   * Core Payment
   * ------------------------------------------------------------------------
   */

  create:
  createPaymentMutationController,

  update:
    updatePaymentController,

  changeStatus:
    changePaymentStatusController,

  cancel:
    cancelPaymentController,

  /* ------------------------------------------------------------------------
   * Collections
   * ------------------------------------------------------------------------
   */

  recordCollection:
    recordPaymentCollectionController,

  recordFailedCollection:
    recordFailedPaymentCollectionController,

  /* ------------------------------------------------------------------------
   * Mapping
   * ------------------------------------------------------------------------
   */

  mapping: {
    create:
      createPaymentControllerCreateInput,

    update:
      createPaymentControllerUpdateInput,

    status:
      createPaymentStatusControllerInput,

    cancel:
      createCancelPaymentControllerInput,

    collection:
      createPaymentCollectionControllerInput,

    failedCollection:
      createFailedPaymentCollectionControllerInput,
  },

  /* ------------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------------
   */

  requireAmount:
    requirePaymentControllerPositiveAmount,

  requireString:
    requirePaymentControllerBodyString,

  resolveActor:
    resolvePaymentControllerMutationActor,

  mappingError:
    mapPaymentMutationMappingErrorToResponse,

  /* ------------------------------------------------------------------------
   * Installation
   * ------------------------------------------------------------------------
   */

  attach:
    attachPaymentControllerPartDOperations,
} as const;

/* ============================================================================
 * End of Payment Controller - Part D
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Controller
 * Part E
 * ============================================================================
 *
 * Refund + gateway-order operations:
 *
 * - Request refund
 * - Complete successful refund
 * - Mark refund failed
 * - Create gateway order
 * - Update gateway order
 * - Get gateway order
 *
 * IMPORTANT:
 *
 * - Input/output types derive from PaymentServicePort.
 * - Route identifiers are authoritative.
 * - Controller performs transport normalization only.
 * - Refund calculations remain in PaymentService.
 * - Gateway SDK/network operations remain outside this controller.
 * ============================================================================
 */

/* ============================================================================
 * Service-derived refund input contracts
 * ============================================================================
 */

export type RequestPaymentRefundControllerInput =
  Parameters<
    PaymentServicePort[
      "requestRefund"
    ]
  >[0];

export type CompletePaymentRefundControllerInput =
  Parameters<
    PaymentServicePort[
      "completeRefund"
    ]
  >[0];

export type FailPaymentRefundControllerInput =
  Parameters<
    PaymentServicePort[
      "failRefund"
    ]
  >[0];

/* ============================================================================
 * Service-derived gateway input contracts
 * ============================================================================
 */

export type CreatePaymentGatewayOrderControllerInput =
  Parameters<
    PaymentServicePort[
      "createGatewayOrder"
    ]
  >[0];

export type UpdatePaymentGatewayOrderControllerInput =
  Parameters<
    PaymentServicePort[
      "updateGatewayOrder"
    ]
  >[0];

/* ============================================================================
 * Service-derived result contracts
 * ============================================================================
 */

export type RequestPaymentRefundControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "requestRefund"
      ]
    >
  >;

export type CompletePaymentRefundControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "completeRefund"
      ]
    >
  >;

export type FailPaymentRefundControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "failRefund"
      ]
    >
  >;

export type CreatePaymentGatewayOrderControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "createGatewayOrder"
      ]
    >
  >;

export type UpdatePaymentGatewayOrderControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "updateGatewayOrder"
      ]
    >
  >;

export type GetPaymentGatewayOrderControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getGatewayOrder"
      ]
    >
  >;

/* ============================================================================
 * Refund transport bodies
 * ============================================================================
 */

export interface RequestPaymentRefundControllerBody
  extends PaymentControllerRecord {
  amount?:
    unknown;

  transactionId?:
    unknown;

  provider?:
    unknown;

  gateway?:
    unknown;

  reason?:
    unknown;

  remarks?:
    unknown;

  recordedBy?:
    unknown;

  requestedAt?:
    unknown;

  updatedBy?:
    unknown;
}

export interface CompletePaymentRefundControllerBody
  extends PaymentControllerRecord {
  amount?:
    unknown;

  transactionId?:
    unknown;

  provider?:
    unknown;

  gateway?:
    unknown;

  remarks?:
    unknown;

  recordedBy?:
    unknown;

  refundedAt?:
    unknown;

  updatedBy?:
    unknown;
}

export interface FailPaymentRefundControllerBody
  extends PaymentControllerRecord {
  amount?:
    unknown;

  transactionId?:
    unknown;

  provider?:
    unknown;

  gateway?:
    unknown;

  reason?:
    unknown;

  message?:
    unknown;

  providerErrorCode?:
    unknown;

  remarks?:
    unknown;

  recordedBy?:
    unknown;

  failedAt?:
    unknown;

  updatedBy?:
    unknown;
}

/* ============================================================================
 * Gateway-order transport bodies
 * ============================================================================
 */

export interface CreatePaymentGatewayOrderControllerBody
  extends PaymentControllerRecord {
  provider?:
    unknown;

  gatewayOrderId?:
    unknown;

  amount?:
    unknown;

  currency?:
    unknown;

  status?:
    unknown;

  receiptReference?:
    unknown;

  metadata?:
    unknown;
}

export interface UpdatePaymentGatewayOrderControllerBody
  extends PaymentControllerRecord {
  status?:
    unknown;

  metadata?:
    unknown;

  updatedAt?:
    unknown;
}

/* ============================================================================
 * Refund request mapper
 * ============================================================================
 */

export function createRequestPaymentRefundControllerInput(
  paymentId:
    string,
  body:
    RequestPaymentRefundControllerBody,
  request:
    PaymentControllerRequest
): RequestPaymentRefundControllerInput {
  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const provider =
    normalizePaymentControllerOptionalString(
      body.provider
    );

  const reason =
    normalizePaymentControllerOptionalString(
      body.reason
    );

  const remarks =
    normalizePaymentControllerOptionalString(
      body.remarks
    );

  const requestedAt =
    normalizePaymentControllerDateString(
      body.requestedAt
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    amount,

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(provider
      ? {
          provider,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.gateway
    )
      ? {
          gateway:
            body.gateway,
        }
      : {}),

    ...(reason
      ? {
          reason,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.recordedBy
    )
      ? {
          recordedBy:
            body.recordedBy,
        }
      : {}),

    ...(requestedAt
      ? {
          requestedAt,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as unknown as
    RequestPaymentRefundControllerInput;
}

/* ============================================================================
 * Successful refund mapper
 * ============================================================================
 */

export function createCompletePaymentRefundControllerInput(
  paymentId:
    string,
  body:
    CompletePaymentRefundControllerBody,
  request:
    PaymentControllerRequest
): CompletePaymentRefundControllerInput {
  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const provider =
    normalizePaymentControllerOptionalString(
      body.provider
    );

  const remarks =
    normalizePaymentControllerOptionalString(
      body.remarks
    );

  const refundedAt =
    normalizePaymentControllerDateString(
      body.refundedAt
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    amount,

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(provider
      ? {
          provider,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.gateway
    )
      ? {
          gateway:
            body.gateway,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.recordedBy
    )
      ? {
          recordedBy:
            body.recordedBy,
        }
      : {}),

    ...(refundedAt
      ? {
          refundedAt,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as unknown as
    CompletePaymentRefundControllerInput;
}

/* ============================================================================
 * Failed refund mapper
 * ============================================================================
 */

export function createFailPaymentRefundControllerInput(
  paymentId:
    string,
  body:
    FailPaymentRefundControllerBody,
  request:
    PaymentControllerRequest
): FailPaymentRefundControllerInput {
  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const provider =
    normalizePaymentControllerOptionalString(
      body.provider
    );

  const reason =
    normalizePaymentControllerOptionalString(
      body.reason
    );

  const message =
    normalizePaymentControllerOptionalString(
      body.message
    );

  const providerErrorCode =
    normalizePaymentControllerOptionalString(
      body.providerErrorCode
    );

  const remarks =
    normalizePaymentControllerOptionalString(
      body.remarks
    );

  const failedAt =
    normalizePaymentControllerDateString(
      body.failedAt
    );

  const updatedBy =
    resolvePaymentControllerMutationActor(
      request,
      body.updatedBy
    );

  return {
    paymentId,

    amount,

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(provider
      ? {
          provider,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.gateway
    )
      ? {
          gateway:
            body.gateway,
        }
      : {}),

    ...(reason
      ? {
          reason,
        }
      : {}),

    ...(message
      ? {
          message,
        }
      : {}),

    ...(providerErrorCode
      ? {
          providerErrorCode,
        }
      : {}),

    ...(remarks
      ? {
          remarks,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.recordedBy
    )
      ? {
          recordedBy:
            body.recordedBy,
        }
      : {}),

    ...(failedAt
      ? {
          failedAt,
        }
      : {}),

    ...(updatedBy
      ? {
          updatedBy,
        }
      : {}),
  } as unknown as
    FailPaymentRefundControllerInput;
}

/* ============================================================================
 * Gateway-order creation mapper
 * ============================================================================
 */

export function createGatewayOrderControllerInput(
  paymentId:
    string,
  body:
    CreatePaymentGatewayOrderControllerBody
): CreatePaymentGatewayOrderControllerInput {
  const provider =
    requirePaymentControllerBodyString(
      body.provider,
      "provider"
    );

  const gatewayOrderId =
    requirePaymentControllerBodyString(
      body.gatewayOrderId,
      "gatewayOrderId"
    );

  const amount =
    requirePaymentControllerPositiveAmount(
      body.amount
    );

  const currency =
    normalizePaymentControllerOptionalString(
      body.currency
    );

  const status =
    normalizePaymentControllerOptionalString(
      body.status
    );

  const receiptReference =
    normalizePaymentControllerOptionalString(
      body.receiptReference
    );

  return {
    paymentId,

    provider,

    gatewayOrderId,

    amount,

    ...(currency
      ? {
          currency,
        }
      : {}),

    ...(status
      ? {
          status,
        }
      : {}),

    ...(receiptReference
      ? {
          receiptReference,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.metadata
    )
      ? {
          metadata:
            body.metadata,
        }
      : {}),
  } as unknown as
    CreatePaymentGatewayOrderControllerInput;
}

/* ============================================================================
 * Gateway-order update mapper
 * ============================================================================
 */

export function createUpdateGatewayOrderControllerInput(
  gatewayOrderId:
    string,
  body:
    UpdatePaymentGatewayOrderControllerBody
): UpdatePaymentGatewayOrderControllerInput {
  const status =
    normalizePaymentControllerOptionalString(
      body.status
    );

  const updatedAt =
    normalizePaymentControllerDateString(
      body.updatedAt
    );

  return {
    gatewayOrderId,

    ...(status
      ? {
          status,
        }
      : {}),

    ...(isPaymentControllerRecord(
      body.metadata
    )
      ? {
          metadata:
            body.metadata,
        }
      : {}),

    ...(updatedAt
      ? {
          updatedAt,
        }
      : {}),
  } as unknown as
    UpdatePaymentGatewayOrderControllerInput;
}

/* ============================================================================
 * Request refund controller
 * ============================================================================
 */

export async function requestPaymentRefundController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    RequestPaymentRefundControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createRequestPaymentRefundControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .requestRefund(
          input
        );

    return createPaymentControllerCreated(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Complete refund controller
 * ============================================================================
 */

export async function completePaymentRefundController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    CompletePaymentRefundControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createCompletePaymentRefundControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .completeRefund(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Fail refund controller
 * ============================================================================
 */

export async function failPaymentRefundController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    FailPaymentRefundControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createFailPaymentRefundControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .failRefund(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Create gateway order controller
 * ============================================================================
 */

export async function createPaymentGatewayOrderMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    CreatePaymentGatewayOrderControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createGatewayOrderControllerInput(
        paymentId.value,
        body.value
      );

    const result =
      await paymentService
        .createGatewayOrder(
          input
        );

    return createPaymentControllerCreated(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Update gateway order controller
 * ============================================================================
 */

export async function updatePaymentGatewayOrderMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentGatewayOrderRouteParams
    >
): Promise<
  PaymentControllerResponse<
    UpdatePaymentGatewayOrderControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const gatewayOrderId =
    requirePaymentControllerParam(
      request,
      "gatewayOrderId"
    );

  if (
    !gatewayOrderId.success
  ) {
    return gatewayOrderId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createUpdateGatewayOrderControllerInput(
        gatewayOrderId.value,
        body.value
      );

    const result =
      await paymentService
        .updateGatewayOrder(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Get gateway order controller
 * ============================================================================
 */

export async function getPaymentGatewayOrderByIdController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentGatewayOrderRouteParams
    >
): Promise<
  PaymentControllerResponse<
    NonNullable<
      GetPaymentGatewayOrderControllerData
    >
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const gatewayOrderId =
    requirePaymentControllerParam(
      request,
      "gatewayOrderId"
    );

  if (
    !gatewayOrderId.success
  ) {
    return gatewayOrderId.response;
  }

  try {
    const result =
      await paymentService
        .getGatewayOrder(
          gatewayOrderId.value
        );

    return createPaymentControllerNullableReadResponse(
      result,
      request.requestId,
      "PAYMENT_GATEWAY_ORDER_NOT_FOUND",
      "Payment gateway order was not found.",
      {
        gatewayOrderId:
          gatewayOrderId.value,
      }
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Part E controller operations
 * ============================================================================
 */

export interface PaymentRefundGatewayControllerOperations {
  requestRefund(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof requestPaymentRefundController
  >;

  completeRefund(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof completePaymentRefundController
  >;

  failRefund(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof failPaymentRefundController
  >;

  createGatewayOrder(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof createPaymentGatewayOrderMutationController
  >;

  updateGatewayOrder(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentGatewayOrderRouteParams
      >
  ): ReturnType<
    typeof updatePaymentGatewayOrderMutationController
  >;

  getGatewayOrder(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentGatewayOrderRouteParams
      >
  ): ReturnType<
    typeof getPaymentGatewayOrderByIdController
  >;
}

/* ============================================================================
 * Attach Part E operations
 * ============================================================================
 */

export function attachPaymentControllerPartEOperations():
  void {
  const prototype =
    PaymentController
      .prototype as
        PaymentController &
        PaymentRefundGatewayControllerOperations;

  if (
    typeof prototype.requestRefund !==
      "function"
  ) {
    prototype.requestRefund =
      function (
        request
      ) {
        return requestPaymentRefundController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.completeRefund !==
      "function"
  ) {
    prototype.completeRefund =
      function (
        request
      ) {
        return completePaymentRefundController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.failRefund !==
      "function"
  ) {
    prototype.failRefund =
      function (
        request
      ) {
        return failPaymentRefundController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.createGatewayOrder !==
      "function"
  ) {
    prototype.createGatewayOrder =
      function (
        request
      ) {
        return createPaymentGatewayOrderMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.updateGatewayOrder !==
      "function"
  ) {
    prototype.updateGatewayOrder =
      function (
        request
      ) {
        return updatePaymentGatewayOrderMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.getGatewayOrder !==
      "function"
  ) {
    prototype.getGatewayOrder =
      function (
        request
      ) {
        return getPaymentGatewayOrderByIdController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }
}

/* ============================================================================
 * Install Part E
 * ============================================================================
 */

attachPaymentControllerPartEOperations();

/* ============================================================================
 * Part E facade
 * ============================================================================
 */

export const PaymentControllerPartE = {
  refunds: {
    request:
      requestPaymentRefundController,

    complete:
      completePaymentRefundController,

    fail:
      failPaymentRefundController,
  },

  gatewayOrders: {
    create:
      createPaymentGatewayOrderMutationController,

    update:
      updatePaymentGatewayOrderMutationController,

    get:
      getPaymentGatewayOrderByIdController,
  },

  mapping: {
    requestRefund:
      createRequestPaymentRefundControllerInput,

    completeRefund:
      createCompletePaymentRefundControllerInput,

    failRefund:
      createFailPaymentRefundControllerInput,

    createGatewayOrder:
      createGatewayOrderControllerInput,

    updateGatewayOrder:
      createUpdateGatewayOrderControllerInput,
  },

  attach:
    attachPaymentControllerPartEOperations,
} as const;

/* ============================================================================
 * End of Payment Controller - Part E
 * ============================================================================
 */
/* ============================================================================
 * EasyMovers
 * Payment Controller
 * Part F
 * ============================================================================
 *
 * Final operational controller layer:
 *
 * - Record webhook
 * - Complete webhook
 * - Fail webhook
 * - Webhook idempotency check
 * - Reconcile Payment
 * - Bulk Payment lookup
 * - Bulk Payment status update
 * - Capability state
 * - Final composed controller contract
 *
 * IMPORTANT:
 *
 * - Controller owns transport mapping only.
 * - PaymentService remains the business boundary.
 * - Webhook signature verification belongs to gateway adapters.
 * - Repository/Prisma access remains prohibited here.
 * ============================================================================
 */

/* ============================================================================
 * Service-derived webhook input contracts
 * ============================================================================
 */

export type RecordPaymentWebhookControllerInput =
  Parameters<
    PaymentServicePort[
      "recordWebhook"
    ]
  >[0];

export type CompletePaymentWebhookControllerInput =
  Parameters<
    PaymentServicePort[
      "completeWebhook"
    ]
  >[0];

export type FailPaymentWebhookControllerInput =
  Parameters<
    PaymentServicePort[
      "failWebhook"
    ]
  >[0];

/* ============================================================================
 * Service-derived reconciliation / bulk contracts
 * ============================================================================
 */

export type ReconcilePaymentControllerInput =
  Parameters<
    PaymentServicePort[
      "reconcile"
    ]
  >[0];

export type PaymentBulkLookupControllerInput =
  Parameters<
    PaymentServicePort[
      "getManyByIds"
    ]
  >[0];

export type PaymentBulkStatusControllerInput =
  Parameters<
    PaymentServicePort[
      "changeManyStatuses"
    ]
  >[0];

/* ============================================================================
 * Service-derived result contracts
 * ============================================================================
 */

export type RecordPaymentWebhookControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "recordWebhook"
      ]
    >
  >;

export type CompletePaymentWebhookControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "completeWebhook"
      ]
    >
  >;

export type FailPaymentWebhookControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "failWebhook"
      ]
    >
  >;

export type PaymentWebhookExistsControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "webhookEventExists"
      ]
    >
  >;

export type ReconcilePaymentControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "reconcile"
      ]
    >
  >;

export type PaymentBulkLookupControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "getManyByIds"
      ]
    >
  >;

export type PaymentBulkStatusControllerData =
  Awaited<
    ReturnType<
      PaymentServicePort[
        "changeManyStatuses"
      ]
    >
  >;

export type PaymentCapabilityControllerData =
  ReturnType<
    PaymentServicePort[
      "getCapabilities"
    ]
  >;

/* ============================================================================
 * Webhook transport bodies
 * ============================================================================
 */

export interface RecordPaymentWebhookControllerBody
  extends PaymentControllerRecord {
  webhookId?:
    unknown;

  provider?:
    unknown;

  eventType?:
    unknown;

  providerEventId?:
    unknown;

  payloadHash?:
    unknown;

  gatewayOrderId?:
    unknown;

  gatewayPaymentId?:
    unknown;

  paymentId?:
    unknown;

  transactionId?:
    unknown;

  receivedAt?:
    unknown;
}

export interface CompletePaymentWebhookControllerBody
  extends PaymentControllerRecord {
  paymentId?:
    unknown;

  transactionId?:
    unknown;

  processedAt?:
    unknown;
}

export interface FailPaymentWebhookControllerBody
  extends PaymentControllerRecord {
  errorCode?:
    unknown;

  errorMessage?:
    unknown;

  processedAt?:
    unknown;
}

/* ============================================================================
 * Webhook idempotency query
 * ============================================================================
 */

export interface PaymentWebhookExistsQueryParams
  extends PaymentControllerRecord {
  provider?:
    unknown;

  providerEventId?:
    unknown;
}

/* ============================================================================
 * Reconciliation transport body
 * ============================================================================
 */

export interface ReconcilePaymentControllerBody
  extends PaymentControllerRecord {
  observed?:
    unknown;

  reconciledBy?:
    unknown;
}

/* ============================================================================
 * Bulk transport bodies
 * ============================================================================
 */

export interface PaymentBulkLookupControllerBody
  extends PaymentControllerRecord {
  paymentIds?:
    unknown;
}

export interface PaymentBulkStatusControllerBody
  extends PaymentControllerRecord {
  items?:
    unknown;
}

/* ============================================================================
 * Record webhook mapper
 * ============================================================================
 */

export function createRecordPaymentWebhookControllerInput(
  body:
    RecordPaymentWebhookControllerBody
): RecordPaymentWebhookControllerInput {
  const webhookId =
    requirePaymentControllerBodyString(
      body.webhookId,
      "webhookId"
    );

  const provider =
    requirePaymentControllerBodyString(
      body.provider,
      "provider"
    );

  const eventType =
    requirePaymentControllerBodyString(
      body.eventType,
      "eventType"
    );

  const providerEventId =
    normalizePaymentControllerOptionalString(
      body.providerEventId
    );

  const payloadHash =
    normalizePaymentControllerOptionalString(
      body.payloadHash
    );

  const gatewayOrderId =
    normalizePaymentControllerOptionalString(
      body.gatewayOrderId
    );

  const gatewayPaymentId =
    normalizePaymentControllerOptionalString(
      body.gatewayPaymentId
    );

  const paymentId =
    normalizePaymentControllerOptionalString(
      body.paymentId
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const receivedAt =
    normalizePaymentControllerDateString(
      body.receivedAt
    );

  return {
    webhookId,

    provider,

    eventType,

    ...(providerEventId
      ? {
          providerEventId,
        }
      : {}),

    ...(payloadHash
      ? {
          payloadHash,
        }
      : {}),

    ...(gatewayOrderId
      ? {
          gatewayOrderId,
        }
      : {}),

    ...(gatewayPaymentId
      ? {
          gatewayPaymentId,
        }
      : {}),

    ...(paymentId
      ? {
          paymentId,
        }
      : {}),

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(receivedAt
      ? {
          receivedAt,
        }
      : {}),
  } as unknown as
    RecordPaymentWebhookControllerInput;
}

/* ============================================================================
 * Complete webhook mapper
 * ============================================================================
 */

export function createCompletePaymentWebhookControllerInput(
  webhookId:
    string,
  body:
    CompletePaymentWebhookControllerBody
): CompletePaymentWebhookControllerInput {
  const paymentId =
    normalizePaymentControllerOptionalString(
      body.paymentId
    );

  const transactionId =
    normalizePaymentControllerOptionalString(
      body.transactionId
    );

  const processedAt =
    normalizePaymentControllerDateString(
      body.processedAt
    );

  return {
    webhookId,

    ...(paymentId
      ? {
          paymentId,
        }
      : {}),

    ...(transactionId
      ? {
          transactionId,
        }
      : {}),

    ...(processedAt
      ? {
          processedAt,
        }
      : {}),
  } as CompletePaymentWebhookControllerInput;
}

/* ============================================================================
 * Fail webhook mapper
 * ============================================================================
 */

export function createFailPaymentWebhookControllerInput(
  webhookId:
    string,
  body:
    FailPaymentWebhookControllerBody
): FailPaymentWebhookControllerInput {
  const errorCode =
    normalizePaymentControllerOptionalString(
      body.errorCode
    );

  const errorMessage =
    normalizePaymentControllerOptionalString(
      body.errorMessage
    );

  const processedAt =
    normalizePaymentControllerDateString(
      body.processedAt
    );

  return {
    webhookId,

    ...(errorCode
      ? {
          errorCode,
        }
      : {}),

    ...(errorMessage
      ? {
          errorMessage,
        }
      : {}),

    ...(processedAt
      ? {
          processedAt,
        }
      : {}),
  } as FailPaymentWebhookControllerInput;
}

/* ============================================================================
 * Reconciliation mapper
 * ============================================================================
 */

export function createReconcilePaymentControllerInput(
  paymentId:
    string,
  body:
    ReconcilePaymentControllerBody,
  request:
    PaymentControllerRequest
): ReconcilePaymentControllerInput {
  if (
    !isPaymentControllerRecord(
      body.observed
    )
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field:
          "observed",

        code:
          "INVALID_RECONCILIATION_OBSERVED",

        message:
          "observed must be a JSON object.",

        value:
          body.observed,
      },
    ]);
  }

  const reconciledBy =
    resolvePaymentControllerMutationActor(
      request,
      body.reconciledBy
    );

  return {
    paymentId,

    observed:
      body.observed,

    ...(reconciledBy
      ? {
          reconciledBy,
        }
      : {}),
  } as unknown as
    ReconcilePaymentControllerInput;
}

/* ============================================================================
 * Bulk lookup mapper
 * ============================================================================
 */

export function createPaymentBulkLookupControllerInput(
  body:
    PaymentBulkLookupControllerBody
): PaymentBulkLookupControllerInput {
  const paymentIds =
    Array.isArray(
      body.paymentIds
    )
      ? body.paymentIds
          .map(
            (
              item
            ) =>
              normalizePaymentControllerOptionalString(
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
          )
      : [];

  if (
    paymentIds.length ===
      0
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field:
          "paymentIds",

        code:
          "REQUIRED_FIELD",

        message:
          "paymentIds must contain at least one valid Payment ID.",

        value:
          body.paymentIds,
      },
    ]);
  }

  return {
    paymentIds,
  } as unknown as
    PaymentBulkLookupControllerInput;
}

/* ============================================================================
 * Bulk status mapper
 * ============================================================================
 */

export function createPaymentBulkStatusControllerInput(
  body:
    PaymentBulkStatusControllerBody
): PaymentBulkStatusControllerInput {
  if (
    !Array.isArray(
      body.items
    ) ||
    body.items.length ===
      0
  ) {
    throw new PaymentControllerMutationMappingError([
      {
        field:
          "items",

        code:
          "REQUIRED_FIELD",

        message:
          "items must contain at least one Payment status update.",

        value:
          body.items,
      },
    ]);
  }

  const items =
    body.items.map(
      (
        item,
        index
      ) => {
        if (
          !isPaymentControllerRecord(
            item
          )
        ) {
          throw new PaymentControllerMutationMappingError([
            {
              field:
                `items[${index}]`,

              code:
                "INVALID_ITEM",

              message:
                `items[${index}] must be a JSON object.`,

              value:
                item,
            },
          ]);
        }

        const paymentId =
          requirePaymentControllerBodyString(
            item.paymentId,
            `items[${index}].paymentId`
          );

        const status =
          requirePaymentControllerBodyString(
            item.status,
            `items[${index}].status`
          );

        const updatedBy =
          normalizePaymentControllerOptionalString(
            item.updatedBy
          );

        const updatedAt =
          normalizePaymentControllerDateString(
            item.updatedAt
          );

        return {
          paymentId,

          status,

          ...(updatedBy
            ? {
                updatedBy,
              }
            : {}),

          ...(updatedAt
            ? {
                updatedAt,
              }
            : {}),
        };
      }
    );

  return {
    items,
  } as unknown as
    PaymentBulkStatusControllerInput;
}

/* ============================================================================
 * Record webhook controller
 * ============================================================================
 */

export async function recordPaymentWebhookMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    RecordPaymentWebhookControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createRecordPaymentWebhookControllerInput(
        body.value
      );

    const result =
      await paymentService
        .recordWebhook(
          input
        );

    /**
     * Duplicate webhook events are idempotent successes.
     *
     * They must not be treated as 409 failures because the provider may
     * legitimately retry delivery.
     */
    return createPaymentControllerCreated(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Complete webhook controller
 * ============================================================================
 */

export async function completePaymentWebhookMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentWebhookRouteParams
    >
): Promise<
  PaymentControllerResponse<
    CompletePaymentWebhookControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const webhookId =
    requirePaymentControllerParam(
      request,
      "webhookId"
    );

  if (
    !webhookId.success
  ) {
    return webhookId.response;
  }

  const body:
    CompletePaymentWebhookControllerBody =
      isPaymentControllerBodyObject(
        request.body
      )
        ? request.body
        : {};

  try {
    const input =
      createCompletePaymentWebhookControllerInput(
        webhookId.value,
        body
      );

    const result =
      await paymentService
        .completeWebhook(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Fail webhook controller
 * ============================================================================
 */

export async function failPaymentWebhookMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentWebhookRouteParams
    >
): Promise<
  PaymentControllerResponse<
    FailPaymentWebhookControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const webhookId =
    requirePaymentControllerParam(
      request,
      "webhookId"
    );

  if (
    !webhookId.success
  ) {
    return webhookId.response;
  }

  const body:
    FailPaymentWebhookControllerBody =
      isPaymentControllerBodyObject(
        request.body
      )
        ? request.body
        : {};

  try {
    const input =
      createFailPaymentWebhookControllerInput(
        webhookId.value,
        body
      );

    const result =
      await paymentService
        .failWebhook(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Webhook idempotency controller
 * ============================================================================
 */

export async function checkPaymentWebhookEventController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentControllerRecord,
      PaymentWebhookExistsQueryParams
    >
): Promise<
  PaymentControllerResponse<{
    exists:
      PaymentWebhookExistsControllerData;
  }>
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const provider =
      requirePaymentControllerBodyString(
        request.query
          ?.provider,
        "provider"
      );

    const providerEventId =
      requirePaymentControllerBodyString(
        request.query
          ?.providerEventId,
        "providerEventId"
      );

    const exists =
      await paymentService
        .webhookEventExists(
          provider as Parameters<
            PaymentServicePort[
              "webhookEventExists"
            ]
          >[0],
          providerEventId
        );

    return createPaymentControllerOk(
      {
        exists,
      },
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Reconcile Payment controller
 * ============================================================================
 */

export async function reconcilePaymentMutationController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest<
      unknown,
      PaymentIdRouteParams
    >
): Promise<
  PaymentControllerResponse<
    ReconcilePaymentControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const paymentId =
    requirePaymentControllerParam(
      request,
      "paymentId"
    );

  if (
    !paymentId.success
  ) {
    return paymentId.response;
  }

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createReconcilePaymentControllerInput(
        paymentId.value,
        body.value,
        request
      );

    const result =
      await paymentService
        .reconcile(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Bulk lookup controller
 * ============================================================================
 */

export async function getPaymentsBulkController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    PaymentBulkLookupControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createPaymentBulkLookupControllerInput(
        body.value
      );

    const result =
      await paymentService
        .getManyByIds(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Bulk status update controller
 * ============================================================================
 */

export async function changePaymentsBulkStatusController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    PaymentBulkStatusControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  const body =
    requirePaymentControllerBody(
      request
    );

  if (
    !body.success
  ) {
    return body.response;
  }

  try {
    const input =
      createPaymentBulkStatusControllerInput(
        body.value
      );

    const result =
      await paymentService
        .changeManyStatuses(
          input
        );

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        PaymentControllerMutationMappingError
    ) {
      return mapPaymentMutationMappingErrorToResponse(
        error,
        request.requestId
      );
    }

    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Capability controller
 * ============================================================================
 */

export async function getPaymentCapabilitiesController(
  dependencies:
    PaymentControllerDependencies,
  request:
    PaymentControllerRequest
): Promise<
  PaymentControllerResponse<
    PaymentCapabilityControllerData
  >
> {
  const {
    paymentService,
  } =
    requirePaymentControllerDependencies(
      dependencies
    );

  try {
    const result =
      paymentService
        .getCapabilities();

    return createPaymentControllerOk(
      result,
      request.requestId
    );
  } catch (
    error
  ) {
    return handlePaymentControllerError(
      error,
      request.requestId
    );
  }
}

/* ============================================================================
 * Part F controller operation contract
 * ============================================================================
 */

export interface PaymentOperationalControllerOperations {
  recordWebhook(
    request:
      PaymentControllerRequest
  ): ReturnType<
    typeof recordPaymentWebhookMutationController
  >;

  completeWebhook(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentWebhookRouteParams
      >
  ): ReturnType<
    typeof completePaymentWebhookMutationController
  >;

  failWebhook(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentWebhookRouteParams
      >
  ): ReturnType<
    typeof failPaymentWebhookMutationController
  >;

  checkWebhookEvent(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentControllerRecord,
        PaymentWebhookExistsQueryParams
      >
  ): ReturnType<
    typeof checkPaymentWebhookEventController
  >;

  reconcile(
    request:
      PaymentControllerRequest<
        unknown,
        PaymentIdRouteParams
      >
  ): ReturnType<
    typeof reconcilePaymentMutationController
  >;

  getManyByIds(
    request:
      PaymentControllerRequest
  ): ReturnType<
    typeof getPaymentsBulkController
  >;

  changeManyStatuses(
    request:
      PaymentControllerRequest
  ): ReturnType<
    typeof changePaymentsBulkStatusController
  >;

  capabilities(
    request:
      PaymentControllerRequest
  ): ReturnType<
    typeof getPaymentCapabilitiesController
  >;
}

/* ============================================================================
 * Attach Part F operations
 * ============================================================================
 */

export function attachPaymentControllerPartFOperations():
  void {
  const prototype =
    PaymentController
      .prototype as
        PaymentController &
        PaymentOperationalControllerOperations;

  if (
    typeof prototype.recordWebhook !==
      "function"
  ) {
    prototype.recordWebhook =
      function (
        request
      ) {
        return recordPaymentWebhookMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.completeWebhook !==
      "function"
  ) {
    prototype.completeWebhook =
      function (
        request
      ) {
        return completePaymentWebhookMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.failWebhook !==
      "function"
  ) {
    prototype.failWebhook =
      function (
        request
      ) {
        return failPaymentWebhookMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.checkWebhookEvent !==
      "function"
  ) {
    prototype.checkWebhookEvent =
      function (
        request
      ) {
        return checkPaymentWebhookEventController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.reconcile !==
      "function"
  ) {
    prototype.reconcile =
      function (
        request
      ) {
        return reconcilePaymentMutationController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.getManyByIds !==
      "function"
  ) {
    prototype.getManyByIds =
      function (
        request
      ) {
        return getPaymentsBulkController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.changeManyStatuses !==
      "function"
  ) {
    prototype.changeManyStatuses =
      function (
        request
      ) {
        return changePaymentsBulkStatusController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }

  if (
    typeof prototype.capabilities !==
      "function"
  ) {
    prototype.capabilities =
      function (
        request
      ) {
        return getPaymentCapabilitiesController(
          {
            paymentService:
              this.paymentService,
          },
          request
        );
      };
  }
}

/* ============================================================================
 * Install Part F
 * ============================================================================
 */

attachPaymentControllerPartFOperations();

/* ============================================================================
 * Complete controller composed type
 * ============================================================================
 */

export type CompletePaymentController =
  PaymentController &
  PaymentSearchControllerOperations &
  PaymentMutationControllerOperations &
  PaymentRefundGatewayControllerOperations &
  PaymentOperationalControllerOperations;

/* ============================================================================
 * Complete controller factory
 * ============================================================================
 */

export function createCompletePaymentController(
  dependencies:
    PaymentControllerDependencies
): CompletePaymentController {
  return createPaymentController(
    dependencies
  ) as CompletePaymentController;
}

/* ============================================================================
 * Complete Payment Controller facade
 * ============================================================================
 */

export const CompletePaymentControllerFacade = {
  /* ------------------------------------------------------------------------
   * Factory
   * ------------------------------------------------------------------------
   */

  create:
    createCompletePaymentController,

  /* ------------------------------------------------------------------------
   * Reads
   * ------------------------------------------------------------------------
   */

  reads: {
    byId:
      getPaymentByIdController,

    byNumber:
      getPaymentByNumberController,

    byReference:
      getPaymentByReferenceIdController,

    byBooking:
      getPaymentByBookingIdController,

    byQuotation:
      getPaymentByQuotationIdController,

    transactions:
      getPaymentTransactionsController,

    transactionById:
      getPaymentTransactionByIdController,

    transactionByGatewayPayment:
      getTransactionByGatewayPaymentIdController,

    transactionsByGatewayOrder:
      getTransactionsByGatewayOrderIdController,

    gatewayOrders:
      getPaymentGatewayOrdersController,

    gatewayOrder:
      getPaymentGatewayOrderByIdController,
  },

  /* ------------------------------------------------------------------------
   * Search/reporting
   * ------------------------------------------------------------------------
   */

  search: {
    payments:
      searchPaymentsController,

    transactions:
      searchPaymentTransactionsController,

    paymentStatistics:
      getPaymentStatisticsController,

    transactionStatistics:
      getPaymentTransactionStatisticsController,
  },

  /* ------------------------------------------------------------------------
   * Core mutations
   * ------------------------------------------------------------------------
   */

  mutations: {
    create:
      createPaymentMutationController,

    update:
      updatePaymentController,

    changeStatus:
      changePaymentStatusController,

    cancel:
      cancelPaymentController,

    recordCollection:
      recordPaymentCollectionController,

    recordFailedCollection:
      recordFailedPaymentCollectionController,
  },

  /* ------------------------------------------------------------------------
   * Refunds
   * ------------------------------------------------------------------------
   */

  refunds: {
    request:
      requestPaymentRefundController,

    complete:
      completePaymentRefundController,

    fail:
      failPaymentRefundController,
  },

  /* ------------------------------------------------------------------------
   * Gateway
   * ------------------------------------------------------------------------
   */

  gateway: {
    createOrder:
      createPaymentGatewayOrderMutationController,

    updateOrder:
      updatePaymentGatewayOrderMutationController,

    getOrder:
      getPaymentGatewayOrderByIdController,
  },

  /* ------------------------------------------------------------------------
   * Webhooks
   * ------------------------------------------------------------------------
   */

  webhooks: {
    record:
      recordPaymentWebhookMutationController,

    complete:
      completePaymentWebhookMutationController,

    fail:
      failPaymentWebhookMutationController,

    exists:
      checkPaymentWebhookEventController,
  },

  /* ------------------------------------------------------------------------
   * Reconciliation
   * ------------------------------------------------------------------------
   */

  reconciliation: {
    reconcile:
      reconcilePaymentMutationController,

    latest:
      getLatestPaymentReconciliationController,

    history:
      getPaymentReconciliationHistoryController,
  },

  /* ------------------------------------------------------------------------
   * Bulk
   * ------------------------------------------------------------------------
   */

  bulk: {
    getManyByIds:
      getPaymentsBulkController,

    changeManyStatuses:
      changePaymentsBulkStatusController,
  },

  /* ------------------------------------------------------------------------
   * Diagnostics
   * ------------------------------------------------------------------------
   */

  diagnostics: {
    health:
      getPaymentRepositoryHealthController,

    readiness:
      getPaymentReadinessController,

    capabilities:
      getPaymentCapabilitiesController,
  },
} as const;

/* ============================================================================
 * End of Payment Controller - Part F
 * ============================================================================
 */