// =============================================================
// Easy Movers Enterprise Navigation Configuration
// File: components/navigation/navigation-config.ts
// Version: 1.0
// =============================================================

import {
  Home,
  Building2,
  Truck,
  Car,
  Factory,
  Package,
  Briefcase,
  Users,
  Handshake,
  Store,
  BookOpen,
  FileText,
  HelpCircle,
  PhoneCall,
  MapPinned,
  User,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
} from "lucide-react"

import type {
  HeaderStat,
  NavigationItem,
  LoginRole,
  QuickAction,
} from "./types"

/* ============================================================
   PRIMARY NAVIGATION
============================================================ */

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    id: "home",
    title: "Home",
    href: "/",
    icon: Home,
  },

  {
    id: "services",
    title: "Services",
    megaMenu: true,

    children: [
      {
        id: "house-relocation",
        title: "House Relocation",
        description:
          "Complete household shifting across India with AI-assisted planning.",
        href: "/services/house-relocation",
        icon: Home,
      },

      {
        id: "office-relocation",
        title: "Office Relocation",
        description:
          "Professional office and corporate workspace relocation.",
        href: "/services/office-relocation",
        icon: Building2,
      },

      {
        id: "vehicle-transport",
        title: "Vehicle Transport",
        description:
          "Secure car and bike transportation services nationwide.",
        href: "/services/vehicle-transport",
        icon: Car,
      },

      {
        id: "industrial-relocation",
        title: "Industrial Relocation",
        description:
          "Heavy machinery and industrial plant shifting solutions.",
        href: "/services/industrial-relocation",
        icon: Factory,
        disabled: true,
        badge: "Coming Soon",
      },

      {
        id: "local-transfer",
        title: "Local Goods Transfer",
        description:
          "Same-city transport through verified logistics partners.",
        href: "/services/local-transfer",
        icon: Package,
        disabled: true,
        badge: "Coming Soon",
      },
    ],
  },

  {
    id: "corporate",
    title: "Corporate",
    megaMenu: true,

    children: [
      {
        id: "corporate-relocation",
        title: "Corporate Relocation",
        description:
          "Enterprise employee relocation management.",
        href: "/corporate",
        icon: Briefcase,
      },

      {
        id: "enterprise-portal",
        title: "Enterprise Portal",
        description:
          "Dedicated dashboard for HR, Finance and Operations.",
        href: "/corporate/portal",
        icon: LayoutDashboard,
        disabled: true,
        badge: "Beta",
      },

      {
        id: "employee-transfers",
        title: "Employee Transfers",
        description:
          "Bulk employee transfer workflow.",
        href: "/corporate/transfers",
        icon: Users,
        disabled: true,
        badge: "Upcoming",
      },

      {
        id: "enterprise-demo",
        title: "Request Enterprise Demo",
        description:
          "Book a live demonstration.",
        href: "/corporate/demo",
        icon: Building2,
      },
    ],
  },

  {
    id: "partners",
    title: "Partners",
    megaMenu: true,

    children: [
      {
        id: "become-vendor",
        title: "Become Vendor",
        description:
          "Grow your logistics business with Easy Movers.",
        href: "/partner",
        icon: Handshake,
      },

      {
        id: "vendor-dashboard",
        title: "Vendor Dashboard",
        description:
          "Manage jobs, quotations and earnings.",
        href: "/vendor/dashboard",
        icon: Store,
        disabled: true,
      },

      {
        id: "vendor-benefits",
        title: "Vendor Benefits",
        description:
          "Benefits of joining Easy Movers.",
        href: "/vendor/benefits",
        icon: ShieldCheck,
      },
    ],
  },

  {
    id: "franchise",
    title: "Franchise",
    href: "/franchise",
    icon: Store,
  },

  {
    id: "resources",
    title: "Resources",
    megaMenu: true,

    children: [
      {
        id: "knowledge-center",
        title: "Knowledge Center",
        description:
          "Moving guides and documentation.",
        href: "/resources",
        icon: BookOpen,
      },

      {
        id: "blogs",
        title: "Blogs",
        description:
          "Industry insights and relocation tips.",
        href: "/blog",
        icon: FileText,
      },

      {
        id: "faq",
        title: "FAQs",
        description:
          "Frequently asked questions.",
        href: "/faq",
        icon: HelpCircle,
      },

      {
        id: "track-shipment",
        title: "Track Shipment",
        description:
          "Track your relocation in real time.",
        href: "/track",
        icon: MapPinned,
      },
    ],
  },

  {
    id: "support",
    title: "Support",
    href: "/support",
    icon: PhoneCall,
  },
]

/* ============================================================
   HEADER STATS
============================================================ */

export const HEADER_STATS: HeaderStat[] = [
  {
    id: "moves-completed",
    label: "Moves Completed",
    value: "15,000+",
  },

  {
    id: "cities",
    label: "Cities",
    value: "120+",
  },

  {
    id: "verified-vendors",
    label: "Verified Vendors",
    value: "8,500+",
  },

  {
    id: "customer-rating",
    label: "Customer Rating",
    value: "4.9★",
  },
]
/* ============================================================
   LOGIN ROLES
============================================================ */

export const LOGIN_ROLES: LoginRole[] = [
  {
    id: "customer-login",
    title: "Customer Login",
    href: "/login/customer",
    icon: User,
    role: "customer",
  },

  {
    id: "vendor-login",
    title: "Vendor Login",
    href: "/login/vendor",
    icon: Truck,
    role: "vendor",
  },

  {
    id: "corporate-login",
    title: "Corporate Login",
    href: "/login/corporate",
    icon: Briefcase,
    role: "corporate",
  },

  {
    id: "franchise-login",
    title: "Franchise Login",
    href: "/login/franchise",
    icon: Store,
    role: "franchise",
  },

  {
    id: "admin-login",
    title: "Admin Login",
    href: "/login/admin",
    icon: Settings,
    role: "admin",
  },
]

/* ============================================================
   QUICK ACTIONS
============================================================ */

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "track-move",
    title: "Track Move",
    href: "/track",
    icon: MapPinned,
  },

  {
    id: "notifications",
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },

  {
    id: "search",
    title: "Search",
    href: "/search",
    icon: Search,
  },
]

/* ============================================================
   SAMPLE NOTIFICATIONS
============================================================ */

export const SAMPLE_NOTIFICATIONS = [
  {
    id: "notification-1",
    title: "Booking Confirmed",
    description: "Your relocation booking has been confirmed.",
    href: "/dashboard/bookings",
    read: false,
    createdAt: new Date(),
  },

  {
    id: "notification-2",
    title: "Vendor Assigned",
    description: "A verified vendor has accepted your request.",
    href: "/dashboard/bookings",
    read: false,
    createdAt: new Date(),
  },

  {
    id: "notification-3",
    title: "Payment Received",
    description: "Advance payment has been received successfully.",
    href: "/dashboard/payments",
    read: true,
    createdAt: new Date(),
  },
]

/* ============================================================
   SEARCH INDEX
============================================================ */

export const SEARCH_INDEX = [
  {
    id: "search-house",
    title: "House Relocation",
    description: "Door-to-door household shifting.",
    href: "/services/house-relocation",
    icon: Home,
    category: "service",
  },

  {
    id: "search-office",
    title: "Office Relocation",
    description: "Corporate office shifting.",
    href: "/services/office-relocation",
    icon: Building2,
    category: "service",
  },

  {
    id: "search-vehicle",
    title: "Vehicle Transport",
    description: "Car & Bike transportation.",
    href: "/services/vehicle-transport",
    icon: Car,
    category: "service",
  },

  {
    id: "search-corporate",
    title: "Corporate Services",
    description: "Enterprise relocation solutions.",
    href: "/corporate",
    icon: Briefcase,
    category: "corporate",
  },

  {
    id: "search-vendor",
    title: "Become Vendor",
    description: "Register as logistics partner.",
    href: "/partner",
    icon: Handshake,
    category: "vendor",
  },

  {
    id: "search-franchise",
    title: "Franchise",
    description: "Business partnership opportunity.",
    href: "/franchise",
    icon: Store,
    category: "franchise",
  },

  {
    id: "search-blog",
    title: "Moving Guides",
    description: "Blogs and relocation tips.",
    href: "/blog",
    icon: FileText,
    category: "resource",
  },

  {
    id: "search-faq",
    title: "FAQs",
    description: "Frequently Asked Questions.",
    href: "/faq",
    icon: HelpCircle,
    category: "support",
  },

  {
    id: "search-track",
    title: "Track Shipment",
    description: "Track your move.",
    href: "/track",
    icon: MapPinned,
    category: "support",
  },

  {
    id: "search-contact",
    title: "Contact Support",
    description: "Customer assistance.",
    href: "/support",
    icon: PhoneCall,
    category: "support",
  },
]

/* ============================================================
   FEATURE FLAGS
============================================================ */

export const FEATURE_FLAGS = {
  aiAssistant: true,
  enterprisePortal: false,
  employeeTransfers: false,
  industrialRelocation: false,
  localTransfer: false,
  vendorDashboard: false,
}

/* ============================================================
   DEFAULT USER MENU
============================================================ */

export const USER_MENU_ITEMS = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    id: "profile",
    title: "My Profile",
    href: "/profile",
    icon: User,
  },

  {
    id: "notifications",
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },

  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

/* ============================================================
   CONTACT DETAILS
============================================================ */

export const COMPANY_CONTACT = {

  phone: "+91-9876543210",

  whatsapp: "+91-9876543210",

  email: "support@easymovers.in",

  website: "https://www.easymovers.in",

}

/* ============================================================
   COMPANY INFORMATION
============================================================ */

export const COMPANY_INFO = {

  companyName: "Easy Movers",

  tagline: "India's Intelligent Relocation Platform",

  founded: "2026",

}

/* ============================================================
   SOCIAL LINKS
============================================================ */

export const SOCIAL_LINKS = [

  {
    id: "facebook",
    title: "Facebook",
    href: "#",
  },

  {
    id: "instagram",
    title: "Instagram",
    href: "#",
  },

  {
    id: "linkedin",
    title: "LinkedIn",
    href: "#",
  },

  {
    id: "youtube",
    title: "YouTube",
    href: "#",
  },

]

/* ============================================================
   FOOTER LINKS
============================================================ */

export const FOOTER_LINKS = [

  {
    id: "privacy",
    title: "Privacy Policy",
    href: "/legal/privacy-policy",
  },

  {
    id: "terms",
    title: "Terms & Conditions",
    href: "/legal/terms",
  },

  {
    id: "vendor-terms",
    title: "Vendor Terms",
    href: "/legal/vendor-terms",
  },

  {
    id: "refund-policy",
    title: "Refund Policy",
    href: "/legal/refund-policy",
  },

]

/* ============================================================
   HELP CENTER LINKS
============================================================ */

export const HELP_LINKS = [

  {
    id: "faq",
    title: "FAQs",
    href: "/faq",
  },

  {
    id: "contact",
    title: "Contact Us",
    href: "/support",
  },

  {
    id: "track",
    title: "Track Shipment",
    href: "/track",
  },

]

/* ============================================================
   EXPORT DEFAULT
============================================================ */

const NavigationConfig = {

  PRIMARY_NAVIGATION,

  LOGIN_ROLES,

  QUICK_ACTIONS,

  HEADER_STATS,

  SAMPLE_NOTIFICATIONS,

  SEARCH_INDEX,

  FEATURE_FLAGS,

  USER_MENU_ITEMS,

  COMPANY_CONTACT,

  COMPANY_INFO,

  SOCIAL_LINKS,

  FOOTER_LINKS,

  HELP_LINKS,

}

export default NavigationConfig