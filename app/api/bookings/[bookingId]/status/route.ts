/**
 * ============================================================================
 * EasyMovers
 * Booking Status API Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/status/route.ts
 *
 * Supported operation:
 *
 * PATCH /api/bookings/[bookingId]/status
 * - Changes the Booking workflow status
 *
 * Expected body:
 *
 * {
 *   "status": "SUBMITTED",
 *   "changedBy": "USER_OR_ADMIN_ID",
 *   "reason": "Optional reason",
 *   "remarks": "Optional remarks"
 * }
 *
 * This route delegates mapping, validation and workflow orchestration to the
 * Booking controller.
 * ============================================================================
 */

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getBookingController,
} from "@/domains/booking/booking.module";

import type {
  BookingControllerFailure,
} from "@/domains/booking/controllers/booking.controller";

/* ============================================================================
 * Route configuration
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

interface BookingStatusRouteContext {
  params:
    Promise<{
      bookingId:
        string;
    }>;
}

/* ============================================================================
 * PATCH /api/bookings/[bookingId]/status
 * ============================================================================
 */

/**
 * Changes one Booking workflow status.
 */
export async function PATCH(
  request:
    NextRequest,
  context:
    BookingStatusRouteContext
): Promise<
  NextResponse
> {
  try {
    const bookingId =
      await resolveBookingId(
        context
      );

    const payload =
      await parseJsonBody(
        request
      );

    const result =
      await getBookingController()
        .changeBookingStatus(
          bookingId,
          payload
        );

    if (!result.success) {
      return createFailureResponse(
        result,
        resolveControllerFailureStatus(
          result,
          400
        )
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        data:
          result.data,

        message:
          result.message,

        warnings:
          result.warnings,
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to change Booking status."
    );
  }
}

/* ============================================================================
 * Route helpers
 * ============================================================================
 */

async function resolveBookingId(
  context:
    BookingStatusRouteContext
): Promise<
  string
> {
  const {
    bookingId,
  } =
    await context.params;

  const normalizedBookingId =
    bookingId?.trim();

  if (!normalizedBookingId) {
    throw new BookingStatusRouteRequestError(
      "Booking ID is required.",
      400
    );
  }

  return normalizedBookingId;
}

async function parseJsonBody(
  request:
    NextRequest
): Promise<
  unknown
> {
  const contentType =
    request.headers.get(
      "content-type"
    );

  if (
    !contentType
      ?.toLowerCase()
      .includes(
        "application/json"
      )
  ) {
    throw new BookingStatusRouteRequestError(
      "Content-Type must be application/json.",
      415
    );
  }

  try {
    const payload:
      unknown =
      await request.json();

    if (
      typeof payload !==
        "object" ||
      payload ===
        null ||
      Array.isArray(
        payload
      )
    ) {
      throw new BookingStatusRouteRequestError(
        "Request body must be a JSON object.",
        400
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof
      BookingStatusRouteRequestError
    ) {
      throw error;
    }

    throw new BookingStatusRouteRequestError(
      "Request body contains invalid JSON.",
      400
    );
  }
}

/* ============================================================================
 * Failure handling
 * ============================================================================
 */

class BookingStatusRouteRequestError
  extends Error {
  constructor(
    message:
      string,
    readonly status:
      number
  ) {
    super(
      message
    );

    this.name =
      "BookingStatusRouteRequestError";

    Object.setPrototypeOf(
      this,
      BookingStatusRouteRequestError
        .prototype
    );
  }
}

function resolveControllerFailureStatus(
  result:
    BookingControllerFailure,
  fallback:
    number
): number {
  switch (
    result.error.code
  ) {
    case "BOOKING_NOT_FOUND":
      return 404;

    case "BOOKING_REQUEST_MAPPING_FAILED":
    case "BOOKING_VALIDATION_FAILED":
    case "INVALID_REQUEST":
    case "REQUIRED":
    case "INVALID":
    case "INVALID_FORMAT":
    case "INVALID_LENGTH":
    case "INVALID_VALUE":
    case "DUPLICATE":
    case "OUT_OF_RANGE":
    case "BUSINESS_RULE":
      return 400;

    case "BOOKING_CODE_EXISTS":
      return 409;

    case "BOOKING_CREATE_FAILED":
    case "BOOKING_UPDATE_FAILED":
    case "BOOKING_DELETE_FAILED":
    case "BOOKING_LOOKUP_FAILED":
    case "BOOKING_SEARCH_FAILED":
    case "BOOKING_OPERATION_FAILED":
    case "BOOKING_CONTROLLER_ERROR":
      return 500;

    default:
      return fallback;
  }
}

function createFailureResponse(
  result:
    BookingControllerFailure,
  status:
    number
): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      error:
        result.error,

      warnings:
        result.warnings,
    },
    {
      status,
    }
  );
}

function handleRouteError(
  error:
    unknown,
  fallbackMessage:
    string
): NextResponse {
  if (
    error instanceof
    BookingStatusRouteRequestError
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error: {
          code:
            "INVALID_REQUEST",

          message:
            error.message,
        },
      },
      {
        status:
          error.status,
      }
    );
  }

  console.error(
    fallbackMessage,
    error
  );

  return NextResponse.json(
    {
      success:
        false,

      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          fallbackMessage,
      },
    },
    {
      status:
        500,
    }
  );
}