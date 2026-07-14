"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Enterprise Service Search

   File: service-search.tsx

   Version: 1.0
============================================================ */

import { useMemo, useState } from "react"

import { motion } from "framer-motion"

import {

  Search,

  Sparkles,

  X,

} from "lucide-react"

import { Input } from "@/components/ui/input"

import { Badge } from "@/components/ui/badge"

import {

  SERVICE_SEARCH_SUGGESTIONS,

} from "./service.constants"

import type {

  ServiceSearchProps,

} from "./service.types"

/* ============================================================
   Component
============================================================ */

export default function ServiceSearch({

  value,

  onChange,

}: ServiceSearchProps) {

  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(() => {

    if (!value.trim()) {

      return SERVICE_SEARCH_SUGGESTIONS

    }

    return SERVICE_SEARCH_SUGGESTIONS.filter((item) =>

      item.toLowerCase().includes(value.toLowerCase())

    )

  }, [value])

  return (

    <div className="relative w-full">

      {/* ===============================================
          Search Container
      ================================================ */}

      <motion.div

        animate={{
          scale: focused ? 1.01 : 1,
        }}

        transition={{
          duration: 0.2,
        }}

        className="
          relative

          overflow-hidden

          rounded-2xl

          border

          border-slate-200

          bg-white

          shadow-lg

          transition-all

          duration-300

          focus-within:border-orange-400

          focus-within:shadow-xl
        "

      >

        <Search

          className="
            absolute

            left-5

            top-1/2

            h-5

            w-5

            -translate-y-1/2

            text-slate-400
          "

        />

        <Input

          value={value}

          onChange={(e) => onChange(e.target.value)}

          onFocus={() => setFocused(true)}

          onBlur={() => setFocused(false)}

          placeholder="Search relocation services..."

          className="
            h-16

            border-0

            bg-transparent

            pl-14

            pr-28

            text-base

            placeholder:text-slate-400

            focus-visible:ring-0

            focus-visible:ring-offset-0
          "
        />

        {/* ===============================================
            Clear Button
        ================================================ */}

        {value && (

          <button

            type="button"

            onClick={() => onChange("")}

            className="
              absolute

              right-16

              top-1/2

              -translate-y-1/2

              rounded-full

              p-1.5

              text-slate-400

              transition-colors

              hover:bg-slate-100

              hover:text-slate-700
            "

          >

            <X className="h-4 w-4" />

          </button>

        )}

        {/* ===============================================
            AI Badge
        ================================================ */}

        <Badge

          className="
            absolute

            right-4

            top-1/2

            -translate-y-1/2

            border-0

            bg-orange-500

            px-3

            py-1

            text-white

            shadow-sm
          "

        >

          <Sparkles className="mr-1 h-3.5 w-3.5" />

          AI

        </Badge>

      </motion.div>

      {/* ===============================================
          Suggestions Dropdown
      ================================================ */}

      {focused && suggestions.length > 0 && (

        <motion.div

          initial={{
            opacity: 0,
            y: 8,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          exit={{
            opacity: 0,
          }}

          transition={{
            duration: 0.2,
          }}

          className="
            absolute

            left-0

            right-0

            z-20

            mt-3

            rounded-2xl

            border

            border-slate-200

            bg-white

            p-4

            shadow-2xl
          "
        >
          <p
            className="
              mb-3

              text-xs

              font-semibold

              uppercase

              tracking-wide

              text-slate-500
            "
          >
            Popular Searches
          </p>

          <div
            className="
              flex

              flex-wrap

              gap-2
            "
          >

            {suggestions.map((suggestion) => (

              <button

                key={suggestion}

                type="button"

                onMouseDown={(e) => e.preventDefault()}

                onClick={() => onChange(suggestion)}

                className="
                  rounded-full

                  border

                  border-slate-200

                  bg-slate-50

                  px-4

                  py-2

                  text-sm

                  font-medium

                  text-slate-700

                  transition-all

                  duration-200

                  hover:border-orange-300

                  hover:bg-orange-50

                  hover:text-orange-600
                "

              >

                {suggestion}

              </button>

            ))}

          </div>

          {/* ===============================================
              AI Hint
          ================================================ */}

          <div
            className="
              mt-5

              flex

              items-start

              gap-3

              rounded-xl

              bg-orange-50

              p-3
            "
          >

            <Sparkles
              className="
                mt-0.5

                h-4

                w-4

                text-orange-500
              "
            />

            <div>

              <p
                className="
                  text-sm

                  font-semibold

                  text-slate-900
                "
              >
                AI Smart Search
              </p>

              <p
                className="
                  mt-1

                  text-xs

                  leading-5

                  text-slate-600
                "
              >
                Search by service, city, relocation type or business requirement.
              </p>

            </div>

          </div>
        </motion.div>

      )}

      {/* ===============================================
          Search Footer
      ================================================ */}

      <div
        className="
          mt-3

          flex

          flex-wrap

          items-center

          justify-between

          gap-3

          px-1
        "
      >

        <p
          className="
            text-xs

            text-slate-500
          "
        >
          Try searching:
          <span className="ml-1 font-medium text-slate-700">
            House Shifting
          </span>,
          <span className="ml-1 font-medium text-slate-700">
            Office Relocation
          </span>,
          <span className="ml-1 font-medium text-slate-700">
            Vehicle Transport
          </span>
        </p>

        <div
          className="
            flex

            items-center

            gap-2

            rounded-full

            bg-orange-50

            px-3

            py-1.5
          "
        >

          <Sparkles
            className="
              h-3.5

              w-3.5

              text-orange-500
            "
          />

          <span
            className="
              text-xs

              font-medium

              text-orange-700
            "
          >
            AI Assisted Search
          </span>

        </div>

      </div>

    </div>

  )

}

/* ===========================================================
   Future Enhancements

   • Voice Search
   • AI Natural Language Queries
   • Location-aware Suggestions
   • Recent Searches
   • Search Analytics
   • Vendor Auto-Recommendation
=========================================================== */