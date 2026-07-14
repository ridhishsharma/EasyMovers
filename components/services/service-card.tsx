"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Service Card

   File: service-card.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {

  ArrowRight,

  Star,

} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

import type { ServiceCardProps } from "./service.types"

/* ============================================================
   Component
============================================================ */

export default function ServiceCard({

  service,

  active,

  onClick,

}: ServiceCardProps) {

  const Icon = service.icon

  return (

    <motion.div

      whileHover={{
        y: -8,
        scale: 1.02,
      }}

      whileTap={{
        scale: 0.98,
      }}

      transition={{
        duration: 0.25,
      }}

    >

      <Card

        onClick={onClick}

        className={cn(

          "group",

          "relative",

          "cursor-pointer",

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
              Background Gradient
          ================================================ */}

          <div

            className={cn(

              "absolute",

              "inset-0",

              "opacity-0",

              "transition-opacity",

              "duration-300",

              "group-hover:opacity-100",

              service.background

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

              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm",
                  service.background
                )}
              >
                <Icon
                  className={cn(
                    "h-7 w-7",
                    service.color
                  )}
                />
              </div>

              <div className="flex flex-col items-end gap-2">

                {service.badge && (

                  <Badge
                    className="
                      border-0

                      bg-orange-500

                      px-3

                      text-[11px]

                      font-semibold

                      text-white

                      shadow-sm
                    "
                  >
                    {service.badge.label}
                  </Badge>

                )}

                <div
                  className="
                    flex

                    items-center

                    gap-1

                    rounded-full

                    bg-amber-50

                    px-2.5

                    py-1
                  "
                >

                  <Star
                    className="
                      h-3.5
                      w-3.5

                      fill-amber-400

                      text-amber-400
                    "
                  />

                  <span
                    className="
                      text-xs

                      font-semibold

                      text-slate-700
                    "
                  >
                    {service.rating}
                  </span>

                </div>

              </div>

            </div>

            {/* ===========================================
                Title
            ============================================ */}

            <h3
              className="
                mt-6

                text-xl

                font-bold

                tracking-tight

                text-slate-900
              "
            >
              {service.title}
            </h3>

            {/* ===========================================
                Description
            ============================================ */}

            <p
              className="
                mt-3

                text-sm

                leading-6

                text-slate-500
              "
            >
              {service.shortDescription}
            </p>

            {/* ===========================================
                Pricing & Duration
            ============================================ */}

            <div
              className="
                mt-6

                flex

                items-center

                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-xs

                    uppercase

                    tracking-wide

                    text-slate-400
                  "
                >
                  Starting From
                </p>

                <div
                  className="
                    mt-1

                    flex

                    items-end

                    gap-1
                  "
                >

                  <span
                    className="
                      text-2xl

                      font-black

                      text-slate-900
                    "
                  >
                    {service.pricing.currency}
                    {service.pricing.startingPrice.toLocaleString()}
                  </span>

                  <span
                    className="
                      mb-1

                      text-xs

                      text-slate-500
                    "
                  >
                    {service.pricing.unit}
                  </span>

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

                <p
                  className="
                    text-xs

                    text-slate-400
                  "
                >
                  ETA
                </p>

                <p
                  className="
                    text-sm

                    font-semibold

                    text-slate-700
                  "
                >
                  {service.estimatedDuration}
                </p>

              </div>

            </div>

            {/* ===========================================
                AI Recommendation
            ============================================ */}

            {service.aiRecommendation && (

              <div
                className="
                  mt-6

                  rounded-2xl

                  border

                  border-orange-200

                  bg-orange-50

                  p-4
                "
              >

                <p
                  className="
                    text-xs

                    font-semibold

                    uppercase

                    tracking-wide

                    text-orange-600
                  "
                >
                  AI Recommendation
                </p>

                <p
                  className="
                    mt-2

                    text-sm

                    font-semibold

                    text-slate-900
                  "
                >
                  {service.aiRecommendation.title}
                </p>

                <p
                  className="
                    mt-2

                    text-sm

                    leading-6

                    text-slate-600
                  "
                >
                  {service.aiRecommendation.description}
                </p>

                <div
                  className="
                    mt-4

                    flex

                    items-center

                    justify-between
                  "
                >

                  <span
                    className="
                      text-xs

                      font-medium

                      text-slate-500
                    "
                  >
                    AI Match Score
                  </span>

                  <Badge
                    className="
                      border-0

                      bg-green-600

                      text-white
                    "
                  >
                    {service.aiRecommendation.score}%
                  </Badge>

                </div>

              </div>

            )}

            {/* ===========================================
                Top Features
            ============================================ */}

            <div
              className="
                mt-6

                flex

                flex-wrap

                gap-2
              "
            >

              {service.features.slice(0, 3).map((feature) => (

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

              <span
                className="
                  text-sm

                  font-semibold

                  text-orange-600
                "
              >
                Explore Service
              </span>

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
              Bottom Active Accent
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

              service.gradient

            )}

          />

        </CardContent>

      </Card>

    </motion.div>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

Phase 2
------------------------------------------------------------

Dynamic Pricing

Pricing fetched from

AI Engine

Vendor Marketplace

Location Intelligence

------------------------------------------------------------

Phase 3

Realtime Availability

Available Vendors

Average ETA

Current Queue

Vendor Health

------------------------------------------------------------

Phase 4

Smart Recommendation

Recommend services

based on

Location

Distance

Inventory

Corporate Policy

Customer History

------------------------------------------------------------

Phase 5

Enterprise Analytics

Display

Carbon Footprint

Cost Savings

Estimated Delivery Accuracy

Risk Score

AI Confidence

=========================================================== */