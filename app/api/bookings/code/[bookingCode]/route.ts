import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  BookingPrismaRepository,
} from "@/domains/booking/repositories/booking.prisma.repository";

import {
  BookingService,
} from "@/domains/booking/services/booking.service";

import {
  createBookingModule,
} from "@/domains/booking/booking.module";

const bookingModule =
  createBookingModule();

const bookingService =
  bookingModule.service;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    bookingCode: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { bookingCode } =
      await context.params;

    if (!bookingCode?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking code is required.",
        },
        {
          status: 400,
        }
      );
    }

    const booking =
      await bookingService.getBookingByCode(
        bookingCode
      );

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
          errorCode:
            "BOOKING_NOT_FOUND",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unable to retrieve booking:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      {
        status: 500,
      }
    );
  }
}