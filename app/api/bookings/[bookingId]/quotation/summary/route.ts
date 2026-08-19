/**
 * ============================================================================
 * EasyMovers
 * Booking Quotation Summary Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/summary/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/summary
 *
 * Purpose:
 *
 * - Return commercial quotation summary for one Booking
 * - Delegate business logic to QuotationController / QuotationService
 * - Keep route layer free from repository / Prisma logic
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getBookingSummary()
 *      ↓
 * QuotationService.getBookingSummary()
 *      ↓
 * QuotationRepository.getBookingQuotationSummary()
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly
 * - calculate lowest/highest quotation amounts
 * - duplicate summary business rules
 * - inspect Vendor identity
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
  QuotationControllerRecord,
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

export interface BookingQuotationSummaryRouteContext {
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

function getBookingQuotationSummaryRequestId(
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

function getBookingQuotationSummaryRequestIp(
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

function getBookingQuotationSummaryAuthenticatedUserId(
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

function mapBookingQuotationSummaryRequestHeaders(
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
 * Query parameters
 * ============================================================================
 */

/**
 * Supports optional status filtering.
 *
 * Examples:
 *
 * ?statuses=SUBMITTED
 *
 * ?statuses=SUBMITTED&statuses=ACCEPTED
 *
 * ?statuses=SUBMITTED,REVISED,SHORTLISTED,ACCEPTED
 */
function mapBookingQuotationSummaryQuery(
  request:
    Request
): QuotationControllerRecord {
  const url =
    new URL(
      request.url
    );

  const rawStatuses =
    url.searchParams
      .getAll(
        "statuses"
      );

  if (
    rawStatuses.length ===
      0
  ) {
    return {};
  }

  const statuses =
    rawStatuses
      .flatMap(
        (
          value
        ) =>
          value
            .split(
              ","
            )
      )
      .map(
        (
          value
        ) =>
          value.trim()
      )
      .filter(
        Boolean
      );

  return statuses.length >
    0
    ? {
        statuses,
      }
    : {};
}

/* ============================================================================
 * Controller metadata
 * ============================================================================
 */

function createBookingQuotationSummaryControllerMetadata(
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
    getBookingQuotationSummaryRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getBookingQuotationSummaryAuthenticatedUserId(
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
      mapBookingQuotationSummaryRequestHeaders(
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

function toNextBookingQuotationSummaryResponse<
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

function createBookingQuotationSummaryRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Booking Quotation Summary API]",
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
          "BOOKING_QUOTATION_SUMMARY_ROUTE_ERROR",

        message:
          "Unable to retrieve Booking quotation summary.",
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

async function resolveBookingQuotationSummaryBookingId(
  context:
    BookingQuotationSummaryRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    .trim();
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/summary
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    BookingQuotationSummaryRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getBookingQuotationSummaryRequestId(
      request
    );

  try {
    const bookingId =
      await resolveBookingQuotationSummaryBookingId(
        context
      );

    const module =
      getOrCreateQuotationModule({
        prisma,
      });

    const controllerRequest:
      QuotationControllerRequest<
        unknown,
        QuotationBookingRouteParams,
        QuotationControllerRecord
      > = {
      params: {
        bookingId,
      },

      query:
        mapBookingQuotationSummaryQuery(
          request
        ),

      ...createBookingQuotationSummaryControllerMetadata(
        request,
        requestId
      ),
    };

    const response =
      await module
        .controller
        .getBookingSummary(
          controllerRequest
        );

    return toNextBookingQuotationSummaryResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createBookingQuotationSummaryRouteErrorResponse(
      requestId,
      error
    );
  }
}