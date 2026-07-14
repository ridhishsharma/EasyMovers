/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Services

   File: service.constants.ts

   Version: 1.0
============================================================ */

import {

  Archive,

  BadgeCheck,

  Box,

  Building2,

  Globe2,

  Home,

  MapPinned,

  Package,

  ShieldCheck,

  Truck,

  Users,

  Warehouse,

} from "lucide-react"

import type {

  Service,

  ServiceBenefit,

  ServiceFeature,

} from "./service.types"

/* ============================================================
   Shared Features
============================================================ */

export const COMMON_FEATURES: ServiceFeature[] = [

  {
    id: "packing",
    title: "Professional Packing",
    description: "High-quality packing materials and trained staff.",
    icon: Package,
  },

  {
    id: "loading",
    title: "Loading & Unloading",
    description: "Safe loading using modern equipment.",
    icon: Truck,
  },

  {
    id: "insurance",
    title: "Transit Insurance",
    description: "Comprehensive protection for valuable goods.",
    icon: ShieldCheck,
  },

  {
    id: "tracking",
    title: "Live GPS Tracking",
    description: "Track your shipment in real time.",
    icon: MapPinned,
  },

]

/* ============================================================
   Shared Benefits
============================================================ */

export const COMMON_BENEFITS: ServiceBenefit[] = [

  {
    id: "verified",

    title: "Verified Professionals",

    description:
      "Every moving partner undergoes verification before onboarding.",

    icon: BadgeCheck,
  },

  {
    id: "ai",

    title: "AI Vendor Matching",

    description:
      "Our AI recommends the most suitable mover for every relocation.",

    icon: Users,
  },

]

/* ============================================================
   Home Relocation
============================================================ */

export const HOME_RELOCATION: Service = {

  id: "home",

  slug: "home-relocation",

  title: "Home Relocation",

  shortDescription:
    "Safe household shifting anywhere in India.",

  longDescription:
    "End-to-end residential relocation including packing, loading, transportation, unloading, unpacking and insurance.",

  icon: Home,

  color: "text-orange-500",

  background: "bg-orange-50",

  gradient:
    "from-orange-500 to-amber-400",

  popular: true,

  enterprise: false,

  badge: {

    label: "Most Popular",

    color: "orange",

  },

  pricing: {

    startingPrice: 2999,

    currency: "₹",

    unit: "Starting",

  },

  estimatedDuration: "1–3 Days",

  rating: 4.9,

  reviewCount: 18243,

  aiRecommendation: {

    title: "Best for Families",

    description:
      "Recommended for 1–5 BHK residential relocation.",

    score: 98,

  },

  features: [

    ...COMMON_FEATURES,

    {

      id: "unpacking",

      title: "Unpacking",

      description:
        "Complete unpacking and furniture arrangement.",

      icon: Box,

    },

    {

      id: "storage",

      title: "Temporary Storage",

      description:
        "Short and long-term warehouse storage.",

      icon: Warehouse,

    },

  ],

  benefits: COMMON_BENEFITS,

  statistics: [

    {

      label: "Successful Moves",

      value: "85,000+",

    },

    {

      label: "Average Delivery",

      value: "2 Days",

    },

    {

      label: "Customer Rating",

      value: "4.9",

    },

  ],

}

/* ============================================================
   Office Relocation
============================================================ */

export const OFFICE_RELOCATION: Service = {

  id: "office",

  slug: "office-relocation",

  title: "Office Relocation",

  shortDescription:
    "Corporate office shifting with minimum downtime.",

  longDescription:
    "Enterprise-grade office relocation including IT assets, workstations, records, conference equipment and secure transportation.",

  icon: Building2,

  color: "text-blue-600",

  background: "bg-blue-50",

  gradient:
    "from-blue-600 to-cyan-500",
  popular: false,

  enterprise: true,

  badge: {

    label: "Enterprise",

    color: "blue",

  },

  pricing: {

    startingPrice: 15000,

    currency: "₹",

    unit: "Project",

  },

  estimatedDuration: "1–7 Days",

  rating: 4.9,

  reviewCount: 3842,

  aiRecommendation: {

    title: "Best for Businesses",

    description:
      "Designed for office relocation with minimum operational downtime.",

    score: 99,

  },

  features: [

    ...COMMON_FEATURES,

    {

      id: "asset-tagging",

      title: "Asset Tagging",

      description:
        "Barcode and inventory tagging for every office asset.",

      icon: Archive,

    },

    {

      id: "it-equipment",

      title: "IT Equipment Handling",

      description:
        "Safe transportation of servers, desktops and networking equipment.",

      icon: Building2,

    },

    {

      id: "weekend-shifting",

      title: "Weekend Migration",

      description:
        "Move your office during weekends to avoid business interruption.",

      icon: Users,

    },

    {

      id: "project-manager",

      title: "Dedicated Project Manager",

      description:
        "Single point of contact for complete relocation execution.",

      icon: BadgeCheck,

    },

  ],

  benefits: [

    ...COMMON_BENEFITS,

    {

      id: "zero-downtime",

      title: "Minimum Downtime",

      description:
        "Business continuity planning with phased relocation strategy.",

      icon: Building2,

    },

    {

      id: "employee-coordination",

      title: "Employee Coordination",

      description:
        "Coordinate relocation schedules department-wise for smooth transition.",

      icon: Users,

    },

  ],

  statistics: [

    {

      label: "Corporate Projects",

      value: "2,500+",

    },

    {

      label: "Average Downtime",

      value: "< 8 Hours",

    },

    {

      label: "Enterprise Rating",

      value: "4.9",

    },

  ],

}

/* ============================================================
   Vehicle Transport
============================================================ */

export const VEHICLE_TRANSPORT: Service = {

  id: "vehicle",

  slug: "vehicle-transport",

  title: "Vehicle Transport",

  shortDescription:
    "Secure transportation for cars, bikes and premium vehicles.",

  longDescription:
    "Door-to-door vehicle transportation with GPS tracking, enclosed carriers, insurance coverage and delivery verification.",

  icon: Truck,

  color: "text-green-600",

  background: "bg-green-50",

  gradient:
    "from-green-600 to-emerald-500",

  popular: true,

  enterprise: false,

  badge: {

    label: "Fast Delivery",

    color: "green",

  },

  pricing: {

    startingPrice: 3999,

    currency: "₹",

    unit: "Starting",

  },

  estimatedDuration: "2–5 Days",

  rating: 4.8,

  reviewCount: 9218,

  aiRecommendation: {

    title: "Ideal for Long Distance",

    description:
      "Recommended for interstate vehicle transportation.",

    score: 97,

  },

  features: [

    {

      id: "door-pickup",

      title: "Door Pickup",

      description:
        "Vehicle picked up directly from your location.",

      icon: MapPinned,

    },

    {

      id: "enclosed-carriers",

      title: "Enclosed Carriers",

      description:
        "Premium enclosed trailers for luxury vehicles.",

      icon: Truck,

    },

    {

      id: "gps",

      title: "Live GPS Tracking",

      description:
        "Monitor your vehicle throughout the journey.",

      icon: Globe2,

    },

    {

      id: "insurance",

      title: "Transit Insurance",

      description:
        "Complete insurance coverage during transport.",

      icon: ShieldCheck,

    },

  ],
  benefits: [

    ...COMMON_BENEFITS,

    {

      id: "damage-free",

      title: "Damage Free Handling",

      description:
        "Specialized loading and wheel locking systems ensure maximum safety.",

      icon: ShieldCheck,

    },

    {

      id: "delivery-proof",

      title: "Delivery Verification",

      description:
        "Digital delivery confirmation with photographs and OTP verification.",

      icon: BadgeCheck,

    },

  ],

  statistics: [

    {

      label: "Vehicles Delivered",

      value: "48,000+",

    },

    {

      label: "Safe Delivery",

      value: "99.7%",

    },

    {

      label: "Customer Rating",

      value: "4.8",

    },

  ],

}

/* ============================================================
   Corporate Relocation
============================================================ */

export const CORPORATE_RELOCATION: Service = {

  id: "corporate",

  slug: "corporate-relocation",

  title: "Corporate Relocation",

  shortDescription:
    "Enterprise employee relocation platform with approval workflow.",

  longDescription:
    "Complete relocation management solution for HR teams, banks, IT companies, PSUs and multinational organizations with API integration and approval hierarchy.",

  icon: Users,

  color: "text-indigo-600",

  background: "bg-indigo-50",

  gradient:
    "from-indigo-600 to-purple-600",

  popular: false,

  enterprise: true,

  badge: {

    label: "Enterprise Suite",

    color: "indigo",

  },

  pricing: {

    startingPrice: 50000,

    currency: "₹",

    unit: "Implementation",

  },

  estimatedDuration: "Custom",

  rating: 5.0,

  reviewCount: 512,

  aiRecommendation: {

    title: "Best for Organizations",

    description:
      "Designed for companies relocating employees across India.",

    score: 100,

  },

  features: [

    {

      id: "employee-portal",

      title: "Employee Self-Service Portal",

      description:
        "Employees can submit relocation requests and track approvals.",

      icon: Users,

    },

    {

      id: "approval-workflow",

      title: "Multi-Level Approval Workflow",

      description:
        "Manager → HR → Finance → Admin approval hierarchy.",

      icon: BadgeCheck,

    },

    {

      id: "corporate-api",

      title: "Corporate API Integration",

      description:
        "Integrate directly with HRMS, ERP and internal employee systems.",

      icon: Globe2,

    },

    {

      id: "cost-center",

      title: "Cost Center Allocation",

      description:
        "Assign relocation expenses to projects, departments and business units.",

      icon: Building2,

    },

    {

      id: "policy-engine",

      title: "Company Relocation Policy",

      description:
        "Automatically validate employee eligibility according to corporate policy.",

      icon: ShieldCheck,

    },

    {

      id: "dashboard",

      title: "Enterprise Dashboard",

      description:
        "HR teams can monitor every relocation from one centralized dashboard.",

      icon: Archive,

    },

  ],

  benefits: [

    {

      id: "automation",

      title: "Complete Process Automation",

      description:
        "Reduce manual coordination with AI-driven relocation workflows.",

      icon: BadgeCheck,

    },

    {

      id: "visibility",

      title: "Real-Time Visibility",

      description:
        "Track every employee transfer with live updates and reporting.",

      icon: MapPinned,

    },

    {

      id: "analytics",

      title: "Enterprise Analytics",

      description:
        "Powerful dashboards for relocation cost, turnaround time and vendor performance.",

      icon: Building2,

    },

    ...COMMON_BENEFITS,

  ],

  statistics: [

    {

      label: "Enterprise Accounts",

      value: "250+",

    },

    {

      label: "Employees Relocated",

      value: "42,000+",

    },

    {

      label: "Approval Success",

      value: "99.9%",

    },

  ],

}

/* ============================================================
   Warehousing & Storage
============================================================ */

export const WAREHOUSING: Service = {

  id: "warehouse",

  slug: "warehousing-storage",

  title: "Warehousing & Storage",

  shortDescription:
    "Secure short-term and long-term storage solutions.",

  longDescription:
    "Enterprise-grade warehousing with digital inventory, climate-controlled facilities, barcode tracking and secure retrieval management for household and commercial goods.",

  icon: Warehouse,

  color: "text-amber-600",

  background: "bg-amber-50",

  gradient:
    "from-amber-500 to-orange-500",

  popular: false,

  enterprise: true,

  badge: {

    label: "Smart Storage",

    color: "amber",

  },

  pricing: {

    startingPrice: 1999,

    currency: "₹",

    unit: "Per Month",

  },

  estimatedDuration: "Flexible",

  rating: 4.9,

  reviewCount: 2841,

  aiRecommendation: {

    title: "Best for Temporary Storage",

    description:
      "Ideal when delivery dates and relocation dates differ.",

    score: 96,

  },

  features: [

    {

      id: "inventory",

      title: "Digital Inventory",

      description:
        "Every stored item is digitally catalogued with barcode tracking.",

      icon: Archive,

    },

    {

      id: "barcode",

      title: "Barcode Management",

      description:
        "Quick identification and retrieval of stored goods.",

      icon: BadgeCheck,

    },

    {

      id: "climate",

      title: "Climate Controlled",

      description:
        "Temperature and humidity monitored storage for sensitive goods.",

      icon: ShieldCheck,

    },

    {

      id: "security",

      title: "24×7 Security",

      description:
        "CCTV surveillance and restricted warehouse access.",

      icon: ShieldCheck,

    },

  ],

  benefits: [

    {

      id: "secure-storage",

      title: "Enterprise Grade Security",

      description:
        "24×7 monitored warehouses with CCTV, access control and fire protection.",

      icon: ShieldCheck,

    },

    {

      id: "retrieval",

      title: "On-Demand Retrieval",

      description:
        "Request delivery or pickup of stored goods whenever required.",

      icon: Truck,

    },

    {

      id: "inventory-dashboard",

      title: "Inventory Dashboard",

      description:
        "Monitor every stored package through the Easy Movers dashboard.",

      icon: Archive,

    },

    ...COMMON_BENEFITS,

  ],

  statistics: [

    {

      label: "Warehouse Space",

      value: "1.2M Sq Ft",

    },

    {

      label: "Storage Units",

      value: "25,000+",

    },

    {

      label: "Inventory Accuracy",

      value: "99.98%",

    },

  ],

}

/* ============================================================
   International Relocation
============================================================ */

export const INTERNATIONAL_RELOCATION: Service = {

  id: "international",

  slug: "international-relocation",

  title: "International Relocation",

  shortDescription:
    "Worldwide relocation and freight management.",

  longDescription:
    "Door-to-door international relocation with customs documentation, freight forwarding, destination support and global tracking.",

  icon: Globe2,

  color: "text-sky-600",

  background: "bg-sky-50",

  gradient:
    "from-sky-600 to-blue-600",

  popular: false,

  enterprise: true,

  badge: {

    label: "Global Network",

    color: "sky",

  },

  pricing: {

    startingPrice: 25000,

    currency: "₹",

    unit: "Starting",

  },

  estimatedDuration: "Country Dependent",

  rating: 4.9,

  reviewCount: 1238,

  aiRecommendation: {

    title: "Global Moving Solution",

    description:
      "Best for overseas relocation and international assignments.",

    score: 98,

  },

  features: [
    {

      id: "customs",

      title: "Customs Documentation",

      description:
        "Complete customs clearance assistance and international documentation.",

      icon: BadgeCheck,

    },

    {

      id: "freight",

      title: "Air & Sea Freight",

      description:
        "Flexible international transportation through trusted freight partners.",

      icon: Globe2,

    },

    {

      id: "destination",

      title: "Destination Services",

      description:
        "Unpacking, installation and local support at destination country.",

      icon: Home,

    },

    {

      id: "insurance",

      title: "Global Insurance",

      description:
        "Comprehensive international transit insurance coverage.",

      icon: ShieldCheck,

    },

    {

      id: "tracking",

      title: "Global Shipment Tracking",

      description:
        "Monitor international consignments in real time.",

      icon: MapPinned,

    },

    {

      id: "compliance",

      title: "Country Compliance",

      description:
        "Ensure shipment complies with destination regulations.",

      icon: Building2,

    },

  ],

  benefits: [

    {

      id: "worldwide-network",

      title: "Worldwide Partner Network",

      description:
        "Trusted logistics partners across more than 120 countries.",

      icon: Globe2,

    },

    {

      id: "dedicated-manager",

      title: "Dedicated Move Manager",

      description:
        "Single point of contact throughout the international relocation.",

      icon: Users,

    },

    {

      id: "documentation-support",

      title: "Documentation Support",

      description:
        "Visa, customs and relocation documentation guidance.",

      icon: Archive,

    },

    ...COMMON_BENEFITS,

  ],

  statistics: [

    {

      label: "Countries Served",

      value: "120+",

    },

    {

      label: "Global Shipments",

      value: "18,000+",

    },

    {

      label: "Success Rate",

      value: "99.4%",

    },

  ],

}
/* ============================================================
   Master Service Collection
============================================================ */

export const SERVICES: Service[] = [

  HOME_RELOCATION,

  OFFICE_RELOCATION,

  VEHICLE_TRANSPORT,

  CORPORATE_RELOCATION,

  WAREHOUSING,

  INTERNATIONAL_RELOCATION,

]

/* ============================================================
   Featured Services
============================================================ */

export const FEATURED_SERVICES: Service[] = [

  HOME_RELOCATION,

  VEHICLE_TRANSPORT,

  CORPORATE_RELOCATION,

]

/* ============================================================
   Enterprise Services
============================================================ */

export const ENTERPRISE_SERVICES: Service[] = [

  OFFICE_RELOCATION,

  CORPORATE_RELOCATION,

  WAREHOUSING,

  INTERNATIONAL_RELOCATION,

]

/* ============================================================
   Popular Services
============================================================ */

export const POPULAR_SERVICES: Service[] =

  SERVICES.filter(service => service.popular)

/* ============================================================
   Service Categories
============================================================ */

export const SERVICE_CATEGORIES = [

  {

    id: "all",

    label: "All Services",

  },

  {

    id: "residential",

    label: "Residential",

  },

  {

    id: "corporate",

    label: "Corporate",

  },

  {

    id: "vehicle",

    label: "Vehicle",

  },

  {

    id: "storage",

    label: "Storage",

  },

  {

    id: "international",

    label: "International",

  },

]

/* ============================================================
   Default Service
============================================================ */

export const DEFAULT_SERVICE = HOME_RELOCATION

/* ============================================================
   Search Suggestions
============================================================ */

export const SERVICE_SEARCH_SUGGESTIONS = [

  "House Shifting",

  "Office Relocation",

  "Employee Transfer",

  "Car Transport",

  "Bike Transport",

  "Warehouse Storage",

  "International Moving",

]

/* ============================================================
   AI Recommendation Keywords
============================================================ */

export const AI_SERVICE_KEYWORDS = {

  home: [
    "house",
    "flat",
    "apartment",
    "villa",
    "family",
  ],

  office: [
    "office",
    "business",
    "workspace",
    "company",
  ],

  vehicle: [
    "car",
    "bike",
    "vehicle",
  ],

  corporate: [
    "employee",
    "corporate",
    "hr",
    "transfer",
  ],

  warehouse: [
    "storage",
    "warehouse",
    "inventory",
  ],

  international: [
    "overseas",
    "abroad",
    "international",
  ],

} as const