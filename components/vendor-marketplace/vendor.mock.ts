/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Mock Vendor Data

   File: vendor.mock.ts

   Version: 1.0

   NOTE

   This file simulates database/API responses.

   Replace this file with Vendor API integration
   when backend becomes available.

============================================================ */

import {

  Building2,

  Globe,

  Package,

  Truck,

  Warehouse,

} from "lucide-react"

import type {

  Vendor,

} from "./vendor.types"

/* ============================================================
   Mock Vendors
============================================================ */

export const MOCK_VENDORS: Vendor[] = [

  {

    id: "vendor-001",

    name: "Easy Logistics",

    companyName: "Easy Logistics Pvt. Ltd.",

    logo: "/vendors/easy-logistics.png",

    coverImage: "/vendors/easy-logistics-cover.jpg",

    description:

      "Enterprise relocation partner specializing in household, office and industrial relocations across India.",

    verified: true,

    featured: true,

    premium: true,

    establishedYear: 2014,

    headquarters: "Bhopal, Madhya Pradesh",

    contactNumber: "+91-8959591603",

    email: "support@easylogistics.in",

    website: "https://easylogistics.in",

    responseTime: "< 15 Minutes",

    badges: [

      {

        id: "verified",

        label: "Verified",

        color: "green",

      },

      {

        id: "premium",

        label: "Premium",

        color: "orange",

      },

    ],

    services: [

      {

        id: "household",

        name: "Household",

        description:

          "Professional packing and transportation for homes.",

        icon: Package,

      },

      {

        id: "office",

        name: "Office Relocation",

        description:

          "Business relocation with minimum downtime.",

        icon: Building2,

      },

      {

        id: "vehicle",

        name: "Vehicle Transport",

        description:

          "Safe transportation for cars and two-wheelers.",

        icon: Truck,

      },

    ],

    coverage: [

      {

        id: "bhopal",

        city: "Bhopal",

        state: "Madhya Pradesh",

        country: "India",

      },

      {

        id: "indore",

        city: "Indore",

        state: "Madhya Pradesh",

        country: "India",

      },

      {

        id: "jabalpur",

        city: "Jabalpur",

        state: "Madhya Pradesh",

        country: "India",

      },

    ],

    fleet: [

      {

        id: "fleet14",

        vehicleType: "14 Ft Truck",

        quantity: 18,

        capacity: "4 Ton",

      },

      {

        id: "fleet19",

        vehicleType: "19 Ft Container",

        quantity: 12,

        capacity: "8 Ton",

      },

      {

        id: "fleet32",

        vehicleType: "32 Ft Trailer",

        quantity: 5,

        capacity: "24 Ton",

      },

    ],

    rating: {

      rating: 4.9,

      reviewCount: 3248,

      aiScore: 98,

      completedMoves: 18540,

    },

    availability: {

      availableToday: true,

      nextAvailableDate: "Today",

      operatingHours: "24 × 7",

    },

    pricing: {

      startingPrice: 3499,

      currency: "INR",

      unit: "Starting",

      instantQuotation: true,

    },

    insurance: {

      available: true,

      provider: "ICICI Lombard",

      coverageAmount: "₹10,00,000",

    },

    certificates: [

      {

        id: "iso9001",

        title: "ISO 9001:2015",

        issuedBy: "ISO",

        validTill: "2028",

      },

      {

        id: "iba",

        title: "IBA Approved",

        issuedBy: "Indian Banks Association",

        validTill: "2027",

      },

    ],

  },

  {

    id: "vendor-002",

    name: "Swift Relocations",

    companyName: "Swift Relocations India",

    logo: "/vendors/swift-relocations.png",

    coverImage: "/vendors/swift-relocations-cover.jpg",

    description:

      "Fast intercity relocation company with strong corporate relocation expertise.",

    verified: true,

    featured: false,

    premium: true,

    establishedYear: 2011,

    headquarters: "Pune, Maharashtra",

    responseTime: "< 30 Minutes",

    badges: [

      {

        id: "verified",

        label: "Verified",

        color: "green",

      },

      {

        id: "premium",

        label: "Premium",

        color: "orange",

      },

    ],

    services: [

      {

        id: "corporate",

        name: "Corporate Relocation",

        description:

          "Enterprise office relocation with minimum downtime.",

        icon: Building2,

      },

      {

        id: "household",

        name: "Household Relocation",

        description:

          "Safe and secure residential moving services.",

        icon: Package,

      },

      {

        id: "international",

        name: "International Packing",

        description:

          "Export-quality packing for overseas relocation.",

        icon: Globe,

      },

    ],

    coverage: [

      {

        id: "pune",

        city: "Pune",

        state: "Maharashtra",

        country: "India",

      },

      {

        id: "mumbai",

        city: "Mumbai",

        state: "Maharashtra",

        country: "India",

      },

      {

        id: "nagpur",

        city: "Nagpur",

        state: "Maharashtra",

        country: "India",

      },

    ],

    fleet: [

      {

        id: "swift16",

        vehicleType: "16 Ft Truck",

        quantity: 22,

        capacity: "5 Ton",

      },

      {

        id: "swift22",

        vehicleType: "22 Ft Container",

        quantity: 14,

        capacity: "10 Ton",

      },

    ],

    rating: {

      rating: 4.8,

      reviewCount: 2684,

      aiScore: 95,

      completedMoves: 15260,

    },

    availability: {

      availableToday: false,

      nextAvailableDate: "Tomorrow",

      operatingHours: "08:00 AM - 10:00 PM",

    },

    pricing: {

      startingPrice: 3999,

      currency: "INR",

      unit: "Starting",

      instantQuotation: true,

    },

    insurance: {

      available: true,

      provider: "HDFC ERGO",

      coverageAmount: "₹15,00,000",

    },

    certificates: [

      {

        id: "iso14001",

        title: "ISO 14001",

        issuedBy: "ISO",

        validTill: "2028",

      },

      {

        id: "quality",

        title: "Quality Certified Operations",

        issuedBy: "National Logistics Council",

        validTill: "2027",

      },

    ],

  },

]