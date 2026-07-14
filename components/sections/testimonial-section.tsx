"use client"

import {
Quote,
Star,
MapPin,
Truck,
} from "lucide-react"

const testimonials = [
{
name: "Rahul Sharma",
role: "Software Engineer",
route: "Delhi → Bangalore",
moveType: "2BHK Relocation",
rating: 5,
review:
"The entire relocation process was smooth and professionally managed. Live tracking and verified vendors gave us complete peace of mind.",
},
{
name: "Priya Mehta",
role: "HR Manager",
route: "Mumbai → Pune",
moveType: "Corporate Office Move",
rating: 5,
review:
"EasyMovers handled our office relocation with zero downtime. Their enterprise coordination and support team were exceptional.",
},
{
name: "Aman Verma",
role: "Business Owner",
route: "Hyderabad → Chennai",
moveType: "Vehicle Transportation",
rating: 5,
review:
"My SUV was transported safely with real-time updates throughout the journey. Highly recommended for secure vehicle relocation.",
},
]

export function TestimonialSection() {

return (

<section
  id="testimonials"
  className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 py-28"
>

  {/* BACKGROUND EFFECT */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.08),transparent_35%)]" />

  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* HEADING */}
    <div className="mx-auto max-w-3xl text-center">

      <span className="inline-flex items-center rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2 text-sm font-medium text-orange-300 backdrop-blur-md">

        Customer Experiences

      </span>

      <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">

        Trusted By Thousands
        <span className="block text-orange-400">
          Across India
        </span>

      </h2>

      <p className="mt-6 text-lg leading-relaxed text-slate-300">

        Real customer experiences from household shifting,
        office relocation, and vehicle transportation
        services managed by verified EasyMovers partners.

      </p>

    </div>

    {/* TESTIMONIAL GRID */}
    <div className="mt-20 grid gap-8 lg:grid-cols-3">

      {testimonials.map((testimonial, index) => (

        <div
          key={index}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-orange-400/30 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/10"
        >

          {/* GLOW */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.14),transparent_40%)]" />

          {/* QUOTE ICON */}
          <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400">

            <Quote className="h-7 w-7" />

          </div>

          {/* REVIEW */}
          <div className="relative">

            <p className="leading-relaxed text-slate-300">

              "{testimonial.review}"

            </p>

          </div>

          {/* STARS */}
          <div className="relative mt-6 flex items-center gap-1">

            {[...Array(testimonial.rating)].map((_, i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-orange-400 text-orange-400"
              />
            ))}

          </div>

          {/* ROUTE */}
          <div className="relative mt-6 flex items-center gap-2 text-sm text-orange-300">

            <MapPin className="h-4 w-4" />

            {testimonial.route}

          </div>

          {/* MOVE TYPE */}
          <div className="relative mt-2 flex items-center gap-2 text-sm text-slate-400">

            <Truck className="h-4 w-4" />

            {testimonial.moveType}

          </div>

          {/* USER */}
          <div className="relative mt-8 border-t border-white/10 pt-6">

            <h3 className="text-lg font-semibold text-white">

              {testimonial.name}

            </h3>

            <p className="mt-1 text-sm text-slate-400">

              {testimonial.role}

            </p>

          </div>

        </div>

      ))}

    </div>

    {/* BOTTOM TRUST STRIP */}
    <div className="mt-24 overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-500/10 p-10 backdrop-blur-xl">

      <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">

        <div>

          <h3 className="text-3xl font-bold text-white">

            Join Thousands Of Happy Customers

          </h3>

          <p className="mt-3 max-w-2xl text-slate-300">

            EasyMovers helps individuals, families,
            startups, and enterprises relocate safely
            with verified vendors, AI-powered quotations,
            and real-time move visibility.

          </p>

        </div>

        <button className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600">

          Start Your Move Today

        </button>

      </div>

    </div>

  </div>

</section>

)
}
