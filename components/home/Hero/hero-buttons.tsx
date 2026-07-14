"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Buttons
   File: hero-buttons.tsx
   Version: 1.0
============================================================ */

import Link from "next/link"

import { motion } from "framer-motion"

import {
  ArrowRight,
  Building2,
  PlayCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HeroButtons() {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 30,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        delay: 0.75,
        duration: 0.8,
      }}

      className="
        mt-10

        flex
        flex-wrap

        items-center

        gap-4
      "
    >

      {/* =======================================================
          Primary CTA
      ======================================================== */}

      <Button

        asChild

        size="lg"

        className="
          h-14

          rounded-2xl

          bg-orange-500

          px-8

          text-base
          font-semibold

          shadow-lg
          shadow-orange-500/30

          transition-all
          duration-300

          hover:-translate-y-1
          hover:bg-orange-600
          hover:shadow-xl
          hover:shadow-orange-500/40
        "
      >

        <Link href="/quote">

          Get Instant Quote

          <ArrowRight
            className="
              ml-2

              h-5
              w-5
            "
          />

        </Link>

      </Button>

      {/* =======================================================
          Enterprise CTA
      ======================================================== */}

      <Button

        asChild

        variant="outline"

        size="lg"

        className="
          h-14

          rounded-2xl

          border-slate-300

          bg-white/80

          px-8

          text-base
          font-semibold

          backdrop-blur

          transition-all
          duration-300

          hover:-translate-y-1
          hover:border-orange-300
          hover:bg-orange-50
          hover:text-orange-600
        "
      >

        <Link href="/enterprise">

          <Building2
            className="
              mr-2

              h-5
              w-5
            "
          />

          Enterprise Solutions

        </Link>

      </Button>

      {/* =======================================================
          Watch Demo
      ======================================================== */}

      <Button

        asChild

        variant="ghost"

        size="lg"

        className="
          h-14

          rounded-2xl

          px-6

          text-base
          font-semibold

          text-slate-700

          transition-all
          duration-300

          hover:bg-slate-100
          hover:text-orange-600
        "
      >

        <Link href="/demo">

          <PlayCircle
            className="
              mr-2

              h-6
              w-6

              text-orange-500
            "
          />

          Watch Demo

        </Link>

      </Button>

    </motion.div>

  )

}

/* ===========================================================
   Future Enhancements
===========================================================

1. Personalize CTAs based on user role

Guest
→ Get Instant Quote

Customer
→ My Bookings

Vendor
→ Vendor Dashboard

Corporate
→ Corporate Portal

Admin
→ Admin Dashboard

------------------------------------------------------------

2. Add CTA Analytics

Track

CTR

Conversion Rate

Heatmaps

------------------------------------------------------------

3. Dynamic CTAs

Powered by AI

Example

Returning Customer

→ Continue Previous Quote

Enterprise User

→ Manage Employee Transfers

Vendor

→ View Available Jobs

------------------------------------------------------------

4. Experiment Framework

A/B Testing

Button Colors

Text

Placement

=========================================================== */