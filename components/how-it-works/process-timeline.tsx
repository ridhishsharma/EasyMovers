"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works

   Interactive Timeline

   File: process-timeline.tsx

   Version: 1.0
============================================================ */

import { useEffect, useState } from "react"

import { motion, AnimatePresence } from "framer-motion"

import ProcessCard from "./process-card"

import ProcessLine from "./process-line"

import type {

  ProcessStep,

  ProcessTimelineProps,

} from "./process.types"

/* ============================================================
   Component
============================================================ */

export default function ProcessTimeline({

  steps,

  activeStep,

  onStepChange,

}: ProcessTimelineProps) {

  const [selectedStep, setSelectedStep] =

    useState<ProcessStep>(steps[0])

  useEffect(() => {

    if (!activeStep) return

    const found = steps.find(

      (step) => step.id === activeStep

    )

    if (found) {

      setSelectedStep(found)

    }

  }, [activeStep, steps])

  const activeIndex = steps.findIndex(

    (step) => step.id === selectedStep.id

  )

  const handleStepSelection = (

    step: ProcessStep

  ) => {

    setSelectedStep(step)

    onStepChange?.(step)

  }

  return (

    <section

      className="
        relative

        mt-20
      "

    >

      {/* ===============================================
          Progress Line
      ================================================ */}

      <div className="mb-14">

        <ProcessLine

          current={activeIndex}

          total={steps.length}

        />

      </div>

      {/* ===============================================
          Timeline Cards
      ================================================ */}

      <div

        className="
          grid

          gap-8

          lg:grid-cols-3
        "

      >
        {steps.map((step, index) => (

          <ProcessCard

            key={step.id}

            step={step}

            index={index}

            active={selectedStep.id === step.id}

            onClick={() =>

              handleStepSelection(step)

            }

          />

        ))}

      </div>

      {/* ===============================================
          Selected Step Details
      ================================================ */}

      <div className="mt-16">

        <AnimatePresence mode="wait">

          <motion.div

            key={selectedStep.id}

            initial={{
              opacity: 0,
              y: 20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            exit={{
              opacity: 0,
              y: -20,
            }}

            transition={{
              duration: 0.35,
            }}

            className="
              rounded-3xl

              border

              border-slate-200

              bg-white

              p-8

              shadow-lg
            "

          >

            <div

              className="
                flex

                flex-col

                gap-6

                lg:flex-row

                lg:items-start

                lg:justify-between
              "

            >

              <div className="max-w-3xl">

                <span

                  className="
                    text-sm

                    font-semibold

                    uppercase

                    tracking-wider

                    text-orange-600
                  "

                >

                  Step {selectedStep.order}

                </span>

                <h3

                  className="
                    mt-3

                    text-3xl

                    font-black

                    tracking-tight

                    text-slate-900
                  "

                >

                  {selectedStep.title}

                </h3>

                {selectedStep.subtitle && (

                  <p

                    className="
                      mt-2

                      text-lg

                      font-medium

                      text-orange-600
                    "

                  >

                    {selectedStep.subtitle}

                  </p>

                )}
                <p

                  className="
                    mt-6

                    max-w-2xl

                    text-base

                    leading-8

                    text-slate-600
                  "

                >

                  {selectedStep.description}

                </p>

              </div>

              <div

                className="
                  flex

                  flex-col

                  gap-3

                  rounded-2xl

                  bg-slate-50

                  p-6

                  lg:min-w-[220px]
                "

              >

                <span

                  className="
                    text-xs

                    font-semibold

                    uppercase

                    tracking-wide

                    text-slate-500
                  "

                >

                  Estimated Time

                </span>

                <span

                  className="
                    text-2xl

                    font-black

                    text-slate-900
                  "

                >

                  {selectedStep.duration}

                </span>

                {selectedStep.aiPowered && (

                  <div

                    className="
                      rounded-xl

                      bg-orange-100

                      px-4

                      py-2

                      text-sm

                      font-semibold

                      text-orange-700
                    "

                  >

                    AI Assisted Process

                  </div>

                )}

              </div>

            </div>

            {/* ===========================================
                Feature Details
            ============================================ */}

            <div

              className="
                mt-10

                grid

                gap-4

                md:grid-cols-3
              "

            >

              {selectedStep.features.map((feature) => {

                const FeatureIcon = feature.icon

                return (

                  <div

                    key={feature.id}

                    className="
                      rounded-2xl

                      border

                      border-slate-100

                      p-5

                      transition-all

                      duration-300

                      hover:border-orange-200

                      hover:bg-orange-50
                    "

                  >
                    {FeatureIcon && (

                      <FeatureIcon

                        className="
                          mb-4

                          h-6

                          w-6

                          text-orange-500
                        "

                      />

                    )}

                    <h4

                      className="
                        text-base

                        font-bold

                        text-slate-900
                      "

                    >

                      {feature.title}

                    </h4>

                    <p

                      className="
                        mt-2

                        text-sm

                        leading-6

                        text-slate-600
                      "

                    >

                      {feature.description}

                    </p>

                  </div>

                )

              })}

            </div>

          </motion.div>

        </AnimatePresence>

      </div>

    </section>

  )

}

/* ===========================================================
   Future Enterprise Enhancements

   Phase 2
   ----------------------------------------------------------
   • Auto-play timeline
   • Scroll-linked progress
   • Animated milestone transitions

   Phase 3
   ----------------------------------------------------------
   • AI workflow optimization
   • Live move progress integration
   • Customer-specific recommendations

   Phase 4
   ----------------------------------------------------------
   • Vendor assignment visualization
   • GPS tracking integration
   • Interactive logistics timeline

   Phase 5
   ----------------------------------------------------------
   • Predictive workflow analytics
   • Corporate relocation dashboard
   • Multi-shipment orchestration
=========================================================== */