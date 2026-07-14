/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Vendor Types

   File: vendor.types.ts

============================================================ */

/* ============================================================
   Vendor Status
============================================================ */

export enum VendorStatus {

  AVAILABLE = "available",

  BUSY = "busy",

  UNAVAILABLE = "unavailable",

}

/* ============================================================
   Vendor Verification
============================================================ */

export enum VendorVerification {

  VERIFIED = "verified",

  PREMIUM = "premium",

  ELITE = "elite",

}

/* ============================================================
   Vendor Rating
============================================================ */

export interface VendorRating {

  averageRating: number

  totalReviews: number

  aiScore: number

}

/* ============================================================
   Vendor Availability
============================================================ */

export interface VendorAvailability {

  available: boolean

  pickupDate: Date

  estimatedDeliveryDate: Date

  responseTime: string

}

/* ============================================================
   Vendor Quotation
============================================================ */

export interface VendorQuotation {

  vendorId: string

  quotationId: string

  estimatedPrice: number

  estimatedWeight: number

  estimatedVolume: number

  estimatedDurationInDays: number

  currency: string

}

/* ============================================================
   Vendor Summary
============================================================ */

export interface VendorSummary {

  id: string

  name: string

  companyName: string

  logo: string

  verification: VendorVerification

  status: VendorStatus

  rating: VendorRating

  availability: VendorAvailability

  quotation: VendorQuotation

}
/* ============================================================
   Vendor Recommendation
============================================================ */

export interface VendorRecommendation {

  vendorId: string

  rank: number

  score: number

  reason: string

}

/* ============================================================
   Vendor Comparison
============================================================ */

export interface VendorComparison {

  vendors: VendorSummary[]

  recommendedVendorId?: string

  lowestPrice: number

  highestPrice: number

  averagePrice: number

}

/* ============================================================
   Selected Vendor
============================================================ */

export interface SelectedVendor {

  vendor: VendorSummary

  selectedAt: Date

  remarks?: string

}

/* ============================================================
   Vendor Selection State
============================================================ */

export interface VendorSelectionState {

  vendors: VendorSummary[]

  selectedVendor?: SelectedVendor

  comparison?: VendorComparison

  loading: boolean

  dirty: boolean

  valid: boolean

}

/* ============================================================
   Vendor Request
============================================================ */

export interface VendorSearchRequest {

  quotationId: string

}

/* ============================================================
   Vendor Response
============================================================ */

export interface VendorSearchResponse {

  success: boolean

  vendors: VendorSummary[]

  comparison: VendorComparison

  recommendations: VendorRecommendation[]

  message?: string

}

/* ============================================================
   Vendor Confirmation
============================================================ */

export interface VendorConfirmation {

  quotationId: string

  vendorId: string

  confirmedAt: Date

}

/* ============================================================
   End of File
============================================================ */