"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Heading
   File: hero-heading.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {
  ArrowRight,
  Sparkles,
} from "lucide-react"

export default function HeroHeading() {

  return (

    <div
      className="
        max-w-3xl
      "
    >

      {/* =======================================================
          Enterprise Badge
      ======================================================== */}

      <motion.div

        initial={{
          opacity: 0,
          y: 20,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.6,
        }}

        className="
          mb-8

          inline-flex
          items-center
          gap-2

          rounded-full

          border
          border-orange-200

          bg-orange-50

          px-5
          py-2

          text-sm
          font-semibold

          text-orange-600
        "
      >

        <Sparkles className="h-4 w-4" />

        India's First Enterprise Relocation Platform

      </motion.div>

      {/* =======================================================
          Main Heading
      ======================================================== */}

      <motion.h1

        initial={{
          opacity: 0,
          y: 30,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          delay: 0.15,
          duration: 0.8,
        }}

        className="
          text-5xl
          font-black
          leading-tight
          tracking-tight

          text-slate-900

          sm:text-6xl

          xl:text-7xl
        "
      >

        India's Intelligent

        <br />

        <span
          className="
            bg-gradient-to-r

            from-orange-500
            via-orange-600
            to-amber-500

            bg-clip-text

            text-transparent
          "
        >

          Relocation Platform

        </span>

      </motion.h1>

      {/* =======================================================
          Sub Heading
      ======================================================== */}

      <motion.h2

        initial={{
          opacity: 0,
          y: 30,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          delay: 0.30,
          duration: 0.8,
        }}

        className="
          mt-8

          text-2xl
          font-semibold

          leading-relaxed

          text-slate-700

          lg:text-3xl
        "
      >

        Moving Made Predictable.

        <span className="text-orange-500">

          {" "}Transparent.

        </span>

        <span className="text-blue-600">

          {" "}AI Powered.

        </span>

      </motion.h2>

      {/* =======================================================
          Description
      ======================================================== */}

      <motion.p

        initial={{
          opacity: 0,
          y: 30,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          delay: 0.45,
          duration: 0.8,
        }}

        className="
          mt-8

          max-w-2xl

          text-lg

          leading-8

          text-slate-600

          lg:text-xl
        "
      >

        Compare verified movers, receive instant AI quotations,

        track relocations in real time, manage enterprise employee

        transfers, and monitor every movement from a single,

        intelligent relocation platform.

      </motion.p>

      {/* =======================================================
          Small Trust Statement
      ======================================================== */}

      <motion.div

        initial={{
          opacity: 0,
          y: 20,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          delay: 0.6,
          duration: 0.6,
        }}

        className="
          mt-8

          flex
          flex-wrap
          items-center

          gap-4

          text-sm

          text-slate-500
        "
      >

        <span>

          Trusted by

        </span>

        <span
          className="
            font-semibold

            text-slate-700
          "
        >

          10,000+

        </span>

        Businesses

        <ArrowRight
          className="
            h-4
            w-4

            text-orange-500
          "
        />

        <span>

          Across India

        </span>

      </motion.div>

    </div>

  )

}