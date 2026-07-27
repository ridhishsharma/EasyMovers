/**
 * Booking Types
 *
 * DTOs and communication types for the Booking Domain.
 *
 * Business entities live in booking.model.ts
 */

import type {
  BookingRequest,
  BookingListItem,
  BookingSearchCriteria,
  BookingPagination,
  BookingOperationResult,
  BookingStatistics,
  CreateBookingInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  AssignVendorInput,
  CancelBookingInput,
} from "../models/booking.model";

/* -------------------------------------------------------------------------- */
/*                               API REQUESTS                                 */
/* -------------------------------------------------------------------------- */

export type CreateBookingRequest = CreateBookingInput;

export type UpdateBookingRequest = UpdateBookingInput;

export type UpdateBookingStatusRequest = UpdateBookingStatusInput;

export type AssignVendorRequest = AssignVendorInput;

export type CancelBookingRequest = CancelBookingInput;

/* -------------------------------------------------------------------------- */
/*                              API RESPONSES                                 */
/* -------------------------------------------------------------------------- */

export interface BookingResponse {
  success: boolean;

  data?: BookingRequest;

  message?: string;

  errorCode?: string;
}

export interface BookingListResponse {
  success: boolean;

  data: BookingListItem[];

  totalRecords: number;

  message?: string;
}

export interface BookingDetailsResponse {
  success: boolean;

  data?: BookingRequest;

  message?: string;

  errorCode?: string;
}

export interface BookingOperationResponse
  extends BookingOperationResult {}

/* -------------------------------------------------------------------------- */
/*                           SEARCH & FILTER TYPES                            */
/* -------------------------------------------------------------------------- */

export interface BookingSearchRequest {
  search?: BookingSearchCriteria;

  pagination?: BookingPagination;
}

/* -------------------------------------------------------------------------- */
/*                               DASHBOARD TYPES                              */
/* -------------------------------------------------------------------------- */

export interface BookingDashboardSummary {
  statistics: BookingStatistics;

  recentBookings: BookingListItem[];
}

/* -------------------------------------------------------------------------- */
/*                            EXPORT TYPES                                    */
/* -------------------------------------------------------------------------- */

export type {
  BookingRequest,
  BookingListItem,
  BookingSearchCriteria,
  BookingPagination,
  BookingStatistics,
  CreateBookingInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  AssignVendorInput,
  CancelBookingInput,
};