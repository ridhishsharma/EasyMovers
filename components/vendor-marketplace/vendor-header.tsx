"use client"

/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Header

   File: vendor-header.tsx

============================================================ */

import {

  ArrowRight,

  ShieldCheck,

} from "lucide-react"

import {

  Button,

} from "@/components/ui/button"

import {

  Badge,

} from "@/components/ui/badge"

import {

  Card,

  CardContent,

} from "@/components/ui/card"

import {

  MARKETPLACE_STATISTICS,

  VENDOR_MARKETPLACE_HEADER,

} from "./vendor.constants"

/* ============================================================
   Props
============================================================ */

export interface VendorHeaderProps {

  onExplore?: () => void

}

/* ============================================================
   Component
============================================================ */

export function VendorHeader({

  onExplore,

}: VendorHeaderProps) {

  return (

    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-muted/30">

      {/* Background Decoration */}

      <div className="absolute inset-0 opacity-40">

        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

      </div>

      <div className="relative z-10 px-8 py-16 lg:px-12">

        <div className="mx-auto max-w-6xl">

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">

            {/* ==================================================
                Left Content
            ================================================== */}

            <div className="space-y-8">

              <Badge

                variant="secondary"

                className="inline-flex items-center gap-2"

              >

                <ShieldCheck className="h-4 w-4" />

                {VENDOR_MARKETPLACE_HEADER.badge}

              </Badge>

              <div className="space-y-4">

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">

                  {VENDOR_MARKETPLACE_HEADER.title}

                </h1>

                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">

                  {VENDOR_MARKETPLACE_HEADER.subtitle}

                </p>

              </div>

              <div className="flex flex-wrap gap-4">

                <Button

                  size="lg"

                  onClick={onExplore}

                >

                  Explore Vendors

                  <ArrowRight className="ml-2 h-4 w-4" />

                </Button>

                <Button

                  variant="outline"

                  size="lg"

                >

                  Become a Partner

                </Button>

              </div>

            </div>

            {/* ==================================================
                Statistics
            ================================================== */}

            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">

              {MARKETPLACE_STATISTICS.map(stat => (

                <Card

                  key={stat.id}

                  className="border-border/60 bg-background/80 backdrop-blur"

                >

                  <CardContent className="p-6">

                    <div className="space-y-2">

                      <h2 className="text-3xl font-bold tracking-tight text-primary">

                        {stat.value}

                      </h2>

                      <h3 className="text-base font-semibold">

                        {stat.label}

                      </h3>

                      <p className="text-sm leading-6 text-muted-foreground">

                        {stat.description}

                      </p>

                    </div>

                  </CardContent>

                </Card>

              ))}

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

export default VendorHeader