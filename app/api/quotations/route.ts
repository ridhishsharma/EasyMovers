/**
 * ============================================================================
 * EasyMovers
 * Quotation API Route
 * ============================================================================
 *
 * File:
 * app/api/quotations/route.ts
 *
 * Supported operations:
 *
 * GET  /api/quotations
 * POST /api/quotations
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController
 *      ↓
 * QuotationService
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly
 * - duplicate Quotation validation
 * - implement quotation business rules
 * - manually generate quotationNumber/referenceId
 * ============================================================================
 */

import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

import {
  prisma,
} from "@/lib/prisma";

import {
  getOrCreateQuotationModule,
} from "@/domains/quotation/quotation.module";

import type {
  CreateQuotationControllerBody,
  QuotationControllerRecord,
  QuotationControllerRequest,
  QuotationControllerResponse,
  QuotationListQueryParams,
} from "@/domains/quotation/controllers/quotation.controller";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getQuotationRequestId(
  request:
    Request
): string {
  const existing =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  return existing ||
    randomUUID();
}

/* ============================================================================
 * Client IP
 * ============================================================================
 */

function getQuotationRequestIp(
  request:
    Request
): string | undefined {
  const forwarded =
    request.headers
      .get(
        "x-forwarded-for"
      );

  if (
    forwarded
  ) {
    return forwarded
      .split(
        ","
      )[0]
      ?.trim() ||
      undefined;
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
 * Authenticated user
 * ============================================================================
 */

/**
 * Temporary adapter.
 *
 * When the final EasyMovers authentication/session layer is connected,
 * replace this header lookup with the authenticated session identity.
 */
function getQuotationAuthenticatedUserId(
  request:
    Request
): string | undefined {
  const userId =
    request.headers
      .get(
        "x-user-id"
      )
      ?.trim();

  return userId ||
    undefined;
}

/* ============================================================================
 * Headers
 * ============================================================================
 */

function mapQuotationRequestHeaders(
  request:
    Request
): Record<
  string,
  string
> {
  const headers:
    Record<
      string,
      string
    > = {};

  request.headers.forEach(
    (
      value,
      key
    ) => {
      headers[key] =
        value;
    }
  );

  return headers;
}

/* ============================================================================
 * Search params
 * ============================================================================
 */

/**
 * Converts URLSearchParams into the framework-independent controller
 * query structure.
 *
 * Repeated query parameters become arrays.
 *
 * Example:
 *
 * ?statuses=SUBMITTED&statuses=REVISED
 *
 * becomes:
 *
 * {
 *   statuses: [
 *     "SUBMITTED",
 *     "REVISED"
 *   ]
 * }
 */
function mapQuotationSearchParams(
  request:
    Request
): QuotationListQueryParams {
  const url =
    new URL(
      request.url
    );

  const query:
    QuotationControllerRecord =
      {};

  for (
    const [
      key,
      value,
    ]
    of url.searchParams
      .entries()
  ) {
    const existing =
      query[key];

    if (
      existing ===
        undefined
    ) {
      query[key] =
        value;

      continue;
    }

    if (
      Array.isArray(
        existing
      )
    ) {
      existing.push(
        value
      );

      continue;
    }

    query[key] = [
      existing,
      value,
    ];
  }

  return query as
    QuotationListQueryParams;
}

/* ============================================================================
 * Response adapter
 * ============================================================================
 */

function toNextQuotationResponse<
  T
>(
  response:
    QuotationControllerResponse<
      T
    >,
  requestId:
    string
): NextResponse {
  const headers =
    new Headers();

  headers.set(
    "x-request-id",
    requestId
  );

  if (
    response.headers
  ) {
    for (
      const [
        key,
        value,
      ]
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

  return NextResponse.json(
    response.body,
    {
      status:
        response.status,

      headers,
    }
  );
}

/* ============================================================================
 * Invalid JSON
 * ============================================================================
 */

function createInvalidQuotationJsonResponse(
  requestId:
    string
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INVALID_JSON_BODY",

        message:
          "Request body must contain valid JSON.",
      },

      meta: {
        requestId,

        timestamp:
          new Date()
            .toISOString(),
      },
    },
    {
      status:
        400,

      headers: {
        "x-request-id":
          requestId,
      },
    }
  );
}

/* ============================================================================
 * Unexpected route error
 * ============================================================================
 */

function createQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation API]",
    {
      requestId,
      error,
    }
  );

  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "QUOTATION_ROUTE_ERROR",

        message:
          "Unable to process the quotation request.",
      },

      meta: {
        requestId,

        timestamp:
          new Date()
            .toISOString(),
      },
    },
    {
      status:
        500,

      headers: {
        "x-request-id":
          requestId,
      },
    }
  );
}

/* ============================================================================
 * GET /api/quotations
 * ============================================================================
 */

/**
 * Internal quotation listing/search endpoint.
 *
 * Examples:
 *
 * GET /api/quotations
 *
 * GET /api/quotations?bookingId=...
 *
 * GET /api/quotations?vendorId=...
 *
 * GET /api/quotations?statuses=SUBMITTED,REVISED
 *
 * GET /api/quotations?page=1&pageSize=20
 */
export async function GET(
  request:
    Request
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationRequestId(
      request
    );

  try {
    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        unknown,
        QuotationControllerRecord,
        QuotationListQueryParams
      > = {
      query:
        mapQuotationSearchParams(
          request
        ),

      method:
        "GET",

      path:
        new URL(
          request.url
        ).pathname,

      headers:
        mapQuotationRequestHeaders(
          request
        ),

      requestId,

      ...(getQuotationRequestIp(
        request
      )
        ? {
            ipAddress:
              getQuotationRequestIp(
                request
              ),
          }
        : {}),

      ...(request.headers
        .get(
          "user-agent"
        )
        ? {
            userAgent:
              request.headers
                .get(
                  "user-agent"
                ) ??
              undefined,
          }
        : {}),

      ...(getQuotationAuthenticatedUserId(
        request
      )
        ? {
            authenticatedUserId:
              getQuotationAuthenticatedUserId(
                request
              ),
          }
        : {}),
    };

    const response =
      await module
        .controller
        .list(
          controllerRequest
        );

    return toNextQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}

/* ============================================================================
 * POST /api/quotations
 * ============================================================================
 */

/**
 * Creates one Vendor quotation.
 *
 * The service will:
 *
 * - validate quotation payload
 * - validate Lead
 * - validate Booking
 * - validate Vendor
 * - verify Booking belongs to Lead
 * - prevent duplicate active Vendor quotation
 * - calculate/generate quotation identities
 * - persist through repository
 */
export async function POST(
  request:
    Request
): Promise<
  NextResponse
> {
  const requestId =
    getQuotationRequestId(
      request
    );

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return createInvalidQuotationJsonResponse(
      requestId
    );
  }

  try {
    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        CreateQuotationControllerBody
      > = {
      body:
        body as
          CreateQuotationControllerBody,

      method:
        "POST",

      path:
        new URL(
          request.url
        ).pathname,

      headers:
        mapQuotationRequestHeaders(
          request
        ),

      requestId,

      ...(getQuotationRequestIp(
        request
      )
        ? {
            ipAddress:
              getQuotationRequestIp(
                request
              ),
          }
        : {}),

      ...(request.headers
        .get(
          "user-agent"
        )
        ? {
            userAgent:
              request.headers
                .get(
                  "user-agent"
                ) ??
              undefined,
          }
        : {}),

      ...(getQuotationAuthenticatedUserId(
        request
      )
        ? {
            authenticatedUserId:
              getQuotationAuthenticatedUserId(
                request
              ),
          }
        : {}),
    };

    const response =
      await module
        .controller
        .create(
          controllerRequest
        );

    return toNextQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}