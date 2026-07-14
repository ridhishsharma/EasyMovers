/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Type Definitions

   File: vendor.types.ts

   Version: 1.0
============================================================ */

import type {

  LucideIcon,

} from "lucide-react"

import type { ReactNode } from "react"

/* ============================================================
   Vendor Badge
============================================================ */

export interface VendorBadge {

  id: string

  label: string

  color: string

}

/* ============================================================
   Vendor Service
============================================================ */

export type VendorServiceIcon =

  | "package"

  | "truck"

  | "warehouse"

  | "building"

  | "globe"

  | "shield"

export interface VendorService {

    id: string

    name: string

    description: string

    icon: LucideIcon

}
/* ============================================================
   Vendor Coverage
============================================================ */

export interface VendorCoverage {

  id: string

  city: string

  state: string

  country: string

}

/* ============================================================
   Vendor Fleet
============================================================ */

export interface VendorFleet {

  id: string

  vehicleType: string

  quantity: number

  capacity: string

}

/* ============================================================
   Vendor Rating
============================================================ */

export interface VendorRating {

  rating: number

  reviewCount: number

  aiScore: number

  completedMoves: number

}

/* ============================================================
   Vendor Model
============================================================ */

export interface Vendor {

  id: string

  name: string

  companyName?: string

  logo?: string

  coverImage?: string

  description: string

  verified: boolean

  featured: boolean

  premium: boolean

  badges: VendorBadge[]

  services: VendorService[]

  coverage: VendorCoverage[]

  fleet: VendorFleet[]

  rating: VendorRating

  establishedYear?: number

  headquarters: string

  contactNumber?: string

  email?: string

  website?: string

  responseTime: string

  availability: VendorAvailability

  pricing: VendorPricing

  insurance: VendorInsurance

  certificates: VendorCertificate[]

}

/* ============================================================
   Vendor Pricing
============================================================ */

export interface VendorPricing {

  startingPrice: number

  currency: string

  unit: string

  instantQuotation: boolean

}

/* ============================================================
   Vendor Availability
============================================================ */

export interface VendorAvailability {

  availableToday: boolean

  nextAvailableDate?: string

  operatingHours: string

}

/* ============================================================
   Vendor Insurance
============================================================ */

export interface VendorInsurance {

  available: boolean

  provider?: string

  coverageAmount?: string

}

/* ============================================================
   Vendor Certificate
============================================================ */

export interface VendorCertificate {

  id: string

  title: string

  issuedBy: string

  validTill?: string

}

/* ============================================================
   AI Recommendation
============================================================ */

export interface VendorAIRecommendation {

  score: number

  title: string

  description: string

  reasons: string[]

}

/* ============================================================
   Marketplace Statistics
============================================================ */

export interface VendorStatistic {

  id: string

  label: string

  value: string

  description?: string

}

/* ============================================================
   Search Filter
============================================================ */

export interface VendorFilter {

  id: string

  label: string

  value: string

  icon?: LucideIcon

}

/* ============================================================
   Marketplace Header
============================================================ */

export interface VendorHeader {

  badge: string

  title: string

  subtitle: string

}

/* ============================================================
   Marketplace Data
============================================================ */

export interface VendorMarketplaceData {

  header: VendorHeader

  vendors: Vendor[]

  filters: VendorFilter[]

  statistics: VendorStatistic[]

}

/* ============================================================
   Component Props
============================================================ */

export interface VendorCardProps {

  vendor: Vendor

  active?: boolean

  onSelect?: (vendor: Vendor) => void

}

export interface VendorGridProps {

  vendors: Vendor[]

  selectedVendor?: Vendor

  onVendorSelect?: (vendor: Vendor) => void

}

export interface VendorHeaderProps {

  title: string

  subtitle: string

  badge?: string

}

export interface VendorSearchProps {

  search: string

  onSearchChange: (value: string) => void

}

export interface VendorFilterProps {

  filters: VendorFilter[]

  selectedFilter: string

  onFilterChange: (value: string) => void

}

export interface VendorPreviewProps {

  vendor: Vendor

}

/* ============================================================
   Marketplace Section Props
============================================================ */

export interface VendorMarketplaceProps {

  title?: string

  subtitle?: string

}

/* ============================================================
   Animation Types
============================================================ */

export interface VendorAnimationProps {

  children: ReactNode

  delay?: number

  duration?: number

}

export interface VendorAnimationVariant {

  hidden: {

    opacity: number

    x?: number

    y?: number

    scale?: number

  }

  visible: {

    opacity: number

    x?: number

    y?: number

    scale?: number

    transition?: {

      duration?: number

      delay?: number

      ease?: string

    }

  }

}

/* ============================================================
   Theme Tokens
============================================================ */

export interface VendorTheme {

  background: string

  foreground: string

  accent: string

  border: string

  gradient: string

}

/* ============================================================
   Helper Types
============================================================ */

export type VendorId = Vendor["id"]

export type VendorServiceId = VendorService["id"]

export type VendorFilterId = VendorFilter["value"]

/* ============================================================
   Future Enterprise Extensions
============================================================ */

export interface VendorExtension {

  id: string

  enabled: boolean

  config?: Record<string, unknown>

}

export interface VendorAnalytics {

  totalBookings: number

  monthlyBookings: number

  customerRetention: number

  cancellationRate: number

}

/* ============================================================
   End of File
============================================================ */