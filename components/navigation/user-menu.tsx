"use client"

/* ============================================================
   Easy Movers Enterprise Navigation System
   File: components/navigation/user-menu.tsx
   Version: 1.0
============================================================ */

import Link from "next/link"

import {
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  Bell,
  ShieldCheck,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import type {
  UserMenuProps,
  UserRole,
} from "./types"

/* ============================================================
   Role Dashboard Mapping
============================================================ */

const DASHBOARD_ROUTES: Record<UserRole, string> = {

  guest: "/",

  customer: "/customer/dashboard",

  vendor: "/vendor/dashboard",

  corporate: "/corporate/dashboard",

  franchise: "/franchise/dashboard",

  admin: "/admin/dashboard",

  "super-admin": "/super-admin",

}

/* ============================================================
   Component
============================================================ */

export default function UserMenu({
  user,
}: UserMenuProps) {

  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()

  const dashboardHref =
    DASHBOARD_ROUTES[user.role]

  return (

    <DropdownMenu>

      <DropdownMenuTrigger asChild>

        <Button
          variant="ghost"
          className="
            flex
            items-center
            gap-3

            rounded-xl

            border
            border-slate-200

            px-3
            py-2

            hover:bg-slate-50
          "
        >

          <Avatar className="h-9 w-9">

            <AvatarImage
              src={user.avatar}
              alt={user.name}
            />

            <AvatarFallback>
              {initials}
            </AvatarFallback>

          </Avatar>



          <div
            className="
              hidden
              flex-col
              items-start
              lg:flex
            "
          >

            <span
              className="
                text-sm
                font-semibold
                text-slate-900
              "
            >
              {user.name}
            </span>

            <span
              className="
                text-xs
                text-slate-500
              "
            >
              {user.email}
            </span>

          </div>

          <ChevronDown
            className="
              h-4
              w-4
              text-slate-400
            "
          />

        </Button>

      </DropdownMenuTrigger>

      {/* =======================================================
          Dropdown Content
      ======================================================== */}

      <DropdownMenuContent
        align="end"
        className="
          w-72
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-2
          shadow-2xl
        "
      >

        {/* User Information */}

        <DropdownMenuLabel
          className="
            rounded-xl
            bg-slate-50
            px-3
            py-3
          "
        >

          <div className="flex items-center gap-3">

            <Avatar className="h-12 w-12">

              <AvatarImage
                src={user.avatar}
                alt={user.name}
              />

              <AvatarFallback>
                {initials}
              </AvatarFallback>

            </Avatar>

            <div className="flex flex-col">

              <span
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                {user.name}
              </span>

              <span
                className="
                  text-xs
                  text-slate-500
                "
              >
                {user.email}
              </span>

              <span
                className="
                  mt-1
                  inline-flex
                  w-fit
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
                {user.role}
              </span>

            </div>

          </div>

        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>

          {/* =======================================================
              Dashboard
          ======================================================== */}

          <DropdownMenuItem asChild>

            <Link
              href={dashboardHref}
              className="
                flex
                cursor-pointer
                items-center
                gap-3

                rounded-xl

                px-3
                py-3

                transition-all

                hover:bg-orange-50
                hover:text-orange-600
              "
            >

              <LayoutDashboard className="h-4 w-4" />

              <span>Dashboard</span>

            </Link>

          </DropdownMenuItem>

          {/* =======================================================
              My Profile
          ======================================================== */}

          <DropdownMenuItem asChild>

            <Link
              href="/profile"
              className="
                flex
                cursor-pointer
                items-center
                gap-3

                rounded-xl

                px-3
                py-3

                transition-all

                hover:bg-orange-50
                hover:text-orange-600
              "
            >

              <User className="h-4 w-4" />

              <span>My Profile</span>

            </Link>

          </DropdownMenuItem>

          {/* =======================================================
              Notifications
          ======================================================== */}

          <DropdownMenuItem asChild>

            <Link
              href="/notifications"
              className="
                flex
                cursor-pointer
                items-center
                gap-3

                rounded-xl

                px-3
                py-3

                transition-all

                hover:bg-orange-50
                hover:text-orange-600
              "
            >

              <Bell className="h-4 w-4" />

              <span>Notifications</span>

            </Link>

          </DropdownMenuItem>

          {/* =======================================================
              Settings
          ======================================================== */}

          <DropdownMenuItem asChild>

            <Link
              href="/settings"
              className="
                flex
                cursor-pointer
                items-center
                gap-3

                rounded-xl

                px-3
                py-3

                transition-all

                hover:bg-orange-50
                hover:text-orange-600
              "
            >

              <Settings className="h-4 w-4" />

              <span>Settings</span>

            </Link>

          </DropdownMenuItem>

          {/* =======================================================
              Security
          ======================================================== */}

          <DropdownMenuItem asChild>

            <Link
              href="/security"
              className="
                flex
                cursor-pointer
                items-center
                gap-3

                rounded-xl

                px-3
                py-3

                transition-all

                hover:bg-orange-50
                hover:text-orange-600
              "
            >

              <ShieldCheck className="h-4 w-4" />

              <span>Security & Privacy</span>

            </Link>

          </DropdownMenuItem>

        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* =======================================================
            Logout
        ======================================================== */}

        <DropdownMenuItem
          onClick={() => {
            // TODO:
            // Replace with authentication logout
            // Example:
            // await signOut()
          }}
          className="
            flex
            cursor-pointer
            items-center
            gap-3

            rounded-xl

            px-3
            py-3

            text-red-600

            transition-all

            hover:bg-red-50
            hover:text-red-700
          "
        >

          <LogOut className="h-4 w-4" />

          <span>Logout</span>

        </DropdownMenuItem>

      </DropdownMenuContent>

    </DropdownMenu>

  )

}

/* ===========================================================
   Future Enhancements
===========================================================

1. Role-Based Menus
---------------------------------
Display menu items based on:
user.role

Customer:
- Bookings
- Payments
- Claims

Vendor:
- Jobs
- Earnings
- Reputation

Corporate:
- Employee Transfers
- Corporate Dashboard

Admin:
- Vendor Approval
- User Management
- Reports

---------------------------------

2. Avatar Upload

Integrate with profile service
to allow live avatar updates.

---------------------------------

3. Notification Counter

Show unread notification badge
next to Notifications.

---------------------------------

4. Theme Switch

Add:
- Light
- Dark
- System

---------------------------------

5. Multi-language

Future:
- English
- Hindi
- Regional Languages

---------------------------------

6. Activity Log

Recent Login
Recent Bookings
Recent Quotes

---------------------------------

7. Enterprise Audit Trail

Available for:
Corporate
Admin
Super Admin

=========================================================== */