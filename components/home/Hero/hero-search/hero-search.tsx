"use client"

/* ============================================================
   Easy Movers Enterprise Platform
   Hero Search Widget
   File: hero-search.tsx
   Version: 1.0
============================================================ */

import { useState } from "react"

import { motion } from "framer-motion"

import {
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

/* ============================================================
   Component
============================================================ */

export default function HeroSearch() {

  const [moveType, setMoveType] =
    useState("home")

  const [moveFrom, setMoveFrom] =
    useState("")

  const [moveTo, setMoveTo] =
    useState("")

  const [moveDate, setMoveDate] =
    useState("")

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 40,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        delay: 0.9,
        duration: 0.8,
      }}

      className="mt-12"

    >

      <Card
        className="
          overflow-hidden

          rounded-3xl

          border

          border-slate-200

          bg-white/90

          shadow-2xl

          backdrop-blur-xl
        "
      >

        <CardContent
          className="
            p-8
            lg:p-10
          "
        >

          {/* ===================================================
              Header
          ==================================================== */}

          <div
            className="
              mb-8

              flex
              items-center
              gap-3
            "
          >

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

              <Sparkles className="h-6 w-6 text-orange-600" />

            </div>
            <div className="flex flex-col">

              <h3
                className="
                  text-2xl
                  font-bold

                  text-slate-900
                "
              >
                Get Your Instant AI Quote
              </h3>

              <p
                className="
                  mt-1

                  text-sm

                  text-slate-500
                "
              >
                Compare verified movers, transparent pricing,
                and instant recommendations powered by AI.
              </p>

            </div>

          </div>

          {/* ===================================================
              Locations
          ==================================================== */}

          <div
            className="
              grid

              gap-6

              lg:grid-cols-2
            "
          >

            {/* ===============================================
                Move From
            ================================================ */}

            <div className="space-y-3">

              <Label
                htmlFor="moveFrom"
                className="
                  text-sm
                  font-semibold

                  text-slate-700
                "
              >
                Move From
              </Label>

              <div className="relative">

                <MapPin
                  className="
                    absolute

                    left-4
                    top-1/2

                    h-5
                    w-5

                    -translate-y-1/2

                    text-orange-500
                  "
                />

                <Input

                  id="moveFrom"

                  placeholder="Ahmedabad"

                  value={moveFrom}

                  onChange={(event) =>
                    setMoveFrom(event.target.value)
                  }

                  className="
                    h-14

                    rounded-2xl

                    border-slate-300

                    pl-12

                    text-base

                    shadow-sm

                    transition-all

                    focus:border-orange-500
                    focus:ring-orange-500
                  "
                />

              </div>

            </div>

            {/* ===============================================
                Move To
            ================================================ */}

            <div className="space-y-3">

              <Label
                htmlFor="moveTo"
                className="
                  text-sm
                  font-semibold

                  text-slate-700
                "
              >
                Move To
              </Label>

              <div className="relative">

                <MapPin
                  className="
                    absolute

                    left-4
                    top-1/2

                    h-5
                    w-5

                    -translate-y-1/2

                    text-blue-500
                  "
                />

                <Input
                  id="moveTo"

                  placeholder="Pune"

                  value={moveTo}

                  onChange={(event) =>
                    setMoveTo(event.target.value)
                  }

                  className="
                    h-14

                    rounded-2xl

                    border-slate-300

                    pl-12

                    text-base

                    shadow-sm

                    transition-all

                    focus:border-blue-500
                    focus:ring-blue-500
                  "
                />

              </div>

            </div>

          </div>

          {/* ===================================================
              Move Type
          ==================================================== */}

          <div className="mt-8">

            <Label
              className="
                mb-4

                block

                text-sm
                font-semibold

                text-slate-700
              "
            >
              Move Type
            </Label>

            <RadioGroup

              value={moveType}

              onValueChange={setMoveType}

              className="
                grid

                gap-4

                sm:grid-cols-2

                xl:grid-cols-4
              "
            >

              {/* ============================================
                  Home Relocation
              ============================================= */}

              <Label
                htmlFor="home"

                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3

                  rounded-2xl

                  border

                  p-5

                  transition-all
                  duration-300

                  hover:border-orange-400
                  hover:bg-orange-50

                  ${
                    moveType === "home"
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-slate-200"
                  }
                `}
              >

                <RadioGroupItem
                  id="home"
                  value="home"
                />

                <div>

                  <div
                    className="
                      text-sm
                      font-semibold
                    "
                  >
                    Home
                  </div>

                  <div
                    className="
                      text-xs
                      text-slate-500
                    "
                  >
                    Household relocation
                  </div>

                </div>

              </Label>

              {/* ============================================
                  Office Relocation
              ============================================= */}

              <Label
                htmlFor="office"

                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3

                  rounded-2xl

                  border

                  p-5

                  transition-all
                  duration-300

                  hover:border-orange-400
                  hover:bg-orange-50

                  ${
                    moveType === "office"
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-slate-200"
                  }
                `}
              >

                <RadioGroupItem
                  id="office"
                  value="office"
                />

                <div>

                  <div className="text-sm font-semibold">
                    Office
                  </div>

                  <div className="text-xs text-slate-500">
                    Office & commercial shifting
                  </div>

                </div>

              </Label>

              {/* ============================================
                  Vehicle Transport
              ============================================= */}

              <Label
                htmlFor="vehicle"

                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3

                  rounded-2xl

                  border

                  p-5

                  transition-all
                  duration-300

                  hover:border-orange-400
                  hover:bg-orange-50

                  ${
                    moveType === "vehicle"
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-slate-200"
                  }
                `}
              >

                <RadioGroupItem
                  id="vehicle"
                  value="vehicle"
                />

                <div>

                  <div className="text-sm font-semibold">
                    Vehicle
                  </div>

                  <div className="text-xs text-slate-500">
                    Car & bike transportation
                  </div>

                </div>

              </Label>

              {/* ============================================
                  Corporate Relocation
              ============================================= */}

              <Label
                htmlFor="corporate"

                className={`
                  flex
                  cursor-pointer
                  items-center
                  gap-3

                  rounded-2xl

                  border

                  p-5

                  transition-all
                  duration-300

                  hover:border-orange-400
                  hover:bg-orange-50

                  ${
                    moveType === "corporate"
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-slate-200"
                  }
                `}
              >

                <RadioGroupItem
                  id="corporate"
                  value="corporate"
                />

                <div>

                  <div className="text-sm font-semibold">
                    Corporate
                  </div>

                  <div className="text-xs text-slate-500">
                    Employee transfer & enterprise moves
                  </div>

                </div>

              </Label>

            </RadioGroup>

          </div>

          {/* ===================================================
              Move Date
          ==================================================== */}

          <div className="mt-8">

            <Label
              htmlFor="moveDate"
              className="
                mb-3

                block

                text-sm
                font-semibold

                text-slate-700
              "
            >
              Preferred Moving Date
            </Label>

            <div className="relative">

              <Calendar
                className="
                  absolute

                  left-4
                  top-1/2

                  h-5
                  w-5

                  -translate-y-1/2

                  text-orange-500
                "
              />

              <Input

                id="moveDate"

                type="date"

                value={moveDate}

                onChange={(event) =>
                  setMoveDate(event.target.value)
                }

                className="
                  h-14

                  rounded-2xl

                  border-slate-300

                  pl-12

                  text-base

                  shadow-sm

                  transition-all

                  focus:border-orange-500
                  focus:ring-orange-500
                "
              />

            </div>

          </div>

          {/* ===================================================
              AI Recommendation
          ==================================================== */}

          <motion.div

            initial={{
              opacity: 0,
            }}

            animate={{
              opacity: 1,
            }}

            transition={{
              delay: 1.1,
              duration: 0.8,
            }}

            className="
              mt-8

              rounded-2xl

              border
              border-orange-100

              bg-orange-50

              p-5
            "
          >

            <div className="flex items-start gap-3">

              <Sparkles
                className="
                  mt-0.5

                  h-5
                  w-5

                  shrink-0

                  text-orange-500
                "
              />

              <div>

                <h4
                  className="
                    text-sm
                    font-semibold

                    text-slate-900
                  "
                >
                  AI Recommendation
                </h4>

                <p
                  className="
                    mt-1

                    text-sm

                    leading-6

                    text-slate-600
                  "
                >
                  Our AI compares 6,500+ verified movers,
                  analyzes historical pricing,
                  transit time,
                  vendor ratings,
                  and availability to recommend
                  the most suitable relocation partner.
                </p>

              </div>

            </div>

          </motion.div>

          {/* ===================================================
              AI Quote Button
          ==================================================== */}

          <div className="mt-10">

            <Button

              className="
                h-16
                w-full

                rounded-2xl

                bg-orange-500

                text-lg
                font-semibold

                shadow-xl
                shadow-orange-500/30

                transition-all
                duration-300

                hover:-translate-y-1
                hover:bg-orange-600
                hover:shadow-2xl
                hover:shadow-orange-500/40
              "

              disabled={
                !moveFrom ||
                !moveTo ||
                !moveDate
              }

            >

              <Sparkles
                className="
                  mr-3

                  h-5
                  w-5
                "
              />

              Get Instant AI Quote

            </Button>

            {/* ===============================================
                Helper Text
            ================================================ */}

            <div
              className="
                mt-5

                flex
                flex-wrap

                items-center
                justify-center

                gap-3

                text-center

                text-sm

                text-slate-500
              "
            >

              <span>

                ✔ Compare 6,500+ Verified Movers

              </span>

              <span className="hidden sm:block">

                •

              </span>

              <span>

                ✔ Transparent Pricing

              </span>

              <span className="hidden sm:block">

                •

              </span>

              <span>

                ✔ AI Powered Recommendation

              </span>

            </div>

          </div>

        </CardContent>

      </Card>

    </motion.div>

  )

}

/* ===========================================================
   Future Enterprise Roadmap
===========================================================

Phase 2
--------------------------------------------

Replace Inputs with

Google Places Autocomplete

--------------------------------------------

Phase 3

KGME Integration

/api/quote

↓

Destination Intelligence

↓

Distance Engine

↓

Vendor Matching

↓

Pricing Engine

--------------------------------------------

Phase 4

AI Recommendation

Best Vendor

Cheapest Vendor

Fastest Vendor

Highest Rated Vendor

Insurance Included

--------------------------------------------

Phase 5

Corporate Mode

Employee Transfer

Bulk Relocation

Approval Workflow

Corporate API

--------------------------------------------

Phase 6

Instant Pricing

Packing

Loading

Transportation

Insurance

Storage

GST

Everything calculated automatically.

--------------------------------------------

Phase 7

Voice Assistant

"Move my office from Ahmedabad to Pune"

↓

AI fills entire form automatically.

--------------------------------------------

Phase 8

Smart Suggestions

Previous Address

Saved Locations

Frequent Routes

Recent Bookings

KGME Memory Engine

=========================================================== */