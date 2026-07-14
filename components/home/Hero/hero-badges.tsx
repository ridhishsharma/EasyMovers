"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Badges
   File: hero-badges.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {
  Bot,
  CreditCard,
  MapPinned,
  Shield,
  Truck,
  Workflow,
} from "lucide-react"

/* ============================================================
   Feature Badges
============================================================ */

const BADGES = [

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
   Component
============================================================ */

export default function HeroBadges() {

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
        duration: 0.6,
      }}

      className="
        mt-10

        flex

        flex-wrap

        items-center

        justify-center

        gap-4
      "
    >

      {BADGES.map((badge, index) => {

        const Icon = badge.icon

        return (
          <motion.div

            key={badge.label}

            initial={{
              opacity: 0,
              scale: 0.9,
            }}

            whileInView={{
              opacity: 1,
              scale: 1,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              delay: index * 0.08,
              duration: 0.35,
            }}

            whileHover={{
              y: -4,
              scale: 1.04,
            }}

            className="
              group

              relative

              overflow-hidden

              rounded-full

              border
              border-slate-200

              bg-white/80

              px-5
              py-3

              shadow-sm

              backdrop-blur-xl

              transition-all
              duration-300

              hover:border-orange-300
              hover:shadow-lg
            "
          >

            {/* ===============================================
                Background Glow
            ================================================ */}

            <div
              className={`
                absolute

                inset-0

                opacity-0

                transition-opacity
                duration-300

                group-hover:opacity-100

                ${badge.background}
              `}
            />

            {/* ===============================================
                Badge Content
            ================================================ */}

            <div
              className="
                relative

                flex

                items-center

                gap-3
              "
            >

              <div
                className={`
                  flex

                  h-10
                  w-10

                  items-center
                  justify-center

                  rounded-full

                  ${badge.background}
                `}
              >

                <Icon
                  className={`
                    h-5
                    w-5

                    ${badge.color}
                  `}
                />

              </div>

              <span
                className="
                  whitespace-nowrap

                  text-sm

                  font-semibold

                  text-slate-700
                "
              >
                {badge.label}
              </span>

            </div>
            {/* ===============================================
                Bottom Accent
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

Dynamic Feature Flags

Show badges based on

User Role

Customer

Vendor

Corporate

Admin

------------------------------------------------------------

Phase 3

Realtime Status

AI Available

Live Tracking Active

Vendor Network Online

Corporate API Connected

------------------------------------------------------------

Phase 4

Interactive Hover

Click badge →

Open detailed feature popup

------------------------------------------------------------

Phase 5

Animated Icons

Replace Lucide icons

with Lottie animations

------------------------------------------------------------

Phase 6

AI Personalization

Display different badges

based on

Customer history

Corporate account

Vendor location

KGME recommendation

------------------------------------------------------------

Phase 7

Feature Health

Every badge becomes

a realtime system indicator

API Healthy

Tracking Online

AI Engine Active

Payments Secure

=========================================================== */