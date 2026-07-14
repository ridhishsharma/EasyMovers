/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Services Module

   File: service.types.ts

   Version: 1.0
============================================================ */

import type { LucideIcon } from "lucide-react"

/* ============================================================
   Generic Feature
============================================================ */

export interface ServiceFeature {

  id: string

  title: string

  description?: string

  icon?: LucideIcon

}

/* ============================================================
   Service Badge
============================================================ */

export interface ServiceBadge {

  label: string

  color: string

}

/* ============================================================
   Pricing
============================================================ */

export interface ServicePricing {

  startingPrice: number

  currency: string

  unit: string

}

/* ============================================================
   Enterprise Statistics
============================================================ */

export interface ServiceStatistic {

  label: string

  value: string

}

/* ============================================================
   Service Benefit
============================================================ */

export interface ServiceBenefit {

  id: string

  title: string

  description: string

  icon?: LucideIcon

}

/* ============================================================
   AI Recommendation
============================================================ */

export interface ServiceRecommendation {

  title: string

  description: string

  score: number

}

/* ============================================================
   Service Card
============================================================ */

export interface Service {

  id: string

  slug: string

  title: string

  shortDescription: string

  longDescription: string

  icon: LucideIcon

  heroImage?: string

  color: string

  background: string

  gradient: string

  popular?: boolean

  enterprise?: boolean

  badge?: ServiceBadge

  pricing: ServicePricing

  estimatedDuration: string

  rating: number

  reviewCount: number

  aiRecommendation?: ServiceRecommendation

  features: ServiceFeature[]

  benefits: ServiceBenefit[]

  statistics: ServiceStatistic[]

}

/* ============================================================
   Service Comparison
============================================================ */

export interface ServiceComparison {

  title: string

  value: string

}

/* ============================================================
   Search Filter
============================================================ */

export interface ServiceFilter {

  keyword: string

  category?: string

  enterpriseOnly?: boolean

  popularOnly?: boolean

}

/* ============================================================
   Service Grid Props
============================================================ */

export interface ServiceGridProps {

  
  searchQuery?: string

}

/* ============================================================
   Service Card Props
============================================================ */

export interface ServiceCardProps {

  service: Service

  active: boolean

  onClick: () => void

}

/* ============================================================
   Preview Props
============================================================ */

export interface ServicePreviewProps {

  service: Service

}

/* ============================================================
   Header Props
============================================================ */

export interface ServiceHeaderProps {

  title: string

  subtitle: string

}

/* ============================================================
   Search Props
============================================================ */

export interface ServiceSearchProps {

  value: string

  onChange: (value: string) => void

}

/* ============================================================
   CTA Props
============================================================ */

export interface ServiceCTAProps {

  service: Service

}