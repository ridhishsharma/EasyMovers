import {
  Booking as PrismaBooking,
  Prisma,
  TrackingStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  BookingCode,
  BookingId,
  BookingListItem,
  BookingRequest,
  BookingSearchCriteria,
  PaginatedBookingResult,
} from "../models/booking.model";

import { BookingMapper } from "../mappers/booking.mapper";
import {
  BookingRepository,
  SaveBookingTrackingTransitionInput,
  SaveBookingTrackingTransitionResult,
} from "./booking.repository";

export class BookingPrismaRepository
  implements BookingRepository
{
  /**
   * Converts a Prisma booking record
   * into the domain BookingRequest model.
   */
  private toDomain(
    booking: PrismaBooking
  ): BookingRequest {
    return BookingMapper.fromPrisma(
      booking
    );
  }

private toPrismaTrackingStatus(
  stage:
    SaveBookingTrackingTransitionInput[
      "nextStage"
    ]
): TrackingStatus {
  const normalized =
    String(stage)
      .trim()
      .toUpperCase();

  const values =
    Object.values(
      TrackingStatus
    );

  if (
    !values.includes(
      normalized as
        TrackingStatus
    )
  ) {
    throw new Error(
      `Unsupported tracking stage: ${stage}.`
    );
  }

  return normalized as
    TrackingStatus;
}
  /**
   * Creates a new booking.
   */
  async create(
    booking: BookingRequest
  ): Promise<BookingRequest> {
    const data =
      BookingMapper.toPrisma(booking);

    const createdBooking =
      await prisma.booking.create({
        data,
      });

    return this.toDomain(createdBooking);
  }

  /**
   * Updates an existing booking.
   */
  async update(
    booking: BookingRequest
  ): Promise<BookingRequest> {
    const data =
      BookingMapper.toPrisma(booking);

    const updatedBooking =
      await prisma.booking.update({
        where: {
          id: booking.bookingId,
        },
        data,
      });

    return this.toDomain(updatedBooking);
  }

async saveTrackingTransition(
  input:
    SaveBookingTrackingTransitionInput
): Promise<
  SaveBookingTrackingTransitionResult
> {
  const bookingData =
    BookingMapper.toPrisma(
      input.booking
    );

  const trackingStatus =
    this.toPrismaTrackingStatus(
      input.nextStage
    );

  const estimatedArrival =
    input.estimatedArrival
      ? new Date(
          input.estimatedArrival
        )
      : undefined;

  const actualArrival =
    input.actualArrival
      ? new Date(
          input.actualArrival
        )
      : undefined;

  const result =
    await prisma.$transaction(
      async (
        transaction
      ) => {
        const updatedBooking =
          await transaction
            .booking
            .update({
              where: {
                id:
                  input.booking
                    .bookingId,
              },

              data:
                bookingData,
            });

        const trackingRecord =
          await transaction
            .bookingTracking
            .create({
              data: {
                bookingId:
                  input.booking
                    .bookingId,

                trackingStatus,

                updatedBy:
                  input.updatedBy,

                updatedByRole:
                  input.updatedByRole,

                remarks:
                  input.remarks ??
                  `Tracking changed from ${input.previousStage} to ${input.nextStage}.`,

                location:
                  input.location,

                latitude:
                  input.latitude,

                longitude:
                  input.longitude,

                estimatedArrival,

                actualArrival,

                photoUrl:
                  input.photoUrl,

                signatureUrl:
                  input.signatureUrl,
              },
            });

        return {
          updatedBooking,
          trackingRecord,
        };
      }
    );

  return {
    booking:
      this.toDomain(
        result.updatedBooking
      ),

    trackingRecordId:
      result.trackingRecord.id,
  };
}
  /**
   * Deletes a booking by its internal ID.
   */
  async delete(
    bookingId: BookingId
  ): Promise<boolean> {
    try {
      await prisma.booking.delete({
        where: {
          id: bookingId,
        },
      });

      return true;
    } catch (error) {
      console.error(
        "Failed to delete booking:",
        error
      );

      return false;
    }
  }

  /**
   * Finds a booking by its internal ID.
   */
  async findById(
    bookingId: BookingId
  ): Promise<BookingRequest | null> {
    const booking =
      await prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      });

    if (!booking) {
      return null;
    }

    return this.toDomain(booking);
  }

  /**
   * Finds a booking by its public booking code.
   */
  async findByBookingCode(
    bookingCode: BookingCode
  ): Promise<BookingRequest | null> {
    const booking =
      await prisma.booking.findUnique({
        where: {
          bookingNumber: bookingCode,
        },
      });

    if (!booking) {
      return null;
    }

    return this.toDomain(booking);
  }

  /**
   * Checks whether a booking exists by internal ID.
   */
  async existsById(
    bookingId: BookingId
  ): Promise<boolean> {
    const bookingCount =
      await prisma.booking.count({
        where: {
          id: bookingId,
        },
      });

    return bookingCount > 0;
  }

  /**
   * Checks whether a booking exists by public booking code.
   */
  async existsByBookingCode(
    bookingCode: BookingCode
  ): Promise<boolean> {
    const bookingCount =
      await prisma.booking.count({
        where: {
          bookingNumber: bookingCode,
        },
      });

    return bookingCount > 0;
  }

  /**
   * Returns the total number of bookings.
   */
  async count(): Promise<number> {
    return prisma.booking.count();
  }

  /**
   * Saves multiple bookings in a single database transaction.
   */
  async saveMany(
    bookings: BookingRequest[]
  ): Promise<BookingRequest[]> {
    if (bookings.length === 0) {
      return [];
    }

    const operations = bookings.map(
      (booking) =>
        prisma.booking.upsert({
          where: {
            bookingNumber:
              booking.bookingCode,
          },
          create:
            BookingMapper.toPrisma(
              booking
            ),
          update:
            BookingMapper.toPrisma(
              booking
            ),
        })
    );

    const savedBookings =
      await prisma.$transaction(
        operations
      );

    return savedBookings.map(
      (booking) =>
        this.toDomain(booking)
    );
  }

  /**
   * Deletes multiple bookings.
   *
   * Returns the number of deleted records.
   */
  async deleteMany(
    bookingIds: BookingId[]
  ): Promise<number> {
    if (bookingIds.length === 0) {
      return 0;
    }

    const result =
      await prisma.booking.deleteMany({
        where: {
          id: {
            in: bookingIds,
          },
        },
      });

    return result.count;
  }

  /**
   * Searches bookings using supplied criteria.
   *
   * This will be implemented after confirming the exact fields
   * inside BookingSearchCriteria and PaginatedBookingResult.
   */
 /**
 * Searches bookings using supplied criteria.
 */
async search(
  criteria: BookingSearchCriteria
): Promise<PaginatedBookingResult> {

  const page =
  Number.isInteger(
    criteria.page
  ) &&
  (criteria.page ?? 0) > 0
    ? criteria.page!
    : 1;

const pageSize =
  Number.isInteger(
    criteria.pageSize
  ) &&
  (criteria.pageSize ?? 0) > 0 &&
  (criteria.pageSize ?? 0) <= 100
    ? criteria.pageSize!
    : 20;

  const where: Prisma.BookingWhereInput = {};

  if (criteria.bookingCode) {
    where.bookingNumber = {
      contains: criteria.bookingCode,
      mode: "insensitive",
    };
  }

  if (criteria.mobileNumber) {
    where.customerMobile = {
      contains: criteria.mobileNumber,
    };
  }
if (criteria.leadId) {
  where.leadId =
    criteria.leadId;
}
if (criteria.leadReferenceId) {
  where.leadReferenceId =
    criteria.leadReferenceId;
}
if (criteria.userId) {
  where.userId =
    criteria.userId;
}
  if (criteria.bookingStatus) {
    where.bookingStatus = criteria.bookingStatus;
  }

  if (criteria.vendorId) {
    where.vendorId = criteria.vendorId;
  }

if (criteria.city) {
  where.OR = [
    {
      pickupCity: {
        equals:
          criteria.city,
        mode:
          "insensitive",
      },
    },
    {
      dropCity: {
        equals:
          criteria.city,
        mode:
          "insensitive",
      },
    },
  ];
}

if (criteria.state) {
  where.AND = [
    ...(Array.isArray(where.AND)
      ? where.AND
      : []),
    {
      OR: [
        {
          pickupState: {
            equals:
              criteria.state,
            mode:
              "insensitive",
          },
        },
        {
          dropState: {
            equals:
              criteria.state,
            mode:
              "insensitive",
          },
        },
      ],
    },
  ];
}

if (criteria.serviceType) {
  where.serviceType =
    criteria.serviceType;
}

if (criteria.moveType) {
  where.moveType =
    criteria.moveType;
}
  if (
    criteria.moveDateFrom ||
    criteria.moveDateTo
  ) {
    where.moveDate = {};

    if (criteria.moveDateFrom) {
      where.moveDate.gte = new Date(
        criteria.moveDateFrom
      );
    }

    if (criteria.moveDateTo) {
      where.moveDate.lte = new Date(
        criteria.moveDateTo
      );
    }
  }

  const totalItems =
    await prisma.booking.count({
      where,
    });

  const bookings =
    await prisma.booking.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

  const items: BookingListItem[] =
  bookings.map(
    BookingMapper.toListItem
  );

  const totalPages = Math.ceil(
    totalItems / pageSize
  );

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage:
      page < totalPages,
    hasPreviousPage:
      page > 1,
  };
}

/**
 * Lists recent bookings.
 */
async list(
  page: number,
  pageSize: number
): Promise<BookingListItem[]> {

  const bookings =
    await prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

  return bookings.map(
  BookingMapper.toListItem
);
}
}