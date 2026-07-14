/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Service Types

   File: service.types.ts

============================================================ */

/* ============================================================
   Service Category
============================================================ */

export enum ServiceCategory {

  PACKING = "packing",

  UNPACKING = "unpacking",

  LOADING = "loading",

  UNLOADING = "unloading",

  STORAGE = "storage",

  INSURANCE = "insurance",

  VEHICLE_TRANSPORT = "vehicle-transport",

  PET_RELOCATION = "pet-relocation",

  CLEANING = "cleaning",

  INSTALLATION = "installation",

  OTHER = "other",

}

/* ============================================================
   Pricing Model
============================================================ */

export enum ServicePricingModel {

  FIXED = "fixed",

  PER_ITEM = "per-item",

  PER_DAY = "per-day",

  PER_KM = "per-km",

  PERCENTAGE = "percentage",

}

/* ============================================================
   Service Availability
============================================================ */

export enum ServiceAvailability {

  AVAILABLE = "available",

  LIMITED = "limited",

  UNAVAILABLE = "unavailable",

}

/* ============================================================
   Service
============================================================ */

export interface QuotationService {

  id: string

  category: ServiceCategory

  name: string

  description: string

  icon: string

  availability: ServiceAvailability

  pricingModel: ServicePricingModel

  basePrice: number

  taxable: boolean

  recommended: boolean

  popular: boolean

}

/* ============================================================
   Selected Service
============================================================ */

export interface SelectedService {

  serviceId: string

  quantity: number

  unitPrice: number

  totalPrice: number

  remarks?: string

}

/* ============================================================
   Service Group
============================================================ */

export interface ServiceGroup {

  id: string

  category: ServiceCategory

  title: string

  description?: string

  services: QuotationService[]

}

/* ============================================================
   Insurance Service
============================================================ */

export interface InsuranceService extends QuotationService {

  coverageAmount: number

  deductible?: number

  provider?: string

}

/* ============================================================
   Storage Service
============================================================ */

export interface StorageService extends QuotationService {

  minimumDays: number

  maximumDays?: number

  climateControlled: boolean

}

/* ============================================================
   Vehicle Transport Service
============================================================ */

export interface VehicleTransportService extends QuotationService {

  supportedVehicles: string[]

  enclosedCarrierAvailable: boolean

}

/* ============================================================
   Pet Relocation Service
============================================================ */

export interface PetRelocationService extends QuotationService {

  supportedPets: string[]

  veterinaryCertificateRequired: boolean

}

/* ============================================================
   Cleaning Service
============================================================ */

export interface CleaningService extends QuotationService {

  deepCleaningAvailable: boolean

  sanitizationIncluded: boolean

}

/* ============================================================
   Installation Service
============================================================ */

export interface InstallationService extends QuotationService {

  supportedAppliances: string[]

}

/* ============================================================
   Service Summary
============================================================ */

export interface ServiceSummary {

  totalServices: number

  totalAmount: number

  taxableAmount: number

  taxAmount: number

}

/* ============================================================
   Service Recommendation
============================================================ */

export interface ServiceRecommendation {

  serviceId: string

  reason: string

  priority: number

}

/* ============================================================
   Service Calculation
============================================================ */

export interface ServiceCalculation {

  selected: SelectedService[]

  summary: ServiceSummary

  recommendations: ServiceRecommendation[]

}

/* ============================================================
   Service Template
============================================================ */

export interface ServiceTemplate {

  id: string

  name: string

  description?: string

  services: SelectedService[]

}

/* ============================================================
   Customer Preferences
============================================================ */

export interface ServicePreferences {

  ecoFriendlyPacking: boolean

  premiumPacking: boolean

  expressDelivery: boolean

  weekendMove: boolean

}

/* ============================================================
   Service Validation
============================================================ */

export interface ServiceValidation {

  valid: boolean

  message?: string

}

/* ============================================================
   Service Form State
============================================================ */

export interface ServiceFormState {

  selected: SelectedService[]

  preferences: ServicePreferences

  summary: ServiceSummary

  loading: boolean

  dirty: boolean

  valid: boolean

}

/* ============================================================
   Service Calculation Request
============================================================ */

export interface ServiceCalculationRequest {

  services: SelectedService[]

  preferences?: ServicePreferences

}

/* ============================================================
   Service Calculation Response
============================================================ */

export interface ServiceCalculationResponse {

  success: boolean

  calculation: ServiceCalculation

  validation: ServiceValidation

  message?: string

}

/* ============================================================
   End of File
============================================================ */