/**
 * ============================================================================
 * EasyMovers
 * Booking Quotation Acceptance Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/quotation/[quotationId]/accept/route.ts
 *
 * Endpoint:
 *
 * POST /api/bookings/:bookingId/quotation/:quotationId/accept
 *
 * Workflow:
 *
 * Request
 *   ↓
 * QuotationController.accept()
 *   ↓
 * Accepted Quotation
 *   ↓
 * QuotationController.getBookingSummary()
 *   ↓
 * BookingController.confirmFromQuotation()
 *   ↓
 * Booking CONFIRMED
 *
 * IMPORTANT:
 *
 * - Route does not query Prisma directly.
 * - Route does not change Quotation status directly.
 * - Route does not change Booking persistence directly.
 * - Quotation domain remains responsible for acceptance business rules.
 * - Booking domain remains responsible for confirmation business rules.
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

import {
  getBookingModule,
} from "@/domains/booking/booking.module";

import type {
  AcceptQuotationControllerBody,
  BookingQuotationRouteParams,
  QuotationControllerRecord,
  QuotationControllerRequest,
  QuotationControllerResponse,
} from "@/domains/quotation/controllers/quotation.controller";

import type {
  Quotation,
} from "@/domains/quotation/models/quotation.model";

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

export interface AcceptQuotationRouteContext {
  params:
    Promise<{
      bookingId:
        string;

      quotationId:
        string;
    }>;
}

/* ============================================================================
 * Booking quotation summary
 * ============================================================================
 *
 * QuotationController.getBookingSummary() intentionally returns
 * QuotationControllerResponse<unknown>.
 *
 * The route narrows that successful response to the fields required for
 * Booking confirmation.
 * ============================================================================
 */

interface BookingQuotationSummaryData {
  bookingId:
    string;

  totalQuotations:
    number;

  lowestAmount?:
    number;

  highestAmount?:
    number;

  selectedQuotationId?:
    string;

  selectedAmount?:
    number;
}

/* ============================================================================
 * Request ID
 * ============================================================================
 */

function getAcceptQuotationRequestId(
  request:
    Request
): string {
  const existing =
    request.headers
      .get(
        "x-request-id"
      )
      ?.trim();

  return (
    existing ||
    randomUUID()
  );
}

/* ============================================================================
 * Request IP
 * ============================================================================
 */

function getAcceptQuotationRequestIp(
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
    return (
      forwarded
        .split(
          ","
        )[0]
        ?.trim() ||
      undefined
    );
  }

  const realIp =
    request.headers
      .get(
        "x-real-ip"
      )
      ?.trim();

  return (
    realIp ||
    undefined
  );
}

/* ============================================================================
 * Authenticated user
 * ============================================================================
 */

/**
 * Temporary bridge until the final EasyMovers authentication/session layer
 * supplies the authenticated actor.
 */
function getAcceptQuotationAuthenticatedUserId(
  request:
    Request
): string | undefined {
  const userId =
    request.headers
      .get(
        "x-user-id"
      )
      ?.trim();

  return (
    userId ||
    undefined
  );
}

/* ============================================================================
 * Request headers
 * ============================================================================
 */

function mapAcceptQuotationRequestHeaders(
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

function createAcceptQuotationControllerMetadata(
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
    getAcceptQuotationRequestIp(
      request
    );

  const userAgent =
    request.headers
      .get(
        "user-agent"
      )
      ?.trim();

  const authenticatedUserId =
    getAcceptQuotationAuthenticatedUserId(
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
      mapAcceptQuotationRequestHeaders(
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

function toNextAcceptQuotationResponse<
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
      ] of Object.entries(
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

function createInvalidAcceptQuotationJsonResponse(
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
 * Invalid route params
 * ============================================================================
 */

function createInvalidAcceptQuotationParamsResponse(
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
 * Booking synchronization errors
 * ============================================================================
 */

function createBookingSummaryFailureResponse(
  requestId:
    string,
  bookingId:
    string,
  quotationId:
    string,
  response:
    QuotationControllerResponse<
      unknown
    >
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "BOOKING_CONFIRMATION_SUMMARY_FAILED",

        message:
          "Quotation was accepted, but the Booking quotation summary could not be resolved.",

        details: {
          bookingId,

          quotationId,

          quotationAccepted:
            true,

          summaryError:
            response
              .body
              .error,
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
        500,

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

function createAcceptQuotationRouteErrorResponse(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Quotation Acceptance API]",
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
          "QUOTATION_ACCEPTANCE_ROUTE_ERROR",

        message:
          "Unable to process the quotation acceptance request.",
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
 * Resolve route params
 * ============================================================================
 */

async function resolveAcceptQuotationParams(
  context:
    AcceptQuotationRouteContext
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
 * Summary narrowing
 * ============================================================================
 */

function isBookingQuotationSummaryData(
  value:
    unknown
): value is BookingQuotationSummaryData {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false;
  }

  const record =
    value as
      Record<
        string,
        unknown
      >;

  return (
    typeof record
      .bookingId ===
      "string" &&
    typeof record
      .totalQuotations ===
      "number" &&
    Number.isFinite(
      record
        .totalQuotations
    )
  );
}

/* ============================================================================
 * POST
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    AcceptQuotationRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getAcceptQuotationRequestId(
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
    return createInvalidAcceptQuotationJsonResponse(
      requestId
    );
  }

  try {
    /* ------------------------------------------------------------------------
     * 2. Resolve route parameters
     * ------------------------------------------------------------------------
     */

    const {
      bookingId,
      quotationId,
    } =
      await resolveAcceptQuotationParams(
        context
      );

    if (
      !bookingId
    ) {
      return createInvalidAcceptQuotationParamsResponse(
        requestId,
        "bookingId"
      );
    }

    if (
      !quotationId
    ) {
      return createInvalidAcceptQuotationParamsResponse(
        requestId,
        "quotationId"
      );
    }

    /* ------------------------------------------------------------------------
     * 3. Resolve Quotation module
     * ------------------------------------------------------------------------
     */

    const quotationModule =
      getOrCreateQuotationModule({
        prisma,
      });

    /* ------------------------------------------------------------------------
     * 4. Build Quotation controller request
     * ------------------------------------------------------------------------
     */

    const controllerRequest:
      QuotationControllerRequest<
        AcceptQuotationControllerBody,
        BookingQuotationRouteParams
      > = {
      body:
        body as
          AcceptQuotationControllerBody,

      params: {
        bookingId,
        quotationId,
      },

      ...createAcceptQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    /* ------------------------------------------------------------------------
     * 5. Accept selected quotation
     * ------------------------------------------------------------------------
     */

    const acceptanceResponse =
      await quotationModule
        .controller
        .accept(
          controllerRequest
        );

    /* ------------------------------------------------------------------------
     * 6. Preserve Quotation-domain failures
     * ------------------------------------------------------------------------
     */

    if (
      acceptanceResponse.status <
        200 ||
      acceptanceResponse.status >=
        300 ||
      !acceptanceResponse
        .body
        .success ||
      !acceptanceResponse
        .body
        .data
    ) {
      return toNextAcceptQuotationResponse(
        acceptanceResponse,
        requestId
      );
    }

    /* ------------------------------------------------------------------------
     * 7. Accepted internal quotation
     * ------------------------------------------------------------------------
     */

    const acceptedQuotation =
      acceptanceResponse
        .body
        .data as
          Quotation;

    /* ------------------------------------------------------------------------
     * 8. Resolve Booking quotation summary
     * ------------------------------------------------------------------------
     */

    const summaryRequest:
      QuotationControllerRequest<
        unknown,
        BookingQuotationRouteParams,
        QuotationControllerRecord
      > = {
      params: {
        bookingId,
        quotationId,
      },

      ...createAcceptQuotationControllerMetadata(
        request,
        requestId
      ),
    };

    const summaryResponse =
      await quotationModule
        .controller
        .getBookingSummary(
          summaryRequest
        );

    /* ------------------------------------------------------------------------
     * 9. Validate summary response
     * ------------------------------------------------------------------------
     */

    if (
      summaryResponse.status <
        200 ||
      summaryResponse.status >=
        300 ||
      !summaryResponse
        .body
        .success ||
      !isBookingQuotationSummaryData(
        summaryResponse
          .body
          .data
      )
    ) {
      return createBookingSummaryFailureResponse(
        requestId,
        bookingId,
        quotationId,
        summaryResponse
      );
    }

    const bookingQuotationSummary =
      summaryResponse
        .body
        .data;

    /* ------------------------------------------------------------------------
     * 10. Resolve actor
     * ------------------------------------------------------------------------
     */

    const acceptanceBody =
      body as
        AcceptQuotationControllerBody;

    const confirmedBy =
      typeof acceptanceBody
        .acceptedBy ===
          "string"
        ? acceptanceBody
            .acceptedBy
            .trim()
        : "";

    /* ------------------------------------------------------------------------
     * 11. Resolve Booking module
     * ------------------------------------------------------------------------
     */

    const bookingModule =
      getBookingModule();

    /* ------------------------------------------------------------------------
     * 12. Synchronize accepted Quotation -> Booking
     * ------------------------------------------------------------------------
     */

    const bookingResult =
      await bookingModule
        .controller
        .confirmFromQuotation(
          bookingId,
          {
            quotationId:
              acceptedQuotation
                .quotationId,

            vendorId:
              acceptedQuotation
                .vendor
                .vendorId,

            ...(acceptedQuotation
              .vendor
              .vendorCode
              ? {
                  vendorCode:
                    acceptedQuotation
                      .vendor
                      .vendorCode,
                }
              : {}),

            ...(acceptedQuotation
              .vendor
              .companyName
              ? {
                  vendorName:
                    acceptedQuotation
                      .vendor
                      .companyName,
                }
              : {}),

            totalQuotations:
              bookingQuotationSummary
                .totalQuotations,

            selectedQuoteAmount:
              acceptedQuotation
                .costs
                .totalAmount,

            currency:
              acceptedQuotation
                .costs
                .currency,

            ...(acceptedQuotation
              .validUntil
              ? {
                  quotationExpiryDate:
                    acceptedQuotation
                      .validUntil,
                }
              : {}),

            confirmedBy,
          }
        );

    /* ------------------------------------------------------------------------
     * 13. Booking synchronization failure
     * ------------------------------------------------------------------------
     */

    if (
      !bookingResult.success
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error: {
            code:
              "BOOKING_CONFIRMATION_FAILED",

            message:
              "Quotation was accepted, but Booking confirmation failed.",

            details: {
              bookingId,

              quotationId,

              quotationAccepted:
                true,

              bookingError:
                bookingResult
                  .error,
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
            409,

          headers: {
            "x-request-id":
              requestId,
          },
        }
      );
    }

    /* ------------------------------------------------------------------------
     * 14. Combined success
     * ------------------------------------------------------------------------
     */

    return NextResponse.json(
      {
        success:
          true,

        data: {
          quotation:
            acceptedQuotation,

          booking:
            bookingResult
              .data,
        },

        message:
          bookingResult
            .message ??
          "Quotation accepted and Booking confirmed successfully.",

        meta: {
          requestId,

          timestamp:
            new Date()
              .toISOString(),
        },
      },
      {
        status:
          200,

        headers: {
          "x-request-id":
            requestId,
        },
      }
    );
  } catch (
    error
  ) {
    return createAcceptQuotationRouteErrorResponse(
      requestId,
      error
    );
  }
}