"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Services Section

   File: services.tsx

   Version: 1.0
============================================================ */

import { useMemo, useState } from "react"

import { motion } from "framer-motion"

import ServiceHeader from "./service-header"

import ServiceSearch from "./service-search"

import ServiceGrid from "./service-grid"

import {

  SERVICES,

} from "./service.constants"

/* ============================================================
   Component
============================================================ */

export default function Services() {

  const [searchQuery, setSearchQuery] =

    useState("")

  const totalServices = useMemo(

    () => SERVICES.length,

    []

  )

  return (

    <section

      id="services"

      className="
        relative

        overflow-hidden

        bg-white

        py-24

        lg:py-32
      "

    >

      {/* ===============================================
          Background Decorations
      ================================================ */}

      <div

        className="
          pointer-events-none

          absolute

          inset-0

          -z-10
        "

      >

        <div

          className="
            absolute

            left-0

            top-0

            h-96

            w-96

            rounded-full

            bg-orange-100/30

            blur-3xl
          "

        />

        <div

          className="
            absolute

            bottom-0

            right-0

            h-[420px]

            w-[420px]

            rounded-full

            bg-sky-100/30

            blur-3xl
          "

        />

      </div>

      <div

        className="
          container

          mx-auto

          px-4

          sm:px-6

          lg:px-8
        "

      >

        {/* ===============================================
            Header
        ================================================ */}

        <ServiceHeader

          title="Enterprise Relocation Services"

          subtitle="AI-powered relocation solutions designed for individuals, businesses and global enterprises with real-time tracking, transparent pricing and intelligent recommendations."

        />

        {/* ===============================================
            Search
        ================================================ */}

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
            delay: 0.2,
            duration: 0.6,
          }}

          className="
            mx-auto

            mt-16

            max-w-4xl
          "

        >

          <ServiceSearch

            value={searchQuery}

            onChange={setSearchQuery}

          />

        </motion.div>

        {/* ===============================================
            Statistics Bar
        ================================================ */}

        <motion.div

          initial={{
            opacity: 0,
          }}

          whileInView={{
            opacity: 1,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            delay: 0.35,
          }}

          className="
            mt-10

            flex

            flex-wrap

            items-center

            justify-center

            gap-6

            text-sm

            text-slate-500
          "

        >

          <span>

            <strong className="text-slate-900">

              {totalServices}

            </strong>{" "}

            Enterprise Services

          </span>

          <span className="hidden h-1 w-1 rounded-full bg-slate-300 md:block" />

          <span>

            AI Powered Recommendations

          </span>

          <span className="hidden h-1 w-1 rounded-full bg-slate-300 md:block" />

          <span>

            Real-Time Pricing

          </span>

          <span className="hidden h-1 w-1 rounded-full bg-slate-300 md:block" />

          <span>

            Nationwide Coverage

          </span>

        </motion.div>

        {/* ===============================================
            Grid
        ================================================ */}

        <ServiceGrid

          searchQuery={searchQuery}

        />
      </div>

    </section>

  )

}

/* ===========================================================
   Future Enterprise Roadmap

   Phase 3
   ----------------------------------------------------------

   • Interactive Service Comparison

   • AI Service Recommendation Engine

   • Dynamic Pricing Calculator

   • Smart Move Planner

   ----------------------------------------------------------

   Phase 4

   • Vendor Marketplace

   • Live Vendor Capacity

   • Delivery Heat Maps

   • Cost Optimization

   ----------------------------------------------------------

   Phase 5

   • Enterprise Dashboard

   • Carbon Footprint Analytics

   • AI Cost Forecast

   • Predictive Delivery Success

   • Corporate Relocation Analytics

=========================================================== */