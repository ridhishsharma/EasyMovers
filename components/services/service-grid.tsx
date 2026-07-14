"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Service Grid

   File: service-grid.tsx

   Version: 1.0
============================================================ */

import { useMemo, useState } from "react"

import { motion } from "framer-motion"

import ServiceCard from "./service-card"

import ServicePreview from "./service-preview"

import {

  SERVICES,

} from "./service.constants"

import type {

  Service,

  ServiceGridProps,

} from "./service.types"

/* ============================================================
   Component
============================================================ */

export default function ServiceGrid({

  searchQuery,

}: ServiceGridProps) {

const filteredServices = useMemo(() => {

  const query = (searchQuery ?? "").toLowerCase().trim()

  if (!query) {
    return SERVICES
  }

  return SERVICES.filter((service) =>

    service.title.toLowerCase().includes(query) ||

    service.shortDescription.toLowerCase().includes(query) ||

    service.features.some((feature) =>
      feature.title.toLowerCase().includes(query)
    ) ||

    service.benefits.some((benefit) =>
      benefit.title.toLowerCase().includes(query)
    )

  )

}, [searchQuery])

  const [selectedService, setSelectedService] =

    useState<Service>(filteredServices[0] ?? SERVICES[0])

  const activeService =

    filteredServices.find(

      (service) => service.id === selectedService.id

    ) ?? filteredServices[0]

  return (

    <section className="relative mt-16">

      <div

        className="
          grid

          gap-8

          xl:grid-cols-[420px_1fr]

          2xl:grid-cols-[460px_1fr]
        "

      >

        {/* ===============================================
            Service Cards
        ================================================ */}

        <motion.div

          initial={{
            opacity: 0,
            x: -20,
          }}

          whileInView={{
            opacity: 1,
            x: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            duration: 0.6,
          }}

          className="
            space-y-5

            xl:sticky

            xl:top-24

            xl:max-h-[calc(100vh-8rem)]

            xl:overflow-y-auto

            xl:pr-2
          "
        >

          {filteredServices.length > 0 ? (

            filteredServices.map((service) => (

              <ServiceCard

                key={service.id}

                service={service}

                active={activeService?.id === service.id}

                onClick={() => setSelectedService(service)}

              />

            ))

          ) : (

            <div
              className="
                rounded-3xl

                border

                border-dashed

                border-slate-300

                bg-slate-50

                p-10

                text-center
              "
            >

              <h3
                className="
                  text-lg

                  font-bold

                  text-slate-900
                "
              >
                No matching services
              </h3>

              <p
                className="
                  mt-3

                  text-sm

                  leading-6

                  text-slate-500
                "
              >
                Try another keyword or browse all available relocation
                services.
              </p>

            </div>

          )}

        </motion.div>

        {/* ===============================================
            Preview Panel
        ================================================ */}

        <motion.div

          initial={{
            opacity: 0,
            x: 20,
          }}

          whileInView={{
            opacity: 1,
            x: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            delay: 0.15,
            duration: 0.6,
          }}

          className="
            min-w-0
          "

        >

          {activeService && (

            <ServicePreview

              service={activeService}

            />

          )}
        </motion.div>

      </div>

    </section>

  )

}

/* ===========================================================
   Future Enterprise Enhancements

   Phase 2
   ----------------------------------------------------------

   • Category Tabs
   • AI Recommended Services
   • Popular Services
   • Recently Viewed

   Phase 3
   ----------------------------------------------------------

   • Compare Multiple Services

   Home vs Office

   Corporate vs International

   Vehicle vs Storage

   Phase 4
   ----------------------------------------------------------

   • Vendor Marketplace Integration

   Available Vendors

   Best Price

   Best Rating

   Fastest Delivery

   Phase 5
   ----------------------------------------------------------

   • Dynamic Enterprise Dashboard

   Live Pricing

   AI Prediction

   Service Heatmap

   Demand Analytics

   Vendor Capacity

=========================================================== */