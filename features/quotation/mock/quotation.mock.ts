/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Quotation Mock Data

   File: quotation.mock.ts

============================================================ */

import {

  MoveType,

  QuotationStatus,

  QuotationType,

  type MoveDetails,

  type Quotation,

  type QuotationAddresses,

  type QuotationBooking,

  type QuotationCustomer,

  type QuotationInventory,

  type QuotationMetadata,

  type QuotationPricing,

  type QuotationServices,

  type QuotationSummary,
type QuotationDetail,
  type QuotationVendor,
type QuotationFormState,
type QuotationSearchResponse,
type QuotationResponse,
type QuotationStatistics,

} from "../types/quotation.types"

import {

  MOCK_PICKUP_ADDRESS,

  MOCK_DROP_ADDRESS,

} from "./address.mock"

import {

  MOCK_2BHK_INVENTORY,
MOCK_INVENTORY_SUMMARY,

} from "./inventory.mock"

import {

  MOCK_SELECTED_SERVICES,

} from "./service.mock"

import {

  MOCK_PRICING_RESULT,

} from "./pricing.mock"

import {

  MOCK_VENDOR_1,

  MOCK_VENDOR_2,

  MOCK_VENDOR_3,

} from "./vendor.mock"

import {

  MOCK_BOOKING_CUSTOMER,

  MOCK_BOOKING_DETAIL,

} from "./booking.mock"

/* ============================================================
   Customer
============================================================ */

export const MOCK_QUOTATION_CUSTOMER: QuotationCustomer = {

  id: MOCK_BOOKING_CUSTOMER.id,

  fullName: MOCK_BOOKING_CUSTOMER.fullName,

  mobile: MOCK_BOOKING_CUSTOMER.mobile,

  email: MOCK_BOOKING_CUSTOMER.email,

}

/* ============================================================
   Move Details
============================================================ */

export const MOCK_MOVE_DETAILS: MoveDetails = {

  moveType: MoveType.INTERSTATE,

  moveDate: new Date("2026-07-10"),

  estimatedDelivery: new Date("2026-07-16"),

  flexibleDates: false,

  distanceInKm: 1580,

  remarks:

    "Customer requested careful handling for fragile items.",

}

/* ============================================================
   Addresses
============================================================ */

export const MOCK_QUOTATION_ADDRESSES: QuotationAddresses = {

  pickup: MOCK_PICKUP_ADDRESS,

  drop: MOCK_DROP_ADDRESS,

}

/* ============================================================
   Inventory
============================================================ */



export const MOCK_QUOTATION_INVENTORY: QuotationInventory = {

  rooms: MOCK_2BHK_INVENTORY,

  summary: MOCK_INVENTORY_SUMMARY,

}

/* ============================================================
   Services
============================================================ */

export const MOCK_QUOTATION_SERVICES: QuotationServices = {

  selectedServices: MOCK_SELECTED_SERVICES,

}
/* ============================================================
   Pricing
============================================================ */

export const MOCK_QUOTATION_PRICING: QuotationPricing = {

  pricing: MOCK_PRICING_RESULT,

}

/* ============================================================
   Vendor
============================================================ */

export const MOCK_QUOTATION_VENDOR: QuotationVendor = {

  selectedVendor: MOCK_VENDOR_1,

  comparedVendors: [

    MOCK_VENDOR_1,

    MOCK_VENDOR_2,

    MOCK_VENDOR_3,

  ],

}

/* ============================================================
   Booking
============================================================ */

export const MOCK_QUOTATION_BOOKING: QuotationBooking = {

  booking: MOCK_BOOKING_DETAIL,

  converted: true,

}

/* ============================================================
   Summary
============================================================ */

export const MOCK_QUOTATION_SUMMARY: QuotationSummary = {

  quotationNumber: "QT-2026-0001",

  quotationType: QuotationType.HOUSEHOLD,

  quotationStatus: QuotationStatus.CONVERTED,

  moveDate: MOCK_MOVE_DETAILS.moveDate,

  estimatedDelivery: MOCK_MOVE_DETAILS.estimatedDelivery,

  totalAmount:

    MOCK_PRICING_RESULT.total.grandTotal,

  currency:

    MOCK_PRICING_RESULT.total.currency,

}

/* ============================================================
   Metadata
============================================================ */

export const MOCK_QUOTATION_METADATA: QuotationMetadata = {

  createdAt: new Date("2026-07-05T09:30:00"),

  updatedAt: new Date("2026-07-05T10:45:00"),

  createdBy: "system",

  updatedBy: "system",

}

/* ============================================================
   AI Recommendation
============================================================ */

export const MOCK_AI_RECOMMENDATION = {

  recommendedVendorId: MOCK_VENDOR_1.id,

  recommendedPrice:

    MOCK_PRICING_RESULT.total.grandTotal,

  confidenceScore: 96,

  explanation:

    "Best overall balance of price, availability and customer rating.",

}

/* ============================================================
   Timeline
============================================================ */

export const MOCK_QUOTATION_TIMELINE = [

  {

    id: "timeline-001",

    title: "Quotation Created",

    description: "Quotation draft created successfully.",

    status: QuotationStatus.DRAFT,

    createdAt: new Date("2026-07-05T09:30:00"),

  },

  {

    id: "timeline-002",

    title: "Pricing Completed",

    description: "Pricing calculated successfully.",

    status: QuotationStatus.PRICING_PENDING,

    createdAt: new Date("2026-07-05T09:45:00"),

  },

  {

    id: "timeline-003",

    title: "Vendor Selected",

    description: "Raj Packers selected by AI recommendation.",

    status: QuotationStatus.CONVERTED,

    createdAt: new Date("2026-07-05T10:30:00"),

  },

]

/* ============================================================
   Quotation
============================================================ */

export const MOCK_QUOTATION: Quotation = {

  id: "quotation-001",

  customer: MOCK_QUOTATION_CUSTOMER,

  summary: MOCK_QUOTATION_SUMMARY,

  move: MOCK_MOVE_DETAILS,

  addresses: MOCK_QUOTATION_ADDRESSES,

  inventory: MOCK_QUOTATION_INVENTORY,

  services: MOCK_QUOTATION_SERVICES,

  pricing: MOCK_QUOTATION_PRICING,

  vendor: MOCK_QUOTATION_VENDOR,

  booking: MOCK_QUOTATION_BOOKING,

  metadata: MOCK_QUOTATION_METADATA,

}

/* ============================================================
   Quotation Detail
============================================================ */

export const MOCK_QUOTATION_DETAIL: QuotationDetail = {

  quotation: MOCK_QUOTATION,

  aiRecommendation: MOCK_AI_RECOMMENDATION,

  timeline: MOCK_QUOTATION_TIMELINE,

}

/* ============================================================
   Form State
============================================================ */

export const MOCK_QUOTATION_FORM_STATE: QuotationFormState = {

  loading: false,

  saving: false,

  dirty: false,

  valid: true,

  quotation: MOCK_QUOTATION_DETAIL,

}

/* ============================================================
   Search Response
============================================================ */

export const MOCK_QUOTATION_SEARCH_RESPONSE: QuotationSearchResponse = {

  success: true,

  quotations: [

    MOCK_QUOTATION,

  ],

  message: "1 quotation found.",

}

/* ============================================================
   Response
============================================================ */

export const MOCK_QUOTATION_RESPONSE: QuotationResponse = {

  success: true,

  quotation: MOCK_QUOTATION_DETAIL,

  message: "Quotation loaded successfully.",

}

/* ============================================================
   Statistics
============================================================ */

export const MOCK_QUOTATION_STATISTICS: QuotationStatistics = {

  totalQuotations: 248,

  draftQuotations: 32,

  approvedQuotations: 148,

  rejectedQuotations: 11,

  convertedQuotations: 49,

  expiredQuotations: 8,

}

/* ============================================================
   Quotation Collection
============================================================ */

export const MOCK_QUOTATIONS: Quotation[] = [ MOCK_QUOTATION,]

/* ============================================================
   Default Quotation
============================================================ */

export const DEFAULT_QUOTATION: Quotation = MOCK_QUOTATION
/* ============================================================
   End of File
============================================================ */