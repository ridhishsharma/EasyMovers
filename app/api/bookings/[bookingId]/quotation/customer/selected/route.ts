/**
 * ============================================================================
 * EasyMovers
 * Customer-Safe Selected Booking Quotation Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/customer/selected/route.ts
 *
 * Supported operation:
 *
 * GET /api/bookings/:bookingId/quotation/customer/selected
 *
 * Architecture:
 *
 * Next.js Request
 *      ↓
 * Route adapter
 *      ↓
 * QuotationController.getCustomerSafeSelectedByBooking()
 *      ↓
 * QuotationService.getCustomerSafeSelectedByBooking()
 *      ↓
 * Customer-safe quotation mapper / repository
 *      ↓
 * Prisma
 *
 * IMPORTANT:
 *
 * This route MUST NOT:
 *
 * - query Prisma directly
 * - expose internal Vendor identity
 * - expose internal quotation remarks
 * - manually remove Vendor fields
 * - duplicate customer-safe masking rules
 * - mutate quotation or booking state
 *
 * Customer-safe masking remains the responsibility of
 * the Quotation domain/service layer.
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

export interface CustomerSelectedBookingQuotationRouteContext {
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

function getCustomerSelectedBookingQuotationRequestId(
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

function getCustomerSelectedBookingQuotationRequestIp(
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

function getCustomerSelectedBookingQuotationAuthenticatedUserId(
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

function mapCustomerSelectedBookingQuotationRequestHeaders(
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

function createCustomerSelectedBookingQuotationControllerMetadata(
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
    getCustomerSelectedBookingQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getCustomerSelectedBookingQuotationAuthenticatedUserId(
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
      mapCustomerSelectedBookingQuotationRequestHeaders(
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

function toNextCustomerSelectedBookingQuotationResponse<
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

function createInvalidCustomerSelectedBookingQuotationParamsResponse(
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

function createCustomerSelectedBookingQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Customer Selected Booking Quotation API]",
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
          "CUSTOMER_SELECTED_BOOKING_QUOTATION_ROUTE_ERROR",

        message:
          "Unable to retrieve the customer-safe selected Booking quotation.",
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

async function resolveCustomerSelectedBookingQuotationBookingId(
  context:
    CustomerSelectedBookingQuotationRouteContext
): Promise<string> {
  const params =
    await context.params;

  return params
    .bookingId
    ?.trim() ??
    "";
}

/* ============================================================================
 * GET /api/bookings/:bookingId/quotation/customer/selected
 * ============================================================================
 */

export async function GET(
  request:
    Request,
  context:
    CustomerSelectedBookingQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getCustomerSelectedBookingQuotationRequestId(
      request
    );

  try {
    /* ------------------------------------------------------------------------
     * 1. Resolve bookingId
     * ------------------------------------------------------------------------
     */

    const bookingId =
      await resolveCustomerSelectedBookingQuotationBookingId(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidCustomerSelectedBookingQuotationParamsResponse(
        requestId
      );
    }

    /* ------------------------------------------------------------------------
     * 2. Resolve canonical Quotation module
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

      ...createCustomerSelectedBookingQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    /* ------------------------------------------------------------------------
     * 4. Delegate customer-safe selected quotation lookup
     *
     * IMPORTANT:
     *
     * The route does NOT manually strip:
     *
     * - vendorId
     * - companyName
     * - vendorName
     * - internalRemarks
     *
     * Customer-safe transformation remains below the controller boundary.
     * ------------------------------------------------------------------------
     */

    const response =
      await module
        .controller
        .getCustomerSafeSelectedByBooking(
          controllerRequest
        );

    /* ------------------------------------------------------------------------
     * 5. Return canonical controller response
     * ------------------------------------------------------------------------
     */

    return toNextCustomerSelectedBookingQuotationResponse(
      response,
      requestId
    );
  } catch (
    error
  ) {
    return createCustomerSelectedBookingQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}