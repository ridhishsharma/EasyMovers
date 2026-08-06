/**
 * ============================================================================
 * EasyMovers
 * Booking Item API Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/route.ts
 *
 * Supported operations:
 *
 * GET /api/bookings/[bookingId]
 * - Retrieves one Booking by internal ID
 *
 * PATCH /api/bookings/[bookingId]
 * - Partially updates editable Booking details
 *
 * PUT /api/bookings/[bookingId]
 * - Uses the same update contract as PATCH for current MVP compatibility
 *
 * This route delegates request mapping, validation and Booking operations
 * to the Booking controller composed by booking.module.ts.
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BookingRouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  try {
    const bookingId =
      await resolveBookingId(context);

    const result =
      await getBookingController()
        .getBooking(bookingId);

    if (!result.success) {
      return createFailureResponse(
        result,
        resolveControllerFailureStatus(
          result,
          404
        )
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: result.message,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to retrieve Booking."
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  return updateBookingHandler(
    request,
    context
  );
}

export async function PUT(
  request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  return updateBookingHandler(
    request,
    context
  );
}

async function updateBookingHandler(
  request: NextRequest,
  context: BookingRouteContext
): Promise<NextResponse> {
  try {
    const bookingId =
      await resolveBookingId(context);

    const payload =
      await parseJsonBody(request);

    const result =
      await getBookingController()
        .updateBooking(
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
        success: true,
        data: result.data,
        message: result.message,
        warnings: result.warnings,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to update Booking."
    );
  }
}

async function resolveBookingId(
  context: BookingRouteContext
): Promise<string> {
  const { bookingId } =
    await context.params;

  const normalizedBookingId =
    bookingId?.trim();

  if (!normalizedBookingId) {
    throw new BookingRouteRequestError(
      "Booking ID is required.",
      400
    );
  }

  return normalizedBookingId;
}

async function parseJsonBody(
  request: NextRequest
): Promise<unknown> {
  const contentType =
    request.headers.get(
      "content-type"
    );

  if (
    !contentType
      ?.toLowerCase()
      .includes("application/json")
  ) {
    throw new BookingRouteRequestError(
      "Content-Type must be application/json.",
      415
    );
  }

  try {
    const payload: unknown =
      await request.json();

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new BookingRouteRequestError(
        "Request body must be a JSON object.",
        400
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof
      BookingRouteRequestError
    ) {
      throw error;
    }

    throw new BookingRouteRequestError(
      "Request body contains invalid JSON.",
      400
    );
  }
}

class BookingRouteRequestError
  extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);

    this.name =
      "BookingRouteRequestError";

    Object.setPrototypeOf(
      this,
      BookingRouteRequestError
        .prototype
    );
  }
}

function resolveControllerFailureStatus(
  result: BookingControllerFailure,
  fallback: number
): number {
  switch (result.error.code) {
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
  result: BookingControllerFailure,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: result.error,
      warnings: result.warnings,
    },
    {
      status,
    }
  );
}

function handleRouteError(
  error: unknown,
  fallbackMessage: string
): NextResponse {
  if (
    error instanceof
    BookingRouteRequestError
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: error.message,
        },
      },
      {
        status: error.status,
      }
    );
  }

  console.error(
    fallbackMessage,
    error
  );

  return NextResponse.json(
    {
      success: false,
      error: {
        code:
          "INTERNAL_SERVER_ERROR",
        message: fallbackMessage,
      },
    },
    {
      status: 500,
    }
  );
}