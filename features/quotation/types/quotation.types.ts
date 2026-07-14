/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Quotation Types

   File: quotation.types.ts

============================================================ */

import type { Address } from "./address.types"

import type { InventorySummary } from "./inventory.types"

import type { QuotationService } from "./service.types"

import type { PricingResult } from "./pricing.types"

import type { VendorSummary } from "./vendor.types"

import type { BookingDetail } from "./booking.types"

import type {
  
  InventoryRoom,
} from "./inventory.types"

/* ============================================================
   Quotation Status
============================================================ */

export enum QuotationStatus {

  DRAFT = "draft",

  SURVEY_PENDING = "survey-pending",

  SURVEY_COMPLETED = "survey-completed",

  PRICING_PENDING = "pricing-pending",

  VENDOR_PENDING = "vendor-pending",

  READY = "ready",

  APPROVED = "approved",

  REJECTED = "rejected",

  EXPIRED = "expired",

  CONVERTED = "converted",

}

/* ============================================================
   Quotation Type
============================================================ */

export enum QuotationType {

  HOUSEHOLD = "household",

  OFFICE = "office",

  INDUSTRIAL = "industrial",

  VEHICLE = "vehicle",

  PET = "pet",

  STORAGE = "storage",

  INTERNATIONAL = "international",

}

/* ============================================================
   Move Type
============================================================ */

export enum MoveType {

  LOCAL = "local",

  INTERCITY = "intercity",

  INTERSTATE = "interstate",

  INTERNATIONAL = "international",

}

/* ============================================================
   Customer
============================================================ */

export interface QuotationCustomer {

  id: string

  fullName: string

  mobile: string

  email: string

}

/* ============================================================
   Move Details
============================================================ */

export interface MoveDetails {

  moveType: MoveType

  moveDate: Date

  estimatedDelivery: Date

  flexibleDates: boolean

  distanceInKm?: number

  remarks?: string

}

/* ============================================================
   Address Details
============================================================ */

export interface QuotationAddresses {

  pickup: Address

  drop: Address

}

/* ============================================================
   Inventory
============================================================ */

export interface QuotationInventory {

  rooms: InventoryRoom[]

  summary: InventorySummary

  notes?: string

}
/* ============================================================
   Services
============================================================ */

export interface QuotationServices {

  selectedServices: QuotationService[]

}

/* ============================================================
   Pricing
============================================================ */

export interface QuotationPricing {

  pricing: PricingResult

  revised?: boolean

}
/* ============================================================
   Vendor
============================================================ */
export interface QuotationVendor {

  selectedVendor?: VendorSummary

  comparedVendors: VendorSummary[]

  recommendedVendorId?: string

}
/* ============================================================
   Booking
============================================================ */
export interface QuotationBooking {

  booking?: BookingDetail

  converted: boolean

  convertedAt?: Date

}
/* ============================================================
   AI Recommendation
============================================================ */

export interface QuotationAIRecommendation {

  recommendedVendorId?: string

  recommendedPrice?: number

  confidenceScore: number

  explanation?: string

}

/* ============================================================
   Quotation Summary
============================================================ */

export interface QuotationSummary {

  quotationNumber: string

  quotationType: QuotationType

  quotationStatus: QuotationStatus

  moveDate: Date

  estimatedDelivery: Date

  totalAmount: number

  currency: string

}

/* ============================================================
   Quotation Timeline
============================================================ */

export interface QuotationTimelineEvent {

  id: string

  title: string

  description?: string

  status: QuotationStatus

  createdAt: Date

}

/* ============================================================
   Metadata
============================================================ */

export interface QuotationMetadata {

  createdAt: Date

  updatedAt: Date

  createdBy: string

  updatedBy?: string

}

/* ============================================================
   Quotation
============================================================ */

export interface Quotation {

  id: string

  customer: QuotationCustomer

  summary: QuotationSummary

  move: MoveDetails

  addresses: QuotationAddresses

  inventory: QuotationInventory

  services: QuotationServices

  pricing: QuotationPricing

  vendor: QuotationVendor

  booking: QuotationBooking

  metadata: QuotationMetadata

}

/* ============================================================
   Quotation Detail
============================================================ */

export interface QuotationDetail {

  quotation: Quotation

  aiRecommendation?: QuotationAIRecommendation

  timeline: QuotationTimelineEvent[]

}

/* ============================================================
   Quotation Form State
============================================================ */

export interface QuotationFormState {

  loading: boolean

  saving: boolean

  dirty: boolean

  valid: boolean

  quotation?: QuotationDetail

}

/* ============================================================
   Create Request
============================================================ */

export interface CreateQuotationRequest {

  customerId: string

  quotationType: QuotationType

  moveDate: Date

}

/* ============================================================
   Update Request
============================================================ */

export interface UpdateQuotationRequest {

  quotationId: string

  quotationStatus?: QuotationStatus

}

/* ============================================================
   Search Request
============================================================ */

export interface QuotationSearchRequest {

  quotationNumber?: string

  customerId?: string

  vendorId?: string

  quotationStatus?: QuotationStatus

}

/* ============================================================
   Search Response
============================================================ */

export interface QuotationSearchResponse {

  success: boolean

  quotations: Quotation[]

  message?: string

}

/* ============================================================
   Quotation Response
============================================================ */

export interface QuotationResponse {

  success: boolean

  quotation: QuotationDetail

  message?: string

}

/* ============================================================
   Quotation Statistics
============================================================ */

export interface QuotationStatistics {

  totalQuotations: number

  draftQuotations: number

  approvedQuotations: number

  rejectedQuotations: number

  convertedQuotations: number

  expiredQuotations: number

}

/* ============================================================
   Quotation Completion
============================================================ */

export interface QuotationCompletion {

  quotationId: string

  convertedToBooking: boolean

  completedAt?: Date

  bookingId?: string

}

/* ============================================================
   End of File
============================================================ */