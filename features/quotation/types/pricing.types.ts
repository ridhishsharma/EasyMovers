/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Pricing Types

   File: pricing.types.ts

============================================================ */

/* ============================================================
   Charge Type
============================================================ */

export enum ChargeType {

  BASE = "base",

  DISTANCE = "distance",

  WEIGHT = "weight",

  VOLUME = "volume",

  PACKING = "packing",

  LABOUR = "labour",

  STORAGE = "storage",

  INSURANCE = "insurance",

  VEHICLE = "vehicle",

  PET = "pet",

  TAX = "tax",

  DISCOUNT = "discount",

  OTHER = "other",

}

/* ============================================================
   Currency
============================================================ */

export enum Currency {

  INR = "INR",

  USD = "USD",

  EUR = "EUR",

}

/* ============================================================
   Pricing Strategy
============================================================ */

export enum PricingStrategy {

  FIXED = "fixed",

  DYNAMIC = "dynamic",

  AI_ESTIMATED = "ai-estimated",

}

/* ============================================================
   Pricing Component
============================================================ */

export interface PricingComponent {

  id: string

  type: ChargeType

  name: string

  amount: number

  taxable: boolean

  description?: string

}

/* ============================================================
   Base Charges
============================================================ */

export interface BaseCharges {

  baseCharge: number

  distanceCharge: number

  labourCharge: number

  packingCharge: number

  loadingCharge: number

  unloadingCharge: number

}

/* ============================================================
   Distance Charges
============================================================ */

export interface DistancePricing {

  distanceInKm: number

  ratePerKm: number

  totalAmount: number

}

/* ============================================================
   Weight Charges
============================================================ */

export interface WeightPricing {

  totalWeightInKg: number

  ratePerKg: number

  totalAmount: number

}

/* ============================================================
   Volume Charges
============================================================ */

export interface VolumePricing {

  totalVolumeInCft: number

  ratePerCft: number

  totalAmount: number

}

/* ============================================================
   Labour Pricing
============================================================ */

export interface LabourPricing {

  packers: number

  movers: number

  supervisors: number

  ratePerPerson: number

  totalAmount: number

}

/* ============================================================
   Packing Pricing
============================================================ */

export interface PackingPricing {

  materialCost: number

  packingCharge: number

  crateCharge: number

  bubbleWrapCharge: number

  totalAmount: number

}

/* ============================================================
   Storage Pricing
============================================================ */

export interface StoragePricing {

  days: number

  ratePerDay: number

  totalAmount: number

}

/* ============================================================
   Insurance Pricing
============================================================ */

export interface InsurancePricing {

  declaredValue: number

  premiumPercentage: number

  premiumAmount: number

}

/* ============================================================
   Tax
============================================================ */

export interface TaxBreakdown {

  taxName: string

  percentage: number

  amount: number

}

/* ============================================================
   Discount
============================================================ */

export interface Discount {

  id: string

  name: string

  percentage?: number

  fixedAmount?: number

  amount: number

}

/* ============================================================
   Coupon
============================================================ */

export interface Coupon {

  code: string

  description?: string

  valid: boolean

  discount: Discount

}

/* ============================================================
   Vendor Pricing
============================================================ */

export interface VendorPricing {

  vendorId: string

  vendorName: string

  strategy: PricingStrategy

  estimatedAmount: number

  confidenceScore?: number

}

/* ============================================================
   Dynamic Pricing
============================================================ */

export interface DynamicPricing {

  demandMultiplier: number

  seasonMultiplier: number

  fuelMultiplier: number

  weekendMultiplier: number

  finalMultiplier: number

}

/* ============================================================
   AI Pricing
============================================================ */

export interface AIPricing {

  recommendedPrice: number

  minimumPrice: number

  maximumPrice: number

  confidenceScore: number

  explanation?: string

}

/* ============================================================
   Price Breakdown
============================================================ */

export interface PriceBreakdown {

  components: PricingComponent[]

  baseCharges: BaseCharges

  distance: DistancePricing

  weight: WeightPricing

  volume: VolumePricing

  labour: LabourPricing

  packing: PackingPricing

  storage?: StoragePricing

  insurance?: InsurancePricing

}

/* ============================================================
   Quotation Total
============================================================ */

export interface QuotationTotal {

  subtotal: number

  discount: number

  taxableAmount: number

  tax: number

  grandTotal: number

  currency: Currency

}

/* ============================================================
   Price Comparison
============================================================ */

export interface PriceComparison {

  vendors: VendorPricing[]

  recommendedVendorId?: string

  lowestPrice: number

  highestPrice: number

  averagePrice: number

}

/* ============================================================
   Pricing Result
============================================================ */

export interface PricingResult {

  breakdown: PriceBreakdown

  taxes: TaxBreakdown[]

  discounts: Discount[]

  coupon?: Coupon

  total: QuotationTotal

  comparison?: PriceComparison

  aiPricing?: AIPricing

}

/* ============================================================
   Pricing Form State
============================================================ */

export interface PricingFormState {

  loading: boolean

  calculating: boolean

  valid: boolean

  dirty: boolean

  result?: PricingResult

}

/* ============================================================
   Pricing Request
============================================================ */

export interface PricingCalculationRequest {

  quotationId?: string

  vendorId?: string

}

/* ============================================================
   Pricing Response
============================================================ */

export interface PricingCalculationResponse {

  success: boolean

  pricing: PricingResult

  message?: string

}

/* ============================================================
   End of File
============================================================ */