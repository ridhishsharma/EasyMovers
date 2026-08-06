/**
 * ============================================================================
 * EasyMovers
 * Booking Tracking API Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/tracking/route.ts
 *
 * Supported operation:
 *
 * PATCH /api/bookings/[bookingId]/tracking
 * - Updates the Booking tracking summary
 *
 * Expected body:
 *
 * {
 *   "updatedBy": "USER_OR_ADMIN_ID",
 *   "tracking": {
 *     "currentStage": "IN_TRANSIT",
 *     "expectedPickupTime": "2026-08-06T08:30:00.000Z",
 *     "expectedDeliveryTime": "2026-08-06T18:00:00.000Z",
 *     "liveTrackingEnabled": true
 *   }
 * }
 *
 * This route delegates request mapping, validation and workflow orchestration
 * to the Booking controller.
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

interface BookingTrackingRouteContext {
  params:
    Promise<{
      bookingId:
        string;
    }>;
}

/* ============================================================================
 * PATCH /api/bookings/[bookingId]/tracking
 * ============================================================================
 */

/**
 * Updates one Booking tracking summary.
 */
export async function PATCH(
  request:
    NextRequest,
  context:
    BookingTrackingRouteContext
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
        .updateTracking(
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
      "Unable to update Booking tracking."
    );
  }
}

/* ============================================================================
 * Route helpers
 * ============================================================================
 */

async function resolveBookingId(
  context:
    BookingTrackingRouteContext
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
    throw new BookingTrackingRouteRequestError(
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
    throw new BookingTrackingRouteRequestError(
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
      throw new BookingTrackingRouteRequestError(
        "Request body must be a JSON object.",
        400
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof
      BookingTrackingRouteRequestError
    ) {
      throw error;
    }

    throw new BookingTrackingRouteRequestError(
      "Request body contains invalid JSON.",
      400
    );
  }
}

/* ============================================================================
 * Failure handling
 * ============================================================================
 */

class BookingTrackingRouteRequestError
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
      "BookingTrackingRouteRequestError";

    Object.setPrototypeOf(
      this,
      BookingTrackingRouteRequestError
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
    BookingTrackingRouteRequestError
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