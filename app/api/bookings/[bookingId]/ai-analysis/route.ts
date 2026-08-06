/**
 * ============================================================================
 * EasyMovers
 * Booking AI Inventory Analysis API Route
 * ============================================================================
 *
 * File:
 * app/api/bookings/[bookingId]/ai-analysis/route.ts
 *
 * Supported operation:
 *
 * PATCH /api/bookings/[bookingId]/ai-analysis
 * - Applies AI-generated inventory analysis to an existing Booking
 *
 * Expected body:
 *
 * {
 *   "updatedBy": "USER_OR_ADMIN_ID",
 *   "analysis": {
 *     "analyzed": true,
 *     "confidenceScore": 0.92,
 *     "estimatedWeightKg": 850,
 *     "estimatedVolumeCubicFeet": 420,
 *     "recommendedVehicle": "17 FT TRUCK",
 *     "recommendedCrewSize": 5,
 *     "packingDifficulty": "MEDIUM",
 *     "estimatedPackingTimeHours": 6,
 *     "remarks": [
 *       "Fragile packing is recommended.",
 *       "A pre-move survey may improve accuracy."
 *     ]
 *   }
 * }
 *
 * This route delegates request mapping and workflow orchestration to the
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

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

interface BookingAIAnalysisRouteContext {
  params:
    Promise<{
      bookingId:
        string;
    }>;
}

/**
 * PATCH /api/bookings/[bookingId]/ai-analysis
 */
export async function PATCH(
  request:
    NextRequest,
  context:
    BookingAIAnalysisRouteContext
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
        .applyAIInventoryAnalysis(
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
      "Unable to apply Booking AI inventory analysis."
    );
  }
}

async function resolveBookingId(
  context:
    BookingAIAnalysisRouteContext
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
    throw new BookingAIAnalysisRouteRequestError(
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
    throw new BookingAIAnalysisRouteRequestError(
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
      throw new BookingAIAnalysisRouteRequestError(
        "Request body must be a JSON object.",
        400
      );
    }

    return payload;
  } catch (error) {
    if (
      error instanceof
      BookingAIAnalysisRouteRequestError
    ) {
      throw error;
    }

    throw new BookingAIAnalysisRouteRequestError(
      "Request body contains invalid JSON.",
      400
    );
  }
}

class BookingAIAnalysisRouteRequestError
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
      "BookingAIAnalysisRouteRequestError";

    Object.setPrototypeOf(
      this,
      BookingAIAnalysisRouteRequestError
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
    BookingAIAnalysisRouteRequestError
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