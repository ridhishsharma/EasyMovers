"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   How It Works Section

   File: how-it-works.tsx

   Version: 1.0
============================================================ */

import { useState } from "react"

import { motion } from "framer-motion"

import ProcessAnimation from "./process-animation"

import ProcessHeader from "./process-header"

import ProcessTimeline from "./process-timeline"

import {

  HOW_IT_WORKS_DATA,

} from "./process.constants"

import type {

  ProcessStep,

  HowItWorksProps,

} from "./process.types"

/* ============================================================
   Component
============================================================ */

export default function HowItWorks({

  title,

  subtitle,

}: HowItWorksProps) {

  const [selectedStep, setSelectedStep] =

    useState<ProcessStep>(

      HOW_IT_WORKS_DATA.timeline.steps[0]

    )

  const sectionTitle =

    title ??

    HOW_IT_WORKS_DATA.header.title

  const sectionSubtitle =

    subtitle ??

    HOW_IT_WORKS_DATA.header.subtitle

  return (

    <section

      id="how-it-works"

      className="
        relative

        overflow-hidden

        bg-slate-50

        py-24

        lg:py-32
      "

    >

      {/* ===============================================
          Background Animation
      ================================================ */}

      <ProcessAnimation />

      <div

        className="
          container

          relative

          z-10

          mx-auto

          px-4

          sm:px-6

          lg:px-8
        "

      >

        {/* ===============================================
            Header
        ================================================ */}

        <ProcessHeader

          badge={HOW_IT_WORKS_DATA.header.badge}

          title={sectionTitle}

          subtitle={sectionSubtitle}

        />
        {/* ===============================================
            Timeline
        ================================================ */}

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

            delay: 0.25,

            duration: 0.6,

          }}

        >

          <ProcessTimeline

            steps={

              HOW_IT_WORKS_DATA.timeline.steps

            }

            activeStep={selectedStep.id}

            onStepChange={setSelectedStep}

          />

        </motion.div>

        {/* ===============================================
            Enterprise Statistics
        ================================================ */}

        <motion.div

          initial={{

            opacity: 0,

            y: 20,

          }}

          whileInView={{

            opacity: 1,

            y: 0,

          }}

          viewport={{

            once: true,

          }}

          transition={{

            delay: 0.45,

            duration: 0.6,

          }}

          className="
            mt-24

            grid

            gap-6

            md:grid-cols-3
          "

        >

          {HOW_IT_WORKS_DATA.statistics?.map(

            (stat) => (

              <div

                key={stat.id}

                className="
                  rounded-3xl

                  border

                  border-slate-200

                  bg-white

                  p-8

                  text-center

                  shadow-sm

                  transition-all

                  duration-300

                  hover:-translate-y-1

                  hover:shadow-xl
                "

              >

                <div

                  className="
                    text-4xl

                    font-black

                    text-orange-600
                  "

                >

                  {stat.value}

                </div>

                <h3

                  className="
                    mt-4

                    text-lg

                    font-bold

                    text-slate-900
                  "

                >

                  {stat.label}

                </h3>

                {stat.description && (

                  <p

                    className="
                      mt-2

                      text-sm

                      text-slate-500
                    "

                  >

                    {stat.description}

                  </p>

                )}

              </div>

            )

          )}

        </motion.div>

        {/* ===============================================
            AI Insight
        ================================================ */}

        {HOW_IT_WORKS_DATA.aiInsight && (

          <motion.div

            initial={{

              opacity: 0,

              y: 20,

            }}

            whileInView={{

              opacity: 1,

              y: 0,

            }}

            viewport={{

              once: true,

            }}

            transition={{

              delay: 0.6,

              duration: 0.6,

            }}

            className="
              mt-20

              rounded-3xl

              border

              border-orange-200

              bg-gradient-to-r

              from-orange-50

              via-white

              to-amber-50

              p-10

              shadow-lg
            "

          >

            <div

              className="
                flex

                flex-col

                gap-8

                lg:flex-row

                lg:items-center

                lg:justify-between
              "

            >

              <div className="max-w-3xl">

                <span

                  className="
                    text-sm

                    font-semibold

                    uppercase

                    tracking-wide

                    text-orange-600
                  "

                >

                  AI Insight

                </span>

                <h3

                  className="
                    mt-3

                    text-3xl

                    font-black

                    text-slate-900
                  "

                >

                  {HOW_IT_WORKS_DATA.aiInsight.title}

                </h3>
                <p

                  className="
                    mt-5

                    text-base

                    leading-8

                    text-slate-600
                  "

                >

                  {HOW_IT_WORKS_DATA.aiInsight.description}

                </p>

                {HOW_IT_WORKS_DATA.aiInsight.recommendation && (

                  <div

                    className="
                      mt-6

                      rounded-2xl

                      border

                      border-orange-200

                      bg-white

                      p-5
                    "

                  >

                    <p

                      className="
                        text-sm

                        font-semibold

                        text-orange-600
                      "

                    >

                      AI Recommendation

                    </p>

                    <p

                      className="
                        mt-2

                        text-sm

                        leading-7

                        text-slate-600
                      "

                    >

                      {

                        HOW_IT_WORKS_DATA.aiInsight

                          .recommendation

                      }

                    </p>

                  </div>

                )}

              </div>

              <div

                className="
                  flex

                  items-center

                  justify-center
                "

              >

                <div

                  className="
                    flex

                    h-44

                    w-44

                    flex-col

                    items-center

                    justify-center

                    rounded-full

                    bg-white

                    shadow-xl
                  "

                >

                  <span

                    className="
                      text-5xl

                      font-black

                      text-orange-600
                    "

                  >

                    {

                      HOW_IT_WORKS_DATA.aiInsight

                        .confidenceScore

                    }

                    %

                  </span>

                  <span

                    className="
                      mt-2

                      text-sm

                      font-semibold

                      text-slate-500
                    "

                  >

                    AI Confidence

                  </span>

                </div>

              </div>

            </div>

          </motion.div>

        )}

      </div>

    </section>

  )

}

/* ===========================================================
   Future Enterprise Roadmap

   Phase 2
   ----------------------------------------------------------
   • Auto-play process timeline
   • Interactive workflow explorer
   • Animated workflow transitions

   Phase 3
   ----------------------------------------------------------
   • Live move progress integration
   • Customer-specific workflow
   • Dynamic relocation milestones

   Phase 4
   ----------------------------------------------------------
   • Vendor assignment timeline
   • GPS shipment visualization
   • Corporate workflow dashboard

   Phase 5
   ----------------------------------------------------------
   • Predictive relocation analytics
   • AI operational insights
   • Enterprise logistics command center
=========================================================== */