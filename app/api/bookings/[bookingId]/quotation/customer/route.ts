/**
 * ============================================================================
 * EasyMovers
 * Booking Customer-Safe Quotation Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/customer/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/customer
 *
 * Purpose:
 *
 * - Return quotations for one Booking
 * - Use customer-safe quotation mapping
 * - Prevent Vendor identity leakage
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getCustomerSafeByBooking()
 *      ↓
 * QuotationService.getCustomerSafeByBooking()
 *      ↓
 * Customer-safe mapper
 *      ↓
 * Repository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly
 * - expose Vendor identity directly
 * - manually remove Vendor fields
 * - duplicate customer-safe mapping rules
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
  BookingQuotationQueryParams,
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

export interface CustomerBookingQuotationRouteContext {
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

function getCustomerBookingQuotationRequestId(
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

function getCustomerBookingQuotationRequestIp(
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
 * Temporary bridge until the final authentication/session layer is connected.
 */
function getCustomerBookingQuotationAuthenticatedUserId(
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

function mapCustomerBookingQuotationRequestHeaders(
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
 * Supports:
 *
 * ?statuses=SUBMITTED,REVISED
 * ?includeExpired=false
 * ?sortField=totalAmount
 * ?sortDirection=asc
 */
function mapCustomerBookingQuotationSearchParams(
  request:
    Request
): BookingQuotationQueryParams {
  const url =
    new URL(
      request.url
    );

  const query:
    BookingQuotationQueryParams =
      {};

  const statuses =
    url.searchParams
      .getAll(
        "statuses"
      );

  if (
    statuses.length >
      1
  ) {
    query.statuses =
      statuses;
  } else if (
    statuses.length ===
      1
  ) {
    query.statuses =
      statuses[0];
  }

  const includeExpired =
    url.searchParams
      .get(
        "includeExpired"
      );

  if (
    includeExpired !==
      null
  ) {
    query.includeExpired =
      includeExpired;
  }

  const sortField =
    url.searchParams
      .get(
        "sortField"
      );

  if (
    sortField !==
      null
  ) {
    query.sortField =
      sortField;
  }

  const sortDirection =
    url.searchParams
      .get(
        "sortDirection"
      );

  if (
    sortDirection !==
      null
  ) {
    query.sortDirection =
      sortDirection;
  }

  return query;
}

/* ============================================================================
 * Controller metadata
 * ============================================================================
 */

function createCustomerBookingQuotationControllerMetadata(
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
    getCustomerBookingQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getCustomerBookingQuotationAuthenticatedUserId(
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
      mapCustomerBookingQuotationRequestHeaders(
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

function toNextCustomerBookingQuotationResponse<
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

function createCustomerBookingQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Customer Booking Quotation API]",
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
          "CUSTOMER_BOOKING_QUOTATION_ROUTE_ERROR",

        message:
          "Unable to retrieve customer-safe Booking quotations.",
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

async function resolveCustomerBookingQuotationBookingId(
  context:
    CustomerBookingQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    .trim();
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/customer
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    CustomerBookingQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getCustomerBookingQuotationRequestId(
      request
    );

  try {
    const bookingId =
      await resolveCustomerBookingQuotationBookingId(
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
        BookingQuotationQueryParams
      > = {
      params: {
        bookingId,
      },

      query:
        mapCustomerBookingQuotationSearchParams(
          request
        ),

      ...createCustomerBookingQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    const response =
      await module
        .controller
        .getCustomerSafeByBooking(
          controllerRequest
        );

    return toNextCustomerBookingQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createCustomerBookingQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}