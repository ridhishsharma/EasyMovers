/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Booking Mock Data

   File: booking.mock.ts

============================================================ */

import {

  BookingStatus,

  PaymentMethod,

  PaymentStatus,

  type Booking,

  type BookingCustomer,

  type BookingAddress,

  type BookingSummary,

  type BookingPayment,

  type BookingInvoice,

  type BookingTracking,

  type BookingTimelineEvent,

type BookingFormState,

type BookingResponse,

type  BookingSearchResponse,

  type BookingConfirmation,
type BookingCompletion,
  type BookingCancellation,
type BookingStatistics,

  type BookingDetail,

} from "../types/booking.types"

/* ============================================================
   Customer
============================================================ */

export const MOCK_BOOKING_CUSTOMER: BookingCustomer = {

  id: "customer-001",

  fullName: "Rakesh Sharma",

  mobile: "+91-9876543210",

  email: "rakesh.sharma@email.com",

}

/* ============================================================
   Booking Address
============================================================ */

export const MOCK_BOOKING_ADDRESS: BookingAddress = {

  pickupAddressId: "pickup-address-001",

  dropAddressId: "drop-address-001",

}

/* ============================================================
   Booking Summary
============================================================ */

export const MOCK_BOOKING_SUMMARY: BookingSummary = {

  quotationId: "QT-2026-0001",

  vendorId: "vendor-001",

  moveDate: new Date("2026-07-10"),

  estimatedDelivery: new Date("2026-07-16"),

  totalAmount: 53607.4,

  currency: "INR",

}

/* ============================================================
   Booking
============================================================ */

export const MOCK_BOOKING: Booking = {

  id: "booking-001",

  bookingNumber: "BK-2026-0001",

  customer: MOCK_BOOKING_CUSTOMER,

  address: MOCK_BOOKING_ADDRESS,

  summary: MOCK_BOOKING_SUMMARY,

  bookingStatus: BookingStatus.CONFIRMED,

  paymentStatus: PaymentStatus.PARTIAL,

  paymentMethod: PaymentMethod.UPI,

  createdAt: new Date("2026-07-05"),

  updatedAt: new Date("2026-07-05"),

}

/* ============================================================
   Payment
============================================================ */

export const MOCK_BOOKING_PAYMENT: BookingPayment = {

  transactionId: "TXN-202607050001",

  amountPaid: 20000,

  amountPending: 33607.4,

  paymentDate: new Date("2026-07-05"),

  gateway: "Razorpay",

}

/* ============================================================
   Invoice
============================================================ */

export const MOCK_BOOKING_INVOICE: BookingInvoice = {

  invoiceNumber: "INV-2026-0001",

  invoiceDate: new Date("2026-07-05"),

  taxableAmount: 45430,

  taxAmount: 8177.4,

  grandTotal: 53607.4,

}

/* ============================================================
   Tracking
============================================================ */

export const MOCK_BOOKING_TRACKING: BookingTracking = {

  currentStatus: BookingStatus.CONFIRMED,

  lastUpdated: new Date("2026-07-05"),

  estimatedArrival: new Date("2026-07-16"),

}

/* ============================================================
   Timeline
============================================================ */

export const MOCK_BOOKING_TIMELINE: BookingTimelineEvent[] = [

  {

    id: "timeline-001",

    title: "Quotation Created",

    description: "Quotation generated successfully.",

    status: BookingStatus.DRAFT,

    createdAt: new Date("2026-07-04T09:30:00"),

  },

  {

    id: "timeline-002",

    title: "Vendor Selected",

    description: "Raj Packers & Movers selected.",

    status: BookingStatus.PENDING,

    createdAt: new Date("2026-07-05T09:15:00"),

  },

  {

    id: "timeline-003",

    title: "Booking Confirmed",

    description: "Advance payment received.",

    status: BookingStatus.CONFIRMED,

    createdAt: new Date("2026-07-05T10:00:00"),

  },

]

/* ============================================================
   Booking Confirmation
============================================================ */

export const MOCK_BOOKING_CONFIRMATION: BookingConfirmation = {

  bookingId: MOCK_BOOKING.id,

  bookingNumber: MOCK_BOOKING.bookingNumber,

  confirmedAt: new Date("2026-07-05T10:00:00"),

  vendorId: "vendor-001",

}

/* ============================================================
   Cancellation
============================================================ */

/* ============================================================
   Booking Cancellation Mock
============================================================ */

export const MOCK_BOOKING_CANCELLATION: BookingCancellation = {

  cancelled: false,

  cancelledAt: undefined,

  reason: undefined,

  refundAmount: undefined,

}

/* ============================================================
   Booking Detail
============================================================ */

export const MOCK_BOOKING_DETAIL: BookingDetail = {

  booking: MOCK_BOOKING,

  payment: MOCK_BOOKING_PAYMENT,

  invoice: MOCK_BOOKING_INVOICE,

  tracking: MOCK_BOOKING_TRACKING,

  cancellation: MOCK_BOOKING_CANCELLATION,

  timeline: MOCK_BOOKING_TIMELINE,

}

/* ============================================================
   Booking Form State
============================================================ */

export const MOCK_BOOKING_FORM_STATE: BookingFormState = {

  loading: false,

  saving: false,

  dirty: false,

  valid: true,

  booking: MOCK_BOOKING_DETAIL,

}

/* ============================================================
   Booking Search Response
============================================================ */

export const MOCK_BOOKING_SEARCH_RESPONSE: BookingSearchResponse = {

  success: true,

  bookings: [

    MOCK_BOOKING,

  ],

  message: "1 booking found.",

}

/* ============================================================
   Booking Response
============================================================ */

export const MOCK_BOOKING_RESPONSE: BookingResponse = {

  success: true,

  booking: MOCK_BOOKING_DETAIL,

  confirmation: MOCK_BOOKING_CONFIRMATION,

  message: "Booking created successfully.",

}

/* ============================================================
   Booking Completion
============================================================ */

export const MOCK_BOOKING_COMPLETION: BookingCompletion = {

  bookingId: MOCK_BOOKING.id,

  completedAt: new Date("2026-07-16T18:30:00"),

  customerRating: 5,

  customerFeedback:

    "Excellent packing and timely delivery.",

}

/* ============================================================
   Booking Statistics
============================================================ */

export const MOCK_BOOKING_STATISTICS: BookingStatistics = {

  totalBookings: 128,

  completedBookings: 116,

  cancelledBookings: 4,

  pendingBookings: 8,

}

/* ============================================================
   Booking Collection
============================================================ */

export const MOCK_BOOKINGS: Booking[] = [

  MOCK_BOOKING,

]

/* ============================================================
   Default Booking
============================================================ */

export const DEFAULT_BOOKING =

  MOCK_BOOKING

/* ============================================================
   End of File
============================================================ */