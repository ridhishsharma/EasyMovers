"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

import {
Menu,
X,
Phone,
} from "lucide-react"

export function Navbar() {
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const [scrolled, setScrolled] = useState(false)

useEffect(() => {
const handleScroll = () => {
setScrolled(window.scrollY > 20)
}


window.addEventListener("scroll", handleScroll)

return () => {
  window.removeEventListener("scroll", handleScroll)
}

}, [])

const navLinks = [
{ name: "Home", href: "#" },
{ name: "Services", href: "#services" },
{ name: "Corporate", href: "#corporate" },
{name: "Partner With Us", href: "/partner"},
{ name: "Track My Move", href: "/track" },
{ name: "Testimonials", href: "#testimonials" },
]

return (
<header
className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-slate-950/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
> <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">

    {/* LOGO */}
    <Link href="/" className="flex items-center gap-3">

      <Image
        src="/logo.png"
        alt="Easy Movers"
        width={44}
        height={44}
        priority
        className="h-9 w-9 object-contain sm:h-11 sm:w-11"
      />

      <div>
        <h1 className="text-base font-bold tracking-wide text-white sm:text-lg">
          EASY
          <span className="ml-1 text-orange-400">
            MOVERS
          </span>
        </h1>

        <p className="text-[9px] tracking-[0.25em] text-slate-400">
          MOVE WITH CONFIDENCE
        </p>
      </div>

    </Link>

    {/* DESKTOP MENU */}
    <nav className="hidden items-center gap-8 lg:flex">
      {navLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          className="text-sm font-medium text-slate-200 transition hover:text-orange-400"
        >
          {link.name}
        </a>
      ))}
    </nav>

    {/* DESKTOP ACTIONS */}
    <div className="hidden items-center gap-3 lg:flex">

      <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-orange-400/20 hover:text-orange-400">
        Customer Login
      </button>

      <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-orange-400/20 hover:text-orange-400">
        Corporate Login
      </button>

      <button className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
        Sign Up
      </button>

    </div>

    {/* MOBILE ACTIONS */}
    <div className="flex items-center gap-3 lg:hidden">

      <a
        href="tel:+918959591603"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white"
      >
        <Phone className="h-5 w-5" />
      </a>

      <button
        onClick={() => setMobileMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

    </div>

  </div>

  {/* MOBILE MENU */}
  {mobileMenuOpen && (
    <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-2xl lg:hidden">

      {/* MOBILE TOP */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">

        <div className="flex items-center gap-3">

          <Image
            src="/logo.png"
            alt="Easy Movers"
            width={40}
            height={40}
            className="object-contain"
          />

          <div>
            <h2 className="text-base font-bold text-white">
              EASY
              <span className="ml-1 text-orange-400">
                MOVERS
              </span>
            </h2>

            <p className="text-[9px] tracking-[0.25em] text-slate-400">
              MOVE WITH CONFIDENCE
            </p>
          </div>

        </div>

        <button
          onClick={() => setMobileMenuOpen(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
        >
          <X className="h-5 w-5" />
        </button>

      </div>

      {/* MOBILE LINKS */}
      <div className="flex flex-col gap-6 px-6 py-10">

        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-medium text-white transition hover:text-orange-400"
          >
            {link.name}
          </a>
        ))}

        <div className="mt-6 flex flex-col gap-4">

          <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-white">
            Customer Login
          </button>

          <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-medium text-white">
            Corporate Login
          </button>

          <button className="w-full rounded-2xl bg-orange-500 px-6 py-4 text-base font-semibold text-white">
            Sign Up
          </button>

          <a
            href="https://wa.me/918959591603"
            className="w-full rounded-2xl bg-green-500 px-6 py-4 text-center text-base font-semibold text-white"
          >
            WhatsApp Support
          </a>

        </div>

      </div>

    </div>
  )}
</header>

)
}
