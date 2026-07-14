/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Vendor Mock Data

   File: vendor.mock.ts

============================================================ */

import {

  VendorStatus,

  VendorVerification,

  type VendorRating,

  type VendorAvailability,

  type VendorQuotation,

  type VendorSummary,
type VendorRecommendation,
type VendorComparison,
type SelectedVendor,
type VendorSelectionState,
type VendorSearchResponse,
type VendorConfirmation,

} from "../types/vendor.types"

/* ============================================================
   Vendor Rating
============================================================ */

export const MOCK_VENDOR_RATING: VendorRating = {

  averageRating: 4.8,

  totalReviews: 1284,

  aiScore: 96,

}

/* ============================================================
   Vendor Availability
============================================================ */

export const MOCK_VENDOR_AVAILABILITY: VendorAvailability = {

  available: true,

  pickupDate: new Date("2026-07-10"),

  estimatedDeliveryDate: new Date("2026-07-16"),

  responseTime: "15 Minutes",

}

/* ============================================================
   Vendor Quotation
============================================================ */

export const MOCK_VENDOR_QUOTATION: VendorQuotation = {

  vendorId: "vendor-001",

  quotationId: "QT-2026-0001",

  estimatedPrice: 45430,

  estimatedWeight: 1280,

  estimatedVolume: 245,

  estimatedDurationInDays: 6,

  currency: "INR",

}

/* ============================================================
   Primary Vendor
============================================================ */

export const MOCK_VENDOR_1: VendorSummary = {

  id: "vendor-001",

  name: "Raj Packers",

  companyName: "Raj Packers & Movers Pvt Ltd",

  logo: "/vendors/raj-packers.png",

  verification: VendorVerification.ELITE,

  status: VendorStatus.AVAILABLE,

  rating: MOCK_VENDOR_RATING,

  availability: MOCK_VENDOR_AVAILABILITY,

  quotation: MOCK_VENDOR_QUOTATION,

}

/* ============================================================
   Vendor 2
============================================================ */

export const MOCK_VENDOR_2: VendorSummary = {

  id: "vendor-002",

  name: "Safe Cargo",

  companyName: "Safe Cargo Movers",

  logo: "/vendors/safe-cargo.png",

  verification: VendorVerification.PREMIUM,

  status: VendorStatus.AVAILABLE,

  rating: {

    averageRating: 4.6,

    totalReviews: 964,

    aiScore: 92,

  },

  availability: {

    available: true,

    pickupDate: new Date("2026-07-11"),

    estimatedDeliveryDate: new Date("2026-07-17"),

    responseTime: "25 Minutes",

  },

  quotation: {

    vendorId: "vendor-002",

    quotationId: "QT-2026-0001",

    estimatedPrice: 46800,

    estimatedWeight: 1280,

    estimatedVolume: 245,

    estimatedDurationInDays: 7,

    currency: "INR",

  },

}

/* ============================================================
   Vendor 3
============================================================ */

export const MOCK_VENDOR_3: VendorSummary = {

  id: "vendor-003",

  name: "Easy Movers",

  companyName: "Easy Movers India",

  logo: "/vendors/easy-movers.png",

  verification: VendorVerification.VERIFIED,

  status: VendorStatus.BUSY,

  rating: {

    averageRating: 4.5,

    totalReviews: 812,

    aiScore: 89,

  },

  availability: {

    available: false,

    pickupDate: new Date("2026-07-13"),

    estimatedDeliveryDate: new Date("2026-07-19"),

    responseTime: "45 Minutes",

  },

  quotation: {

    vendorId: "vendor-003",

    quotationId: "QT-2026-0001",

    estimatedPrice: 48200,

    estimatedWeight: 1280,

    estimatedVolume: 245,

    estimatedDurationInDays: 7,

    currency: "INR",

  },

}

/* ============================================================
   Vendor Recommendations
============================================================ */

export const MOCK_VENDOR_RECOMMENDATIONS = [

  {

    vendorId: "vendor-001",

    rank: 1,

    score: 96,

    reason:

      "Best overall value with excellent service rating.",

  },

  {

    vendorId: "vendor-002",

    rank: 2,

    score: 92,

    reason:

      "Competitive pricing with fast response time.",

  },

  {

    vendorId: "vendor-003",

    rank: 3,

    score: 89,

    reason:

      "Good customer reviews but limited availability.",

  },

]

/* ============================================================
   Vendor Comparison
============================================================ */

export const MOCK_VENDOR_COMPARISON = {

  vendors: [

    MOCK_VENDOR_1,

    MOCK_VENDOR_2,

    MOCK_VENDOR_3,

  ],

  recommendedVendorId: "vendor-001",

  lowestPrice: 45430,

  highestPrice: 48200,

  averagePrice: 46810,

}

/* ============================================================
   Selected Vendor
============================================================ */

export const MOCK_SELECTED_VENDOR: SelectedVendor = {

  vendor: MOCK_VENDOR_1,

  selectedAt: new Date("2026-07-05T10:30:00"),

  remarks:

    "Preferred vendor selected based on AI recommendation.",

}

/* ============================================================
   Vendor Selection State
============================================================ */

export const MOCK_VENDOR_SELECTION_STATE: VendorSelectionState = {

  vendors: [

    MOCK_VENDOR_1,

    MOCK_VENDOR_2,

    MOCK_VENDOR_3,

  ],

  selectedVendor: MOCK_SELECTED_VENDOR,

  comparison: MOCK_VENDOR_COMPARISON,

  loading: false,

  dirty: false,

  valid: true,

}

/* ============================================================
   Vendor Search Response
============================================================ */

export const MOCK_VENDOR_SEARCH_RESPONSE: VendorSearchResponse = {

  success: true,

  vendors: [

    MOCK_VENDOR_1,

    MOCK_VENDOR_2,

    MOCK_VENDOR_3,

  ],

  comparison: MOCK_VENDOR_COMPARISON,

  recommendations:

    MOCK_VENDOR_RECOMMENDATIONS,

  message:

    "Three matching vendors found.",

}

/* ============================================================
   Vendor Confirmation
============================================================ */

export const MOCK_VENDOR_CONFIRMATION: VendorConfirmation = {

  quotationId: "QT-2026-0001",

  vendorId: "vendor-001",

  confirmedAt: new Date("2026-07-05T10:45:00"),

}

/* ============================================================
   Vendor Collection
============================================================ */

export const MOCK_VENDORS: VendorSummary[] = [

  MOCK_VENDOR_1,

  MOCK_VENDOR_2,

  MOCK_VENDOR_3,

]

/* ============================================================
   Default Vendor
============================================================ */

export const DEFAULT_VENDOR =

  MOCK_VENDOR_1

/* ============================================================
   End of File
============================================================ */