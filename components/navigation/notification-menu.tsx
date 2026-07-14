"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: components/navigation/notification-menu.tsx
   Version: 1.0
============================================================ */

import Link from "next/link"

import {
  Bell,
  CheckCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Badge } from "@/components/ui/badge"

import type {
  NotificationMenuProps,
  NotificationItem,
} from "./types"

/* ============================================================
   Component
============================================================ */

export default function NotificationMenu({
  notifications,
}: NotificationMenuProps) {

  const unreadCount =
    notifications.filter(
      (notification) => !notification.read
    ).length

  return (

    <DropdownMenu>

      <DropdownMenuTrigger asChild>

        <Button
          variant="ghost"
          size="icon"
          className="
            relative

            rounded-xl

            text-slate-600

            hover:bg-orange-50
            hover:text-orange-500
          "
        >

          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (

            <Badge
              className="
                absolute

                -right-1
                -top-1

                flex

                h-5
                min-w-[20px]

                items-center
                justify-center

                rounded-full

                bg-red-500

                px-1

                text-[10px]

                font-bold

                text-white
              "
            >

              {unreadCount > 99
                ? "99+"
                : unreadCount}

            </Badge>

          )}

        </Button>

      </DropdownMenuTrigger>

      {/* =======================================================
          Notification Dropdown
      ======================================================== */}

      <DropdownMenuContent
        align="end"
        className="
          w-[360px]

          rounded-2xl

          border

          bg-white

          shadow-2xl
        "
      >

        {/* =======================================================
            Header
        ======================================================== */}

        <div
          className="
            flex
            items-center
            justify-between

            px-4
            py-3
          "
        >

          <DropdownMenuLabel
            className="
              p-0

              text-base
              font-semibold

              text-slate-900
            "
          >
            Notifications
          </DropdownMenuLabel>

          {unreadCount > 0 && (

            <Button
              variant="ghost"
              size="sm"
              className="
                h-8

                rounded-lg

                text-xs

                text-orange-600

                hover:bg-orange-50
              "
            >

              <CheckCheck className="mr-2 h-4 w-4" />

              Mark all as read

            </Button>

          )}

        </div>

        <DropdownMenuSeparator />

        {/* =======================================================
            Empty State
        ======================================================== */}

        {notifications.length === 0 && (

          <div
            className="
              flex
              flex-col
              items-center
              justify-center

              px-6
              py-12

              text-center
            "
          >

            <Bell
              className="
                mb-4

                h-10
                w-10

                text-slate-300
              "
            />

            <h3
              className="
                text-sm
                font-semibold

                text-slate-700
              "
            >
              No Notifications
            </h3>

            <p
              className="
                mt-2

                text-xs

                leading-5

                text-slate-500
              "
            >
              You're all caught up.
              New relocation updates will appear here.
            </p>

          </div>

        )}

        {/* =======================================================
            Notification List
        ======================================================== */}

        {notifications.length > 0 && (

          <div
            className="
              max-h-[420px]

              overflow-y-auto
            "
          >

            {notifications.map(
              (notification: NotificationItem) => (

                <DropdownMenuItem
                  key={notification.id}
                  asChild
                >

                  <Link
                    href={
                      notification.href ??
                      "/notifications"
                    }
                    className={`
                      flex
                      cursor-pointer
                      items-start
                      gap-3

                      border-b

                      px-4
                      py-4

                      transition-all
                      duration-300

                      hover:bg-orange-50

                      ${
                        notification.read
                          ? "bg-white"
                          : "bg-orange-50/40"
                      }
                    `}
                  >

                    {/* Read Indicator */}

                    <div
                      className={`
                        mt-2

                        h-2.5
                        w-2.5

                        rounded-full

                        ${
                          notification.read
                            ? "bg-slate-300"
                            : "bg-orange-500"
                        }
                      `}
                    />

                    {/* Notification Body */}

                    <div className="flex-1">

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >

                        <h4
                          className={`
                            text-sm

                            ${
                              notification.read
                                ? "font-medium text-slate-700"
                                : "font-semibold text-slate-900"
                            }
                          `}
                        >
                          {notification.title}
                        </h4>

                        <span
                          className="
                            shrink-0

                            text-[11px]

                            text-slate-400
                          "
                        >
                          {new Date(
                            notification.createdAt
                          ).toLocaleDateString()}
                        </span>

                      </div>

                      <p
                        className="
                          mt-1

                          line-clamp-2

                          text-xs

                          leading-5

                          text-slate-500
                        "
                      >
                        {notification.description}
                      </p>

                    </div>

                  </Link>

                </DropdownMenuItem>

              )

            )}

          </div>

        )}

        {/* =======================================================
            Footer
        ======================================================== */}

        <DropdownMenuSeparator />

        <div className="p-3">

          <Button
            asChild
            variant="outline"
            className="
              w-full

              rounded-xl

              border-slate-200

              text-sm
              font-medium

              hover:bg-orange-50
              hover:text-orange-600
              hover:border-orange-200
            "
          >

            <Link href="/notifications">

              View All Notifications

            </Link>

          </Button>

        </div>

      </DropdownMenuContent>

    </DropdownMenu>

  )

}

/* ===========================================================
   Future Enterprise Enhancements
===========================================================

1. Real-Time Notifications
---------------------------------

Technology:

- WebSockets
- Socket.io
- Supabase Realtime

Events:

Customer:
- Booking Created
- Driver Assigned
- Move Started
- Move Completed
- Invoice Generated

Vendor:
- New Job
- Payment Released
- Rating Received

Corporate:
- Transfer Approved
- Relocation Completed

Admin:
- Vendor Approval Pending
- Escalation Raised

---------------------------------

2. Push Notifications
---------------------------------

Web Push API

Firebase Messaging

OneSignal

---------------------------------

3. Notification Categories
---------------------------------

booking

payment

vendor

corporate

support

admin

system

---------------------------------

4. Filters
---------------------------------

All

Unread

Bookings

Payments

System

---------------------------------

5. Infinite Scroll
---------------------------------

Load More Notifications

Pagination

Cursor Based Loading

---------------------------------

6. Notification Preferences
---------------------------------

Email

SMS

WhatsApp

Push

In-App

---------------------------------

7. Notification Analytics
---------------------------------

Read Rate

Click Rate

Response Time

User Engagement

---------------------------------

8. KGME Integration
---------------------------------

Future:

Notifications generated from

Knowledge Graph

Context Engine

Memory Engine

Example:

"Based on your relocation history,
Ahmedabad to Pune moves are
currently 12% cheaper."

=========================================================== */