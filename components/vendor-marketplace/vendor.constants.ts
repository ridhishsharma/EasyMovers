/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Configuration Constants

   File: vendor.constants.ts

   Version: 2.0

   NOTE:
   This file intentionally contains ONLY UI configuration.

   Vendor records belong in:
   - vendor.mock.ts (Development)
   - Vendor API (Production)

============================================================ */

import {

  Award,

  Building2,

  Globe,

  Package,

  ShieldCheck,

  Truck,

  Warehouse,

} from "lucide-react"

/* ============================================================
   Marketplace Header
============================================================ */

export const VENDOR_MARKETPLACE_HEADER = {

  badge: "Verified Moving Partners",

  title: "Choose Your Trusted Moving Partner",

  subtitle:

    "Compare verified relocation companies based on pricing, service quality, AI recommendations, and customer reviews before booking your move.",

}

/* ============================================================
   Marketplace Statistics
============================================================ */

export const MARKETPLACE_STATISTICS = [

  {

    id: "vendors",

    label: "Verified Vendors",

    value: "500+",

    description: "Professionally verified relocation companies",

  },

  {

    id: "moves",

    label: "Moves Completed",

    value: "1M+",

    description: "Successful relocations completed",

  },

  {

    id: "rating",

    label: "Average Rating",

    value: "4.8★",

    description: "Based on verified customer reviews",

  },

]

/* ============================================================
   Vendor Filters
============================================================ */

export const VENDOR_FILTERS = [

  {

    id: "all",

    label: "All Vendors",

    value: "all",

    icon: Globe,

  },

  {

    id: "household",

    label: "Household",

    value: "household",

    icon: Package,

  },

  {

    id: "office",

    label: "Office",

    value: "office",

    icon: Building2,

  },

  {

    id: "storage",

    label: "Storage",

    value: "storage",

    icon: Warehouse,

  },

  {

    id: "transport",

    label: "Vehicle",

    value: "vehicle",

    icon: Truck,

  },

  {

    id: "insured",

    label: "Insured",

    value: "insured",

    icon: ShieldCheck,

  },

  {

    id: "premium",

    label: "Premium",

    value: "premium",

    icon: Award,

  },

]

/* ============================================================
   Vendor Sorting
============================================================ */

export const VENDOR_SORT_OPTIONS = [

  {

    id: "recommended",

    label: "AI Recommended",

    value: "recommended",

  },

  {

    id: "rating",

    label: "Highest Rated",

    value: "rating",

  },

  {

    id: "price-low",

    label: "Lowest Price",

    value: "price-low",

  },

  {

    id: "price-high",

    label: "Highest Price",

    value: "price-high",

  },

  {

    id: "experience",

    label: "Most Experienced",

    value: "experience",

  },

]

/* ============================================================
   AI Recommendation Configuration
============================================================ */

export const AI_RECOMMENDATION = {

  minimumScore: 90,

  excellentScore: 97,

  recommendationLimit: 3,

}

/* ============================================================
   Default Configuration
============================================================ */

export const DEFAULT_VENDOR_FILTER = "all"

export const DEFAULT_SORT = "recommended"

export const DEFAULT_PAGE_SIZE = 12

export const SEARCH_PLACEHOLDER =

  "Search vendors, cities, or services..."

/* ============================================================
   Badge Colors
============================================================ */

export const VENDOR_BADGE_COLORS = {

  verified: "green",

  premium: "orange",

  featured: "blue",

  insured: "purple",

  recommended: "emerald",

}

/* ============================================================
   Empty State
============================================================ */

export const EMPTY_VENDOR_STATE = {

  title: "No Vendors Found",

  description:

    "Try changing your search or filters to discover more relocation partners.",

  actionLabel: "Reset Filters",

}