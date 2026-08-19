/**
 * ============================================================================
 * EasyMovers
 * Booking Quotation Unselection Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/unselect/route.ts
 *
 * Supported operation:
 *
 * POST /api/bookings/:bookingId/quotation/unselect
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.unselect()
 *      ↓
 * QuotationService.unselect()
 *      ↓
 * unselection validation / workflow
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly for quotation selection state
 * - change Booking.selectedQuotationId directly
 * - change Quotation status directly
 * - duplicate quotation-unselection business rules
 *
 * bookingId comes from the route.
 * quotationId and unselection actor/details come from the request body.
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
  QuotationBookingRouteParams,
  QuotationControllerRequest,
  QuotationControllerResponse,
  UnselectQuotationControllerBody,
} from "@/domains/quotation/controllers/quotation.controller";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface UnselectQuotationRouteContext {
  params:
    Promise<{
      bookingId:
        string;
    }>;
}

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getUnselectQuotationRequestId(
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
 * Request IP
 * ============================================================================
 */

function getUnselectQuotationRequestIp(
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
 * Temporary bridge until the final EasyMovers authentication/session layer
 * supplies the authenticated actor.
 */
function getUnselectQuotationAuthenticatedUserId(
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
 * Request headers
 * ============================================================================
 */

function mapUnselectQuotationRequestHeaders(
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
 * Controller metadata
 * ============================================================================
 */

function createUnselectQuotationControllerMetadata(
  request:
    Request,
  requestId:
    string
): Pick<
  QuotationControllerRequest,
  | "method"
  | "path"
  | "headers"
  | "requestId"
  | "ipAddress"
  | "userAgent"
  | "authenticatedUserId"
> {
  const ipAddress =
    getUnselectQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getUnselectQuotationAuthenticatedUserId(
      request
    );

  return {
    method:
      request.method,

    path:
      new URL(
        request.url
      ).pathname,

    headers:
      mapUnselectQuotationRequestHeaders(
        request
      ),

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
 * Controller -> NextResponse adapter
 * ============================================================================
 */

function toNextUnselectQuotationResponse<
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

function createInvalidUnselectQuotationJsonResponse(
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
 * Invalid route parameter
 * ============================================================================
 */

function createInvalidUnselectQuotationParamsResponse(
  requestId:
    string
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INVALID_ROUTE_PARAMETER",

        message:
          "bookingId is required.",

        details: {
          field:
            "bookingId",
        },
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

function createUnselectQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Unselection API]",
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
          "QUOTATION_UNSELECTION_ROUTE_ERROR",

        message:
          "Unable to process the quotation unselection request.",
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
 * Resolve bookingId
 * ============================================================================
 */

async function resolveUnselectQuotationBookingId(
  context:
    UnselectQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    ?.trim() ??
    "";
}

/* ============================================================================
 * POST /api/bookings/:bookingId/quotation/unselect
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    UnselectQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getUnselectQuotationRequestId(
      request
    );

  /* --------------------------------------------------------------------------
   * 1. Parse JSON body
   * --------------------------------------------------------------------------
   */

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return createInvalidUnselectQuotationJsonResponse(
      requestId
    );
  }

  try {
    /* ------------------------------------------------------------------------
     * 2. Resolve bookingId
     * ------------------------------------------------------------------------
     */

    const bookingId =
      await resolveUnselectQuotationBookingId(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidUnselectQuotationParamsResponse(
        requestId
      );
    }

    /* ------------------------------------------------------------------------
     * 3. Resolve canonical Quotation domain module
     * ------------------------------------------------------------------------
     */

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    /* ------------------------------------------------------------------------
     * 4. Build controller request
     *
     * IMPORTANT:
     *
     * bookingId comes from route params.
     *
     * quotationId remains in the request body because
     * UnselectQuotationControllerBody omits only bookingId.
     * ------------------------------------------------------------------------
     */

    const controllerRequest:
      QuotationControllerRequest<
        UnselectQuotationControllerBody,
        QuotationBookingRouteParams
      > = {
      body:
        body as
          UnselectQuotationControllerBody,

      params: {
        bookingId,
      },

      ...createUnselectQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    /* ------------------------------------------------------------------------
     * 5. Delegate unselection workflow
     *
     * Controller/service remain responsible for:
     *
     * - Booking validation
     * - quotationId validation
     * - selected quotation validation
     * - Booking/Quotation relationship validation
     * - terminal-status protection
     * - clearing Booking selected quotation
     * - quotation status transition
     * - transaction handling
     * ------------------------------------------------------------------------
     */

    const response =
      await module
        .controller
        .unselect(
          controllerRequest
        );

    /* ------------------------------------------------------------------------
     * 6. Return canonical controller response
     * ------------------------------------------------------------------------
     */

    return toNextUnselectQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createUnselectQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}