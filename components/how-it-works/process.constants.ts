/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Constants

   File: process.constants.ts

   Version: 1.0
============================================================ */

import {

  Box,

  ClipboardCheck,

  Package,

  ShieldCheck,

  Truck,

  MapPinned,

  Brain,

  Clock3,

  Star,

} from "lucide-react"

import type {

  HowItWorksData,

} from "./process.types"

/* ============================================================
   Enterprise Process Data
============================================================ */

export const HOW_IT_WORKS_DATA: HowItWorksData = {

  header: {

    badge: "Enterprise Workflow",

    title: "How Easy Movers Works",

    subtitle:
      "Our AI-powered relocation workflow ensures every move is planned, monitored, and delivered with complete transparency and enterprise-grade efficiency.",

  },

  timeline: {

    title: "6-Step Smart Relocation Journey",

    subtitle:
      "From booking to successful delivery, every stage is optimized using artificial intelligence and real-time logistics.",

    steps: [

      {
        id: "booking",

        order: 1,

        title: "Book Your Move",

        subtitle: "Quick Online Booking",

        description:
          "Schedule your relocation within minutes using our intelligent booking platform. Choose your preferred moving date, service type, and destination.",

        icon: ClipboardCheck,

        background: "bg-orange-100",

        gradient: "from-orange-400 to-amber-500",

        color: "text-orange-600",

        duration: "2 Minutes",

        aiPowered: false,

        features: [
          {

            id: "booking-online",

            title: "Instant Booking",

            description:
              "Book your relocation online without lengthy paperwork.",

            icon: ClipboardCheck,

          },

          {

            id: "booking-date",

            title: "Flexible Scheduling",

            description:
              "Choose the most convenient moving date and preferred time slot.",

            icon: Clock3,

          },

          {

            id: "booking-confirmation",

            title: "Immediate Confirmation",

            description:
              "Receive instant booking confirmation with reference tracking ID.",

            icon: ShieldCheck,

          },

        ],

      },

      {

        id: "survey",

        order: 2,

        title: "AI Home Survey",

        subtitle: "Smart Inventory Assessment",

        description:
          "Our AI-powered survey estimates inventory, packaging requirements, manpower, and transportation needs to generate accurate quotations.",

        icon: Brain,

        background: "bg-sky-100",

        gradient: "from-sky-400 to-cyan-500",

        color: "text-sky-600",

        duration: "10–15 Minutes",

        aiPowered: true,

        features: [

          {

            id: "survey-ai",

            title: "AI Object Detection",

            description:
              "Automatically detects furniture, appliances, fragile items, and cartons.",

            icon: Brain,

          },

          {

            id: "survey-estimation",

            title: "Accurate Cost Estimation",

            description:
              "Generates transparent pricing based on inventory analysis.",

            icon: Star,

          },

          {

            id: "survey-report",

            title: "Digital Survey Report",

            description:
              "Detailed relocation report available instantly for customer review.",

            icon: ClipboardCheck,

          },

        ],

      },

      {
        id: "vendor",

        order: 3,

        title: "AI Vendor Matching",

        subtitle: "Best Vendor Selection",

        description:
          "Our intelligent matching engine evaluates verified movers based on location, availability, pricing, ratings, and previous performance.",

        icon: ShieldCheck,

        background: "bg-green-100",

        gradient: "from-green-500 to-emerald-500",

        color: "text-green-600",

        duration: "Instant",

        aiPowered: true,

        features: [

          {

            id: "vendor-ai",

            title: "AI Vendor Recommendation",

            description:
              "Automatically recommends the most suitable relocation partner.",

            icon: Brain,

          },

          {

            id: "vendor-rating",

            title: "Verified Ratings",

            description:
              "Selection based on customer reviews and quality metrics.",

            icon: Star,

          },

          {

            id: "vendor-availability",

            title: "Live Availability",

            description:
              "Assigns vendors currently available for your preferred schedule.",

            icon: Clock3,

          },

        ],

      },

      {

        id: "packing",

        order: 4,

        title: "Professional Packing",

        subtitle: "Secure Packaging",

        description:
          "Certified packing professionals use premium-quality materials to ensure maximum protection of every item during transportation.",

        icon: Package,

        background: "bg-violet-100",

        gradient: "from-violet-500 to-purple-500",

        color: "text-violet-600",

        duration: "Few Hours",

        aiPowered: false,

        features: [

          {

            id: "packing-material",

            title: "Premium Packing Materials",

            description:
              "Bubble wrap, cartons, stretch film, edge protectors and wooden crating.",

            icon: Box,

          },

          {

            id: "packing-label",

            title: "Smart Labeling",

            description:
              "Every package is digitally labeled for faster unloading.",

            icon: ClipboardCheck,

          },

        ],

      },

      {
        id: "tracking",

        order: 5,

        title: "Live GPS Tracking",

        subtitle: "Real-Time Visibility",

        description:
          "Monitor your shipment throughout the journey with live GPS tracking, milestone updates and proactive notifications.",

        icon: MapPinned,

        background: "bg-cyan-100",

        gradient: "from-cyan-500 to-blue-500",

        color: "text-cyan-600",

        duration: "Real Time",

        aiPowered: true,

        features: [

          {

            id: "tracking-gps",

            title: "Live Vehicle Tracking",

            description:
              "Track the moving vehicle location on an interactive map.",

            icon: MapPinned,

          },

          {

            id: "tracking-alerts",

            title: "Instant Notifications",

            description:
              "Receive updates for departure, transit and arrival milestones.",

            icon: ShieldCheck,

          },

          {

            id: "tracking-support",

            title: "Dedicated Support",

            description:
              "Customer support remains available throughout the relocation journey.",

            icon: ClipboardCheck,

          },

        ],

      },

      {

        id: "delivery",

        order: 6,

        title: "Safe Delivery",

        subtitle: "Verified Completion",

        description:
          "Goods are delivered safely, unloaded professionally and verified digitally before the relocation is marked complete.",

        icon: Truck,

        background: "bg-amber-100",

        gradient: "from-amber-500 to-orange-500",

        color: "text-amber-600",

        duration: "Final Step",

        aiPowered: false,

        features: [

          {

            id: "delivery-unloading",

            title: "Professional Unloading",

            description:
              "Experienced crew unloads and places items carefully at destination.",

            icon: Box,

          },

          {

            id: "delivery-verification",

            title: "Digital Delivery Confirmation",

            description:
              "OTP-based confirmation with digital proof of successful delivery.",

            icon: ShieldCheck,

          },

          {

            id: "delivery-feedback",

            title: "Customer Feedback",

            description:
              "Collect service feedback to continuously improve relocation quality.",

            icon: Star,

          },

        ],

      },

    ],

  },
  statistics: [

    {

      id: "moves",

      label: "Successful Moves",

      value: "85,000+",

      description: "Completed nationwide",

    },

    {

      id: "cities",

      label: "Cities Covered",

      value: "500+",

      description: "Across India",

    },

    {

      id: "delivery",

      label: "On-Time Delivery",

      value: "99.2%",

      description: "Average success rate",

    },

  ],

  metrics: [

    {

      id: "ai",

      label: "AI Accuracy",

      value: "98%",

      icon: Brain,

    },

    {

      id: "tracking",

      label: "GPS Tracking",

      value: "100%",

      icon: MapPinned,

    },

    {

      id: "packing",

      label: "Damage Free",

      value: "99.7%",

      icon: Package,

    },

    {

      id: "delivery",

      label: "Customer Rating",

      value: "4.9",

      icon: Star,

    },

  ],

  aiInsight: {

    title: "AI Optimized Relocation",

    description:
      "Our recommendation engine continuously analyzes vendor performance, traffic, route conditions and relocation history to provide the safest and fastest moving experience.",

    confidenceScore: 98,

    recommendation:
      "Schedule your move at least 5 days in advance for maximum vendor availability and optimized pricing.",

  },

}