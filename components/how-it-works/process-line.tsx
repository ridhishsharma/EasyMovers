"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Process Connection Line

   File: process-line.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

import type {

  ProcessLineProps,

} from "./process.types"

/* ============================================================
   Component
============================================================ */

export default function ProcessLine({

  current,

  total,

}: ProcessLineProps) {

  const progress =

    total <= 1

      ? 100

      : (current / (total - 1)) * 100

  return (

    <div

      className="
        relative

        mx-auto

        hidden

        h-2

        w-full

        overflow-hidden

        rounded-full

        bg-slate-200

        lg:block
      "

    >

      {/* ===============================================
          Active Progress
      ================================================ */}

      <motion.div

        initial={{

          width: 0,

        }}

        animate={{

          width: `${progress}%`,

        }}

        transition={{

          duration: 0.8,

          ease: "easeOut",

        }}

        className="
          absolute

          inset-y-0

          left-0

          rounded-full

          bg-gradient-to-r

          from-orange-500

          via-amber-500

          to-green-500
        "

      />

      {/* ===============================================
          Step Indicators
      ================================================ */}

      <div

        className="
          absolute

          inset-0

          flex

          items-center

          justify-between

          px-1
        "

      >
        {Array.from({ length: total }).map((_, index) => {

          const completed = index <= current

          return (

            <motion.div

              key={index}

              initial={{
                scale: 0,
                opacity: 0,
              }}

              animate={{
                scale: 1,
                opacity: 1,
              }}

              transition={{
                delay: index * 0.08,
                duration: 0.35,
              }}

              className={cn(

                "relative",

                "z-10",

                "flex",

                "h-6",

                "w-6",

                "items-center",

                "justify-center",

                "rounded-full",

                "border-2",

                "transition-all",

                completed

                  ? "border-orange-500 bg-orange-500 text-white"

                  : "border-slate-300 bg-white text-slate-400"

              )}

            >

              {completed ? (

                <CheckCircle2 className="h-4 w-4" />

              ) : (

                <span

                  className="
                    text-[10px]

                    font-bold
                  "

                >

                  {index + 1}

                </span>

              )}

            </motion.div>

          )

        })}

      </div>

      {/* ===============================================
          Glow Effect
      ================================================ */}

      <motion.div

        animate={{

          x: [

            "-10%",

            "110%",

          ],

        }}

        transition={{

          repeat: Infinity,

          duration: 3,

          ease: "linear",

        }}

        className="
          absolute

          inset-y-0

          w-24

          bg-gradient-to-r

          from-transparent

          via-white/40

          to-transparent
        "

      />

      {/* ===============================================
          Mobile Progress
      ================================================ */}

      <div
        className="
          absolute

          -bottom-10

          left-1/2

          flex

          -translate-x-1/2

          items-center

          gap-2

          rounded-full

          border

          border-slate-200

          bg-white

          px-4

          py-2

          shadow-sm

          lg:hidden
        "
      >

        <span
          className="
            text-xs

            font-semibold

            text-slate-500
          "
        >
          Step
        </span>

        <span
          className="
            text-sm

            font-black

            text-orange-600
          "
        >
          {current + 1}
        </span>

        <span
          className="
            text-xs

            text-slate-400
          "
        >
          /
        </span>

        <span
          className="
            text-sm

            font-semibold

            text-slate-600
          "
        >
          {total}
        </span>

      </div>

    </div>

  )

}

/* ===========================================================
   Future Enhancements

   Phase 2
   ----------------------------------------------------------
   • Animated milestone transitions
   • Gradient pulse effects
   • Interactive progress labels

   Phase 3
   ----------------------------------------------------------
   • Real-time relocation status
   • Live vehicle progress sync
   • ETA visualization

   Phase 4
   ----------------------------------------------------------
   • AI workflow prediction
   • Route optimization progress
   • Enterprise shipment timeline

   Phase 5
   ----------------------------------------------------------
   • Multi-shipment tracking
   • Corporate relocation dashboard
   • Predictive milestone analytics
=========================================================== */