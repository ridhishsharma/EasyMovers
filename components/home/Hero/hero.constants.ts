/* ============================================================
   Easy Movers Enterprise Platform

   Hero Constants

   File: hero.constants.ts

   Version: 1.0
============================================================ */

import {

  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Headphones,
  Home,
  MapPinned,
  Shield,
  ShieldCheck,
  Star,
  Truck,
  Users,
  Workflow,

} from "lucide-react"

import type {

  HeroBadge,
  HeroMetric,
  HeroStat,
  HeroTrustItem,

} from "./hero.types"

/* ============================================================
   Hero Metrics
============================================================ */

export const HERO_METRICS: HeroMetric[] = [

  {
    icon: Globe2,
    value: 850,
    suffix: "+",
    label: "Cities Covered",
    color: "text-blue-600",
    background: "bg-blue-50",
  },

  {
    icon: Truck,
    value: 6500,
    suffix: "+",
    label: "Verified Movers",
    color: "text-orange-500",
    background: "bg-orange-50",
  },

  {
    icon: Building2,
    value: 250,
    suffix: "+",
    label: "Enterprise Clients",
    color: "text-indigo-600",
    background: "bg-indigo-50",
  },

  {
    icon: ShieldCheck,
    value: 120000,
    suffix: "+",
    label: "Successful Moves",
    color: "text-green-600",
    background: "bg-green-50",
  },

]

/* ============================================================
   Hero Badges
============================================================ */

export const HERO_BADGES: HeroBadge[] = [

  {
    icon: Bot,
    label: "AI Powered",
    color: "text-orange-500",
    background: "bg-orange-50",
  },

  {
    icon: Truck,
    label: "6500+ Verified Movers",
    color: "text-blue-600",
    background: "bg-blue-50",
  },

  {
    icon: Workflow,
    label: "Corporate API",
    color: "text-indigo-600",
    background: "bg-indigo-50",
  },

  {
    icon: MapPinned,
    label: "Real-Time Tracking",
    color: "text-green-600",
    background: "bg-green-50",
  },

  {
    icon: Shield,
    label: "Fully Insured",
    color: "text-emerald-600",
    background: "bg-emerald-50",
  },

  {
    icon: CreditCard,
    label: "Secure Payments",
    color: "text-violet-600",
    background: "bg-violet-50",
  },

]

/* ============================================================
   Hero Trust
============================================================ */

export const HERO_TRUST: HeroTrustItem[] = [

  {
    icon: Star,
    title: "4.9/5",
    subtitle: "Google Rating",
    color: "text-amber-500",
    background: "bg-amber-50",
  },

  {
    icon: CheckCircle2,
    title: "6500+",
    subtitle: "Verified Movers",
    color: "text-green-600",
    background: "bg-green-50",
  },

  {
    icon: Building2,
    title: "250+",
    subtitle: "Enterprise Clients",
    color: "text-blue-600",
    background: "bg-blue-50",
  },

  {
    icon: ShieldCheck,
    title: "Fully",
    subtitle: "Insured Platform",
    color: "text-orange-500",
    background: "bg-orange-50",
  },

]

/* ============================================================
   Hero Statistics
============================================================ */

export const HERO_STATS: HeroStat[] = [

  {
    icon: Clock3,
    value: 24,
    suffix: "/7",
    label: "Customer Support",
    color: "text-orange-500",
  },

  {
    icon: MapPinned,
    value: 850,
    suffix: "+",
    label: "Cities Covered",
    color: "text-blue-600",
  },

  {
    icon: Users,
    value: 120000,
    suffix: "+",
    label: "Happy Customers",
    color: "text-green-600",
  },

  {
    icon: Headphones,
    value: 15,
    suffix: "+",
    label: "Years Experience",
    color: "text-violet-600",
  },

]

/* ============================================================
   Illustration Cards
============================================================ */

export const HERO_ILLUSTRATION = {

  home: {
    icon: Home,
    title: "Home Relocation",
    subtitle: "Door-to-door household shifting",
  },

  office: {
    icon: Building2,
    title: "Office Relocation",
    subtitle: "Enterprise employee transfer",
  },

  vendor: {
    icon: CheckCircle2,
    title: "Verified Vendor",
    subtitle: "Trust Score: 98%",
    badge: "Background Checked",
  },

  insurance: {
    icon: ShieldCheck,
    title: "Insurance Active",
    subtitle: "Goods protected throughout transit",
    badge: "₹10 Lakh Coverage",
  },

}

/* ============================================================
   Hero Search Defaults
============================================================ */

export const HERO_SEARCH = {

  moveTypes: [

    "home",

    "office",

    "vehicle",

    "corporate",

  ],

  aiMessage:
    "Our AI compares 6,500+ verified movers, historical pricing, transit time, ratings and availability to recommend the best relocation partner.",

}