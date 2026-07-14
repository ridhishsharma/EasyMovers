"use client"

import {
Building2,
Briefcase,
Globe2,
ShieldCheck,
Truck,
Users,
} from "lucide-react"

const corporateFeatures = [
{
icon: Building2,
title: "Corporate Office Relocation",
description:
"End-to-end enterprise office shifting with workstation setup, server movement, and infrastructure relocation.",
},
{
icon: Users,
title: "Employee Relocation",
description:
"Smooth employee transfer solutions with household movement and onboarding coordination.",
},
{
icon: ShieldCheck,
title: "Secure Asset Handling",
description:
"Safe transportation for IT assets, confidential files, workstations, and sensitive office equipment.",
},
{
icon: Truck,
title: "Dedicated Logistics Support",
description:
"Priority vehicle allocation and dedicated move managers for enterprise clients.",
},
{
icon: Globe2,
title: "Multi-City Operations",
description:
"Centralized relocation management for offices operating across multiple cities.",
},
{
icon: Briefcase,
title: "Custom Enterprise Plans",
description:
"Flexible relocation contracts designed for startups, corporates, and enterprise organizations.",
},
]

export function CorporateSection() {

return (

<section
  id="corporate"
  className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 py-28"
>

  {/* BACKGROUND EFFECT */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.08),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* TOP SECTION */}
    <div className="grid items-center gap-16 lg:grid-cols-2">

      {/* LEFT CONTENT */}
      <div>

        <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 text-sm font-medium text-orange-300 backdrop-blur-md">

          Enterprise Relocation Solutions

        </span>

        <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">

          Corporate Moving
          <span className="block text-orange-400">
            Simplified With AI Logistics
          </span>

        </h2>

        <p className="mt-6 text-lg leading-relaxed text-slate-300">

          EasyMovers provides enterprise-grade relocation management
          for corporates, startups, IT firms, warehouses, and
          multi-city organizations with dedicated logistics support,
          verified vendors, and centralized move coordination.

        </p>

        {/* STATS */}
        <div className="mt-10 grid grid-cols-2 gap-6">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

            <h3 className="text-4xl font-bold text-orange-400">
              500+
            </h3>

            <p className="mt-2 text-slate-300">
              Corporate Clients
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

            <h3 className="text-4xl font-bold text-orange-400">
              99%
            </h3>

            <p className="mt-2 text-slate-300">
              On-Time Delivery
            </p>

          </div>

        </div>

      </div>

      {/* RIGHT FEATURE GRID */}
      <div className="grid gap-6 sm:grid-cols-2">

        {corporateFeatures.map((feature, index) => {

          const Icon = feature.icon

          return (

            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-orange-400/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10"
            >

              {/* HOVER EFFECT */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_40%)]" />

              {/* ICON */}
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400">

                <Icon className="h-7 w-7" />

              </div>

              {/* CONTENT */}
              <div className="relative">

                <h3 className="text-xl font-semibold text-white">

                  {feature.title}

                </h3>

                <p className="mt-3 leading-relaxed text-slate-300">

                  {feature.description}

                </p>

              </div>

            </div>

          )
        })}

      </div>

    </div>

    {/* BOTTOM CTA */}
    <div className="mt-24 overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 p-10 backdrop-blur-xl">

      <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">

        <div>

          <h3 className="text-3xl font-bold text-white">

            Need Enterprise Relocation Assistance?

          </h3>

          <p className="mt-3 max-w-2xl text-slate-300">

            Our enterprise relocation experts help organizations
            manage office moves, employee transfers, and logistics
            operations with centralized coordination and AI-powered support.

          </p>

        </div>

        <button className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600">

          Contact Enterprise Team

        </button>

      </div>

    </div>

  </div>

</section>

)
}
