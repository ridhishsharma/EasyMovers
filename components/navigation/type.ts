// =============================================================
// Easy Movers Enterprise Navigation System
// File: components/navigation/types.ts
// Version: 1.0
// =============================================================

import { LucideIcon } from "lucide-react"

/* ============================================================
   USER ROLES
============================================================ */

export type UserRole =
  | "guest"
  | "customer"
  | "vendor"
  | "corporate"
  | "franchise"
  | "admin"
  | "super-admin"

/* ============================================================
   BADGE TYPES
============================================================ */

export type NavigationBadge =
  | "New"
  | "Beta"
  | "Upcoming"
  | "Coming Soon"
  | "Enterprise"
  | "AI"

/* ============================================================
   FEATURE FLAG
============================================================ */

export interface FeatureFlag {
  enabled: boolean
  featureKey?: string
}

/* ============================================================
   MEGA MENU ITEM
============================================================ */

export interface NavigationChild {

  id: string

  title: string

  description: string

  href: string

  icon: LucideIcon

  badge?: NavigationBadge

  disabled?: boolean

  roles?: UserRole[]

  external?: boolean

  target?: "_blank" | "_self"

  featureFlag?: FeatureFlag
}

/* ============================================================
   PRIMARY NAVIGATION
============================================================ */

export interface NavigationItem {

  id: string

  title: string

  href?: string

  icon?: LucideIcon

  megaMenu?: boolean

  children?: NavigationItem[]

  roles?: UserRole[]

  disabled?: boolean

  external?: boolean

  target?: "_blank" | "_self"

  featureFlag?: FeatureFlag
}

/* ============================================================
   LOGIN MENU
============================================================ */

export interface LoginRole {

  id: string

  title: string

  href: string

  icon: LucideIcon

  role: UserRole
}

/* ============================================================
   QUICK ACTIONS
============================================================ */

export interface QuickAction {

  id: string

  title: string

  href: string

  icon: LucideIcon

  roles?: UserRole[]

  badge?: NavigationBadge
}

/* ============================================================
   HEADER STATS
============================================================ */

export interface HeaderStat {

  id: string

  label: string

  value: string
}

/* ============================================================
   SEARCH
============================================================ */

export interface SearchResult {

  id: string

  title: string

  description?: string

  href: string

  icon?: LucideIcon

  category:
    | "service"
    | "corporate"
    | "vendor"
    | "franchise"
    | "resource"
    | "support"

  roles?: UserRole[]
}

/* ============================================================
   NOTIFICATIONS
============================================================ */

export interface NotificationItem {

  id: string

  title: string

  description: string

  href?: string

  read: boolean

  createdAt: Date
}

/* ============================================================
   USER PROFILE
============================================================ */

export interface NavbarUser {

  id: string

  name: string

  email: string

  avatar?: string

  role: UserRole
}

/* ============================================================
   ENTERPRISE NAVBAR PROPS
============================================================ */

export interface EnterpriseNavbarProps {

  user?: NavbarUser

  authenticated?: boolean
}

/* ============================================================
   MOBILE DRAWER PROPS
============================================================ */

export interface MobileDrawerProps {

  open: boolean

  onOpenChange: (open: boolean) => void

  user?: NavbarUser
}

/* ============================================================
   MEGA MENU PROPS
============================================================ */

export interface MegaMenuProps {

  item: NavigationItem
}

/* ============================================================
   USER MENU PROPS
============================================================ */

export interface UserMenuProps {

  user: NavbarUser
}

/* ============================================================
   SEARCH COMMAND PROPS
============================================================ */

export interface SearchCommandProps {

  open: boolean

  onOpenChange: (open: boolean) => void
}

/* ============================================================
   NOTIFICATION MENU PROPS
============================================================ */

export interface NotificationMenuProps {

  notifications: NotificationItem[]
}