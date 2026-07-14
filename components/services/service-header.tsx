"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Services Header

   File: service-header.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {

  Sparkles,

  ArrowRight,

} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import type { ServiceHeaderProps } from "./service.types"

/* ============================================================
   Component
============================================================ */

export default function ServiceHeader({

  title,

  subtitle,

}: ServiceHeaderProps) {

  return (

    <section className="relative">

      {/* ===============================================
          Top Badge
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
          duration: 0.6,
        }}

        className="flex justify-center"

      >

        <Badge

          className="
            rounded-full

            border-0

            bg-orange-100

            px-5

            py-2

            text-orange-600

            shadow-sm
          "

        >

          <Sparkles className="mr-2 h-4 w-4" />

          AI Powered Moving Solutions

        </Badge>

      </motion.div>

      {/* ===============================================
          Heading
      ================================================ */}

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
          delay: 0.15,
          duration: 0.7,
        }}

        className="
          mx-auto

          mt-8

          max-w-4xl

          text-center
        "

      >

        <h2

          className="
            text-4xl

            font-black

            tracking-tight

            text-slate-900

            md:text-5xl

            xl:text-6xl
          "

        >

          {title}

        </h2>

        {/* ===========================================
            Subtitle
        ============================================ */}

        <p

          className="
            mx-auto

            mt-6

            max-w-3xl

            text-lg

            leading-8

            text-slate-600

            md:text-xl
          "

        >

          {subtitle}

        </p>

        {/* ===========================================
            CTA Buttons
        ============================================ */}

        <div

          className="
            mt-10

            flex

            flex-col

            items-center

            justify-center

            gap-4

            sm:flex-row
          "

        >

          <Button

            size="lg"

            className="
              rounded-xl

              bg-orange-500

              px-8

              text-white

              hover:bg-orange-600
            "

          >

            Explore Services

            <ArrowRight className="ml-2 h-4 w-4" />

          </Button>

          <Button

            size="lg"

            variant="outline"

            className="
              rounded-xl

              border-orange-200

              px-8

              text-orange-600

              hover:bg-orange-50
            "

          >

            Talk to Expert

          </Button>

        </div>

      </motion.div>

      {/* ===============================================
          Decorative Background
      ================================================ */}

      <div

        className="
          pointer-events-none

          absolute

          inset-x-0

          top-0

          -z-10

          mx-auto

          h-64

          w-[600px]

          rounded-full

          bg-gradient-to-r

          from-orange-200/20

          via-amber-100/20

          to-blue-200/20

          blur-3xl
        "

      />

      {/* ===============================================
          Bottom Divider
      ================================================ */}

      <motion.div

        initial={{
          opacity: 0,
          scaleX: 0,
        }}

        whileInView={{
          opacity: 1,
          scaleX: 1,
        }}

        viewport={{
          once: true,
        }}

        transition={{
          delay: 0.4,
          duration: 0.8,
        }}

        className="
          mx-auto

          mt-16

          h-px

          max-w-6xl

          origin-center

          bg-gradient-to-r

          from-transparent

          via-orange-300

          to-transparent
        "

      />

    </section>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

Phase 2
------------------------------------------------------------

Dynamic AI Greeting

Examples

Good Morning

Planning a move today?

Good Evening

Need an instant quote?

Personalized by

Location

Returning Customer

Corporate User

------------------------------------------------------------

Phase 3

Dynamic Counters

Connected to

Supabase

Vendor Count

Cities Covered

Moves Completed

Reviews

------------------------------------------------------------

Phase 4

AI Recommendation Banner

Examples

Recommended for Ahmedabad

Recommended for Corporate Users

Recommended for Long Distance

Recommended for 3 BHK Family

------------------------------------------------------------

Phase 5

Live Enterprise Status

API Healthy

AI Online

Tracking Active

Payment Gateway Online

Vendor Marketplace Live

=========================================================== */