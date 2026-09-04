/**
 * ============================================================================
 * EasyMovers
 * Payment API Request
 * ============================================================================
 *
 * File:
 * app/api/payments/_lib/payment-api.request.ts
 *
 * Responsibilities:
 *
 * - Convert Next.js Request -> PaymentControllerRequest
 * - Parse JSON request bodies safely
 * - Map URLSearchParams -> controller query object
 * - Map dynamic route params
 * - Normalize request headers
 * - Resolve request ID
 * - Resolve IP address
 * - Resolve user agent
 * - Resolve authenticated-user metadata when supplied
 *
 * IMPORTANT:
 *
 * This file must NOT:
 *
 * - Validate Payment business rules
 * - Access PaymentService
 * - Access repositories
 * - Access Prisma
 * - Generate NextResponse
 *
 * Business validation belongs to PaymentController / PaymentService.
 * ============================================================================
 */

/* ============================================================================
 * Payment controller contracts
 * ============================================================================
 */

import type {
  PaymentControllerRecord,
  PaymentControllerRequest,
} from "../../../../domains/payment/controllers/payment.controller";

/* ============================================================================
 * Route context
 * ============================================================================
 */

/**
 * Next.js App Router dynamic route context.
 *
 * Modern Next.js versions may expose params through a Promise.
 */
export interface PaymentApiRouteContext<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
> {
  params:
    TParams |
    Promise<TParams>;
}

/* ============================================================================
 * Request conversion options
 * ============================================================================
 */

export interface CreatePaymentApiControllerRequestOptions<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
> {
  params?:
    TParams |
    Promise<TParams>;

  parseBody?:
    boolean;

  authenticatedUserId?:
    string;

  requestId?:
    string;

  ipAddress?:
    string;

  userAgent?:
    string;
}

/* ============================================================================
 * Parsed body result
 * ============================================================================
 */

export interface PaymentApiParsedBodyResult {
  hasBody:
    boolean;

  body?:
    unknown;

  parseError?:
    Error;
}

/* ============================================================================
 * Header normalization
 * ============================================================================
 */

export function createPaymentApiHeaderRecord(
  headers:
    Headers
): Record<
  string,
  string
> {
  const result:
    Record<
      string,
      string
    > = {};

  headers.forEach(
    (
      value,
      key
    ) => {
      result[key] =
        value;
    }
  );

  return result;
}

/* ============================================================================
 * Query normalization
 * ============================================================================
 */

/**
 * Query-string mapper preserves repeated query values.
 *
 * Example:
 *
 * ?status=PAID&status=PENDING
 *
 * becomes:
 *
 * {
 *   status: [
 *     "PAID",
 *     "PENDING"
 *   ]
 * }
 */
export function createPaymentApiQueryRecord(
  searchParams:
    URLSearchParams
): PaymentControllerRecord {
  const result:
    PaymentControllerRecord =
      {};

  const keys =
    new Set<
      string
    >();

  searchParams.forEach(
    (
      _value,
      key
    ) => {
      keys.add(
        key
      );
    }
  );

  for (
    const key
    of keys
  ) {
    const values =
      searchParams.getAll(
        key
      );

    if (
      values.length ===
        0
    ) {
      continue;
    }

    result[key] =
      values.length ===
        1
        ? values[0]
        : values;
  }

  return result;
}

/* ============================================================================
 * Resolve route params
 * ============================================================================
 */

export async function resolvePaymentApiRouteParams<
  TParams extends
    PaymentControllerRecord
>(
  params?:
    TParams |
    Promise<TParams>
): Promise<TParams> {
  if (
    !params
  ) {
    return {} as
      TParams;
  }

  return await params;
}

/* ============================================================================
 * Request-body eligibility
 * ============================================================================
 */

export function paymentApiRequestMayHaveBody(
  request:
    Request
): boolean {
  const method =
    request.method
      .trim()
      .toUpperCase();

  return ![
    "GET",
    "HEAD",
  ].includes(
    method
  );
}

/* ============================================================================
 * Content length
 * ============================================================================
 */

export function paymentApiRequestHasDeclaredBody(
  request:
    Request
): boolean {
  const contentLength =
    request.headers
      .get(
        "content-length"
      );

  if (
    contentLength
  ) {
    const length =
      Number(
        contentLength
      );

    if (
      Number.isFinite(
        length
      )
    ) {
      return length >
        0;
    }
  }

  /**
   * Transfer-encoding or framework-managed bodies may not expose
   * content-length, so method eligibility remains sufficient.
   */
  return paymentApiRequestMayHaveBody(
    request
  );
}

/* ============================================================================
 * Parse request body safely
 * ============================================================================
 */

export async function parsePaymentApiRequestBody(
  request:
    Request
): Promise<
  PaymentApiParsedBodyResult
> {
  if (
    !paymentApiRequestMayHaveBody(
      request
    )
  ) {
    return {
      hasBody:
        false,
    };
  }

  const contentType =
    request.headers
      .get(
        "content-type"
      )
      ?.toLowerCase();

  /**
   * Empty bodies are valid for some operations, for example cancellation
   * where actor information may come entirely from authentication context.
   */
  try {
    const text =
      await request.text();

    if (
      text.trim()
        .length ===
        0
    ) {
      return {
        hasBody:
          false,
      };
    }

    /**
     * Payment APIs currently expect JSON request bodies.
     *
     * We still attempt JSON parsing even when content-type is absent because
     * Postman/internal clients may omit the header during development.
     */
    if (
      contentType &&
      !contentType.includes(
        "application/json"
      ) &&
      !contentType.includes(
        "+json"
      )
    ) {
      return {
        hasBody:
          true,

        parseError:
          new Error(
            "Payment API request body must use application/json."
          ),
      };
    }

    try {
      return {
        hasBody:
          true,

        body:
          JSON.parse(
            text
          ),
      };
    } catch (
      error
    ) {
      return {
        hasBody:
          true,

        parseError:
          error instanceof Error
            ? error
            : new Error(
                "Unable to parse Payment API request JSON."
              ),
      };
    }
  } catch (
    error
  ) {
    return {
      hasBody:
        true,

      parseError:
        error instanceof Error
          ? error
          : new Error(
              "Unable to read Payment API request body."
            ),
    };
  }
}

/* ============================================================================
 * Request ID resolution
 * ============================================================================
 */

export function resolvePaymentApiRequestId(
  request:
    Request,
  suppliedRequestId?:
    string
): string {
  const supplied =
    suppliedRequestId
      ?.trim();

  if (
    supplied
  ) {
    return supplied;
  }

  const headerRequestId =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  if (
    headerRequestId
  ) {
    return headerRequestId;
  }

  /**
   * crypto.randomUUID() is available in supported Next.js runtimes.
   */
  return crypto.randomUUID();
}

/* ============================================================================
 * IP address resolution
 * ============================================================================
 */

export function resolvePaymentApiIpAddress(
  request:
    Request,
  suppliedIpAddress?:
    string
): string | undefined {
  const supplied =
    suppliedIpAddress
      ?.trim();

  if (
    supplied
  ) {
    return supplied;
  }

  const forwardedFor =
    request.headers
      .get(
        "x-forwarded-for"
      );

  if (
    forwardedFor
  ) {
    const firstAddress =
      forwardedFor
        .split(
          ","
        )[0]
        ?.trim();

    if (
      firstAddress
    ) {
      return firstAddress;
    }
  }

  const realIp =
    request.headers
      .get(
        "x-real-ip"
      )
      ?.trim();

  return realIp ||
    undefined;
}

/* ============================================================================
 * User-agent resolution
 * ============================================================================
 */

export function resolvePaymentApiUserAgent(
  request:
    Request,
  suppliedUserAgent?:
    string
): string | undefined {
  const supplied =
    suppliedUserAgent
      ?.trim();

  if (
    supplied
  ) {
    return supplied;
  }

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  return userAgent ||
    undefined;
}

/* ============================================================================
 * Authenticated-user resolution
 * ============================================================================
 */

/**
 * Authentication middleware/adapters may provide an explicit authenticated
 * user ID.
 *
 * For now, this helper also recognizes trusted internal headers used during
 * development/testing.
 */
export function resolvePaymentApiAuthenticatedUserId(
  request:
    Request,
  suppliedUserId?:
    string
): string | undefined {
  const supplied =
    suppliedUserId
      ?.trim();

  if (
    supplied
  ) {
    return supplied;
  }

  const headerUserId =
    request.headers
      .get(
        "x-user-id"
      )
      ?.trim();

  return headerUserId ||
    undefined;
}

/* ============================================================================
 * URL/path resolution
 * ============================================================================
 */

export function resolvePaymentApiRequestPath(
  request:
    Request
): string {
  try {
    return new URL(
      request.url
    ).pathname;
  } catch {
    return "";
  }
}

/* ============================================================================
 * Build controller request without body
 * ============================================================================
 */

export async function createPaymentApiControllerRequestWithoutBody<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
>(
  request:
    Request,
  options:
    CreatePaymentApiControllerRequestOptions<
      TParams
    > = {}
): Promise<
  PaymentControllerRequest<
    unknown,
    TParams,
    PaymentControllerRecord
  >
> {
  const url =
    new URL(
      request.url
    );

  const params =
    await resolvePaymentApiRouteParams(
      options.params
    );

  const requestId =
    resolvePaymentApiRequestId(
      request,
      options.requestId
    );

  const ipAddress =
    resolvePaymentApiIpAddress(
      request,
      options.ipAddress
    );

  const userAgent =
    resolvePaymentApiUserAgent(
      request,
      options.userAgent
    );

  const authenticatedUserId =
    resolvePaymentApiAuthenticatedUserId(
      request,
      options.authenticatedUserId
    );

  return {
    params,

    query:
      createPaymentApiQueryRecord(
        url.searchParams
      ),

    headers:
      createPaymentApiHeaderRecord(
        request.headers
      ),

    method:
      request.method,

    path:
      url.pathname,

    requestId,

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

    ...(authenticatedUserId
      ? {
          authenticatedUserId,
        }
      : {}),
  };
}

/* ============================================================================
 * Build complete controller request
 * ============================================================================
 */

export async function createPaymentApiControllerRequest<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
>(
  request:
    Request,
  options:
    CreatePaymentApiControllerRequestOptions<
      TParams
    > = {}
): Promise<
  PaymentControllerRequest<
    unknown,
    TParams,
    PaymentControllerRecord
  >
> {
  const controllerRequest =
    await createPaymentApiControllerRequestWithoutBody(
      request,
      options
    );

  const shouldParseBody =
    options.parseBody !==
      false &&
    paymentApiRequestMayHaveBody(
      request
    );

  if (
    !shouldParseBody
  ) {
    return controllerRequest;
  }

  const bodyResult =
    await parsePaymentApiRequestBody(
      request
    );

  if (
    bodyResult.parseError
  ) {
    /**
     * Deliberately pass an invalid non-object body marker into the controller.
     *
     * Route handlers that need explicit JSON parse-error responses may use
     * createPaymentApiControllerRequestResult() below.
     */
    return {
      ...controllerRequest,

      body:
        undefined,
    };
  }

  if (
    !bodyResult.hasBody
  ) {
    return controllerRequest;
  }

  return {
    ...controllerRequest,

    body:
      bodyResult.body,
  };
}

/* ============================================================================
 * Controller request creation result
 * ============================================================================
 */

export type PaymentApiControllerRequestResult<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
> =
  | {
      success:
        true;

      request:
        PaymentControllerRequest<
          unknown,
          TParams,
          PaymentControllerRecord
        >;
    }
  | {
      success:
        false;

      requestId:
        string;

      error: {
        code:
          string;

        message:
          string;

        details?:
          unknown;
      };
    };

/* ============================================================================
 * Safe controller request creation
 * ============================================================================
 */

/**
 * Recommended route-handler entry point.
 *
 * Unlike createPaymentApiControllerRequest(), this function explicitly returns
 * JSON/body parsing failures so route.ts can produce HTTP 400 immediately.
 */
export async function createPaymentApiControllerRequestResult<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
>(
  request:
    Request,
  options:
    CreatePaymentApiControllerRequestOptions<
      TParams
    > = {}
): Promise<
  PaymentApiControllerRequestResult<
    TParams
  >
> {
  const baseRequest =
    await createPaymentApiControllerRequestWithoutBody(
      request,
      options
    );

  const shouldParseBody =
    options.parseBody !==
      false &&
    paymentApiRequestMayHaveBody(
      request
    );

  if (
    !shouldParseBody
  ) {
    return {
      success:
        true,

      request:
        baseRequest,
    };
  }

  const bodyResult =
    await parsePaymentApiRequestBody(
      request
    );

  if (
    bodyResult.parseError
  ) {
    return {
      success:
        false,

      requestId:
        baseRequest.requestId ??
        resolvePaymentApiRequestId(
          request
        ),

      error: {
        code:
          "INVALID_REQUEST",

        message:
          bodyResult
            .parseError
            .message,

        details: {
          field:
            "body",
        },
      },
    };
  }

  if (
    !bodyResult.hasBody
  ) {
    return {
      success:
        true,

      request:
        baseRequest,
    };
  }

  return {
    success:
      true,

    request: {
      ...baseRequest,

      body:
        bodyResult.body,
    },
  };
}

/* ============================================================================
 * Route-context convenience helper
 * ============================================================================
 */

export async function createPaymentApiRequestFromRouteContext<
  TParams extends
    PaymentControllerRecord
>(
  request:
    Request,
  context:
    PaymentApiRouteContext<
      TParams
    >,
  options:
    Omit<
      CreatePaymentApiControllerRequestOptions<
        TParams
      >,
      "params"
    > = {}
): Promise<
  PaymentApiControllerRequestResult<
    TParams
  >
> {
  return createPaymentApiControllerRequestResult(
    request,
    {
      ...options,

      params:
        context.params,
    }
  );
}

/* ============================================================================
 * No-body route helper
 * ============================================================================
 */

export async function createPaymentApiReadRequest<
  TParams extends
    PaymentControllerRecord =
      PaymentControllerRecord
>(
  request:
    Request,
  params?:
    TParams |
    Promise<TParams>
): Promise<
  PaymentControllerRequest<
    unknown,
    TParams,
    PaymentControllerRecord
  >
> {
  return createPaymentApiControllerRequestWithoutBody(
    request,
    {
      params,

      parseBody:
        false,
    }
  );
}

/* ============================================================================
 * Payment API request facade
 * ============================================================================
 */

export const PaymentApiRequest = {
  /* ------------------------------------------------------------------------
   * Primary conversion
   * ------------------------------------------------------------------------
   */

  create:
    createPaymentApiControllerRequest,

  createResult:
    createPaymentApiControllerRequestResult,

  fromRouteContext:
    createPaymentApiRequestFromRouteContext,

  read:
    createPaymentApiReadRequest,

  /* ------------------------------------------------------------------------
   * Body
   * ------------------------------------------------------------------------
   */

  parseBody:
    parsePaymentApiRequestBody,

  mayHaveBody:
    paymentApiRequestMayHaveBody,

  hasDeclaredBody:
    paymentApiRequestHasDeclaredBody,

  /* ------------------------------------------------------------------------
   * Query
   * ------------------------------------------------------------------------
   */

  query:
    createPaymentApiQueryRecord,

  /* ------------------------------------------------------------------------
   * Params
   * ------------------------------------------------------------------------
   */

  params:
    resolvePaymentApiRouteParams,

  /* ------------------------------------------------------------------------
   * Headers
   * ------------------------------------------------------------------------
   */

  headers:
    createPaymentApiHeaderRecord,

  /* ------------------------------------------------------------------------
   * Request metadata
   * ------------------------------------------------------------------------
   */

  requestId:
    resolvePaymentApiRequestId,

  ipAddress:
    resolvePaymentApiIpAddress,

  userAgent:
    resolvePaymentApiUserAgent,

  authenticatedUserId:
    resolvePaymentApiAuthenticatedUserId,

  path:
    resolvePaymentApiRequestPath,
} as const;

/* ============================================================================
 * Payment API request port
 * ============================================================================
 */

export type PaymentApiRequestPort =
  typeof PaymentApiRequest;

/* ============================================================================
 * End of Payment API Request
 * ============================================================================
 */