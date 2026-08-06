import {
  Booking as PrismaBooking,
  Prisma,
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
import { BookingRepository } from "./booking.repository";

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

  const page = 1;
  const pageSize = 20;

  const where: Prisma.BookingWhereInput = {};;

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

  if (criteria.bookingStatus) {
    where.bookingStatus = criteria.bookingStatus;
  }

  if (criteria.vendorId) {
    where.vendorId = criteria.vendorId;
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