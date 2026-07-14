/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Booking Types

   File: booking.types.ts

============================================================ */

/* ============================================================
   Booking Status
============================================================ */

export enum BookingStatus {

  DRAFT = "draft",

  PENDING = "pending",

  CONFIRMED = "confirmed",

  ASSIGNED = "assigned",

  IN_PROGRESS = "in-progress",

  COMPLETED = "completed",

  CANCELLED = "cancelled",

}

/* ============================================================
   Payment Status
============================================================ */

export enum PaymentStatus {

  PENDING = "pending",

  PARTIAL = "partial",

  PAID = "paid",

  FAILED = "failed",

  REFUNDED = "refunded",

}

/* ============================================================
   Payment Method
============================================================ */

export enum PaymentMethod {

  CASH = "cash",

  CARD = "card",

  UPI = "upi",

  NET_BANKING = "net-banking",

  WALLET = "wallet",

}

/* ============================================================
   Customer
============================================================ */

export interface BookingCustomer {

  id: string

  fullName: string

  mobile: string

  email: string

}

/* ============================================================
   Booking Address
============================================================ */

export interface BookingAddress {

  pickupAddressId: string

  dropAddressId: string

}

/* ============================================================
   Booking Summary
============================================================ */

export interface BookingSummary {

  quotationId: string

  vendorId: string

  moveDate: Date

  estimatedDelivery: Date

  totalAmount: number

  currency: string

}

/* ============================================================
   Booking
============================================================ */

export interface Booking {

  id: string

  bookingNumber: string

  customer: BookingCustomer

  address: BookingAddress

  summary: BookingSummary

  bookingStatus: BookingStatus

  paymentStatus: PaymentStatus

  paymentMethod?: PaymentMethod

  createdAt: Date

  updatedAt: Date

}

/* ============================================================
   Payment Details
============================================================ */

export interface BookingPayment {

  transactionId?: string

  amountPaid: number

  amountPending: number

  paymentDate?: Date

  gateway?: string

}

/* ============================================================
   Invoice
============================================================ */

export interface BookingInvoice {

  invoiceNumber: string

  invoiceDate: Date

  taxableAmount: number

  taxAmount: number

  grandTotal: number

}

/* ============================================================
   Booking Timeline
============================================================ */

export interface BookingTimelineEvent {

  id: string

  title: string

  description?: string

  status: BookingStatus

  createdAt: Date

}

/* ============================================================
   Cancellation
============================================================ */

export interface BookingCancellation {

  cancelled: boolean

  cancelledAt?: Date

  reason?: string

  refundAmount?: number

}

/* ============================================================
   Tracking
============================================================ */

export interface BookingTracking {

  currentStatus: BookingStatus

  lastUpdated: Date

  estimatedArrival?: Date

}

/* ============================================================
   Booking Confirmation
============================================================ */

export interface BookingConfirmation {

  bookingId: string

  bookingNumber: string

  confirmedAt: Date

  vendorId: string

}

/* ============================================================
   Booking Detail
============================================================ */

export interface BookingDetail {

  booking: Booking

  payment: BookingPayment

  invoice?: BookingInvoice

  tracking: BookingTracking

  cancellation?: BookingCancellation

  timeline: BookingTimelineEvent[]

}

/* ============================================================
   Booking Form State
============================================================ */

export interface BookingFormState {

  loading: boolean

  saving: boolean

  dirty: boolean

  valid: boolean

  booking?: BookingDetail

}

/* ============================================================
   Create Booking Request
============================================================ */

export interface CreateBookingRequest {

  quotationId: string

  vendorId: string

  customerId: string

  paymentMethod: PaymentMethod

}

/* ============================================================
   Update Booking Request
============================================================ */

export interface UpdateBookingRequest {

  bookingId: string

  bookingStatus?: BookingStatus

  paymentStatus?: PaymentStatus

}

/* ============================================================
   Booking Search Request
============================================================ */

export interface BookingSearchRequest {

  customerId?: string

  bookingNumber?: string

  vendorId?: string

}

/* ============================================================
   Booking Search Response
============================================================ */

export interface BookingSearchResponse {

  success: boolean

  bookings: Booking[]

  message?: string

}

/* ============================================================
   Booking Response
============================================================ */

export interface BookingResponse {

  success: boolean

  booking: BookingDetail

  confirmation?: BookingConfirmation

  message?: string

}

/* ============================================================
   Booking Completion
============================================================ */

export interface BookingCompletion {

  bookingId: string

  completedAt: Date

  customerRating?: number

  customerFeedback?: string

}

/* ============================================================
   Booking Statistics
============================================================ */

export interface BookingStatistics {

  totalBookings: number

  completedBookings: number

  cancelledBookings: number

  pendingBookings: number

}

/* ============================================================
   End of File
============================================================ */