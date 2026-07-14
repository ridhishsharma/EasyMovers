"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Cities", href: "#cities" },
    { name: "Corporate", href: "#corporate" },
    { name: "Partner With Us", href: "#partner-with-us" },
    { name: "About Us", href: "#about" },
    { name: "Contact", href: "#contact" },
    { name: "FAQ", href: "#faq" },
  ]

  return (
   <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* DESKTOP NAVBAR */}
<div className="flex justify-between items-center h-24">


          {/* LOGO */}
          {/*<div className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.png"
              alt="EasyMovers"
              width={48}
              height={48}
              className="object-contain"
              priority
            /> */}

            <div className="leading-tight">
              <h1 className="text-xl font-bold text-primary">
                EasyMovers
              </h1>

              <p className="text-xs text-muted-foreground">
                Smart Relocation Platform
              </p>
            </div>
          </div>

          {/* CENTER MENU */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-700 hover:text-orange-500"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* RIGHT BUTTONS */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>

            <Button size="sm">
              Register
            </Button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isOpen ? "max-h-screen pb-4" : "max-h-0"
          )}
      >
          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}

            <div className="flex flex-col gap-2 pt-3">
              <Button variant="outline">
                Login
              </Button>
         </div>
       </div>

      </div>
    </nav>
  )
}