"use client"
import {
ShieldCheck,
Truck,
Clock3,
BadgeCheck,
MapPinned,
Headphones,
} from "lucide-react"

const features = [
{
icon: ShieldCheck,
title: "Verified Vendors",
description:
"Every relocation partner is KYC verified with document validation and performance monitoring.",
},
{
icon: Truck,
title: "Live Move Tracking",
description:
"Track your shipment in real-time from pickup to final delivery with live updates.",
},
{
icon: Clock3,
title: "On-Time Relocation",
description:
"AI-powered scheduling ensures faster, smoother, and reliable shifting timelines.",
},
{
icon: BadgeCheck,
title: "Damage Protection",
description:
"Optional transit insurance and secure packaging standards for maximum safety.",
},
{
icon: MapPinned,
title: "PAN India Coverage",
description:
"Serving 120+ cities with trusted relocation partners across India.",
},
{
icon: Headphones,
title: "Dedicated Move Support",
description:
"Personal move managers available throughout your relocation journey.",
},
]

export function TrustSection() {

return (

<section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-28">

  {/* BACKGROUND EFFECT */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.08),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* HEADING */}
    <div className="mx-auto max-w-3xl text-center">

      <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 text-sm font-medium text-orange-300 backdrop-blur-md">

        Why Easy Movers

      </span>

      <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">

        India’s Trusted
        <span className="block text-orange-400">
          Digital Relocation Platform
        </span>

      </h2>

      <p className="mt-6 text-lg leading-relaxed text-slate-300">

        EasyMovers combines AI-powered relocation technology,
        verified vendors, live tracking, transparent pricing,
        and premium customer support to deliver a seamless
        moving experience across India.

      </p>

    </div>

    {/* TRUST GRID */}
    <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

      {features.map((feature, index) => {

        const Icon = feature.icon

        return (

          <div
            key={index}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-orange-400/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10"
          >

            {/* GLOW */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_40%)]" />

            {/* ICON */}
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400">

              <Icon className="h-8 w-8" />

            </div>

            {/* CONTENT */}
            <div className="relative">

              <h3 className="text-2xl font-semibold text-white">

                {feature.title}

              </h3>

              <p className="mt-4 leading-relaxed text-slate-300">

                {feature.description}

              </p>

            </div>

          </div>

        )
      })}

    </div>

    {/* BOTTOM STATS */}
    <div className="mt-24 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl md:grid-cols-4">

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

</section>

)
}
