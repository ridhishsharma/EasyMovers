
"use client"

import Link from "next/link"
import Image from "next/image"

import {
  Home,
  LayoutDashboard,
  UserCircle
} from "lucide-react"

interface NavbarProps {

  referenceId: string

}

export default function Navbar({

  referenceId

}: NavbarProps) {

  return (

    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}

        <div className="flex items-center gap-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <Image
              src="/logo.png"
              alt="Easy Movers"
              width={48}
              height={48}
              priority
            />

            <div>

              <h1 className="text-xl font-bold text-slate-800">

                Easy Movers

              </h1>

              <p className="text-xs text-slate-500">

                Move Anywhere With Confidence

              </p>

            </div>

          </Link>

        </div>

        {/* Navigation */}

        <nav className="hidden md:flex items-center gap-6">

          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-slate-700 hover:bg-slate-100"
          >

            <Home size={18} />

            Home

          </Link>

          <button
            disabled
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed"
          >

            <LayoutDashboard size={18} />

            Dashboard

          </button>

        </nav>

        {/* Right Side */}

        <div className="flex items-center gap-5">

          <div className="hidden lg:block text-right">

            <p className="text-xs uppercase tracking-wide text-slate-500">

              Reference ID

            </p>

            <p className="font-bold text-blue-700">

              {referenceId}

            </p>

          </div>

          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-100">

            <UserCircle
              size={22}
              className="text-slate-600"
            />

            <span className="hidden md:block text-sm font-medium">

              Customer Portal

            </span>

          </button>

        </div>

      </div>

    </header>

  )

}
 