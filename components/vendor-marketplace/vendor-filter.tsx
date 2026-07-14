"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Filter

   File: vendor-filter.tsx

============================================================ */

import {

  SlidersHorizontal,

} from "lucide-react"

import {

  Button,

} from "@/components/ui/button"

import {

  Label,

} from "@/components/ui/label"

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select"

import {

  VENDOR_FILTERS,

  VENDOR_SORT_OPTIONS,

} from "./vendor.constants"

/* ============================================================
   Props
============================================================ */

export interface VendorFilterProps {

  filter: string

  sort: string

  onFilterChange: (

    value: string,

  ) => void

  onSortChange: (

    value: string,

  ) => void

  onReset?: () => void

}

/* ============================================================
   Component
============================================================ */

export function VendorFilter({

  filter,

  sort,

  onFilterChange,

  onSortChange,

  onReset,

}: VendorFilterProps) {

  return (

    <div className="rounded-2xl border bg-background p-6">

      <div className="mb-6 flex items-center gap-2">

        <SlidersHorizontal className="h-5 w-5" />

        <h2 className="text-lg font-semibold">

          Filter Vendors

        </h2>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* ================================================
            Filter
        ================================================ */}

        <div className="space-y-2">

          <Label>

            Service Category

          </Label>

          <Select

            value={filter}

            onValueChange={onFilterChange}

          >

            <SelectTrigger>

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              {VENDOR_FILTERS.map(option => (

                <SelectItem

                  key={option.value}

                  value={option.value}

                >

                  {option.label}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>

        {/* ================================================
            Sort
        ================================================ */}

        <div className="space-y-2">

          <Label>

            Sort By

          </Label>

          <Select

            value={sort}

            onValueChange={onSortChange}

          >

            <SelectTrigger>

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              {VENDOR_SORT_OPTIONS.map(option => (

                <SelectItem

                  key={option.value}

                  value={option.value}

                >

                  {option.label}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>

      </div>

      {/* ==================================================
          Actions
      ================================================== */}

      <div className="mt-8 flex items-center justify-end">

        <Button

          variant="outline"

          onClick={onReset}

        >

          Reset Filters

        </Button>

      </div>

    </div>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorFilter