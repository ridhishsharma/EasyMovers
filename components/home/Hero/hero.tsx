"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Hero Section

   File: hero.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import HeroBackground from "./hero-background"

import HeroHeading from "./hero-heading"

import HeroButtons from "./hero-buttons"

import HeroSearch from "./hero-search/hero-search"

import HeroIllustration from "./hero-illustration"

import HeroMetrics from "./hero-metrics"

import HeroTrust from "./hero-trust"

import HeroBadges from "./hero-badges"

import HeroStats from "./hero-stats"

/* ============================================================
   Component
============================================================ */

export default function Hero() {

  return (

    <section

      className="
        relative

        overflow-hidden

        bg-gradient-to-b

        from-orange-50/60

        via-white

        to-slate-50
      "

    >

      {/* =====================================================
          Background
      ====================================================== */}

      <HeroBackground />

      {/* =====================================================
          Main Container
      ====================================================== */}

      <div
        className="
          relative

          mx-auto

          max-w-[1600px]

          px-6

          pt-24

          lg:px-10

          xl:px-16

          2xl:px-20
        "
      >

        {/* ===================================================
            Hero Grid
        ==================================================== */}

        <div
          className="
            grid

            items-center

            gap-16

            xl:grid-cols-2
          "
        >

          {/* ===============================================
              Left Side
          ================================================ */}

          <motion.div

            initial={{
              opacity: 0,
              x: -40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              duration: 0.8,
            }}

          >
            {/* ===============================================
                Heading
            ================================================ */}

            <HeroHeading />

            {/* ===============================================
                Primary CTA Buttons
            ================================================ */}

            <div className="mt-10">

              <HeroButtons />

            </div>

            {/* ===============================================
                Smart AI Search
            ================================================ */}

            <div className="mt-12">

              <HeroSearch />

            </div>

            {/* ===============================================
                Feature Badges
            ================================================ */}

            <div className="mt-10">

              <HeroBadges />

            </div>

            {/* ===============================================
                Trust Indicators
            ================================================ */}

            <div className="mt-10">

              <HeroTrust />

            </div>

          </motion.div>

          {/* ===============================================
              Right Side
          ================================================ */}

          <motion.div

            initial={{
              opacity: 0,
              x: 40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              delay: 0.2,
              duration: 0.9,
            }}

            className="
              relative

              flex

              justify-center

              xl:justify-end
            "
          >

            <HeroIllustration />

          </motion.div>

        </div>

        {/* ===================================================
            Hero Metrics
        ==================================================== */}

        <div className="mt-20">

          <HeroMetrics />

        </div>

        {/* ===================================================
            Enterprise Statistics
        ==================================================== */}

        <div className="mt-16">

          <HeroStats />

        </div>
        {/* ===================================================
            Decorative Divider
        ==================================================== */}

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
            mt-20

            h-px
            w-full

            origin-center

            bg-gradient-to-r

            from-transparent

            via-orange-300

            to-transparent
          "
        />

      </div>

      {/* =====================================================
          Bottom Glow
      ====================================================== */}

      <div
        className="
          pointer-events-none

          absolute

          bottom-[-180px]
          left-1/2

          h-[420px]
          w-[900px]

          -translate-x-1/2

          rounded-full

          bg-gradient-to-r

          from-orange-200/30

          via-amber-100/20

          to-blue-200/30

          blur-[140px]
        "
      />

      {/* =====================================================
          Floating Background Shapes
      ====================================================== */}

      <motion.div

        animate={{
          y: [0, -20, 0],
          rotate: [0, 8, 0],
        }}

        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          top-32
          right-20

          hidden

          h-24
          w-24

          rounded-full

          bg-orange-200/20

          blur-2xl

          xl:block
        "
      />

      <motion.div

        animate={{
          y: [0, 18, 0],
          rotate: [0, -8, 0],
        }}

        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          bottom-24
          left-16

          hidden

          h-28
          w-28

          rounded-full

          bg-blue-200/20

          blur-3xl

          xl:block
        "
      />

    </section>

  )

}

/* ===========================================================
   Future Hero Roadmap
===========================================================

Phase 2
------------------------------------------------------------

Replace illustration cards with

Lottie animations

------------------------------------------------------------

Phase 3

Three.js interactive truck

3D logistics visualization

------------------------------------------------------------

Phase 4

Realtime relocation dashboard

API-driven metrics

Live tracking

------------------------------------------------------------

Phase 5

Personalized Hero

Customer

Vendor

Corporate

Admin

Different Hero Experiences

------------------------------------------------------------

This Hero component is intentionally
kept orchestration-only.

Business logic belongs inside each
individual Hero component.

=========================================================== */