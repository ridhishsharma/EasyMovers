"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Service Preview

   File: service-preview.tsx

   Version: 1.0
============================================================ */

import { motion } from "framer-motion"

import {

  ArrowRight,

  CheckCircle2,

  Clock3,

  Sparkles,

  Star,

} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"

import { Separator } from "@/components/ui/separator"

import { cn } from "@/lib/utils"

import type {

  ServicePreviewProps,

} from "./service.types"

/* ============================================================
   Component
============================================================ */

export default function ServicePreview({

  service,

}: ServicePreviewProps) {

  const Icon = service.icon

  return (

    <motion.div

      key={service.id}

      initial={{
        opacity: 0,
        x: 20,
      }}

      animate={{
        opacity: 1,
        x: 0,
      }}

      transition={{
        duration: 0.35,
      }}

    >

      <Card

        className="
          overflow-hidden

          rounded-3xl

          border

          border-slate-200

          bg-white

          shadow-2xl
        "

      >

        <CardContent className="p-8">

          {/* ===============================================
              Header
          ================================================ */}

          <div

            className="
              flex

              items-start

              justify-between

              gap-6
            "

          >
            {/* ===========================================
                Left
            ============================================ */}

            <div className="flex items-start gap-5">

              <div

                className={cn(

                  "flex",

                  "h-20",

                  "w-20",

                  "items-center",

                  "justify-center",

                  "rounded-3xl",

                  service.background

                )}

              >

                <Icon

                  className={cn(

                    "h-10",

                    "w-10",

                    service.color

                  )}

                />

              </div>

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h3

                    className="
                      text-3xl

                      font-black

                      tracking-tight

                      text-slate-900
                    "

                  >

                    {service.title}

                  </h3>

                  {service.badge && (

                    <Badge

                      className="
                        border-0

                        bg-orange-500

                        text-white
                      "

                    >

                      {service.badge.label}

                    </Badge>

                  )}

                </div>

                <div

                  className="
                    mt-3

                    flex

                    items-center

                    gap-4

                    text-sm

                    text-slate-500
                  "

                >

                  <div className="flex items-center gap-1">

                    <Star

                      className="
                        h-4

                        w-4

                        fill-amber-400

                        text-amber-400
                      "

                    />

                    <span>

                      {service.rating}

                    </span>

                  </div>

                  <span>

                    {service.reviewCount.toLocaleString()} Reviews

                  </span>

                </div>

              </div>

            </div>

            {/* ===========================================
                Price Panel
            ============================================ */}

            <div className="text-right">

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
                  mt-2

                  flex

                  items-end

                  justify-end

                  gap-1
                "
              >

                <span
                  className="
                    text-3xl

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

                    text-sm

                    text-slate-500
                  "
                >
                  {service.pricing.unit}
                </span>

              </div>

              <div
                className="
                  mt-4

                  inline-flex

                  items-center

                  gap-2

                  rounded-full

                  bg-slate-100

                  px-4

                  py-2
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

                    font-medium

                    text-slate-700
                  "
                >
                  {service.estimatedDuration}
                </span>

              </div>

            </div>

          </div>

          {/* ===============================================
              AI Recommendation
          ================================================ */}

          {service.aiRecommendation && (

            <motion.div

              initial={{
                opacity: 0,
                y: 10,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.15,
              }}

              className="
                mt-8

                rounded-2xl

                border

                border-orange-200

                bg-orange-50

                p-5
              "

            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Sparkles
                    className="
                      h-5

                      w-5

                      text-orange-500
                    "
                  />

                  <span
                    className="
                      font-semibold

                      text-orange-700
                    "
                  >
                    AI Recommendation
                  </span>

                </div>
                <Badge

                  className="
                    border-0

                    bg-green-600

                    text-white
                  "

                >

                  {service.aiRecommendation.score}% Match

                </Badge>

              </div>

              <h4

                className="
                  mt-4

                  text-lg

                  font-bold

                  text-slate-900
                "

              >

                {service.aiRecommendation.title}

              </h4>

              <p

                className="
                  mt-2

                  leading-7

                  text-slate-600
                "

              >

                {service.aiRecommendation.description}

              </p>

            </motion.div>

          )}

          <Separator className="my-8" />

          {/* ===============================================
              Top Features
          ================================================ */}

          <div>

            <h4

              className="
                text-xl

                font-bold

                text-slate-900
              "

            >

              Included Features

            </h4>

            <div

              className="
                mt-6

                grid

                gap-4

                md:grid-cols-2
              "

            >

              {service.features.map((feature) => (

                <div

                  key={feature.id}

                  className="
                    flex

                    items-start

                    gap-3

                    rounded-2xl

                    border

                    border-slate-100

                    p-4

                    transition-colors

                    hover:bg-slate-50
                  "

                >

                  <CheckCircle2

                    className="
                      mt-1

                      h-5

                      w-5

                      text-green-500
                    "

                  />

                  <div>

                    <p

                      className="
                        font-semibold

                        text-slate-900
                      "

                    >

                      {feature.title}

                    </p>

                    <p
                      className="
                        mt-1

                        text-sm

                        leading-6

                        text-slate-600
                      "
                    >
                      {feature.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

          <Separator className="my-8" />

          {/* ===============================================
              Benefits
          ================================================ */}

          <div>

            <h4
              className="
                text-xl

                font-bold

                text-slate-900
              "
            >
              Why Choose This Service
            </h4>

            <div
              className="
                mt-6

                grid

                gap-4

                md:grid-cols-2
              "
            >

              {service.benefits.map((benefit) => {

                const BenefitIcon = benefit.icon

                return (

                  <div

                    key={benefit.id}

                    className="
                      rounded-2xl

                      border

                      border-slate-100

                      p-5

                      transition-all

                      duration-300

                      hover:border-orange-200

                      hover:shadow-md
                    "
                  >

                    {BenefitIcon && (

                      <BenefitIcon
                        className="
                          mb-4

                          h-6

                          w-6

                          text-orange-500
                        "
                      />

                    )}

                    <h5
                      className="
                        font-semibold

                        text-slate-900
                      "
                    >
                      {benefit.title}
                    </h5>

                    <p
                      className="
                        mt-2

                        text-sm

                        leading-6

                        text-slate-600
                      "
                    >
                      {benefit.description}
                    </p>

                  </div>

                )

              })}

            </div>

          </div>

          <Separator className="my-8" />

          {/* ===============================================
              Statistics
          ================================================ */}

          <div>

            <h4
              className="
                text-xl

                font-bold

                text-slate-900
              "
            >
              Service Highlights
            </h4>

            <div
              className="
                mt-6

                grid

                grid-cols-1

                gap-4

                sm:grid-cols-3
              "
            >

              {service.statistics.map((item) => (

                <div

                  key={item.label}

                  className="
                    rounded-2xl

                    bg-slate-50

                    p-5

                    text-center

                    transition-all

                    duration-300

                    hover:bg-orange-50
                  "

                >

                  <p
                    className="
                      text-3xl

                      font-black

                      text-slate-900
                    "
                  >
                    {item.value}
                  </p>

                  <p
                    className="
                      mt-2

                      text-sm

                      font-medium

                      text-slate-500
                    "
                  >
                    {item.label}
                  </p>

                </div>

              ))}

            </div>

          </div>

          {/* ===============================================
              CTA
          ================================================ */}

          <div
            className="
              mt-10

              flex

              flex-col

              gap-4

              sm:flex-row
            "
          >

            <Button

              size="lg"

              className="
                flex-1

                rounded-xl

                bg-orange-500

                text-white

                hover:bg-orange-600
              "
            >

              Book This Service

              <ArrowRight className="ml-2 h-4 w-4" />

            </Button>

            <Button

              size="lg"

              variant="outline"

              className="
                flex-1

                rounded-xl

                border-orange-200

                text-orange-600

                hover:bg-orange-50
              "
            >

              Talk to Expert

            </Button>

          </div>

        </CardContent>

      </Card>

    </motion.div>

  )

}

/* ===========================================================
   Future Enterprise Enhancements

   Phase 2
   --------------------------------------------
   • Dynamic pricing from AI engine
   • Vendor-specific pricing
   • City-based recommendations
   • Live ETA calculation

   Phase 3
   --------------------------------------------
   • AI relocation assistant
   • Carbon footprint estimate
   • Route optimization
   • Cost comparison

   Phase 4
   --------------------------------------------
   • Real-time vendor availability
   • Instant quotation engine
   • Calendar scheduling
   • Employee relocation workflow

   Phase 5
   --------------------------------------------
   • AI confidence score
   • Risk assessment
   • Predictive delivery analytics
   • Customer relocation timeline
=========================================================== */