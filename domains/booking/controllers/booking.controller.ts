/**
 * ============================================================================
 * EasyMovers
 * Booking Controller
 * ============================================================================
 *
 * File:
 * domains/booking/controllers/booking.controller.ts
 *
 * Responsibilities:
 * - Accept framework-independent controller inputs
 * - Map raw request payloads into Booking domain inputs
 * - Call BookingService methods
 * - Convert mapping and service results into controller responses
 *
 * This file does not:
 * - Access Prisma directly
 * - Contain Booking business rules
 * - Parse NextRequest objects
 * - Generate HTTP responses
 * ============================================================================
 */

import type {
  BookingListItem,
  BookingRequest,
  BookingSearchCriteria,
  PaginatedBookingResult,
} from "../models/booking.model";

import type {
  BookingRequestMappingError,
  BookingRequestMappingWarning,
} from "../mappers/booking-request.mapper";

import {
BookingSearchMappingError,
  mapAIInventoryAnalysisRequest,
  mapAssignVendorRequest,
  mapBookingPaymentSummaryRequest,
  mapBookingQuotationSummaryRequest,
  mapBookingSearchQuery,
  mapBookingTrackingSummaryRequest,
  mapCancelBookingRequest,
  mapCreateBookingRequest,
  mapUnassignVendorRequest,
  mapUpdateBookingRequest,
mapBookingTrackingUpdateRequest,
  mapUpdateBookingStatusRequest,
mapConfirmBookingFromQuotationRequest,
} from "../mappers/booking-request.mapper";

import {
  BookingService,
} from "../services/booking.service";

/* ============================================================================
 * Controller dependencies
 * ============================================================================
 */

export interface BookingControllerDependencies {
  service:
    BookingService;
}

/* ============================================================================
 * Controller response contracts
 * ============================================================================
 */

export type BookingControllerErrorCode =
  | "BOOKING_REQUEST_MAPPING_FAILED"
  | "BOOKING_VALIDATION_FAILED"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_CREATE_FAILED"
  | "BOOKING_UPDATE_FAILED"
  | "BOOKING_DELETE_FAILED"
  | "BOOKING_LOOKUP_FAILED"
  | "BOOKING_SEARCH_FAILED"
  | "BOOKING_OPERATION_FAILED"
  | "BOOKING_CONTROLLER_ERROR";

export interface BookingControllerSuccess<T> {
  success: true;

  data: T;

  message?: string;

  warnings?:
    BookingRequestMappingWarning[];
}

export interface BookingControllerFailure {
  success: false;

  error: {
    code:
      BookingControllerErrorCode |
      string;

    message: string;

    mappingErrors?:
      BookingRequestMappingError[];

    validationErrorCode?:
      string;
  };

  warnings?:
    BookingRequestMappingWarning[];
}

export type BookingControllerResult<T> =
  | BookingControllerSuccess<T>
  | BookingControllerFailure;

export interface BookingControllerListData {
  items:
    BookingListItem[];

  page: number;

  pageSize: number;
}

export interface BookingControllerCountData {
  count: number;
}

export interface BookingControllerUpdatedByPayload {
  updatedBy?: unknown;

  data?: unknown;
}

export interface BookingControllerSearchInput {
  searchParams:
    URLSearchParams;
}

/* ============================================================================
 * Controller helper functions
 * ============================================================================
 */

function createControllerSuccess<T>(
  data: T,
  message?: string,
  warnings?:
    BookingRequestMappingWarning[]
): BookingControllerSuccess<T> {
  return {
    success:
      true,

    data,

    message,

    warnings:
      warnings &&
      warnings.length > 0
        ? warnings
        : undefined,
  };
}

function createControllerFailure(
  code:
    BookingControllerErrorCode |
    string,
  message: string,
  options?: {
    mappingErrors?:
      BookingRequestMappingError[];

    validationErrorCode?:
      string;

    warnings?:
      BookingRequestMappingWarning[];
  }
): BookingControllerFailure {
  return {
    success:
      false,

    error: {
      code,

      message,

      mappingErrors:
        options
          ?.mappingErrors,

      validationErrorCode:
        options
          ?.validationErrorCode,
    },

    warnings:
      options
        ?.warnings &&
      options.warnings.length >
        0
        ? options.warnings
        : undefined,
  };
}

function normalizeRequiredString(
  value: unknown
): string | undefined {
  if (
    typeof value !==
    "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}

function mapServiceFailure(
  result: {
    success: boolean;

    message?: string;

    errorCode?: string;
  },
  fallbackCode:
    BookingControllerErrorCode,
  fallbackMessage:
    string
): BookingControllerFailure {
  return createControllerFailure(
    result.errorCode ??
      fallbackCode,

    result.message ??
      fallbackMessage,

    {
      validationErrorCode:
        result.errorCode,
    }
  );
}

function mapUnknownControllerError(
  error: unknown,
  fallbackMessage:
    string
): BookingControllerFailure {
  if (
    error instanceof
      Error &&
    error.message ===
      "Booking not found."
  ) {
    return createControllerFailure(
      "BOOKING_NOT_FOUND",
      error.message
    );
  }

  return createControllerFailure(
    "BOOKING_CONTROLLER_ERROR",
    error instanceof Error
      ? error.message
      : fallbackMessage
  );
}

/* ============================================================================
 * Booking Controller
 * ============================================================================
 */

export class BookingController {
  private readonly service:
    BookingService;

  constructor(
    dependencies:
      BookingControllerDependencies
  ) {
    this.service =
      dependencies.service;
  }

  /**
   * Creates a Booking from a raw request payload.
   */
  async createBooking(
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const mapping =
        mapCreateBookingRequest(
          payload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .createBooking(
            mapping.data
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_CREATE_FAILED",
          "Unable to create booking."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to create booking."
      );
    }
  }

  /**
   * Returns one Booking by internal ID.
   */
  async getBooking(
    bookingId: string
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const normalizedBookingId =
        normalizeRequiredString(
          bookingId
        );

      if (!normalizedBookingId) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking ID is required."
        );
      }

      const booking =
        await this.service
          .getBooking(
            normalizedBookingId
          );

      if (!booking) {
        return createControllerFailure(
          "BOOKING_NOT_FOUND",
          "Booking not found."
        );
      }

      return createControllerSuccess(
        booking
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to retrieve booking."
      );
    }
  }

  /**
   * Returns one Booking by public Booking code.
   */
  async getBookingByCode(
    bookingCode: string
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const normalizedBookingCode =
        normalizeRequiredString(
          bookingCode
        );

      if (
        !normalizedBookingCode
      ) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking code is required."
        );
      }

      const booking =
        await this.service
          .getBookingByCode(
            normalizedBookingCode
          );

      if (!booking) {
        return createControllerFailure(
          "BOOKING_NOT_FOUND",
          "Booking not found."
        );
      }

      return createControllerSuccess(
        booking
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to retrieve booking."
      );
    }
  }

  /**
   * Updates editable Booking details.
   *
   * Expected payload:
   *
   * {
   *   updatedBy: string,
   *   booking: { ...partial booking fields }
   * }
   */
  async updateBooking(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      if (
        typeof payload !==
          "object" ||
        payload === null ||
        Array.isArray(
          payload
        )
      ) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking update payload must be an object."
        );
      }

      const record =
        payload as
          Record<
            string,
            unknown
          >;

      const updatedBy =
        normalizeRequiredString(
          record.updatedBy
        );

      if (!updatedBy) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "updatedBy is required."
        );
      }

      const bookingPayload =
        record.booking ??
        record.data;

      const mapping =
        mapUpdateBookingRequest(
          bookingPayload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking update request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .updateBooking(
            bookingId,
            mapping.data,
            updatedBy
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to update booking."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to update booking."
      );
    }
  }

  /**
   * Changes Booking workflow status.
   */
  async changeBookingStatus(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const mapping =
        mapUpdateBookingStatusRequest(
          bookingId,
          payload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking status request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .changeBookingStatus(
            bookingId,
            mapping.data
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to change booking status."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to change booking status."
      );
    }
  }

  /**
   * Assigns a Vendor to a Booking.
   */
  async assignVendor(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const mapping =
        mapAssignVendorRequest(
          bookingId,
          payload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Vendor-assignment request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .assignVendor(
            bookingId,
            mapping.data
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to assign Vendor."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to assign Vendor."
      );
    }
  }

  /**
   * Removes an assigned Vendor.
   */
  async unassignVendor(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const mapping =
        mapUnassignVendorRequest(
          bookingId,
          payload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Vendor-unassignment request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .unassignVendor(
            bookingId,
            mapping.data
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to unassign Vendor."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to unassign Vendor."
      );
    }
  }

  /**
   * Cancels a Booking.
   */
  async cancelBooking(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      const mapping =
        mapCancelBookingRequest(
          bookingId,
          payload
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Booking-cancellation request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .cancelBooking(
            bookingId,
            mapping.data
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to cancel booking."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to cancel booking."
      );
    }
  }

  /**
   * Applies AI inventory analysis.
   *
   * Expected payload:
   *
   * {
   *   updatedBy: string,
   *   analysis: { ... }
   * }
   */
  async applyAIInventoryAnalysis(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      if (
        typeof payload !==
          "object" ||
        payload === null ||
        Array.isArray(
          payload
        )
      ) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "AI analysis payload must be an object."
        );
      }

      const record =
        payload as
          Record<
            string,
            unknown
          >;

      const updatedBy =
        normalizeRequiredString(
          record.updatedBy
        );

      if (!updatedBy) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "updatedBy is required."
        );
      }

      const mapping =
        mapAIInventoryAnalysisRequest(
          record.analysis ??
          record.data
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "AI analysis request mapping failed.",
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await this.service
          .applyAIInventoryAnalysis(
            bookingId,
            mapping.data,
            updatedBy
          );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_UPDATE_FAILED",
          "Unable to apply AI analysis."
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to apply AI analysis."
      );
    }
  }

  /**
   * Updates Booking quotation summary.
   */
  async updateQuotation(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    return this.executeUpdatedByOperation(
      bookingId,
      payload,
      "quotation",
      mapBookingQuotationSummaryRequest,
      (
        data,
        updatedBy
      ) =>
        this.service
          .updateQuotation(
            bookingId,
            data,
            updatedBy
          ),
      "Unable to update quotation."
    );
  }
/**
 * Confirms a Booking from an accepted quotation.
 */
async confirmFromQuotation(
  bookingId: string,
  payload: unknown
): Promise<
  BookingControllerResult<
    BookingRequest
  >
> {
  try {
    const mapping =
      mapConfirmBookingFromQuotationRequest(
        bookingId,
        payload
      );

    if (!mapping.success) {
      return createControllerFailure(
        "BOOKING_REQUEST_MAPPING_FAILED",
        "Booking confirmation request mapping failed.",
        {
          mappingErrors:
            mapping.errors,

          warnings:
            mapping.warnings,
        }
      );
    }

    const result =
      await this.service
        .confirmFromQuotation(
          bookingId,
          mapping.data
        );

    if (
      !result.success ||
      !result.booking
    ) {
      return mapServiceFailure(
        result,
        "BOOKING_UPDATE_FAILED",
        "Unable to confirm Booking from quotation."
      );
    }

    return createControllerSuccess(
      result.booking,
      result.message,
      mapping.warnings
    );
  } catch (error) {
    return mapUnknownControllerError(
      error,
      "Unable to confirm Booking from quotation."
    );
  }
}
  /**
   * Updates Booking payment summary.
   */
  async updatePayment(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    return this.executeUpdatedByOperation(
      bookingId,
      payload,
      "payment",
      mapBookingPaymentSummaryRequest,
      (
        data,
        updatedBy
      ) =>
        this.service
          .updatePayment(
            bookingId,
            data,
            updatedBy
          ),
      "Unable to update payment."
    );
  }

  /**
   * Updates Booking tracking summary.
   */
  async updateTracking(
    bookingId: string,
    payload: unknown
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    return this.executeUpdatedByOperation(
      bookingId,
      payload,
      "tracking",
      mapBookingTrackingUpdateRequest,
      (
        data,
        updatedBy
      ) =>
        this.service
          .updateTracking(
            bookingId,
            data,
            updatedBy
          ),
      "Unable to update tracking."
    );
  }

 /**
 * Searches Bookings using URL search parameters.
 */
async searchBookings(
  input:
    BookingControllerSearchInput
): Promise<
  BookingControllerResult<
    PaginatedBookingResult
  >
> {
  try {
    const criteria:
      BookingSearchCriteria =
      mapBookingSearchQuery(
        input.searchParams
      );

    const result =
      await this.service
        .searchBookings(
          criteria
        );

    return createControllerSuccess(
      result
    );
  } catch (error) {
    if (
      error instanceof
        BookingSearchMappingError
    ) {
      return createControllerFailure(
        "BOOKING_REQUEST_MAPPING_FAILED",
        "Booking search request mapping failed.",
        {
          mappingErrors: [
            {
              field:
                error.field,

              code:
                error.code as
                  BookingRequestMappingError["code"],

              message:
                error.message,
            },
          ],
        }
      );
    }

    return mapUnknownControllerError(
      error,
      "Unable to search bookings."
    );
  }
}

/**
   * Lists recent Bookings.
   */
  async listBookings(
    page = 1,
    pageSize = 20
  ): Promise<
    BookingControllerResult<
      BookingControllerListData
    >
  > {
    try {
      const items =
        await this.service
          .listBookings(
            page,
            pageSize
          );

      return createControllerSuccess({
        items,

        page:
          Number.isInteger(
            page
          ) &&
          page > 0
            ? page
            : 1,

        pageSize:
          Number.isInteger(
            pageSize
          ) &&
          pageSize > 0 &&
          pageSize <= 100
            ? pageSize
            : 20,
      });
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to list bookings."
      );
    }
  }

  /**
   * Returns the total Booking count.
   */
  async countBookings():
    Promise<
      BookingControllerResult<
        BookingControllerCountData
      >
    > {
    try {
      const count =
        await this.service
          .countBookings();

      return createControllerSuccess({
        count,
      });
    } catch (error) {
      return mapUnknownControllerError(
        error,
        "Unable to count bookings."
      );
    }
  }

  /**
   * Shared handler for updatedBy + nested payload operations.
   */
  private async executeUpdatedByOperation<T>(
    bookingId: string,
    payload: unknown,
    payloadKey: string,
    mapper:
      (
        value: unknown
      ) =>
        | {
            success: true;

            data: T;

            warnings:
              BookingRequestMappingWarning[];
          }
        | {
            success: false;

            errors:
              BookingRequestMappingError[];

            warnings:
              BookingRequestMappingWarning[];
          },
    operation:
      (
        data: T,
        updatedBy: string
      ) =>
        Promise<{
          success: boolean;

          booking?:
            BookingRequest;

          message?: string;

          errorCode?: string;
        }>,
    fallbackMessage: string
  ): Promise<
    BookingControllerResult<
      BookingRequest
    >
  > {
    try {
      if (
        typeof payload !==
          "object" ||
        payload === null ||
        Array.isArray(
          payload
        )
      ) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "Request payload must be an object."
        );
      }

      const record =
        payload as
          Record<
            string,
            unknown
          >;

      const updatedBy =
        normalizeRequiredString(
          record.updatedBy
        );

      if (!updatedBy) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          "updatedBy is required."
        );
      }

      const mapping =
        mapper(
          record[payloadKey] ??
          record.data
        );

      if (!mapping.success) {
        return createControllerFailure(
          "BOOKING_REQUEST_MAPPING_FAILED",
          `${payloadKey} request mapping failed.`,
          {
            mappingErrors:
              mapping.errors,

            warnings:
              mapping.warnings,
          }
        );
      }

      const result =
        await operation(
          mapping.data,
          updatedBy
        );

      if (
        !result.success ||
        !result.booking
      ) {
        return mapServiceFailure(
          result,
          "BOOKING_OPERATION_FAILED",
          fallbackMessage
        );
      }

      return createControllerSuccess(
        result.booking,
        result.message,
        mapping.warnings
      );
    } catch (error) {
      return mapUnknownControllerError(
        error,
        fallbackMessage
      );
    }
  }
}

/* ============================================================================
 * Controller factory
 * ============================================================================
 */

export function createBookingController(
  dependencies:
    BookingControllerDependencies
): BookingController {
  return new BookingController(
    dependencies
  );
}