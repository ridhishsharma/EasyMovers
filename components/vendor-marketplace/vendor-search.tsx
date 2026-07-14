"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Search

   File: vendor-search.tsx

============================================================ */

import {

  Search,

  X,

} from "lucide-react"

import {

  Button,

} from "@/components/ui/button"

import {

  Input,

} from "@/components/ui/input"

import {

  SEARCH_PLACEHOLDER,

} from "./vendor.constants"

/* ============================================================
   Props
============================================================ */

export interface VendorSearchProps {

  value: string

  onChange: (value: string) => void

  placeholder?: string

  disabled?: boolean

}

/* ============================================================
   Component
============================================================ */

export function VendorSearch({

  value,

  onChange,

  placeholder = SEARCH_PLACEHOLDER,

  disabled = false,

}: VendorSearchProps) {

  return (

    <div className="relative w-full">

      {/* Search Icon */}

      <Search

        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"

      />

      {/* Input */}

      <Input

        value={value}

        disabled={disabled}

        placeholder={placeholder}

        onChange={(event) =>

          onChange(event.target.value)

        }

        className="h-12 pl-12 pr-14 text-base"

      />

      {/* Clear Button */}

      {value.length > 0 && (

        <Button

          type="button"

          variant="ghost"

          size="icon"

          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"

          onClick={() => onChange("")}

        >

          <X className="h-4 w-4" />

        </Button>

      )}

    </div>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorSearch