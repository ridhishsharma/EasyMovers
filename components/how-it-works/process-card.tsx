"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Enterprise Process Card

   File: process-card.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {

  ArrowRight,

  Brain,

  Clock3,

  Sparkles,

} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { Card, CardContent } from "@/components/ui/card"

import { cn } from "@/lib/utils"

import type {

  ProcessCardProps,

} from "./process.types"

/* ============================================================
   Component
============================================================ */

export default function ProcessCard({

  step,

  active = false,

  index = 0,

  onClick,

}: ProcessCardProps) {

  const Icon = step.icon

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
        delay: index * 0.08,
        duration: 0.45,
      }}

      whileHover={{
        y: -6,
        scale: 1.02,
      }}

      whileTap={{
        scale: 0.98,
      }}

      onClick={onClick}

      className="cursor-pointer"

    >

      <Card

        className={cn(

          "group",

          "relative",

          "overflow-hidden",

          "rounded-3xl",

          "border",

          "transition-all",

          "duration-300",

          active

            ? "border-orange-400 shadow-2xl"

            : "border-slate-200 hover:border-orange-300 hover:shadow-xl"

        )}

      >

        <CardContent className="relative p-6">

          {/* ===============================================
              Background
          ================================================ */}

          <div

            className={cn(

              "absolute",

              "inset-0",

              "opacity-0",

              "transition-opacity",

              "duration-300",

              "group-hover:opacity-100",

              step.background

            )}

          />

          {/* ===============================================
              Card Content
          ================================================ */}

          <div className="relative z-10">

            {/* ===========================================
                Header
            ============================================ */}

            <div className="flex items-start justify-between">

              <div className="flex items-start gap-4">

                <div

                  className={cn(

                    "flex",

                    "h-14",

                    "w-14",

                    "items-center",

                    "justify-center",

                    "rounded-2xl",

                    step.background

                  )}

                >

                  <Icon

                    className={cn(

                      "h-7",

                      "w-7",

                      step.color

                    )}

                  />

                </div>

                <div>

                  <div className="flex items-center gap-3">

                    <Badge

                      className="
                        border-0

                        bg-slate-900

                        text-white
                      "

                    >

                      Step {step.order}

                    </Badge>

                    {step.aiPowered && (

                      <Badge

                        className="
                          border-0

                          bg-orange-500

                          text-white
                        "

                      >

                        <Brain className="mr-1 h-3 w-3" />

                        AI

                      </Badge>

                    )}

                  </div>

                  <h3

                    className="
                      mt-4

                      text-xl

                      font-bold

                      tracking-tight

                      text-slate-900
                    "

                  >

                    {step.title}

                  </h3>

                  {step.subtitle && (

                    <p

                      className="
                        mt-1

                        text-sm

                        font-medium

                        text-orange-600
                      "

                    >

                      {step.subtitle}

                    </p>

                  )}

                </div>

              </div>

              <div
                className="
                  rounded-xl

                  bg-slate-100

                  px-3

                  py-2

                  text-right
                "
              >
                <div
                  className="
                    flex

                    items-center

                    gap-2
                  "
                >

                  <Clock3
                    className="
                      h-4

                      w-4

                      text-orange-500
                    "
                  />

                  <span
                    className="
                      text-sm

                      font-semibold

                      text-slate-700
                    "
                  >
                    {step.duration}
                  </span>

                </div>

              </div>

            </div>

            {/* ===========================================
                Description
            ============================================ */}

            <p
              className="
                mt-6

                text-sm

                leading-7

                text-slate-600
              "
            >
              {step.description}
            </p>

            {/* ===========================================
                Feature Preview
            ============================================ */}

            <div
              className="
                mt-6

                flex

                flex-wrap

                gap-2
              "
            >

              {step.features.slice(0, 3).map((feature) => (

                <Badge

                  key={feature.id}

                  variant="secondary"

                  className="
                    rounded-full

                    bg-slate-100

                    px-3

                    py-1

                    text-xs

                    font-medium

                    text-slate-700

                    hover:bg-slate-200
                  "

                >

                  {feature.title}

                </Badge>

              ))}

            </div>

            {/* ===========================================
                Footer CTA
            ============================================ */}

            <div
              className="
                mt-8

                flex

                items-center

                justify-between
              "
            >

              <div
                className="
                  flex

                  items-center

                  gap-2
                "
              >

                <Sparkles
                  className="
                    h-4

                    w-4

                    text-orange-500
                  "
                />

                <span
                  className="
                    text-sm

                    font-semibold

                    text-orange-600
                  "
                >
                  Learn More
                </span>

              </div>

              <motion.div

                whileHover={{
                  x: 6,
                }}

                transition={{
                  duration: 0.2,
                }}

              >

                <ArrowRight
                  className="
                    h-5

                    w-5

                    text-orange-500
                  "
                />

              </motion.div>

            </div>

          </div>

          {/* ===============================================
              Bottom Active Indicator
          ================================================ */}

          <motion.div

            initial={{
              width: active ? "100%" : "0%",
            }}

            animate={{
              width: active ? "100%" : "0%",
            }}

            transition={{
              duration: 0.35,
            }}

            className={cn(

              "absolute",

              "bottom-0",

              "left-0",

              "h-1",

              "rounded-r-full",

              "bg-gradient-to-r",

              step.gradient

            )}

          />

        </CardContent>

      </Card>

    </motion.div>

  )

}

/* ===========================================================
   Future Enhancements

   Phase 2
   --------------------------------------------
   • Expandable feature details
   • Rich media illustrations
   • Step-specific animations

   Phase 3
   --------------------------------------------
   • AI progress recommendations
   • Live workflow status
   • Customer-specific guidance

   Phase 4
   --------------------------------------------
   • Vendor assignment status
   • Live relocation timeline
   • Interactive route visualization

   Phase 5
   --------------------------------------------
   • Predictive completion analytics
   • Risk indicators
   • Enterprise relocation dashboard

=========================================================== */