"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: enterprise-navbar.tsx
   Version: 1.0
============================================================ */

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import { motion } from "framer-motion"

import {
  Menu,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from "@/components/ui/navigation-menu"

import { Button } from "@/components/ui/button"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

import MegaMenu from "./mega-menu"
import UserMenu from "./user-menu"
import MobileDrawer from "./mobile-drawer"
import NotificationMenu from "./notification-menu"

import {
  PRIMARY_NAVIGATION,
  HEADER_STATS,
} from "./navigation-config"

import type {
  EnterpriseNavbarProps,
} from "./types"

/* ============================================================
   Component
============================================================ */

export default function EnterpriseNavbar({
  user,
  authenticated = false,
}: EnterpriseNavbarProps) {

  const [scrolled, setScrolled] = useState(false)

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }

  }, [])

  return (

    <header
      className={`
        fixed
        inset-x-0
        top-0
        z-50
        transition-all
        duration-300

        ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-lg border-b"
            : "bg-white/60 backdrop-blur-md"
        }
      `}
    >

      {/* ===========================================================
          Top Enterprise Statistics Ribbon
      ============================================================ */}

      <div
        className="
          hidden
          lg:flex
          items-center
          justify-center
          border-b
          border-slate-200/60
          bg-gradient-to-r
          from-slate-900
          via-slate-800
          to-slate-900
          text-white
          h-9
        "
      >
        <div className="container mx-auto flex items-center justify-center gap-10 px-6">

          {HEADER_STATS.map((stat) => (

            <motion.div
              key={stat.id}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="font-bold text-orange-400">
                {stat.value}
              </span>

              <span className="text-slate-300">
                {stat.label}
              </span>
            </motion.div>

          ))}

        </div>
      </div>

      {/* ===========================================================
          Main Navigation Bar
      ============================================================ */}

      <div className="container mx-auto flex h-20 items-center justify-between px-6">

        {/* ==========================
            Brand / Logo
        =========================== */}

        <Link
          href="/"
          className="flex items-center gap-4"
        >

          <div
            className="
              relative
              h-12
              w-12
              overflow-hidden
              rounded-xl
              bg-white
              shadow-md
            "
          >
            <Image
              src="/logo.png"
              alt="Easy Movers"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <div className="hidden sm:block">

            <h1
              className="
                text-lg
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              Easy Movers
            </h1>

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              India's Intelligent Relocation Platform
            </p>

          </div>

        </Link>

        {/* ==========================
            Desktop Navigation
        =========================== */}

        <NavigationMenu className="hidden xl:flex">

          <NavigationMenuList className="gap-1">

            {PRIMARY_NAVIGATION.map((navItem) => {

              // ------------------------------
              // Mega Menu Items
              // ------------------------------

              if (navItem.megaMenu) {

                return (
                  <MegaMenu
                    key={navItem.id}
                    item={navItem}
                  />
                )
              }

              // ------------------------------
              // Standard Navigation Links
              // ------------------------------

              return (

                <motion.div
                  key={navItem.id}
                  whileHover={{ y: -2 }}
                  transition={{
                    duration: 0.15,
                  }}
                >

                  <NavigationMenuItem>

                    <Link
                      href={navItem.href ?? "#"}
                      className="
                        relative
                        flex
                        items-center
                        gap-2
                        rounded-lg
                        px-4
                        py-2

                        text-sm
                        font-medium
                        text-slate-700

                        transition-all
                        duration-300

                        hover:text-orange-500
                        hover:bg-orange-50

                        group
                      "
                    >

                      {navItem.icon && (

                        <navItem.icon
                          size={17}
                          className="
                            transition-colors
                            duration-300

                            group-hover:text-orange-500
                          "
                        />

                      )}

                      <span>

                        {navItem.title}

                      </span>

                      {/* Animated underline */}

                      <span
                        className="
                          absolute
                          left-4
                          right-4
                          bottom-0

                          h-[2px]

                          scale-x-0

                          bg-orange-500

                          transition-transform
                          duration-300

                          group-hover:scale-x-100
                        "
                      />

                    </Link>

                  </NavigationMenuItem>

                </motion.div>

              )

            })}

          </NavigationMenuList>

        </NavigationMenu>

        {/* ==========================
            Right Side Actions
        =========================== */}

        <div className="flex items-center gap-3">

          {/* ==========================
              Enterprise Search
          =========================== */}

          <Button
            variant="ghost"
            size="icon"
            className="
              hidden
              lg:flex
              rounded-xl
              text-slate-600

              hover:bg-orange-50
              hover:text-orange-500
            "
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* ==========================
              Notifications
          =========================== */}

          {authenticated && (

            <NotificationMenu
              notifications={[]}
            />

          )}

          {/* ==========================
              Authentication
          =========================== */}

          {authenticated ? (

            <UserMenu
              user={user!}
            />

          ) : (

            <Button
              variant="ghost"
              className="
                hidden
                lg:flex
                items-center
                gap-2

                rounded-xl

                px-4

                text-sm
                font-medium

                text-slate-700

                hover:bg-slate-100
              "
            >

              Login

              <ChevronDown
                className="h-4 w-4"
              />

            </Button>

          )}

          {/* ==========================
              Primary CTA
          =========================== */}

          <motion.div
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >

            <Button
              asChild
              size="lg"
              className="
                hidden
                lg:flex

                rounded-xl

                bg-gradient-to-r

                from-orange-500
                via-orange-600
                to-orange-500

                px-6

                text-sm
                font-semibold

                shadow-lg

                hover:shadow-xl
                hover:from-orange-600
                hover:to-orange-500
              "
            >

              <Link href="/booking">

                Get Instant Quote

              </Link>

            </Button>

          </motion.div>

          {/* ==========================
              Mobile Menu Trigger
          =========================== */}

          <Sheet
            open={mobileOpen}
            onOpenChange={setMobileOpen}
          >

            <SheetTrigger asChild>

              <Button
                variant="ghost"
                size="icon"
                className="
                  xl:hidden

                  rounded-xl

                  hover:bg-orange-50
                  hover:text-orange-500
                "
              >
                <Menu className="h-6 w-6" />
              </Button>

            </SheetTrigger>

            <SheetContent
              side="right"
              className="
                w-[340px]
                border-l
                border-slate-200
                bg-white
                p-0
              "
            >

              <MobileDrawer
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                user={user}
              />

            </SheetContent>

          </Sheet>

        </div>

      </div>

      {/* ===========================================================
          Bottom Navigation Border
      ============================================================ */}

      <div
        className="
          h-px
          w-full

          bg-gradient-to-r

          from-transparent
          via-slate-200
          to-transparent
        "
      />

    </header>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

1. Active Route Highlighting

const pathname = usePathname()

Highlight current navigation item

--------------------------------------------

2. Enterprise Search

<SearchCommand />

Powered by

Knowledge Graph & Memory Engine

--------------------------------------------

3. Notification Service

Unread counter

Corporate Alerts

Vendor Alerts

Customer Updates

--------------------------------------------

4. AI Assistant

Future

Floating AI Assistant

inside Navbar

--------------------------------------------

5. Theme Toggle

Dark Mode

Light Mode

System Mode

--------------------------------------------

6. Language Selector

English

Hindi

Future Regional Languages

--------------------------------------------

7. Region Selector

India

UAE

Singapore

Future International Expansion

--------------------------------------------

8. User Avatar

Customer

Vendor

Corporate

Admin

Profile Dropdown

--------------------------------------------

9. Role Based Navigation

Only display

Corporate Menu

if

user.role === "corporate"

Vendor Dashboard

if

user.role === "vendor"

Admin Menu

if

user.role === "admin"

--------------------------------------------

10. Analytics

Track

Navigation Click

Search

CTA Click

Booking Started

Login

Partner Registration

Enterprise Demo

--------------------------------------------

11. Performance

React.memo()

Lazy Mega Menus

Dynamic Imports

Image Optimization

--------------------------------------------

12. Accessibility

Keyboard Navigation

ARIA Labels

Focus Trapping

Screen Reader Support

=========================================================== */