/**
 * ============================================================================
 * EasyMovers
 * Booking Quotation Comparison Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/comparison/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/comparison
 *
 * Purpose:
 *
 * - Return quotation comparison data for one Booking
 * - Delegate comparison rules to QuotationService
 * - Preserve customer-safe / anonymous quotation behavior
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getComparison()
 *      ↓
 * QuotationService.getComparison()
 *      ↓
 * comparison logic
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
 * - calculate rankings itself
 * - expose Vendor identity directly
 * - duplicate comparison business rules
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

/* ============================================================================
 * Route context
 * ============================================================================
 */

export interface BookingQuotationComparisonRouteContext {
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

function getBookingQuotationComparisonRequestId(
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

function getBookingQuotationComparisonRequestIp(
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
 * is connected.
 */
function getBookingQuotationComparisonAuthenticatedUserId(
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

function mapBookingQuotationComparisonRequestHeaders(
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

function createBookingQuotationComparisonControllerMetadata(
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
    getBookingQuotationComparisonRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getBookingQuotationComparisonAuthenticatedUserId(
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
      mapBookingQuotationComparisonRequestHeaders(
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

function toNextBookingQuotationComparisonResponse<
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
 * Unexpected route error
 * ============================================================================
 */

function createBookingQuotationComparisonRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Booking Quotation Comparison API]",
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
          "BOOKING_QUOTATION_COMPARISON_ROUTE_ERROR",

        message:
          "Unable to retrieve Booking quotation comparison.",
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

async function resolveBookingQuotationComparisonBookingId(
  context:
    BookingQuotationComparisonRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    .trim();
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/comparison
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    BookingQuotationComparisonRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getBookingQuotationComparisonRequestId(
      request
    );

  try {
    const bookingId =
      await resolveBookingQuotationComparisonBookingId(
        context
      );

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

      ...createBookingQuotationComparisonControllerMetadata(
        request,
        requestId
      ),
    };

    const response =
      await module
        .controller
        .getComparison(
          controllerRequest
        );

    return toNextBookingQuotationComparisonResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createBookingQuotationComparisonRouteErrorResponse(
      requestId,
      error
    );
  }
}