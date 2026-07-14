/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Type Definitions

   File: process.types.ts

   Version: 1.0
============================================================ */

import type {

  LucideIcon,

} from "lucide-react"

import type { ReactNode } from "react"

/* ============================================================
   Process Statistics
============================================================ */

export interface ProcessStatistic {

  id: string

  label: string

  value: string

  description?: string

}

/* ============================================================
   Process Feature
============================================================ */

export interface ProcessFeature {

  id: string

  title: string

  description: string

  icon?: LucideIcon

}

/* ============================================================
   Timeline Step
============================================================ */

export interface ProcessStep {

  id: string

  order: number

  title: string

  subtitle?: string

  description: string

  icon: LucideIcon

  image?: string

  background: string

  gradient: string

  color: string

  duration?: string

  aiPowered?: boolean

  features: ProcessFeature[]

}

/* ============================================================
   Timeline Collection
============================================================ */

export interface ProcessTimeline {

  title: string

  subtitle: string

  steps: ProcessStep[]

}

/* ============================================================
   Component Props
============================================================ */

export interface ProcessHeaderProps {

  title: string

  subtitle: string

  badge?: string

}

export interface ProcessCardProps {

  step: ProcessStep

  active?: boolean

  index?: number

  onClick?: () => void

}

export interface ProcessTimelineProps {

  steps: ProcessStep[]

  activeStep?: string

  onStepChange?: (step: ProcessStep) => void

}

export interface ProcessLineProps {

  current: number

  total: number

}

export interface ProcessAnimationProps {

  children: ReactNode

  delay?: number

  duration?: number

}

/* ============================================================
   Section Props
============================================================ */

export interface HowItWorksProps {

  title?: string

  subtitle?: string

}

/* ============================================================
   Animation Types
============================================================ */

export interface ProcessAnimationVariant {

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

export interface ProcessTheme {

  background: string

  foreground: string

  border: string

  accent: string

  gradient: string

}

/* ============================================================
   AI Insight
============================================================ */

export interface ProcessAIInsight {

  title: string

  description: string

  confidenceScore?: number

  recommendation?: string

}

/* ============================================================
   Enterprise Metrics
============================================================ */

export interface ProcessMetric {

  id: string

  label: string

  value: string | number

  icon?: LucideIcon

}

/* ============================================================
   Complete Section Data
============================================================ */

export interface HowItWorksData {

  header: ProcessHeaderProps

  timeline: ProcessTimeline

  statistics?: ProcessStatistic[]

  metrics?: ProcessMetric[]

  aiInsight?: ProcessAIInsight

}

/* ============================================================
   Generic Helpers
============================================================ */

export type ProcessStepId = ProcessStep["id"]

export type ProcessOrder = ProcessStep["order"]

export type ProcessFeatureId = ProcessFeature["id"]

/* ============================================================
   Future Extension Points

   Reserved for future enterprise modules:

   • Live Tracking
   • AI Move Planner
   • Vendor Assignment
   • Carbon Footprint
   • Insurance Options
   • Smart Scheduling
   • Route Optimization
============================================================ */

export interface ProcessExtension {

  id: string

  enabled: boolean

  config?: Record<string, unknown>

}

/* ============================================================
   End of File
============================================================ */