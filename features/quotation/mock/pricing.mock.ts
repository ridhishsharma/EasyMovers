/* ============================================================
   Easy Movers Enterprise Platform
   Quotation Module
   Pricing Mock Data
   File: pricing.mock.ts
============================================================ */

import {
  ChargeType,
  Currency,
  PricingStrategy,

  type PricingComponent,
  type TaxBreakdown,
  type Discount,
  type PricingResult,

  type BaseCharges,
  type DistancePricing,
  type WeightPricing,
  type VolumePricing,
  type LabourPricing,
  type PackingPricing,
  type InsurancePricing,

  type PriceBreakdown,
  type VendorPricing,
  type QuotationTotal,

} from "../types/pricing.types"

/* ============================================================
   Pricing Components
============================================================ */

export const MOCK_PRICING_COMPONENTS: PricingComponent[] = [

  {
    id: "component-base",

    type: ChargeType.BASE,

    name: "Base Transportation",

    amount: 2500,

    taxable: true,

    description:
      "Standard transportation charge.",
  },

  {
    id: "component-distance",

    type: ChargeType.DISTANCE,

    name: "Distance Charge",

    amount: 28440,

    taxable: true,

    description:
      "Distance based transportation charge.",
  },

  {
    id: "component-labour",

    type: ChargeType.LABOUR,

    name: "Labour Charge",

    amount: 6300,

    taxable: true,

    description:
      "Loading and unloading manpower.",
  },

  {
    id: "component-packing",

    type: ChargeType.PACKING,

    name: "Packing Charge",

    amount: 8700,

    taxable: true,

    description:
      "Packing material and labour charges.",
  },

]

/* ============================================================
   Taxes
============================================================ */

export const MOCK_TAXES: TaxBreakdown[] = [

  {
    taxName: "GST",

    percentage: 18,

    amount: 6930,
  },

]

/* ============================================================
   Discounts
============================================================ */

export const MOCK_DISCOUNTS: Discount[] = [

  {
    id: "discount-none",

    name: "No Discount",

    amount: 0,
  },

]

/* ============================================================
   Vendor Pricing
============================================================ */

export const MOCK_VENDOR_PRICING: VendorPricing[] = [

  {
    vendorId: "vendor-001",

    vendorName: "Raj Packers & Movers",

    strategy: PricingStrategy.DYNAMIC,

    estimatedAmount: 45430,

    confidenceScore: 96,
  },

  {
    vendorId: "vendor-002",

    vendorName: "Safe Cargo Movers",

    strategy: PricingStrategy.AI_ESTIMATED,

    estimatedAmount: 46800,

    confidenceScore: 94,
  },

]

/* ============================================================
   Base Charges
============================================================ */

export const MOCK_BASE_CHARGES: BaseCharges = {

  baseCharge: 2500,

  distanceCharge: 18500,

  labourCharge: 4200,

  packingCharge: 4500,

  loadingCharge: 2200,

  unloadingCharge: 1800,

}

/* ============================================================
   Distance Pricing
============================================================ */

export const MOCK_DISTANCE_PRICING: DistancePricing = {

  distanceInKm: 1580,

  ratePerKm: 18,

  totalAmount: 28440,

}

/* ============================================================
   Weight Pricing
============================================================ */

export const MOCK_WEIGHT_PRICING: WeightPricing = {

  totalWeightInKg: 1280,

  ratePerKg: 4,

  totalAmount: 5120,

}

/* ============================================================
   Volume Pricing
============================================================ */

export const MOCK_VOLUME_PRICING: VolumePricing = {

  totalVolumeInCft: 245,

  ratePerCft: 10,

  totalAmount: 2450,

}

/* ============================================================
   Labour Pricing
============================================================ */

export const MOCK_LABOUR_PRICING: LabourPricing = {

  packers: 3,

  movers: 3,

  supervisors: 1,

  ratePerPerson: 900,

  totalAmount: 6300,

}

/* ============================================================
   Packing Pricing
============================================================ */

export const MOCK_PACKING_PRICING: PackingPricing = {

  materialCost: 2200,

  packingCharge: 4500,

  crateCharge: 1200,

  bubbleWrapCharge: 800,

  totalAmount: 8700,

}

/* ============================================================
   Insurance Pricing
============================================================ */

export const MOCK_INSURANCE_PRICING: InsurancePricing = {

  declaredValue: 1200000,

  premiumPercentage: 1.5,

  premiumAmount: 18000,

}

/* ============================================================
   Price Breakdown
============================================================ */

export const MOCK_PRICE_BREAKDOWN: PriceBreakdown = {

  components: MOCK_PRICING_COMPONENTS,

  baseCharges: MOCK_BASE_CHARGES,

  distance: MOCK_DISTANCE_PRICING,

  weight: MOCK_WEIGHT_PRICING,

  volume: MOCK_VOLUME_PRICING,

  labour: MOCK_LABOUR_PRICING,

  packing: MOCK_PACKING_PRICING,

  insurance: MOCK_INSURANCE_PRICING,

}

/* ============================================================
   Quotation Total
============================================================ */

export const MOCK_QUOTATION_TOTAL: QuotationTotal = {

  subtotal: 45430,

  discount: 0,

  taxableAmount: 45430,

  tax: 8177.4,

  grandTotal: 53607.4,

  currency: Currency.INR,

}

/* ============================================================
   Primary Pricing Result
============================================================ */

export const MOCK_PRICING_RESULT: PricingResult = {

  breakdown: MOCK_PRICE_BREAKDOWN,

  taxes: MOCK_TAXES,

  discounts: MOCK_DISCOUNTS,

  total: MOCK_QUOTATION_TOTAL,

  comparison: {

    vendors: MOCK_VENDOR_PRICING,

    recommendedVendorId: "vendor-001",

    lowestPrice: 45430,

    highestPrice: 46800,

    averagePrice: 46115,

  },

  aiPricing: {

    recommendedPrice: 45430,

    minimumPrice: 44000,

    maximumPrice: 47000,

    confidenceScore: 96,

    explanation:
      "AI recommends this quotation based on historical pricing, distance, seasonality and current fuel cost.",

  },

}

/* ============================================================
   Local Move Pricing
============================================================ */

export const MOCK_LOCAL_PRICING: PricingResult = {

  ...MOCK_PRICING_RESULT,

  total: {

    subtotal: 12500,

    discount: 0,

    taxableAmount: 12500,

    tax: 2250,

    grandTotal: 14750,

    currency: Currency.INR,

  },

}

/* ============================================================
   Interstate Pricing
============================================================ */

export const MOCK_INTERSTATE_PRICING: PricingResult = {

  ...MOCK_PRICING_RESULT,

  total: {

    subtotal: 45430,

    discount: 1000,

    taxableAmount: 44430,

    tax: 7997.4,

    grandTotal: 52427.4,

    currency: Currency.INR,

  },

}

/* ============================================================
   Corporate Pricing
============================================================ */

export const MOCK_CORPORATE_PRICING: PricingResult = {

  ...MOCK_PRICING_RESULT,

  total: {

    subtotal: 68000,

    discount: 5000,

    taxableAmount: 63000,

    tax: 11340,

    grandTotal: 74340,

    currency: Currency.INR,

  },

}

/* ============================================================
   Premium Relocation Pricing
============================================================ */

export const MOCK_PREMIUM_PRICING: PricingResult = {

  ...MOCK_PRICING_RESULT,

  total: {

    subtotal: 98500,

    discount: 0,

    taxableAmount: 98500,

    tax: 17730,

    grandTotal: 116230,

    currency: Currency.INR,

  },

}

/* ============================================================
   Export Default
============================================================ */

export default {

  MOCK_PRICING_COMPONENTS,

  MOCK_TAXES,

  MOCK_DISCOUNTS,

  MOCK_VENDOR_PRICING,

  MOCK_BASE_CHARGES,

  MOCK_DISTANCE_PRICING,

  MOCK_WEIGHT_PRICING,

  MOCK_VOLUME_PRICING,

  MOCK_LABOUR_PRICING,

  MOCK_PACKING_PRICING,

  MOCK_INSURANCE_PRICING,

  MOCK_PRICE_BREAKDOWN,

  MOCK_QUOTATION_TOTAL,

  MOCK_PRICING_RESULT,

  MOCK_LOCAL_PRICING,

  MOCK_INTERSTATE_PRICING,

  MOCK_CORPORATE_PRICING,

  MOCK_PREMIUM_PRICING,

}