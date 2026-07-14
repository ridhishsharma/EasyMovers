"use client"

import {
Building2,
Globe,
Home,
PackageCheck,
Plane,
ShieldCheck,
Truck,
Warehouse,
} from "lucide-react"

const services = [
{
icon: Home,
title: "Household Relocation",
description:
"Safe and stress-free home shifting solutions with verified packers and movers.",
},
{
icon: Building2,
title: "Office Relocation",
description:
"Corporate office moving with workstation setup, server handling, and minimal downtime.",
},
{
icon: Truck,
title: "Vehicle Transportation",
description:
"Secure bike and car transportation services with GPS-enabled tracking.",
},
{
icon: PackageCheck,
title: "Premium Packing",
description:
"High-quality packing materials and trained staff for fragile item safety.",
},
{
icon: Warehouse,
title: "Warehouse Shifting",
description:
"Industrial and warehouse relocation solutions with heavy equipment support.",
},
{
icon: Globe,
title: "Intercity Relocation",
description:
"Reliable long-distance relocation services across India’s major cities.",
},
{
icon: Plane,
title: "International Moving",
description:
"Global relocation assistance including customs handling and freight coordination.",
},
{
icon: ShieldCheck,
title: "Transit Insurance",
description:
"Optional damage protection and transit insurance for valuable belongings.",
},
]

export function ServicesSection() {

return (

<section
  id="services"
  className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 py-28"
>

  {/* BACKGROUND EFFECT */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.08),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* HEADING */}
    <div className="mx-auto max-w-3xl text-center">

      <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 text-sm font-medium text-orange-300 backdrop-blur-md">

        Premium Relocation Services

      </span>

      <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">

        Smart Relocation Solutions
        <span className="block text-orange-400">
          For Every Moving Need
        </span>

      </h2>

      <p className="mt-6 text-lg leading-relaxed text-slate-300">

        From household shifting to enterprise relocation,
        EasyMovers provides technology-driven logistics
        solutions with verified vendors, live tracking,
        and transparent pricing.

      </p>

    </div>

    {/* SERVICES GRID */}
    <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

      {services.map((service, index) => {

        const Icon = service.icon

        return (

          <div
            key={index}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-orange-400/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10"
          >

            {/* HOVER GLOW */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.14),transparent_40%)]" />

            {/* ICON */}
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400">

              <Icon className="h-8 w-8" />

            </div>

            {/* CONTENT */}
            <div className="relative">

              <h3 className="text-2xl font-semibold text-white">

                {service.title}

              </h3>

              <p className="mt-4 leading-relaxed text-slate-300">

                {service.description}

              </p>

            </div>

          </div>

        )
      })}

    </div>

    {/* CTA STRIP */}
    <div className="mt-24 overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 p-10 backdrop-blur-xl">

      <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">

        <div>

          <h3 className="text-3xl font-bold text-white">

            Need Custom Relocation Solutions?

          </h3>

          <p className="mt-3 max-w-2xl text-slate-300">

            Our relocation experts help individuals,
            enterprises, and corporates plan stress-free,
            secure, and cost-effective moves anywhere in India.

          </p>

        </div>

        <button className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600">

          Talk To Relocation Expert

        </button>

      </div>

    </div>

  </div>

</section>

)
}
