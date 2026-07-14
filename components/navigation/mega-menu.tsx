"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: components/navigation/mega-menu.tsx
   Version: 1.0
============================================================ */

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import { Badge } from "@/components/ui/badge"

import type {
  MegaMenuProps,
  NavigationChild,
} from "./types"

/* ============================================================
   Animation Variants
============================================================ */

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.22,
      staggerChildren: 0.05,
    },
  },

  exit: {
    opacity: 0,
    y: 8,

    transition: {
      duration: 0.15,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    x: -10,
  },

  visible: {
    opacity: 1,
    x: 0,
  },
}

/* ============================================================
   Component
============================================================ */

export default function MegaMenu({
  item,
}: MegaMenuProps) {

  if (!item.children?.length) return null

  return (
    <NavigationMenuItem>

      <NavigationMenuTrigger
        className="
          bg-transparent
          text-slate-700
          font-medium
          hover:text-orange-500
          data-[state=open]:text-orange-500
          transition-colors
        "
      >
        {item.title}
      </NavigationMenuTrigger>

      <NavigationMenuContent>

        <AnimatePresence>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              w-[720px]
              grid
              grid-cols-2
              gap-3
              p-6
              bg-white
              rounded-2xl
              shadow-2xl
              border
            "
          >

            {item.children.map((child: NavigationChild) => {

              const Icon = child.icon

              return (

                <motion.div
                  key={child.id}
                  variants={itemVariants}
                >

                  <Link
                    href={child.disabled ? "#" : child.href}
                    aria-disabled={child.disabled}
                    className={`
                      group
                      relative
                      flex
                      gap-4
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      p-4
                      transition-all
                      duration-300

                      hover:border-orange-300
                      hover:shadow-lg
                      hover:-translate-y-1

                      ${child.disabled
                        ? "cursor-not-allowed opacity-70"
                        : ""
                      }
                    `}
                  >

                    {/* Icon */}

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-50
                        text-orange-500

                        transition-colors
                        group-hover:bg-orange-500
                        group-hover:text-white
                      "
                    >
                      <Icon size={22} />
                    </div>

                    {/* Content */}

                    <div className="flex-1">

                      <div className="flex items-center gap-2">

                        <h4
                          className="
                            text-sm
                            font-semibold
                            text-slate-900

                            transition-colors
                            group-hover:text-orange-600
                          "
                        >
                          {child.title}
                        </h4>

                        {child.badge && (

                          <Badge
                            variant="secondary"
                            className="
                              rounded-full
                              px-2
                              py-0.5
                              text-[10px]
                              font-medium
                              uppercase
                            "
                          >
                            {child.badge}
                          </Badge>

                        )}

                      </div>

                      <p
                        className="
                          mt-2
                          line-clamp-2
                          text-xs
                          leading-5
                          text-slate-500
                        "
                      >
                        {child.description}
                      </p>

                    </div>

                    {/* Right Arrow */}

                    {!child.disabled && (

                      <div
                        className="
                          flex
                          items-center
                          self-center
                          text-slate-300

                          transition-all
                          duration-300

                          group-hover:translate-x-1
                          group-hover:text-orange-500
                        "
                      >
                        <ChevronRight size={18} />
                      </div>

                    )}

                    {/* Disabled Overlay */}

                    {child.disabled && (

                      <div
                        className="
                          absolute
                          inset-0
                          rounded-xl
                          bg-white/40
                          backdrop-blur-[1px]
                        "
                      />

                    )}

                  </Link>

                </motion.div>

              )

            })}

          </motion.div>

        </AnimatePresence>

      </NavigationMenuContent>

    </NavigationMenuItem>

  )

}

/* ============================================================
   Future Enhancements
============================================================

1. Role Based Access
---------------------------------
Render menu items based on:

child.roles?.includes(currentUser.role)

2. Feature Flags
---------------------------------

if (
   child.featureFlag &&
   !child.featureFlag.enabled
)

return null

3. Analytics
---------------------------------

Capture menu click events

analytics.track("navigation_click",{
   menu:item.title,
   child:child.title
})

4. AI Search Integration
---------------------------------

Future integration with

Knowledge Graph & Memory Engine

5. Notification Counter
---------------------------------

Show unread counts beside
Corporate,
Vendor,
Support

6. Dynamic Badge Service
---------------------------------

Badges like:

NEW

BETA

COMING SOON

will later come from API.

============================================================ */