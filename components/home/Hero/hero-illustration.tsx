"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Illustration
   File: hero-illustration.tsx
   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {
  Building2,
  CheckCircle2,
  Home,
  ShieldCheck,
  Truck,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

export default function HeroIllustration() {

  return (

    <div
      className="
        relative

        mx-auto

        hidden

        h-[640px]
        w-full
        max-w-[620px]

        xl:block
      "
    >

      {/* =======================================================
          Main Glass Card
      ======================================================== */}

      <motion.div

        initial={{
          opacity: 0,
          scale: 0.92,
        }}

        animate={{
          opacity: 1,
          scale: 1,
        }}

        transition={{
          delay: 0.4,
          duration: 0.8,
        }}

        className="
          absolute

          left-1/2
          top-1/2

          h-[420px]
          w-[420px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-[42px]

          border

          border-white/50

          bg-white/70

          shadow-2xl

          backdrop-blur-3xl
        "
      >

        <div
          className="
            flex
            h-full
            flex-col
            items-center
            justify-center
          "
        >

          {/* ===============================================
              Logistics Icon
          ================================================ */}

          <div
            className="
              flex

              h-24
              w-24

              items-center
              justify-center

              rounded-3xl

              bg-orange-100
            "
          >

            <Truck
              className="
                h-12
                w-12

                text-orange-500
              "
            />

          </div>

          <h3
            className="
              mt-8

              text-2xl

              font-bold

              text-slate-900
            "
          >

            AI Powered Logistics

          </h3>
          <p
            className="
              mt-3

              max-w-[280px]

              text-center

              text-sm

              leading-6

              text-slate-500
            "
          >
            Intelligent vendor matching, real-time tracking,
            transparent pricing, and enterprise relocation
            management in one unified platform.
          </p>

        </div>

      </motion.div>

      {/* =======================================================
          Floating Home Card
      ======================================================== */}

      <motion.div

        animate={{
          y: [0, -16, 0],
        }}

        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          left-4
          top-16
        "
      >

        <Card
          className="
            w-60

            rounded-3xl

            border

            bg-white/95

            shadow-xl
          "
        >

          <CardContent className="p-5">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex

                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-2xl

                  bg-orange-100
                "
              >

                <Home
                  className="
                    h-6
                    w-6

                    text-orange-500
                  "
                />

              </div>

              <div>

                <h4 className="font-semibold text-slate-900">
                  Home Relocation
                </h4>

                <p className="text-xs text-slate-500">
                  Door-to-door household shifting
                </p>

              </div>

            </div>

          </CardContent>

        </Card>

      </motion.div>

      {/* =======================================================
          Floating Office Card
      ======================================================== */}

      <motion.div

        animate={{
          y: [0, 18, 0],
        }}

        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          right-0
          top-12
        "
      >

        <Card
          className="
            w-64

            rounded-3xl

            border

            bg-white/95

            shadow-xl
          "
        >
          <CardContent className="p-5">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex

                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-2xl

                  bg-blue-100
                "
              >

                <Building2
                  className="
                    h-6
                    w-6

                    text-blue-600
                  "
                />

              </div>

              <div>

                <h4 className="font-semibold text-slate-900">
                  Office Relocation
                </h4>

                <p className="text-xs text-slate-500">
                  Enterprise employee transfer
                </p>

              </div>

            </div>

          </CardContent>

        </Card>

      </motion.div>

      {/* =======================================================
          Verified Vendor Card
      ======================================================== */}

      <motion.div

        animate={{
          y: [0, -12, 0],
          rotate: [0, 1, 0],
        }}

        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          left-12
          bottom-28
        "
      >

        <Card
          className="
            w-64

            rounded-3xl

            border

            bg-white/95

            shadow-xl
          "
        >

          <CardContent className="p-5">

            <div className="flex items-start gap-3">

              <div
                className="
                  flex

                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-2xl

                  bg-green-100
                "
              >

                <CheckCircle2
                  className="
                    h-6
                    w-6

                    text-green-600
                  "
                />

              </div>

              <div className="flex-1">

                <h4 className="font-semibold text-slate-900">
                  Verified Vendor
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Trust Score: 98%
                </p>

                <div
                  className="
                    mt-3

                    inline-flex

                    rounded-full

                    bg-green-50

                    px-3
                    py-1

                    text-xs
                    font-medium

                    text-green-700
                  "
                >
                  Background Checked
                </div>

              </div>

            </div>

          </CardContent>

        </Card>

      </motion.div>
      {/* =======================================================
          Insurance Active Card
      ======================================================== */}

      <motion.div

        animate={{
          y: [0, 14, 0],
        }}

        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          right-10
          bottom-36
        "
      >

        <Card
          className="
            w-60

            rounded-3xl

            border

            bg-white/95

            shadow-xl
          "
        >

          <CardContent className="p-5">

            <div className="flex items-start gap-3">

              <div
                className="
                  flex

                  h-12
                  w-12

                  items-center
                  justify-center

                  rounded-2xl

                  bg-emerald-100
                "
              >

                <ShieldCheck
                  className="
                    h-6
                    w-6

                    text-emerald-600
                  "
                />

              </div>

              <div className="flex-1">

                <h4 className="font-semibold text-slate-900">
                  Insurance Active
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Goods protected throughout transit.
                </p>

                <div
                  className="
                    mt-3

                    inline-flex

                    rounded-full

                    bg-emerald-50

                    px-3
                    py-1

                    text-xs
                    font-medium

                    text-emerald-700
                  "
                >
                  ₹10 Lakh Coverage
                </div>

              </div>

            </div>

          </CardContent>

        </Card>

      </motion.div>

      {/* =======================================================
          Live Tracking Card
      ======================================================== */}

      <motion.div

        animate={{
          y: [0, -10, 0],
          x: [0, 8, 0],
        }}

        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          left-1/2
          bottom-6

          -translate-x-1/2
        "
      >

        <Card
          className="
            w-72

            rounded-3xl

            border

            bg-white/95

            shadow-2xl
          "
        >

          <CardContent className="p-5">

            <div className="flex items-center justify-between">

              <div>

                <h4
                  className="
                    text-sm
                    font-semibold

                    text-slate-900
                  "
                >
                  Live Shipment Tracking
                </h4>

                <p
                  className="
                    mt-1

                    text-xs

                    text-slate-500
                  "
                >
                  Truck is currently in transit
                </p>

              </div>

              <div
                className="
                  rounded-full

                  bg-green-100

                  px-3
                  py-1

                  text-xs
                  font-semibold

                  text-green-700
                "
              >
                LIVE
              </div>

            </div>

            {/* ===============================================
                Progress
            ================================================ */}

            <div className="mt-6">

              <div
                className="
                  mb-2

                  flex

                  items-center

                  justify-between

                  text-xs

                  text-slate-500
                "
              >

                <span>Ahmedabad</span>

                <span>ETA 2 Days</span>

              </div>

              <div
                className="
                  h-2

                  overflow-hidden

                  rounded-full

                  bg-slate-200
                "
              >

                <motion.div

                  initial={{
                    width: "0%",
                  }}

                  animate={{
                    width: "68%",
                  }}

                  transition={{
                    duration: 2,
                    ease: "easeOut",
                  }}

                  className="
                    h-full

                    rounded-full

                    bg-gradient-to-r

                    from-orange-500
                    via-amber-400
                    to-blue-500
                  "
                />

              </div>

              <div
                className="
                  mt-2

                  flex

                  justify-between

                  text-xs

                  font-medium

                  text-slate-500
                "
              >

                <span>Started</span>

                <span>In Transit</span>

                <span>Delivered</span>

              </div>

            </div>

          </CardContent>

        </Card>

      </motion.div>

      {/* =======================================================
          Decorative Connection Lines
      ======================================================== */}

      <div
        className="
          absolute

          inset-0

          -z-10

          pointer-events-none
        "
      >

        {/* ===================================================
            SVG Connection Paths
        ==================================================== */}

        <svg
          className="
            absolute
            inset-0

            h-full
            w-full
          "
        >

          <defs>

            <linearGradient
              id="heroConnection"

              x1="0%"
              y1="0%"

              x2="100%"
              y2="100%"
            >

              <stop
                offset="0%"
                stopColor="#F97316"
                stopOpacity="0.45"
              />

              <stop
                offset="100%"
                stopColor="#3B82F6"
                stopOpacity="0.45"
              />

            </linearGradient>

          </defs>

          <path

            d="M160 120 C260 180 340 170 420 220"

            stroke="url(#heroConnection)"

            strokeWidth="2"

            fill="none"

            strokeDasharray="8 8"

          />

          <path

            d="M160 420 C250 360 360 350 470 430"

            stroke="url(#heroConnection)"

            strokeWidth="2"

            fill="none"

            strokeDasharray="8 8"

          />

        </svg>

      </div>

      {/* =======================================================
          Decorative Floating Glow
      ======================================================== */}

      <motion.div

        animate={{
          scale: [1, 1.08, 1],
        }}

        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          left-1/2
          top-1/2

          -z-20

          h-[520px]
          w-[520px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-orange-300/10

          blur-[140px]
        "
      />

      <motion.div

        animate={{
          scale: [1.05, 1, 1.05],
        }}

        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}

        className="
          absolute

          left-1/2
          top-1/2

          -z-30

          h-[620px]
          w-[620px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-blue-400/10

          blur-[180px]
        "
      />

    </div>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

Phase 2
--------------------------------------------

Replace icon cards with

Lottie Animations

--------------------------------------------

Phase 3

3D Truck

Three.js

React Three Fiber

--------------------------------------------

Phase 4

Live India Route Map

Google Maps

Polyline Animation

Truck Position

--------------------------------------------

Phase 5

Realtime Dashboard

Vendor Status

Driver Assigned

AI Pricing

Estimated Delivery

--------------------------------------------

Phase 6

AI Assistant

Dynamic recommendations

Vendor score

Insurance suggestions

Move optimization

--------------------------------------------

Phase 7

Enterprise Visualization

Corporate transfers

Bulk employee relocation

Approval workflow

Live relocation pipeline

--------------------------------------------

This illustration should evolve into the
visual signature of Easy Movers,
similar to Stripe's product animation
or Linear's dashboard illustrations.

=========================================================== */