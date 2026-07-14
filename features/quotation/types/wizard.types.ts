
/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Wizard Types

   File: wizard.types.ts

============================================================ */

import type { Address } from "./address.types"

import type { InventorySummary } from "./inventory.types"

import type { QuotationService } from "./service.types"

import type { PricingResult } from "./pricing.types"

import type { VendorSummary } from "./vendor.types"

import type { BookingDetail } from "./booking.types"

import type { QuotationDetail } from "./quotation.types"

/* ============================================================
   Wizard Step
============================================================ */

export enum WizardStep {

  CUSTOMER = "customer",

  ADDRESS = "address",

  MOVE_DETAILS = "move-details",

  INVENTORY = "inventory",

  SERVICES = "services",

  PRICING = "pricing",

  VENDOR = "vendor",

  REVIEW = "review",

  BOOKING = "booking",

  COMPLETED = "completed",

}

/* ============================================================
   Wizard Status
============================================================ */

export enum WizardStatus {

  NOT_STARTED = "not-started",

  IN_PROGRESS = "in-progress",

  COMPLETED = "completed",

}

/* ============================================================
   Step Status
============================================================ */

export enum WizardStepStatus {

  LOCKED = "locked",

  ACTIVE = "active",

  COMPLETED = "completed",

}

/* ============================================================
   Wizard Navigation
============================================================ */

export interface WizardNavigation {

  currentStep: WizardStep

  previousStep?: WizardStep

  nextStep?: WizardStep

  completedSteps: WizardStep[]

}

/* ============================================================
   Step Validation
============================================================ */

export interface WizardStepValidation {

  step: WizardStep

  valid: boolean

  errors: string[]

}

/* ============================================================
   Customer Step
============================================================ */

export interface CustomerStepData {

  customerId: string

  customerName: string

  mobile: string

  email: string

}

/* ============================================================
   Address Step
============================================================ */

export interface AddressStepData {

  pickup: Address

  drop: Address

}

/* ============================================================
   Inventory Step
============================================================ */

export interface InventoryStepData {

  inventory: InventorySummary

}

/* ============================================================
   Services Step
============================================================ */

export interface ServicesStepData {

  services: QuotationService[]

}

/* ============================================================
   Pricing Step
============================================================ */

export interface PricingStepData {

  pricing: PricingResult

}

/* ============================================================
   Vendor Step
============================================================ */

export interface VendorStepData {

  selectedVendor?: VendorSummary

  vendors: VendorSummary[]

}

/* ============================================================
   Review Step
============================================================ */

export interface ReviewStepData {

  quotation: QuotationDetail

}

/* ============================================================
   Booking Step
============================================================ */

export interface BookingStepData {

  booking?: BookingDetail

}

/* ============================================================
   Wizard Data
============================================================ */

export interface WizardData {

  customer?: CustomerStepData

  addresses?: AddressStepData

  inventory?: InventoryStepData

  services?: ServicesStepData

  pricing?: PricingStepData

  vendor?: VendorStepData

  review?: ReviewStepData

  booking?: BookingStepData

}

/* ============================================================
   Wizard Progress
============================================================ */

export interface WizardProgress {

  totalSteps: number

  completedSteps: number

  percentage: number

}

/* ============================================================
   Wizard State
============================================================ */

export interface QuotationWizardState {

  status: WizardStatus

  navigation: WizardNavigation

  data: WizardData

  progress: WizardProgress

  validations: WizardStepValidation[]

  loading: boolean

  saving: boolean

  dirty: boolean

}

/* ============================================================
   Save Request
============================================================ */

export interface SaveWizardRequest {

  quotationId?: string

  state: QuotationWizardState

}

/* ============================================================
   Resume Request
============================================================ */

export interface ResumeWizardRequest {

  quotationId: string

}

/* ============================================================
   Wizard Response
============================================================ */

export interface WizardResponse {

  success: boolean

  state: QuotationWizardState

  message?: string

}

/* ============================================================
   Wizard Completion
============================================================ */

export interface WizardCompletion {

  quotationId: string

  completedAt: Date

}

/* ============================================================
   End of File
============================================================ */