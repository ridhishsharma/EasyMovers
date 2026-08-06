/**
 * ============================================================
 * EasyMovers
 * Vendor Base API Route
 * ============================================================
 *
 * File
 * ----
 * app/api/vendors/route.ts
 *
 * Endpoints
 * ---------
 *
 * GET  /api/vendors
 * POST /api/vendors
 *
 * Responsibilities
 * ----------------
 * - Delegate GET requests to the Vendor module
 * - Accept legacy and normalized vendor-registration payloads
 * - Convert legacy payloads before controller execution
 * - Preserve authentication and request metadata
 *
 * This file must not contain:
 *
 * - Direct Prisma queries
 * - Duplicate-checking logic
 * - Domain validation rules
 * - Database mapping logic
 * ============================================================
 */

import {
  getVendorModuleHandlers,
} from "../../../domains/vendor/vendor.module";

import {
  mapVendorCreateRequestPayload,
} from "../../../domains/vendor/mappers/vendor-request.mapper";

import type {
  VendorRequestMappingFailure,
  VendorRequestMappingWarning,
} from "../../../domains/vendor/mappers/vendor-request.mapper";

/**
 * Supported base-route methods.
 */
type VendorBaseRouteMethod =
  | "GET"
  | "POST";

/**
 * Creates a standard JSON response.
 */
function createVendorBaseJsonResponse(
  status: number,
  body: unknown,
  requestId?: string,
  additionalHeaders?:
    Record<string, string>
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store",

        ...(requestId
          ? {
              "x-request-id":
                requestId,
            }
          : {}),

        ...additionalHeaders,
      },
    }
  );
}

/**
 * Reads an existing request ID.
 */
function getVendorBaseRequestId(
  request: Request
): string | undefined {
  return (
    request.headers
      .get("x-request-id")
      ?.trim() ||
    request.headers
      .get("x-correlation-id")
      ?.trim() ||
    undefined
  );
}

/**
 * Creates a mapping-failure response.
 */
function createVendorRequestMappingFailureResponse(
  failure:
    VendorRequestMappingFailure,
  requestId?: string
): Response {
  return createVendorBaseJsonResponse(
    400,
    {
      success: false,

      error: {
        code:
          failure.error.code,

        message:
          failure.error.message,

        details:
          failure.error.fields
            ? {
                fields:
                  failure.error
                    .fields,
              }
            : undefined,
      },

      meta: {
        requestId,

        payloadKind:
          failure.kind,

        warnings:
          failure.warnings,

        timestamp:
          new Date()
            .toISOString(),
      },
    },
    requestId
  );
}

/**
 * Converts mapping warnings into response-header-safe data.
 *
 * Full warning details are not placed in headers because
 * headers should remain compact.
 */
function createVendorMappingWarningHeaders(
  warnings:
    VendorRequestMappingWarning[]
): Record<string, string> {
  if (
    warnings.length === 0
  ) {
    return {};
  }

  return {
    "x-vendor-mapping-warnings":
      String(
        warnings.length
      ),
  };
}

/**
 * Creates a Request containing the normalized vendor body.
 *
 * Existing method, URL, headers, and request metadata are
 * preserved.
 */
function createMappedVendorPostRequest(
  request: Request,
  body:
    unknown,
  warnings:
    VendorRequestMappingWarning[]
): Request {
  const headers =
    new Headers(
      request.headers
    );

  headers.set(
    "content-type",
    "application/json"
  );

  /*
   * The original content length no longer matches the mapped
   * body, so it must not be forwarded.
   */
  headers.delete(
    "content-length"
  );

  if (
    warnings.length > 0
  ) {
    headers.set(
      "x-vendor-mapping-warnings",
      String(
        warnings.length
      )
    );
  }

  return new Request(
    request.url,
    {
      method:
        "POST",

      headers,

      body:
        JSON.stringify(body),

      /*
       * Required by Node.js fetch when forwarding a streamed
       * request body. The newly created body is not streamed,
       * but omitting the original Request object avoids body
       * reuse and locked-stream errors.
       */
      signal:
        request.signal,
    }
  );
}

/**
 * Adds legacy-mapping metadata to a successful API response.
 */
async function appendVendorMappingMetadata(
  response: Response,
  payloadKind:
    "legacy" | "normalized",
  warnings:
    VendorRequestMappingWarning[]
): Promise<Response> {
  const headers =
    new Headers(
      response.headers
    );

  headers.set(
    "x-vendor-payload-kind",
    payloadKind
  );

  const warningHeaders =
    createVendorMappingWarningHeaders(
      warnings
    );

  for (
    const [key, value]
    of Object.entries(
      warningHeaders
    )
  ) {
    headers.set(
      key,
      value
    );
  }

  /*
   * Do not attempt to rewrite responses without JSON bodies.
   */
  if (
    response.status === 204
  ) {
    return new Response(
      null,
      {
        status:
          response.status,

        statusText:
          response.statusText,

        headers,
      }
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    !contentType
      ?.toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    return new Response(
      response.body,
      {
        status:
          response.status,

        statusText:
          response.statusText,

        headers,
      }
    );
  }

  try {
    const responseBody =
      await response
        .clone()
        .json();

    if (
      responseBody &&
      typeof responseBody ===
        "object" &&
      !Array.isArray(
        responseBody
      )
    ) {
      const record =
        responseBody as
          Record<
            string,
            unknown
          >;

      const existingMeta =
        record.meta &&
        typeof record.meta ===
          "object" &&
        !Array.isArray(
          record.meta
        )
          ? record.meta as
              Record<
                string,
                unknown
              >
          : {};

      record.meta = {
        ...existingMeta,

        requestMapping: {
          payloadKind,

          warnings,
        },
      };

      return new Response(
        JSON.stringify(
          record
        ),
        {
          status:
            response.status,

          statusText:
            response.statusText,

          headers,
        }
      );
    }
  } catch {
    /*
     * Preserve the original response when its body cannot be
     * parsed or extended.
     */
  }

  return new Response(
    response.body,
    {
      status:
        response.status,

      statusText:
        response.statusText,

      headers,
    }
  );
}

/**
 * Executes a Vendor module handler.
 */
async function executeVendorBaseRoute(
  method:
    VendorBaseRouteMethod,
  request:
    Request
): Promise<Response> {
  try {
    const handlers =
      getVendorModuleHandlers();

    return await handlers[
      method
    ](
      request
    );
  } catch (error) {
    const requestId =
      getVendorBaseRequestId(
        request
      );

    return createVendorBaseJsonResponse(
      500,
      {
        success: false,

        error: {
          code:
            "VENDOR_BASE_ROUTE_FAILED",

          message:
            error instanceof Error
              ? error.message
              : "An unexpected vendor API error occurred.",
        },

        meta: {
          requestId,

          timestamp:
            new Date()
              .toISOString(),
        },
      },
      requestId
    );
  }
}

/**
 * Parses and maps a vendor POST request.
 */
async function executeVendorCreateRoute(
  request:
    Request
): Promise<Response> {
  const requestId =
    getVendorBaseRequestId(
      request
    );

  let payload:
    unknown;

  try {
    payload =
      await request
        .clone()
        .json();
  } catch {
    return createVendorBaseJsonResponse(
      400,
      {
        success: false,

        error: {
          code:
            "INVALID_VENDOR_JSON_BODY",

          message:
            "The vendor request body must contain valid JSON.",
        },

        meta: {
          requestId,

          timestamp:
            new Date()
              .toISOString(),
        },
      },
      requestId
    );
  }

  const mappingResult =
    mapVendorCreateRequestPayload(
      payload
    );

  if (
    !mappingResult.success
  ) {
    return createVendorRequestMappingFailureResponse(
      mappingResult,
      requestId
    );
  }

  const mappedRequest =
    createMappedVendorPostRequest(
      request,
      mappingResult.input,
      mappingResult.warnings
    );

  const response =
    await executeVendorBaseRoute(
      "POST",
      mappedRequest
    );

  return appendVendorMappingMetadata(
    response,
    mappingResult.kind,
    mappingResult.warnings
  );
}

/**
 * Returns the paginated vendor list.
 *
 * Example:
 *
 * GET /api/vendors?page=1&pageSize=20
 */
export async function GET(
  request: Request
): Promise<Response> {
  return executeVendorBaseRoute(
    "GET",
    request
  );
}

/**
 * Creates a vendor.
 *
 * Supported request formats:
 *
 * 1. Original flat registration payload
 * 2. Normalized CreateVendorServiceInput payload
 */
export async function POST(
  request: Request
): Promise<Response> {
  return executeVendorCreateRoute(
    request
  );
}

/**
 * Vendor API operations depend on authentication and mutable
 * database state.
 */
export const dynamic =
  "force-dynamic";

/**
 * Prevents Next.js from caching Vendor API responses.
 */
export const revalidate =
  0;

/**
 * Prisma requires the Node.js runtime.
 */
export const runtime =
  "nodejs";