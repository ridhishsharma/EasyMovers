/**
 * ============================================================================
 * EasyMovers
 * Booking Collection API Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/route.ts
 *
 * Supported operations:
 *
 * POST /api/bookings
 * - Creates a new Booking
 *
 * GET /api/bookings
 * - Lists recent Bookings
 *
 * GET /api/bookings?bookingCode=...
 * - Retrieves one Booking by public Booking code
 *
 * GET /api/bookings?search=true&...
 * - Searches Bookings using supported filters
 *
 * GET /api/bookings?count=true
 * - Returns the total Booking count
 *
 * This route delegates request mapping and Booking operations to the
 * Booking controller composed by booking.module.ts.
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
 * POST /api/bookings
 * ============================================================================
 */

/**
 * Creates a new Booking.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const payload =
      await parseJsonBody(
        request
      );

    const result =
      await getBookingController()
        .createBooking(
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
          201,
      }
    );
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to create Booking."
    );
  }
}

/* ============================================================================
 * GET /api/bookings
 * ============================================================================
 */

/**
 * Retrieves, searches, lists or counts Bookings.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const {
      searchParams,
    } = new URL(
      request.url
    );
    const hasBookingId =
      searchParams.has(
        "bookingId"
      );

    const rawBookingId =
      searchParams.get(
        "bookingId"
      );

    if (
      hasBookingId &&
      (
        rawBookingId === null ||
        rawBookingId.trim()
          .length === 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error: {
            code:
              "BOOKING_REQUEST_MAPPING_FAILED",

            message:
              "bookingId is required when the bookingId parameter is supplied.",
          },
        },
        {
          status: 400,
        }
      );
    }

    const hasBookingCode =
      searchParams.has(
        "bookingCode"
      );

    const rawBookingCode =
      searchParams.get(
        "bookingCode"
      );

    if (
      hasBookingCode &&
      (
        rawBookingCode === null ||
        rawBookingCode.trim()
          .length === 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          error: {
            code:
              "BOOKING_REQUEST_MAPPING_FAILED",

            message:
              "bookingCode is required when the bookingCode parameter is supplied.",
          },
        },
        {
          status: 400,
        }
      );
    }
    const bookingId =
      cleanString(
        searchParams.get(
          "bookingId"
        )
      );

    if (bookingId) {
      const result =
        await getBookingController()
          .getBooking(
            bookingId
          );

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
          success:
            true,

          data:
            result.data,

          message:
            result.message,
        },
        {
          status:
            200,
        }
      );
    }

    const bookingCode =
      cleanString(
        searchParams.get(
          "bookingCode"
        )
      );

    const searchRequested =
      shouldSearch(
        searchParams
      );

    if (
      bookingCode &&
      !searchRequested
    ) {
      const result =
        await getBookingController()
          .getBookingByCode(
            bookingCode
          );

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
          success:
            true,

          data:
            result.data,

          message:
            result.message,
        },
        {
          status:
            200,
        }
      );
    }

    if (
      searchParams.get(
        "count"
      ) ===
      "true"
    ) {
      const result =
        await getBookingController()
          .countBookings();

      if (!result.success) {
        return createFailureResponse(
          result,
          resolveControllerFailureStatus(
            result,
            500
          )
        );
      }

      return NextResponse.json(
        {
          success:
            true,

          data:
            result.data,
        },
        {
          status:
            200,
        }
      );
    }

    if (searchRequested) {
      const result =
        await getBookingController()
          .searchBookings({
            searchParams,
          });

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
        },
        {
          status:
            200,
        }
      );
    }

    const page =
      parsePositiveInteger(
        searchParams.get(
          "page"
        ),
        1
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get(
          "pageSize"
        ),
        20,
        100
      );

    const result =
      await getBookingController()
        .listBookings(
          page,
          pageSize
        );

    if (!result.success) {
      return createFailureResponse(
        result,
        resolveControllerFailureStatus(
          result,
          500
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
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to retrieve Bookings."
    );
  }
}

/* ============================================================================
 * Request helpers
 * ============================================================================
 */

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
      .includes(
        "application/json"
      )
  ) {
    throw new BookingRouteRequestError(
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

function cleanString(
  value: string |
    null
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function parsePositiveInteger(
  value: string |
    null,
  fallback: number,
  maximum =
    Number.MAX_SAFE_INTEGER
): number {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number(
      value
    );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed <=
      0 ||
    parsed >
      maximum
  ) {
    return fallback;
  }

  return parsed;
}

function shouldSearch(
  searchParams:
    URLSearchParams
): boolean {
  if (
    searchParams.get(
      "search"
    ) ===
    "true"
  ) {
    return true;
  }

  const searchKeys = [
    "bookingCode",
    "leadId",
    "leadReferenceId",
    "userId",
    "vendorId",
    "mobileNumber",
    "city",
    "state",
    "bookingStatus",
    "serviceType",
    "moveType",
    "moveDateFrom",
    "moveDateTo",
  ];

  return searchKeys.some(
    (key) =>
      cleanString(
        searchParams.get(
          key
        )
      ) !==
      undefined
  );
}
/* ============================================================================
 * Failure handling
 * ============================================================================
 */

class BookingRouteRequestError
  extends Error {
  constructor(
    message: string,
    readonly status:
      number
  ) {
    super(
      message
    );

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
  error: unknown,
  fallbackMessage:
    string
): NextResponse {
  if (
    error instanceof
    BookingRouteRequestError
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