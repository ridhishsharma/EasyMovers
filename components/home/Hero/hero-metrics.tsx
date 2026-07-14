"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Metrics
   File: hero-metrics.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import CountUp from "react-countup"

import {
  Building2,
  Globe2,
  ShieldCheck,
  Truck,
} from "lucide-react"

/* ============================================================
   Metrics
============================================================ */

const METRICS = [

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
   Component
============================================================ */

export default function HeroMetrics() {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 30,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{
        once: true,
      }}

      transition={{
        delay: 1,
        duration: 0.8,
      }}

      className="
        mt-14

        grid

        gap-5

        sm:grid-cols-2

        xl:grid-cols-4
      "
    >

      {METRICS.map((metric, index) => {

        const Icon = metric.icon

        return (

          <motion.div

            key={metric.label}

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
              y: -8,
              scale: 1.02,
            }}

            className="
              group

              relative

              overflow-hidden

              rounded-3xl

              border
              border-slate-200

              bg-white/80

              p-6

              shadow-lg

              backdrop-blur-xl

              transition-all
              duration-300

              hover:border-orange-200
              hover:shadow-2xl
            "
          >

            {/* ===============================================
                Background Accent
            ================================================ */}

            <div
              className={`
                absolute
                right-[-40px]
                top-[-40px]

                h-32
                w-32

                rounded-full

                ${metric.background}

                opacity-40

                blur-3xl
              `}
            />

            {/* ===============================================
                Icon
            ================================================ */}

            <div
              className={`
                relative

                mb-6

                flex
                h-14
                w-14

                items-center
                justify-center

                rounded-2xl

                ${metric.background}
              `}
            >

              <Icon
                className={`
                  h-7
                  w-7

                  ${metric.color}
                `}
              />

            </div>

            {/* ===============================================
                Counter
            ================================================ */}

            <div
              className="
                relative

                text-4xl

                font-black

                tracking-tight

                text-slate-900
              "
            >

              <CountUp

                end={metric.value}

                duration={2.5}

                separator=","

              />

              <span
                className="
                  ml-1

                  text-orange-500
                "
              >
                {metric.suffix}
              </span>

            </div>

            {/* ===============================================
                Label
            ================================================ */}

            <div
              className="
                mt-3

                text-sm

                font-medium

                uppercase

                tracking-wide

                text-slate-500
              "
            >
              {metric.label}
            </div>

            {/* ===============================================
                Decorative Hover Line
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
--------------------------------------------

Replace static metrics with

Realtime Analytics API

--------------------------------------------

Phase 3

Metrics from Dashboard

Cities

Verified Vendors

Bookings

Revenue

Enterprise Clients

--------------------------------------------

Phase 4

Animated KPI Dashboard

Today's Bookings

Live Trucks

Active Drivers

Pending Quotes

Completed Moves

--------------------------------------------

Phase 5

Realtime Updates

WebSockets

Socket.io

Supabase Realtime

--------------------------------------------

Phase 6

Geographical Metrics

Interactive India Map

Coverage Heatmap

Vendor Density

--------------------------------------------

Phase 7

Corporate Analytics

Employees Relocated

Departments Served

Projects Completed

--------------------------------------------

Phase 8

AI Insights

Average Move Cost

Peak Relocation Season

Fastest Route

Vendor Performance

Generated directly from KGME.

=========================================================== */