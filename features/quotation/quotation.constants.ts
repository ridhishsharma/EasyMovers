/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Quotation Constants

   File: quotation.constants.ts

============================================================ */

import {

  PropertyType,

  LiftType,

} from "./types/address.types"

import {

  RoomType,

} from "./types/inventory.types"

import {

  ServiceCategory,

} from "./types/service.types"

import {

  Currency,

} from "./types/pricing.types"

import {

  WizardStep,

} from "./types/wizard.types"

/* ============================================================
   Wizard Steps
============================================================ */

export const QUOTATION_WIZARD_STEPS = [

  WizardStep.ADDRESS,

  WizardStep.MOVE_DETAILS,

  WizardStep.INVENTORY,

  WizardStep.SERVICES,

  WizardStep.VENDOR,

  WizardStep.PRICING,

  WizardStep.REVIEW,

  WizardStep.BOOKING,

  WizardStep.COMPLETED,

] as const

/* ============================================================
   Supported Currency
============================================================ */

export const DEFAULT_CURRENCY = Currency.INR

/* ============================================================
   Default Property
============================================================ */

export const DEFAULT_PROPERTY_TYPE =

  PropertyType.APARTMENT

/* ============================================================
   Default Lift
============================================================ */

export const DEFAULT_LIFT =

  LiftType.AVAILABLE

/* ============================================================
   Default Rooms
============================================================ */

export const DEFAULT_ROOM_TYPES = [

  RoomType.LIVING_ROOM,

  RoomType.BEDROOM,

  RoomType.KITCHEN,

] as const

/* ============================================================
   Default Services
============================================================ */

export const DEFAULT_SERVICE_CATEGORIES = [

  ServiceCategory.PACKING,

  ServiceCategory.LOADING,

  ServiceCategory.UNLOADING,

] as const

/* ============================================================
   Validation
============================================================ */

export const MAX_ADDRESS_LENGTH = 200

export const MAX_REMARK_LENGTH = 500

export const MAX_ROOMS = 25

export const MAX_INVENTORY_ITEMS = 500

export const MAX_BOOKING_DAYS = 365

/* ============================================================
   Distance Slabs (KM)
============================================================ */

export const DISTANCE_SLABS = {

  LOCAL: 25,

  CITY: 100,

  INTERCITY: 500,

  LONG_DISTANCE: 1000,

} as const

/* ============================================================
   Weight Slabs (KG)
============================================================ */

export const WEIGHT_SLABS = {

  SMALL: 500,

  MEDIUM: 1500,

  LARGE: 3000,

  EXTRA_LARGE: 5000,

} as const

/* ============================================================
   Default Pricing
============================================================ */

export const DEFAULT_PRICING = {

  BASE_CHARGE: 2500,

  DISTANCE_RATE_PER_KM: 18,

  WEIGHT_RATE_PER_KG: 4,

  LABOUR_RATE_PER_PERSON: 900,

  PACKING_RATE_PER_BOX: 120,

} as const

/* ============================================================
   Truck Capacities
============================================================ */

export const TRUCK_CAPACITY = {

  MINI: {

    name: "Mini Truck",

    capacityKg: 800,

    capacityCft: 120,

  },

  LIGHT: {

    name: "Light Commercial",

    capacityKg: 1800,

    capacityCft: 250,

  },

  MEDIUM: {

    name: "Medium Truck",

    capacityKg: 3500,

    capacityCft: 500,

  },

  HEAVY: {

    name: "Heavy Truck",

    capacityKg: 7000,

    capacityCft: 900,

  },

} as const

/* ============================================================
   Default Labour
============================================================ */

export const DEFAULT_LABOUR = {

  PACKERS: 2,

  MOVERS: 2,

  SUPERVISOR: 1,

} as const

/* ============================================================
   Insurance
============================================================ */

export const DEFAULT_INSURANCE = {

  COVERAGE_PERCENTAGE: 1.5,

  MINIMUM_DECLARED_VALUE: 10000,

} as const

/* ============================================================
   Storage
============================================================ */

export const DEFAULT_STORAGE = {

  MINIMUM_DAYS: 1,

  DEFAULT_RATE_PER_DAY: 250,

} as const

/* ============================================================
   Tax Configuration
============================================================ */

export const TAX_CONFIGURATION = {

  GST_PERCENTAGE: 18,

  APPLY_GST: true,

} as const

/* ============================================================
   AI Recommendation Thresholds
============================================================ */

export const AI_RECOMMENDATION = {

  EXCELLENT: 95,

  VERY_GOOD: 85,

  GOOD: 75,

  AVERAGE: 60,

} as const

/* ============================================================
   Booking Defaults
============================================================ */

export const BOOKING_DEFAULTS = {

  ADVANCE_PAYMENT_PERCENTAGE: 20,

  FREE_CANCELLATION_HOURS: 24,

  DEFAULT_MOVE_START_TIME: "09:00",

} as const

/* ============================================================
   Wizard Configuration
============================================================ */

export const WIZARD_CONFIGURATION = {

  AUTO_SAVE: true,

  AUTO_CALCULATE_PRICE: true,

  ALLOW_STEP_NAVIGATION: true,

  SHOW_AI_RECOMMENDATION: true,

} as const

/* ============================================================
   Auto Save
============================================================ */

export const AUTO_SAVE_CONFIGURATION = {

  INTERVAL_MS: 30000,

  ENABLED: true,

} as const

/* ============================================================
   Success Messages
============================================================ */

export const SUCCESS_MESSAGES = {

  QUOTATION_CREATED:

    "Quotation generated successfully.",

  BOOKING_CREATED:

    "Booking created successfully.",

  BOOKING_CONFIRMED:

    "Booking confirmed successfully.",

} as const

/* ============================================================
   Error Messages
============================================================ */

export const ERROR_MESSAGES = {

  INVALID_ADDRESS:

    "Please provide valid pickup and drop addresses.",

  INVALID_INVENTORY:

    "Please complete your inventory details.",

  VENDOR_NOT_SELECTED:

    "Please select a vendor before proceeding.",

  PRICE_CALCULATION_FAILED:

    "Unable to calculate quotation pricing.",

} as const

/* ============================================================
   Feature Flags
============================================================ */

export const FEATURE_FLAGS = {

  ENABLE_AI_PRICING: true,

  ENABLE_STORAGE_SERVICE: true,

  ENABLE_PET_RELOCATION: true,

  ENABLE_LIVE_TRACKING: false,

} as const

/* ============================================================
   Local Storage Keys
============================================================ */

export const STORAGE_KEYS = {

  QUOTATION_DRAFT: "easymovers:quotation:draft",

  QUOTATION_HISTORY: "easymovers:quotation:history",

  CUSTOMER_PREFERENCES: "easymovers:customer:preferences",

} as const

/* ============================================================
   Session Keys
============================================================ */

export const SESSION_KEYS = {

  ACTIVE_QUOTATION: "easymovers:active-quotation",

} as const

/* ============================================================
   API Endpoints
============================================================ */

export const API_ENDPOINTS = {

  CALCULATE_PRICE: "/quotation/calculate",

  SAVE_DRAFT: "/quotation/draft",

  SEARCH_VENDOR: "/quotation/vendors",

  CREATE_BOOKING: "/booking",

} as const

/* ============================================================
   Empty Quotation Defaults
============================================================ */

export const EMPTY_QUOTATION = {

  address: null,

  inventory: [],

  services: [],

  vendor: null,

  pricing: null,

  booking: null,

} as const

/* ============================================================
   Supported File Types
============================================================ */

export const SUPPORTED_FILE_TYPES = {

  IMAGE: [

    "image/png",

    "image/jpeg",

    "image/webp",

  ],

  DOCUMENT: [

    "application/pdf",

  ],

} as const

/* ============================================================
   Upload Limits
============================================================ */

export const UPLOAD_LIMITS = {

  MAX_IMAGES: 10,

  MAX_FILE_SIZE_MB: 10,

} as const

/* ============================================================
   Default Pagination
============================================================ */

export const DEFAULT_PAGINATION = {

  PAGE_SIZE: 20,

  MAX_PAGE_SIZE: 100,

} as const

/* ============================================================
   End of File
============================================================ */