"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Section Header

   File: process-header.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {

  Sparkles,

  ArrowRight,

} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import type {

  ProcessHeaderProps,

} from "./process.types"

/* ============================================================
   Component
============================================================ */

export default function ProcessHeader({

  title,

  subtitle,

  badge,

}: ProcessHeaderProps) {

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
        duration: 0.6,
      }}

      className="
        mx-auto

        max-w-4xl

        text-center
      "

    >

      {/* ===============================================
          Enterprise Badge
      ================================================ */}

      {badge && (

        <Badge

          className="
            rounded-full

            border-0

            bg-orange-100

            px-5

            py-2

            text-orange-700
          "

        >

          <Sparkles className="mr-2 h-4 w-4" />

          {badge}

        </Badge>

      )}

      {/* ===============================================
          Heading
      ================================================ */}

      <h2

        className="
          mt-6

          text-4xl

          font-black

          tracking-tight

          text-slate-900

          sm:text-5xl
        "

      >

        {title}

      </h2>

      {/* ===============================================
          Subtitle
      ================================================ */}

      <p

        className="
          mx-auto

          mt-6

          max-w-3xl

          text-lg

          leading-8

          text-slate-600
        "

      >

        {subtitle}

      </p>

      {/* ===============================================
          CTA
      ================================================ */}

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
          delay: 0.25,
          duration: 0.45,
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

          Explore Workflow

          <ArrowRight className="ml-2 h-4 w-4" />

        </Button>

        <Button

          size="lg"

          variant="outline"

          className="
            rounded-xl

            border-orange-200

            text-orange-600

            hover:bg-orange-50
          "

        >

          Watch Demo

        </Button>

      </motion.div>

      {/* ===============================================
          Divider
      ================================================ */}

      <motion.div

        initial={{
          width: 0,
        }}

        whileInView={{
          width: 120,
        }}

        viewport={{
          once: true,
        }}

        transition={{
          delay: 0.45,
          duration: 0.5,
        }}

        className="
          mx-auto

          mt-12

          h-1

          rounded-full

          bg-gradient-to-r

          from-orange-500

          via-amber-500

          to-green-500
        "

      />

    </motion.div>

  )

}

/* ===========================================================
   Future Enhancements

   Phase 2
   ----------------------------------------------------------
   • Dynamic headline personalization
   • Animated counters
   • AI recommendation badge

   Phase 3
   ----------------------------------------------------------
   • Live workflow status banner
   • Interactive explainer video
   • Enterprise onboarding CTA

   Phase 4
   ----------------------------------------------------------
   • Customer-specific messaging
   • Corporate relocation highlights
   • Regional workflow customization

   Phase 5
   ----------------------------------------------------------
   • AI-powered personalized content
   • Multilingual workflow introduction
   • Predictive onboarding insights
=========================================================== */