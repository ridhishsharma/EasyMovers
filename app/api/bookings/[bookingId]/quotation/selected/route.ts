/**
 * ============================================================================
 * EasyMovers
 * Selected Booking Quotation Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/selected/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/selected
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getSelectedByBooking()
 *      ↓
 * QuotationService.getSelectedByBooking()
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
 * - determine selection state itself
 * - filter or mutate quotation state
 * - duplicate quotation-selection business rules
 *
 * The service/controller remain the source of truth.
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

export interface SelectedBookingQuotationRouteContext {
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

function getSelectedBookingQuotationRequestId(
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

function getSelectedBookingQuotationRequestIp(
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

function getSelectedBookingQuotationAuthenticatedUserId(
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

function mapSelectedBookingQuotationRequestHeaders(
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

function createSelectedBookingQuotationControllerMetadata(
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
    getSelectedBookingQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getSelectedBookingQuotationAuthenticatedUserId(
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
      mapSelectedBookingQuotationRequestHeaders(
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
 * Controller -> NextResponse
 * ============================================================================
 */

function toNextSelectedBookingQuotationResponse<
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
 * Invalid route parameter
 * ============================================================================
 */

function createInvalidSelectedBookingQuotationParamsResponse(
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

function createSelectedBookingQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Selected Booking Quotation API]",
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
          "SELECTED_BOOKING_QUOTATION_ROUTE_ERROR",

        message:
          "Unable to retrieve the selected Booking quotation.",
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

async function resolveSelectedBookingQuotationBookingId(
  context:
    SelectedBookingQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    ?.trim() ??
    "";
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/selected
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    SelectedBookingQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getSelectedBookingQuotationRequestId(
      request
    );

  try {
    /* ------------------------------------------------------------------------
     * 1. Resolve bookingId
     * ------------------------------------------------------------------------
     */

    const bookingId =
      await resolveSelectedBookingQuotationBookingId(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidSelectedBookingQuotationParamsResponse(
        requestId
      );
    }

    /* ------------------------------------------------------------------------
     * 2. Resolve Quotation module
     * ------------------------------------------------------------------------
     */

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    /* ------------------------------------------------------------------------
     * 3. Build controller request
     * ------------------------------------------------------------------------
     */

    const controllerRequest:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      > = {
      params: {
        bookingId,
      },

      ...createSelectedBookingQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    /* ------------------------------------------------------------------------
     * 4. Delegate selected quotation lookup
     * ------------------------------------------------------------------------
     */

    const response =
      await module
        .controller
        .getSelectedByBooking(
          controllerRequest
        );

    /* ------------------------------------------------------------------------
     * 5. Return canonical controller response
     * ------------------------------------------------------------------------
     */

    return toNextSelectedBookingQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createSelectedBookingQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}