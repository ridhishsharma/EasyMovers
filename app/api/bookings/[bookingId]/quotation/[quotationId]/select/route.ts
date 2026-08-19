/**
 * ============================================================================
 * EasyMovers
 * Booking Quotation Selection Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/[quotationId]/select/route.ts
 *
 * Supported operation:
 *
 * POST /api/bookings/:bookingId/quotation/:quotationId/select
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.select()
 *      ↓
 * QuotationService.select()
 *      ↓
 * Selection validation / workflow
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly for selection
 * - change Booking.selectedQuotationId directly
 * - change Quotation status directly
 * - duplicate quotation-selection business rules
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
  BookingQuotationRouteParams,
  QuotationControllerRequest,
  QuotationControllerResponse,
  SelectQuotationControllerBody,
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

export interface SelectQuotationRouteContext {
  params:
    Promise<{
      bookingId:
        string;

      quotationId:
        string;
    }>;
}

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getSelectQuotationRequestId(
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

function getSelectQuotationRequestIp(
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
function getSelectQuotationAuthenticatedUserId(
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

function mapSelectQuotationRequestHeaders(
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

function createSelectQuotationControllerMetadata(
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
    getSelectQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getSelectQuotationAuthenticatedUserId(
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
      mapSelectQuotationRequestHeaders(
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
 * Controller response -> NextResponse
 * ============================================================================
 */

function toNextSelectQuotationResponse<
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

function createInvalidSelectQuotationJsonResponse(
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
 * Invalid route parameters
 * ============================================================================
 */

function createInvalidSelectQuotationParamsResponse(
  requestId:
    string,
  field:
    "bookingId" |
    "quotationId"
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INVALID_ROUTE_PARAMETER",

        message:
          `${field} is required.`,

        details: {
          field,
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

function createSelectQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Selection API]",
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
          "QUOTATION_SELECTION_ROUTE_ERROR",

        message:
          "Unable to process the quotation selection request.",
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
 * Resolve route parameters
 * ============================================================================
 */

async function resolveSelectQuotationParams(
  context:
    SelectQuotationRouteContext
): Promise<{
  bookingId:
    string;

  quotationId:
    string;
}> {
  const params =
    await context.params;

  return {
    bookingId:
      params.bookingId
        ?.trim() ??
      "",

    quotationId:
      params.quotationId
        ?.trim() ??
      "",
  };
}

/* ============================================================================
 * POST /api/bookings/:bookingId/quotation/:quotationId/select
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    SelectQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getSelectQuotationRequestId(
      request
    );

  let body:
    unknown;

  /*
   * Parse JSON at the route boundary.
   */
  try {
    body =
      await request.json();
  } catch {
    return createInvalidSelectQuotationJsonResponse(
      requestId
    );
  }

  try {
    const {
      bookingId,
      quotationId,
    } =
      await resolveSelectQuotationParams(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidSelectQuotationParamsResponse(
        requestId,
        "bookingId"
      );
    }

    if (
      !quotationId
    ) {
      return createInvalidSelectQuotationParamsResponse(
        requestId,
        "quotationId"
      );
    }

    /*
     * Resolve the canonical Quotation domain module.
     */
    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    /*
     * Route parameters supply bookingId / quotationId.
     * API body supplies selectedBy / remarks.
     */
    const controllerRequest:
      QuotationControllerRequest<
        SelectQuotationControllerBody,
        BookingQuotationRouteParams
      > = {
      body:
        body as
          SelectQuotationControllerBody,

      params: {
        bookingId,
        quotationId,
      },

      ...createSelectQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    /*
     * Delegate all business rules to the controller/service.
     *
     * The service handles:
     *
     * - Booking existence
     * - Quotation existence
     * - Booking/Quotation ownership
     * - selectable quotation status
     * - existing selected quotation protection
     * - SUBMITTED -> SHORTLISTED transition
     * - Booking.selectedQuotation persistence
     */
    const response =
      await module
        .controller
        .select(
          controllerRequest
        );

    return toNextSelectQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createSelectQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}