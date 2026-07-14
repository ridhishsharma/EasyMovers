/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Wizard Mock Data

   File: wizard.mock.ts

============================================================ */

import {

  WizardStatus,

  WizardStep,

  WizardStepStatus,

  type AddressStepData,

  type BookingStepData,

  type CustomerStepData,

  type InventoryStepData,

  type PricingStepData,

  type QuotationWizardState,

  type ReviewStepData,

type WizardData,

  type SaveWizardRequest,

  type ServicesStepData,

  type VendorStepData,

  type WizardNavigation,

  type WizardProgress,

  type WizardStepValidation,

} from "../types/wizard.types"

import {

  MOCK_QUOTATION_CUSTOMER,

  MOCK_QUOTATION_ADDRESSES,

  MOCK_QUOTATION_INVENTORY,

  MOCK_QUOTATION_PRICING,

  MOCK_QUOTATION_SERVICES,

  MOCK_QUOTATION_VENDOR,

  MOCK_QUOTATION_DETAIL,

} from "./quotation.mock"

import {

  MOCK_BOOKING_DETAIL,

} from "./booking.mock"

/* ============================================================
   Customer Step
============================================================ */

export const MOCK_CUSTOMER_STEP: CustomerStepData = {

  customerId: MOCK_QUOTATION_CUSTOMER.id,

  customerName: MOCK_QUOTATION_CUSTOMER.fullName,

  mobile: MOCK_QUOTATION_CUSTOMER.mobile,

  email: MOCK_QUOTATION_CUSTOMER.email,

}

/* ============================================================
   Address Step
============================================================ */

export const MOCK_ADDRESS_STEP: AddressStepData = {

  pickup: MOCK_QUOTATION_ADDRESSES.pickup,

  drop: MOCK_QUOTATION_ADDRESSES.drop,

}

/* ============================================================
   Inventory Step
============================================================ */

export const MOCK_INVENTORY_STEP: InventoryStepData = {

  inventory: MOCK_QUOTATION_INVENTORY.summary,

}

/* ============================================================
   Services Step
============================================================ */

export const MOCK_SERVICES_STEP: ServicesStepData = {

  services:

    MOCK_QUOTATION_SERVICES.selectedServices,

}

/* ============================================================
   Pricing Step
============================================================ */

export const MOCK_PRICING_STEP: PricingStepData = {

  pricing:

    MOCK_QUOTATION_PRICING.pricing,

}

/* ============================================================
   Vendor Step
============================================================ */

export const MOCK_VENDOR_STEP: VendorStepData = {

  selectedVendor:

    MOCK_QUOTATION_VENDOR.selectedVendor,

  vendors:

    MOCK_QUOTATION_VENDOR.comparedVendors,

}

/* ============================================================
   Review Step
============================================================ */

export const MOCK_REVIEW_STEP: ReviewStepData = {

  quotation:

    MOCK_QUOTATION_DETAIL,

}

/* ============================================================
   Booking Step
============================================================ */

export const MOCK_BOOKING_STEP: BookingStepData = {

  booking:

    MOCK_BOOKING_DETAIL,

}

/* ============================================================
   Navigation
============================================================ */

export const MOCK_WIZARD_NAVIGATION: WizardNavigation = {

  currentStep: WizardStep.BOOKING,

  previousStep: WizardStep.REVIEW,

  nextStep: WizardStep.COMPLETED,

  completedSteps: [

    WizardStep.CUSTOMER,

    WizardStep.ADDRESS,

    WizardStep.INVENTORY,

    WizardStep.SERVICES,

    WizardStep.PRICING,

    WizardStep.VENDOR,

    WizardStep.REVIEW,

    WizardStep.BOOKING,

  ],

}

/* ============================================================
   Progress
============================================================ */

export const MOCK_WIZARD_PROGRESS: WizardProgress = {

  totalSteps: 8,

  completedSteps: 8,

  percentage: 100,

}

/* ============================================================
   Step Validation
============================================================ */

export const MOCK_WIZARD_VALIDATIONS: WizardStepValidation[] = [

  {

    step: WizardStep.CUSTOMER,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.ADDRESS,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.INVENTORY,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.SERVICES,

    valid: true,

    errors: [],

  },

]

/* ============================================================
   Remaining Step Validation
============================================================ */

MOCK_WIZARD_VALIDATIONS.push(

  {

    step: WizardStep.PRICING,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.VENDOR,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.REVIEW,

    valid: true,

    errors: [],

  },

  {

    step: WizardStep.BOOKING,

    valid: true,

    errors: [],

  },

)

/* ============================================================
   Wizard State
============================================================ */

export const MOCK_WIZARD_STATE: QuotationWizardState = {

  status: WizardStatus.COMPLETED,

  navigation: MOCK_WIZARD_NAVIGATION,

  data: {

    customer: MOCK_CUSTOMER_STEP,

    addresses: MOCK_ADDRESS_STEP,

    inventory: MOCK_INVENTORY_STEP,

    services: MOCK_SERVICES_STEP,

    pricing: MOCK_PRICING_STEP,

    vendor: MOCK_VENDOR_STEP,

    review: MOCK_REVIEW_STEP,

    booking: MOCK_BOOKING_STEP,

  },

  progress: MOCK_WIZARD_PROGRESS,

  validations: MOCK_WIZARD_VALIDATIONS,

  loading: false,

  saving: false,

  dirty: false,

}

/* ============================================================
   Save Request
============================================================ */

export const MOCK_SAVE_WIZARD_REQUEST: SaveWizardRequest = {

  quotationId: "quotation-001",

  state: MOCK_WIZARD_STATE,

}

/* ============================================================
   Default Wizard State
============================================================ */

export const DEFAULT_WIZARD_STATE =

  MOCK_WIZARD_STATE

/* ============================================================
   End of File
============================================================ */