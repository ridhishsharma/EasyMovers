"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Stats
   File: hero-stats.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import CountUp from "react-countup"

import {
  Clock3,
  Headphones,
  MapPinned,
  Users,
} from "lucide-react"

/* ============================================================
   Stats
============================================================ */

const STATS = [

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
   Component
============================================================ */

export default function HeroStats() {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 15,
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
        mt-12

        grid

        gap-6

        rounded-3xl

        border

        border-slate-200

        bg-white/80

        p-8

        shadow-xl

        backdrop-blur-xl

        sm:grid-cols-2

        xl:grid-cols-4
      "
    >

      {STATS.map((stat, index) => {

        const Icon = stat.icon

        return (
          <motion.div

            key={stat.label}

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
              duration: 0.45,
            }}

            whileHover={{
              y: -6,
              scale: 1.02,
            }}

            className="
              group

              relative

              flex

              items-center

              gap-5

              rounded-2xl

              p-5

              transition-all
              duration-300

              hover:bg-slate-50
            "
          >

            {/* ===============================================
                Icon
            ================================================ */}

            <div
              className="
                flex

                h-14
                w-14

                items-center
                justify-center

                rounded-2xl

                bg-slate-100

                transition-all

                group-hover:bg-white

                group-hover:shadow-lg
              "
            >

              <Icon
                className={`
                  h-7
                  w-7

                  ${stat.color}
                `}
              />

            </div>

            {/* ===============================================
                Counter
            ================================================ */}

            <div className="flex-1">

              <div
                className="
                  text-3xl

                  font-black

                  tracking-tight

                  text-slate-900
                "
              >

                <CountUp

                  end={stat.value}

                  duration={2.5}

                  separator=","

                />

                <span
                  className="
                    ml-1

                    text-orange-500
                  "
                >
                  {stat.suffix}
                </span>

              </div>

              <div
                className="
                  mt-2

                  text-sm

                  font-medium

                  text-slate-500
                "
              >
                {stat.label}
              </div>

            </div>
            {/* ===============================================
                Desktop Divider
            ================================================ */}

            {index < STATS.length - 1 && (

              <div
                className="
                  absolute

                  right-0
                  top-1/2

                  hidden

                  h-14
                  w-px

                  -translate-y-1/2

                  bg-gradient-to-b

                  from-transparent
                  via-slate-300
                  to-transparent

                  xl:block
                "
              />

            )}

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

Realtime Statistics API

Bookings Today

Available Vendors

Drivers Online

Pending Quotes

------------------------------------------------------------

Phase 3

Corporate Dashboard

Employees Relocated

Departments Served

Corporate Accounts

Enterprise Revenue

------------------------------------------------------------

Phase 4

Live Analytics

Active Trucks

Current Shipments

Average ETA

Move Success Rate

------------------------------------------------------------

Phase 5

AI Performance Metrics

Average Price Saved

Best Route Accuracy

Vendor Match Accuracy

Customer Satisfaction Index

Generated dynamically by KGME.

------------------------------------------------------------

Phase 6

Animated Data Feed

WebSocket Updates

Supabase Realtime

Live Dashboard Synchronization

=========================================================== */