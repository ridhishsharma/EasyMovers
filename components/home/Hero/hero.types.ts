/* ============================================================
   Easy Movers Enterprise Platform

   Hero Module Types

   File: hero.types.ts

   Version: 1.0
============================================================ */

/* ============================================================
   Generic Hero Icon
============================================================ */

import type { LucideIcon } from "lucide-react"

/* ============================================================
   Hero Button
============================================================ */

export interface HeroButton {

  id: string

  label: string

  href?: string

  icon?: LucideIcon

  variant?: "default" | "outline" | "ghost"

  target?: "_self" | "_blank"

}

/* ============================================================
   Hero Metric
============================================================ */

export interface HeroMetric {

  icon: LucideIcon

  value: number

  suffix?: string

  label: string

  color: string

  background: string

}

/* ============================================================
   Hero Badge
============================================================ */

export interface HeroBadge {

  icon: LucideIcon

  label: string

  color: string

  background: string

}

/* ============================================================
   Hero Trust Item
============================================================ */

export interface HeroTrustItem {

  icon: LucideIcon

  title: string

  subtitle: string

  color: string

  background: string

}

/* ============================================================
   Hero Statistic
============================================================ */

export interface HeroStat {

  icon: LucideIcon

  value: number

  suffix?: string

  label: string

  color: string

}