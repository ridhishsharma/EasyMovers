/* -------------------------------------------------------------------------- */
/*                           Booking Repository                               */
/* -------------------------------------------------------------------------- */

import {
  BookingId,
  BookingCode,
  BookingRequest,
  BookingSearchCriteria,
  BookingListItem,
  PaginatedBookingResult,
} from "../models/booking.model";

/**
 * Repository abstraction for Booking persistence.
 *
 * Business rules must NOT be implemented here.
 * The repository is responsible only for data access.
 */
export interface BookingRepository {
  /**
   * Creates a new booking.
   */
  create(
    booking: BookingRequest
  ): Promise<BookingRequest>;

  /**
   * Updates an existing booking.
   */
  update(
    booking: BookingRequest
  ): Promise<BookingRequest>;

  /**
   * Deletes a booking.
   */
  delete(
    bookingId: BookingId
  ): Promise<boolean>;

  /**
   * Finds booking by internal booking id.
   */
  findById(
    bookingId: BookingId
  ): Promise<BookingRequest | null>;

  /**
   * Finds booking by public booking code.
   */
  findByBookingCode(
    bookingCode: BookingCode
  ): Promise<BookingRequest | null>;
  /**
   * Searches bookings using supplied criteria.
   */
  search(
    criteria: BookingSearchCriteria
  ): Promise<PaginatedBookingResult>;

  /**
   * Lists recent bookings.
   */
  list(
    page: number,
    pageSize: number
  ): Promise<BookingListItem[]>;

  /**
   * Returns total booking count.
   */
  count(): Promise<number>;
  /**
   * Checks whether booking exists.
   */
  existsById(
    bookingId: BookingId
  ): Promise<boolean>;

  /**
   * Checks whether booking code exists.
   */
  existsByBookingCode(
    bookingCode: BookingCode
  ): Promise<boolean>;
  /**
   * Saves multiple bookings atomically.
   */
  /**
   * Saves multiple bookings atomically.
   */
  saveMany(
    bookings: BookingRequest[]
  ): Promise<BookingRequest[]>;

  /**
   * Deletes multiple bookings.
   */
  deleteMany(
    bookingIds: BookingId[]
  ): Promise<number>;
}