"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Marketplace

   File: vendor-marketplace.tsx

============================================================ */

import {

  useVendors,

} from "./hooks/useVendors"

import {

  VendorFilter,

} from "./vendor-filter"

import {

  VendorGrid,

} from "./vendor-grid"

import {

  VendorHeader,

} from "./vendor-header"

import {

  VendorPreview,

} from "./vendor-preview"

import {

  VendorSearch,

} from "./vendor-search"

/* ============================================================
   Component
============================================================ */

export function VendorMarketplace() {

  const {

    vendors,

    selectedVendor,

    search,

    filter,

    sort,

    updateSearch,

    updateFilter,

    updateSort,

    selectVendor,

    reset,

  } = useVendors()

  return (

    <section className="space-y-10">

      {/* ==================================================
          Hero
      ================================================== */}

      <VendorHeader />

      {/* ==================================================
          Search + Filters
      ================================================== */}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        <VendorSearch

          value={search}

          onChange={updateSearch}

        />

        <VendorFilter

          filter={filter}

          sort={sort}

          onFilterChange={updateFilter}

          onSortChange={updateSort}

          onReset={reset}

        />

      </div>

      {/* ==================================================
          Marketplace Layout
      ================================================== */}

      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">

        {/* ================================================
            Vendor Grid
        ================================================ */}

        <VendorGrid

          onVendorSelect={selectVendor}

        />

        {/* ================================================
            Preview Panel
        ================================================ */}

        <div className="space-y-6">

          {selectedVendor ? (

            <VendorPreview

              vendor={selectedVendor}

            />

          ) : (

            <div className="rounded-2xl border bg-muted/20 p-8">

              <div className="space-y-4">

                <h3 className="text-xl font-semibold">

                  Vendor Preview

                </h3>

                <p className="text-sm leading-7 text-muted-foreground">

                  Select any vendor from the marketplace to
                  view a detailed summary including services,
                  pricing, coverage, AI recommendation score,
                  fleet information and certifications.

                </p>

              </div>

            </div>

          )}

          {/* ================================================
              Marketplace Summary
          ================================================ */}

          <div className="rounded-2xl border bg-background p-6">

            <h3 className="mb-4 text-lg font-semibold">

              Marketplace Summary

            </h3>

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-muted-foreground">

                  Vendors Loaded

                </span>

                <span className="font-semibold">

                  {vendors.length}

                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-muted-foreground">

                  Current Filter

                </span>

                <span className="font-semibold capitalize">

                  {filter}

                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-sm text-muted-foreground">

                  Sort Order

                </span>

                <span className="font-semibold capitalize">

                  {sort.replace("-", " ")}

                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorMarketplace