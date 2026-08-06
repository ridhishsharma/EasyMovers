/* -------------------------------------------------------------------------- */
/*                             Booking Service                                */
/* -------------------------------------------------------------------------- */

import {
  BookingRequest,
  BookingOperationResult,
  BookingSearchCriteria,
  PaginatedBookingResult,
  CreateBookingInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  AssignVendorInput,
  UnassignVendorInput,
  CancelBookingInput,
  AIInventoryAnalysis,
  BookingQuotationSummary,
  BookingPaymentSummary,
  BookingTrackingSummary,
BookingListItem,
} from "../models/booking.model";

import { BookingRepository } from "../repositories/booking.repository";

import {
  buildNewBooking,
  applyBookingUpdate,
  applyBookingStatusUpdate,
  applyVendorAssignment,
  applyVendorUnassignment,
  applyBookingCancellation,
  applyAIAnalysis,
  applyQuotationSummary,
  applyPaymentSummary,
  applyTrackingSummary,
} from "../builders/booking.builder";

import {
  validateCreateBookingInput,
  validateUpdateBookingInput,
  validateUpdateBookingStatusInput,
  validateAssignVendorInput,
  validateCancelBookingInput,
    validateUnassignVendorInput,
} from "../validators/booking.validator";

/**
 * Booking Service
 *
 * Responsible for:
 * - Business workflow orchestration
 * - Validation
 * - Builder invocation
 * - Repository interaction
 *
 * Does NOT contain persistence logic.
 */
export class BookingService {
  constructor(
    private readonly repository: BookingRepository
  ) {}

  /**
   * Returns booking by id or throws an Error.
   */
 private async getExistingBooking(
  bookingId: string
): Promise<BookingRequest> {
  const booking = await this.repository.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found.");
  }

  return booking;
}

/**
 * Creates and stores a new booking.
 */
async createBooking(
  input: CreateBookingInput
): Promise<BookingOperationResult> {
  const validation = validateCreateBookingInput(input);

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map(error => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const booking = buildNewBooking(input);

  const bookingCodeExists =
    await this.repository.existsByBookingCode(
      booking.bookingCode
    );

  if (bookingCodeExists) {
    return {
      success: false,
      message: "Generated booking code already exists.",
      errorCode: "BOOKING_CODE_EXISTS",
    };
  }

  const createdBooking =
    await this.repository.create(booking);

  return {
    success: true,
    booking: createdBooking,
    message: "Booking created successfully.",
  };
}

/**
 * Updates an existing booking.
 */
async updateBooking(
  bookingId: string,
  input: UpdateBookingInput,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking = await this.getExistingBooking(bookingId);

  const validation =
    validateUpdateBookingInput(
        input,
        booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking = applyBookingUpdate(
    booking,
    input,
    updatedBy
  );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Booking updated successfully.",
  };
}
/**
 * Changes the status of an existing booking.
 */
/**
 * Changes the status of an existing booking.
 */
async changeBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput
): Promise<BookingOperationResult> {
  const booking = await this.getExistingBooking(bookingId);

  const validation =
    validateUpdateBookingStatusInput(
      input,
      booking.status
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking =
    applyBookingStatusUpdate(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Booking status updated successfully.",
  };
}

/**
 * Assigns a vendor to a booking.
 */
async assignVendor(
  bookingId: string,
  input: AssignVendorInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  const validation =
    validateAssignVendorInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map(error => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking =
    applyVendorAssignment(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Vendor assigned successfully.",
  };
}
/**
 * Removes the assigned vendor from a booking.
 */
async unassignVendor(
  bookingId: string,
  input: UnassignVendorInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  const validation =
    validateUnassignVendorInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const updatedBooking =
    applyVendorUnassignment(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Vendor unassigned successfully.",
  };
}
/**
 * Cancels an existing booking.
 */
async cancelBooking(
  bookingId: string,
  input: CancelBookingInput
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  const validation =
    validateCancelBookingInput(
      input,
      booking
    );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors
        .map((error) => error.message)
        .join(", "),
      errorCode: validation.errors[0]?.code,
    };
  }

  const cancelledBooking =
    applyBookingCancellation(
      booking,
      input
    );

  const savedBooking =
    await this.repository.update(cancelledBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Booking cancelled successfully.",
  };
}
/**
 * Applies AI inventory analysis to an existing booking.
 */
async applyAIInventoryAnalysis(
  bookingId: string,
  analysis: AIInventoryAnalysis,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user applying the AI analysis is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }

  const updatedBooking =
    applyAIAnalysis(
      booking,
      analysis,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "AI inventory analysis applied successfully.",
  };
}
/**
 * Updates the quotation summary for a booking.
 */
async updateQuotation(
  bookingId: string,
  quotation: BookingQuotationSummary,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user updating the quotation is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }

  const updatedBooking =
    applyQuotationSummary(
      booking,
      quotation,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Quotation updated successfully.",
  };
}
/**
 * Updates the payment summary for a booking.
 */
async updatePayment(
  bookingId: string,
  payment: BookingPaymentSummary,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user updating the payment is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }

  const updatedBooking =
    applyPaymentSummary(
      booking,
      payment,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Payment updated successfully.",
  };
}
/**
 * Updates the tracking summary for a booking.
 */
async updateTracking(
  bookingId: string,
  tracking: BookingTrackingSummary,
  updatedBy: string
): Promise<BookingOperationResult> {
  const booking =
    await this.getExistingBooking(bookingId);

  if (!updatedBy.trim()) {
    return {
      success: false,
      message: "The user updating the tracking is required.",
      errorCode: "UPDATED_BY_REQUIRED",
    };
  }

  const updatedBooking =
    applyTrackingSummary(
      booking,
      tracking,
      updatedBy
    );

  const savedBooking =
    await this.repository.update(updatedBooking);

  return {
    success: true,
    booking: savedBooking,
    message: "Tracking updated successfully.",
  };
}
/**
 * Returns a booking by its internal ID.
 */
async getBooking(
  bookingId: string
): Promise<BookingRequest | null> {
  return this.repository.findById(bookingId);
}
/**
 * Returns a booking by its public booking code.
 */
async getBookingByCode(
  bookingCode: string
): Promise<BookingRequest | null> {
  return this.repository.findByBookingCode(
    bookingCode
  );
}
/**
 * Searches bookings using the supplied criteria.
 */
async searchBookings(
  criteria: BookingSearchCriteria
): Promise<PaginatedBookingResult> {
  return this.repository.search(criteria);
}
/**
 * Returns a paginated list of recent bookings.
 */
async listBookings(
  page = 1,
  pageSize = 20
): Promise<BookingListItem[]> {
  const safePage =
    Number.isInteger(page) && page > 0
      ? page
      : 1;

  const safePageSize =
    Number.isInteger(pageSize) &&
    pageSize > 0 &&
    pageSize <= 100
      ? pageSize
      : 20;

  return this.repository.list(
    safePage,
    safePageSize
  );
}
/**
 * Returns the total number of bookings.
 */
async countBookings(): Promise<number> {
  return this.repository.count();
}

} // closes BookingService

