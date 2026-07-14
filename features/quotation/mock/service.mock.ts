/* ============================================================
   Easy Movers Enterprise Platform

   Quotation Module

   Service Mock Data

   File: service.mock.ts

============================================================ */

import {

  ServiceAvailability,

  ServiceCategory,

  ServicePricingModel,

  type QuotationService,

} from "../types/service.types"

/* ============================================================
   Professional Packing
============================================================ */

export const MOCK_PACKING_SERVICE: QuotationService = {

  id: "service-packing",

  category: ServiceCategory.PACKING,

  name: "Professional Packing",

  description:

    "Complete household packing using premium packing materials.",

  icon: "package",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 4500,

  taxable: true,

  recommended: true,

  popular: true,

}

/* ============================================================
   Loading Service
============================================================ */

export const MOCK_LOADING_SERVICE: QuotationService = {

  id: "service-loading",

  category: ServiceCategory.LOADING,

  name: "Loading Assistance",

  description:

    "Professional loading of household goods.",

  icon: "truck-loading",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 2200,

  taxable: true,

  recommended: true,

  popular: true,

}

/* ============================================================
   Unloading Service
============================================================ */

export const MOCK_UNLOADING_SERVICE: QuotationService = {

  id: "service-unloading",

  category: ServiceCategory.UNLOADING,

  name: "Unloading Assistance",

  description:

    "Safe unloading at destination.",

  icon: "warehouse",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 1800,

  taxable: true,

  recommended: true,

  popular: true,

}

/* ============================================================
   Insurance
============================================================ */

export const MOCK_INSURANCE_SERVICE: QuotationService = {

  id: "service-insurance",

  category: ServiceCategory.INSURANCE,

  name: "Transit Insurance",

  description:

    "Insurance coverage during transportation.",

  icon: "shield",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.PERCENTAGE,

  basePrice: 1.5,

  taxable: false,

  recommended: true,

  popular: false,

}

/* ============================================================
   Unpacking Service
============================================================ */

export const MOCK_UNPACKING_SERVICE: QuotationService = {

  id: "service-unpacking",

  category: ServiceCategory.UNPACKING,

  name: "Unpacking Service",

  description:

    "Complete unpacking and placement of household items.",

  icon: "box-open",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 2500,

  taxable: true,

  recommended: false,

  popular: true,

}

/* ============================================================
   Furniture Assembly
============================================================ */

export const MOCK_ASSEMBLY_SERVICE: QuotationService = {

  id: "service-assembly",

  category: ServiceCategory.INSTALLATION,
  name: "Furniture Assembly",

  description:

    "Assembly and installation of dismantled furniture.",

  icon: "tool",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 1800,

  taxable: true,

  recommended: true,

  popular: false,

}

/* ============================================================
   Storage Service
============================================================ */

export const MOCK_STORAGE_SERVICE: QuotationService = {

  id: "service-storage",

  category: ServiceCategory.STORAGE,

  name: "Warehouse Storage",

  description:

    "Secure short-term and long-term storage facility.",

  icon: "warehouse",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.PER_DAY,

  basePrice: 250,

  taxable: true,

  recommended: false,

  popular: false,

}

/* ============================================================
   Vehicle Transport
============================================================ */

export const MOCK_VEHICLE_TRANSPORT_SERVICE: QuotationService = {

  id: "service-vehicle",

  category: ServiceCategory.VEHICLE_TRANSPORT,

  name: "Vehicle Transportation",

  description:

    "Safe transportation of cars and two-wheelers.",

  icon: "car",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 6500,

  taxable: true,

  recommended: false,

  popular: true,

}

/* ============================================================
   Installation Service
============================================================ */

export const MOCK_INSTALLATION_SERVICE: QuotationService = {

  id: "service-installation",

  category: ServiceCategory.INSTALLATION,

  name: "Furniture Installation",

  description:

    "Professional installation of dismantled furniture.",

  icon: "tool",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 1800,

  taxable: true,

  recommended: true,

  popular: false,

}

/* ============================================================
   Cleaning Service
============================================================ */

export const MOCK_CLEANING_SERVICE: QuotationService = {

  id: "service-cleaning",

  category: ServiceCategory.CLEANING,

  name: "Deep Cleaning",

  description:

    "Cleaning service before or after relocation.",

  icon: "sparkles",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 3200,

  taxable: true,

  recommended: false,

  popular: true,

}

/* ============================================================
   Pet Relocation
============================================================ */

export const MOCK_PET_RELOCATION_SERVICE: QuotationService = {

  id: "service-pet",

  category: ServiceCategory.PET_RELOCATION,

  name: "Pet Relocation",

  description:

    "Safe relocation of domestic pets.",

  icon: "paw",

  availability: ServiceAvailability.AVAILABLE,

  pricingModel: ServicePricingModel.FIXED,

  basePrice: 7500,

  taxable: true,

  recommended: false,

  popular: false,

}

/* ============================================================
   Selected Services
============================================================ */

export const MOCK_SELECTED_SERVICES: QuotationService[] = [

  MOCK_PACKING_SERVICE,

  MOCK_LOADING_SERVICE,

  MOCK_UNLOADING_SERVICE,

  MOCK_INSURANCE_SERVICE,

]

/* ============================================================
   Complete Service Catalogue
============================================================ */

export const MOCK_ALL_SERVICES: QuotationService[] = [

  MOCK_PACKING_SERVICE,

  MOCK_UNPACKING_SERVICE,

  MOCK_LOADING_SERVICE,

  MOCK_UNLOADING_SERVICE,

  MOCK_STORAGE_SERVICE,

  MOCK_INSURANCE_SERVICE,

  MOCK_VEHICLE_TRANSPORT_SERVICE,

  MOCK_INSTALLATION_SERVICE,

  MOCK_CLEANING_SERVICE,

  MOCK_PET_RELOCATION_SERVICE,

]

/* ============================================================
   End of File
============================================================ */