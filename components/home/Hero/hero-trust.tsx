"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Trust
   File: hero-trust.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {
  BadgeCheck,
  Building2,
  ShieldCheck,
  Star,
} from "lucide-react"

/* ============================================================
   Trust Items
============================================================ */

const TRUST_ITEMS = [

  {
    icon: Star,

    title: "4.9/5",

    subtitle: "Google Rating",

    color: "text-amber-500",

    background: "bg-amber-50",
  },

  {
    icon: BadgeCheck,

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
   Component
============================================================ */

export default function HeroTrust() {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 20,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{
        once: true,
      }}

      transition={{
        duration: 0.7,
      }}

      className="
        mt-12

        grid

        gap-4

        sm:grid-cols-2

        lg:grid-cols-4
      "
    >

      {TRUST_ITEMS.map((item, index) => {

        const Icon = item.icon

        return (
          <motion.div

            key={item.subtitle}

            initial={{
              opacity: 0,
              y: 20,
            }}

            whileInView={{
              opacity: 1,
              y: 0,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              delay: index * 0.12,
              duration: 0.5,
            }}

            whileHover={{
              y: -6,
              scale: 1.02,
            }}

            className="
              group

              relative

              overflow-hidden

              rounded-2xl

              border
              border-slate-200

              bg-white/85

              p-5

              shadow-lg

              backdrop-blur-xl

              transition-all
              duration-300

              hover:border-orange-200
              hover:shadow-xl
            "
          >

            {/* ===============================================
                Background Glow
            ================================================ */}

            <div
              className={`
                absolute

                right-[-28px]
                top-[-28px]

                h-24
                w-24

                rounded-full

                ${item.background}

                opacity-50

                blur-2xl
              `}
            />

            {/* ===============================================
                Icon
            ================================================ */}

            <div
              className={`
                relative

                flex

                h-12
                w-12

                items-center
                justify-center

                rounded-xl

                ${item.background}
              `}
            >

              <Icon
                className={`
                  h-6
                  w-6

                  ${item.color}
                `}
              />

            </div>

            {/* ===============================================
                Trust Value
            ================================================ */}

            <h4
              className="
                relative

                mt-5

                text-2xl

                font-bold

                text-slate-900
              "
            >
              {item.title}
            </h4>

            <p
              className="
                mt-2

                text-sm

                font-medium

                text-slate-500
              "
            >
              {item.subtitle}
            </p>
            {/* ===============================================
                Decorative Bottom Accent
            ================================================ */}

            <motion.div

              initial={{
                width: 0,
              }}

              whileHover={{
                width: "100%",
              }}

              transition={{
                duration: 0.35,
              }}

              className="
                absolute

                bottom-0
                left-0

                h-1

                rounded-r-full

                bg-gradient-to-r

                from-orange-500
                via-amber-400
                to-blue-500
              "
            />

          </motion.div>

        )

      })}

    </motion.div>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

Phase 2
------------------------------------------------------------

Live Google Rating API

Google Business Profile Integration

Automatically update

★★★★★ 4.9

Review Count

------------------------------------------------------------

Phase 3

Trustpilot Integration

Mouthshut

JustDial

Sulekha

Facebook Reviews

------------------------------------------------------------

Phase 4

Government Certifications

GST Verified

ISO 9001

ISO 27001

IBA Approved

MSME Registered

------------------------------------------------------------

Phase 5

Enterprise Compliance

Corporate Vendor Verification

KYC Status

Insurance Verification

PAN Validation

GST Validation

Background Verification

------------------------------------------------------------

Phase 6

Realtime Trust Dashboard

Verified Vendors

Available Movers

Active Trucks

Completed Deliveries

Customer Satisfaction

------------------------------------------------------------

Phase 7

AI Trust Engine

Each vendor receives

Trust Score

Performance Score

Delay Prediction

Damage Risk

Cancellation Risk

Recommendation Index

Generated dynamically by KGME.

------------------------------------------------------------

Phase 8

Interactive Trust Cards

Hover →

Show

Insurance Details

Customer Reviews

Service Cities

Experience

Live Rating

Completed Jobs

=========================================================== */