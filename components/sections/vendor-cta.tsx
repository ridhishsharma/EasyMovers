"use client"

import {
ArrowRight,
Building2,
ShieldCheck,
Truck,
Users,
} from "lucide-react"

export function VendorCTASection() {

return (

<section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 py-28">

  {/* BACKGROUND GLOW */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.10),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* MAIN CTA */}
    <div className="overflow-hidden rounded-[36px] border border-orange-400/20 bg-white/5 p-10 backdrop-blur-xl lg:p-16">

      <div className="grid items-center gap-12 lg:grid-cols-2">

        {/* LEFT CONTENT */}
        <div>

          <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 text-sm font-medium text-orange-300 backdrop-blur-md">

            India’s Premium Relocation Platform

          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">

            Ready To Move
            <span className="block text-orange-400">
              Anywhere With Confidence?
            </span>

          </h2>

          <p className="mt-6 text-lg leading-relaxed text-slate-300">

            Compare verified packers & movers,
            get AI-powered quotations, track your move live,
            and relocate securely with India’s fastest growing
            relocation-tech platform.

          </p>

          {/* FEATURE LIST */}
          <div className="mt-8 space-y-4">

            <div className="flex items-center gap-3 text-slate-300">

              <ShieldCheck className="h-5 w-5 text-orange-400" />

              Verified Vendors & KYC Checked Partners

            </div>

            <div className="flex items-center gap-3 text-slate-300">

              <Truck className="h-5 w-5 text-orange-400" />

              Live Tracking & Safe Transportation

            </div>

            <div className="flex items-center gap-3 text-slate-300">

              <Users className="h-5 w-5 text-orange-400" />

              15,000+ Successful Relocations

            </div>

          </div>

        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-col gap-6">

          {/* CUSTOMER CTA */}
          <button className="group flex items-center justify-between rounded-3xl border border-orange-400/20 bg-orange-500 px-8 py-6 text-left shadow-2xl shadow-orange-500/20 transition-all hover:bg-orange-600">

            <div>

              <h3 className="text-xl font-semibold text-white">

                Get Free Quotation

              </h3>

              <p className="mt-2 text-orange-100">

                Compare trusted movers instantly

              </p>

            </div>

            <ArrowRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" />

          </button>

          {/* CORPORATE CTA */}
          <button className="group flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-left backdrop-blur-xl transition-all hover:border-orange-400/20 hover:bg-white/10">

            <div>

              <h3 className="text-xl font-semibold text-white">

                Corporate Enquiry

              </h3>

              <p className="mt-2 text-slate-300">

                Enterprise relocation solutions

              </p>

            </div>

            <Building2 className="h-6 w-6 text-orange-400" />

          </button>

          {/* VENDOR CTA */}
          <button className="group flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-left backdrop-blur-xl transition-all hover:border-orange-400/20 hover:bg-white/10">

            <div>

              <h3 className="text-xl font-semibold text-white">

                Become A Vendor Partner

              </h3>

              <p className="mt-2 text-slate-300">

                Join India’s relocation network

              </p>

            </div>

            <Users className="h-6 w-6 text-orange-400" />

          </button>

        </div>

      </div>

      {/* BOTTOM METRICS */}
      <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">

        <div className="text-center">

          <h3 className="text-4xl font-bold text-orange-400">
            15K+
          </h3>

          <p className="mt-2 text-slate-300">
            Successful Moves
          </p>

        </div>

        <div className="text-center">

          <h3 className="text-4xl font-bold text-orange-400">
            120+
          </h3>

          <p className="mt-2 text-slate-300">
            Cities Covered
          </p>

        </div>

        <div className="text-center">

          <h3 className="text-4xl font-bold text-orange-400">
            8500+
          </h3>

          <p className="mt-2 text-slate-300">
            Verified Vendors
          </p>

        </div>

        <div className="text-center">

          <h3 className="text-4xl font-bold text-orange-400">
            4.9★
          </h3>

          <p className="mt-2 text-slate-300">
            Customer Rating
          </p>

        </div>

      </div>

    </div>

  </div>

</section>

)
}
