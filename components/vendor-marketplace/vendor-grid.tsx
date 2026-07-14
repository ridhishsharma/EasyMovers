"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Grid

   File: vendor-grid.tsx

============================================================ */

import {

  Loader2,

} from "lucide-react"

import {

  Button,

} from "@/components/ui/button"

import {

  Card,

  CardContent,

} from "@/components/ui/card"

import {

  VendorCard,

} from "./vendor-card"

import {

  useVendors,

} from "./hooks/useVendors"

import type {

  Vendor,

} from "./vendor.types"

/* ============================================================
   Props
============================================================ */

export interface VendorGridProps {

  onVendorSelect?: (

    vendor: Vendor,

  ) => void

  onVendorCompare?: (

    vendor: Vendor,

  ) => void

}

/* ============================================================
   Component
============================================================ */

export function VendorGrid({

  onVendorSelect,

  onVendorCompare,

}: VendorGridProps) {

  const {

    vendors,

    loading,

    error,

    page,

    totalPages,

    hasNextPage,

    hasPreviousPage,

    nextPage,

    previousPage,

    refresh,

  } = useVendors()

  /* ========================================================
     Loading State
  ======================================================== */

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <Loader2 className="h-10 w-10 animate-spin text-primary" />

      </div>

    )

  }

  /* ========================================================
     Error State
  ======================================================== */

  if (error) {

    return (

      <Card>

        <CardContent className="flex flex-col items-center gap-4 py-16">

          <h3 className="text-xl font-semibold">

            Unable to Load Vendors

          </h3>

          <p className="text-center text-muted-foreground">

            {error}

          </p>

          <Button

            onClick={refresh}

          >

            Retry

          </Button>

        </CardContent>

      </Card>

    )

  }

  /* ========================================================
     Empty State
  ======================================================== */

  if (!vendors.length) {

    return (

      <Card>

        <CardContent className="flex flex-col items-center gap-4 py-16">

          <h3 className="text-xl font-semibold">

            No Vendors Found

          </h3>

          <p className="text-center text-muted-foreground">

            Try adjusting your filters or search criteria.

          </p>

        </CardContent>

      </Card>

    )

  }

  return (

    <div className="space-y-8">

      {/* ====================================================
          Vendor Grid
      ==================================================== */}

      <div
        className="
          grid
          gap-6
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {vendors.map(vendor => (

          <VendorCard

            key={vendor.id}

            vendor={vendor}

            onSelect={onVendorSelect}

            onCompare={onVendorCompare}

          />

        ))}

      </div>

      {/* ====================================================
          Pagination
      ==================================================== */}

      <div className="flex flex-col items-center gap-6 border-t pt-8">

        <div className="flex items-center gap-2 text-sm text-muted-foreground">

          <span>

            Page

          </span>

          <span className="font-semibold text-foreground">

            {page}

          </span>

          <span>

            of

          </span>

          <span className="font-semibold text-foreground">

            {totalPages}

          </span>

        </div>

        <div className="flex items-center gap-4">

          <Button

            variant="outline"

            disabled={!hasPreviousPage}

            onClick={previousPage}

          >

            Previous

          </Button>

          <Button

            disabled={!hasNextPage}

            onClick={nextPage}

          >

            Next

          </Button>

        </div>

      </div>

    </div>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorGrid