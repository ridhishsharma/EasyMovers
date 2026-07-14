"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Preview

   File: vendor-preview.tsx

============================================================ */

import Image from "next/image"

import {

  BadgeCheck,

  Clock3,

  MapPin,

  Shield,

  Star,

} from "lucide-react"

import {

  Badge,

} from "@/components/ui/badge"

import {

  Card,

  CardContent,

  CardHeader,

} from "@/components/ui/card"

import {

  Progress,

} from "@/components/ui/progress"

import {

  cn,

} from "@/lib/utils"

import type {

  Vendor,

} from "./vendor.types"

/* ============================================================
   Props
============================================================ */

export interface VendorPreviewProps {

  vendor: Vendor

  className?: string

}

/* ============================================================
   Component
============================================================ */

export function VendorPreview({

  vendor,

  className,

}: VendorPreviewProps) {

  return (

    <Card

      className={cn(

        "overflow-hidden",

        className,

      )}

    >

      <CardHeader>

        <div className="flex items-center gap-4">

          <div className="relative h-16 w-16 overflow-hidden rounded-xl border bg-background">

            <Image

               src={vendor.logo ?? "/images/vendor-placeholder.jpg"}
  alt={vendor.name ?? "Vendor Logo"}

              fill

              className="object-contain p-2"

            />

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <h3 className="truncate text-lg font-semibold">

                {vendor.name}

              </h3>

              {vendor.verified && (

                <BadgeCheck className="h-5 w-5 text-green-600" />

              )}

            </div>

            <p className="text-sm text-muted-foreground">

              {vendor.companyName}

            </p>

          </div>

        </div>

      </CardHeader>

      <CardContent className="space-y-5">

        {/* ================================================
            Description
        ================================================ */}

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">

          {vendor.description}

        </p>

        {/* ================================================
            Rating
        ================================================ */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Star

              className="h-5 w-5 fill-yellow-400 text-yellow-400"

            />

            <span className="font-semibold">

              {vendor.rating.rating.toFixed(1)}

            </span>

            <span className="text-sm text-muted-foreground">

              ({vendor.rating.reviewCount.toLocaleString()})

            </span>

          </div>

          <Badge>

            AI {vendor.rating.aiScore}

          </Badge>

        </div>

        {/* ================================================
            AI Recommendation
        ================================================ */}

        <div className="space-y-2">

          <div className="flex items-center justify-between text-sm">

            <span>AI Recommendation</span>

            <span className="font-medium">

              {vendor.rating.aiScore}%

            </span>

          </div>

          <Progress

            value={vendor.rating.aiScore}

          />

        </div>

        {/* ================================================
            Pricing
        ================================================ */}

        <div className="rounded-xl border bg-muted/40 p-4">

          <p className="text-xs uppercase tracking-wide text-muted-foreground">

            Starting Price

          </p>

          <p className="mt-1 text-2xl font-bold">

            ₹{vendor.pricing.startingPrice.toLocaleString()}

          </p>

        </div>

        {/* ================================================
            Quick Information
        ================================================ */}

        <div className="space-y-3 text-sm">

          <div className="flex items-center gap-2">

            <MapPin className="h-4 w-4 text-muted-foreground" />

            <span>

              {vendor.headquarters}

            </span>

          </div>

          <div className="flex items-center gap-2">

            <Clock3 className="h-4 w-4 text-muted-foreground" />

            <span>

              Response Time:

              {" "}

              {vendor.responseTime}

            </span>

          </div>

          {vendor.insurance.available && (

            <div className="flex items-center gap-2">

              <Shield className="h-4 w-4 text-green-600" />

              <span>

                {vendor.insurance.provider}

              </span>

            </div>

          )}

        </div>

        {/* ================================================
            Popular Services
        ================================================ */}

        <div>

          <h4 className="mb-3 text-sm font-semibold">

            Services

          </h4>

          <div className="flex flex-wrap gap-2">

            {vendor.services

              .slice(0, 4)

              .map(service => (

                <Badge

                  key={service.id}

                  variant="outline"

                >

                  {service.name}

                </Badge>

              ))}

          </div>

        </div>

        {/* ================================================
            Coverage
        ================================================ */}

        <div>

          <h4 className="mb-3 text-sm font-semibold">

            Coverage

          </h4>

          <div className="flex flex-wrap gap-2">

            {vendor.coverage

              .slice(0, 4)

              .map(location => (

                <Badge

                  key={location.id}

                  variant="secondary"

                >

                  {location.city}

                </Badge>

              ))}

          </div>

        </div>

        {/* ================================================
            Fleet
        ================================================ */}

        <div>

          <h4 className="mb-3 text-sm font-semibold">

            Fleet

          </h4>

          <div className="space-y-2">

            {vendor.fleet

              .slice(0, 2)

              .map(vehicle => (

                <div

                  key={vehicle.id}

                  className="flex items-center justify-between rounded-lg border p-2"

                >

                  <span className="text-sm">

                    {vehicle.vehicleType}

                  </span>

                  <Badge

                    variant="outline"

                  >

                    {vehicle.quantity}

                  </Badge>

                </div>

              ))}

          </div>

        </div>

        {/* ================================================
            Certifications
        ================================================ */}

        {vendor.certificates.length > 0 && (

          <div>

            <h4 className="mb-3 text-sm font-semibold">

               certificates            </h4>

            <div className="flex flex-wrap gap-2">

              {vendor. certificates.slice(0, 4)

                .map(certificates => (

                  <Badge

                    key={certificates.id}

                    variant="outline"

                  >

                    {certificates.title}

                  </Badge>

                ))}

            </div>

          </div>

        )}

      </CardContent>

    </Card>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorPreview