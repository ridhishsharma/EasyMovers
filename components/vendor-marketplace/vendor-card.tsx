"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Card

   File: vendor-card.tsx

============================================================ */

import Image from "next/image"

import Link from "next/link"

import {

  BadgeCheck,

  Building2,

  Clock3,

  Globe,

  MapPin,

  Shield,

  Star,

  Truck,
Package,
Warehouse,

} from "lucide-react"

import {

  Badge,

} from "@/components/ui/badge"

import {

  Button,

} from "@/components/ui/button"

import {

  Card,

  CardContent,

  CardFooter,

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

export interface VendorCardProps {

  vendor: Vendor

  onSelect?: (vendor: Vendor) => void

  onCompare?: (vendor: Vendor) => void

  className?: string

}

/* ============================================================
   Component

============================================================ */

export function VendorCard({

  vendor,

  onSelect,

  onCompare,

  className,

}: VendorCardProps) {

  const {

    name,

    companyName,

    logo,

    coverImage,

    description,

    headquarters,

    verified,

    premium,

    featured,

    responseTime,

    badges,

    pricing,

    rating,

    insurance,

  } = vendor

  return (

    <Card

      className={cn(

        "group overflow-hidden transition-all duration-300",

        "hover:-translate-y-1",

        "hover:shadow-xl",

        className,

      )}

    >

      {/* ======================================================
          Cover Image
      ====================================================== */}

      <div className="relative h-44 w-full overflow-hidden">

        <Image

          src={coverImage ?? "/images/vendor-placeholder.jpg"}

          alt={name}

          fill

          priority={false}

          className={cn(

            "object-cover",

            "transition-transform duration-500",

            "group-hover:scale-105",

          )}

        />

        {/* Featured Badge */}

        {featured && (

          <Badge

            className="absolute left-4 top-4"

            variant="default"

          >

            Featured

          </Badge>

        )}

        {/* Premium Badge */}

        {premium && (

          <Badge

            className="absolute right-4 top-4"

            variant="secondary"

          >

            Premium

          </Badge>

        )}

      </div>

      {/* ======================================================
          Header
      ====================================================== */}

      <CardHeader className="space-y-4">

        <div className="flex items-start gap-4">

          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-background">

            <Image

              src={logo ?? "/image/New_Logo_NBG.png"}

              alt={companyName ?? "Vendor Logo"}
  fill
  className="object-contain"

            />

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <h3 className="truncate text-lg font-semibold">

                {name}

              </h3>

              {verified && (

                <BadgeCheck

                  className="h-5 w-5 text-green-600"

                />

              )}

            </div>

            <p className="truncate text-sm text-muted-foreground">

              {companyName}

            </p>

            <div className="mt-2 flex flex-wrap gap-2">

              {badges.map(badge => (

                <Badge

                  key={badge.id}

                  variant="outline"

                >

                  {badge.label}

                </Badge>

              ))}

            </div>

          </div>

        </div>

      </CardHeader>

      {/* ======================================================
          Content
      ====================================================== */}

      <CardContent className="space-y-5">

        <p className="line-clamp-3 text-sm text-muted-foreground">

          {description}

        </p>

        {/* Rating */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Star

              className="h-5 w-5 fill-yellow-400 text-yellow-400"

            />

            <span className="font-semibold">

              {rating.rating.toFixed(1)}

            </span>

            <span className="text-sm text-muted-foreground">

              ({rating.reviewCount.toLocaleString()} Reviews)

            </span>

          </div>

          <Badge>

            AI {rating.aiScore}

          </Badge>

        </div>

        {/* AI Score */}

        <div className="space-y-2">

          <div className="flex items-center justify-between text-sm">

            <span>AI Recommendation Score</span>

            <span className="font-medium">

              {rating.aiScore}%

            </span>

          </div>

          <Progress

            value={rating.aiScore}

          />

        </div>

        {/* Vendor Information */}

        <div className="space-y-3 text-sm">

          <div className="flex items-center gap-2">

            <MapPin className="h-4 w-4 text-muted-foreground" />

            <span>{headquarters}</span>

          </div>

          <div className="flex items-center gap-2">

            <Clock3 className="h-4 w-4 text-muted-foreground" />

            <span>Response Time: {responseTime}</span>

          </div>

          <div className="flex items-center gap-2">

            <Truck className="h-4 w-4 text-muted-foreground" />

            <span>

              {rating.completedMoves.toLocaleString()} Completed Moves

            </span>

          </div>

          {insurance.available && (

            <div className="flex items-center gap-2">

              <Shield className="h-4 w-4 text-green-600" />

              <span>

                Insured by {insurance.provider}

              </span>

            </div>

          )}

        </div>

        {/* Pricing */}

        <div className="rounded-xl border bg-muted/40 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">

                Starting From

              </p>

              <p className="mt-1 text-2xl font-bold">

                ₹{pricing.startingPrice.toLocaleString()}

              </p>

            </div>

            {pricing.instantQuotation && (

              <Badge variant="secondary">

                Instant Quote

              </Badge>

            )}

          </div>

        </div>

        {/* Services Preview */}

        <div>

          <h4 className="mb-3 text-sm font-semibold">

            Popular Services

          </h4>

          <div className="grid grid-cols-2 gap-2">

            {vendor.services.slice(0, 4).map(service => {

              const Icon = service.icon

              return (

                <div

                  key={service.id}

                  className="flex items-center gap-2 rounded-lg border p-2"

                >

                  <Icon className="h-4 w-4 text-primary" />

                  <span className="truncate text-xs">

                    {service.name}

                  </span>

                </div>

              )

            })}

          </div>

        </div>

        {/* Coverage */}

        <div>

          <h4 className="mb-2 text-sm font-semibold">

            Coverage

          </h4>

          <div className="flex flex-wrap gap-2">

            {vendor.coverage.slice(0, 3).map(location => (

              <Badge

                key={location.id}

                variant="outline"

              >

                {location.city}

              </Badge>

            ))}

          </div>

        </div>

        {/* Fleet Summary */}

        <div>

          <h4 className="mb-2 text-sm font-semibold">

            Fleet

          </h4>

          <div className="space-y-2">

            {vendor.fleet.slice(0, 2).map(vehicle => (

              <div

                key={vehicle.id}

                className="flex items-center justify-between rounded-lg border p-2"

              >

                <div className="flex items-center gap-2">

                  <Truck className="h-4 w-4 text-primary" />

                  <span className="text-sm">

                    {vehicle.vehicleType}

                  </span>

                </div>

                <Badge variant="outline">

                  {vehicle.quantity}

                </Badge>

              </div>

            ))}

          </div>

        </div>

      </CardContent>

      {/* ======================================================
          Footer
      ====================================================== */}

      <CardFooter className="flex flex-col gap-3">

        <Button

          className="w-full"

          size="lg"

          onClick={() => onSelect?.(vendor)}

        >

          Get Instant Quote

        </Button>

        <div className="grid w-full grid-cols-2 gap-3">

          <Button

            variant="outline"

            onClick={() => onCompare?.(vendor)}

          >

            Compare

          </Button>

          <Button

            variant="secondary"

            asChild

          >

            <Link

              href={`/vendors/${vendor.id}`}

            >

              View Details

            </Link>

          </Button>

        </div>

      </CardFooter>

    </Card>

  )

}

/* ============================================================
   Default Export
============================================================ */

export default VendorCard