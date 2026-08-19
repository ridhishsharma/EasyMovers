/**
 * ============================================================================
 * EasyMovers
 * Active Booking Quotations Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/active/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/active
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getActiveByBooking()
 *      ↓
 * QuotationService.getActiveByBooking()
 *      ↓
 * QuotationRepository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly for quotations
 * - duplicate active-status business rules
 * - calculate active quotation eligibility
 * - mutate quotation state
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

export interface ActiveBookingQuotationRouteContext {
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

function getActiveBookingQuotationRequestId(
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

function getActiveBookingQuotationRequestIp(
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

function getActiveBookingQuotationAuthenticatedUserId(
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

function mapActiveBookingQuotationRequestHeaders(
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

function createActiveBookingQuotationControllerMetadata(
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
    getActiveBookingQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getActiveBookingQuotationAuthenticatedUserId(
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
      mapActiveBookingQuotationRequestHeaders(
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

function toNextActiveBookingQuotationResponse<
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

function createInvalidActiveBookingQuotationParamsResponse(
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

function createActiveBookingQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Active Booking Quotations API]",
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
          "ACTIVE_BOOKING_QUOTATION_ROUTE_ERROR",

        message:
          "Unable to retrieve active Booking quotations.",
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

async function resolveActiveBookingQuotationBookingId(
  context:
    ActiveBookingQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    ?.trim() ??
    "";
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/active
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    ActiveBookingQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getActiveBookingQuotationRequestId(
      request
    );

  try {
    const bookingId =
      await resolveActiveBookingQuotationBookingId(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidActiveBookingQuotationParamsResponse(
        requestId
      );
    }

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams
      > = {
      params: {
        bookingId,
      },

      ...createActiveBookingQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    const response =
      await module
        .controller
        .getActiveByBooking(
          controllerRequest
        );

    return toNextActiveBookingQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createActiveBookingQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}