"use client"

import Link from "next/link"
import Image from "next/image"

import {
Mail,
MapPin,
Phone,
} from "lucide-react"

export function Footer() {

return (

<footer className="relative overflow-hidden border-t border-white/10 bg-slate-950">

  {/* BACKGROUND */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.08),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" />

    {/* TOP GRID */}
    <div className="grid gap-12 lg:grid-cols-5">

      {/* BRAND */}
      <div className="lg:col-span-2">

        <div className="flex items-center gap-4">

          <div className="relative h-16 w-16 overflow-hidden rounded-2xl">

            <Image
              src="/logo.png"
              alt="Easy Movers"
              fill
              className="object-contain"
            />

          </div>

          <div>

            <h2 className="text-3xl font-bold text-white">

              EASY
              <span className="ml-2 text-orange-400">
                MOVERS
              </span>

            </h2>

            <p className="mt-1 text-sm tracking-[0.25em] text-slate-400">

              MOVE ANYWHERE WITH CONFIDENCE

            </p>

          </div>

        </div>

        <p className="mt-8 max-w-md leading-relaxed text-slate-300">

          India’s premium relocation-tech platform offering
          verified packers & movers, AI-powered quotations,
          live tracking, and enterprise relocation solutions.

        </p>

        {/* CONTACT */}
        <div className="mt-8 space-y-4">

          <div className="flex items-center gap-3 text-slate-300">

            <Phone className="h-5 w-5 text-orange-400" />

            +91 8959591603

          </div>

          <div className="flex items-center gap-3 text-slate-300">

            <Mail className="h-5 w-5 text-orange-400" />

            support@easymovers.in

          </div>

          <div className="flex items-center gap-3 text-slate-300">

            <MapPin className="h-5 w-5 text-orange-400" />

            Bhopal, Madhya Pradesh, India

          </div>

        </div>

        {/* SOCIAL */}

      {/* COMPANY */}
      <div>

        <h3 className="text-lg font-semibold text-white">

          Company

        </h3>

        <div className="mt-6 space-y-4">

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            About Us
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Careers
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Blog
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Partner With Us
          </Link>

        </div>

      </div>

      {/* SERVICES */}
      <div>

        <h3 className="text-lg font-semibold text-white">

          Services

        </h3>

        <div className="mt-6 space-y-4">

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Household Shifting
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Office Relocation
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Vehicle Transportation
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Corporate Relocation
          </Link>

        </div>

      </div>

      {/* SUPPORT */}
      <div>

        <h3 className="text-lg font-semibold text-white">

          Support

        </h3>

        <div className="mt-6 space-y-4">

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Contact Us
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            FAQ
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Privacy Policy
          </Link>

          <Link href="/" className="block text-slate-300 transition hover:text-orange-400">
            Terms & Conditions
          </Link>

        </div>

      </div>

    </div>

    {/* BOTTOM BAR */}
    <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 lg:flex-row">

      <p className="text-sm text-slate-400">

        © 2026 EasyMovers. All rights reserved.

      </p>

      <p className="text-sm text-slate-400">

        Powered By KRV TRAVTECK

      </p>

    </div>

  </div>

</footer>

)
}
