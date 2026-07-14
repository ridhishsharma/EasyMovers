"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: components/navigation/search-command.tsx
   Version: 1.0
============================================================ */

import { useEffect } from "react"

import {
  Search,
  MapPin,
  Truck,
  Building2,
  Package,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import type {
  SearchCommandProps,
  SearchResult,
} from "./types"

/* ============================================================
   Temporary Search Dataset

   Later this will come from

   KGME Search API

============================================================ */

const SEARCH_RESULTS: SearchResult[] = [

  {
    id: "service-house",

    title: "House Relocation",

    description:
      "Complete household shifting services.",

    href: "/services/house-relocation",

    icon: Package,

    category: "service",
  },

  {
    id: "service-office",

    title: "Office Relocation",

    description:
      "Corporate relocation solutions.",

    href: "/services/office-relocation",

    icon: Building2,

    category: "service",
  },

  {
    id: "vendor",

    title: "Find Vendors",

    description:
      "Search verified relocation vendors.",

    href: "/vendors",

    icon: Truck,

    category: "vendor",
  },

  {
    id: "city-ahmedabad",

    title: "Ahmedabad",

    description:
      "Moving services in Ahmedabad.",

    href: "/cities/ahmedabad",

    icon: MapPin,

    category: "service",
  },

]

/* ============================================================
   Component
============================================================ */

export default function SearchCommand({
  open,
  onOpenChange,
}: SearchCommandProps) {

  /* ==========================================================
     Keyboard Shortcut
     Ctrl + K
     Cmd + K
  ========================================================== */

  useEffect(() => {

    const down = (event: KeyboardEvent) => {

      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {

        event.preventDefault()

        onOpenChange(!open)

      }

    }

    document.addEventListener(
      "keydown",
      down
    )

    return () =>
      document.removeEventListener(
        "keydown",
        down
      )

  }, [open, onOpenChange])

  return (

    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
    >

      {/* =======================================================
          Search Input
      ======================================================== */}

      <CommandInput
        placeholder="
Search services,
cities,
vendors,
bookings...
"
      />

      <CommandList>

        <CommandEmpty>

          No matching results found.

        </CommandEmpty>

        {/* =======================================================
            Services
        ======================================================== */}

        <CommandGroup heading="Services">

          {SEARCH_RESULTS
            .filter(
              item =>
                item.category === "service"
            )
            .map((item) => {

              const Icon = item.icon

return (
  <CommandItem
    key={item.id}
    value={item.title}
  >
    {Icon && (
      <Icon
        className="
          mr-3
          h-4
          w-4
          text-orange-500
        "
      />
    )}

                  <div className="flex flex-col">

                    <span
                      className="
                        text-sm
                        font-medium
                        text-slate-900
                      "
                    >
                      {item.title}
                    </span>

                    {item.description && (

                      <span
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        {item.description}
                      </span>

                    )}

                  </div>

                </CommandItem>

              )

            })}

        </CommandGroup>

        <CommandSeparator />

        {/* =======================================================
            Vendors
        ======================================================== */}

        <CommandGroup heading="Partners & Vendors">

          {SEARCH_RESULTS
            .filter(
              item =>
                item.category === "vendor"
            )
            .map((item) => {

              const Icon = item.icon

              return (

                <CommandItem
                  key={item.id}
                  value={item.title}
                >

                  {Icon && (
      <Icon
        className="
          mr-3
          h-4
          w-4
          text-orange-500
        "
      />
    )}
                  <div className="flex flex-col">

                    <span
                      className="
                        text-sm
                        font-medium
                        text-slate-900
                      "
                    >
                      {item.title}
                    </span>

                    {item.description && (

                      <span
                        className="
                          text-xs
                          text-slate-500
                        "
                      >
                        {item.description}
                      </span>

                    )}

                  </div>

                </CommandItem>

              )

            })}

        </CommandGroup>

        <CommandSeparator />

        {/* =======================================================
            Corporate
        ======================================================== */}

        <CommandGroup heading="Corporate">

          <CommandItem value="Corporate Relocation">

            <Building2
              className="
                mr-3
                h-4
                w-4

                text-orange-500
              "
            />

            <div className="flex flex-col">

              <span className="text-sm font-medium">

                Corporate Relocation

              </span>

              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                Employee transfer and enterprise relocation.
              </span>

            </div>

          </CommandItem>

        </CommandGroup>

        <CommandSeparator />

        {/* =======================================================
            Bookings
        ======================================================== */}

        <CommandGroup heading="Bookings">

          <CommandItem value="Track Booking">

            <Package
              className="
                mr-3
                h-4
                w-4

                text-orange-500
              "
            />

            <div className="flex flex-col">

              <span className="text-sm font-medium">
                Track Booking
              </span>

              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                Track your ongoing relocation.
              </span>

            </div>

          </CommandItem>

          <CommandItem value="Booking History">

            <Package
              className="
                mr-3
                h-4
                w-4

                text-orange-500
              "
            />

            <div className="flex flex-col">

              <span className="text-sm font-medium">
                Booking History
              </span>

              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                View completed and active bookings.
              </span>

            </div>

          </CommandItem>

        </CommandGroup>

        <CommandSeparator />

        {/* =======================================================
            AI Search (Future KGME)
        ======================================================== */}

        <CommandGroup heading="AI Assistant">

          <CommandItem
            disabled
            value="AI Search"
          >

            <Search
              className="
                mr-3
                h-4
                w-4

                text-orange-500
              "
            />

            <div className="flex flex-col">

              <span className="text-sm font-medium">
                Enterprise AI Search
              </span>

              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                Powered by KGME • Coming Soon
              </span>

            </div>

          </CommandItem>

        </CommandGroup>

      </CommandList>

      {/* =======================================================
          Footer
      ======================================================== */}

      <div
        className="
          flex
          items-center
          justify-between

          border-t

          px-4
          py-3

          text-xs

          text-slate-500
        "
      >

        <span>
          Press <kbd className="rounded border px-1">Enter</kbd> to open
        </span>

        <span>
          <kbd className="rounded border px-1">Esc</kbd> to close
        </span>

      </div>

    </CommandDialog>

  )

}

/* ===========================================================
   Future Enterprise Roadmap
===========================================================

PHASE 1
--------------------------------------------

✔ Search Services

✔ Search Cities

✔ Search Vendors

✔ Search Bookings

--------------------------------------------

PHASE 2

Knowledge Graph Integration

GET

/api/search

Response

{
  query,
  services,
  vendors,
  cities,
  suggestions
}

--------------------------------------------

PHASE 3

Context Engine

Search understands

Example

User:

Move my car to Pune

↓

Automatically understands

Category

Vehicle Transport

Destination

Pune

Suggested Vendors

Estimated Price

--------------------------------------------

PHASE 4

Memory Engine

Example

User previously searched

Ahmedabad

↓

Next search

Suggest

Ahmedabad Vendors

Ahmedabad Packers

Ahmedabad Storage

--------------------------------------------

PHASE 5

Enterprise Search

Corporate

Employee

Vendor

Franchise

Booking

Invoice

All searchable.

--------------------------------------------

PHASE 6

Natural Language Search

Examples

"Move my office"

"Need cheapest mover"

"Find vendor near Indore"

"Track booking"

"What documents required?"

--------------------------------------------

PHASE 7

Semantic Search

Using

Embeddings

Vector Database

Knowledge Graph

LLM Ranking

--------------------------------------------

PHASE 8

AI Recommendation Engine

Suggest

Best Vendor

Fastest Vendor

Cheapest Vendor

Highest Rated Vendor

--------------------------------------------

PHASE 9

Voice Search

Speech Recognition

AI Parsing

KGME Query

--------------------------------------------

PHASE 10

Conversational Search

Instead of

Search Box

↓

Enterprise AI Assistant

Examples

User:

"I want to relocate my office next month."

AI

asks

Number of employees

Destination

Budget

Timeline

and creates quotation.

=========================================================== */