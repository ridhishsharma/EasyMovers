"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: components/navigation/mobile-drawer.tsx
   Version: 1.0
============================================================ */

import Link from "next/link"
import Image from "next/image"

import {
  ChevronDown,
  ChevronRight,
  Search,
  Phone,
  MessageCircle,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { Button } from "@/components/ui/button"

import {
  PRIMARY_NAVIGATION,
  LOGIN_ROLES,
} from "./navigation-config"

import type {
  MobileDrawerProps,
  NavigationItem,
  NavigationChild,
} from "./types"

/* ============================================================
   Component
============================================================ */

export default function MobileDrawer({
  open,
  onOpenChange,
  user,
}: MobileDrawerProps) {

  return (

    <div className="flex h-full flex-col">

      {/* =======================================================
          Header
      ======================================================== */}

      <div
        className="
          flex
          items-center
          gap-4
          border-b
          border-slate-200
          px-6
          py-5
        "
      >

        {/* Logo */}

        <div
          className="
            relative
            h-12
            w-12
            overflow-hidden
            rounded-xl
            bg-white
            shadow
          "
        >

          <Image
            src="/logo.png"
            alt="Easy Movers"
            fill
            priority
            className="object-contain p-1"
          />

        </div>

        {/* Brand */}

        <div>

          <h2
            className="
              text-lg
              font-bold
              text-slate-900
            "
          >
            Easy Movers
          </h2>

          <p
            className="
              text-xs
              text-slate-500
            "
          >
            India's Intelligent Relocation Platform
          </p>

        </div>

      </div>

      {/* =======================================================
          Search
      ======================================================== */}

      <div className="border-b px-5 py-4">

        <Button
          variant="outline"
          className="
            flex
            h-11
            w-full
            items-center
            justify-start
            gap-3
            rounded-xl
          "
        >

          <Search className="h-4 w-4 text-slate-500" />

          <span className="text-sm text-slate-500">
            Search services, cities...
          </span>

        </Button>

      </div>

      {/* =======================================================
          Navigation
      ======================================================== */}

      <div className="flex-1 overflow-y-auto px-2 py-4">

        <Accordion
          type="multiple"
          className="w-full"
        >

          {PRIMARY_NAVIGATION.map((item: NavigationItem) => {

            // ------------------------------------
            // Standard Links
            // ------------------------------------

            if (!item.megaMenu) {

              return (

                <Link
                  key={item.id}
                  href={item.href ?? "#"}
                  onClick={() => onOpenChange(false)}
                  className="
                    flex
                    items-center
                    gap-3

                    rounded-xl

                    px-4
                    py-3

                    text-sm
                    font-medium

                    text-slate-700

                    transition-all

                    hover:bg-orange-50
                    hover:text-orange-600
                  "
                >

                  {item.icon && (

                    <item.icon
                      className="h-5 w-5"
                    />

                  )}

                  <span>

                    {item.title}

                  </span>

                </Link>

              )
            }

            // ------------------------------------
            // Mega Menu Accordions
            // ------------------------------------

            return (

              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-none"
              >

                <AccordionTrigger
                  className="
                    rounded-xl
                    px-4
                    py-3

                    text-sm
                    font-semibold

                    hover:bg-orange-50
                    hover:text-orange-600

                    no-underline
                  "
                >

                  <div className="flex items-center gap-3">

                    {item.icon && (
                      <item.icon className="h-5 w-5" />
                    )}

                    {item.title}

                  </div>

                </AccordionTrigger>

                <AccordionContent className="pb-2">

                  <div className="space-y-2 pl-4">

                    {item.children?.map(
                      (child: NavigationChild) => {

                        const Icon = child.icon

                        return (

                          <Link
                            key={child.id}
                            href={
                              child.disabled
                                ? "#"
                                : child.href
                            }

                            onClick={() => {
                              if (!child.disabled) {
                                onOpenChange(false)
                              }
                            }}

                            aria-disabled={child.disabled}

                            className={`
                              group
                              relative

                              flex
                              items-start
                              gap-3

                              rounded-xl

                              border

                              p-3

                              transition-all
                              duration-300

                              ${
                                child.disabled
                                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-70"
                                  : "border-transparent hover:border-orange-200 hover:bg-orange-50"
                              }
                            `}
                          >

                            {/* Icon */}

                            <div
                              className={`
                                mt-1
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center

                                rounded-lg

                                ${
                                  child.disabled
                                    ? "bg-slate-200 text-slate-500"
                                    : "bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white"
                                }

                                transition-colors
                                duration-300
                              `}
                            >

                              <Icon className="h-5 w-5" />

                            </div>

                            {/* Content */}

                            <div className="flex-1">

                              <div className="flex items-center gap-2">

                                <h4
                                  className="
                                    text-sm
                                    font-semibold
                                    text-slate-900
                                  "
                                >
                                  {child.title}
                                </h4>

                                {child.badge && (

                                  <span
                                    className="
                                      rounded-full
                                      bg-orange-100
                                      px-2
                                      py-0.5

                                      text-[10px]
                                      font-semibold

                                      uppercase

                                      text-orange-600
                                    "
                                  >
                                    {child.badge}
                                  </span>

                                )}

                              </div>

                              <p
                                className="
                                  mt-1

                                  text-xs

                                  leading-5

                                  text-slate-500
                                "
                              >
                                {child.description}
                              </p>

                              {/* Right Arrow */}

                              {!child.disabled && (

                                <ChevronRight
                                  className="
                                    absolute
                                    right-4
                                    top-1/2

                                    h-4
                                    w-4

                                    -translate-y-1/2

                                    text-slate-300

                                    transition-all
                                    duration-300

                                    group-hover:translate-x-1
                                    group-hover:text-orange-500
                                  "
                                />

                              )}

                              {/* Disabled Overlay */}

                              {child.disabled && (

                                <div
                                  className="
                                    absolute
                                    inset-0

                                    rounded-xl

                                    bg-white/30
                                    backdrop-blur-[1px]
                                  "
                                />

                              )}

                            </div>

                          </Link>

                        )

                      }

                    )}

                  </div>

                </AccordionContent>

              </AccordionItem>

            )

          })}

        </Accordion>

      </div>

      {/* =======================================================
          Authentication Section
      ======================================================== */}

      <div
        className="
          border-t
          border-slate-200

          px-5
          py-5
        "
      >

        {!user && (

          <div className="space-y-2">

            <h3
              className="
                mb-2

                text-xs

                font-semibold

                uppercase

                tracking-wide

                text-slate-500
              "
            >
              Login As
            </h3>

            {LOGIN_ROLES.map((role) => {

              const Icon = role.icon

              return (

                <Link
                  key={role.id}
                  href={role.href}

                  onClick={() => onOpenChange(false)}

                  className="
                    flex
                    items-center
                    gap-3

                    rounded-xl

                    px-4
                    py-3

                    text-sm
                    font-medium

                    text-slate-700

                    transition-all

                    hover:bg-orange-50
                    hover:text-orange-600
                  "
                >

                  <Icon className="h-5 w-5" />

                  {role.title}

                </Link>

              )

            })}

          </div>

        )}

        {user && (

          <div className="space-y-3">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-sm font-semibold text-slate-900">
                {user.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {user.email}
              </p>

              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-orange-600">
                {user.role}
              </p>

            </div>

            <Button
              asChild
              className="w-full"
            >
              <Link
                href="/dashboard"
                onClick={() => onOpenChange(false)}
              >
                Dashboard
              </Link>
            </Button>

          </div>

        )}

      </div>

      {/* =======================================================
          Contact Buttons
      ======================================================== */}

      <div
        className="
          border-t
          border-slate-200

          space-y-3

          p-5
        "
      >

        <Button
          asChild
          variant="outline"
          className="w-full justify-start"
        >
          <a href="tel:+919999999999">

            <Phone className="mr-2 h-4 w-4" />

            Call Support

          </a>
        </Button>

        <Button
          asChild
          className="w-full justify-start bg-green-600 hover:bg-green-700"
        >
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
          >

            <MessageCircle className="mr-2 h-4 w-4" />

            WhatsApp Support

          </a>
        </Button>

      </div>

    </div>

  )

}