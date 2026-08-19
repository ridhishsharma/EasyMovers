/**
 * ============================================================================
 * EasyMovers
 * Confirm Booking From Quotation Route
 * ============================================================================
 *
 * Endpoint:
 * POST /api/bookings/[bookingId]/confirm-from-quotation
 *
 * Architecture:
 *
 * Route
 *   ↓
 * BookingController.confirmFromQuotation()
 *   ↓
 * BookingService.confirmFromQuotation()
 *   ↓
 * BookingRepository.update()
 *   ↓
 * Prisma
 *
 * ============================================================================
 */

import {
  NextResponse,
} from "next/server";

import {
  randomUUID,
} from "crypto";

import {
  getBookingModule,
} from "@/domains/booking/booking.module";

/* ============================================================================
 * Runtime
 * ============================================================================
 */

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/* ============================================================================
 * Route params
 * ============================================================================
 */

interface ConfirmBookingRouteContext {
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

function getRequestId(
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
 * Error response
 * ============================================================================
 */

function createRouteError(
  requestId:
    string,
  error:
    unknown
): NextResponse {
  console.error(
    "[Booking Confirmation API]",
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
          "BOOKING_CONFIRMATION_ROUTE_ERROR",

        message:
          "Unable to confirm Booking from quotation.",
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
 * POST
 * ============================================================================
 */

export async function POST(
  request:
    Request,
  context:
    ConfirmBookingRouteContext
): Promise<
  NextResponse
> {
  const requestId =
    getRequestId(
      request
    );

  try {
    const {
      bookingId,
    } =
      await context.params;

    /* ------------------------------------------------------------------------
     * 1. Validate route parameter
     * ------------------------------------------------------------------------
     */

    const normalizedBookingId =
      bookingId
        ?.trim();

    if (
      !normalizedBookingId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error: {
            code:
              "INVALID_BOOKING_ID",

            message:
              "bookingId is required.",
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

    /* ------------------------------------------------------------------------
     * 2. Parse JSON body
     * ------------------------------------------------------------------------
     */

    let payload:
      unknown;

    try {
      payload =
        await request.json();
    } catch {
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

    /* ------------------------------------------------------------------------
     * 3. Resolve Booking module
     * ------------------------------------------------------------------------
     */

    const module =
      getBookingModule();

    /* ------------------------------------------------------------------------
     * 4. Delegate to controller
     * ------------------------------------------------------------------------
     */

    const result =
      await module
        .controller
        .confirmFromQuotation(
          normalizedBookingId,
          payload
        );

    /* ------------------------------------------------------------------------
     * 5. Map controller result
     * ------------------------------------------------------------------------
     */

    if (
      !result.success
    ) {
      const code =
        result.error
          .code;

      let status =
        400;

      if (
        code ===
          "BOOKING_NOT_FOUND"
      ) {
        status =
          404;
      } else if (
        code ===
          "BOOKING_CONTROLLER_ERROR"
      ) {
        status =
          500;
      } else if (
        code ===
          "BOOKING_UPDATE_FAILED"
      ) {
        status =
          409;
      }

      return NextResponse.json(
        {
          success:
            false,

          error:
            result.error,

          ...(result.warnings
            ? {
                warnings:
                  result.warnings,
              }
            : {}),

          meta: {
            requestId,

            timestamp:
              new Date()
                .toISOString(),
          },
        },
        {
          status,

          headers: {
            "x-request-id":
              requestId,
          },
        }
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        data:
          result.data,

        ...(result.message
          ? {
              message:
                result.message,
            }
          : {}),

        ...(result.warnings
          ? {
              warnings:
                result.warnings,
            }
          : {}),

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
    return createRouteError(
      requestId,
      error
    );
  }
}