/**
 * ============================================================================
 * EasyMovers
 * Payment API Response
 * ============================================================================
 *
 * File:
 * app/api/payments/_lib/payment-api.response.ts
 *
 * Responsibilities:
 *
 * - Convert PaymentControllerResponse -> NextResponse
 * - Preserve controller HTTP status
 * - Preserve response body
 * - Preserve custom headers
 * - Apply stable JSON headers
 * - Provide API-level fallback error responses
 *
 * IMPORTANT:
 *
 * This file does NOT:
 *
 * - Contain Payment business rules
 * - Access PaymentService
 * - Access repositories
 * - Access Prisma
 * - Re-map PaymentServiceError
 *
 * Error/status mapping already belongs to payment.controller.ts.
 * ============================================================================
 */

/* ============================================================================
 * Next.js
 * ============================================================================
 */

import {
  NextResponse,
} from "next/server";

/* ============================================================================
 * Payment controller types
 * ============================================================================
 */

import type {
  PaymentControllerResponse,
  PaymentControllerResponseBody,
} from "../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * API response headers
 * ============================================================================
 */

export const PAYMENT_API_RESPONSE_HEADERS = {
  CONTENT_TYPE:
    "Content-Type",

  REQUEST_ID:
    "X-Request-Id",

  CACHE_CONTROL:
    "Cache-Control",

  NOSNIFF:
    "X-Content-Type-Options",
} as const;

/* ============================================================================
 * Default headers
 * ============================================================================
 */

export const DEFAULT_PAYMENT_API_RESPONSE_HEADERS:
  Readonly<
    Record<
      string,
      string
    >
  > = {
  [PAYMENT_API_RESPONSE_HEADERS.CONTENT_TYPE]:
    "application/json; charset=utf-8",

  [PAYMENT_API_RESPONSE_HEADERS.CACHE_CONTROL]:
    "no-store",

  [PAYMENT_API_RESPONSE_HEADERS.NOSNIFF]:
    "nosniff",
};

/* ============================================================================
 * Response options
 * ============================================================================
 */

export interface PaymentApiResponseOptions {
  additionalHeaders?:
    Record<
      string,
      string
    >;

  includeRequestIdHeader?:
    boolean;

  cacheControl?:
    string;
}

/* ============================================================================
 * Normalize response status
 * ============================================================================
 */

export function normalizePaymentApiResponseStatus(
  status:
    unknown
): number {
  if (
    typeof status ===
      "number" &&
    Number.isInteger(
      status
    ) &&
    status >=
      100 &&
    status <=
      599
  ) {
    return status;
  }

  return 500;
}

/* ============================================================================
 * Normalize response header name
 * ============================================================================
 */

export function normalizePaymentApiHeaderName(
  value:
    unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/* ============================================================================
 * Normalize response header value
 * ============================================================================
 */

export function normalizePaymentApiHeaderValue(
  value:
    unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/* ============================================================================
 * Append headers
 * ============================================================================
 */

export function appendPaymentApiHeaders(
  target:
    Headers,
  source?:
    Record<
      string,
      string
    >
): Headers {
  if (
    !source
  ) {
    return target;
  }

  for (
    const [
      rawName,
      rawValue,
    ]
    of Object.entries(
      source
    )
  ) {
    const name =
      normalizePaymentApiHeaderName(
        rawName
      );

    const value =
      normalizePaymentApiHeaderValue(
        rawValue
      );

    if (
      !name ||
      !value
    ) {
      continue;
    }

    target.set(
      name,
      value
    );
  }

  return target;
}

/* ============================================================================
 * Extract request ID
 * ============================================================================
 */

export function getPaymentControllerResponseRequestId(
  response:
    PaymentControllerResponse<
      unknown
    >
): string | undefined {
  const requestId =
    response.body
      .meta
      ?.requestId;

  if (
    typeof requestId !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    requestId.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}

/* ============================================================================
 * Build Next.js response headers
 * ============================================================================
 */

export function createPaymentApiResponseHeaders(
  response:
    PaymentControllerResponse<
      unknown
    >,
  options:
    PaymentApiResponseOptions = {}
): Headers {
  const headers =
    new Headers();

  appendPaymentApiHeaders(
    headers,
    DEFAULT_PAYMENT_API_RESPONSE_HEADERS
  );

  appendPaymentApiHeaders(
    headers,
    response.headers
  );

  appendPaymentApiHeaders(
    headers,
    options.additionalHeaders
  );

  if (
    options.cacheControl
  ) {
    headers.set(
      PAYMENT_API_RESPONSE_HEADERS
        .CACHE_CONTROL,
      options.cacheControl
    );
  }

  if (
    options.includeRequestIdHeader !==
      false
  ) {
    const requestId =
      getPaymentControllerResponseRequestId(
        response
      );

    if (
      requestId
    ) {
      headers.set(
        PAYMENT_API_RESPONSE_HEADERS
          .REQUEST_ID,
        requestId
      );
    }
  }

  return headers;
}

/* ============================================================================
 * Controller response -> NextResponse
 * ============================================================================
 */

export function toPaymentApiResponse<
  TData
>(
  response:
    PaymentControllerResponse<
      TData
    >,
  options:
    PaymentApiResponseOptions = {}
): NextResponse {
  const status =
    normalizePaymentApiResponseStatus(
      response.status
    );

  const headers =
    createPaymentApiResponseHeaders(
      response as
        PaymentControllerResponse<
          unknown
        >,
      options
    );

  return NextResponse.json(
    response.body,
    {
      status,
      headers,
    }
  );
}

/* ============================================================================
 * Success API response body
 * ============================================================================
 */

export function createPaymentApiSuccessBody<
  TData
>(
  data:
    TData,
  requestId?:
    string
): PaymentControllerResponseBody<
  TData
> {
  return {
    success:
      true,

    data,

    meta: {
      timestamp:
        new Date()
          .toISOString(),

      ...(requestId
        ? {
            requestId,
          }
        : {}),
    },
  };
}

/* ============================================================================
 * Failure API response body
 * ============================================================================
 */

export function createPaymentApiFailureBody(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): PaymentControllerResponseBody<
  never
> {
  return {
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

    meta: {
      timestamp:
        new Date()
          .toISOString(),

      ...(requestId
        ? {
            requestId,
          }
        : {}),
    },
  };
}

/* ============================================================================
 * Generic API success response
 * ============================================================================
 */

/**
 * Useful for API-layer responses that do not pass through PaymentController,
 * such as infrastructure bootstrap responses.
 */
export function createPaymentApiSuccessResponse<
  TData
>(
  data:
    TData,
  status =
    200,
  requestId?:
    string,
  options:
    PaymentApiResponseOptions = {}
): NextResponse {
  const body =
    createPaymentApiSuccessBody(
      data,
      requestId
    );

  const controllerResponse:
    PaymentControllerResponse<
      TData
    > = {
    status:
      normalizePaymentApiResponseStatus(
        status
      ),

    body,
  };

  return toPaymentApiResponse(
    controllerResponse,
    options
  );
}

/* ============================================================================
 * Generic API failure response
 * ============================================================================
 */

export function createPaymentApiFailureResponse(
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
  options:
    PaymentApiResponseOptions = {}
): NextResponse {
  const controllerResponse:
    PaymentControllerResponse<
      never
    > = {
    status:
      normalizePaymentApiResponseStatus(
        status
      ),

    body:
      createPaymentApiFailureBody(
        code,
        message,
        requestId,
        details
      ),
  };

  return toPaymentApiResponse(
    controllerResponse,
    options
  );
}

/* ============================================================================
 * Common API failure helpers
 * ============================================================================
 */

export function createPaymentApiBadRequestResponse(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): NextResponse {
  return createPaymentApiFailureResponse(
    400,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentApiNotFoundResponse(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): NextResponse {
  return createPaymentApiFailureResponse(
    404,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentApiConflictResponse(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): NextResponse {
  return createPaymentApiFailureResponse(
    409,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentApiInternalErrorResponse(
  code =
    "PAYMENT_API_ERROR",
  message =
    "An unexpected Payment API error occurred.",
  requestId?:
    string,
  details?:
    unknown
): NextResponse {
  return createPaymentApiFailureResponse(
    500,
    code,
    message,
    requestId,
    details
  );
}

export function createPaymentApiUnavailableResponse(
  code:
    string,
  message:
    string,
  requestId?:
    string,
  details?:
    unknown
): NextResponse {
  return createPaymentApiFailureResponse(
    503,
    code,
    message,
    requestId,
    details
  );
}

/* ============================================================================
 * Known Payment domain error mapping
 * ============================================================================
 */

interface PaymentApiKnownError {
  code:
    string;

  message:
    string;

  details?:
    unknown;
}

const PAYMENT_API_KNOWN_ERROR_STATUS:
  Readonly<
    Record<
      string,
      number
    >
  > = {
  PAYMENT_TRANSACTION_ALREADY_EXISTS:
    409,

    PAYMENT_AMOUNT_EXCEEDED:
    422,

  PAYMENT_REFUNDED:
    409,

  PAYMENT_NOT_FOUND:
    404,

  PAYMENT_REQUEST_MAPPING_FAILED:
    400,
};

function getPaymentApiKnownError(
  error:
    unknown
): PaymentApiKnownError | null {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return null;
  }

  const candidate =
    error as
      Record<
        string,
        unknown
      >;

  if (
    typeof candidate.code !==
      "string" ||
    !candidate.code.trim() ||
    typeof candidate.message !==
      "string" ||
    !candidate.message.trim()
  ) {
    return null;
  }

  const code =
    candidate.code.trim();

  if (
    PAYMENT_API_KNOWN_ERROR_STATUS[
      code
    ] ===
      undefined
  ) {
    return null;
  }

  return {
    code,

    message:
      candidate.message.trim(),

    ...(candidate.details !==
    undefined
      ? {
          details:
            candidate.details,
        }
      : {}),
  };
}
/* ============================================================================
 * Unknown API error normalization
 * ============================================================================
 */
export function handlePaymentApiResponseError(
  error:
    unknown,
  requestId?:
    string
): NextResponse {
  const knownError =
    getPaymentApiKnownError(
      error
    );

  if (
    knownError
  ) {
    return createPaymentApiFailureResponse(
      PAYMENT_API_KNOWN_ERROR_STATUS[
        knownError.code
      ],
      knownError.code,
      knownError.message,
      requestId,
      knownError.details
    );
  }

  return createPaymentApiInternalErrorResponse(
    "PAYMENT_API_ERROR",
    "An unexpected Payment API error occurred.",
    requestId
  );
}

/* ============================================================================
 * No-content response
 * ============================================================================
 */

/**
 * NextResponse.json must not be used for HTTP 204.
 */
export function createPaymentApiNoContentResponse(
  headers?:
    Record<
      string,
      string
    >
): NextResponse {
  const responseHeaders =
    new Headers();

  appendPaymentApiHeaders(
    responseHeaders,
    {
      [PAYMENT_API_RESPONSE_HEADERS
        .CACHE_CONTROL]:
        "no-store",

      [PAYMENT_API_RESPONSE_HEADERS
        .NOSNIFF]:
        "nosniff",

      ...(headers ??
        {}),
    }
  );

  return new NextResponse(
    null,
    {
      status:
        204,

      headers:
        responseHeaders,
    }
  );
}

/* ============================================================================
 * Payment API response facade
 * ============================================================================
 */

export const PaymentApiResponse = {
  /* ------------------------------------------------------------------------
   * Controller conversion
   * ------------------------------------------------------------------------
   */

  fromController:
    toPaymentApiResponse,

  /* ------------------------------------------------------------------------
   * Success
   * ------------------------------------------------------------------------
   */

  success:
    createPaymentApiSuccessResponse,

  noContent:
    createPaymentApiNoContentResponse,

  /* ------------------------------------------------------------------------
   * Failure
   * ------------------------------------------------------------------------
   */

  failure:
    createPaymentApiFailureResponse,

  badRequest:
    createPaymentApiBadRequestResponse,

  notFound:
    createPaymentApiNotFoundResponse,

  conflict:
    createPaymentApiConflictResponse,

  internalError:
    createPaymentApiInternalErrorResponse,

  unavailable:
    createPaymentApiUnavailableResponse,

  handleError:
    handlePaymentApiResponseError,

  /* ------------------------------------------------------------------------
   * Body
   * ------------------------------------------------------------------------
   */

  successBody:
    createPaymentApiSuccessBody,

  failureBody:
    createPaymentApiFailureBody,

  /* ------------------------------------------------------------------------
   * Headers
   * ------------------------------------------------------------------------
   */

  headers:
    createPaymentApiResponseHeaders,
} as const;

/* ============================================================================
 * Payment API response port
 * ============================================================================
 */

export type PaymentApiResponsePort =
  typeof PaymentApiResponse;

/* ============================================================================
 * End of Payment API Response
 * ============================================================================
 */